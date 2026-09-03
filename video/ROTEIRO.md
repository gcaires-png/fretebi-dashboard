# Vídeo — Videl T&L: Empresa + Tecnologia

Vídeo institucional em 1920×1080 (Full HD), 30 fps, 1min46s, gerado a partir de
`videl-apresentacao.html` (cenas animadas em CSS) renderizado quadro a quadro no
Chromium e montado com ffmpeg. Trilha ambiente sintetizada (sem direitos de
terceiros) e legendas em português embutidas (faixa `mov_text`) + arquivo
`legendas.srt` para locução.

## Cenas e tempos

| # | Tempo | Cena | Conteúdo |
|---|---|---|---|
| 1 | 0:00–0:08 | Abertura | Marca Videl · "Logística asset-light com torre de controle operada por IA" |
| 2 | 0:08–0:20 | Quem somos | Transporte dedicado e spot; modelo asset-light; cobertura nacional; cadeia solar; base SP |
| 3 | 0:20–0:33 | Operação ao vivo | Mapa do Brasil com rotas reais recentes; 8+ estados, 100% CT-e + seguro, 24h |
| 4 | 0:33–0:44 | O que fazemos | Cadeia solar, porta a porta, carga segurada, cotação em 24h; segmentos; limites da apólice |
| 5 | 0:44–0:49 | Capa Tecnologia | "Uma torre de controle com IA de verdade" |
| 6 | 0:49–1:03 | Moita Rev1 | Fluxo em 7 fases (cotação → custo → motorista → plataforma → cliente → CT-e rascunho → operação diária); meta de custo 60–62%; humano no comando |
| 7 | 1:03–1:18 | Stack Videl | Plataforma Videl, FreteBI, Painel Moita, Bsoft, Controle de Atividades, Proxy Cloudflare, Motor comercial, Integrações |
| 8 | 1:18–1:28 | Agentes de IA | G0 a G10 + Moita; CEO decide |
| 9 | 1:28–1:37 | Time | Gearlison, Adam, Anderson, Hudson; pontes Brasil–China–Europa–África |
| 10 | 1:37–1:46 | Encerramento | CTA cotação 24h / frete-teste; site, e-mail, WhatsApp, CNPJ |

## Locução (texto em `legendas.srt`)

Para adicionar voz: grave a locução seguindo `legendas.srt` (os tempos já batem
com as cenas) e substitua a trilha:

```bash
ffmpeg -i videl-apresentacao.mp4 -i locucao.wav -i audio.wav \
  -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.5[m];[v][m]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -map 0:s -c:v copy -c:a aac -c:s mov_text videl-com-locucao.mp4
```

## Regerar o vídeo

```bash
cd video
FF="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
python3 gen-audio.py "$FF"          # trilha ambiente -> audio.wav
NODE_PATH=/opt/node22/lib/node_modules node render.js "$PWD" "$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')" videl-apresentacao.mp4 30 106.5
```

Requisitos: Node 22 + `playwright` (Chromium), `pip install imageio-ffmpeg`.
`videl-apresentacao.html` também roda sozinho no navegador (as animações tocam
em tempo real), servindo como versão web da apresentação.

## Fontes do conteúdo

- `CLAUDE.md` (fluxo operacional do Moita Rev1, regra de custo 60–62%)
- `docs/guia-feira-intersolar-videl.md` (pitch institucional e de tecnologia, time)
- `operacao-3d.html` (rotas recentes, KPIs de operação, pilares)
- `proxy/README.md`, `integracao/CONECTAR-PLANILHAS.md` (arquitetura)
- `videl-comercial/README.md` e `config/regras-seguro.json` (motor comercial, limites da apólice)
- Skills G0–G10 (diretoria virtual de agentes)
