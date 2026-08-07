# Dados e APIs — Referência Moita Rev1

Como consumir APIs REST (Bsoft, FreteBras, nsdocs), processar planilhas e validar
dados com qualidade profissional.

## Sumário

1. [requests — cliente HTTP](#requests)
2. [Retry, timeout e resiliência](#retry-timeout-e-resiliência)
3. [Padrão de cliente de API](#padrão-de-cliente-de-api)
4. [pandas — análise e planilhas](#pandas)
5. [Excel (openpyxl via pandas)](#excel)
6. [Validação de dados de entrada](#validação-de-dados-de-entrada)
7. [XML de documentos fiscais](#xml-de-documentos-fiscais)

---

## requests

Biblioteca externa padrão para HTTP (`pip install requests`).

```python
import requests

resp = requests.get(
    "https://api.bsoftsistemas.com/cte",
    params={"status": "rascunho"},
    headers={"Authorization": f"Bearer {token}"},
    timeout=30,                     # SEMPRE. Sem timeout, o script trava para sempre.
)
resp.raise_for_status()             # levanta HTTPError em 4xx/5xx
dados = resp.json()

resp = requests.post(url, json=payload, timeout=30)   # json= serializa e põe o header
```

Regras inegociáveis:
- **`timeout=` em toda chamada.** O default é esperar para sempre.
- **`raise_for_status()` logo após a chamada** — status 500 com corpo de erro
  parseado como se fosse dado é bug silencioso clássico.
- **`Session` para várias chamadas** ao mesmo host: reaproveita conexão e
  centraliza headers.
- Encoding: `resp.json()` resolve; para texto bruto confira `resp.encoding`.

## Retry, timeout e resiliência

APIs falham. Integração profissional espera por isso:

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def criar_sessao(token: str) -> requests.Session:
    sessao = requests.Session()
    sessao.headers["Authorization"] = f"Bearer {token}"
    retry = Retry(
        total=3,
        backoff_factor=2,                    # espera 2s, 4s, 8s
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "PUT", "DELETE"),  # POST só se for idempotente!
    )
    adaptador = HTTPAdapter(max_retries=retry)
    sessao.mount("https://", adaptador)
    return sessao
```

- **Não faça retry automático de POST que cria coisas** (rascunho de CT-e,
  mensagem a motorista) — risco de duplicar. Prefira idempotency key se a API
  suportar, ou verifique existência antes de recriar.
- Respeite `Retry-After` em 429 (rate limit).
- Registre no log cada retry: silêncio esconde API degradada.

## Padrão de cliente de API

Um cliente por serviço, erros de domínio próprios, métodos que retornam tipos
do domínio (não dict cru):

```python
from dataclasses import dataclass
from decimal import Decimal

class ErroBsoft(Exception):
    """Erro de comunicação ou negócio na API do Bsoft."""

@dataclass(frozen=True)
class RascunhoCTe:
    id: str
    chave: str | None
    status: str

class BsoftClient:
    def __init__(self, sessao: requests.Session, base_url: str = "https://api.bsoftsistemas.com"):
        self._s = sessao
        self._base = base_url.rstrip("/")

    def criar_rascunho(self, payload: dict) -> RascunhoCTe:
        try:
            resp = self._s.post(f"{self._base}/cte/rascunho", json=payload, timeout=30)
            resp.raise_for_status()
        except requests.Timeout as exc:
            raise ErroBsoft("timeout ao criar rascunho") from exc
        except requests.HTTPError as exc:
            raise ErroBsoft(f"Bsoft respondeu {exc.response.status_code}: "
                            f"{exc.response.text[:500]}") from exc
        corpo = resp.json()
        return RascunhoCTe(id=corpo["id"], chave=corpo.get("chave"), status=corpo["status"])
```

Benefícios: testável (injeta sessão fake), troca de URL num lugar só, o resto do
código nunca vê `requests`.

## pandas

Para análise, agregação e planilha grande (`pip install pandas`).

```python
import pandas as pd

df = pd.read_csv("fretes.csv", dtype={"cnpj": str}, parse_dates=["data_coleta"])
# dtype str em CNPJ/placa/chave: senão o pandas "come" zeros à esquerda!

# Filtros e colunas derivadas:
df["percentual_custo"] = df["custo_frete"] / df["valor_operacao"] * 100
criticas = df[df["percentual_custo"] > 65]

# Agregação por rota:
resumo = (
    df.groupby(["origem", "destino"])
      .agg(qtd=("cliente", "size"),
           frete_medio=("custo_frete", "mean"),
           pct_medio=("percentual_custo", "mean"))
      .round(2)
      .reset_index()
      .sort_values("qtd", ascending=False)
)

resumo.to_csv("resumo_rotas.csv", index=False)
```

Cuidados:
- **Identificadores numéricos são texto** (`dtype=str`): CNPJ, CEP, placa, chave.
- `float64` do pandas tem o mesmo problema de centavos do float — para relatório
  gerencial tudo bem; para valor que vai em documento fiscal, volte a `Decimal`
  na saída.
- Valores ausentes: `df["col"].isna()`, `fillna()`, e cuidado com `NaN`
  contaminando somas.
- Encadeie operações (`.groupby().agg().reset_index()`) em vez de criar dezenas
  de variáveis intermediárias.
- pandas é para análise em memória; para fluxo item-a-item simples, o módulo
  `csv` + geradores basta e é mais leve.

## Excel

```python
# Ler (pip install openpyxl):
df = pd.read_excel("cotacoes.xlsx", sheet_name="Agosto", dtype={"cnpj": str})

# Escrever com múltiplas abas:
with pd.ExcelWriter("relatorio_diario.xlsx") as escritor:
    em_andamento.to_excel(escritor, sheet_name="Em andamento", index=False)
    resumo.to_excel(escritor, sheet_name="KPIs", index=False)
```

Planilha brasileira frequentemente usa vírgula decimal — `pd.read_csv(...,
decimal=",", sep=";")` resolve a maioria dos exports.

## Validação de dados de entrada

Todo dado que chega de fora (e-mail, planilha, API, formulário) é suspeito até
validado. Valide na **borda**, uma vez, e daí para dentro circule só objeto válido:

```python
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

class CotacaoInvalida(ValueError):
    """Dados de cotação que não passam na validação de entrada."""

def parse_cotacao(bruto: dict) -> Cotacao:
    """Valida e converte o dict cru (JSON/planilha) em Cotacao confiável."""
    faltando = {"cliente", "origem", "destino", "valor_operacao"} - bruto.keys()
    if faltando:
        raise CotacaoInvalida(f"campos ausentes: {sorted(faltando)}")
    try:
        valor = Decimal(str(bruto["valor_operacao"]).replace(".", "").replace(",", "."))
    except InvalidOperation as exc:
        raise CotacaoInvalida(f"valor_operacao inválido: {bruto['valor_operacao']!r}") from exc
    if valor <= 0:
        raise CotacaoInvalida(f"valor_operacao deve ser positivo: {valor}")
    return Cotacao(
        cliente=str(bruto["cliente"]).strip(),
        origem=str(bruto["origem"]).strip().upper(),
        destino=str(bruto["destino"]).strip().upper(),
        valor_operacao=valor,
        custo_frete=Decimal("0"),
    )
```

- Erros de validação devem dizer **qual campo** e **qual valor** falharam — quem
  lê o log precisa corrigir a planilha sem debugar código.
- CNPJ/CPF/placa/chave: use `scripts/validadores.py` (dígito verificador de verdade).
- Em projeto maior, considere `pydantic` (validação declarativa + serialização) —
  mas para scripts, dataclass + funções de parse como acima bastam.

## XML de documentos fiscais

CT-e e NF-e são XML com namespace — `ElementTree` resolve leitura:

```python
import xml.etree.ElementTree as ET

NS = {"cte": "http://www.portalfiscal.inf.br/cte"}

raiz = ET.parse("cte_35260812345678000190570010000012341000012349.xml").getroot()
chave = raiz.find(".//cte:infCte", NS).attrib["Id"].removeprefix("CTe")
valor = raiz.findtext(".//cte:vTPrest", namespaces=NS)
tomador = raiz.findtext(".//cte:toma3/cte:toma", namespaces=NS)
```

- Sem o dicionário de namespace, `find` não acha nada — erro nº 1 com XML fiscal.
- `findtext` retorna `None` se a tag não existe — trate antes de converter.
- Para **gerar** XML fiscal, não monte na mão: use a API do emissor (Bsoft) que
  já valida schema e assinatura.
