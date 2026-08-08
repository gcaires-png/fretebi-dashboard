# 📡 Radar Anthropic

Programação que captura **tudo que a Anthropic publica** — não só o que é de dev —
e joga em um painel único dentro do dashboard da Videl.

## O que é coletado

| Canal | Fonte | O que entra |
|---|---|---|
| **Site** | `anthropic.com` (sitemap) | news, research, engineering, product, features, learn, events, claude, institute, RSP, economic-futures, transparency |
| **Site** | `claude.com` (sitemap) | blog, newsroom, customers (cases) |
| **X** | `@AnthropicAI`, `@ClaudeDevs`, `@claudeai` | posts recentes de cada perfil |
| **Status** | `status.claude.com/history.atom` | incidentes e degradações de plataforma |
| **Changelog** | GitHub raw | `claude-code`, `anthropic-sdk-python`, `anthropic-sdk-typescript` |
| **Release Notes** | `platform.claude.com/docs` | release notes da API e dos system prompts |

Cada item recebe **categoria** (Modelos, Dev & Engenharia, Produto, Pesquisa, Anúncios,
Negócios, Política & Sociedade, Status & Incidentes, Eventos, Casos de Cliente) e
**relevância** para a operação da Videl (alta / média / baixa).

## Arquivos

```
radar-anthropic/coletor.py    # o coletor (só biblioteca padrão do Python 3.9+)
radar-anthropic/fontes.json   # configuração das fontes — edite aqui para incluir/remover
dados/radar-anthropic.json    # base acumulada (histórico completo, incremental)
dados/radar-anthropic-resumo.md  # resumo só das novidades da última rodada
radar-anthropic.html          # painel de leitura
```

## Rodar na mão

```bash
python3 radar-anthropic/coletor.py                      # rodada normal
python3 radar-anthropic/coletor.py --limite-metadados 0 # carga completa, sem teto
python3 radar-anthropic/coletor.py --sem-x              # pula o X
python3 radar-anthropic/coletor.py --sem-sitemap        # só X, status, changelogs e docs
```

Para ver o painel localmente (o `fetch` não funciona em `file://`):

```bash
python3 -m http.server 8000     # depois: http://localhost:8000/radar-anthropic.html
```

## Agendamento

O workflow `.github/workflows/radar-anthropic.yml` roda **a cada 3 horas**
(`17 */3 * * *`), comita `dados/` quando há novidade e dispara a republicação do
GitHub Pages. Também aceita execução manual em *Actions → Radar Anthropic → Run workflow*.

## Comportamento incremental

- A base **nunca é reescrita do zero**: itens já vistos são preservados e apenas
  reclassificados; só o que apareceu na rodada ganha a marca `novo`.
- Páginas que falharam (rate limit, timeout) ficam com `metadados_ok: false` e são
  reprocessadas nas rodadas seguintes.
- `lastmod` carimbado no build do site não vira data de publicação: o item fica sem
  data e é ordenado pela data de descoberta. Datas vindas de `lastmod` real são
  marcadas com `data_estimada: true` (aparecem com `~` no painel).
- O teto `--limite-metadados` existe para não martelar o site: numa carga inicial
  grande, o restante entra nas rodadas seguintes.
- Rodada sem nenhuma mudança **não reescreve os arquivos** (comparação por hash do
  conteúdo), então o agendamento não gera commit a cada 3 horas à toa. Por isso o
  painel mostra "Atualizado" com a data da última mudança real, não da última varredura.

## X / Twitter

A coleta usa o endpoint público de sindicação, que não exige credencial. Perfis que
não liberam embed público (hoje, **@ClaudeDevs**) voltam vazios. Para cobrir esses
casos, cadastre o secret **`X_BEARER_TOKEN`** no repositório — o coletor cai
automaticamente na API v2 do X quando a sindicação não devolve nada.
