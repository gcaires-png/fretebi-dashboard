"""Cálculo de custo de frete com a regra de ouro da Videl T&L (meta 60-62%).

Uso como módulo:
    from calculo_frete import avaliar_custo
    resultado = avaliar_custo(custo_frete=Decimal("6100"), valor_operacao=Decimal("10000"))

Uso na linha de comando:
    python calculo_frete.py 6100 10000
"""
from __future__ import annotations

import sys
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from enum import Enum

CENTAVOS = Decimal("0.01")

META_MINIMA = Decimal("60")
META_MAXIMA = Decimal("62")
LIMITE_ATENCAO = Decimal("65")


class ClassificacaoCusto(Enum):
    """Faixas da tabela de custo de frete da Videl."""

    MARGEM_EXCELENTE = "margem excelente"   # < 60%
    META_IDEAL = "meta ideal"               # 60-62%
    ATENCAO = "atenção"                     # >62% a 65%
    CRITICO = "crítico"                     # > 65%


ACAO_RECOMENDADA = {
    ClassificacaoCusto.MARGEM_EXCELENTE: "Sinalizar margem boa ao comercial.",
    ClassificacaoCusto.META_IDEAL: "Prosseguir normalmente.",
    ClassificacaoCusto.ATENCAO: "Buscar motorista mais barato ou negociar valor.",
    ClassificacaoCusto.CRITICO: "Alertar, buscar alternativas e escalar se necessário.",
}


@dataclass(frozen=True, slots=True)
class AvaliacaoCusto:
    custo_frete: Decimal
    valor_operacao: Decimal
    percentual: Decimal
    classificacao: ClassificacaoCusto

    @property
    def acao_recomendada(self) -> str:
        return ACAO_RECOMENDADA[self.classificacao]

    @property
    def custo_maximo_na_meta(self) -> Decimal:
        """Maior custo de frete que ainda fecha dentro da meta de 62%."""
        return (self.valor_operacao * META_MAXIMA / 100).quantize(CENTAVOS, ROUND_HALF_UP)

    @property
    def reducao_necessaria(self) -> Decimal:
        """Quanto o custo precisa cair para entrar na meta (0 se já está)."""
        excesso = self.custo_frete - self.custo_maximo_na_meta
        return excesso if excesso > 0 else Decimal("0.00")


def avaliar_custo(*, custo_frete: Decimal, valor_operacao: Decimal) -> AvaliacaoCusto:
    """Classifica o custo do frete segundo a regra 60-62% da Videl.

    Levanta ValueError se os valores não forem positivos.
    """
    if valor_operacao <= 0:
        raise ValueError(f"valor_operacao deve ser positivo, recebi {valor_operacao}")
    if custo_frete <= 0:
        raise ValueError(f"custo_frete deve ser positivo, recebi {custo_frete}")

    percentual = (custo_frete / valor_operacao * 100).quantize(CENTAVOS, ROUND_HALF_UP)

    if percentual < META_MINIMA:
        classificacao = ClassificacaoCusto.MARGEM_EXCELENTE
    elif percentual <= META_MAXIMA:
        classificacao = ClassificacaoCusto.META_IDEAL
    elif percentual <= LIMITE_ATENCAO:
        classificacao = ClassificacaoCusto.ATENCAO
    else:
        classificacao = ClassificacaoCusto.CRITICO

    return AvaliacaoCusto(
        custo_frete=custo_frete,
        valor_operacao=valor_operacao,
        percentual=percentual,
        classificacao=classificacao,
    )


def _parse_valor(bruto: str, nome: str) -> Decimal:
    """Converte entrada humana ('6.100,50' ou '6100.50') em Decimal."""
    normalizado = bruto.strip().replace("R$", "").strip()
    if "," in normalizado:
        normalizado = normalizado.replace(".", "").replace(",", ".")
    try:
        return Decimal(normalizado)
    except InvalidOperation:
        raise SystemExit(f"{nome} inválido: {bruto!r}") from None


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    if len(args) != 2:
        print(__doc__)
        return 2
    resultado = avaliar_custo(
        custo_frete=_parse_valor(args[0], "custo_frete"),
        valor_operacao=_parse_valor(args[1], "valor_operacao"),
    )
    print(f"Custo do frete : R$ {resultado.custo_frete}")
    print(f"Valor operação : R$ {resultado.valor_operacao}")
    print(f"Percentual     : {resultado.percentual}%")
    print(f"Classificação  : {resultado.classificacao.value}")
    print(f"Ação           : {resultado.acao_recomendada}")
    if resultado.reducao_necessaria > 0:
        print(f"Reduzir custo em R$ {resultado.reducao_necessaria} "
              f"(máximo na meta: R$ {resultado.custo_maximo_na_meta})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
