# Proxy CORS — Moita Rev1 ↔ API Videl

O painel `moita-rev1.html` não consegue chamar a API da Videl direto do navegador
(a API não envia headers CORS). Este proxy — um **Cloudflare Worker** — resolve isso:
o painel chama o Worker, o Worker faz login na Videl no servidor (credenciais ficam
em segredos, **nunca no navegador**), guarda o token e devolve os dados com CORS liberado.

```
Navegador (painel)  →  Cloudflare Worker  →  API Videl
      (CORS ok)          (login + token)       (mesma origem)
```

## Deploy (5 minutos)

Pré-requisito: conta gratuita na Cloudflare.

```bash
cd proxy

# 1. instalar o wrangler (CLI da Cloudflare)
npm install -g wrangler

# 2. logar na sua conta Cloudflare
wrangler login

# 3. cadastrar as credenciais da Videl como SEGREDOS (não vão pro código)
wrangler secret put VIDEL_EMAIL       # cole: gcaires@videltel.com.br
wrangler secret put VIDEL_PASSWORD    # cole a senha

# 4. publicar
wrangler deploy
```

No fim, o Wrangler mostra a URL do Worker, algo como:
`https://moita-videl-proxy.SEU-SUBDOMINIO.workers.dev`

## Ligar o painel ao proxy

No painel Moita Rev1, abra o console do navegador (F12) e rode uma vez:

```js
localStorage.setItem('MOITA_PROXY', 'https://moita-videl-proxy.SEU-SUBDOMINIO.workers.dev')
```

Recarregue a página. O painel passa a buscar dados **ao vivo** via proxy, de qualquer
lugar (GitHub Pages incluso). Para desligar: `localStorage.removeItem('MOITA_PROXY')`.

## Segurança

- Credenciais Videl ficam só como **segredos** no Cloudflare (não no repositório, não no navegador).
- `ALLOWED_ORIGINS` (em `wrangler.toml`) restringe quais sites podem chamar o proxy.
  Ajuste para a URL real onde o painel está publicado.
- O proxy é **somente leitura** (só GET nas rotas de dados) — não permite alterar nada na Videl.

## Rotas expostas

`/shipments` · `/quotes` · `/clients` · `/drivers` · `/vehicles` · `/documents`
(aceitam os mesmos query params da API Videl, ex: `?page=1&limit=100`)
e `/health` para checar o status do proxy.
