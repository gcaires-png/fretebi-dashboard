# fretebi-dashboard

🚛 FreteBI — Dashboard de Business Intelligence de Fretes | Videl T&amp;I | FreteBras

## Painéis

| Página | O que é |
|---|---|
| `index.html` | FreteBI — BI de fretes em tempo real |
| `moita-rev1.html` | Painel operacional do Moita Rev1 |
| `painel-gestao.html` | Painel de gestão e KPIs |
| `radar-anthropic.html` | 📡 Radar Anthropic — tudo que a Anthropic publica |

## Automações

| Workflow | Quando roda | O que faz |
|---|---|---|
| `.github/workflows/radar-anthropic.yml` | a cada 3 horas | coleta as publicações da Anthropic e atualiza `dados/` |
| `.github/workflows/deploy-pages.yml` | push na `main` e após cada coleta | publica o site no GitHub Pages |

Detalhes do radar em [`radar-anthropic/README.md`](radar-anthropic/README.md).
