/**
 * Cliente da API de rotas do Qualp — distancia rodoviaria + pedagio real.
 *
 * Credencial: QUALP_TOKEN (header `Access-Token`).
 * Endpoint padrao: https://api.qualp.com.br/rotas/v4
 *
 * NAO TESTADO CONTRA A API REAL — o ambiente onde este codigo foi escrito tem
 * egress bloqueado para qualp.com.br. O parser de resposta e defensivo (aceita
 * varios formatos), mas confira os nomes de campo em https://api.qualp.com.br
 * na primeira chamada e ajuste `normalizar()` se necessario.
 */

const BASE_PADRAO = 'https://api.qualp.com.br/rotas/v4';

export class QualpError extends Error {
  constructor(msg, { status, corpo } = {}) {
    super(msg);
    this.name = 'QualpError';
    this.status = status;
    this.corpo = corpo;
  }
}

/**
 * @param {object} p
 * @param {string} p.origem           ex: "Tres Lagoas, MS"
 * @param {string} p.destino          ex: "Sorriso, MT"
 * @param {string[]} [p.paradas]      pontos intermediarios
 * @param {number} [p.eixos=3]
 * @param {string} [p.token]          senao usa env QUALP_TOKEN
 * @param {string} [p.base]
 * @param {typeof fetch} [p.fetchImpl]
 * @param {number} [p.timeoutMs=20000]
 */
export async function consultarRota({
  origem, destino, paradas = [], eixos = 3,
  token = globalThis.process?.env?.QUALP_TOKEN,
  base = globalThis.process?.env?.QUALP_BASE || BASE_PADRAO,
  fetchImpl = globalThis.fetch, timeoutMs = 20000,
}) {
  if (!token) throw new QualpError('QUALP_TOKEN nao configurado');
  if (!origem || !destino) throw new QualpError('origem e destino sao obrigatorios');

  const locais = [origem, ...paradas, destino];
  const config = {
    veiculo: { eixos, tipo: 'caminhao' },
    rotas: { alternativas: false, otimizar: false },
    pedagios: true,
    balancas: false,
    calcular_volta: false,
  };

  const qs = new URLSearchParams({
    locations: JSON.stringify(locais),
    config: JSON.stringify(config),
    format: 'json',
    show_polyline: 'false',
  });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let resp;
  try {
    resp = await fetchImpl(`${base}?${qs}`, {
      headers: { 'Access-Token': token, Accept: 'application/json' },
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new QualpError(`falha de rede ao chamar o Qualp: ${e.message}`);
  } finally {
    clearTimeout(t);
  }

  const texto = await resp.text();
  if (!resp.ok) throw new QualpError(`Qualp HTTP ${resp.status}`, { status: resp.status, corpo: texto.slice(0, 500) });

  let json;
  try { json = JSON.parse(texto); }
  catch { throw new QualpError('Qualp devolveu resposta nao-JSON', { corpo: texto.slice(0, 500) }); }

  return normalizar(json, { origem, destino, eixos });
}

/**
 * Achata os formatos conhecidos do Qualp para { km, pedagio, duracaoMin }.
 * Exportado para poder ser testado sem rede.
 */
export function normalizar(json, ctx = {}) {
  const r = json?.rota ?? json?.data ?? json;

  const km = primeiroNumero([
    r?.distancia?.valor, r?.distancia_km, r?.distance?.value, r?.distancia,
  ]);
  const pedagio = primeiroNumero([
    r?.pedagio?.valor_total, r?.pedagios?.total, r?.pedagio_total,
    r?.tolls?.total, r?.pedagio,
  ]);
  const duracaoMin = primeiroNumero([
    r?.duracao?.minutos, r?.duracao_minutos, r?.duration?.value,
  ]);

  if (km == null) {
    throw new QualpError('nao encontrei a distancia na resposta do Qualp — ajuste normalizar()', {
      corpo: JSON.stringify(json).slice(0, 800),
    });
  }

  return {
    km,
    pedagio: pedagio ?? null,
    duracaoMin: duracaoMin ?? null,
    eixos: ctx.eixos,
    origem: ctx.origem,
    destino: ctx.destino,
    pedagioConfirmado: pedagio != null,
    bruto: json,
  };
}

/** Aceita 1450, "1450", "1.450,5 km", "1,450.5" e devolve numero ou null. */
function primeiroNumero(cands) {
  for (const v of cands) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      // remove unidade e normaliza separadores pt-BR
      const limpo = v.replace(/[^\d.,-]/g, '');
      if (!limpo) continue;
      const n = limpo.includes(',')
        ? Number(limpo.replace(/\./g, '').replace(',', '.'))
        : Number(limpo.replace(/,/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
