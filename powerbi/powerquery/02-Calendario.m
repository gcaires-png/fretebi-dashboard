// =====================================================================
// Power Query (M) — Tabela Calendário (com Semana ISO)
// =====================================================================
// Tabela de datas necessária para os cálculos por semana/mês/ano.
// Cobre de 01/01/2025 até 31/12 do ano corrente + 1.
//
// COMO USAR:
//   1. Editor do Power Query > Nova Origem > Consulta em Branco.
//   2. Editor Avançado > cole este código.
//   3. Renomeie a consulta para:  Calendário
//   4. No modelo, marque como "Tabela de datas" (coluna Data) e crie o
//      relacionamento  Calendário[Data] 1 --- * Leads[Data].
// =====================================================================

let
    DataInicio = #date(2025, 1, 1),
    DataFim    = Date.EndOfYear(Date.AddYears(Date.From(DateTime.LocalNow()), 1)),
    Dias       = Duration.Days(DataFim - DataInicio) + 1,

    Lista = List.Dates(DataInicio, Dias, #duration(1,0,0,0)),
    Base  = Table.FromList(Lista, Splitter.SplitByNothing(), {"Data"}, null, ExtraValues.Error),
    Tipada = Table.TransformColumnTypes(Base, {{"Data", type date}}),

    Colunas = Table.AddColumn(Tipada, "Ano", each Date.Year([Data]), Int64.Type),
    C2 = Table.AddColumn(Colunas, "Mês Nº", each Date.Month([Data]), Int64.Type),
    C3 = Table.AddColumn(C2, "Mês", each Date.ToText([Data], "MMM", "pt-BR"), type text),
    C4 = Table.AddColumn(C3, "Ano-Mês", each Date.ToText([Data], "yyyy-MM"), type text),

    // Semana ISO: começa na segunda, semana 1 é a que contém a 1ª quinta-feira
    C5 = Table.AddColumn(C4, "Semana ISO", each
        let
            dia = Date.DayOfWeek([Data], Day.Monday),          // 0=seg .. 6=dom
            quinta = Date.AddDays([Data], 3 - dia),            // quinta desta semana
            ano1  = Date.Year(quinta),
            umJan = #date(ano1, 1, 1),
            semana = Number.RoundDown((Duration.Days(quinta - umJan) / 7)) + 1
        in semana, Int64.Type),

    C6 = Table.AddColumn(C5, "Ano ISO", each
        let
            dia = Date.DayOfWeek([Data], Day.Monday),
            quinta = Date.AddDays([Data], 3 - dia)
        in Date.Year(quinta), Int64.Type),

    // Rótulo ordenável: 2026-S31
    C7 = Table.AddColumn(C6, "Ano-Semana", each
        Text.From([Ano ISO]) & "-S" & Text.PadStart(Text.From([Semana ISO]), 2, "0"),
        type text),

    // Segunda-feira que inicia a semana (útil para eixos e tooltips)
    C8 = Table.AddColumn(C7, "Início da Semana", each
        Date.AddDays([Data], - Date.DayOfWeek([Data], Day.Monday)), type date),

    C9 = Table.AddColumn(C8, "Dia da Semana", each
        Date.ToText([Data], "ddd", "pt-BR"), type text),

    C10 = Table.AddColumn(C9, "Dia Semana Nº", each
        Date.DayOfWeek([Data], Day.Monday) + 1, Int64.Type)
in
    C10
