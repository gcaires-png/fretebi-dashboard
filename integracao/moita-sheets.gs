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

// "Tudo amarrado": o painel consolida a MASTER + as 7 planilhas por área.
// Cada área preenche a SUA planilha; o script junta tudo (união por ID — a
// MASTER tem prioridade quando o mesmo ID existe nos dois lugares).
var AGGREGATE_AREA_SHEETS = true;
var AREA_SHEETS = [
  { id: '1wGNS4OCxKnKLSAQexiZsm8jjBy4rebExfnXHGaGUwcY', area: 'adm',        gestor: 'José Adailton' },
  { id: '1qG7Y9ePYYIN2NqdcWN1d7UGT_jIStnF0qVoucCJZgl4', area: 'rh',         gestor: 'Karolay' },
  { id: '1zGSwGvLi7fCambcEdet-kk0MJUfl4rjM5hfTDV16Q0c', area: 'financeiro', gestor: 'Karolay (report)' },
  { id: '1lp2GptVdemAbsZuOk0zdG9TSoZI9L_7pI5-0c06wG0E', area: 'logistica',  gestor: 'José Adailton' },
  { id: '1PfBDA-ifWu2AjTpBsfOw30Fm4ctNP1IGueBnUgfgnn0', area: 'comercial',  gestor: 'José Adailton' },
  { id: '1_fhpDilvQ24SEUo_iG1PQHBf1C5Vqs6PDDOtpD161bM', area: 'marketing',  gestor: 'José Adailton' },
  { id: '1cTKs2_QtHVeO6fPGW1WBL289_iO4ffFOHYQn2PTfWDY', area: 'ti',         gestor: 'Gearlison' }
];

/* =========================== CONTROLE DE ACESSO ===========================
   O acesso é POR PESSOA (só quem é da equipe). Cada pessoa recebe um LINK com
   a SUA CHAVE (?key=...) e o servidor devolve SOMENTE o que ela pode ver.
   Cada área pode ter MAIS ou MENOS pessoas — você controla isso na aba "Acessos".

   ►► Preferencial: crie a aba "Acessos" na planilha MASTER com as colunas:
        Pessoa | Chave | Áreas | Financeiro
      - Áreas: lista separada por vírgula (adm, rh, financeiro, logistica,
        comercial, marketing, ti) ou "*" para todas.
      - Financeiro: sim/não (pode ver Contas a Pagar / dados financeiros).
      Ex.:  Jhennifer | jhe-9f3k | rh | não
            Karolay   | kar-7d21 | adm, rh, financeiro | sim
            Giovani   | gio-4b88 | financeiro | sim
            Diretoria | dir-1a90 | * | sim

   Se a aba "Acessos" não existir, cai no time-padrão abaixo (TROQUE as chaves).
   ========================================================================= */
var ACESSOS_DEFAULT = {
  'dir-TROQUE': { nome: 'Diretoria (Gearlison)', escopo: ['*'], fin: true },
  'jad-TROQUE': { nome: 'José Adailton (Gestor)', escopo: ['*'], fin: true },
  'kar-TROQUE': { nome: 'Karolay', escopo: ['adm', 'rh', 'financeiro'], fin: true },
  'jhe-TROQUE': { nome: 'Jhennifer', escopo: ['rh'], fin: false },
  'gio-TROQUE': { nome: 'Giovani', escopo: ['financeiro'], fin: true },
  'com-TROQUE': { nome: 'Comercial (Hudson/Anderson)', escopo: ['comercial'], fin: false },
  'mkt-TROQUE': { nome: 'Marketing', escopo: ['marketing'], fin: false },
  'moi-TROQUE': { nome: 'Moita (Logística/TI)', escopo: ['logistica', 'ti'], fin: false }
};
// Se true, sem chave válida NÃO devolve dados. Se false, modo aberto (só p/ teste).
var EXIGIR_CHAVE = true;

// Lê a aba "Acessos" (se existir) -> mapa chave:{nome,escopo,fin}.
function readAcessos(ss) {
  var rows = readTab(ss, 'Acessos');
  if (!rows.length) return null;
  var map = {};
  rows.forEach(function (r) {
    var chave = pick(r, ['chave', 'key', 'codigo', 'senha']);
    if (!chave) return;
    var areasTxt = pick(r, ['areas', 'area', 'escopo']) || '*';
    var escopo = areasTxt.indexOf('*') >= 0 ? ['*']
      : areasTxt.split(',').map(function (s) { return mapArea(s); }).filter(Boolean);
    var finTxt = norm(pick(r, ['financeiro', 'fin', 've_financeiro']));
    map[chave] = {
      nome: pick(r, ['pessoa', 'nome', 'responsavel']) || 'Acesso',
      escopo: escopo.length ? escopo : ['*'],
      fin: /sim|true|1|s$|yes/.test(finTxt)
    };
  });
  return map;
}

function resolveAcesso(key, ss) {
  var acessos = (ss && readAcessos(ss)) || ACESSOS_DEFAULT;
  var a = key && acessos[key];
  if (a) return { ok: true, nome: a.nome, escopo: a.escopo, fin: !!a.fin };
  if (!EXIGIR_CHAVE) return { ok: true, nome: 'Aberto', escopo: ['*'], fin: true };
  return { ok: false, nome: '', escopo: [], fin: false };
}

function doGet(e) {
  try {
    var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID)
                            : SpreadsheetApp.getActiveSpreadsheet();
    var key = (e && e.parameter && e.parameter.key) || '';
    var acc = resolveAcesso(key, ss);
    if (!acc.ok) {
      return json({ ok: true, acesso: { ok: false }, atividades: [] });
    }
    var ativ = buildAtividades(ss);
    if (acc.escopo.indexOf('*') < 0) {
      ativ = ativ.filter(function (a) { return acc.escopo.indexOf(a.area) >= 0; });
    }
    return json({
      ok: true,
      atualizado_em: new Date().toISOString(),
      acesso: acc,
      atividades: ativ
    });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  }
}

// Rode uma vez (menu Executar) para ver os links prontos de cada PESSOA no log.
function gerarLinks() {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var acessos = readAcessos(ss) || ACESSOS_DEFAULT;
  var base = 'https://gcaires-png.github.io/fretebi-dashboard/painel-gestao.html';
  var out = [];
  for (var k in acessos) {
    var a = acessos[k];
    var area = (a.escopo.length === 1 && a.escopo[0] !== '*') ? '&area=' + a.escopo[0] : '';
    out.push(a.nome + ': ' + base + '?key=' + encodeURIComponent(k) + area);
  }
  Logger.log(out.join('\n'));
  return out;
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
  var out = [], seen = {};
  // 1) MASTER (linhas com Área/Gestor/Subárea próprios)
  demandRows(ss).forEach(function (r, i) { pushAtiv(out, seen, toAtiv(r, i, null)); });
  // 2) Planilhas por área (cada uma preenche a sua)
  if (AGGREGATE_AREA_SHEETS) {
    AREA_SHEETS.forEach(function (cfg) {
      var sh; try { sh = SpreadsheetApp.openById(cfg.id); } catch (e) { return; }
      demandRows(sh).forEach(function (r, i) { pushAtiv(out, seen, toAtiv(r, i, cfg)); });
    });
  }
  return out;
}

// Converte uma linha em atividade. forced = {area,gestor} quando vem de uma
// planilha de área (que não tem colunas Área/Gestor).
function toAtiv(r, i, forced) {
  var areaTxt = pick(r, ['subarea', 'sub_area']) || pick(r, ['area']) || '';
  return {
    id: pick(r, ['id']) || ((forced ? forced.area.toUpperCase() + '-' : 'A') + (i + 1)),
    titulo: pick(r, ['demanda', 'tarefa', 'atividade', 'titulo']) || '',
    resp: pick(r, ['responsavel', 'executa', 'resp']) || '',
    gestor: pick(r, ['gestor']) || (forced ? forced.gestor : '') || '',
    area: forced ? forced.area : mapArea(areaTxt || 'geral'),
    prioridade: mapPrio(pick(r, ['prioridade', 'prio'])),
    abertura: fmtData(pickRaw(r, ['abertura', 'inicio'])),
    prazo: fmtData(pickRaw(r, ['prazo'])),
    conclusao: fmtData(pickRaw(r, ['conclusao', 'resolucao', 'data_conclusao', 'data_resolucao', 'concluido_em', 'fechamento', 'entregue_em'])),
    status: mapStatus(pick(r, ['status'])),
    pct: pctNum(pick(r, ['%_concluido', 'concluido', 'percentual', 'pct'])),
    obs: pick(r, ['proxima_acao', 'observacao', 'observacoes', 'obs', 'proxima_acao_/_observacao']) || ''
  };
}

// Adiciona ignorando linhas de template vazias; MASTER vence em IDs repetidos.
function pushAtiv(out, seen, a) {
  if (!a.titulo) return;
  var key = norm(a.id) || norm(a.titulo);
  if (seen[key] != null) return;
  seen[key] = out.length; out.push(a);
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

// Como pick(), mas preserva o valor bruto (ex.: Date) — usado para datas.
function pickRaw(obj, tokens) {
  var keys = Object.keys(obj);
  for (var t = 0; t < tokens.length; t++) {
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].indexOf(tokens[t]) !== -1) {
        var v = obj[keys[k]];
        if (v !== '' && v !== null && v !== undefined) return v;
      }
    }
  }
  return '';
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

/* ============ PREENCHER A MASTER a partir das planilhas de área ============
   Menu "Moita Rev1 ▸ Consolidar áreas na MASTER" (aparece ao abrir a planilha).
   Também pode virar automático: Acionadores ▸ adicionar ▸ consolidarMASTER ▸
   baseado em tempo (ex.: a cada hora). É seguro: só ACRESCENTA IDs novos. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Moita Rev1')
    .addItem('Consolidar áreas na MASTER', 'menuConsolidar')
    .addItem('Criar aba de Acessos (equipe)', 'menuCriarAcessos')
    .addSeparator()
    .addItem('Enviar feedback semanal AGORA', 'menuFeedback')
    .addItem('Ativar feedback automático (seg 8h)', 'criarTriggerSemanal')
    .addItem('Desativar feedback automático', 'removerTriggerSemanal')
    .addToUi();
}
function menuFeedback() {
  var n = enviarFeedbackSemanal();
  SpreadsheetApp.getUi().alert('Moita Rev1', 'Feedback enviado para ' + n + ' gestor(es).', SpreadsheetApp.getUi().ButtonSet.OK);
}
function menuConsolidar() {
  var n = consolidarMASTER();
  SpreadsheetApp.getUi().alert('Moita Rev1', n + ' demanda(s) nova(s) adicionada(s) à MASTER.', SpreadsheetApp.getUi().ButtonSet.OK);
}

// Cria a aba "Acessos" já preenchida com o time e CHAVES geradas aleatoriamente.
// Se a aba já existir, não sobrescreve (para não apagar suas edições).
function menuCriarAcessos() {
  var ui = SpreadsheetApp.getUi();
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Acessos')) {
    ui.alert('Moita Rev1', 'A aba "Acessos" já existe. Edite-a manualmente (ou apague antes de recriar).', ui.ButtonSet.OK);
    return;
  }
  var sh = ss.insertSheet('Acessos');
  sh.appendRow(['Pessoa', 'Chave', 'Áreas', 'Financeiro']);
  var time = [
    ['Diretoria (Gearlison)', '*', 'sim'],
    ['José Adailton', '*', 'sim'],
    ['Karolay', 'adm, rh, financeiro', 'sim'],
    ['Jhennifer', 'rh', 'não'],
    ['Giovani', 'financeiro', 'sim'],
    ['Hudson', 'comercial', 'não'],
    ['Anderson', 'comercial', 'não'],
    ['Marketing', 'marketing', 'não'],
    ['Moita (Log/TI)', 'logistica, ti', 'não']
  ];
  time.forEach(function (t) { sh.appendRow([t[0], gerarChave(t[0]), t[1], t[2]]); });
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f1f1ef');
  sh.autoResizeColumns(1, 4);
  ui.alert('Moita Rev1', 'Aba "Acessos" criada com o time e chaves geradas. Ajuste as pessoas se precisar, depois reimplante e rode "gerarLinks".', ui.ButtonSet.OK);
}
function gerarChave(nome) {
  var p = norm(nome).replace(/[^a-z]/g, '').slice(0, 3) || 'usr';
  var chars = 'abcdefghijkmnpqrstuvwxyz23456789', s = '';
  for (var i = 0; i < 6; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return p + '-' + s;
}

function consolidarMASTER() {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var sh = demandSheet(ss);
  var values = sh.getDataRange().getValues();
  var headers = values[0].map(norm), width = headers.length;
  var col = {
    id: hIdx(headers, ['id']), area: hIdx(headers, ['area']), demanda: hIdx(headers, ['demanda', 'tarefa']),
    resp: hIdx(headers, ['responsavel', 'executa']), gestor: hIdx(headers, ['gestor']),
    prio: hIdx(headers, ['prioridade']), abertura: hIdx(headers, ['abertura']), prazo: hIdx(headers, ['prazo']),
    status: hIdx(headers, ['status']), pct: hIdx(headers, ['concluido', 'percentual', 'pct']),
    obs: hIdx(headers, ['proxima_acao', 'observacao', 'obs'])
  };
  var existing = {};
  for (var i = 1; i < values.length; i++) { var id = norm(values[i][col.id]); if (id) existing[id] = true; }
  var added = 0;
  AREA_SHEETS.forEach(function (cfg) {
    var s2; try { s2 = SpreadsheetApp.openById(cfg.id); } catch (e) { return; }
    demandRows(s2).forEach(function (r, i) {
      var a = toAtiv(r, i, cfg);
      var key = norm(a.id);
      if (!a.titulo || existing[key]) return;
      existing[key] = true;
      var row = new Array(width).fill('');
      set(row, col.id, a.id); set(row, col.area, AREA_NOME[a.area] || a.area); set(row, col.demanda, a.titulo);
      set(row, col.resp, a.resp); set(row, col.gestor, a.gestor); set(row, col.prio, a.prioridade);
      set(row, col.abertura, a.abertura); set(row, col.prazo, a.prazo); set(row, col.status, STATUS_LABEL[a.status] || a.status);
      set(row, col.pct, a.pct != null ? a.pct + '%' : ''); set(row, col.obs, a.obs);
      sh.appendRow(row); added++;
    });
  });
  return added;
}

var AREA_NOME = { adm: 'Administrativo', rh: 'RH', financeiro: 'Financeiro', logistica: 'Logística', comercial: 'Comercial', marketing: 'Marketing', ti: 'TI/DEV', geral: 'Geral' };
var STATUS_LABEL = { afazer: 'A fazer', andamento: 'Em andamento', bloqueado: 'Bloqueado', concluido: 'Concluído' };
function hIdx(headers, tokens) { for (var t = 0; t < tokens.length; t++) for (var k = 0; k < headers.length; k++) if (headers[k].indexOf(tokens[t]) !== -1) return k; return -1; }
function set(row, idx, val) { if (idx >= 0) row[idx] = val; }
function demandSheet(ss) {
  var names = ['Atividades', 'MASTER', 'Master', 'Demandas', 'Controle'];
  for (var i = 0; i < names.length; i++) { var sh = ss.getSheetByName(names[i]); if (sh && sh.getLastRow() > 1) return sh; }
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) if (sheets[j].getLastRow() > 1) return sheets[j];
  return ss.getSheets()[0];
}

/* ==================== FEEDBACK SEMANAL AOS GESTORES ====================
   Envia por e-mail, toda semana, um resumo da equipe de cada gestor:
   demandas, concluídas, atrasadas, TEMPO DE RESPOSTA médio, e o detalhe por
   pessoa. Rode "Ativar feedback automático" (menu) para agendar toda segunda.

   ►► Preencha os e-mails dos gestores em GESTOR_EMAIL. Sem e-mail cadastrado,
      o relatório daquele gestor vai para FALLBACK_EMAIL. */
var FALLBACK_EMAIL = 'gcaires@videltel.com.br';
var GESTOR_EMAIL = {
  'jose adailton': '',   // TODO: e-mail do José Adailton
  'karolay': '',         // TODO: e-mail da Karolay
  'gearlison': ''        // TODO: e-mail do Gearlison
};
function emailDoGestor(nome) {
  var n = norm(nome).replace(/_/g, ' ').replace(/\(.*\)/, '').trim();
  for (var k in GESTOR_EMAIL) { if (n.indexOf(k) >= 0 && GESTOR_EMAIL[k]) return GESTOR_EMAIL[k]; }
  return FALLBACK_EMAIL;
}
function gsParse(s) {
  if (!s) return null;
  var m = String(s).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return null;
  var y = +m[3]; if (y < 100) y += 2000;
  return new Date(y, +m[2] - 1, +m[1]);
}
function gsDias(d1, d2) { var a = gsParse(d1), b = gsParse(d2); if (!a || !b) return null; return Math.round((b - a) / 86400000); }
function gsTempoResp(a) { if (a.status !== 'concluido') return null; var d = gsDias(a.abertura, a.conclusao); if (d == null) d = gsDias(a.abertura, a.prazo); return (d != null && d >= 0) ? d : null; }
function gsAging(a) { if (a.status === 'concluido') return null; var b = gsParse(a.abertura); if (!b) return null; var t = new Date(); t.setHours(0, 0, 0, 0); var d = Math.round((t - b) / 86400000); return d >= 0 ? d : null; }
function gsLate(a) { if (a.status === 'concluido') return false; var p = gsParse(a.prazo); if (!p) return false; var t = new Date(); t.setHours(0, 0, 0, 0); return p < t; }

function enviarFeedbackSemanal() {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var ativ = buildAtividades(ss);
  var byG = {};
  ativ.forEach(function (a) { var g = a.gestor || '—'; (byG[g] = byG[g] || []).push(a); });
  var enviados = 0;
  for (var g in byG) {
    var email = emailDoGestor(g);
    if (!email) continue;
    MailApp.sendEmail({ to: email, subject: 'Feedback semanal — equipe ' + g + ' (Videl)', htmlBody: montarEmailFeedback(g, byG[g]) });
    enviados++;
  }
  return enviados;
}

function montarEmailFeedback(gestor, list) {
  var total = list.length;
  var concl = list.filter(function (a) { return a.status === 'concluido'; }).length;
  var atras = list.filter(gsLate);
  var trs = list.map(gsTempoResp).filter(function (x) { return x != null; });
  var tMed = trs.length ? Math.round(trs.reduce(function (s, x) { return s + x; }, 0) / trs.length) + 'd' : '—';
  var byP = {};
  list.forEach(function (a) {
    var r = a.resp || '—'; var m = byP[r] || (byP[r] = { resp: r, total: 0, concl: 0, atras: 0, agSum: 0, agN: 0, trSum: 0, trN: 0 });
    m.total++; if (a.status === 'concluido') m.concl++; if (gsLate(a)) m.atras++;
    var ag = gsAging(a); if (ag != null) { m.agSum += ag; m.agN++; }
    var tr = gsTempoResp(a); if (tr != null) { m.trSum += tr; m.trN++; }
  });
  var linhas = Object.keys(byP).map(function (r) {
    var m = byP[r];
    var tm = m.trN ? Math.round(m.trSum / m.trN) + 'd' : '—';
    var ag = m.agN ? Math.round(m.agSum / m.agN) + 'd' : '—';
    return '<tr><td style="padding:6px;border-bottom:1px solid #eee">' + m.resp + '</td>' +
      '<td align="center" style="padding:6px;border-bottom:1px solid #eee">' + m.total + '</td>' +
      '<td align="center" style="padding:6px;border-bottom:1px solid #eee">' + m.concl + '</td>' +
      '<td align="center" style="padding:6px;border-bottom:1px solid #eee;color:' + (m.atras ? '#c0392b' : '#999') + '">' + m.atras + '</td>' +
      '<td align="center" style="padding:6px;border-bottom:1px solid #eee">' + tm + '</td>' +
      '<td align="center" style="padding:6px;border-bottom:1px solid #eee">' + ag + '</td></tr>';
  }).join('');
  function card(l, v, c) { return '<td style="padding:12px 16px;border:1px solid #eaeaea;border-radius:8px;text-align:center"><div style="font-size:24px;font-weight:bold;color:' + (c || '#333') + '">' + v + '</div><div style="font-size:11px;color:#777">' + l + '</div></td>'; }
  return '<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:660px">' +
    '<h2 style="color:#c12026;margin:0 0 2px">Feedback semanal — ' + gestor + '</h2>' +
    '<p style="color:#777;margin:0 0 16px;font-size:13px">Videl Transporte &amp; Logística · Controle de Demandas</p>' +
    '<table cellspacing="8"><tr>' + card('Demandas', total) + card('Concluídas', concl, '#0a7d34') + card('Atrasadas', atras.length, atras.length ? '#c0392b' : '#333') + card('Tempo de resposta', tMed, '#1f6feb') + '</tr></table>' +
    '<h3 style="margin:18px 0 6px">Por pessoa</h3>' +
    '<table style="border-collapse:collapse;width:100%;font-size:13px"><tr style="background:#f5f5f3;text-align:left">' +
    '<th style="padding:6px">Responsável</th><th style="padding:6px">Demandas</th><th style="padding:6px">Concluídas</th><th style="padding:6px">Atrasadas</th><th style="padding:6px">Tempo méd.</th><th style="padding:6px">Em aberto</th></tr>' +
    linhas + '</table>' +
    (atras.length ? '<p style="margin-top:14px;color:#c0392b"><b>⚠ Atenção:</b> ' + atras.length + ' demanda(s) atrasada(s) — priorizar esta semana.</p>' : '') +
    '<p style="margin-top:18px"><a href="https://gcaires-png.github.io/fretebi-dashboard/painel-gestao.html" style="background:#c12026;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Abrir o painel</a></p>' +
    '<p style="color:#aaa;font-size:11px;margin-top:16px">Enviado automaticamente pelo Moita Rev1 · tempo de resposta = dias entre abertura e conclusão (aprox. pelo prazo até haver data de resolução).</p>' +
    '</div>';
}

function criarTriggerSemanal() {
  removerTriggerSemanal();
  ScriptApp.newTrigger('enviarFeedbackSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  try { SpreadsheetApp.getUi().alert('Moita Rev1', 'Feedback automático ativado: toda segunda-feira às 8h.', SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) {}
}
function removerTriggerSemanal() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'enviarFeedbackSemanal') ScriptApp.deleteTrigger(t); });
}

/* ------------------------------ Resposta -------------------------------- */
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
