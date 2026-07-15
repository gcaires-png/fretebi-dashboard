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

// ID da planilha MASTER "00 - Controle de Demandas Videl". Deixe '' para usar a
// planilha vinculada ao script, ou cole o ID (trecho entre /d/ e /edit na URL).
var SPREADSHEET_ID = '1JWfMV8uMDDg5NrE0FxpA1j6tYsDMpJllYE6g5t_STqk';

function doGet(e) {
  try {
    var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID)
                            : SpreadsheetApp.getActiveSpreadsheet();
    var payload = {
      ok: true,
      atualizado_em: new Date().toISOString(),
      atividades: buildAtividades(ss),   // <- aba principal: Controle de Atividades
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
// Controle de Demandas Videl — lê a planilha MASTER (ou a aba de demandas).
// Colunas reais aceitas (nomes flexíveis, com/sem acento e parênteses):
//   ID | Área | Subárea | Demanda/Tarefa | Responsável (executa) | Gestor |
//   Prioridade | Abertura | Prazo | Status | % Concluído | Próxima ação / Observação
function buildAtividades(ss) {
  var rows = demandRows(ss);
  return rows.map(function (r, i) {
    var area = norm(pick(r, ['subarea', 'sub_area']) || pick(r, ['area']) || 'geral');
    return {
      id: pick(r, ['id']) || ('A' + (i + 1)),
      titulo: pick(r, ['demanda', 'tarefa', 'atividade', 'titulo']) || '',
      resp: pick(r, ['responsavel', 'executa', 'resp']) || '',
      gestor: pick(r, ['gestor']) || '',
      area: mapArea(area),
      areaNome: pick(r, ['area']) || '',
      prioridade: mapPrio(pick(r, ['prioridade', 'prio'])),
      abertura: fmtData(pick(r, ['abertura', 'inicio'])),
      prazo: fmtData(pick(r, ['prazo'])),
      status: mapStatus(pick(r, ['status'])),
      pct: pctNum(pick(r, ['%_concluido', 'concluido', 'percentual', 'pct'])),
      obs: pick(r, ['proxima_acao', 'observacao', 'observacoes', 'obs', 'proxima_acao_/_observacao']) || ''
    };
  });
}

// Encontra a aba de demandas: tenta nomes conhecidos, senão usa a 1ª com dados.
function demandRows(ss) {
  var names = ['Atividades', 'MASTER', 'Master', 'Demandas', 'Controle'];
  for (var i = 0; i < names.length; i++) {
    var r = readTab(ss, names[i]);
    if (r.length) return r;
  }
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    var rr = readTab(ss, sheets[j].getName());
    if (rr.length) return rr;
  }
  return [];
}

// Pega o 1º valor cujo cabeçalho CONTÉM um dos tokens (após normalização).
function pick(obj, tokens) {
  var keys = Object.keys(obj);
  for (var t = 0; t < tokens.length; t++) {
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].indexOf(tokens[t]) !== -1) {
        var v = obj[keys[k]];
        if (v !== '' && v !== null && v !== undefined) return String(v).trim();
      }
    }
  }
  return '';
}

// Área textual -> id do painel (cor/ícone).
function mapArea(a) {
  var n = norm(a);
  if (/(^|_)rh/.test(n) || /recursos/.test(n)) return 'rh';
  if (/(adm|administ|matriz|filial)/.test(n)) return 'adm';
  if (/financ/.test(n)) return 'financeiro';
  if (/(logist|operac)/.test(n)) return 'logistica';
  if (/comerc/.test(n)) return 'comercial';
  if (/(market|mkt)/.test(n)) return 'marketing';
  if (/(ti|dev|projet|tecnolog)/.test(n)) return 'ti';
  return 'geral';
}

function mapPrio(p) {
  var n = norm(p);
  if (/alta|urg|critic/.test(n)) return 'alta';
  if (/baix|low/.test(n)) return 'baixa';
  return 'media';
}

// Status -> colunas do quadro: afazer | andamento | bloqueado | concluido.
function mapStatus(s) {
  var n = norm(s || '');
  if (/(conclu|feito|done|ok|entreg|finaliz)/.test(n)) return 'concluido';
  if (/(bloque|blocked|travad|impedid)/.test(n))       return 'bloqueado';
  if (/(andamen|fazendo|progress|execu|doing)/.test(n)) return 'andamento';
  // "atrasado" e "a fazer"/pendente caem em afazer (o atraso é sinalizado pelo prazo)
  return 'afazer';
}

// "80%", "0,8", 80 -> 80 (inteiro 0..100); '' -> null
function pctNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  var s = String(v).replace('%', '').replace(',', '.').trim();
  var n = Number(s); if (isNaN(n)) return null;
  if (n <= 1) n = n * 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Datas: aceita Date do Sheets ou texto; devolve dd/mm/aaaa (ou '' se vazio).
function fmtData(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
    return Utilities.formatDate(v, tz, 'dd/MM/yyyy');
  }
  return String(v).trim();
}

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
