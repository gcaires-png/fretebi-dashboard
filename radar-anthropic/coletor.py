#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Radar Anthropic — coletor de tudo que a Anthropic publica.

Varre, em uma única passada, todos os canais públicos da Anthropic:

  * anthropic.com  -> news, research, engineering, product, events, claude, ...
  * claude.com     -> blog, newsroom, customers
  * X / Twitter    -> @AnthropicAI, @ClaudeDevs, @claudeai (endpoint de sindicação)
  * Status         -> incidentes de plataforma (status.claude.com)
  * GitHub         -> CHANGELOG do Claude Code e dos SDKs (Python / TypeScript)
  * Docs           -> release notes da API e dos system prompts

Cada item é classificado por categoria (Modelos, Dev & Engenharia, Pesquisa,
Produto, Política & Sociedade, Negócios, Status & Incidentes, Eventos) e por
relevância para a operação da Videl (alta / média / baixa).

O resultado é um JSON incremental: itens já vistos são preservados, itens
inéditos ganham a marca "novo" e entram no resumo da rodada.

Sem dependências externas — só a biblioteca padrão do Python 3.9+.

Uso:
    python3 radar-anthropic/coletor.py
    python3 radar-anthropic/coletor.py --limite-metadados 200 --sem-x
    python3 radar-anthropic/coletor.py --saida dados/radar-anthropic.json
"""

from __future__ import annotations

import argparse
import concurrent.futures
import gzip
import hashlib
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import unescape

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTES_PADRAO = os.path.join(RAIZ, "radar-anthropic", "fontes.json")
SAIDA_PADRAO = os.path.join(RAIZ, "dados", "radar-anthropic.json")
RESUMO_PADRAO = os.path.join(RAIZ, "dados", "radar-anthropic-resumo.md")

UA = "Mozilla/5.0 (compatible; VidelRadarAnthropic/1.0; +https://www.videltel.com.br)"
MAX_ITENS_ESTADO = 5000
BYTES_METADADOS = 96 * 1024  # título/description ficam nos primeiros ~8 KB

# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------


def _contexto_ssl() -> ssl.SSLContext:
    cafile = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if cafile and os.path.exists(cafile):
        return ssl.create_default_context(cafile=cafile)
    return ssl.create_default_context()


_CTX = _contexto_ssl()


def http_get(url: str, max_bytes: int | None = None, tentativas: int = 3,
             timeout: int = 30) -> str | None:
    """GET com backoff. Retorna texto ou None. max_bytes corta o download."""
    espera = 2.0
    for tentativa in range(1, tentativas + 1):
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "*/*",
            "Accept-Encoding": "gzip",
            "Accept-Language": "en-US,en;q=0.9",
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
                bruto = r.read(max_bytes) if max_bytes else r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    try:
                        bruto = gzip.decompress(bruto)
                    except (OSError, EOFError):
                        # corte no meio do stream gzip: aproveita o que deu
                        bruto = _gunzip_parcial(bruto)
                return bruto.decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and tentativa < tentativas:
                time.sleep(espera)
                espera *= 2
                continue
            log(f"  ! HTTP {e.code} em {url}")
            return None
        except Exception as e:  # noqa: BLE001 — rede é imprevisível, seguimos
            if tentativa < tentativas:
                time.sleep(espera)
                espera *= 2
                continue
            log(f"  ! falha em {url}: {e}")
            return None
    return None


def _gunzip_parcial(bruto: bytes) -> bytes:
    d = __import__("zlib").decompressobj(16 + 15)
    try:
        return d.decompress(bruto)
    except Exception:  # noqa: BLE001
        return b""


def log(msg: str) -> None:
    print(msg, flush=True)


# --------------------------------------------------------------------------
# Classificação
# --------------------------------------------------------------------------

PALAVRAS = {
    "Modelos": [
        "opus", "sonnet", "haiku", "fable", "mythos", "introducing claude",
        "model card", "system card", "claude 3", "claude 4", "claude 5",
        "new model", "model family", "context window", "1m context",
    ],
    "Dev & Engenharia": [
        "claude code", "mcp", "model context protocol", "sdk", "api", "developer",
        "agent sdk", "cookbook", "skills", "artifact", "tool use", "prompt caching",
        "batch", "token", "cli", "plugin", "hooks", "subagent", "workflow",
        "release notes", "changelog", "extended thinking", "computer use",
        "code execution", "files api", "citations", "vscode", "jetbrains",
        "github action", "sandbox", "streaming", "structured output",
    ],
    "Pesquisa": [
        "interpretability", "alignment", "safety", "red team", "evaluation",
        "jailbreak", "sabotage", "sleeper", "constitutional", "scaling laws",
        "deception", "introspection", "persona", "reward hacking", "steering",
        "circuit", "feature", "probe", "welfare", "research",
    ],
    "Política & Sociedade": [
        "policy", "government", "economic index", "regulation", "congress",
        "national security", "transparency", "responsible scaling", "rsp",
        "public comment", "framework", "societal", "election", "eu ai act",
        "state department", "defense", "civil society",
    ],
    "Negócios": [
        "partnership", "customer", "enterprise", "availability", "pricing",
        "funding", "series ", "bedrock", "vertex", "azure", "foundry",
        "general availability", "expands", "launches in", "team plan",
        "startup", "acquisition", "hiring", "office",
    ],
}

# O que a operação da Videl precisa olhar de fato — não é "tudo que fala de IA".
RELEVANCIA_ALTA = [
    "claude code", "mcp", "model context protocol", "agent sdk", "pricing",
    "rate limit", "skills", "artifact", "prompt caching", "context window",
    "tool use", "subagent", "quota", "deprecat", "migration", "breaking change",
]
RELEVANCIA_MEDIA = [
    "enterprise", "integration", "connector", "workspace", "team plan",
    "availability", "bedrock", "vertex", "excel", "chrome", "desktop",
    "mobile", "slack", "google", "microsoft", "sdk", "api",
]


def classificar(titulo: str, resumo: str, secao: str, canal: str) -> str:
    """Devolve a categoria do item, combinando seção de origem e palavras-chave."""
    texto = f"{titulo} {resumo}".lower()

    # Seções que já definem a categoria por si só.
    fixos = {
        "engineering": "Dev & Engenharia",
        "research": "Pesquisa",
        "events": "Eventos",
        "product": "Produto",
        "features": "Produto",
        "learn": "Produto",
        "claude": "Produto",
        "system-cards": "Modelos",
        "responsible-scaling-policy": "Política & Sociedade",
        "economic-futures": "Política & Sociedade",
        "policy-on-the-ai-exponential": "Política & Sociedade",
        "transparency": "Política & Sociedade",
        "institute": "Pesquisa",
        "customers": "Casos de Cliente",
        "newsroom": "Anúncios",
    }
    if secao == "customers":
        return "Casos de Cliente"
    if canal == "Status":
        return "Status & Incidentes"
    if canal in ("Changelog", "Release Notes"):
        return "Dev & Engenharia"

    # Lançamento de modelo ganha de qualquer seção.
    if any(p in texto for p in ("introducing claude", "model card", "system card")) or \
       re.search(r"\bclaude\s+(opus|sonnet|haiku|fable|mythos)\b", texto):
        return "Modelos"

    if secao in fixos:
        base = fixos[secao]
        # Engineering/research falando de ferramenta continua sendo dev.
        if base == "Pesquisa" and any(p in texto for p in ("claude code", "mcp", "sdk")):
            return "Dev & Engenharia"
        return base

    melhor, pontos_melhor = "Anúncios", 0
    for categoria, palavras in PALAVRAS.items():
        pontos = sum(1 for p in palavras if p in texto)
        if pontos > pontos_melhor:
            melhor, pontos_melhor = categoria, pontos
    return melhor


def relevancia(titulo: str, resumo: str, categoria: str, canal: str = "") -> str:
    texto = f"{titulo} {resumo}".lower()
    if categoria == "Casos de Cliente":
        return "baixa"
    if categoria in ("Modelos", "Status & Incidentes"):
        return "alta"
    if categoria in ("Pesquisa", "Política & Sociedade", "Eventos"):
        return "média" if any(p in texto for p in ("claude code", "mcp", "agent")) else "baixa"
    if canal == "Changelog":
        return "alta" if any(p in texto for p in ("breaking", "deprecat", "remove")) else "média"
    if any(p in texto for p in RELEVANCIA_ALTA):
        return "alta"
    if any(p in texto for p in RELEVANCIA_MEDIA):
        return "média"
    return "baixa"


def marcar_tags(titulo: str, resumo: str) -> list[str]:
    texto = f"{titulo} {resumo}".lower()
    mapa = {
        "claude code": "claude-code",
        "model context protocol": "mcp",
        "mcp": "mcp",
        "sdk": "sdk",
        " api": "api",
        "agent": "agents",
        "skill": "skills",
        "artifact": "artifacts",
        "pricing": "preços",
        "safety": "segurança",
        "alignment": "alinhamento",
        "enterprise": "enterprise",
        "opus": "opus",
        "sonnet": "sonnet",
        "haiku": "haiku",
    }
    tags = []
    for chave, tag in mapa.items():
        if chave in texto and tag not in tags:
            tags.append(tag)
    return tags[:6]


# --------------------------------------------------------------------------
# Utilidades de item
# --------------------------------------------------------------------------


def id_item(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def agora() -> str:
    return iso(datetime.now(timezone.utc))


# Descrição institucional que a Anthropic usa como fallback em páginas sem resumo
# próprio — não diz nada sobre a publicação, então é melhor deixar em branco.
BOILERPLATE = (
    "anthropic is an ai safety and research company that's working to build "
    "reliable, interpretable, and steerable ai systems"
)


def limpar(texto: str | None) -> str:
    """Tira marcação HTML e entidades, inclusive quando vêm duplamente escapadas."""
    if not texto:
        return ""
    texto = unescape(texto)
    texto = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", texto, flags=re.S | re.I)
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = unescape(texto)
    return re.sub(r"\s+", " ", texto).strip()


def limpar_md(texto: str | None) -> str:
    """Markdown -> texto corrido: links viram rótulo, marcadores somem."""
    if not texto:
        return ""
    texto = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", texto)          # imagens
    texto = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", texto)        # links
    texto = re.sub(r"^\s*[-*+]\s+", "", texto, flags=re.M)        # bullets
    texto = re.sub(r"[*`>#]+", "", texto)   # ênfase/citação (o "_" fica: vira nome de campo)
    return limpar(texto)


def montar_item(*, url: str, titulo: str, resumo: str, data: str, fonte: str,
                canal: str, secao: str = "", autor: str = "",
                metadados_ok: bool = True, data_estimada: bool = False) -> dict:
    titulo = limpar(titulo) or url.rstrip("/").rsplit("/", 1)[-1].replace("-", " ").title()
    resumo = limpar(resumo)
    if resumo.lower().rstrip(". ").startswith(BOILERPLATE):
        resumo = ""
    resumo = resumo[:400]
    categoria = classificar(titulo, resumo, secao, canal)
    return {
        "id": id_item(url),
        "titulo": titulo,
        "resumo": resumo,
        "url": url,
        "data": data,
        "data_estimada": data_estimada,
        "fonte": fonte,
        "canal": canal,
        "secao": secao,
        "autor": autor,
        "categoria": categoria,
        "relevancia": relevancia(titulo, resumo, categoria, canal),
        "tags": marcar_tags(titulo, resumo),
        "metadados_ok": metadados_ok,
        "coletado_em": agora(),
    }


# --------------------------------------------------------------------------
# Coletores
# --------------------------------------------------------------------------


def coletar_sitemap(cfg: dict, estado_urls: set[str], urls_pendentes: set[str],
                    limite_metadados: int) -> list[dict]:
    """Lê um sitemap, separa as páginas editoriais e busca metadados do que falta.

    Entram na fila de metadados as URLs inéditas e também as que ficaram
    incompletas em rodadas anteriores (rate limit, timeout etc.).
    """
    nome = cfg["nome"]
    log(f"[sitemap] {nome}")
    xml = http_get(cfg["url"])
    if not xml:
        return []

    entradas: list[tuple[str, str]] = []  # (url, lastmod)
    for bloco in re.findall(r"<url>(.*?)</url>", xml, re.S):
        m_loc = re.search(r"<loc>\s*([^<]+?)\s*</loc>", bloco)
        if not m_loc:
            continue
        url = m_loc.group(1).strip()
        m_mod = re.search(r"<lastmod>\s*([^<]+?)\s*</lastmod>", bloco)
        entradas.append((url, (m_mod.group(1).strip() if m_mod else "")))

    # A home costuma carimbar o horário do último build do site. Todo lastmod
    # igual a ele é artefato de rebuild, não data de publicação.
    raiz = cfg["prefixo"].rstrip("/") + "/"
    build_ts = next((mod for url, mod in entradas if url.rstrip("/") + "/" == raiz), "")

    aceitas = set(cfg.get("secoes_aceitas", []))
    ignoradas = set(cfg.get("secoes_ignoradas", []))
    prefixo = cfg["prefixo"]
    idiomas = {"ja", "de", "fr", "ko", "it", "es", "pt-br", "zh-cn", "zh-tw", "ru", "id", "hi"}

    candidatos: list[tuple[str, str, str]] = []  # (url, lastmod, secao)
    vistos = set()
    for url, lastmod in entradas:
        if not url.startswith(prefixo):
            continue
        caminho = url[len(prefixo):].strip("/")
        if not caminho:
            continue
        partes = caminho.split("/")
        if cfg.get("somente_ingles") and partes[0].lower() in idiomas:
            continue
        secao = partes[0]
        if secao in ignoradas or secao not in aceitas:
            continue
        if len(partes) < 2:  # página índice da seção (ex.: /news), não é publicação
            continue
        if url in vistos:
            continue
        vistos.add(url)
        candidatos.append((url, lastmod, secao))

    inedts = [c for c in candidatos if c[0] not in estado_urls]
    reprise = [c for c in candidatos if c[0] in urls_pendentes]
    log(f"  {len(candidatos)} páginas na seção editorial | {len(inedts)} inéditas "
        f"| {len(reprise)} para completar")

    # Inéditas primeiro (da mais recente para a mais antiga), depois as pendentes.
    inedts.sort(key=lambda c: c[1], reverse=True)
    fila = inedts + reprise
    if limite_metadados and len(fila) > limite_metadados:
        log(f"  teto de metadados: buscando {limite_metadados} de {len(fila)} "
            f"(o restante entra nas próximas rodadas)")
        fila = fila[:limite_metadados]

    itens: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futuros = {pool.submit(_metadados_pagina, u): (u, mod, sec)
                   for u, mod, sec in fila}
        for fut in concurrent.futures.as_completed(futuros):
            url, lastmod, secao = futuros[fut]
            titulo, descricao, publicado, ok = fut.result()
            # lastmod carimbado no build não é data de publicação: fica em branco.
            rebuild = bool(build_ts) and lastmod == build_ts
            data = publicado or ("" if rebuild else _normalizar_data(lastmod))
            itens.append(montar_item(
                url=url, titulo=titulo, resumo=descricao, data=data,
                data_estimada=bool(data) and not publicado,
                fonte=nome, canal="Site", secao=secao, metadados_ok=ok,
            ))
    return itens


def _metas(html: str) -> dict[str, str]:
    """Lê as <meta> da página aceitando as duas ordens de atributos."""
    achadas: dict[str, str] = {}
    for tag in re.findall(r"<meta[^>]*>", html, re.I):
        chave = re.search(r'(?:property|name)\s*=\s*"([^"]+)"', tag, re.I)
        valor = re.search(r'content\s*=\s*"([^"]*)"', tag, re.I)
        if chave and valor:
            achadas.setdefault(chave.group(1).strip().lower(), valor.group(1))
    return achadas


def _metadados_pagina(url: str) -> tuple[str, str, str, bool]:
    """(titulo, descricao, data_publicacao, metadados_ok)"""
    html = http_get(url, max_bytes=BYTES_METADADOS, tentativas=3)
    if not html:
        return "", "", "", False

    metas = _metas(html)
    titulo = metas.get("og:title") or metas.get("twitter:title") or ""
    if not titulo:
        m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
        titulo = m.group(1) if m else ""
    titulo = re.sub(r"\s*[\\|\-–—]\s*(Claude by Anthropic|Anthropic|Claude)\s*$", "",
                    limpar(titulo))

    descricao = (metas.get("og:description") or metas.get("description")
                 or metas.get("twitter:description") or "")

    publicado = metas.get("article:published_time") or ""
    if not publicado:
        m = re.search(r'"datePublished"\s*:\s*"([^"]*)"', html)
        publicado = m.group(1) if m else ""

    return titulo, descricao, _normalizar_data(publicado), bool(titulo)


def _normalizar_data(valor: str) -> str:
    if not valor:
        return ""
    valor = valor.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y", "%d %B %Y"):
        try:
            return iso(datetime.strptime(valor, fmt).replace(tzinfo=timezone.utc))
        except ValueError:
            continue
    try:
        return iso(datetime.fromisoformat(valor.replace("Z", "+00:00")))
    except ValueError:
        pass
    try:
        return iso(parsedate_to_datetime(valor))
    except (TypeError, ValueError):
        return ""


def coletar_x(cfg: dict) -> list[dict]:
    """Posts do X: endpoint público de sindicação, com a API oficial como reserva.

    A sindicação funciona sem credencial, mas alguns perfis (ex.: @ClaudeDevs)
    devolvem timeline vazia porque não liberam embed. Nesses casos, se houver
    X_BEARER_TOKEN no ambiente, a API v2 cobre o buraco.
    """
    itens: list[dict] = []
    for perfil in cfg.get("perfis", []):
        log(f"[x] @{perfil}")
        posts = _x_sindicacao(cfg["endpoint"].format(perfil=perfil), perfil)
        if not posts:
            posts = _x_api_oficial(perfil)
        if not posts:
            log(f"  ! @{perfil} sem posts nesta rodada (rate limit do X ou perfil "
                f"sem embed público — defina X_BEARER_TOKEN para cobrir os dois casos)")
        else:
            log(f"  {len(posts)} posts lidos")
        itens += posts
        time.sleep(2)  # o endpoint de sindicação é sensível a rajada
    return itens


def _item_x(perfil: str, texto: str, link: str, data: str) -> dict:
    titulo = texto if len(texto) <= 110 else texto[:107].rstrip() + "..."
    return montar_item(url=link, titulo=titulo, resumo=texto, data=data or agora(),
                       fonte=f"X @{perfil}", canal="X", secao="post",
                       autor=f"@{perfil}")


def _x_sindicacao(url: str, perfil: str) -> list[dict]:
    html = http_get(url, tentativas=4, timeout=30)
    if not html:
        return []
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
                  html, re.S)
    if not m:
        return []
    try:
        entradas = json.loads(m.group(1))["props"]["pageProps"]["timeline"]["entries"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return []

    posts = []
    for entrada in entradas:
        tweet = (entrada.get("content") or {}).get("tweet")
        if not tweet:
            continue
        texto = limpar(tweet.get("full_text") or tweet.get("text") or "")
        if not texto:
            continue
        permalink = tweet.get("permalink") or f"/{perfil}/status/{tweet.get('id_str', '')}"
        link = "https://x.com" + permalink if permalink.startswith("/") else permalink
        posts.append(_item_x(perfil, texto, link,
                             _normalizar_data(tweet.get("created_at", ""))))
    return posts


def _x_api_oficial(perfil: str, maximo: int = 50) -> list[dict]:
    token = os.environ.get("X_BEARER_TOKEN")
    if not token:
        return []

    def _get(endereco: str) -> dict | None:
        req = urllib.request.Request(endereco, headers={
            "Authorization": f"Bearer {token}", "User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            log(f"  ! API do X falhou para @{perfil}: {e}")
            return None

    perfil_json = _get(f"https://api.x.com/2/users/by/username/{perfil}")
    uid = ((perfil_json or {}).get("data") or {}).get("id")
    if not uid:
        return []
    tl = _get(f"https://api.x.com/2/users/{uid}/tweets?max_results={maximo}"
              f"&tweet.fields=created_at,text&exclude=replies")
    posts = []
    for tweet in (tl or {}).get("data", []):
        texto = limpar(tweet.get("text", ""))
        if not texto:
            continue
        posts.append(_item_x(perfil, texto,
                             f"https://x.com/{perfil}/status/{tweet['id']}",
                             _normalizar_data(tweet.get("created_at", ""))))
    return posts


def coletar_status(fontes: list[dict]) -> list[dict]:
    itens: list[dict] = []
    for cfg in fontes:
        log(f"[status] {cfg['nome']}")
        xml = http_get(cfg["url"])
        if not xml:
            continue
        for bloco in re.findall(r"<entry>(.*?)</entry>", xml, re.S):
            link = re.search(r'<link[^>]*href="([^"]+)"', bloco)
            titulo = re.search(r"<title>(.*?)</title>", bloco, re.S)
            data = re.search(r"<published>([^<]+)</published>", bloco)
            conteudo = re.search(r"<content[^>]*>(.*?)</content>", bloco, re.S)
            if not link:
                continue
            itens.append(montar_item(
                url=link.group(1),
                titulo=titulo.group(1) if titulo else "Incidente",
                resumo=conteudo.group(1) if conteudo else "",
                data=_normalizar_data(data.group(1)) if data else agora(),
                fonte=cfg["nome"], canal="Status", secao="incidente",
            ))
    return itens


def coletar_changelogs(fontes: list[dict]) -> list[dict]:
    """Quebra um CHANGELOG.md em um item por versão publicada."""
    itens: list[dict] = []
    for cfg in fontes:
        log(f"[changelog] {cfg['nome']}")
        md = http_get(cfg["url"])
        if not md:
            continue
        blocos = re.split(r"^#{1,3}\s+", md, flags=re.M)
        contador = 0
        for bloco in blocos:
            linha, _, corpo = bloco.partition("\n")
            versao = re.match(r"v?(\d+\.\d+\.\d+[^\s\)]*)", linha.strip())
            if not versao:
                continue
            contador += 1
            if contador > cfg.get("max_versoes", 30):
                break
            m_data = (re.search(r"(\d{4}-\d{2}-\d{2})", linha) or
                      re.search(r"(\d{4}-\d{2}-\d{2})", corpo[:200]))
            data = _normalizar_data(m_data.group(1)) if m_data else ""
            resumo = limpar_md(corpo)[:400]
            itens.append(montar_item(
                url=f"{cfg['base_html']}#v{versao.group(1).replace('.', '')}",
                titulo=f"{cfg['nome'].split(' (')[0]} v{versao.group(1)}",
                resumo=resumo, data=data or "",
                fonte=cfg["nome"], canal="Changelog", secao="release",
            ))
        log(f"  {contador} versões")
    return itens


def coletar_release_notes(fontes: list[dict]) -> list[dict]:
    """Release notes da documentação: um item por data listada."""
    itens: list[dict] = []
    for cfg in fontes:
        log(f"[docs] {cfg['nome']}")
        md = http_get(cfg["url"])
        if not md:
            continue
        blocos = re.split(r"^#{2,3}\s+", md, flags=re.M)
        for bloco in blocos:
            linha, _, corpo = bloco.partition("\n")
            data = _normalizar_data(limpar_md(linha))
            if not data:
                continue
            resumo = limpar_md(corpo)[:400]
            if not resumo:
                continue
            ancora = data[:10]
            itens.append(montar_item(
                url=f"{cfg['base_html']}#{ancora}",
                titulo=f"{cfg['nome']} — {ancora}",
                resumo=resumo, data=data,
                fonte=cfg["nome"], canal="Release Notes", secao="release",
            ))
    return itens


# --------------------------------------------------------------------------
# Estado / saída
# --------------------------------------------------------------------------


def carregar_estado(caminho: str) -> dict:
    if not os.path.exists(caminho):
        return {"itens": []}
    try:
        with open(caminho, encoding="utf-8") as f:
            dados = json.load(f)
        if isinstance(dados, dict) and isinstance(dados.get("itens"), list):
            return dados
    except (json.JSONDecodeError, OSError) as e:
        log(f"! estado anterior ilegível ({e}); começando do zero")
    return {"itens": []}


def mesclar(anteriores: list[dict], coletados: list[dict]) -> tuple[list[dict], list[dict]]:
    """Preserva o histórico, marca como 'novo' só o que apareceu nesta rodada."""
    por_id = {}
    for item in anteriores:
        item["novo"] = False
        por_id[item["id"]] = item

    novos: list[dict] = []
    for item in coletados:
        antigo = por_id.get(item["id"])
        if antigo:
            # Reclassifica e completa lacunas sem perder a data de descoberta.
            if item.get("metadados_ok"):
                antigo["titulo"] = item["titulo"] or antigo.get("titulo", "")
                antigo["resumo"] = item["resumo"] or antigo.get("resumo", "")
                antigo["metadados_ok"] = True
            antigo.update({
                "categoria": item["categoria"],
                "relevancia": item["relevancia"],
                "tags": item["tags"],
            })
            # Data real substitui data estimada (lastmod de rebuild).
            if item["data"] and (not antigo.get("data") or
                                 (antigo.get("data_estimada") and not item["data_estimada"])):
                antigo["data"] = item["data"]
                antigo["data_estimada"] = item["data_estimada"]
            continue
        item["novo"] = True
        item["descoberto_em"] = agora()
        por_id[item["id"]] = item
        novos.append(item)

    todos = list(por_id.values())
    todos.sort(key=lambda i: (i.get("data") or "", i.get("descoberto_em") or ""), reverse=True)
    return todos[:MAX_ITENS_ESTADO], novos


def contar(itens: list[dict], campo: str) -> dict:
    contagem: dict[str, int] = {}
    for item in itens:
        chave = item.get(campo) or "—"
        contagem[chave] = contagem.get(chave, 0) + 1
    return dict(sorted(contagem.items(), key=lambda kv: kv[1], reverse=True))


def escrever_resumo(caminho: str, novos: list[dict], total: int) -> None:
    hoje = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
    linhas = [f"# Radar Anthropic — {hoje}", ""]
    if not novos:
        linhas += ["Nenhuma novidade desde a última coleta.", "",
                   f"Base acumulada: **{total}** publicações monitoradas."]
    else:
        linhas += [f"**{len(novos)} novidades** nesta rodada "
                   f"(base acumulada: {total} publicações).", ""]
        por_categoria: dict[str, list[dict]] = {}
        for item in novos:
            por_categoria.setdefault(item["categoria"], []).append(item)
        ordem = ["Modelos", "Dev & Engenharia", "Produto", "Pesquisa",
                 "Anúncios", "Negócios", "Política & Sociedade",
                 "Status & Incidentes", "Eventos"]
        chaves = [c for c in ordem if c in por_categoria] + \
                 [c for c in por_categoria if c not in ordem]
        for categoria in chaves:
            linhas.append(f"## {categoria}")
            linhas.append("")
            for item in sorted(por_categoria[categoria],
                               key=lambda i: i.get("data", ""), reverse=True):
                data = (item.get("data") or "")[:10] or "sem data"
                marca = " 🔴" if item["relevancia"] == "alta" else ""
                linhas.append(f"- **{data}** — [{item['titulo']}]({item['url']}) "
                              f"· _{item['fonte']}_{marca}")
                if item.get("resumo"):
                    linhas.append(f"  <br>{item['resumo'][:220]}")
            linhas.append("")
    linhas.append("---")
    linhas.append("_Gerado pelo Radar Anthropic — Moita Rev1 / Videl T&L_")
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser(description="Coletor do Radar Anthropic")
    ap.add_argument("--fontes", default=FONTES_PADRAO)
    ap.add_argument("--saida", default=SAIDA_PADRAO)
    ap.add_argument("--resumo", default=RESUMO_PADRAO)
    ap.add_argument("--limite-metadados", type=int, default=250,
                    help="máximo de páginas inéditas com metadados por rodada (0 = sem teto)")
    ap.add_argument("--sem-x", action="store_true", help="pula a coleta do X/Twitter")
    ap.add_argument("--sem-sitemap", action="store_true", help="pula os sitemaps")
    args = ap.parse_args()

    with open(args.fontes, encoding="utf-8") as f:
        cfg = json.load(f)

    estado = carregar_estado(args.saida)
    anteriores = estado.get("itens", [])
    urls_conhecidas = {i["url"] for i in anteriores}
    urls_pendentes = {i["url"] for i in anteriores if not i.get("metadados_ok", True)}
    log(f"Base atual: {len(anteriores)} itens ({len(urls_pendentes)} a completar)\n")

    coletados: list[dict] = []
    if not args.sem_sitemap:
        for sm in cfg.get("sitemaps", []):
            coletados += coletar_sitemap(sm, urls_conhecidas, urls_pendentes,
                                         args.limite_metadados)
    if not args.sem_x and cfg.get("x", {}).get("ativo"):
        coletados += coletar_x(cfg["x"])
    coletados += coletar_status(cfg.get("status", []))
    coletados += coletar_changelogs(cfg.get("changelogs", []))
    coletados += coletar_release_notes(cfg.get("release_notes", []))

    todos, novos = mesclar(anteriores, coletados)

    # Sem mudança real, nada é reescrito: evita commit a cada rodada só porque o
    # carimbo de horário mudou.
    impressao = hashlib.sha1(
        json.dumps(todos, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()
    if not novos and impressao == estado.get("impressao") and os.path.exists(args.saida):
        log("\nNada mudou desde a última coleta — arquivos preservados.")
        return 0

    limite_7d = iso(datetime.now(timezone.utc) - timedelta(days=7))
    saida = {
        "impressao": impressao,
        "gerado_em": agora(),
        "total": len(todos),
        "novos_nesta_coleta": len(novos),
        "novos_7_dias": sum(1 for i in todos if (i.get("data") or "") >= limite_7d),
        "pendentes_metadados": sum(1 for i in todos if not i.get("metadados_ok", True)),
        "por_categoria": contar(todos, "categoria"),
        "por_canal": contar(todos, "canal"),
        "por_fonte": contar(todos, "fonte"),
        "por_relevancia": contar(todos, "relevancia"),
        "itens": todos,
    }
    os.makedirs(os.path.dirname(args.saida), exist_ok=True)
    with open(args.saida, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=1)
    escrever_resumo(args.resumo, novos, len(todos))

    log(f"\n{'=' * 58}")
    log(f"Total monitorado : {len(todos)}")
    log(f"Novidades        : {len(novos)}")
    log(f"Por categoria    : {json.dumps(saida['por_categoria'], ensure_ascii=False)}")
    log(f"Arquivo          : {args.saida}")
    log(f"Resumo           : {args.resumo}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
