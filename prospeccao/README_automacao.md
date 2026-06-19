# Automação de Prospecção — Videl T&L

Pipeline para automatizar a prospecção ativa do time comercial (5 comerciais),
a partir da base **CRM_VIDEL** (Google Sheets) e do plano "Plano de Ação
Comercial – Prospecção Ativa".

## Fluxo

```
CRM_VIDEL (Google Sheets)
   │  594 leads (359 com e-mail / 235 sem)
   ▼
[1] Normalização da base ........... prospeccao/contatos_videl.csv
   │
   ▼
[2] Enriquecimento (Lusha) ......... prospeccao/enriquecidos_lusha.csv
   │  decisor de logística/supply chain + e-mail (e-mail = 1 crédito)
   ▼
[3] E-mail personalizado por segmento ... prospeccao/modelos_email.md
   │  família: energia / indústria / alimentos / distribuição
   ▼
[4] Disparo automático (Zapier → Gmail) ... ação "Gmail: Send Email"
   │  to / subject / body(html) / from_name
   ▼
[5] Status de envio na base = cruzamento "enviado vs base"
      colunas status_envio + data_envio em contatos_videl.csv
```

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `contatos_videl.csv` | Base mestre — 594 leads: empresa, segmento, família, decisor, e-mail, tem_email, fonte_email, assunto personalizado, status_envio, data_envio |
| `enriquecidos_lusha.csv` | Contatos recuperados via Lusha (decisores de logística sem e-mail no CRM) |
| `modelos_email.md` | Os 4 modelos de e-mail por família de segmento |

## Disparo via Zapier (testado e funcionando)

App **Gmail** já conectado no Zapier. Ação `Gmail: Send Email`, parâmetros:
`to`, `subject`, `body` (body_type=`html`), `from_name`, `reply_to`.

> Teste validado em 19/06/2026 — envio para gcaires@videltel.com.br (`sent: true`).

**Recomendação de operação (LGPD / anti-spam):**
- Disparar em lotes (ex.: 50/dia por comercial, como no plano original).
- Sempre incluir rodapé de descadastro e identificação da empresa.
- Marcar `status_envio = ENVIADO` + `data_envio` na base após cada disparo.

## Enriquecimento Lusha — estado

Plano **Free**: 75 créditos/mês. Nesta rodada foram enriquecidas 6 contas
prioritárias (Piracanjuba, Hitachi Energy, Bauminas, CMPC, Bom Futuro, CSN).
Restam ~229 leads sem e-mail — processar em lotes conforme créditos
(revelar **somente e-mail** = 1 crédito; telefone custa 5).

## Cruzamento "enviados vs base" (Vsystem = CRM como fonte única)

O dashboard `index.html` (videltel.com.br/dashboard) é estático. Enquanto não
há backend, o controle de "enviado vs pendente" é feito pelas colunas
`status_envio` / `data_envio` na base mestre — fonte única de verdade do que
o marketing já disparou.
