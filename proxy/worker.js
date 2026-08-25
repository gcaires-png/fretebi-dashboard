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
 *
 * Variáveis (wrangler.toml [vars]):
 *   ALLOWED_ORIGINS — lista separada por vírgula das origens permitidas
 *                     (ex: "https://gcaires-png.github.io,http://localhost:8080")
 *
 * Rotas Videl (somente GET, somente leitura):
 *   /shipments  /quotes  /clients  /drivers  /vehicles  /documents
 *   /shipments/:id  /clients/:id  /vehicles/:id  /drivers/:id
 *   /health     — status do proxy (não chama a Videl)
 *
 * Rotas de cotação (ver integracao/api/):
 *   GET  /qualp/rota?origem=&destino=&eixos=   — km + pedágio reais
 *   POST /cotacao                              — piso ANTT + preço + leilão
 *   POST /bsoft/cte-rascunho                   — rascunho de CT-e (nunca emite)
 *
 * Segredos adicionais:
 *   QUALP_TOKEN
 *   BSOFT_DOMINIO / BSOFT_USUARIO / BSOFT_SENHA
 *   BSOFT_HABILITADO — precisa valer "true" pra rota do Bsoft sair do modo
 *                      simulação (sem isso ela devolve o rascunho sem gravar)
 */

import { consultarRota } from '../integracao/api/lib/qualp.js';
import { cotar, avaliarPreco, tetoMotorista, estrategiaLeilao } from '../integracao/api/lib/cotacao.js';
import { montarRascunhoCTe, criarRascunhoCTe, autenticar } from '../integracao/api/lib/bsoft.js';

const VIDEL_BASE = 'https://www.videltel.com.br/api';

// rotas que aceitam POST (as da Videl seguem GET-only)
const ROTAS_POST = new Set(['cotacao', 'bsoft']);

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

    // segmentos: primeiro é a "rota" (ex: shipments)
    const segs = url.pathname.split('/').filter(Boolean);
    const route = segs[0] || '';

    if (request.method !== 'GET' && !(request.method === 'POST' && ROTAS_POST.has(route))) {
      return json({ error: 'method_not_allowed', method: request.method, route }, 405, cors);
    }

    if (route === 'health') {
      return json({
        ok: true,
        service: 'moita-videl-proxy',
        cached_token: !!tokenCache.value,
        allowed_origins: allowed,
        integracoes: {
          qualp: !!env.QUALP_TOKEN,
          bsoft_credenciais: !!(env.BSOFT_DOMINIO && env.BSOFT_USUARIO && env.BSOFT_SENHA),
          bsoft_gravacao: env.BSOFT_HABILITADO === 'true',
        },
      }, 200, cors);
    }

    // origem não permitida → bloqueia (defesa extra além do CORS do navegador)
    if (allowed.length && origin && !allowed.includes(origin)) {
      return json({ error: 'origin_not_allowed', origin }, 403, cors);
    }

    if (route === 'qualp') return await rotaQualp(url, env, cors);
    if (route === 'cotacao') return await rotaCotacao(request, env, cors);
    if (route === 'bsoft') return await rotaBsoft(request, env, segs, cors);

    if (!pathAllowed(route)) {
      return json({ error: 'route_not_allowed', route }, 403, cors);
    }

    try {
      const token = await getToken(env);
      // repassa path + querystring exatamente para a Videl
      const target = `${VIDEL_BASE}/${segs.join('/')}${url.search}`;
      const r = await fetch(target, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });
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

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/* ------------------------------------------------------------------ */
/* Rotas de cotação                                                    */
/* ------------------------------------------------------------------ */

/** GET /qualp/rota?origem=&destino=&eixos=3 */
async function rotaQualp(url, env, cors) {
  const origem = url.searchParams.get('origem');
  const destino = url.searchParams.get('destino');
  if (!origem || !destino) return json({ error: 'origem e destino sao obrigatorios' }, 400, cors);
  if (!env.QUALP_TOKEN) return json({ error: 'QUALP_TOKEN nao configurado no Worker' }, 503, cors);

  try {
    const r = await consultarRota({
      origem, destino,
      eixos: Number(url.searchParams.get('eixos')) || 3,
      paradas: url.searchParams.getAll('parada'),
      token: env.QUALP_TOKEN,
      base: env.QUALP_BASE,
    });
    const { bruto, ...limpo } = r;
    return json(url.searchParams.get('bruto') === '1' ? r : limpo, 200, cors);
  } catch (e) {
    return json({ error: 'qualp_error', message: e.message, corpo: e.corpo }, 502, cors);
  }
}

/**
 * POST /cotacao
 * Body: { origem, destino, valorNF, tipoVeiculo, entregas, margemLiquida,
 *         km?, pedagio?, custoMotorista?, precoOfertado?, icmsCheio? }
 * Sem km no body e com QUALP_TOKEN configurado, busca a rota no Qualp.
 */
async function rotaCotacao(request, env, cors) {
  let b;
  try { b = await request.json(); } catch { return json({ error: 'body json invalido' }, 400, cors); }

  try {
    let km = b.km, pedagio = b.pedagio, fonteDistancia = 'informado no body';

    if (!km && env.QUALP_TOKEN && b.origem && b.destino) {
      const r = await consultarRota({
        origem: b.origem, destino: b.destino, eixos: b.eixos || 3,
        token: env.QUALP_TOKEN, base: env.QUALP_BASE,
      });
      km = r.km;
      if (pedagio == null) pedagio = r.pedagio;
      fonteDistancia = 'Qualp';
    }
    if (!km) return json({ error: 'sem km: informe km no body ou configure QUALP_TOKEN' }, 400, cors);

    const c = cotar({
      km, valorNF: b.valorNF, tipoVeiculo: b.tipoVeiculo || 'truck', eixos: b.eixos,
      ufOrigem: b.ufOrigem ?? uf(b.origem), ufDestino: b.ufDestino ?? uf(b.destino),
      pedagio: pedagio ?? 0, custoMotorista: b.custoMotorista,
      entregas: b.entregas, margemLiquida: b.margemLiquida,
      opts: b.icmsCheio ? { icmsCreditoOutorgado: false } : {},
    });

    const resposta = { ...c, fonteDistancia, leilao: estrategiaLeilao(c) };
    if (b.precoOfertado) {
      resposta.avaliacaoDoLance = avaliarPreco(c, b.precoOfertado);
      resposta.tetoMotorista = tetoMotorista(c, b.precoOfertado, b.margemLiquida);
    }
    return json(resposta, 200, cors);
  } catch (e) {
    return json({ error: 'cotacao_error', message: e.message }, 400, cors);
  }
}

/**
 * POST /bsoft/cte-rascunho
 * Body: { cotacao, operacao }  — `cotacao` é a saída de POST /cotacao.
 *
 * Só grava no Bsoft com BSOFT_HABILITADO="true". Sem isso, devolve o rascunho
 * montado para conferência (modo simulação). Emissão é sempre humana.
 */
async function rotaBsoft(request, env, segs, cors) {
  if (segs[1] !== 'cte-rascunho') return json({ error: 'route_not_allowed', route: segs.join('/') }, 403, cors);

  let b;
  try { b = await request.json(); } catch { return json({ error: 'body json invalido' }, 400, cors); }
  if (!b?.cotacao) return json({ error: 'campo "cotacao" obrigatorio (saida de POST /cotacao)' }, 400, cors);

  let rascunho;
  try { rascunho = montarRascunhoCTe({ cotacao: b.cotacao, operacao: b.operacao || {} }); }
  catch (e) { return json({ error: 'montagem_falhou', message: e.message }, 400, cors); }

  if (env.BSOFT_HABILITADO !== 'true') {
    return json({
      modo: 'simulacao',
      aviso: 'BSOFT_HABILITADO nao esta "true" — rascunho montado mas NAO gravado no Bsoft.',
      rascunho,
    }, 200, cors);
  }

  try {
    const token = await autenticar({
      dominio: env.BSOFT_DOMINIO, usuario: env.BSOFT_USUARIO,
      senha: env.BSOFT_SENHA, base: env.BSOFT_BASE,
    });
    const r = await criarRascunhoCTe(rascunho, { base: env.BSOFT_BASE, token });
    return json({ modo: 'gravado', aviso: 'RASCUNHO criado. Emissao depende de revisao humana.', ...r }, 201, cors);
  } catch (e) {
    return json({ error: 'bsoft_error', message: e.message, corpo: e.corpo, rascunho }, 502, cors);
  }
}

/** extrai a UF do fim de "Tres Lagoas, MS" */
function uf(local) {
  return (String(local || '').match(/[,\s-]\s*([A-Za-z]{2})\s*$/)?.[1] || '').toUpperCase();
}
