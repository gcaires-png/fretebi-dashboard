/**
 * Moita Rev1 — Proxy CORS para a API da Videl (Cloudflare Worker)
 * ---------------------------------------------------------------
 * Resolve o bloqueio de CORS: o painel (moita-rev1.html) chama este
 * Worker, que faz login na API da Videl no lado servidor (credenciais
 * ficam em segredos, nunca no navegador), guarda o token em memória e
 * repassa as requisições de dados com os headers CORS corretos.
 *
 * Segredos (configurar via `wrangler secret put`):
 *   VIDEL_EMAIL     — e-mail de acesso à plataforma Videl
 *   VIDEL_PASSWORD  — senha de acesso à plataforma Videl
 *   PROXY_KEY       — chave que o painel envia (header X-Moita-Key ou ?pk=).
 *                     IMPORTANTE: CORS só protege dentro do navegador; sem
 *                     esta chave, qualquer pessoa com a URL do Worker lê a
 *                     API inteira (clientes, motoristas, contas a pagar).
 *                     Se o segredo não estiver configurado, o proxy segue
 *                     aberto (compatível com o comportamento anterior).
 *
 * Variáveis (wrangler.toml [vars]):
 *   ALLOWED_ORIGINS — lista separada por vírgula das origens permitidas
 *                     (ex: "https://gcaires-png.github.io,http://localhost:8080")
 *
 * Rotas expostas (somente GET, somente leitura):
 *   /shipments  /quotes  /clients  /drivers  /vehicles  /documents
 *   /shipments/:id  /clients/:id  /vehicles/:id  /drivers/:id
 *   /health     — status do proxy (não chama a Videl)
 */

const VIDEL_BASE = 'https://www.videltel.com.br/api';

// rotas de leitura liberadas (prefixos)
const ALLOWED_PATHS = [
  'shipments', 'quotes', 'clients', 'drivers', 'vehicles', 'documents',
  // financeiro / contas a pagar (nomes candidatos — a API usa um destes)
  'payables', 'accounts-payable', 'bills', 'finance', 'expenses', 'contas-a-pagar',
];

// token em memória (persiste enquanto o isolate estiver quente)
let tokenCache = { value: null, exp: 0 };

function corsHeaders(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Moita-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

async function getToken(env) {
  const now = Date.now();
  if (tokenCache.value && tokenCache.exp > now + 30_000) return tokenCache.value;
  const r = await fetch(`${VIDEL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.VIDEL_EMAIL, password: env.VIDEL_PASSWORD }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`login Videl falhou: HTTP ${r.status}`);
  const j = await r.json();
  const tk = j.token || j.accessToken || (j.data && j.data.token);
  if (!tk) throw new Error('token não retornado pela Videl');
  // cache por ~50 min (JWT costuma durar 1h); ajuste se necessário
  tokenCache = { value: tk, exp: now + 50 * 60 * 1000 };
  return tk;
}

function pathAllowed(seg0) {
  return ALLOWED_PATHS.includes(seg0);
}

// Só letras, números, _ . e - em cada segmento (ids, slugs). Bloqueia '..'
// e caracteres codificados que a API upstream poderia decodificar como
// separador de path (ex.: /shipments/%2e%2e/users).
function segsValidos(segs) {
  return segs.every((s) => /^[A-Za-z0-9_.-]+$/.test(s) && !s.includes('..'));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const cors = corsHeaders(origin, allowed);

    // preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return json({ error: 'method_not_allowed' }, 405, cors);
    }

    // segmentos: primeiro é a "rota" (ex: shipments)
    const segs = url.pathname.split('/').filter(Boolean);
    const route = segs[0] || '';

    if (route === 'health') {
      return json({
        ok: true,
        service: 'moita-videl-proxy',
        cached_token: !!tokenCache.value,
        allowed_origins: allowed,
      }, 200, cors);
    }

    if (!pathAllowed(route)) {
      return json({ error: 'route_not_allowed', route }, 403, cors);
    }

    if (!segsValidos(segs)) {
      return json({ error: 'invalid_path' }, 400, cors);
    }

    // origem não permitida → bloqueia (defesa extra além do CORS do navegador)
    if (allowed.length && origin && !allowed.includes(origin)) {
      return json({ error: 'origin_not_allowed', origin }, 403, cors);
    }

    // autenticação do proxy (se PROXY_KEY estiver configurada como segredo)
    if (env.PROXY_KEY) {
      const chave = request.headers.get('X-Moita-Key') || url.searchParams.get('pk') || '';
      if (chave !== env.PROXY_KEY) {
        return json({ error: 'unauthorized' }, 401, cors);
      }
      url.searchParams.delete('pk'); // não repassa a chave para a Videl
    }

    try {
      // repassa path + querystring para a Videl
      const target = `${VIDEL_BASE}/${segs.join('/')}${url.search}`;
      let token = await getToken(env);
      let r = await fetchVidel(target, token);
      // token pode ser invalidado antes do TTL do cache (deploy, logout na
      // Videl): em 401/403, força novo login e tenta UMA vez mais
      if (r.status === 401 || r.status === 403) {
        tokenCache = { value: null, exp: 0 };
        token = await getToken(env);
        r = await fetchVidel(target, token);
      }
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch (e) {
      return json({ error: 'proxy_error', message: String(e && e.message || e) }, 502, cors);
    }
  },
};

function fetchVidel(target, token) {
  return fetch(target, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
