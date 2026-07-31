// =====================================================================
// Power Query (M) — Fonte: Leads / Propostas da Plataforma Videl
// =====================================================================
// Conecta na API da Videl (endpoint /quotes = leads/cotações/propostas)
// através do proxy Cloudflare já existente no repositório (pasta /proxy).
//
// COMO USAR NO POWER BI DESKTOP:
//   1. Página Inicial > Transformar dados > abre o Editor do Power Query.
//   2. Página Inicial > Nova Origem > Consulta Nula (ou Consulta em Branco).
//   3. Exibir > Editor Avançado > cole TODO este código.
//   4. Renomeie a consulta para:  Leads
//   5. Ajuste o parâmetro ProxyBase abaixo para a URL do SEU proxy.
//   6. Página Inicial > Fechar e Aplicar.
//
// O proxy trata login/token e CORS no servidor — as credenciais da Videl
// NUNCA passam pelo Power BI. Veja /proxy/README.md para publicar o Worker.
// =====================================================================

let
    // ----- CONFIGURAÇÃO -----------------------------------------------
    // Troque pela URL do seu Cloudflare Worker (termina SEM barra):
    ProxyBase = "https://moita-videl-proxy.SEU-SUBDOMINIO.workers.dev",

    // Endpoint de propostas/cotações. limit alto para trazer o histórico.
    Url = ProxyBase & "/quotes?page=1&limit=1000",

    // ----- LEITURA DA API ---------------------------------------------
    Fonte = Json.Document(Web.Contents(Url)),

    // A API devolve { data: [ ... ] }. Se vier lista pura, usa direto.
    Registros =
        if Value.Is(Fonte, type record) and Record.HasFields(Fonte, "data")
            then Fonte[data]
        else if Value.Is(Fonte, type list)
            then Fonte
        else {},

    TabelaBruta = Table.FromList(
        Registros, Splitter.SplitByNothing(), {"registro"}, null, ExtraValues.Error
    ),
    Expandida = Table.ExpandRecordColumn(
        TabelaBruta, "registro",
        {"id", "cliente_nome", "cliente", "origem", "destino", "carga",
         "tipo_carga", "valor", "valor_frete", "created_at", "data",
         "status", "responsavel", "vendedor"},
        {"id", "cliente_nome", "cliente", "origem", "destino", "carga",
         "tipo_carga", "valor", "valor_frete", "created_at", "data",
         "status", "responsavel", "vendedor"}
    ),

    // origem/destino chegam como registros aninhados {cidade, uf}
    ExpOrigem = Table.ExpandRecordColumn(
        Expandida, "origem",
        {"cidade", "uf"}, {"origem_cidade", "origem_uf"}
    ),
    ExpDestino = Table.ExpandRecordColumn(
        ExpOrigem, "destino",
        {"cidade", "uf"}, {"destino_cidade", "destino_uf"}
    ),

    // ----- NORMALIZAÇÃO (nomes flexíveis: usa o 1º campo preenchido) ---
    Normalizada = Table.AddColumn(ExpDestino, "linha", each [
        proposta_id    = try Text.From([id]) otherwise null,
        cliente        = if [cliente_nome] <> null then [cliente_nome] else [cliente],
        origem_cidade  = [origem_cidade],
        origem_uf      = [origem_uf],
        destino_cidade = [destino_cidade],
        destino_uf     = [destino_uf],
        carga          = if [carga] <> null then [carga] else [tipo_carga],
        valor          = if [valor] <> null then [valor] else [valor_frete],
        data_abertura  = if [created_at] <> null then [created_at] else [data],
        status         = [status],
        responsavel    = if [responsavel] <> null then [responsavel] else [vendedor]
    ]),
    SoLinha = Table.SelectColumns(Normalizada, {"linha"}),
    Achatada = Table.ExpandRecordColumn(
        SoLinha, "linha",
        {"proposta_id","cliente","origem_cidade","origem_uf","destino_cidade",
         "destino_uf","carga","valor","data_abertura","status","responsavel"}
    ),

    // ----- TIPAGEM E PADRONIZAÇÃO -------------------------------------
    // data_abertura pode vir "2026-07-31" ou "2026-07-31T09:12:00Z"
    ComData = Table.AddColumn(
        Achatada, "Data",
        each try Date.From(DateTime.From(Text.Start(Text.From([data_abertura]), 10)))
             otherwise try Date.From([data_abertura]) otherwise null,
        type date
    ),
    ComValor = Table.TransformColumnTypes(ComData, {{"valor", type number}}),

    // status_padrao: mapeia sinônimos para 4 categorias fixas
    ComStatus = Table.AddColumn(ComValor, "status_padrao", each
        let s = Text.Lower(Text.From([status]))
        in  if Text.Contains(s, "aprov") or Text.Contains(s, "ganho") or Text.Contains(s, "fech") then "Aprovado"
            else if Text.Contains(s, "perd") or Text.Contains(s, "cancel") then "Perdido"
            else if Text.Contains(s, "negoci") or Text.Contains(s, "andam") then "Em negociação"
            else "Novo",
        type text
    ),

    Final = Table.SelectColumns(ComStatus, {
        "proposta_id","cliente","origem_cidade","origem_uf",
        "destino_cidade","destino_uf","carga","valor",
        "Data","status_padrao","responsavel"
    }),
    Renomeada = Table.RenameColumns(Final, {
        {"proposta_id","Proposta ID"},{"cliente","Cliente"},
        {"origem_cidade","Origem"},{"origem_uf","UF Origem"},
        {"destino_cidade","Destino"},{"destino_uf","UF Destino"},
        {"carga","Carga"},{"valor","Valor"},
        {"status_padrao","Status"},{"responsavel","Responsável"}
    })
in
    Renomeada
