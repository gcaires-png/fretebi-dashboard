# 03 — Fatura proforma — modelo com os dados corretos (para a XSD emitir)

**Problema no dossiê atual:** a proforma da XSD está em nome de **Factiun Sun S.L. (Espanha)**, FOB Qingdao, 5.040 unidades, junho/2026, para um projeto espanhol. Não representa a importação brasileira e será devolvida (a pleiteante é a Factiun Sun BR).

## Dados que a nova proforma precisa conter

| Campo | Conteúdo |
|---|---|
| Emitente | XSD Industrial — [razão social completa, endereço, China] |
| Comprador / importador (**Buyer / Consignee**) | **Factiun Sun BR Ltda** — CNPJ 64.947.469/0001-15 — Rua dos Franciscanos, Galpão 8, Loteamento Dom Avelar, Pirajá, Salvador-BA, CEP 41.315-000, Brasil |
| Destino | Brasil — porto de Recife (alternativa: Salvador) |
| Incoterm | FOB Qingdao (ou o Incoterm da operação real) |
| Descrição da mercadoria | Hydraulic dampers for photovoltaic solar trackers — damping force 3,300 to 8,650 N — nominal stroke 381 mm — minimum tensile strength 20 kN — operating range -20 °C to +60 °C — anticorrosive coating tested per ASTM B117 |
| Código HS | 8479.90 (NCM brasileira 8479.90.90) |
| Modelo do fabricante | [código XSD] (a marca/modelo pode aparecer na proforma; não pode aparecer na descrição do Ex) |
| Quantidade | [unidades do projeto Boa Hora — 1.709 seguidores × amortecedores por seguidor] |
| Preço unitário e total | [USD] — referência do projeto: R$ 636 mil no ano 1 |
| Prazo de embarque | [11/2026 a 02/2027, conforme decisão da Factiun sobre o 1º embarque] |
| Condições de pagamento | [conforme negociação] |
| Validade da proforma | ≥ 6 meses (cobrir o período de análise do pleito) |
| Data e assinatura do fornecedor | [ ] |

## Tradução

Proforma em inglês exige **tradução simples para o português** (pode ser feita pela Videl), anexada no mesmo PDF: `AMORT_03_Fatura_Proforma_e_Traducao.pdf`.

## Conferência antes do upload
- [ ] Comprador = Factiun Sun BR Ltda (nunca Factiun Sun S.L.)
- [ ] Destino Brasil
- [ ] É **proforma**, não fatura comercial emitida (sem número de invoice de venda concluída)
- [ ] Descrição compatível com o Ex pretendido e com o catálogo
- [ ] Quantidade e valor coerentes com o projeto de investimento (doc. 06)
