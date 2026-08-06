# Padrão: Programação de Frete — Comercial → Logística

**Vigência:** 05/08/2026 · **Aprovação:** Gearlison Caires · **Canal:** sempre por e-mail

## Regras

1. Toda programação de frete vai por **e-mail** para a logística, com Gearlison, Comercial e Marketing e em cópia.
2. Assunto padronizado: `PROGRAMAÇÃO DE FRETE | [CLIENTE] | [ORIGEM] x [DESTINO] | Coleta [DATA]`
3. Programação **incompleta volta ao comercial** em até 10 minutos — não entra na fila.
4. Alvo de motorista **nunca abaixo do Piso ANTT** (Lei 13.703/18).
5. A logística valida a margem: custo motorista entre **60% e 62%** do frete de venda.

## Campos obrigatórios (★)

| # | Campo | Obrig. |
|---|---|---|
| 1 | Cliente (razão social) | ★ |
| 2 | Tomador do serviço + CNPJ | ★ |
| 3 | Origem (cidade/UF + endereço de coleta) | ★ |
| 4 | Destino (cidade/UF + endereço de entrega) | ★ |
| 5 | Produto | ★ |
| 6 | Peso e volumes | ★ |
| 7 | **Valor da NF (mercadoria)** | ★ |
| 8 | Veículo exigido | ★ |
| 9 | **FRETE DE VENDA (o que o cliente paga)** | ★ |
| 10 | Piso ANTT da rota | ★ |
| 11 | Alvo motorista (≥ piso ANTT) | ★ |
| 12 | Teto máximo sem aprovação comercial | ★ |
| 13 | Data/janela de coleta | ★ |
| 14 | Prazo/data de entrega | ★ |
| 15 | Condição de faturamento | ★ |
| 16 | Pedágio (quem paga / estimativa) | ★ |
| 17 | Carga/descarga (quem executa) | ★ |
| 18 | Seguro / gerenciamento de risco | ★ |
| 19 | CIOT | ★ |
| 20 | Observações (pernoite, espera, restrições) | opcional |

## Validações da logística no recebimento

1. Alvo motorista ≥ Piso ANTT
2. Custo motorista ÷ frete de venda dentro de 60–62% (63–65% = renegociar; >65% = escalar)
3. Valor da NF presente (seguro + gerenciamento de risco)
4. Prazo viável: coleta em D exige motorista fechado até D-1 às 18h

## Modelo de e-mail

```
Assunto: PROGRAMAÇÃO DE FRETE | [CLIENTE] | [Origem/UF] x [Destino/UF] | Coleta [DD/MM]

🚛 PROGRAMAÇÃO DE FRETE

Cliente: [razão social]
Tomador: [nome — CNPJ]
Origem: [cidade/UF — endereço completo]
Destino: [cidade/UF — endereço completo]
Produto: [descrição]
Peso/Volumes: [kg / volumes]
Valor da NF: R$ [obrigatório]
Veículo: [tipo]

💵 FRETE DE VENDA: R$ [obrigatório]
💰 Piso ANTT: R$ [valor]
🤝 Alvo motorista: R$ [faixa ≥ piso]
🚨 Teto sem aprovação comercial: R$ [valor]

📅 Coleta: [data e janela]
📅 Entrega: [data]
🧾 Faturamento: [prazo]
🛣️ Pedágio: [quem paga / estimativa]
📦 Carga/descarga: [quem executa]
🛡️ Seguro/GR: [coberturas / exigências]
📄 CIOT: [obrigatório/não se aplica]

📌 Observações: [pernoite, espera, restrições de rota]
```
