# 📊 Power BI — Controle Automatizado de Propostas da Semana (Videl T&L)

Modelo de Power BI que **calcula quantas propostas foram feitas na semana** e
monta um painel de controle automatizado, conectado à **aba de Leads / Cotações
da plataforma Videl** (https://www.videltel.com.br/dashboard).

> "Proposta" = cada **lead / cotação** aberta no comercial. É o mesmo dado que
> aparece na aba **Leads / Cotações** do `painel-gestao.html` e vem do endpoint
> `/quotes` da API da Videl.

---

## 🎯 O que o modelo entrega

| KPI | Medida DAX | O que mostra |
|-----|-----------|--------------|
| **Propostas na semana** | `Propostas na Semana` | Total de propostas abertas na semana atual (seg→dom, automático) |
| **Variação semanal** | `Variação Semanal %` / `Tendência Semanal` | Comparação com a semana anterior (WoW) |
| **Por status** | `Propostas Novas/Em Negociação/Aprovadas/Perdidas` | Funil da semana |
| **Conversão** | `Taxa de Conversão %` | Aprovadas ÷ total da semana |
| **Valor** | `Valor na Semana` / `Valor Médio` | Volume financeiro das propostas |
| **Tendência** | `Propostas (contexto)` + `Propostas Média 4S` | Série histórica semana a semana |

Tudo **automático**: a janela "esta semana" é calculada a partir de `HOJE()` —
nada precisa ser ajustado manualmente toda segunda-feira. Basta o Power BI
atualizar (agendado no Power BI Service).

---

## 📁 Arquivos

```
powerbi/
├── README.md                         ← este guia
├── powerquery/
│   ├── 01-Leads-Videl.m              ← conecta na API Videl (/quotes) via proxy  ✅ produção
│   ├── 01b-Leads-CSV-Exemplo.m       ← lê o CSV de exemplo (para testar offline)
│   └── 02-Calendario.m               ← tabela de datas com Semana ISO
├── dax/
│   └── medidas.dax                   ← todas as medidas (copie e cole)
└── dados-exemplo/
    └── leads-exemplo.csv             ← 33 propostas de exemplo (5 semanas)
```

---

## 🚀 Montagem passo a passo (Power BI Desktop)

### 1. Tabela de propostas (Leads)

**Opção A — testar agora, sem API (recomendado para começar):**
1. `Página Inicial ▸ Transformar dados` (abre o Editor do Power Query).
2. `Nova Origem ▸ Consulta em Branco`.
3. `Exibir ▸ Editor Avançado` → cole `powerquery/01b-Leads-CSV-Exemplo.m`.
4. Ajuste `CaminhoCSV` para onde você salvou `leads-exemplo.csv`.
5. Renomeie a consulta para **`Leads`**.

**Opção B — dados ao vivo da Videl:**
1. Publique o proxy (veja `../proxy/README.md`) e copie a URL do Worker.
2. `Nova Origem ▸ Consulta em Branco` → cole `powerquery/01-Leads-Videl.m`.
3. Troque `ProxyBase` pela URL do seu Worker.
4. Renomeie a consulta para **`Leads`**.

> As duas fontes produzem **as mesmas colunas** (`Proposta ID, Cliente, Origem,
> UF Origem, Destino, UF Destino, Carga, Valor, Data, Status, Responsável`), então
> você monta o painel com o CSV e depois só troca pela fonte da API — as medidas
> continuam funcionando.

### 2. Tabela Calendário
1. `Nova Origem ▸ Consulta em Branco` → cole `powerquery/02-Calendario.m`.
2. Renomeie para **`Calendário`**.
3. `Página Inicial ▸ Fechar e Aplicar`.

### 3. Relacionamento e tabela de datas
1. Aba **Modelo** → arraste `Calendário[Data]` sobre `Leads[Data]`
   (relação **1 : N**, direção única).
2. Selecione a tabela `Calendário` → `Ferramentas de Tabela ▸ Marcar como tabela
   de datas` → coluna **Data**.

### 4. Medidas
1. `Modelagem ▸ Nova Medida`.
2. Cole cada medida de `dax/medidas.dax` (uma por vez).
   Comece por `Propostas`, depois `Propostas na Semana` (a principal).

### 5. Montar o painel
Sugestão de layout (veja o mockup em `preview.html`):
- **Cartões (topo):** `Propostas na Semana`, `Tendência Semanal`,
  `Taxa de Conversão %`, `Valor na Semana`, e o título `Título Semana`.
- **Rosca/Barras:** `Propostas na Semana` por `Leads[Status]`.
- **Linha:** `Propostas (contexto)` + `Propostas Média 4S` por
  `Calendário[Ano-Semana]` (eixo).
- **Barras horizontais:** `Propostas na Semana` por `Leads[Cliente]` (Top N).
- **Tabela:** propostas da semana (Proposta ID, Cliente, Rota, Carga, Valor, Status).

---

## 🔄 Automação (atualização sem esforço)

1. **Publicar:** `Página Inicial ▸ Publicar` → escolha um workspace no Power BI Service.
2. **Atualização agendada:** no Service, `Conjunto de dados ▸ Configurações ▸
   Atualização agendada` → defina, por exemplo, **de hora em hora** ou **1x/dia
   às 7h** (antes da operação diária do Moita).
3. **Credenciais da origem:** como o acesso à Videl passa pelo proxy (o proxy
   guarda usuário/senha como *secrets* na Cloudflare), no Power BI a fonte Web
   pode ficar como **Anônima** — nenhuma senha da Videl fica no relatório.
4. Pronto: toda semana os KPIs "andam" sozinhos porque a janela é baseada em `HOJE()`.

> Alternativa sem Power BI Desktop (Mac/tablet): o arquivo `preview.html` deste
> diretório reproduz o mesmo cálculo em HTML e roda direto no navegador, lendo o
> mesmo `/quotes` via proxy — útil para conferência rápida.

---

## 🧮 Como "propostas da semana" é calculado

```DAX
_Início Semana Atual = TODAY() - WEEKDAY(TODAY(), 2) + 1   -- segunda-feira
_Fim Semana Atual    = _Início Semana Atual + 6            -- domingo

Propostas na Semana =
CALCULATE(
    DISTINCTCOUNT('Leads'[Proposta ID]),
    DATESBETWEEN('Calendário'[Data], [_Início Semana Atual], [_Fim Semana Atual])
)
```

- Semana **segunda → domingo** (padrão comercial brasileiro).
- `DISTINCTCOUNT` no `Proposta ID` evita contar a mesma cotação duas vezes.
- Funciona na virada de ano/mês porque compara **datas**, não número de semana.

---

## 🔌 Origem dos dados (rastreabilidade)

`API Videl → /quotes` → `proxy Cloudflare` → `Power Query (Leads)` → `Modelo` → `Painel`

Campos da API (`/quotes`) já tratados no Power Query:
`cliente_nome`/`cliente`, `origem.{cidade,uf}`, `destino.{cidade,uf}`,
`carga`/`tipo_carga`, `valor`/`valor_frete`, `created_at`/`data`, `status`.
O `status` é normalizado em 4 categorias: **Novo, Em negociação, Aprovado, Perdido**
(mesma regra do `painel-gestao.html`, função `mapLead`).
