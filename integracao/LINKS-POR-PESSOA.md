# Distribuição de acessos — Controle de Demandas (Videl)

Como cada pessoa recebe o **seu** link de acesso ao painel. O corte é no
servidor (Apps Script): cada link carrega uma **chave** e o painel devolve só o
que aquela pessoa pode ver.

> ⚠️ **As chaves reais NÃO ficam aqui** (este repositório é público). As chaves
> abaixo são **exemplos** (`xxx`). As chaves de verdade ficam na aba **`Acessos`**
> da planilha MASTER e num documento privado no Google Drive. Uma chave é como
> uma senha — envie o link de cada pessoa **individualmente** (não em grupo).

## Base
`https://gcaires-png.github.io/fretebi-dashboard/painel-gestao.html`

## Padrão do link
- Uma área: `?key=CHAVE&area=comercial`
- Várias áreas ou tudo: `?key=CHAVE`

## Quem vê o quê

| Pessoa | Áreas | Financeiro / Contas a Pagar | Link (exemplo) |
|--------|-------|------------------------------|----------------|
| Diretoria (Gearlison) | todas | ✅ | `…/painel-gestao.html?key=dir-xxxxxx` |
| José Adailton | todas | ✅ | `…/painel-gestao.html?key=jad-xxxxxx` |
| Karolay | ADM + RH + Financeiro | ✅ | `…/painel-gestao.html?key=kar-xxxxxx` |
| Jhennifer | RH | ❌ | `…/painel-gestao.html?key=jhe-xxxxxx&area=rh` |
| Giovani | Financeiro | ✅ | `…/painel-gestao.html?key=gio-xxxxxx&area=financeiro` |
| Hudson | Comercial | ❌ | `…/painel-gestao.html?key=hud-xxxxxx&area=comercial` |
| Anderson | Comercial | ❌ | `…/painel-gestao.html?key=and-xxxxxx&area=comercial` |
| Marketing | Marketing | ❌ | `…/painel-gestao.html?key=mkt-xxxxxx&area=marketing` |
| Moita (Log/TI) | Logística + TI | ❌ | `…/painel-gestao.html?key=moi-xxxxxx` |

## Como gerar/atualizar os links reais
1. Preencha a aba **`Acessos`** na MASTER (`Pessoa | Chave | Áreas | Financeiro`)
   com chaves secretas próprias.
2. No Apps Script: `EXIGIR_CHAVE = true` → **Reimplantar** (Nova versão).
3. Rode a função **`gerarLinks`** (menu Executar) → o **Log** mostra o link
   pronto de cada pessoa, já com a chave real.

Se uma chave vazar: troque-a na aba `Acessos` e reimplante — o link antigo para
de funcionar na hora.
