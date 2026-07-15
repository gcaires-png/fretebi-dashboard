# Conectar o Controle de Atividades à planilha (tempo real)

O **Controle de Atividades** (`painel-gestao.html`) lê uma planilha do Google
Sheets onde os **funcionários preenchem as atividades**; o **Moita analisa**
sozinho (atrasadas, sem responsável, gargalos, produtividade) e o HTML mostra
tudo em tempo real, atualizando a cada **60 segundos**.

```
Funcionário preenche o Sheets  →  Apps Script (moita-sheets.gs, Web App)  →  Painel analisa e mostra ao vivo
```

---

## Passo 1 — A planilha (você já tem)

O painel lê a planilha **`00 - Controle de Demandas Videl — MASTER`** (a mesma
que você já usa). O script busca automaticamente a aba de demandas e entende
estas colunas (nomes flexíveis — acento/maiúscula/ordem não importam):

| ID | Área | Subárea | Demanda / Tarefa | Responsável (executa) | Gestor | Prioridade | Abertura | Prazo | Status | % Concluído | Próxima ação / Observação |
|----|------|---------|------------------|-----------------------|--------|------------|----------|-------|--------|-------------|---------------------------|
| ADM-01 | Administrativo | Adm | Enviar contrato de aluguel | Karolay | José Adailton | ALTA | 13/07/2026 | 15/07/2026 | Em andamento | 50 | Contabilidade aguardando |

Como o painel interpreta:

- **Área / Subárea** → define a cor e o ícone (Administrativo, RH, Financeiro,
  Logística, Comercial, Marketing, TI/DEV). Usa a Subárea quando ela é mais
  específica (ex.: RH dentro de Administrativo).
- **Prioridade** → `ALTA`, `MÉDIA`, `BAIXA`.
- **Prazo** → o Moita marca **ATRASADA** sozinho quando a data já passou e a
  demanda não está concluída (regra do seu doc de instruções).
- **Status** → encaixado nas colunas do quadro:
  - **A fazer** ← `a fazer`, `pendente`, `atrasado`
  - **Em andamento** ← `em andamento`, `fazendo`, `execução`
  - **Bloqueado** ← `bloqueado`, `travado`, `impedido`
  - **Concluído** ← `concluído`, `feito`, `entregue`, `ok`
- **% Concluído** → mostra a barra de progresso e entra no cálculo do placar.
- **Responsável / Gestor** → alimentam os filtros e o **Placar de performance**.

> **Tudo amarrado (já configurado):** o script consolida a **MASTER + as 7
> planilhas por área** automaticamente (união por ID; a MASTER tem prioridade
> quando o mesmo ID existe nos dois lugares). Cada área preenche a **sua**
> planilha e o resultado aparece no painel — sem precisar copiar nada.
>
> **Preencher a MASTER a partir das áreas (opcional):** ao abrir a planilha
> MASTER aparece o menu **"Moita Rev1 ▸ Consolidar áreas na MASTER"**, que
> acrescenta na MASTER as demandas novas das áreas (só adiciona IDs que ainda
> não existem — nunca apaga). Dá para deixar automático em **Extensões ▸ Apps
> Script ▸ Acionadores ▸ consolidarMASTER ▸ baseado em tempo** (ex.: a cada hora).

---

## Passo 2 — Publicar o Apps Script

1. Na planilha: **Extensões ▸ Apps Script**.
2. Apague o conteúdo padrão e **cole o arquivo [`moita-sheets.gs`](./moita-sheets.gs)**.
3. **Implantar ▸ Nova implantação**.
4. Engrenagem ▸ **Tipo: App da Web**.
5. Configure:
   - **Executar como:** Eu (sua conta).
   - **Quem pode acessar:** **Qualquer pessoa**.
6. **Implantar** e autorize quando pedir.
7. Copie a **URL do app da Web** (termina em `/exec`).

---

## Passo 3 — Conectar no painel

Você tem **duas formas**:

### A) Rápida (por navegador)
1. Abra o painel: `https://gcaires-png.github.io/fretebi-dashboard/painel-gestao.html`
2. Clique na **engrenagem ⚙️** ▸ cole a URL `/exec` ▸ **Testar & Salvar**.
3. O selo vira **● Ao vivo**. Fica salvo naquele navegador.

### B) "Já conectado" para todos (recomendada para distribuir)
Para que **todo mundo** abra o link já ao vivo, sem configurar nada:

1. Abra `painel-gestao.html` e encontre no topo do `<script>`:
   ```js
   const DEFAULT_ENDPOINT = '';   // <<< cole aqui a URL /exec do Google Apps Script
   ```
2. Cole sua URL `/exec` entre as aspas, salve e publique.
3. Pronto — qualquer link enviado aos gestores/funcionários já abre conectado.

> Me mande a URL `/exec` depois de publicar o Web App que eu já deixo o
> `DEFAULT_ENDPOINT` preenchido e no ar para você.

---

## Como o Moita analisa (automático)

A cada leitura, o Moita calcula e mostra no topo:

- **Atrasadas** (prazo vencido e não concluído) e quais são as prioritárias;
- **Sem responsável** (atividades que precisam de dono);
- **Alta prioridade em aberto**;
- **Gargalo** — a área com mais pendências;
- **Produtividade** — quem mais concluiu;
- **Recomendação** do que atacar primeiro.

Além do quadro (Kanban) por status, há visão de **Tabela**, filtros por área,
responsável e prioridade, e alternância **Gestor / Funcionário**.

---

## Dúvidas comuns

- **Mudei a planilha e não atualizou.** Sincroniza a cada 60s; recarregue para
  ver na hora.
- **Erro de sincronização.** Confirme implantação como **"Qualquer pessoa"** e
  URL terminando em `/exec` (não `/dev`).
- **Alterei o script.** Toda alteração exige **nova implantação** (Gerenciar
  implantações ▸ editar ▸ Nova versão).
- **Segurança.** O Web App expõe (só leitura) o que estiver nas abas, com acesso
  "Qualquer pessoa com o link". Não coloque ali dados que não possam ser vistos.
