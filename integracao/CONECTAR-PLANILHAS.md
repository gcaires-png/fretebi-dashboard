# Conectar o Painel de Gestão às planilhas (tempo real)

Guia para ligar o **Painel de Gestão & KPIs** (`painel-gestao.html`) direto às
planilhas do Google Sheets da Videl, sem programar nada. Depois de configurado,
o painel se atualiza sozinho a cada **60 segundos**.

Visão geral do fluxo:

```
Google Sheets (dados)  →  Apps Script (moita-sheets.gs, publicado como Web App)  →  Painel (engrenagem ⚙️)
```

---

## Passo 1 — Montar a planilha

Crie uma Planilha Google (ex.: **"Moita — Base do Painel"**) com as abas abaixo.
A **primeira linha de cada aba é o cabeçalho** (os nomes das colunas). A ordem
das colunas não importa; acentos e maiúsculas também não.

### Aba `Areas`
| id | nome | icon | owner | pasta | drive_url | health |
|----|------|------|-------|-------|-----------|--------|
| comercial | Comercial | 💼 | Equipe Comercial · 4 pessoas | 01 · Comercial | https://drive.google.com/... | 82 |
| logistica | Logística | 🚛 | Moita Rev1 + Operações | 02 · Logística/Operações | https://drive.google.com/... | 74 |
| financeiro | Financeiro | 💰 | Financeiro · 3 pessoas | 03 · Financeiro | https://drive.google.com/... | 88 |
| fiscal | Fiscal / Documentos | 📄 | Analista Fiscal | 04 · Fiscal | https://drive.google.com/... | 79 |
| frota | Frota / Motoristas | 🧭 | Gestão de Frota | 05 · Frota | https://drive.google.com/... | 71 |
| rh | RH & Pessoas | 👥 | RH · 2 pessoas | 06 · RH | https://drive.google.com/... | 85 |

> `id` é a chave que liga as outras abas. `health` = índice de saúde 0–100.
> `drive_url` é o link da pasta no Drive (opcional). A **cor** de cada área é
> automática pelo `id` (comercial, logistica, financeiro, fiscal, frota, rh).

### Aba `Planilhas`
| area_id | nome | linhas | sync |
|---------|------|--------|------|
| comercial | Cotações Ativas | 128 | ok |
| comercial | Funil de Vendas | 342 | ok |
| financeiro | Conciliação Bancária | 88 | err |

> `sync` aceita: **ok** (verde), **wait** (amarelo/aguardando), **err** (vermelho).
> A coluna `linhas` pode ser preenchida com `=CONTAR.VALORES(...)` apontando
> para a planilha real, para refletir o volume automaticamente.

### Aba `KPIs`
| area_id | papel | icon | valor | label | delta | direcao | tag | barra |
|---------|-------|------|-------|-------|-------|---------|-----|-------|
| comercial | gestor | 💵 | R$ 486k | Receita fechada (mês) | +12,4% vs. mês ant. | up | Meta 92% | 92 |
| comercial | func | 📂 | 11 | Minhas cotações abertas | 3 vencem hoje | nt | | |
| logistica | gestor | 🎯 | 61,4% | Custo de frete médio | dentro da meta 60–62% | up | | 61 |

> `papel` = **gestor** ou **func** (funcionário). `direcao` = **up** (verde ▲),
> **dn** (vermelho ▼) ou **nt** (neutro •). `tag` e `barra` (0–100) são opcionais.
> `valor` pode ser texto (`R$ 486k`, `61,4%`) ou número — vem como está.

### Aba `Projetos`
| nome | area_id | responsavel | progresso | prazo | status |
|------|---------|-------------|-----------|-------|--------|
| Integração Bsoft (CT-e automático) | fiscal | Moita Rev1 | 72 | 30/08/2026 | and |
| Onboarding digital de motoristas | rh | RH | 100 | 01/07/2026 | done |

> `status`: **and** (em andamento), **risk** (em risco), **late** (atrasado),
> **done** (concluído), **plan** (planejado). `progresso` = 0–100.

### Abas opcionais `TopKPIs` e `Alertas`
Controlam os 4 cards do topo da Visão Geral e os 4 cards de Alertas.
Mesmas colunas do `KPIs` (com `cor` opcional em vez de `area_id`). Se você
**não criar** essas abas, o painel usa os cards padrão.

| papel | icon | valor | label | delta | direcao | cor | barra |
|-------|------|-------|-------|-------|---------|-----|-------|
| gestor | 💵 | R$ 512k | Faturamento consolidado (mês) | +9,8% vs. ant. | up | var(--a-financeiro) | 88 |

---

## Passo 2 — Publicar o Apps Script

1. Na planilha: **Extensões ▸ Apps Script**.
2. Apague o conteúdo padrão e **cole o arquivo [`moita-sheets.gs`](./moita-sheets.gs)**.
3. (Opcional) Se o script não estiver dentro da própria planilha, cole o ID
   dela em `SPREADSHEET_ID` no topo do arquivo.
4. **Implantar ▸ Nova implantação**.
5. Engrenagem ▸ **Tipo: App da Web**.
6. Configure:
   - **Executar como:** Eu (sua conta).
   - **Quem pode acessar:** **Qualquer pessoa**.
7. **Implantar** e autorize o acesso quando pedir.
8. Copie a **URL do app da Web** (termina em `/exec`).

> A URL `/exec` é a que o painel vai consumir. Guarde-a.

---

## Passo 3 — Conectar no painel

1. Abra o painel: `https://gcaires-png.github.io/fretebi-dashboard/painel-gestao.html`
2. Clique na **engrenagem ⚙️** (canto superior direito).
3. Cole a URL `/exec` no campo e clique em **Testar & Salvar**.
4. O selo muda de **◐ Demo** para **● Ao vivo** e os dados passam a vir da planilha.

Pronto. A configuração fica salva no navegador (localStorage). Cada gestor que
abrir o link e colar a URL uma vez passa a ver os dados ao vivo. Para distribuir
a URL a todos automaticamente, dá para embutir uma URL padrão no código — me
avise se quiser essa versão "já conectada".

---

## Dúvidas comuns

- **Mudei a planilha e o painel não atualizou.** Ele sincroniza a cada 60s;
  recarregue a página para ver na hora.
- **Erro de sincronização.** Confirme que a implantação está como **"Qualquer
  pessoa"** e que a URL termina em `/exec` (não `/dev`).
- **Alterei o código do script.** Toda alteração precisa de uma **nova
  implantação** (ou "Gerenciar implantações ▸ editar ▸ Nova versão").
- **Segurança.** O Web App só expõe leitura (GET) dos dados que você colocou
  nas abas. Não exponha dados sensíveis que não devam ser públicos, já que o
  acesso é "Qualquer pessoa com o link".
