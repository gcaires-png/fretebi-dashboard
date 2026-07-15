/**
 * Moita Rev1 — Conector Google Sheets → Painel de Gestão & KPIs (Videl T&L)
 * ---------------------------------------------------------------------------
 * Publica os dados das planilhas da Videl como JSON, no formato que o
 * painel-gestao.html consome. Deploy como "App da Web" (Web App).
 *
 * COMO USAR (resumo — guia completo em CONECTAR-PLANILHAS.md):
 *   1. Crie/abra a Planilha Google com as abas: Areas, Planilhas, KPIs,
 *      Projetos, TopKPIs (opcional), Alertas (opcional).
 *   2. Extensões ▸ Apps Script ▸ cole este arquivo.
 *   3. Ajuste SPREADSHEET_ID abaixo (ou deixe em branco p/ usar a planilha
 *      onde o script está vinculado).
 *   4. Implantar ▸ Nova implantação ▸ Tipo "App da Web" ▸ Acesso: "Qualquer
 *      pessoa" ▸ Implantar. Copie a URL /exec.
 *   5. No painel, clique na engrenagem ⚙️ e cole a URL. Pronto — tempo real.
 * ---------------------------------------------------------------------------
 */

// Deixe '' para usar a planilha vinculada ao script, ou cole o ID da planilha
// (o trecho entre /d/ e /edit na URL da planilha).
var SPREADSHEET_ID = '';

function doGet(e) {
  try {
    var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID)
                            : SpreadsheetApp.getActiveSpreadsheet();
    var payload = {
      ok: true,
      atualizado_em: new Date().toISOString(),
      areas:     buildAreas(ss),
      kpis:      buildKpis(ss),
      projetos:  buildProjetos(ss),
      top_kpis:  buildTopKpis(ss),
      alerts:    buildAlerts(ss)
    };
    return json(payload);
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  }
}

/* ----------------------- Leitura genérica de abas ----------------------- */
// Lê uma aba como array de objetos {header: valor}, usando a 1ª linha como
// cabeçalho (case-insensitive, sem acentos). Retorna [] se a aba não existir.
function readTab(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(norm);
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = row[j];
    rows.push(obj);
  }
  return rows;
}

function norm(s) {
  return String(s).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '_');
}

// Cor default por área (mesmas variáveis CSS do painel)
var CORES = {
  comercial: 'var(--a-comercial)', logistica: 'var(--a-logistica)',
  financeiro: 'var(--a-financeiro)', fiscal: 'var(--a-fiscal)',
  frota: 'var(--a-frota)', rh: 'var(--a-rh)'
};

function num(v, def) {
  if (v === '' || v === null || v === undefined) return def === undefined ? 0 : def;
  var n = Number(String(v).replace(',', '.'));
  return isNaN(n) ? (def === undefined ? 0 : def) : n;
}

/* ----------------------------- Construtores ----------------------------- */
function buildAreas(ss) {
  var areas = readTab(ss, 'Areas');
  var planilhas = readTab(ss, 'Planilhas');
  return areas.map(function (a) {
    var id = norm(a.id || a.area_id || a.area);
    var sheets = planilhas
      .filter(function (p) { return norm(p.area_id || p.area) === id; })
      .map(function (p) {
        return { nome: p.nome || p.planilha, rows: num(p.linhas || p.rows), sync: (p.sync || 'ok') };
      });
    return {
      id: id,
      nome: a.nome || a.area,
      icon: a.icon || a.icone || '📁',
      cor: a.cor || CORES[id] || 'var(--accent)',
      owner: a.owner || a.responsavel || '',
      pasta: a.pasta || a.nome || '',
      drive: a.drive_url || a.drive || a.link || '#',
      health: num(a.health || a.saude, 0),
      planilhas: sheets
    };
  });
}

function buildKpis(ss) {
  var rows = readTab(ss, 'KPIs');
  var out = {};
  rows.forEach(function (r) {
    var area = norm(r.area_id || r.area);
    var papel = norm(r.papel || r.role) === 'func' ? 'func' : 'gestor';
    if (!out[area]) out[area] = { gestor: [], func: [] };
    out[area][papel].push(kpiObj(r));
  });
  return out;
}

function kpiObj(r) {
  var o = {
    ic: r.icon || r.icone || '•',
    v: fmtVal(r.valor || r.v),
    l: r.label || r.l || '',
    d: r.delta || r.d || '',
    dc: norm(r.direcao || r.dc || 'nt')
  };
  if (r.tag) o.tag = r.tag;
  if (r.barra !== '' && r.barra !== undefined) o.bar = num(r.barra || r.bar);
  if (r.cor) o.kc = r.cor;
  return o;
}

function fmtVal(v) {
  // Mantém texto (ex.: "R$ 486k", "61,4%") como veio; números viram string.
  return (v === null || v === undefined) ? '' : String(v);
}

function buildProjetos(ss) {
  return readTab(ss, 'Projetos').map(function (p) {
    return {
      nome: p.nome || p.projeto,
      area: norm(p.area_id || p.area),
      resp: p.responsavel || p.resp || '',
      prog: num(p.progresso || p.prog),
      prazo: p.prazo || '',
      status: norm(p.status || 'and')
    };
  });
}

function buildTopKpis(ss) {
  var rows = readTab(ss, 'TopKPIs');
  if (!rows.length) return null; // painel mantém o default
  var out = { gestor: [], func: [] };
  rows.forEach(function (r) {
    var papel = norm(r.papel || r.role) === 'func' ? 'func' : 'gestor';
    out[papel].push(kpiObj(r));
  });
  return out;
}

function buildAlerts(ss) {
  var rows = readTab(ss, 'Alertas');
  if (!rows.length) return null;
  var out = { gestor: [], func: [] };
  rows.forEach(function (r) {
    var papel = norm(r.papel || r.role) === 'func' ? 'func' : 'gestor';
    out[papel].push(kpiObj(r));
  });
  return out;
}

/* ------------------------------ Resposta -------------------------------- */
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
