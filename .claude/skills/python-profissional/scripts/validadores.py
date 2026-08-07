"""Validadores de documentos e identificadores da operação logística.

Cobre: CNPJ, CPF, placa (Mercosul e padrão antigo) e chave de acesso de
CT-e/NF-e (44 dígitos com dígito verificador módulo 11).

Uso como módulo:
    from validadores import cnpj_valido, placa_valida, chave_acesso_valida

Uso na linha de comando:
    python validadores.py cnpj 63.147.064/0001-30
    python validadores.py placa ABC1D23
    python validadores.py chave 35260812345678000190570010000012341000012347
"""
from __future__ import annotations

import re
import sys

RE_PLACA_MERCOSUL = re.compile(r"^[A-Z]{3}\d[A-Z]\d{2}$")
RE_PLACA_ANTIGA = re.compile(r"^[A-Z]{3}\d{4}$")


def _somente_digitos(texto: str) -> str:
    return re.sub(r"\D", "", texto)


def cnpj_valido(cnpj: str) -> bool:
    """Valida CNPJ (com ou sem máscara) pelos dois dígitos verificadores."""
    digitos = _somente_digitos(cnpj)
    if len(digitos) != 14 or len(set(digitos)) == 1:
        return False

    def dv(parcial: str, pesos: list[int]) -> int:
        soma = sum(int(d) * p for d, p in zip(parcial, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6] + pesos1
    return (int(digitos[12]) == dv(digitos[:12], pesos1)
            and int(digitos[13]) == dv(digitos[:13], pesos2))


def cpf_valido(cpf: str) -> bool:
    """Valida CPF (com ou sem máscara) pelos dois dígitos verificadores."""
    digitos = _somente_digitos(cpf)
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False

    def dv(parcial: str) -> int:
        peso_inicial = len(parcial) + 1
        soma = sum(int(d) * (peso_inicial - i) for i, d in enumerate(parcial))
        resto = soma * 10 % 11
        return 0 if resto == 10 else resto

    return int(digitos[9]) == dv(digitos[:9]) and int(digitos[10]) == dv(digitos[:10])


def placa_valida(placa: str) -> bool:
    """Valida placa nos padrões Mercosul (ABC1D23) e antigo (ABC1234)."""
    normalizada = placa.strip().upper().replace("-", "")
    return bool(RE_PLACA_MERCOSUL.match(normalizada) or RE_PLACA_ANTIGA.match(normalizada))


def chave_acesso_valida(chave: str) -> bool:
    """Valida chave de acesso de CT-e/NF-e: 44 dígitos + DV módulo 11.

    O último dígito é o verificador, calculado sobre os 43 primeiros com
    pesos cíclicos de 2 a 9, da direita para a esquerda.
    """
    digitos = _somente_digitos(chave)
    if len(digitos) != 44:
        return False
    soma = 0
    peso = 2
    for d in reversed(digitos[:43]):
        soma += int(d) * peso
        peso = 2 if peso == 9 else peso + 1
    resto = soma % 11
    dv = 0 if resto in (0, 1) else 11 - resto
    return int(digitos[43]) == dv


def mascarar_cpf(cpf: str) -> str:
    """Retorna o CPF mascarado para log/exibição (LGPD): ***.***.***-12."""
    digitos = _somente_digitos(cpf)
    if len(digitos) != 11:
        return "***"
    return f"***.***.***-{digitos[-2:]}"


_VALIDADORES = {
    "cnpj": cnpj_valido,
    "cpf": cpf_valido,
    "placa": placa_valida,
    "chave": chave_acesso_valida,
}


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    if len(args) != 2 or args[0] not in _VALIDADORES:
        print(__doc__)
        return 2
    tipo, valor = args
    valido = _VALIDADORES[tipo](valor)
    print(f"{tipo} {valor!r}: {'VÁLIDO' if valido else 'INVÁLIDO'}")
    return 0 if valido else 1


if __name__ == "__main__":
    sys.exit(main())
