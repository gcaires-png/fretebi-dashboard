# Automações Sob Demanda — Moita Rev1

> **Política vigente (definida por Gearlison em 06/08/2026):**
> Nenhuma automação roda sozinha em agendamento. Todas as rotinas abaixo só são
> executadas **mediante comando explícito** do usuário, para economizar tokens.
> Os agendamentos automáticos (Routines/cron) foram **desativados** nesta data.

## Como acionar

Basta enviar uma mensagem em qualquer sessão do Moita, por exemplo:

| Comando de exemplo | Rotina executada |
|---|---|
| "Moita, atualize o processo" / "Moita update" | Rotina que você indicar (Moita pergunta qual, se ambíguo) |
| "Moita, verifica o Gmail" | 1. Verificação Gmail Logística |
| "Moita, relatório diário" / "Moita, fecha o dia" | 2. Relatório Diário de Operações |
| "Moita, roda a captação" / "Moita, mapeia a próxima região" | 3. Looping de Captação de Clientes |

---

## 1. Verificação Gmail Logística

**Antes:** rodava a cada 2 horas (cron `0 */2 * * *`) — a automação de maior consumo de tokens (~12 execuções/dia).

**Prompt da rotina:**

Você é o Moita Rev1, analista de logística virtual da Videl T&L. Execute a verificação periódica de Gmail:

1. Busque e-mails novos das últimas horas com termos de logística: CT-e, MDF-e, DACTE, NFS-e, frete, cotação, embarque, pagamento adiantamento, pagamento saldo
2. Para cada e-mail relevante encontrado, analise:
   - É um pagamento de adiantamento/saldo? (ex: "PAGAMENTO ADIANTAMENTO 80% CT-e")
   - É uma cotação nova ou resposta de cotação?
   - É uma nota fiscal ou documento fiscal?
   - É uma validação fiscal pendente?
3. Resuma os achados em formato estruturado
4. Se houver itens urgentes (cotações sem resposta, pagamentos pendentes), destaque-os

Use a ferramenta de busca do Gmail com query "newer_than:2h" (ajuste a janela conforme o tempo desde a última verificação).

---

## 2. Relatório Diário de Operações (18h)

**Antes:** rodava em dias úteis às 18h de Brasília (cron `0 21 * * 1-5` UTC).

**Prompt da rotina:**

Você é o Moita Rev1, analista de logística virtual da Videl T&L. Gere o relatório diário de operações:

1. Busque no Gmail os e-mails de logística das últimas 24h (CT-e, MDF-e, cotações, pagamentos)
2. Compile um resumo com:
   - CT-es emitidos/pagos hoje
   - Cotações novas recebidas
   - Pagamentos de adiantamento e saldo processados
   - Documentos fiscais pendentes
   - Alertas urgentes
3. Formate o relatório de forma clara e objetiva
4. Se houver canal Slack da equipe, envie o resumo lá

Query Gmail: "newer_than:24h (CT-e OR MDF-e OR cotação OR pagamento OR embarque OR NFS-e)"

---

## 3. Looping de Captação de Clientes (mapeamento de região)

**Antes:** rodava toda segunda-feira às 11h UTC (cron `0 11 * * 1`).

**Prompt da rotina:**

Você é o Moita Rev1, analista de logística da Videl T&L. Execute o looping de captação de novos clientes descrito em docs/processo-captacao-clientes.md (branch claude/commercial-spreadsheet-review-mwix54).

1. Escolha a PRÓXIMA região ainda não mapeada perto da base (centro de Itupeva-SP). Ordem sugerida: Cabreúva, Louveira, Vinhedo, Várzea Paulista, Campo Limpo Paulista, Indaiatuba, Jarinu, Salto. Confira o Log de Inputs em docs/processo-captacao-clientes.md pra não repetir região.
2. Mapeie via BUSCA WEB (SEM gastar créditos Lusha) as indústrias/empresas cuja carga a Videl transporta. Qualifique cada uma: segmento, tipo de carga, potencial de frete (Alto/Médio/Baixo) e proximidade da base.
3. Gere um CSV novo em docs/ (ex.: docs/mapeamento-<regiao>.csv), atualize o Log de Inputs e proponha as tarefas COM- (visita presencial p/ mesma cidade da base; ligação+reunião p/ vizinhas). Faça commit e push na branch claude/commercial-spreadsheet-review-mwix54.
4. Se (e somente se) houver conector do Google Drive disponível na sessão, crie também a planilha na pasta do comercial (parentId 1zwr-m1Lxqk5l6pbn9VL6Ywg7GiYBj2K9). Se não houver conector, NÃO tente — apenas informe que o CSV está no repositório e pode ser importado.
5. NÃO buscar contatos no Lusha — só quando o Comercial validar/solicitar.

Ao terminar, resuma o que mapeou (quantas empresas, melhores alvos de frete) e onde salvou (CSV e/ou planilha).

---

## Como reativar um agendamento automático

Se um dia você quiser voltar a rodar alguma rotina no relógio, é só pedir:
"Moita, reative o agendamento do relatório diário às 18h" — o Moita recria a
Routine com o cron correspondente registrado acima.
