# Fundamentos de Python — Referência Moita Rev1

Referência prática dos fundamentos da linguagem. Para semântica completa, consulte
o tutorial oficial: https://docs.python.org/pt-br/3/tutorial/index.html

## Sumário

1. [Estruturas de dados essenciais](#estruturas-de-dados-essenciais)
2. [Comprehensions](#comprehensions)
3. [Funções](#funções)
4. [Dataclasses (modelos de domínio)](#dataclasses-modelos-de-domínio)
5. [Classes e protocolos](#classes-e-protocolos)
6. [Exceções](#exceções)
7. [Geradores e iteração](#geradores-e-iteração)
8. [Gerenciadores de contexto](#gerenciadores-de-contexto)
9. [Pattern matching (match)](#pattern-matching-match)
10. [Armadilhas clássicas](#armadilhas-clássicas)

---

## Estruturas de dados essenciais

Escolha pela semântica, não pelo hábito:

| Estrutura | Quando usar | Exemplo no domínio |
|---|---|---|
| `list` | Sequência ordenada, mutável | fila de cotações a processar |
| `tuple` | Registro imutável, tamanho fixo | `(origem, destino)` de uma rota |
| `dict` | Mapeamento chave → valor | `{placa: motorista}` |
| `set` | Unicidade e operações de conjunto | placas já contatadas hoje |
| `frozenset` | Conjunto imutável (pode ser chave de dict) | UFs atendidas |

```python
# Operações de conjunto resolvem cruzamentos sem loop duplo:
motoristas_disponiveis = {"ABC1D23", "XYZ9K88", "DEF4G56"}
ja_contatados = {"XYZ9K88"}
pendentes = motoristas_disponiveis - ja_contatados  # diferença
```

Dicionários preservam ordem de inserção (Python 3.7+). Para contagem e agrupamento,
prefira `collections.Counter` e `defaultdict` (ver `stdlib.md`).

## Comprehensions

Use para transformação/filtragem simples; se precisar de mais de uma condição
aninhada ou lógica com efeito colateral, volte para o `for` explícito.

```python
# Transformar + filtrar em uma expressão legível:
cotacoes_criticas = [
    c for c in cotacoes
    if c.percentual_custo > 65
]

# Dict comprehension para indexar por chave:
por_placa = {m.placa: m for m in motoristas}

# Generator expression quando não precisa materializar a lista:
total = sum(c.valor_frete for c in cotacoes)
```

## Funções

```python
def calcular_percentual_custo(custo_frete: Decimal, valor_operacao: Decimal) -> Decimal:
    """Retorna o custo do frete como percentual do valor da operação."""
    if valor_operacao <= 0:
        raise ValueError(f"valor_operacao deve ser positivo, recebi {valor_operacao}")
    return (custo_frete / valor_operacao * 100).quantize(Decimal("0.01"))
```

Regras que valem sempre:

- **Argumentos padrão mutáveis são proibidos**: `def f(itens=[])` compartilha a
  mesma lista entre todas as chamadas. Use `itens: list | None = None` e crie
  dentro da função.
- **Keyword-only para legibilidade** em funções com vários parâmetros:
  `def cotar(*, origem: str, destino: str, peso_kg: float)` obriga o chamador a
  nomear os argumentos — impossível trocar origem por destino sem perceber.
- Funções pequenas, uma responsabilidade. Se o nome precisa de "e" ("busca_e_envia"),
  são duas funções.
- `*args`/`**kwargs` só em wrappers/decorators genéricos; em código de domínio,
  parâmetros explícitos.

## Dataclasses (modelos de domínio)

O padrão da casa para representar cotação, motorista, operação, CT-e:

```python
from dataclasses import dataclass, field
from decimal import Decimal

@dataclass(frozen=True, slots=True)
class Cotacao:
    cliente: str
    origem: str
    destino: str
    valor_operacao: Decimal
    custo_frete: Decimal
    observacoes: list[str] = field(default_factory=list)

    @property
    def percentual_custo(self) -> Decimal:
        return (self.custo_frete / self.valor_operacao * 100).quantize(Decimal("0.01"))
```

- `frozen=True` → imutável: uma cotação recebida não muda por acidente; para
  "alterar", use `dataclasses.replace(cotacao, custo_frete=novo_valor)`.
- `slots=True` → menos memória e erro imediato em atributo digitado errado.
- Campos mutáveis (list/dict) sempre com `default_factory`, nunca `= []`.
- Precisa validar na construção? Use `__post_init__` para checar invariantes.

Doc oficial: https://docs.python.org/pt-br/3/library/dataclasses.html

## Classes e protocolos

Use classe "completa" (não dataclass) quando houver comportamento e estado interno
que evolui — ex.: um cliente de API com sessão e token.

```python
class BsoftClient:
    def __init__(self, base_url: str, token: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._sessao = requests.Session()
        self._sessao.headers["Authorization"] = f"Bearer {token}"

    def criar_rascunho_cte(self, dados: dict) -> str:
        resp = self._sessao.post(f"{self._base_url}/cte/rascunho", json=dados, timeout=30)
        resp.raise_for_status()
        return resp.json()["id"]
```

- Prefixo `_` marca API interna — respeite ao consumir código alheio.
- Prefira composição a herança. Herança só para hierarquia real de tipos
  (ex.: `DocumentoFiscal` → `CTe`, `MDFe`), não para reaproveitar código.
- Métodos "mágicos" úteis: `__repr__` (debug), `__eq__`/`__hash__`
  (dataclass já gera), `__enter__`/`__exit__` (contexto).

## Exceções

```python
class ErroIntegracaoBsoft(Exception):
    """Falha na comunicação com a API do Bsoft."""

try:
    cte_id = cliente.criar_rascunho_cte(dados)
except requests.Timeout as exc:
    raise ErroIntegracaoBsoft("Bsoft não respondeu em 30s") from exc
except requests.HTTPError as exc:
    logger.error("Bsoft rejeitou o rascunho: %s", exc.response.text)
    raise
```

- Capture **a exceção mais específica** que consegue tratar. `except Exception`
  só na borda do programa (o `main`), para registrar e sair com código != 0.
- `raise ... from exc` preserva a causa original — essencial para depurar
  integração que falhou às 3h da manhã.
- Exceções de domínio próprias (`ErroIntegracaoBsoft`, `CotacaoInvalida`) deixam
  o chamador tratar cada falha de um jeito.
- `finally` ou context manager para liberar recurso — nunca confie que "vai dar certo".
- EAFP é idiomático: tente e trate a exceção (`try: d[chave] except KeyError:`)
  em vez de checar antes — mas para dict, `d.get(chave, padrao)` costuma ser melhor.

Doc oficial: https://docs.python.org/pt-br/3/tutorial/errors.html

## Geradores e iteração

Gerador processa item a item sem carregar tudo na memória — ideal para arquivo
grande de cotações ou resposta paginada de API:

```python
from collections.abc import Iterator

def ler_cotacoes(caminho: Path) -> Iterator[Cotacao]:
    """Produz cotações uma a uma a partir do CSV, sem carregar o arquivo inteiro."""
    with caminho.open(newline="", encoding="utf-8") as arq:
        for linha in csv.DictReader(arq):
            yield Cotacao(
                cliente=linha["cliente"],
                origem=linha["origem"],
                destino=linha["destino"],
                valor_operacao=Decimal(linha["valor_operacao"]),
                custo_frete=Decimal(linha["custo_frete"]),
            )

def paginas_api(sessao: requests.Session, url: str) -> Iterator[dict]:
    """Percorre todas as páginas de um endpoint paginado."""
    while url:
        resp = sessao.get(url, timeout=30)
        resp.raise_for_status()
        corpo = resp.json()
        yield from corpo["items"]
        url = corpo.get("next")
```

Um gerador só pode ser percorrido **uma vez** — se precisar de duas passadas,
materialize com `list(...)`.

## Gerenciadores de contexto

`with` garante limpeza mesmo com exceção — arquivos, locks, conexões, transações:

```python
from contextlib import contextmanager

@contextmanager
def escrita_atomica(destino: Path):
    """Escreve em arquivo temporário e renomeia no final — nunca deixa arquivo pela metade."""
    tmp = destino.with_suffix(destino.suffix + ".tmp")
    try:
        with tmp.open("w", encoding="utf-8") as arq:
            yield arq
        tmp.replace(destino)   # rename é atômico no mesmo filesystem
    finally:
        tmp.unlink(missing_ok=True)
```

## Pattern matching (match)

Bom para despachar por formato de dado (ex.: eventos/webhooks de formatos diferentes):

```python
match evento:
    case {"tipo": "cotacao_nova", "cliente": cliente, "valor": valor}:
        processar_cotacao(cliente, Decimal(str(valor)))
    case {"tipo": "cte_emitido", "chave": chave} if len(chave) == 44:
        registrar_emissao(chave)
    case {"tipo": tipo}:
        logger.warning("Evento desconhecido: %s", tipo)
    case _:
        logger.error("Evento sem campo 'tipo': %r", evento)
```

Se um `if/elif` simples resolve com a mesma clareza, use o `if`.

## Armadilhas clássicas

- `if percentual == 62.0` com float falha por arredondamento → use `Decimal`.
- `lista_b = lista_a` NÃO copia — é a mesma lista. Copie com `list(lista_a)` ou
  `copy.deepcopy` se houver aninhamento.
- Modificar uma lista enquanto itera sobre ela pula itens — itere sobre uma cópia
  ou construa lista nova.
- `is` compara identidade, `==` compara valor. `is` só para `None`, `True`, `False`.
- Encadeamento acidental: `if uf == "SC" or "SP":` é sempre verdadeiro —
  o correto é `if uf in ("SC", "SP"):`.
- Strings são imutáveis: concatenar em loop é O(n²) — acumule em lista e
  finalize com `"".join(partes)`.
- Variável de closure em loop captura a variável, não o valor — use argumento
  padrão (`lambda x, uf=uf: ...`) quando criar lambdas dentro de um `for`.
