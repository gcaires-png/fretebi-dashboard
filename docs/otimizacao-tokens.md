# Otimização de consumo de tokens

Diagnóstico feito em 17/08/2026 a partir do transcript real de sessão
(`~/.claude/projects/-home-user/*.jsonl`, campo `usage`).

## O problema

O prompt de sistema media **60.649 tokens** antes de qualquer mensagem do usuário. Ou seja,
mandar "oi" já custava ~61k tokens de entrada. Numa sessão de 20 turnos, ~1,3 milhão de tokens
só de overhead. Um setup enxuto fica entre 10k e 20k.

Composição estimada:

| Componente | Custo por mensagem |
|---|---|
| 10 servidores MCP (~325 ferramentas) | ~20–28k |
| Descrições das skills sincronizadas | ~3,7k |
| `CLAUDE.md` | ~3,2k |
| Ferramentas nativas (Workflow, Artifact, Agent) | ~10–12k |

Somado a isso, `painel-gestao.html` tinha 394 KB — ~112k tokens se lido inteiro, quase metade
da janela de contexto num único `Read`.

## Feito neste repositório

### 1. Logo duplicado em base64 removido do painel

O mesmo PNG (635×600, 123 KB) estava embutido **duas vezes** em `painel-gestao.html`: uma como
favicon (`<link rel="icon">`) e outra como `<img>` da logo. Eram 327.872 dos 394.310 bytes —
**83% do arquivo era o mesmo logo, duplicado**.

Extraído para `assets/logo-videl.png` e referenciado por caminho relativo.

| | Antes | Depois |
|---|---|---|
| `painel-gestao.html` | 394.310 bytes | 65.819 bytes (-83%) |
| Custo de ler o arquivo | ~112k tokens | ~19k tokens |

Ganho colateral: o navegador passa a baixar o logo **uma vez** e cacheá-lo, em vez de receber
164 KB inline duas vezes a cada carregamento da página.

`.github/workflows/deploy-pages.yml` ganhou `cp -r assets _site/assets` — sem `|| true`, de
propósito: se `assets/` sumir, o build falha em vez de publicar a página com o logo quebrado.

### 2. `CLAUDE.md` enxugado

De 11.285 para 2.449 bytes (-78%). Ficaram no arquivo só identidade, a regra dos 60–62%, a
regra de rascunho de documento, o fluxo em 7 linhas e os links de plataforma.

O detalhamento (fases, campos do CT-e, raios de busca de motorista, procedimentos passo a passo,
tabela de MCP) foi para `docs/fluxo-operacional.md`, que só é lido quando a tarefa é operacional.

## Pendente — ação na sua conta

Estes itens não podem ser aplicados a partir do repositório.

### 3. Desconectar MCP servers não usados — maior ganho isolado

Estimativa: **15–25k tokens por mensagem.**

Estão conectados: Canva, Gmail, Google Calendar, Google Drive, Banco PJ, GitHub, Lusha, Miro,
Slack e Zapier. Cada um carrega a lista de ferramentas em toda mensagem, e GitHub, Banco PJ e
Zapier ainda injetam blocos de instruções próprios.

Sugestão: manter Gmail, Drive, Calendar, GitHub e Zapier. Desconectar Canva, Miro, Lusha e
Slack, reativando pontualmente quando precisar.

### 4. Encurtar as descrições das skills

Economia medida: **6.534 caracteres ≈ 1.867 tokens por mensagem** (-71%).

O princípio: só a **descrição** é carregada em toda mensagem. O **corpo** do `SKILL.md` só entra
quando a skill dispara — ou seja, é gratuito até ser usado. Currículo do agente ("Ex-FedEx/JSL,
Matemática (USP)"), metodologias e listas longas de sinônimos pertencem ao corpo, não à descrição.
Uma descrição de 200 caracteres dispara tão bem quanto uma de 950.

Textos prontos para colar (as skills são sincronizadas da conta, então a edição precisa ser feita
lá — editar os arquivos locais seria sobrescrito na próxima sync):

**g0-secretaria** (627 → 215)
```
G0-SEC — Secretária Executiva do CEO. Prioriza e-mails, reuniões, decisões pendentes e demandas dos agentes G1-G10; entrega briefing diário. Ative com "organiza meu dia", "o que tenho pra fazer" ou "fala com a SEC".
```

**g1-coo** (695 → 216)
```
G1 — COO da Videl T&L. Operações e logística rodoviária: fretes, motoristas, rotas, KPIs (OTD, custo/km, OTIF), ocorrências, sinistros, monitoramento de carga, CT-e, RNTRC. Ative com "fala com o G1" ou "chama o COO".
```

**g2-cmo** (755 → 225)
```
G2 — CMO da Videl T&L. Marketing B2B de logística: marca, conteúdo LinkedIn/Instagram, SEO, site videltel.com.br, campanhas, apresentação institucional, cases, posicionamento. Ative com "fala com o G2" ou "chama o marketing".
```

**g3-data-engineer** (759 → 206)
```
G3 — Engenheiro de Dados da Videl T&L. Pipelines, ETL, dashboards, SQL, Python, APIs, BigQuery/Sheets, scraping, webhooks, cron, integração de sistemas e relatórios automatizados. Ative com "fala com o G3".
```

**g5-controller** (864 → 219)
```
G5 — Controller da Videl T&L. Finanças e custos: DRE, fluxo de caixa, rentabilidade por rota/cliente, budget, break-even, custo/km, precificação, comissões, inadimplência, conciliação, EBITDA. Ative com "fala com o G5".
```

**g6-compliance** (938 → 209)
```
G6 — Compliance e Segurança da Informação da Videl T&L. Conformidade ANTT/LGPD/fiscal, auditoria, fraude, anomalias, risco, vazamento, acesso indevido, due diligence, KYC, reputação. Ative com "fala com o G6".
```

**g7-diretor-comercial** (683 → 230)
```
G7 — Diretor Comercial da Videl T&L (modelo asset-light). Estratégia comercial, go-to-market, pricing, ICP, funil, ticket médio, CAC/LTV, forecast, contrato de frete, meta de vendas. Lidera G8, G9 e G10. Ative com "fala com o G7".
```

**g8-analista-vendas-hunter** (627 → 203)
```
G8 — Hunter de Vendas da Videl T&L. Prospecção de embarcadores e negociação com motoristas autônomos/agregados via FreteBras. Cold call, BANT, pipeline, outbound, fechar frete. Ative com "fala com o G8".
```

**g8-prospeccao-linkedin** (802 → 208)
```
G8-LinkedIn — Prospecção LinkedIn da Videl T&L. Sequências de conexão + follow-ups, social selling, InMail, Sales Navigator, campanhas de outreach e conteúdo de autoridade. Ative com "prospectar no LinkedIn".
```

**g9-analista-vendas-frete** (939 → 212)
```
G9 — Cálculo de Frete da Videl T&L. Custo/km, piso ANTT, GRIS, ad valorem, pedágio, retorno vazio, seguro, tabela de frete, margem, cotação e proposta comercial. Ative com "calcula esse frete" ou "fala com o G9".
```

**g10-analista-precos** (648 → 214)
```
G10 — Preços e Tendências de Logística da Videl T&L. Preço de mercado, benchmark de frete, sazonalidade, previsão de demanda, concorrência, nichos, índice ANTT, diesel, cenário macro. Ative com "quanto tá o frete".
```

**videl-prospeccao-email** (814 → 260)
```
Gera o e-mail de prospecção da Videl (Kit de E-mails, e-mail 1 — Diagnóstico): header da marca, caixa "O que mapeamos", gráfico Hoje × Com a Videl e CTA duplo. Aplica o gate de seguro Sompo/PAIVA. Ative para e-mail de prospecção ou campanha comercial da Videl.
```

`sdr-pipeline-review` já está em 168 caracteres — não precisa mexer.

### 5. Tirar o disparo automático da g0-secretaria

A descrição atual termina com "Deve ser ativada PROATIVAMENTE no início de cada sessão". Isso faz
o corpo da skill (10.526 bytes ≈ 3k tokens) carregar em **toda sessão**, inclusive nas que não têm
nada a ver com agenda. A descrição sugerida acima já remove essa linha: a skill continua disparando
quando você pede o briefing, sem custo fixo.

### 6. Desativar skills de documento que não usa

`xlsx` (952), `docx` (837), `pptx` (740) e `pdf` (437) somam ~2.966 caracteres ≈ 850 tokens por
mensagem. Se você não gera Excel/Word/PowerPoint por aqui, desativá-las é ganho direto.

## Hábitos de uso

- **`/clear` ao trocar de assunto.** Cada turno relê todo o histórico — nesta sessão de
  diagnóstico foram 258.996 tokens de releitura em 5 turnos. Ir de prospecção para bug no painel
  e depois para CT-e na mesma sessão carrega contexto morto para sempre.
- **Não leia arquivo grande inteiro.** `moita-rev1.html` tem 109 KB (~31k tokens). Use `Grep`
  para achar o trecho e `Read` com `offset`/`limit`.
- **Cuidado com subagentes e workflows.** Cada subagente paga o prompt de sistema do zero. Um
  workflow com 10 agentes = 10× o baseline.

## Resultado esperado

| | Antes | Depois |
|---|---|---|
| Aplicado no repo (itens 1–2) | 60.649 | ~57.9k |
| Com itens 3–6 na conta | | **~28–33k** |
| Ler o painel de gestão | ~112k tokens | ~19k tokens |
