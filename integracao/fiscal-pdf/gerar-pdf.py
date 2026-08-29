#!/usr/bin/env python3
"""Moita Rev1 — Gera PDF fiscal (DACTE/DANFE/DAMDFE) a partir de XML.

Usa a biblioteca BrazilFiscalReport (Engenere):
    pip install brazilfiscalreport qrcode phonenumbers python-barcode

Uso:
    python3 integracao/fiscal-pdf/gerar-pdf.py doc1.xml [doc2.xml ...] [-o pasta_saida]

Detecta o tipo pelo conteúdo do XML:
    CT-e  -> DACTE   | NF-e -> DANFE | MDF-e -> DAMDFE | CC-e -> DACCe

ATENÇÃO — sentido da conversão: XML -> PDF. O caminho inverso (PDF -> XML)
não existe de forma fiscalmente válida: o XML autorizado deve ser baixado
do emissor (Bsoft) ou da SEFAZ.
"""

import argparse
import sys
from pathlib import Path


def detectar_tipo(xml: str) -> str:
    if "<infCte" in xml or "<CTe" in xml or "cteProc" in xml:
        return "cte"
    if "<infNFe" in xml or "nfeProc" in xml:
        return "nfe"
    if "<infMDFe" in xml or "mdfeProc" in xml:
        return "mdfe"
    if "<infEvento" in xml and "CCe" in xml:
        return "cce"
    return "desconhecido"


def gerar(xml_path: Path, saida_dir: Path) -> Path:
    xml = xml_path.read_text(encoding="utf-8")
    tipo = detectar_tipo(xml)

    if tipo == "cte":
        from brazilfiscalreport.dacte import Dacte
        doc, sufixo = Dacte(xml=xml), "DACTE"
    elif tipo == "nfe":
        from brazilfiscalreport.danfe import Danfe
        doc, sufixo = Danfe(xml=xml), "DANFE"
    elif tipo == "mdfe":
        from brazilfiscalreport.damdfe import Damdfe
        doc, sufixo = Damdfe(xml=xml), "DAMDFE"
    else:
        raise ValueError(
            f"{xml_path.name}: tipo de XML não reconhecido "
            "(esperado CT-e, NF-e ou MDF-e)"
        )

    saida = saida_dir / f"{sufixo}-{xml_path.stem}.pdf"
    doc.output(str(saida))
    return saida


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("xmls", nargs="+", help="arquivos XML fiscais")
    parser.add_argument("-o", "--saida", default=".", help="pasta de saída dos PDFs")
    args = parser.parse_args()

    saida_dir = Path(args.saida)
    saida_dir.mkdir(parents=True, exist_ok=True)

    erros = 0
    for caminho in args.xmls:
        xml_path = Path(caminho)
        try:
            pdf = gerar(xml_path, saida_dir)
            print(f"✅ {xml_path.name} -> {pdf}")
        except Exception as exc:  # noqa: BLE001 - reporta e segue o lote
            erros += 1
            print(f"❌ {xml_path.name}: {exc}", file=sys.stderr)

    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
