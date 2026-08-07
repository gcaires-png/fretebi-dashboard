"""Template de ETL da Videl — copie e adapte para novas rotinas.

Esqueleto de rotina agendada com as práticas obrigatórias da casa:
- extrair → transformar → carregar em funções separadas e testáveis
- logging estruturado (nunca print)
- --dry-run para testar sem efeito colateral
- escrita atômica (arquivo temporário + replace)
- código de saída correto para o agendador (0 = ok, 1 = falha)

Uso:
    python template_etl.py --entrada cotacoes.csv --saida resumo.json [--dry-run]
"""
from __future__ import annotations

import argparse
import csv
import json
import logging
import sys
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from zoneinfo import ZoneInfo

TZ_SP = ZoneInfo("America/Sao_Paulo")
CENTAVOS = Decimal("0.01")

logger = logging.getLogger("moita.etl")


@dataclass(frozen=True, slots=True)
class Cotacao:
    cliente: str
    origem: str
    destino: str
    valor_operacao: Decimal
    custo_frete: Decimal

    @property
    def percentual_custo(self) -> Decimal:
        return (self.custo_frete / self.valor_operacao * 100).quantize(CENTAVOS, ROUND_HALF_UP)


class LinhaInvalida(ValueError):
    """Linha de entrada que não passou na validação."""


# --------------------------------------------------------------------------- #
# Extrair
# --------------------------------------------------------------------------- #

def extrair(entrada: Path) -> list[Cotacao]:
    """Lê o CSV de cotações, validando linha a linha.

    Linha inválida é registrada e pulada — uma linha ruim não derruba o lote.
    """
    cotacoes: list[Cotacao] = []
    with entrada.open(newline="", encoding="utf-8") as arq:
        for numero, linha in enumerate(csv.DictReader(arq), start=2):
            try:
                cotacoes.append(_parse_linha(linha))
            except LinhaInvalida as exc:
                logger.warning("Linha %d ignorada: %s", numero, exc)
    logger.info("Extraídas %d cotações de %s", len(cotacoes), entrada)
    return cotacoes


def _parse_linha(linha: dict[str, str]) -> Cotacao:
    obrigatorios = {"cliente", "origem", "destino", "valor_operacao", "custo_frete"}
    faltando = obrigatorios - {k for k, v in linha.items() if v and v.strip()}
    if faltando:
        raise LinhaInvalida(f"campos ausentes/vazios: {sorted(faltando)}")
    try:
        valor = Decimal(linha["valor_operacao"].replace(",", "."))
        custo = Decimal(linha["custo_frete"].replace(",", "."))
    except InvalidOperation as exc:
        raise LinhaInvalida(f"valor não numérico: {exc}") from exc
    if valor <= 0 or custo <= 0:
        raise LinhaInvalida(f"valores devem ser positivos: {valor}, {custo}")
    return Cotacao(
        cliente=linha["cliente"].strip(),
        origem=linha["origem"].strip().upper(),
        destino=linha["destino"].strip().upper(),
        valor_operacao=valor,
        custo_frete=custo,
    )


# --------------------------------------------------------------------------- #
# Transformar
# --------------------------------------------------------------------------- #

def transformar(cotacoes: list[Cotacao]) -> dict:
    """Agrega KPIs do lote — função pura, ideal para teste unitário."""
    if not cotacoes:
        return {"total": 0, "acima_da_meta": [], "percentual_medio": None}
    percentuais = [c.percentual_custo for c in cotacoes]
    medio = (sum(percentuais) / len(percentuais)).quantize(CENTAVOS, ROUND_HALF_UP)
    acima = [
        {"cliente": c.cliente, "rota": f"{c.origem} -> {c.destino}",
         "percentual": str(c.percentual_custo)}
        for c in cotacoes if c.percentual_custo > Decimal("62")
    ]
    return {
        "gerado_em": datetime.now(TZ_SP).isoformat(),
        "total": len(cotacoes),
        "percentual_medio": str(medio),
        "acima_da_meta": acima,
    }


# --------------------------------------------------------------------------- #
# Carregar
# --------------------------------------------------------------------------- #

def carregar(resumo: dict, saida: Path, *, dry_run: bool) -> None:
    """Grava o resumo em JSON com escrita atômica."""
    conteudo = json.dumps(resumo, ensure_ascii=False, indent=2)
    if dry_run:
        logger.info("[dry-run] Gravaria %d bytes em %s", len(conteudo), saida)
        return
    tmp = saida.with_suffix(saida.suffix + ".tmp")
    try:
        tmp.write_text(conteudo, encoding="utf-8")
        tmp.replace(saida)
    finally:
        tmp.unlink(missing_ok=True)
    logger.info("Resumo gravado em %s", saida)


# --------------------------------------------------------------------------- #
# Orquestração
# --------------------------------------------------------------------------- #

def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--entrada", type=Path, required=True, help="CSV de cotações")
    parser.add_argument("--saida", type=Path, required=True, help="JSON de resumo")
    parser.add_argument("--dry-run", action="store_true",
                        help="executa tudo mas não grava a saída")
    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    try:
        cotacoes = extrair(args.entrada)
        resumo = transformar(cotacoes)
        carregar(resumo, args.saida, dry_run=args.dry_run)
        logger.info("Concluído: %d cotações, %d acima da meta",
                    resumo["total"], len(resumo["acima_da_meta"]))
    except FileNotFoundError as exc:
        logger.error("Arquivo de entrada não encontrado: %s", exc.filename)
        return 1
    except Exception:
        logger.exception("Falha inesperada na execução do ETL")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
