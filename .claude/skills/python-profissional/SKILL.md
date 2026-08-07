---
name: python-profissional
description: >
  Skill profissional de Python para o Moita Rev1 (Videl T&L), baseada na documentação
  oficial em português (https://docs.python.org/pt-br/3/). Use SEMPRE que a tarefa
  envolver escrever, revisar, corrigir ou explicar código Python — scripts, automações,
  ETL, integrações com APIs (Bsoft, FreteBras), processamento de planilhas/CSV/JSON,
  cálculo de frete, validação de documentos (CNPJ, CT-e, chave de acesso), web scraping,
  envio de e-mail, agendamento de rotinas, testes ou análise de dados. Ative também
  quando pedirem "faz um script", "automatiza isso", "processa esse arquivo",
  "integra com a API", "calcula o frete em Python", mesmo sem citar "Python"
  explicitamente, se a solução natural for código Python.
---

# Python Profissional — Moita Rev1

Guia de trabalho para escrever Python de nível profissional na operação da Videl T&L.
Baseado na documentação oficial: https://docs.python.org/pt-br/3/ (sempre a fonte da
verdade para detalhes de linguagem e biblioteca padrão).

## Como usar esta skill

1. Identifique o tipo de tarefa na tabela abaixo.
2. Leia o arquivo de referência correspondente ANTES de escrever o código.
3. Se precisar de detalhe fino de API da linguagem, consulte o link oficial em
   `references/links-documentacao.md` (índice curado da doc pt-BR por tópico).
4. Siga os padrões de qualidade da seção "Padrão de código Videl" abaixo em todo
   código entregue — sem exceção.

| Tarefa | Referência |
|---|---|
| Sintaxe, estruturas de dados, funções, classes, geradores, exceções | `references/fundamentos.md` |
| Biblioteca padrão (pathlib, datetime, json, csv, re, logging, sqlite3…) | `references/stdlib.md` |
| APIs REST, requests, pandas, planilhas, validação de dados | `references/dados-apis.md` |
| Automação: CLI, agendamento, e-mail, arquivos, scraping | `references/automacao.md` |
| Qualidade: PEP 8, tipagem, testes, venv, estrutura de projeto | `references/qualidade.md` |
| Índice de links da documentação oficial pt-BR | `references/links-documentacao.md` |

Scripts prontos para reutilizar (não reescreva do zero o que já existe aqui):

- `scripts/calculo_frete.py` — cálculo de custo de frete com a regra de ouro 60–62%
  da Videl, piso mínimo e classificação de margem.
- `scripts/validadores.py` — validação de CNPJ, CPF, placa (Mercosul e antiga) e
  chave de acesso de CT-e/NF-e (44 dígitos, dígito verificador módulo 11).
- `scripts/template_etl.py` — esqueleto de ETL (extrair → transformar → carregar)
  com logging, tratamento de erro e escrita atômica, pronto para adaptar.

## Padrão de código Videl (resumo — detalhes em `references/qualidade.md`)

- **Python 3.10+**: use f-strings, `pathlib.Path`, `match` quando clarear o código,
  e union de tipos com `|` (`int | None`).
- **Type hints em toda função pública.** Assinatura tipada é documentação viva.
- **PEP 8**: `snake_case` para funções/variáveis, `PascalCase` para classes,
  `MAIUSCULA` para constantes, 4 espaços de indentação.
- **Nunca `except:` pega-tudo.** Capture a exceção específica; relance ou registre
  com `logging`, nunca silencie com `pass`.
- **Dinheiro é `Decimal`, nunca `float`.** Frete, pedágio, ICMS: `decimal.Decimal`
  com quantização em 2 casas (`ROUND_HALF_UP`). Float acumula erro de centavos.
- **Datas com timezone.** Use `datetime` com `zoneinfo.ZoneInfo("America/Sao_Paulo")`;
  nunca datetime "ingênuo" em dado que sai do processo.
- **`logging`, não `print`**, em qualquer script que rode sem supervisão
  (cron, automação, integração). `print` só em ferramenta interativa de uso único.
- **Segredos fora do código.** Tokens do Bsoft, senhas de e-mail: variáveis de
  ambiente (`os.environ`) ou arquivo `.env` fora do git — nunca hardcoded.
- **Scripts começam com `main()`** e o guard `if __name__ == "__main__":`;
  nada de lógica solta no nível do módulo.
- **Docstrings em português** no estilo imperativo: `"""Calcula o custo do frete…"""`.

## Fluxo de decisão rápido

- Manipular arquivo/pasta → `pathlib` (nunca concatenar string de caminho).
- Ler/escrever CSV pequeno → módulo `csv`; análise ou planilha grande → `pandas`.
- Chamar API REST → `requests` com `timeout=` sempre, sessão reutilizada e retry.
- Estrutura de dados de domínio (cotação, motorista, operação) → `@dataclass`.
- Texto com padrão (placa, CNPJ, chave CT-e) → `re` com padrão comentado, ou
  direto os validadores prontos em `scripts/validadores.py`.
- Tarefa repetitiva agendada → script idempotente + cron/agendador externo
  (ver `references/automacao.md`).

## Contexto de domínio (use nos exemplos e nomes)

O código do Moita vive no mundo da logística: cotações, fretes, motoristas, rotas,
CT-e/MDF-e, CNPJ/IE, placas, portos e prazos. Prefira nomes de domínio reais
(`custo_frete`, `valor_operacao`, `percentual_custo`, `chave_cte`) a nomes genéricos
(`x`, `data`, `value`). A meta de custo de frete da Videl é 60–62% do valor da
operação — a função de referência para isso já existe em `scripts/calculo_frete.py`.
