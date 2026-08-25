/**
 * Motor de precificacao de frete — Videl T&L
 *
 * Regra da casa (CLAUDE.md): custo do motorista entre 60% e 62% do valor da
 * operacao. Aqui a entrada e a margem LIQUIDA desejada (depois de impostos e
 * comissao) e a saida checa se o custo/preco caiu na meta.
 *
 * Precificacao por dentro:
 *   preco * (1 - impostos - comissao - margem) = custo_total
 */

import { pisoANTT, round2 } from './antt.js';

/** Parametros fiscais/operacionais padrao da Videl. */
export const PADROES = {
  // impostos sobre a receita (lucro presumido)
  icmsCreditoOutorgado: true,   // 20% de credito -> 12% viram 9,6%
  pisCofins: 0.0365,            // cumulativo
  irpjCsll: 0.0228,             // presumido, transporte de cargas
  // comissoes (ver cte-drafts/EMB-2026-00066)
  comissaoInterna: 0.015,
  comissaoExterna: 0,           // 0.025 quando houver representante externo
  // custos
  overhead: 0.10,               // rateio administrativo sobre custo direto
  gerenciamentoRisco: 200,
  custoPorEntregaExtra: 200,
  // seguro (insurance-rules.json — apolice Allianz)
  taxaRCDC: 0.00018,
  rcvAte400km: 10,
  margemLiquidaAlvo: 0.12,
};

/** ICMS interestadual (Res. Senado 22/89). Origem Sul/Sudeste (menos ES) -> N/NE/CO/ES = 7%; senao 12%. */
const SUL_SUDESTE = new Set(['SP', 'RJ', 'MG', 'PR', 'SC', 'RS']);
const N_NE_CO_ES = new Set(['AC','AP','AM','PA','RO','RR','TO','AL','BA','CE','MA','PB','PE','PI','RN','SE','DF','GO','MT','MS','ES']);

export function aliquotaICMS(ufOrigem, ufDestino) {
  const o = String(ufOrigem || '').toUpperCase();
  const d = String(ufDestino || '').toUpperCase();
  if (o === d) return 0.12;                                  // interno: varia por UF, 12% e o usual em transporte
  if (SUL_SUDESTE.has(o) && N_NE_CO_ES.has(d)) return 0.07;
  return 0.12;
}

/**
 * @param {object} p
 * @param {number} p.km                 distancia rodoviaria (Qualp)
 * @param {number} p.valorNF            valor da mercadoria
 * @param {string} [p.tipoVeiculo]      ex: "truck sider"
 * @param {number} [p.eixos]
 * @param {string} p.ufOrigem
 * @param {string} p.ufDestino
 * @param {number} [p.pedagio]          valor real do pedagio (Qualp)
 * @param {number} [p.custoMotorista]   se nao informado, usa o piso ANTT
 * @param {number} [p.entregas=1]
 * @param {number} [p.margemLiquida]
 * @param {object} [p.opts]             sobrescreve PADROES
 */
export function cotar(p) {
  const o = { ...PADROES, ...(p.opts || {}) };
  const km = Number(p.km);
  const valorNF = Number(p.valorNF) || 0;
  const entregas = Math.max(1, Number(p.entregas) || 1);
  const margem = p.margemLiquida ?? o.margemLiquidaAlvo;

  const antt = pisoANTT({ km, eixos: p.eixos, tipoVeiculo: p.tipoVeiculo });

  const custoMotorista = p.custoMotorista != null ? Number(p.custoMotorista) : antt.piso;
  const abaixoDoPiso = custoMotorista < antt.piso - 0.01;

  const pedagio = p.pedagio != null ? Number(p.pedagio) : 0;
  const rcdc = round2(valorNF * o.taxaRCDC);
  const rcv = round2(o.rcvAte400km * Math.max(1, km / 400));
  const extras = round2((entregas - 1) * o.custoPorEntregaExtra);

  const custoDireto = round2(custoMotorista + pedagio + rcdc + rcv + o.gerenciamentoRisco + extras);
  const overhead = round2(custoDireto * o.overhead);
  const custoTotal = round2(custoDireto + overhead);

  const icmsBase = aliquotaICMS(p.ufOrigem, p.ufDestino);
  const icms = o.icmsCreditoOutorgado ? round4(icmsBase * 0.8) : icmsBase;
  const cargaTributaria = icms + o.pisCofins + o.irpjCsll;
  const comissoes = o.comissaoInterna + o.comissaoExterna;

  const divisor = 1 - cargaTributaria - comissoes - margem;
  if (divisor <= 0) throw new Error('cotar: margem + impostos + comissao >= 100%, precificacao impossivel');

  const preco = round2(custoTotal / divisor);
  const breakEven = round2(custoTotal / (1 - cargaTributaria - comissoes));

  return {
    preco,
    breakEven,
    pisoLegalANTT: antt.piso,
    antt,
    entrada: { km, valorNF, entregas, ufOrigem: p.ufOrigem, ufDestino: p.ufDestino },
    custos: {
      motorista: round2(custoMotorista), pedagio, seguroRCDC: rcdc, seguroRCV: rcv,
      gerenciamentoRisco: o.gerenciamentoRisco, entregasExtras: extras,
      custoDireto, overhead, custoTotal,
    },
    impostos: {
      aliquotaICMS: icms, icmsNominal: icmsBase, creditoOutorgado: o.icmsCreditoOutorgado,
      pisCofins: o.pisCofins, irpjCsll: o.irpjCsll,
      cargaTributaria: round4(cargaTributaria),
      valor: round2(preco * cargaTributaria),
    },
    comissoes: { percentual: round4(comissoes), valor: round2(preco * comissoes) },
    resultado: {
      margemLiquida: margem,
      lucroLiquido: round2(preco * margem),
      percentualSobreNF: valorNF ? round4(preco / valorNF) : null,
      reaisPorKm: round2(preco / km),
      custoMotoristaSobrePreco: round4(custoMotorista / preco),
    },
    alertas: montarAlertas({ abaixoDoPiso, antt, custoMotorista, preco, valorNF }),
  };
}

function montarAlertas({ abaixoDoPiso, antt, custoMotorista, preco }) {
  const a = [];
  if (abaixoDoPiso) {
    a.push({ nivel: 'BLOQUEIO', msg: `Custo do motorista R$ ${custoMotorista.toFixed(2)} esta ABAIXO do piso ANTT R$ ${antt.piso.toFixed(2)} — ilegal (Lei 13.703/2018).` });
  }
  if (preco < antt.piso) {
    a.push({ nivel: 'BLOQUEIO', msg: `Preco ofertado abaixo do piso ANTT R$ ${antt.piso.toFixed(2)}.` });
  }
  if (antt.conferir) {
    a.push({ nivel: 'ATENCAO', msg: `Coeficiente ANTT de ${antt.eixos} eixos e DERIVADO, nao lido da resolucao. Conferir em calculadorafrete.antt.gov.br antes de fechar.` });
  }
  a.push(...alertaMeta(custoMotorista / preco));
  return a;
}

/** Meta da casa (CLAUDE.md): custo do motorista entre 60% e 62% do valor da operacao. */
function alertaMeta(rel) {
  const p = `${(rel * 100).toFixed(1)}% do preco`;
  if (rel > 0.65) return [{ nivel: 'CRITICO', msg: `Custo motorista em ${p} (meta 60-62%). Buscar alternativa ou escalar.` }];
  if (rel > 0.62) return [{ nivel: 'ATENCAO', msg: `Custo motorista em ${p}, acima da meta de 62%.` }];
  if (rel < 0.60) return [{ nivel: 'OK', msg: `Custo motorista em ${p} — abaixo da meta, margem boa.` }];
  return [{ nivel: 'OK', msg: `Custo motorista em ${p} — dentro da meta 60-62%.` }];
}

/**
 * Avalia um preco JA DADO (lance do leilao, preco sugerido pelo comercial,
 * contraproposta do cliente) contra a estrutura de custo da cotacao.
 *
 * Diferente de `cotar`, que deriva o preco do custo: aqui o preco e fixo e o
 * que varia e a margem. E este o angulo que importa num leilao — "se eu tiver
 * de descer pra R$ X, ainda sobra quanto?".
 *
 * @param {ReturnType<typeof cotar>} c
 * @param {number} precoOfertado
 */
export function avaliarPreco(c, precoOfertado) {
  const preco = Number(precoOfertado);
  if (!(preco > 0)) throw new Error('avaliarPreco: preco deve ser > 0');

  const cargaTributaria = c.impostos.cargaTributaria;
  const comissoes = c.comissoes.percentual;
  const impostos = round2(preco * cargaTributaria);
  const comissao = round2(preco * comissoes);
  const lucro = round2(preco - c.custos.custoTotal - impostos - comissao);
  const margem = round4(lucro / preco);
  const relMotorista = round4(c.custos.motorista / preco);

  const alertas = [];
  if (preco < c.pisoLegalANTT) {
    alertas.push({ nivel: 'BLOQUEIO', msg: `R$ ${preco.toFixed(2)} esta abaixo do piso ANTT R$ ${c.pisoLegalANTT.toFixed(2)} — ilegal (Lei 13.703/2018).` });
  } else if (lucro < 0) {
    alertas.push({ nivel: 'CRITICO', msg: `Prejuizo de R$ ${Math.abs(lucro).toFixed(2)} nesse preco. Break-even em R$ ${c.breakEven.toFixed(2)}.` });
  }
  alertas.push(...alertaMeta(relMotorista));
  if (c.antt.conferir) {
    alertas.push({ nivel: 'ATENCAO', msg: `Coeficiente ANTT de ${c.antt.eixos} eixos e DERIVADO. Conferir em calculadorafrete.antt.gov.br.` });
  }

  return {
    precoOfertado: round2(preco),
    lucroLiquido: lucro,
    margemLiquida: margem,
    custoMotoristaSobrePreco: relMotorista,
    percentualSobreNF: c.entrada.valorNF ? round4(preco / c.entrada.valorNF) : null,
    reaisPorKm: round2(preco / c.entrada.km),
    impostos, comissao,
    viavel: preco >= c.pisoLegalANTT && lucro >= 0,
    dentroDaMeta: relMotorista >= 0.60 && relMotorista <= 0.62,
    alertas,
  };
}

/**
 * Teto que a Videl pode pagar ao motorista para bater a margem alvo num preco
 * de venda dado. E o numero que o G8 leva pra negociacao no FreteBras.
 */
export function tetoMotorista(c, precoOfertado, margemAlvo = PADROES.margemLiquidaAlvo) {
  const o = { ...PADROES };
  const preco = Number(precoOfertado);
  const sobra = preco * (1 - c.impostos.cargaTributaria - c.comissoes.percentual - margemAlvo);
  // sobra = custoTotal = (motorista + outros) * (1 + overhead)
  const outros = c.custos.custoDireto - c.custos.motorista;
  const teto = round2(sobra / (1 + o.overhead) - outros);
  return {
    teto,
    respeitaPiso: teto >= c.pisoLegalANTT,
    pisoANTT: c.pisoLegalANTT,
    folga: round2(teto - c.pisoLegalANTT),
  };
}

/** Faixas para disputa de leilao: abertura, alvo e ponto de desistencia. */
export function estrategiaLeilao(c) {
  return {
    abertura: round2(c.preco * 1.035),
    alvo: c.preco,
    breakEven: c.breakEven,
    pisoLegal: c.pisoLegalANTT,
    naoOfertarAbaixoDe: c.pisoLegalANTT,
  };
}

const round4 = (v) => Math.round(v * 10000) / 10000;
