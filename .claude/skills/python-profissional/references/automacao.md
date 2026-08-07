# Automação — Referência Moita Rev1

Scripts de linha de comando, rotinas agendadas, e-mail e coleta de dados — o
arsenal para automatizar a operação diária.

## Sumário

1. [Anatomia de um script profissional](#anatomia-de-um-script-profissional)
2. [argparse — interface de linha de comando](#argparse)
3. [Rotinas agendadas (cron) e idempotência](#rotinas-agendadas)
4. [E-mail: enviar e ler](#e-mail)
5. [Web scraping responsável](#web-scraping)
6. [Playwright para páginas dinâmicas](#playwright)
7. [Configuração e segredos](#configuração-e-segredos)

---

## Anatomia de um script profissional

Todo script da Videl segue este esqueleto (versão completa e adaptável em
`scripts/template_etl.py`):

```python
"""Envia o resumo diário de operações por e-mail.

Uso: python resumo_diario.py --data 2026-08-07 [--dry-run]
"""
from __future__ import annotations

import argparse
import logging
import sys

logger = logging.getLogger("moita.resumo_diario")

def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    try:
        executar(args)
    except Exception:
        logger.exception("Falha na execução")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

Por quê:
- `main()` retorna código de saída → cron/CI sabe se falhou.
- `main(argv)` recebendo argumentos → testável sem subprocess.
- `except Exception` **só aqui, na borda**: registra traceback completo e sai
  com 1 — o cron alerta, o log explica.
- Docstring de módulo com o modo de uso: `--help` de graça e documentação viva.

## argparse

```python
def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=date.fromisoformat,
                        default=date.today(), help="data do resumo (AAAA-MM-DD)")
    parser.add_argument("--dry-run", action="store_true",
                        help="monta o resumo mas não envia o e-mail")
    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args(argv)
```

- **Todo script que altera algo de verdade (envia e-mail, cria rascunho, grava)
  tem `--dry-run`.** É o que permite testar em produção sem medo.
- `type=` converte e valida na entrada (`date.fromisoformat`, `Path`, `int`).
- Doc: https://docs.python.org/pt-br/3/library/argparse.html

## Rotinas agendadas

Scripts do Moita rodam por agendador externo (cron, Cloud Scheduler, Zapier) — o
script em si roda **uma vez e termina**. Não escreva loop infinito com `sleep`.

O requisito central é **idempotência**: rodar duas vezes não pode duplicar
e-mail, rascunho de CT-e nem mensagem a motorista.

```python
def ja_processado(chave: str, banco: Path = Path("estado.db")) -> bool:
    """Retorna True se esta chave já foi processada (e registra se não foi)."""
    con = sqlite3.connect(banco)
    con.execute("CREATE TABLE IF NOT EXISTS processado (chave TEXT PRIMARY KEY, em TEXT)")
    with con:
        try:
            con.execute("INSERT INTO processado VALUES (?, ?)",
                        (chave, datetime.now(TZ_SP).isoformat()))
        except sqlite3.IntegrityError:
            return True
    return False

for cotacao in cotacoes_novas:
    if ja_processado(f"alerta:{cotacao.id}"):
        continue
    enviar_alerta(cotacao)
```

Mais regras de rotina agendada:
- Escreva arquivos de forma **atômica** (temporário + `replace`) — ver
  `fundamentos.md`, seção de context managers.
- Logue início, fim e contagens ("processadas 14 cotações, 2 alertas") — log
  vazio e log de sucesso precisam ser distinguíveis.
- Falhou no meio? A próxima execução deve retomar sozinha (por isso o registro
  de processados é por item, não por execução).

## E-mail

### Enviar (smtplib + EmailMessage)

```python
import smtplib
from email.message import EmailMessage

def enviar_email(assunto: str, corpo: str, para: list[str],
                 anexos: list[Path] = ()) -> None:
    msg = EmailMessage()
    msg["Subject"] = assunto
    msg["From"] = "logistica@videltel.com.br"
    msg["To"] = ", ".join(para)
    msg.set_content(corpo)
    for anexo in anexos:
        msg.add_attachment(
            anexo.read_bytes(),
            maintype="application", subtype="octet-stream",
            filename=anexo.name,
        )
    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(os.environ["EMAIL_USER"], os.environ["EMAIL_APP_PASSWORD"])
        smtp.send_message(msg)
```

- Gmail exige **senha de app** (não a senha da conta) com 2FA ativo.
- HTML: `msg.add_alternative(html, subtype="html")` mantendo a versão texto.
- No fluxo do Moita, prefira o MCP do Gmail quando disponível; `smtplib` é o
  fallback para script autônomo.

### Ler (imaplib) — só o essencial

Para monitorar caixa de entrada em script puro, `imaplib` + `email.parser`
funcionam, mas a API é de baixo nível e cheia de detalhes de RFC. No contexto
do Moita, o MCP do Gmail é o caminho preferido; recorra a `imaplib` apenas se
precisar de um daemon independente, e isole esse código num módulo próprio.

## Web scraping

Antes de raspar qualquer site:
1. **Existe API?** Use a API (FreteBras, Bsoft têm). Scraping é último recurso.
2. Respeite `robots.txt` e termos de uso.
3. Identifique-se (`User-Agent` honesto) e limite o ritmo (pausa entre requisições).

```python
# pip install beautifulsoup4
from bs4 import BeautifulSoup

resp = sessao.get(url, timeout=30)
resp.raise_for_status()
sopa = BeautifulSoup(resp.text, "html.parser")

for linha in sopa.select("table.fretes tr"):
    celulas = [td.get_text(strip=True) for td in linha.select("td")]
```

- Seletores CSS (`select`) são mais legíveis que cadeias de `find`.
- Scraper quebra quando o site muda: valide o resultado (contagens, campos
  obrigatórios) e alerte quando vier vazio — não assuma sucesso.

## Playwright

Para página que só renderiza com JavaScript (painéis logados como o FreteBras):

```python
# pip install playwright && playwright install chromium
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    navegador = pw.chromium.launch(headless=True)
    pagina = navegador.new_page()
    pagina.goto("https://novacentral.fretebras.com.br", timeout=60_000)
    pagina.fill('input[name="email"]', os.environ["FRETEBRAS_USER"])
    pagina.fill('input[name="password"]', os.environ["FRETEBRAS_PASS"])
    pagina.click('button[type="submit"]')
    pagina.wait_for_selector(".lista-fretes")     # espere elemento, não sleep
    fretes = pagina.locator(".lista-fretes .item").all_text_contents()
    navegador.close()
```

- **Nunca `time.sleep`** para esperar página: `wait_for_selector` /
  `expect` esperam a condição real e falham com timeout claro.
- Guarde o estado de login (`context.storage_state`) para não logar a cada execução.
- Automação de site logado é frágil e sujeita aos termos do serviço — prefira a
  API oficial sempre que existir.

## Configuração e segredos

```python
import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    bsoft_token: str
    email_user: str
    email_app_password: str
    dry_run: bool = False

    @classmethod
    def do_ambiente(cls) -> "Config":
        try:
            return cls(
                bsoft_token=os.environ["BSOFT_TOKEN"],
                email_user=os.environ["EMAIL_USER"],
                email_app_password=os.environ["EMAIL_APP_PASSWORD"],
                dry_run=os.environ.get("DRY_RUN", "") == "1",
            )
        except KeyError as exc:
            raise SystemExit(f"Variável de ambiente ausente: {exc}") from exc
```

- Falhe **no início** se faltar configuração — não no meio da execução.
- `.env` local para desenvolvimento (`pip install python-dotenv`;
  `load_dotenv()` no topo do `main`), e `.env` **sempre** no `.gitignore`.
- Nunca logue o valor de um segredo — logue só que ele existe/foi carregado.
