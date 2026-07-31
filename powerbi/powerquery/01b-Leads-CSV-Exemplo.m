// =====================================================================
// Power Query (M) — Fonte ALTERNATIVA: CSV de exemplo (offline)
// =====================================================================
// Use esta consulta para MONTAR e TESTAR o modelo sem depender da API.
// Depois é só trocar a origem pela consulta "01-Leads-Videl.m" — os
// nomes de coluna são IDÊNTICOS, então as medidas DAX continuam valendo.
//
// COMO USAR:
//   1. Editor do Power Query > Nova Origem > Consulta em Branco.
//   2. Editor Avançado > cole este código.
//   3. Ajuste CaminhoCSV para o local do arquivo no seu PC.
//   4. Renomeie a consulta para:  Leads
// =====================================================================

let
    // Ajuste para o caminho do arquivo na sua máquina:
    CaminhoCSV = "C:\Videl\powerbi\dados-exemplo\leads-exemplo.csv",

    Fonte = Csv.Document(
        File.Contents(CaminhoCSV),
        [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]
    ),
    Cabecalho = Table.PromoteHeaders(Fonte, [PromoteAllScalars=true]),

    Tipada = Table.TransformColumnTypes(Cabecalho, {
        {"proposta_id", type text}, {"cliente", type text},
        {"origem_cidade", type text}, {"origem_uf", type text},
        {"destino_cidade", type text}, {"destino_uf", type text},
        {"carga", type text}, {"valor", type number},
        {"data_abertura", type date}, {"status", type text},
        {"responsavel", type text}
    }),

    // status_padrao (mesma regra da fonte da API)
    ComStatus = Table.AddColumn(Tipada, "status_padrao", each
        let s = Text.Lower(Text.From([status]))
        in  if Text.Contains(s, "aprov") then "Aprovado"
            else if Text.Contains(s, "perd") or Text.Contains(s, "cancel") then "Perdido"
            else if Text.Contains(s, "negoci") then "Em negociação"
            else "Novo",
        type text
    ),

    Renomeada = Table.RenameColumns(ComStatus, {
        {"proposta_id","Proposta ID"},{"cliente","Cliente"},
        {"origem_cidade","Origem"},{"origem_uf","UF Origem"},
        {"destino_cidade","Destino"},{"destino_uf","UF Destino"},
        {"carga","Carga"},{"valor","Valor"},
        {"data_abertura","Data"},{"status_padrao","Status"},
        {"responsavel","Responsável"}
    }),
    Final = Table.SelectColumns(Renomeada, {
        "Proposta ID","Cliente","Origem","UF Origem","Destino","UF Destino",
        "Carga","Valor","Data","Status","Responsável"
    })
in
    Final
