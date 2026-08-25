/**
 * Moita Rev2 — MathEngine (Fase 1)
 * ---------------------------------------------------------------------------
 * Motor matemático da operação: dado o input cru do dashboard (venda, teto,
 * motorista, pedágio, ajudantes, DDL), devolve CMO, folga até o teto, margem,
 * teto derivado do motorista e os alertas — a mesma álgebra validada na
 * operação AVT Energy (Nova Odessa/SP → São Luiz do Paraitinga/SP).
 *
 * Funções puras, sem dependência de Sheets/Drive: dá para colar junto do
 * moita-sheets.gs no mesmo projeto Apps Script ou usar em Node sem mudanças.
 * Rode selfTestMathEngine() no editor para validar com os números reais.
 * ---------------------------------------------------------------------------
 */

// Margem-alvo sobre a venda. Engenharia reversa da política atual:
// motorista_máx = venda − pedágio − ajudantes − (margem × venda)
// (com 32% a fórmula reproduz o teto de R$ 1.650 da operação AVT).
var MARGEM_ALVO = 0.32;

// Folga mínima até o teto antes de alertar (3% do teto). Na AVT a folga era
// R$ 16 (0,7%) — qualquer imprevisto estourava a regra.
var FOLGA_MINIMA_PCT = 0.03;

// Custo financeiro do ciclo de caixa: taxa ao mês aplicada pró-rata ao DDL
// (a Videl desembolsa o CMO na operação e recebe a venda em ~DDL dias).
var TAXA_FINANCEIRA_MES = 0.009;

// Coeficientes do piso ANTT (Lei 13.703/2018): piso = CCD × km + CC.
// ATENÇÃO: valores mudam a cada resolução/reajuste de diesel — confirme na
// calculadora oficial da ANTT antes de usar em produção e atualize aqui.
// Chave = número de eixos; categoria carga geral (lotação).
var ANTT_CARGA_GERAL = {
  2: { ccd: 3.9826, cc: 0 }, // TODO: conferir CC (parcela fixa) na resolução vigente
  3: { ccd: null, cc: null },
  4: { ccd: null, cc: null },
  5: { ccd: null, cc: null },
  6: { ccd: null, cc: null }
};

/**
 * Piso ANTT pela fórmula oficial (CCD × km) + CC.
 * Retorna null se os coeficientes do nº de eixos não estiverem preenchidos.
 */
function pisoAntt(km, eixos) {
  var c = ANTT_CARGA_GERAL[eixos];
  if (!c || c.ccd === null || c.ccd === undefined) return null;
  return Math.round((c.ccd * km + (c.cc || 0)) * 100) / 100;
}

/** Custo financeiro do faturamento a prazo (DDL dias). */
function custoFinanceiroDDL(cmo, ddl, taxaMes) {
  var t = (taxaMes === undefined || taxaMes === null) ? TAXA_FINANCEIRA_MES : taxaMes;
  return Math.round(cmo * t * ((ddl || 0) / 30) * 100) / 100;
}

/** Teto de motorista derivado da margem-alvo (não decorado). */
function motoristaMaximo(venda, pedagio, ajudantes, margem) {
  var m = (margem === undefined || margem === null) ? MARGEM_ALVO : margem;
  return Math.round((venda - pedagio - ajudantes - m * venda) * 100) / 100;
}

/**
 * Analisa uma operação e devolve números + alertas.
 * op = {
 *   venda:      valor de venda (R$)            — obrigatório
 *   teto:       teto da operação (R$)          — obrigatório
 *   motorista:  valor negociado motorista (R$) — obrigatório
 *   pedagio:    total de pedágios (R$)         — default 0
 *   ajudantes:  total de diárias (R$)          — default 0
 *   ddl:        prazo de faturamento em dias   — default 0 (à vista)
 *   pisoAntt:   piso informado/calculado (R$)  — opcional
 *   km / eixos: para recalcular o piso ANTT    — opcionais
 * }
 */
function analisarOperacao(op) {
  var pedagio = op.pedagio || 0;
  var ajudantes = op.ajudantes || 0;
  var cmoOperacional = op.motorista + pedagio + ajudantes;
  var cmoFinanceiro = custoFinanceiroDDL(cmoOperacional, op.ddl || 0);
  var cmo = Math.round((cmoOperacional + cmoFinanceiro) * 100) / 100;

  var folga = Math.round((op.teto - cmoOperacional) * 100) / 100;
  var folgaPct = op.teto ? folga / op.teto : 0;
  var margemBruta = op.venda ? (op.venda - cmoOperacional) / op.venda : 0;
  var motoristaMax = motoristaMaximo(op.venda, pedagio, ajudantes);

  // piso: usa o informado; se vier km+eixos, recalcula e usa o MAIOR dos dois
  var pisoCalculado = (op.km && op.eixos) ? pisoAntt(op.km, op.eixos) : null;
  var piso = Math.max(op.pisoAntt || 0, pisoCalculado || 0) || null;

  var alertas = [];
  if (cmoOperacional > op.teto) {
    alertas.push({ nivel: 'critico', codigo: 'TETO_ESTOURADO',
      msg: 'CMO R$ ' + cmoOperacional.toFixed(2) + ' acima do teto R$ ' + op.teto.toFixed(2) + ' — exige aprovação comercial.' });
  } else if (folgaPct < FOLGA_MINIMA_PCT) {
    alertas.push({ nivel: 'atencao', codigo: 'FOLGA_MINIMA',
      msg: 'Folga de apenas R$ ' + folga.toFixed(2) + ' (' + (folgaPct * 100).toFixed(1) + '%) até o teto — qualquer imprevisto estoura a regra.' });
  }
  if (piso && op.motorista < piso) {
    alertas.push({ nivel: 'critico', codigo: 'ABAIXO_PISO_ANTT',
      msg: 'Motorista R$ ' + op.motorista.toFixed(2) + ' abaixo do piso ANTT R$ ' + piso.toFixed(2) + ' (Lei 13.703/2018) — passivo jurídico.' });
  }
  if (margemBruta < MARGEM_ALVO) {
    alertas.push({ nivel: 'atencao', codigo: 'MARGEM_ABAIXO_ALVO',
      msg: 'Margem bruta ' + (margemBruta * 100).toFixed(1) + '% abaixo da meta ' + (MARGEM_ALVO * 100) + '%. Motorista máx. sugerido: R$ ' + motoristaMax.toFixed(2) + '.' });
  }

  return {
    cmoOperacional: cmoOperacional,
    cmoFinanceiro: cmoFinanceiro,
    cmoTotal: cmo,
    folgaTeto: folga,
    folgaTetoPct: Math.round(folgaPct * 1000) / 10,
    margemBrutaPct: Math.round(margemBruta * 1000) / 10,
    motoristaMaximo: motoristaMax,
    pisoAntt: piso,
    alertas: alertas
  };
}

/**
 * Auto-teste com os números reais da operação AVT Energy.
 * Esperado: CMO 2.184 | folga 16 (0,7%) | margem 32,2% | motorista máx. ~1.655
 * e alertas FOLGA_MINIMA (não TETO_ESTOURADO, não ABAIXO_PISO).
 */
function selfTestMathEngine() {
  var r = analisarOperacao({
    venda: 3220, teto: 2200, motorista: 1650,
    pedagio: 134, ajudantes: 400, ddl: 15, pisoAntt: 1517
  });
  var erros = [];
  if (r.cmoOperacional !== 2184) erros.push('CMO esperado 2184, obtido ' + r.cmoOperacional);
  if (r.folgaTeto !== 16) erros.push('folga esperada 16, obtida ' + r.folgaTeto);
  if (r.margemBrutaPct !== 32.2) erros.push('margem esperada 32.2, obtida ' + r.margemBrutaPct);
  if (Math.abs(r.motoristaMaximo - 1655.6) > 0.01) erros.push('motoristaMax esperado 1655.60, obtido ' + r.motoristaMaximo);
  var cods = r.alertas.map(function (a) { return a.codigo; });
  if (cods.indexOf('FOLGA_MINIMA') < 0) erros.push('faltou alerta FOLGA_MINIMA');
  if (cods.indexOf('TETO_ESTOURADO') >= 0) erros.push('TETO_ESTOURADO indevido');
  if (cods.indexOf('ABAIXO_PISO_ANTT') >= 0) erros.push('ABAIXO_PISO_ANTT indevido');
  var msg = erros.length ? 'FALHOU:\n' + erros.join('\n') : 'OK — MathEngine validado com a operação AVT Energy.';
  if (typeof Logger !== 'undefined') Logger.log(msg); else console.log(msg);
  return erros.length === 0;
}
