# Vault Videl + Pessoal — Guia de Uso

Vault único, duas vidas separadas por pasta. Um vault só porque ideia de trabalho aparece no fim de semana e ideia pessoal aparece na terça às 15h. Separar em dois vaults faz você perder as duas.

## Estrutura

| Pasta | Para quê |
|---|---|
| `00-Inbox` | Tudo cai aqui primeiro. Zero fricção. Esvazia 1x por semana. |
| `01-Diario` | Uma nota por dia. Log de operação + vida. |
| `02-Videl` | Tudo da empresa (operações, clientes, motoristas, financeiro, processos) |
| `03-Pessoal` | Metas, finanças pessoais, saúde, estudos |
| `04-Projetos` | Coisas com início/fim e entregável (empresa OU pessoal) |
| `05-Referencias` | Material permanente: leis, tabelas, manuais, contatos |
| `99-Templates` | Modelos de nota |

## As 3 regras que fazem funcionar

1. **Captura sempre no Inbox.** Nunca pense "onde eu salvo isso". Salva no Inbox e segue.
2. **Nota diária é obrigatória.** Abre o Obsidian, `Ctrl+P` → "Daily note". É o único hábito que precisa pegar.
3. **Link, não pasta.** Ao citar um cliente escreva `[[Bold S.A.]]`. O Obsidian cria a nota sozinha. Em 2 meses cada cliente tem histórico completo sem você organizar nada.

## Setup inicial (5 minutos)

1. Obsidian → "Open folder as vault" → aponte para esta pasta
2. Configurações → **Núcleo**:
   - *Notas diárias*: formato `YYYY-MM-DD`, pasta `01-Diario`, template `99-Templates/T-Diario`
   - *Templates*: pasta `99-Templates`
   - *Links*: "Nova nota em" → `00-Inbox`
3. Plugins da comunidade recomendados (nesta ordem de prioridade):
   - **Dataview** — transforma suas notas em tabelas automáticas (essencial pro painel de operações)
   - **Templater** — templates com data automática
   - **Calendar** — navegar as notas diárias
   - **Tasks** — gerenciar `- [ ]` espalhados pelo vault

## Sincronização

- **Grátis**: pasta do vault dentro do Google Drive Desktop. Funciona bem em PC. No celular é ruim.
- **Pago (recomendado)**: Obsidian Sync (~US$4/mês) — celular + PC, criptografado, histórico de versões.
- **Alternativa**: repositório Git privado (você já usa Git).

## Tags padrão

Use poucas. Muitas tags = nenhuma tag.

`#urgente` `#aguardando` `#ideia` `#videl` `#pessoal` `#financeiro`
