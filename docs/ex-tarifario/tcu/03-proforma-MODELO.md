# 03 — Fatura proforma — modelo com os dados corretos (para a IED emitir)

**Problema no dossiê atual:** o arquivo "proforma" da TCU é a **fatura real nº SI26-0666**, de **2 unidades**, EXW Navarra, com **IVA espanhol de 21%**, emitida para a Factiun Sun S.L. Representa uma venda concluída na Espanha, não a importação brasileira. Será devolvida.

## Dados que a nova proforma precisa conter

| Campo | Conteúdo |
|---|---|
| Emitente | IED — [razão social completa, endereço, Navarra, Espanha] |
| Comprador / importador (**Buyer / Consignee**) | **Factiun Sun BR Ltda** — CNPJ 64.947.469/0001-15 — Rua dos Franciscanos, Galpão 8, Loteamento Dom Avelar, Pirajá, Salvador-BA, CEP 41.315-000, Brasil |
| Destino | Brasil — porto de Recife (alternativa: Salvador) |
| Incoterm | FOB Valência (ou o Incoterm da operação real) — **sem IVA** (exportação) |
| Descrição da mercadoria | Electronic control units for photovoltaic solar trackers, with integrated sun-tracking and backtracking algorithms for sloped terrain, Zigbee and Bluetooth Low Energy wireless and RS485 serial communication, over-the-air firmware update, IP65/NEMA 3R protection, per IEC 62817 |
| Código HS | 8479.90 (NCM brasileira 8479.90.90) — *ajustar para 8517.62 apenas se o parecer do despachante mudar a NCM* |
| Modelo do fabricante | [código IED] (pode constar na proforma) |
| Quantidade | [unidades do projeto Boa Hora — 1.709 seguidores × TCUs por seguidor] |
| Preço unitário e total | [EUR/USD] — referência do projeto: R$ 2,76 mi no ano 1 |
| Prazo de embarque | [11/2026 a 02/2027, conforme decisão da Factiun sobre o 1º embarque] |
| Condições de pagamento | [conforme negociação] |
| Validade da proforma | ≥ 6 meses |
| Data e assinatura do fornecedor | [ ] |

## Tradução
Proforma em inglês ou espanhol exige tradução simples para o português no mesmo PDF: `TCU_03_Fatura_Proforma_e_Traducao.pdf`.

## Conferência antes do upload
- [ ] Comprador = Factiun Sun BR Ltda (nunca Factiun Sun S.L.)
- [ ] Destino Brasil; sem IVA
- [ ] É **proforma** (não a fatura SI26-0666)
- [ ] Quantidade compatível com o projeto (não 2 unidades)
- [ ] HS/NCM igual ao dos demais documentos do processo
