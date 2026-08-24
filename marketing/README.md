# Marketing Videl — SEO, posts e automação

Central de marketing criada em 24/08/2026. As artes ficam no canvas **"Marketing Videl"**
(Claude Design), com três páginas: *Site & SEO*, *Posts da Semana* e *Calendário 30 dias*.

## Estrutura

```
marketing/
├── seo/
│   ├── head-seo.html    # <head> corrigido para o index.html do site (canonical, og:image, JSON-LD)
│   ├── sitemap.xml      # publicar na pasta public/ do projeto do site
│   └── robots.txt       # publicar na pasta public/ (adiciona linha Sitemap e bloqueia /dashboard)
├── posts/
│   └── legendas-semana-24-28-08.md   # legendas prontas da semana Intersolar + equipes MA/SP
├── automacao/
│   └── gerar-calendario.mjs          # gera o calendário editorial do mês (md + json)
└── calendario/                       # saída gerada pelo script
```

## Auditoria de SEO — resumo (24/08/2026)

| Problema | Gravidade | Correção |
|---|---|---|
| Site React 100% client-side: Google recebe `<div id="root">` vazio | Crítico | Pré-renderizar a landing (SSG) — ver abaixo |
| `canonical` e `og:url` apontam para `videl.com.br` (domínio errado) | Crítico | `seo/head-seo.html` |
| `sitemap.xml` inexistente (devolve o HTML da home) | Crítico | `seo/sitemap.xml` + linha `Sitemap:` no robots.txt |
| Sem `og:image` / `twitter:image` (links sem visual no WhatsApp/LinkedIn) | Alto | criar `/og-image.png` 1200×630 e usar `head-seo.html` |
| Sem JSON-LD (Organization/Service) | Alto | incluso em `head-seo.html` |
| Bundle único de 2,9 MB carrega o dashboard inteiro na landing | Alto | code-splitting por rota (`React.lazy` no `/dashboard`) |
| Title/description sem cidade nem setor | Médio | novo title/description em `head-seo.html` |

### Como aplicar no projeto do site (Vite + React)

1. Copiar o conteúdo de `seo/head-seo.html` para o `<head>` do `index.html` do projeto do site
   (mantendo os `<script type="module">` e `<link rel="stylesheet">` gerados pelo build).
2. Copiar `seo/sitemap.xml` e `seo/robots.txt` para a pasta `public/` do projeto.
3. Criar `public/og-image.png` (1200×630) — pode ser exportada do artboard "Site novo — Desktop" do canvas.
4. Pré-render da landing: adicionar `vite-prerender-plugin` (ou build SSG) para a rota `/`,
   mantendo `/dashboard` como SPA. Isso torna todo o conteúdo indexável.
5. Code-splitting: envolver as rotas do dashboard em `React.lazy(() => import(...))` para a
   landing não carregar a calculadora/CRM.
6. Depois de publicar: Google Search Console → enviar sitemap; criar Google Business Profile
   nas bases MA e SP; colocar o link do site na bio do @videl_br.

## Automação do calendário ("fazer tudo sozinho")

```bash
# próximas 4 semanas a partir da próxima segunda:
node marketing/automacao/gerar-calendario.mjs

# mês específico:
node marketing/automacao/gerar-calendario.mjs --inicio 2026-09-28 --semanas 4
```

Gera `marketing/calendario/calendario-<data>.md` (para a equipe) e `.json` (para integração
com agendadores/Zapier/painel Moita Rev1). O banco de conteúdo rota automaticamente — meses
seguidos não repetem posts. Rotina sugerida: rodar todo dia 25 e revisar os itens marcados
com [COLCHETES], que precisam de material real (foto, vídeo, nome).
