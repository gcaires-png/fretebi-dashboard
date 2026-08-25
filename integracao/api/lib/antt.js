/**
 * Piso minimo ANTT (Lei 13.703/2018) — Resolucao 6.084/2026
 *
 * O piso e o valor MINIMO LEGAL da contratacao do servico de transporte.
 * Nenhuma cotacao da Videl pode sair abaixo dele.
 */

import TABELA from '../antt-tabela.js';

/** Eixos por tipo de veiculo (nomes usados na plataforma Videl / FreteBras). */
export const EIXOS_POR_VEICULO = {
  vuc: 2, '3/4': 2, toco: 2,
  truck: 3, 'truck sider': 3, 'truck aberto': 3, bitruck: 4,
  carreta: 5, 'carreta ls': 6, 'carreta sider': 5,
  bitrem: 7, treminhao: 7, rodotrem: 9,
};

export function eixosDe(tipoVeiculo) {
  if (typeof tipoVeiculo === 'number') return tipoVeiculo;
  const k = String(tipoVeiculo || '').toLowerCase().trim();
  if (EIXOS_POR_VEICULO[k]) return EIXOS_POR_VEICULO[k];
  // casamento por prefixo: "truck sider ou aberto 9 metros" -> truck
  for (const [nome, eixos] of Object.entries(EIXOS_POR_VEICULO)) {
    if (k.startsWith(nome) || k.includes(nome)) return eixos;
  }
  return null;
}

/**
 * Calcula o piso ANTT.
 * @param {{km:number, eixos?:number, tipoVeiculo?:string, tipoCarga?:string}} p
 * @returns {{piso:number, ccd:number, cc:number, eixos:number, fonte:string,
 *            conferir:boolean, resolucao:string, porKm:number}}
 */
export function pisoANTT({ km, eixos, tipoVeiculo, tipoCarga = 'carga_geral' }) {
  if (!(km > 0)) throw new Error('pisoANTT: km deve ser > 0');

  const n = eixos ?? eixosDe(tipoVeiculo);
  if (!n) throw new Error(`pisoANTT: nao consegui deduzir eixos de "${tipoVeiculo}"`);

  const linha = TABELA.tabelas.A_carga_lotacao?.[tipoCarga]?.[String(n)];
  if (!linha) throw new Error(`pisoANTT: sem linha para ${tipoCarga} / ${n} eixos`);

  const piso = km * linha.ccd + linha.cc;
  return {
    piso: round2(piso),
    porKm: round2(piso / km),
    ccd: linha.ccd,
    cc: linha.cc,
    eixos: n,
    fonte: linha.fonte,
    // sinaliza pro operador que o coeficiente ainda nao foi lido da resolucao oficial
    conferir: linha.fonte !== 'publicado',
    resolucao: TABELA.resolucao,
  };
}

export const round2 = (v) => Math.round(v * 100) / 100;
export { TABELA as tabelaANTT };
