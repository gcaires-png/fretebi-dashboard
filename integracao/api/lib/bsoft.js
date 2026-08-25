/**
 * Cliente da API Bsoft — criacao de CT-e como RASCUNHO.
 *
 * REGRA INEGOCIAVEL (CLAUDE.md): o Moita NUNCA emite documento fiscal.
 * Este modulo so cria/atualiza rascunho. Nao existe aqui — e nao deve existir —
 * chamada de emissao/autorizacao/transmissao. Ver `GUARDA_EMISSAO` no fim.
 *
 * Credenciais (segredos): BSOFT_DOMINIO, BSOFT_USUARIO, BSOFT_SENHA
 * Endpoint padrao: https://api.bsoftsistemas.com
 *
 * NAO TESTADO CONTRA A API REAL — egress bloqueado no ambiente de escrita e
 * as credenciais de integracao ainda nao foram emitidas. As rotas abaixo sao
 * as candidatas mais provaveis e ficam configuraveis por env; confirme em
 * https://docs.bsoft.app ou com suporte.tms@bsoft.com.br antes de ligar em
 * producao (ver README, secao "Ligar o Bsoft").
 */

const BASE_PADRAO = 'https://api.bsoftsistemas.com';

const ROTAS = {
  login: () => globalThis.process?.env?.BSOFT_ROTA_LOGIN || '/api/auth/login',
  cte: () => globalThis.process?.env?.BSOFT_ROTA_CTE || '/api/cte',
};

export class BsoftError extends Error {
  constructor(msg, { status, corpo } = {}) {
    super(msg);
    this.name = 'BsoftError';
    this.status = status;
    this.corpo = corpo;
  }
}

let tokenCache = { valor: null, exp: 0 };

export async function autenticar({
  dominio = globalThis.process?.env?.BSOFT_DOMINIO,
  usuario = globalThis.process?.env?.BSOFT_USUARIO,
  senha = globalThis.process?.env?.BSOFT_SENHA,
  base = globalThis.process?.env?.BSOFT_BASE || BASE_PADRAO,
  fetchImpl = globalThis.fetch,
} = {}) {
  const agora = Date.now();
  if (tokenCache.valor && tokenCache.exp > agora + 30_000) return tokenCache.valor;
  if (!dominio || !usuario || !senha) {
    throw new BsoftError('BSOFT_DOMINIO / BSOFT_USUARIO / BSOFT_SENHA nao configurados');
  }

  const r = await fetchImpl(`${base}${ROTAS.login()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ dominio, usuario, senha }),
  });
  const txt = await r.text();
  if (!r.ok) throw new BsoftError(`login Bsoft falhou: HTTP ${r.status}`, { status: r.status, corpo: txt.slice(0, 400) });

  let j;
  try { j = JSON.parse(txt); } catch { throw new BsoftError('login Bsoft devolveu nao-JSON', { corpo: txt.slice(0, 400) }); }
  const tk = j.token || j.access_token || j.accessToken || j?.data?.token;
  if (!tk) throw new BsoftError('token nao retornado pelo Bsoft', { corpo: txt.slice(0, 400) });

  tokenCache = { valor: tk, exp: agora + 50 * 60 * 1000 };
  return tk;
}

/** Zera o cache de token (util em testes e ao trocar credencial). */
export function limparToken() { tokenCache = { valor: null, exp: 0 }; }

/**
 * Monta o payload do CT-e a partir da cotacao + dados da operacao.
 * Funcao pura — da pra testar e revisar sem tocar na API.
 */
export function montarRascunhoCTe({ cotacao, operacao }) {
  const { ufOrigem, ufDestino } = cotacao.entrada;
  return {
    rascunho: true,
    status: 'RASCUNHO - AGUARDANDO REVISAO HUMANA',
    gerado_por: 'Moita Rev1',
    identificacao: {
      tipo_cte: 'ORIGINAL',
      modal: 'RODOVIARIO',
      tipo_servico: 'NORMAL',
      cfop: cfop(ufOrigem, ufDestino, operacao?.tomadorTipo),
      natureza_operacao: 'PRESTACAO DE SERVICO DE TRANSPORTE',
      forma_pagamento: operacao?.formaPagamento || 'A PRAZO',
    },
    emitente: {
      razao_social: 'VIDEL TRANSPORTE E LOGISTICA LTDA',
      cnpj: '63.147.064/0001-30',
      ie: '129273392',
    },
    remetente: operacao?.remetente ?? null,
    destinatario: operacao?.destinatario ?? null,
    tomador_servico: operacao?.tomador ?? null,
    nfe_referenciada: operacao?.nfe ?? null,
    rota: {
      origem: operacao?.origem, destino: operacao?.destino,
      distancia_km: cotacao.entrada.km,
      fonte_distancia: operacao?.fonteDistancia || 'Qualp',
    },
    carga: {
      produto: operacao?.produto ?? null,
      peso_bruto_kg: operacao?.pesoKg ?? null,
      volumes: operacao?.volumes ?? null,
      valor_mercadoria: cotacao.entrada.valorNF,
    },
    valores: {
      valor_total_servico: cotacao.preco,
      valor_frete: cotacao.preco,
      valor_pedagio: cotacao.custos.pedagio,
      valor_seguro_rcdc: cotacao.custos.seguroRCDC,
    },
    icms: {
      cst: '00',
      base_calculo: cotacao.preco,
      aliquota_percentual: cotacao.impostos.icmsNominal * 100,
      valor_icms: round2(cotacao.preco * cotacao.impostos.icmsNominal),
      aliquota_justificativa: `Interestadual ${ufOrigem} -> ${ufDestino} (Res. Senado 22/89)`,
    },
    motorista: operacao?.motorista ?? null,
    veiculo: operacao?.veiculo ?? null,
    _memoria_de_calculo: cotacao,
  };
}

/**
 * Envia o rascunho ao Bsoft. Recusa qualquer payload que peca emissao.
 * @returns {Promise<{id?:string, resposta:any}>}
 */
export async function criarRascunhoCTe(payload, {
  base = globalThis.process?.env?.BSOFT_BASE || BASE_PADRAO,
  fetchImpl = globalThis.fetch, token,
} = {}) {
  GUARDA_EMISSAO(payload);
  const tk = token || await autenticar({ base, fetchImpl });

  const r = await fetchImpl(`${base}${ROTAS.cte()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tk}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const txt = await r.text();
  if (!r.ok) throw new BsoftError(`criar rascunho falhou: HTTP ${r.status}`, { status: r.status, corpo: txt.slice(0, 600) });

  let j; try { j = JSON.parse(txt); } catch { j = { raw: txt }; }
  return { id: j.id || j?.data?.id, resposta: j };
}

/**
 * Trava de seguranca: barra qualquer tentativa de emitir/autorizar.
 * O fluxo da Videl exige revisao humana entre o rascunho e a emissao.
 */
export function GUARDA_EMISSAO(payload) {
  if (payload?.rascunho !== true) {
    throw new BsoftError('BLOQUEADO: payload sem rascunho=true. O Moita nao emite documento fiscal.');
  }
  const proibidos = ['emitir', 'transmitir', 'autorizar', 'emissao_imediata', 'enviar_sefaz'];
  for (const k of proibidos) {
    if (k in (payload || {})) {
      throw new BsoftError(`BLOQUEADO: campo "${k}" no payload. Emissao e sempre humana.`);
    }
  }
}

function cfop(ufO, ufD, tomadorTipo = 'comercio') {
  const inter = String(ufO).toUpperCase() !== String(ufD).toUpperCase();
  const p = inter ? '6' : '5';
  return tomadorTipo === 'industria' ? `${p}352` : `${p}353`;
}

const round2 = (v) => Math.round(v * 100) / 100;
