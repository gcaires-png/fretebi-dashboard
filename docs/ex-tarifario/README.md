# Ex-Tarifário Factiun Sun BR — Pacote de protocolo (1ª onda)

**Pleiteante:** Factiun Sun BR Ltda · CNPJ 64.947.469/0001-15
**Consultora / procurador SEI:** Videl T&L · Gearlison da Silva Caires
**Base:** `docs/ex-tarifario-factiun-relatorio-2026-09-01.md` (relatório de análise de 01/09/2026)
**Gerado em:** 02/09/2026

## Estrutura

| Pasta / arquivo | Conteúdo |
|---|---|
| `amortecedor/` | Processo 1 — Amortecedores hidráulicos, NCM 8479.90.90 (BK, II 14%) |
| `tcu/` | Processo 2 — Unidades de controle de seguidores (TCU), NCM 8479.90.90 (BK, II 14%), salvo parecer contrário do despachante |
| `comum/` | Documentos idênticos nos dois processos (procuração, societário, CNPJ, projeto de investimento, PVsyst, ABIMAQ, laudo CREA, consultas a fabricantes) |
| `substancia-checklist-protocolo-sei.md` (+ .docx / .pdf) | Guia passo a passo para os despachantes (Marear / PlanetaComex) protocolarem no SEI/ColaboraGov |
| `memorando-factiun-2026-09-02.md` (+ .docx / .pdf) | Ofício à Factiun com as correções aplicadas e as pendências com prazo |
| `dashboard-ex-tariff-factiun.html` | Painel em inglês para a Factiun acompanhar o processo (abre em qualquer navegador) |
| `_build/build_docs.py` | Regera os .docx e .pdf a partir dos .md |

## Regras que valem para todos os arquivos

1. **Um processo por NCM.** Amortecedor e TCU são dois peticionamentos separados, cada um com seu conjunto completo de anexos.
2. **Um PDF por documento**, pesquisável (texto selecionável), sem comentários ou controle de alterações, ≤ 30 MB, em português (documento estrangeiro acompanhado de tradução simples).
3. **O catálogo do fabricante vai sozinho** no campo próprio: ele é publicado na íntegra na consulta pública. Nunca juntar proforma, contrato social ou projeto de investimento no mesmo PDF do catálogo.
4. **Mesma NCM em todos os documentos do processo** (ficha, memória, carta, declaração de usuário final, proforma, formulário eletrônico).
5. **Sem marca ou modelo** na descrição do Ex pretendido. Plural, parâmetros numéricos verificáveis no catálogo.
6. Campos entre colchetes `[ ]` são lacunas que dependem de informação ainda não recebida (quantidades das proformas, número do processo, datas de assinatura). Não protocolar com colchetes.

## Nomenclatura dos PDFs finais (para upload no SEI)

```
<processo>_00_Formulario_Pleito_FactiunSunBR.pdf        (referência; o formulário real é preenchido dentro do SEI)
<processo>_01_Catalogo_Fabricante.pdf                    (anexo separado)
<processo>_03_Fatura_Proforma_e_Traducao.pdf
<processo>_04_Procuracao.pdf
<processo>_04b_Contrato_Social_Consolidado.pdf
<processo>_04c_Cartao_CNPJ.pdf
<processo>_05_Memoria_Descritiva_Tecnica.pdf
<processo>_06_Projeto_de_Investimento.pdf
<processo>_07_Declaracao_Usuario_Final_e_Anexo_PVsyst.pdf
<processo>_08_Carta_Justificativa.pdf
<processo>_10_Atestado_ABIMAQ.pdf                        (se obtido antes do protocolo)
<processo>_11_Laudo_Tecnico_CREA.pdf                     (recomendado; pode ser juntado por intercorrente antes da CP)
```
`<processo>` = `AMORT` ou `TCU`.
