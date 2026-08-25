# Integração de cotação — Qualp + ANTT + Bsoft

Motor de precificação de frete do Moita Rev1. Roda em dois lugares com o mesmo
código: **CLI** (terminal, pra cotar na mão) e **Cloudflare Worker**
(`../../proxy/worker.js`, pro painel chamar via HTTP).

```
Qualp ──► km + pedágio reais
                │
ANTT  ──► piso mínimo legal  ──►  motor de cotação  ──►  preço + faixa de leilão
                │                                              │
insurance-rules.json (RCDC/RCV)                                ▼
                                                    Bsoft ──► CT-e RASCUNHO
                                                              (humano emite)
```

## ⚠️ Estado da integração — leia antes de usar em produção

| Peça | Estado |
|---|---|
| Motor de cotação (piso, custos, impostos, margem, leilão) | ✅ **Pronto e testado** — 35 testes |
| Rotas do Worker | ✅ **Testadas** sem deploy (`test/worker.test.js`) |
| Cliente Qualp | ⚠️ **Escrito, nunca chamado.** Sem credencial e o ambiente de desenvolvimento tinha egress bloqueado para `qualp.com.br` |
| Cliente Bsoft | ⚠️ **Escrito, nunca chamado.** Rotas da API são candidatas, não confirmadas |
| Coeficientes ANTT 3–8 eixos | ⚠️ **Derivados**, não lidos da resolução |

As duas partes ⚠️ precisam de uma primeira chamada real pra fechar. O que fazer
em cada uma está em [Ligar o Qualp](#ligar-o-qualp) e [Ligar o Bsoft](#ligar-o-bsoft).

## Uso rápido (CLI)

```bash
cd integracao/api

# com km e pedágio na mão
node cotar.js --origem "Tres Lagoas, MS" --destino "Sorriso, MT" \
              --nf 212424.33 --veiculo truck --km 1450 --pedagio 450 \
              --entregas 2 --margem 0.12

# com Qualp ligado, o km e o pedágio vêm sozinhos
export QUALP_TOKEN=...
node cotar.js --origem "Tres Lagoas, MS" --destino "Sorriso, MT" \
              --nf 212424.33 --veiculo truck --entregas 2 --margem 0.12
```

Flags: `--motorista <R$>` (custo negociado; default é o piso ANTT),
`--icms-cheio` (desliga o crédito outorgado), `--eixos`, `--json`.

```bash
npm test        # 35 testes, sem rede
```

## Rotas do Worker

| Rota | O que faz |
|---|---|
| `GET /qualp/rota?origem=&destino=&eixos=` | km + pedágio reais |
| `POST /cotacao` | piso ANTT + composição de custo + preço + faixa de leilão |
| `POST /bsoft/cte-rascunho` | monta (e opcionalmente grava) o rascunho de CT-e |
| `GET /health` | inclui quais integrações estão configuradas |

As rotas da API Videl (`/shipments`, `/quotes`, …) seguem **somente GET**.

```bash
curl -X POST https://SEU-WORKER.workers.dev/cotacao \
  -H 'Content-Type: application/json' \
  -d '{"origem":"Tres Lagoas, MS","destino":"Sorriso, MT",
       "valorNF":212424.33,"tipoVeiculo":"truck","entregas":2,
       "margemLiquida":0.12,"precoOfertado":12500}'
```

Com `precoOfertado` no body, a resposta ganha `avaliacaoDoLance` (a margem real
naquele lance) e `tetoMotorista` (o máximo que o G8 pode oferecer no FreteBras
mantendo a margem — já checando se respeita o piso ANTT).

## Como o preço sai

```
custoDireto = motorista + pedágio + RCDC + RCV + gerenc. risco + entregas extras
custoTotal  = custoDireto × (1 + overhead 10%)
preço       = custoTotal / (1 − impostos − comissões − margem)
```

- **motorista**: default é o **piso ANTT** — o piso legal, não uma estimativa.
- **RCDC/RCV**: taxas reais da apólice Allianz (`../../insurance-rules.json`).
- **impostos**: ICMS (7% ou 12% pela Res. Senado 22/89, com crédito outorgado de
  20% por padrão) + PIS/COFINS 3,65% + IRPJ/CSLL 2,28%.
- **comissões**: 1,5% interna (`comissaoExterna: 0.025` quando houver representante).

Tudo isso vive em `PADROES` no topo de `lib/cotacao.js`.

### A trava do piso ANTT

`avaliarPreco()` devolve `nivel: 'BLOQUEIO'` para qualquer lance abaixo do piso —
Lei 13.703/2018. O motor **não** impede o cálculo, mas marca com clareza; a
decisão de não ofertar é da pessoa.

### Meta 60-62%

A razão custo-motorista/preço só é informativa quando o preço é **derivado**
(subir o custo sobe o preço junto, a razão quase não anda). Ela morde de verdade
em `avaliarPreco(cotacao, precoDado)` — que é o caso do leilão e da contraproposta.

## Ligar o Qualp

```bash
cd ../../proxy && npx wrangler secret put QUALP_TOKEN
```

Na **primeira chamada real**, confira o formato da resposta:

```bash
curl "https://SEU-WORKER.workers.dev/qualp/rota?origem=Tres%20Lagoas,%20MS&destino=Sorriso,%20MT&eixos=3&bruto=1"
```

`normalizar()` em `lib/qualp.js` já aceita os formatos conhecidos
(`distancia.valor`, `distancia_km`, `distance.value`, e string `"1.450,3 km"`).
Se o `km` vier `null`, é só acrescentar o caminho novo na lista de candidatos —
os testes de `normalizar` cobrem isso sem rede.

## Ligar o Bsoft

Falta o principal: **a credencial de integração ainda não foi emitida**. Peça a
`suporte.tms@bsoft.com.br` um usuário com perfil de integração e confirme
com eles (ou em <https://docs.bsoft.app>) as duas rotas:

| O que | Chute atual | Sobrescrever com |
|---|---|---|
| Login | `POST /api/auth/login` | `BSOFT_ROTA_LOGIN` |
| Criar CT-e | `POST /api/cte` | `BSOFT_ROTA_CTE` |

```bash
npx wrangler secret put BSOFT_DOMINIO
npx wrangler secret put BSOFT_USUARIO
npx wrangler secret put BSOFT_SENHA
```

Enquanto `BSOFT_HABILITADO` não for `"true"` no `wrangler.toml`, a rota fica em
**modo simulação**: monta o rascunho e devolve pra conferência, sem gravar.
Recomendo rodar assim por algumas operações antes de ligar a gravação.

### O Moita não emite documento fiscal

`GUARDA_EMISSAO()` em `lib/bsoft.js` recusa qualquer payload sem `rascunho: true`
ou que carregue `emitir` / `transmitir` / `autorizar` / `enviar_sefaz`. Não existe
função de emissão neste módulo, e não deve passar a existir — o fluxo da Videl é
**Moita monta o rascunho → analista humano revisa → humano emite**.

## Quando sair resolução nova da ANTT

Mexe só em `antt-tabela.js`. Ao conferir um coeficiente na
[calculadora oficial](https://calculadorafrete.antt.gov.br), troque
`"fonte": "derivado"` por `"publicado"` naquela linha — é isso que apaga o alerta
de conferência na saída da cotação.

Hoje só **2 e 9 eixos** vêm de fonte publicada. As linhas de 3 a 8 foram
extrapoladas pela razão histórica da Tabela A (o método está documentado no
próprio arquivo) e **todas as cotações de truck saem com alerta `ATENCAO`** até
alguém conferir os 3 eixos.

## Arquivos

```
antt-tabela.js       tabela ANTT (única fonte de verdade dos coeficientes)
lib/antt.js          piso mínimo + mapa veículo → eixos
lib/cotacao.js       motor: custos, impostos, margem, leilão, teto do motorista
lib/qualp.js         cliente Qualp + parser defensivo
lib/bsoft.js         auth, montagem do rascunho e trava de emissão
cotar.js             CLI
test/                35 testes, nenhum toca a rede
```
