# Biblioteca Padrão — Referência Moita Rev1

Os módulos da stdlib que resolvem 90% do trabalho de um analista de logística,
com o uso idiomático de cada um. Índice completo oficial:
https://docs.python.org/pt-br/3/library/index.html

## Sumário

1. [pathlib — caminhos e arquivos](#pathlib)
2. [datetime + zoneinfo — datas e prazos](#datetime--zoneinfo)
3. [decimal — dinheiro](#decimal)
4. [json — APIs e configuração](#json)
5. [csv — planilhas simples](#csv)
6. [re — expressões regulares](#re)
7. [collections — Counter, defaultdict, deque](#collections)
8. [itertools + functools](#itertools--functools)
9. [logging — rastro de execução](#logging)
10. [sqlite3 — banco local](#sqlite3)
11. [subprocess, os, sys](#subprocess-os-sys)
12. [Outros que valem conhecer](#outros)

---

## pathlib

Sempre `Path`, nunca string concatenada com `/` ou `os.path.join`:

```python
from pathlib import Path

BASE = Path(__file__).parent          # pasta do próprio script
docs = BASE / "cte-drafts"            # operador / monta o caminho
docs.mkdir(parents=True, exist_ok=True)

for xml in sorted(docs.glob("*.xml")):        # todos os XML da pasta
    conteudo = xml.read_text(encoding="utf-8")

destino = docs / f"cte_{chave}.xml"
destino.write_text(xml_gerado, encoding="utf-8")

if destino.exists() and destino.stat().st_size > 0:
    ...
```

Métodos que mais aparecem: `.glob("**/*.pdf")` (recursivo), `.stem` (nome sem
extensão), `.suffix`, `.with_suffix(".bak")`, `.resolve()` (caminho absoluto),
`.unlink(missing_ok=True)` (apagar sem erro se não existe).

Doc: https://docs.python.org/pt-br/3/library/pathlib.html

## datetime + zoneinfo

Prazo de coleta, previsão de entrega, cotação expirando — tudo é datetime **com
timezone**. Datetime "ingênuo" (sem tz) só como detalhe interno de curta vida.

```python
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo

TZ_SP = ZoneInfo("America/Sao_Paulo")

agora = datetime.now(TZ_SP)
previsao_entrega = agora + timedelta(days=2, hours=6)
expira_em = cotacao.criada_em + timedelta(hours=24)
if agora > expira_em:
    alertar_expiracao(cotacao)

# Parse de string (formato ISO é o padrão de troca):
dt = datetime.fromisoformat("2026-08-07T14:30:00-03:00")

# Formatação para humanos:
print(previsao_entrega.strftime("%d/%m/%Y %H:%M"))

# Datas puras (sem hora) para vencimentos:
vencimento = date(2026, 8, 15)
dias_restantes = (vencimento - date.today()).days
```

Regras:
- Armazene e transmita em **ISO 8601** (`isoformat()`); formate `dd/mm/aaaa` só
  na borda, para exibir a humanos.
- Comparar datetime com tz e sem tz levanta `TypeError` — bom, o erro aparece cedo.
- Diferença de datetimes dá `timedelta`; `td.total_seconds()` para converter.

Doc: https://docs.python.org/pt-br/3/library/datetime.html

## decimal

Todo valor monetário. `float` erra centavos em soma longa; `Decimal` não.

```python
from decimal import Decimal, ROUND_HALF_UP

CENTAVOS = Decimal("0.01")

valor_operacao = Decimal("18500.00")
custo_frete = Decimal("11470.00")

percentual = (custo_frete / valor_operacao * 100).quantize(CENTAVOS, ROUND_HALF_UP)
# Decimal('62.00')
```

- Construa **de string** (`Decimal("18500.00")`) ou de int — nunca de float
  (`Decimal(0.1)` carrega o erro binário do float junto).
- `quantize(Decimal("0.01"))` fixa 2 casas; `ROUND_HALF_UP` é o arredondamento
  comercial brasileiro.
- Em JSON, serialize como string: `json.dumps({"valor": str(valor)})`.

Doc: https://docs.python.org/pt-br/3/library/decimal.html

## json

```python
import json
from pathlib import Path

config = json.loads(Path("insurance-rules.json").read_text(encoding="utf-8"))

Path("saida.json").write_text(
    json.dumps(dados, ensure_ascii=False, indent=2, default=str),
    encoding="utf-8",
)
```

- `ensure_ascii=False` para acentos legíveis ("São Paulo", não "São Paulo").
- `default=str` cobre `Decimal`, `datetime` e `Path` na serialização rápida;
  para contrato de API, converta explicitamente campo a campo.
- `json.JSONDecodeError` herda de `ValueError` — trate ao ler entrada externa.

## csv

Para arquivo pequeno/médio sem análise estatística (senão, pandas — ver
`dados-apis.md`):

```python
import csv

with Path("cotacoes.csv").open(newline="", encoding="utf-8") as arq:
    for linha in csv.DictReader(arq):           # dict por linha, chaves = cabeçalho
        print(linha["cliente"], linha["valor"])

with Path("relatorio.csv").open("w", newline="", encoding="utf-8") as arq:
    escritor = csv.DictWriter(arq, fieldnames=["cliente", "rota", "percentual"])
    escritor.writeheader()
    escritor.writerows(linhas)
```

- `newline=""` sempre (evita linha em branco extra no Windows).
- Planilha exportada do Excel brasileiro pode vir com `;` e latin-1:
  `csv.DictReader(arq, delimiter=";")` e `encoding="latin-1"` — detecte antes.

## re

Padrões do dia a dia da logística:

```python
import re

# Placa Mercosul (ABC1D23) ou antiga (ABC1234):
RE_PLACA = re.compile(r"^[A-Z]{3}\d[A-Z0-9]\d{2}$")

# Chave de acesso CT-e/NF-e: exatamente 44 dígitos
RE_CHAVE = re.compile(r"^\d{44}$")

# CNPJ formatado ou não:
RE_CNPJ = re.compile(r"^\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}$")

def extrair_chaves(texto: str) -> list[str]:
    """Extrai todas as chaves de acesso de 44 dígitos de um e-mail/texto."""
    return re.findall(r"\b\d{44}\b", texto)
```

- Compile padrões usados em loop (`re.compile`) e nomeie-os como constantes.
- Use raw string `r"..."` sempre.
- Regex valida **formato**; dígito verificador de CNPJ/chave é aritmética —
  use `scripts/validadores.py`.
- Para parsing complexo (XML de CT-e), regex é a ferramenta errada:
  use `xml.etree.ElementTree`.

Doc: https://docs.python.org/pt-br/3/library/re.html

## collections

```python
from collections import Counter, defaultdict, deque

# Quantas cotações por cliente:
por_cliente = Counter(c.cliente for c in cotacoes)
top3 = por_cliente.most_common(3)

# Agrupar motoristas por UF sem checar "se a chave existe":
por_uf: defaultdict[str, list[Motorista]] = defaultdict(list)
for m in motoristas:
    por_uf[m.uf].append(m)

# Fila com tamanho máximo (últimos 100 eventos):
ultimos_eventos: deque[str] = deque(maxlen=100)
```

`namedtuple` foi superado por `@dataclass` para código novo.

## itertools + functools

```python
from itertools import groupby, islice, chain
from functools import lru_cache, partial

# Processar em lotes de 50 (ex.: envio de mensagens):
def lotes(iteravel, tamanho):
    it = iter(iteravel)
    while lote := list(islice(it, tamanho)):
        yield lote

# Cache de consulta cara e determinística (distância entre cidades):
@lru_cache(maxsize=1024)
def distancia_km(origem: str, destino: str) -> float:
    ...
```

- `groupby` exige dados **ordenados pela mesma chave** antes — esquecimento clássico.
- `lru_cache` só em função pura (mesma entrada → mesma saída); nunca em método
  que depende de estado mutável.

## logging

Configuração padrão de script da Videl:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("moita.frete")

logger.info("Processando %d cotações", len(cotacoes))
logger.warning("Cotação %s acima da meta: %.1f%%", cot.id, cot.percentual_custo)

try:
    enviar()
except ErroIntegracaoBsoft:
    logger.exception("Falha ao criar rascunho do CT-e")  # registra o traceback
```

- Interpolação **lazy** com `%s` (não f-string) — o log só formata se o nível
  estiver ativo.
- `logger.exception(...)` dentro de `except` anexa o traceback automaticamente.
- Um logger por módulo: `logging.getLogger(__name__)`.
- Rotação de arquivo para serviço contínuo: `logging.handlers.RotatingFileHandler`.

Doc: https://docs.python.org/pt-br/3/howto/logging.html

## sqlite3

Banco embutido, zero instalação — ideal para histórico local de cotações/operações:

```python
import sqlite3

con = sqlite3.connect("operacoes.db")
con.row_factory = sqlite3.Row          # linhas acessíveis por nome de coluna
con.execute("""
    CREATE TABLE IF NOT EXISTS cotacao (
        id INTEGER PRIMARY KEY,
        cliente TEXT NOT NULL,
        valor_operacao TEXT NOT NULL,   -- Decimal como string
        criada_em TEXT NOT NULL         -- ISO 8601
    )
""")

with con:                              # transação: commit no sucesso, rollback no erro
    con.execute(
        "INSERT INTO cotacao (cliente, valor_operacao, criada_em) VALUES (?, ?, ?)",
        (cot.cliente, str(cot.valor_operacao), agora.isoformat()),
    )

criticas = con.execute(
    "SELECT * FROM cotacao WHERE cliente = ?", ("Bold S.A.",)
).fetchall()
```

- **Sempre placeholders `?`** — nunca f-string no SQL (injeção + erro de escape).
- `with con:` gerencia a transação; `con.close()` no fim.

Doc: https://docs.python.org/pt-br/3/library/sqlite3.html

## subprocess, os, sys

```python
import subprocess, os, sys

# Rodar comando externo com segurança (lista de args, nunca shell=True com input externo):
resultado = subprocess.run(
    ["git", "status", "--short"],
    capture_output=True, text=True, check=True, timeout=60,
)
print(resultado.stdout)

token = os.environ.get("BSOFT_TOKEN")
if not token:
    sys.exit("Defina a variável de ambiente BSOFT_TOKEN")  # msg no stderr, código 1
```

## Outros

- `tempfile` — arquivos/pastas temporários com limpeza automática.
- `shutil` — copiar/mover árvores de arquivos (`shutil.copy2`, `shutil.move`).
- `zipfile` — compactar anexos de e-mail, abrir remessas de XML.
- `xml.etree.ElementTree` — ler XML de CT-e/NF-e (com namespaces!).
- `smtplib` + `email.message.EmailMessage` — envio de e-mail (ver `automacao.md`).
- `secrets` — tokens seguros (`secrets.token_urlsafe(32)`); `random` NÃO serve
  para segurança.
- `statistics` — média/mediana rápidas sem pandas (`statistics.median(precos)`).
- `textwrap.dedent` — strings multilinha indentadas no código sem espaços extras.
- `argparse` — interface de linha de comando (ver `automacao.md`).
