# Qualidade de Código — Referência Moita Rev1

Tipagem, testes, ambiente e estrutura de projeto: o que separa script amador de
código profissional que a equipe confia.

## Sumário

1. [Estilo (PEP 8 na prática)](#estilo)
2. [Type hints](#type-hints)
3. [Testes com pytest](#testes-com-pytest)
4. [Ambientes virtuais e dependências](#ambientes-virtuais-e-dependências)
5. [Estrutura de projeto](#estrutura-de-projeto)
6. [Ferramentas de qualidade](#ferramentas-de-qualidade)
7. [Segurança](#segurança)

---

## Estilo

Guia oficial: PEP 8 (https://peps.python.org/pep-0008/). O que importa no dia a dia:

- `snake_case` para funções, métodos e variáveis; `PascalCase` para classes;
  `MAIUSCULA_COM_UNDERSCORE` para constantes de módulo.
- Nomes dizem **o que é**, não o tipo: `cotacoes_pendentes`, não `lista2`.
  Booleanos leem como pergunta: `esta_expirada`, `tem_seguro`.
- Linhas até ~88–100 colunas (limite do formatador que o projeto usar).
- Imports no topo, em três blocos: stdlib, terceiros, projeto — separados por
  linha em branco. Nunca `from modulo import *`.
- Comparações: `if not itens:` (não `len(itens) == 0`); `if valor is None:`
  (não `== None`).
- Docstring em toda função pública, em português, modo imperativo:
  `"""Calcula o percentual de custo da operação."""`
- Comentário explica **por que**, não **o que**: o código já diz o que faz.
  `# ANTT exige piso mínimo nesta faixa de distância` é útil;
  `# incrementa o contador` é ruído.

## Type hints

Tipagem é documentação verificável. Todo código novo da Videl é tipado.

```python
from collections.abc import Iterable, Iterator, Callable
from decimal import Decimal

def filtrar_criticas(
    cotacoes: Iterable[Cotacao],
    limite: Decimal = Decimal("65"),
) -> list[Cotacao]: ...

def buscar_motorista(placa: str) -> Motorista | None: ...   # pode não achar

PorRota = dict[tuple[str, str], list[Cotacao]]              # alias nomeado
```

Convenções (Python 3.10+):
- Genéricos nativos: `list[str]`, `dict[str, Decimal]` — não `List`/`Dict`
  de `typing`.
- União com `|`: `str | None` — não `Optional[str]`.
- **Parâmetro** de função: aceite o tipo mais geral (`Iterable`, `Sequence`);
  **retorno**: o tipo mais específico (`list`, `Motorista | None`).
- Retorno `None` explícito em função sem retorno: `-> None`.
- `Any` é a válvula de escape — cada `Any` é um lugar onde o verificador fica cego;
  use só na fronteira com dado externo, e converta para tipo concreto já na borda.
- Verifique com `mypy` ou `pyright` (ver Ferramentas).

Doc: https://docs.python.org/pt-br/3/library/typing.html

## Testes com pytest

`pip install pytest`. Arquivos `tests/test_*.py`, funções `test_*`, `assert` puro:

```python
# tests/test_calculo_frete.py
from decimal import Decimal
import pytest
from calculo_frete import avaliar_custo, ClassificacaoCusto

def test_custo_na_meta_60_62():
    r = avaliar_custo(custo_frete=Decimal("6100"), valor_operacao=Decimal("10000"))
    assert r.classificacao is ClassificacaoCusto.META_IDEAL
    assert r.percentual == Decimal("61.00")

def test_valor_operacao_zero_rejeitado():
    with pytest.raises(ValueError, match="positivo"):
        avaliar_custo(custo_frete=Decimal("1"), valor_operacao=Decimal("0"))

@pytest.mark.parametrize(("custo", "esperado"), [
    (Decimal("5900"), ClassificacaoCusto.MARGEM_EXCELENTE),   # < 60%
    (Decimal("6100"), ClassificacaoCusto.META_IDEAL),          # 60–62%
    (Decimal("6400"), ClassificacaoCusto.ATENCAO),             # 63–65%
    (Decimal("6800"), ClassificacaoCusto.CRITICO),             # > 65%
])
def test_faixas_de_classificacao(custo, esperado):
    r = avaliar_custo(custo_frete=custo, valor_operacao=Decimal("10000"))
    assert r.classificacao is esperado
```

O que testar primeiro (maior retorno por esforço):
1. **Regras de negócio puras** — cálculo de frete, classificação, validadores.
   São funções puras: fáceis de testar, caras quando erram.
2. **Fronteiras**: valor zero, negativo, string vazia, planilha sem cabeçalho,
   API retornando campo faltando.
3. **Parsing** de entrada externa (parse_cotacao, leitura de XML).

Como manter o código testável:
- Separe **decisão** de **efeito**: uma função decide o que fazer (pura, testável);
  outra executa (envia e-mail, chama API). Teste a decisão à exaustão; o efeito,
  com dublê.
- Injete dependências (sessão HTTP, relógio, caminho do banco) por parâmetro —
  o teste passa um fake. `monkeypatch` e `tmp_path` (fixtures nativas do pytest)
  cobrem ambiente e arquivos temporários.
- Não teste a biblioteca dos outros (pandas, requests) — teste o **seu** uso dela.

Rode com `pytest -q`; cobertura com `pytest --cov` (`pip install pytest-cov`).

## Ambientes virtuais e dependências

Um venv por projeto — nunca instale no Python do sistema:

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip freeze > requirements.lock     # versões exatas para reprodução
```

- `requirements.txt` com faixas (`requests>=2.31,<3`); lockfile com versões exatas.
- `.venv/` no `.gitignore`.
- Ferramenta moderna opcional: `uv` (rápido, mesmo modelo mental) ou `poetry`
  (projeto com empacotamento). Para os scripts da Videl, venv + requirements basta.

Doc: https://docs.python.org/pt-br/3/library/venv.html

## Estrutura de projeto

Script único: um `.py` bem organizado resolve. Quando passar de ~300 linhas ou
ganhar um segundo script que importa do primeiro, estruture:

```
moita-automacoes/
├── README.md
├── requirements.txt
├── .gitignore               # .venv/, .env, __pycache__/, *.db
├── .env.example             # nomes das variáveis, SEM valores
├── src/
│   └── moita/
│       ├── __init__.py
│       ├── config.py         # Config.do_ambiente()
│       ├── modelos.py        # dataclasses: Cotacao, Motorista, Operacao
│       ├── calculo_frete.py  # regras de negócio puras
│       ├── validadores.py
│       ├── bsoft.py          # cliente da API
│       └── cli/
│           └── resumo_diario.py
└── tests/
    ├── test_calculo_frete.py
    └── test_validadores.py
```

Princípios: regras de negócio não importam `requests` nem `smtplib` (dependência
aponta para dentro); cada módulo com um assunto; `modelos.py` sem lógica de I/O.

## Ferramentas de qualidade

Pipeline mínimo recomendado (tudo `pip install`ável, roda local e no CI):

| Ferramenta | Papel | Comando |
|---|---|---|
| `ruff` | Linter + formatador (substitui flake8/isort/black) | `ruff check --fix . && ruff format .` |
| `mypy` | Verificação de tipos | `mypy src/` |
| `pytest` | Testes | `pytest -q` |

Configuração no `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.mypy]
strict = true
```

Rodar os três antes de todo commit é o "portão de qualidade" — automatize com
`pre-commit` se o projeto crescer.

## Segurança

- **Injeção**: SQL sempre com placeholders (`?`); comandos externos sempre como
  lista de argumentos (`subprocess.run([...])`, nunca `shell=True` com dado externo).
- **Segredos**: variáveis de ambiente; nunca em código, log, commit ou mensagem
  de erro. Se um token vazar em commit, **revogue o token** — apagar o commit
  não desfaz o vazamento.
- **Dados de terceiros**: valide tudo que chega (ver `dados-apis.md`);
  `yaml.safe_load` (nunca `yaml.load`); jamais `pickle` ou `eval` em dado externo.
- **LGPD**: CPF, telefone e endereço de motorista são dados pessoais — logue o
  mínimo (mascare: `***.***.***-12`), armazene só o necessário, e não envie para
  serviço externo sem necessidade da operação.
- **Aleatoriedade de segurança**: `secrets`, não `random`.
- Dependências: instale só o que precisa, de nome exato (typosquatting existe);
  atualize com `pip list --outdated` periodicamente.
