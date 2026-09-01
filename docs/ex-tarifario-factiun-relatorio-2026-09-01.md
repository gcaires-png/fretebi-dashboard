# RELATÓRIO DE ANÁLISE — PEDIDO DE EX-TARIFÁRIO FACTIUN SUN BR

**Cliente:** Factiun Sun BR Ltda (CNPJ 64.947.469/0001-15) · **Consultora:** Videl T&L (CNPJ 63.147.064/0001-30)
**Data da análise:** 01/09/2026 · **Base legal:** Resolução Gecex nº 512/2023 (compilada), Decreto nº 11.428/2023, Gecex 760/2025, Gecex 852/853/2026
**Responsáveis Videl:** Gearlison Caires (procurador/SEI) · José Adailton Santos (processo) · **Factiun:** Iñigo Bonilla, Johana Alcalde (documentação) · Tony Lamenha (representante legal) · Nathalyn Teiche (engenharia de aplicação)

Fontes analisadas: 17 threads de e-mail (05/05 a 01/09/2026), Drive (pasta "Ex-Tarifário Factiun", dossiês de 20/08, Parecer de 20/08, Pacote de 28/08), zips recebidos da Factiun em 20/08 e 01/09 (TCU, Amortecedor, Painel Dedicado, Sistema de Giro), Declarações de Usuário Final de 01/09, procuração e cartas assinadas.

---

## 1. SUMÁRIO EXECUTIVO

### O que a Factiun já entregou (muito mais que 50%)

| Bloco | Situação em 01/09 |
|---|---|
| Dossiês por componente (ficha, memória técnica, carta justificativa, datasheet, proforma, projeto de investimento, declaração de usuário final) | **4 dossiês completos**: TCU, Amortecedor, Painel Dedicado (20/08) e Sistema de Giro (01/09). Mancal/Cojinete recebido em 20/08 e **retirado** do pacote (ver 2.5) |
| Cartas justificativas assinadas digitalmente por Tony Lamenha | TCU (20/08), Amortecedor, Painel e Mancal (21/08). **Sistema de Giro: sem assinatura** |
| Procuração Factiun → Gearlison Caires (7 poderes, 12 meses) | Assinada digitalmente em 21/08 (ICP) |
| Projeto de Investimento (art. 4º §3º) | Versão completa de 15 páginas com business plan (receita, insumos, capex, mão de obra, cronograma) |
| Societário | Contrato social de constituição (JUCEMG, 22/01/2026) + cartão CNPJ (01/09). **Faltam a 1ª e a 2ª alterações contratuais** |
| Declaração de Usuário Final | BCP Energy S/A (Boa Hora, Tacaimbó-PE, 150 MWp). Recebida em 01/09 para TCU, Amortecedor e Sistema de Giro. **Sem assinatura** |
| Ganho de produtividade quantificado | 1.539 → 1.998 kWh/kWp/ano (+29,8%), PVsyst. **Relatório PVsyst não anexado e números divergentes entre documentos** |

### Veredito

**O pacote NÃO está pronto para protocolo.** Há 7 bloqueios, e qualquer um deles gera exigência ou indeferimento. Um pleito indeferido só pode ser reapresentado após 1 ano (Res. 512/2023). O cronograma de protocolo na 1ª quinzena de setembro **ainda é viável** se o cadastro SEI começar até 03/09 e as correções fecharem em 5 dias úteis.

| # | Bloqueio | Gravidade |
|---|---|---|
| 1 | **Cadastro de usuário externo no SEI/ColaboraGov não iniciado** (nenhuma evidência no e-mail; é o caminho crítico, 3 a 5 dias úteis de liberação, exige e-mail pessoal) | CRÍTICO |
| 2 | **Faturas proforma emitidas para Factiun Sun S.L. (Espanha), não para a pleiteante Factiun Sun BR**; a "proforma" da TCU é uma fatura real de 2 unidades EXW Navarra, com IVA espanhol, e não representa a operação de importação para o Brasil | CRÍTICO |
| 3 | **Declarações de Usuário Final sem assinatura** da BCP Energy, datadas em Belo Horizonte (a usuária é de Fortaleza), tituladas "Declaração de Projecto" e citando NCM 8479.90.90 no corpo mesmo nos pleitos 8517.62.59 e 8483.40.10 | CRÍTICO |
| 4 | **NCM da TCU trocado de 8479.90.90 (BK) para 8517.62.59 (BIT) sem parecer de classificação fiscal**; o precedente Ex 403 é em 8479.90.90; a Ficha 00 ainda diz "BK, II 14%" e a declaração cita 8479.90.90. Dossiê internamente inconsistente | CRÍTICO |
| 5 | **Sistema de Giro provavelmente já coberto pelo Ex 454 vigente (8483.40.10, até 31/12/2027)**: 55:1, 3.300–4.800 N·m, saída < 0,1 rpm, IP65. A spec Factiun é 55:1, 4.000 N·m, 0,027 rpm, IP66. Protocolar pleito para bem já contemplado leva a arquivamento e gasta a janela. A proforma chinesa ainda cita HS 8483.40.90 | ALTO |
| 6 | **Textos do "Ex pretendido" fora do padrão TEC** nas cartas (sem parâmetros numéricos, singular, marca "Sunner" na memória da TCU). Na carta do Sistema de Giro o texto foi **copiado da TCU** ("Unidade eletrônica de controle…"). Os textos corretos já existem no Pacote de 28/08 e precisam substituir os das cartas e formulários | ALTO |
| 7 | **Catálogo original do fabricante ausente ou não pesquisável**: Amortecedor só tem o "Item Data Sheet" da Factiun (falta catálogo XSD); Painel tem datasheet Sunpro como imagem; TCU tem datasheet Sunner em espanhol sem tradução. Sem catálogo do fabricante os parâmetros da descrição não têm lastro | ALTO |

### Prazos

| Etapa | Estimativa | Observação |
|---|---|---|
| Cadastro SEI (Gearlison) | 3 a 5 dias úteis | Iniciar 02/09; liberação até 09/09 |
| Correções documentais (itens 2 a 7) | 5 dias úteis | Factiun + Videl, até 09/09 |
| Protocolo (1 processo por NCM) | 10 a 15/09 | Amortecedor e TCU na 1ª onda |
| Análise documental MDIC | 1 a 4 semanas | Backlog regularizado em jul/2026 |
| Consulta pública | 30 dias corridos | Contestação → réplica em 10 dias úteis via intercorrente |
| Decisão Gecex + DOU | Ciclo observado 2026: ~4 meses (CP 08/2026: 24/02 → DOU 12/06) | Decisão estimada dez/2026 a fev/2027 |
| **Total** | **4 a 6 meses** (faixa legal/histórica: 4 a 12) | |

**Alerta de cronograma comercial:** as cartas preveem 1º embarque entre 11/2026 e 02/2027. O Ex-tarifário só vale para DI registrada **após** a publicação no DOU, sem retroatividade. Embarque em novembro/2026 chega antes da decisão e paga II cheio (14% BK / 20% BIT ou 12,6% conforme anexo Gecex 852/2026). A Factiun precisa decidir: atrasar o embarque para depois da decisão ou assumir o II cheio no primeiro lote.

---

## 2. ANÁLISE DE ELEGIBILIDADE

### 2.1 Quadro por componente

| Componente | NCM adotada | BK/BIT | II atual (declarado nos docs) | Ex vigente / precedente | Produção nacional | Veredito |
|---|---|---|---|---|---|---|
| Amortecedor hidráulico (XSD, China) | 8479.90.90 | BK | 14% | Sem Ex para o amortecedor; suportes têm Ex 336/337 (até 30/09/2027) | Baixo risco (nenhum fabricante nacional identificado; verificar Cofap/Marelli industrial por prudência) | **ELEGÍVEL — pleito mais sólido. 1ª onda** |
| TCU Tracker Control Unit (IED/Sunner, Espanha) | 8517.62.59 (alterada em 20/08; era 8479.90.90) | BIT | 20% | Ex 403 (8479.90.90) venceu 31/03/2026 sem renovação | Baixo risco | **ELEGÍVEL, condicionado a fixar a NCM** (ver 2.2) |
| Painel FV dedicado 45 W (Sunpro, China) | 8479.90.90 como parte do tracker | BK | 14% | Ex 465 (8479.90.90) venceu 31/03/2026 — precedente de classificação | Baixo risco como parte de tracker; **alto risco de reclassificação para 8541.43.00** (II 25%, vedado a Ex, Gecex 782/2025 revogou Ex 154/996–999) | **DECISÃO PENDENTE — 2ª onda** (ver 2.3) |
| Sistema de Giro (Youju, China): acionamento coroa 55:1 + motorredutor 24 VDC + suportes | 8483.40.10 (carta) · HS 8483.40.90 na proforma | BK | 12,6% | **Ex 454 (8483.40.10) vigente até 31/12/2027**; Ex 454/455/306/331/474 (8479.90.90) e Ex 401 (motor) até 30/11/2027; precedente Gecex 282/2021 | Nenhum fabricante nacional de série identificado | **NÃO PROTOCOLAR ANTES DO COTEJO** com o Ex 454 (ver 2.4) |
| Mancal / conjunto de rolamentos | 8479.90.90 | BK | 14% | Nenhum | **Fabricante nacional declarado** (MTR Solar/Arcol, Juiz de Fora) + parque de usinagem UHMW | **RETIRADO** (decisão do Pacote 28/08, mantida) |
| Anemômetro | 9015.80.90 | — | — | Ex 041 vigente até 30/09/2027 | — | Fora do escopo (decisão Factiun 23/07); usar Ex 041 na DI |
| RSU (transceptor Zigbee) | 8517.62.72 | BIT | — | Ex 003 vigente até 30/09/2027 | — | Cotejar arquitetura e usar Ex 003 |
| PC industrial (SCADA) | 8471.41.00 | BIT | — | Ex 037/025 não aproveitáveis | — | Saiu do escopo em agosto; sem dossiê |

Critérios gerais: nenhum dos bens é sistema integrado, usado, de consumo ou autopeça. O pleiteante é pessoa jurídica brasileira (art. 3º), com CNPJ ativo, contrato social registrado (NIRE 31217517922) e representante legal com procuração. A Factiun Sun BR é importadora direta e usuária na montagem (fábrica em Salvador-BA). Requisitos de elegibilidade formal **atendidos**.

### 2.2 TCU — a NCM precisa ser fixada antes de qualquer protocolo

- Até 20/08 toda a estratégia estava em 8479.90.90 (parte de tracker, BK, precedente Ex 403 "Unidades de controle para seguidor solar", vencido em 31/03/2026, janela aberta).
- No dossiê de 20/08 a memória técnica (Rev. 01) e a carta passaram para **8517.62.59** (BIT, II 20%), mas a Ficha 00 ficou em "BK, II 14%, Ex de referência 8479.90.90 Ex 403" e a Declaração de Usuário Final cita 8479.90.90 no corpo.
- Consequências: (a) NCM inconsistente dentro do mesmo processo é devolução certa (art. 4º, I: um NCM por pleito); (b) abandonar 8479.90.90 abre mão do precedente Ex 403, que é a prova mais forte de que o MDIC já aceitou a TCU como parte de tracker; (c) 8517.62.59 é posição de aparelhos de comunicação, e uma TCU com Zigbee/RS485/BLE pode ser defendida ali, mas uma classificação errada gera multa de 1% do valor aduaneiro (art. 711 do Regulamento Aduaneiro) e perda do Ex na DI.
- **Recomendação:** parecer de classificação do despachante (Marear/PlanetaComex) em 48h e, dado o valor anual (R$ 2,76 mi no ano 1, R$ 10,6 mi no ano n), protocolar em paralelo uma **Solução de Consulta de classificação na RFB**. Regra de decisão: sem parecer contrário, **voltar para 8479.90.90** e reaproveitar o precedente Ex 403. Seja qual for a decisão, todos os documentos do dossiê (ficha, memória, carta, declaração, proforma, formulário) têm de trazer o mesmo NCM.

### 2.3 Painel dedicado — manter na 2ª onda, com parecer prévio

- O dossiê está completo e a carta assinada, mas o Pacote de 28/08 tirou o módulo do Ex ("não é BK nem BIT"). O raciocínio de 09/07 (parte do tracker, precedente Ex 465, 72 células PERC) continua válido: o Ex 465 prova que o MDIC já aceitou um módulo pequeno de alimentação de tracker em 8479.90.90.
- O risco não é no MDIC, é na aduana: a RFB pode reclassificar em 8541.43.00 (II 25%, vedado a Ex). O valor em jogo é baixo (R$ 165 mil/ano de importação, ~R$ 23 mil de II no ano 1).
- **Recomendação:** não gastar a 1ª onda com ele. Pedir ao despachante parecer de classificação e, se favorável, protocolar como 2ª onda. Iniciar em paralelo a certificação INMETRO (Portaria 140/2022), cujo prazo de laboratório (60 a 120 dias) é independente do Ex e ainda não foi iniciado.

### 2.4 Sistema de Giro — cotejar com o Ex 454 antes de abrir processo

| Parâmetro | Ex 454 (8483.40.10, vigente até 31/12/2027) | Sistema de Giro Factiun (ficha técnica PT) |
|---|---|---|
| Redução | 55:1 | 55:1 |
| Torque de saída | 3.300 a 4.800 N·m | 4.000 N·m nominal (6.000 máx.) |
| Velocidade de saída | < 0,1 rpm | 0,027 rpm |
| Proteção | IP65 | IP66 |
| Aplicação | Seguidores solares | Seguidores solares |

- Se o redutor de coroa se enquadra no texto do Ex 454, **não há o que pleitear**: o benefício é do produto (art. 2º §1º), basta declarar o Ex na DI. Protocolar pleito para bem já contemplado é arquivado na análise documental.
- O que pode ficar fora do Ex 454 são o motor (comparar com Ex 401, 8479.90.90: 24 Vcc ~112 W, 1,4 rpm, redutor 1:55) e os suportes/cardan (FTR.25.00413, 1.716 un.), que podem cair em outras posições (7308/8479.90.90). A proforma da Youju cita **HS 8483.40.90**, não 8483.40.10; a divergência precisa ser fechada com o despachante.
- **Recomendação:** cotejo formal spec × texto legal (Ex 454/455, 401, 306/331/474) em 3 dias úteis pela Videl + despachante. Só abrir pleito novo para o que sobrar descoberto. Se abrir, corrigir a carta (texto do Ex copiado da TCU, ver 3) e colher assinatura.

### 2.5 Mancal — retirado, e por quê

Fabricante nacional declarado publicamente (MTR Solar/Arcol), economia estimada de R$ 770 mil contra risco de indeferimento com registro público de "existe produção nacional" e trava de 1 ano. Após a Gecex 760/2025 o critério de similaridade (art. 14, I) passou de cumulativo para alternativo, o que facilita a contestação. A carta assinada em 21/08 **não deve ser protocolada**. O valor de compra (R$ 2,16 mi no ano 1) segue no projeto de investimento como insumo importado sem Ex, o que é coerente.

### 2.6 Qualidade das descrições (padrão TEC)

A descrição define o alcance legal do Ex e é o campo mais lido na consulta pública. Situação atual:

| Dossiê | Texto do "Ex pretendido" na carta | Avaliação |
|---|---|---|
| Amortecedor | "Amortecedor hidráulico de aplicação específica em seguidores solares fotovoltaicos, desenvolvido para redução de vibrações… elevada resistência mecânica e proteção anticorrosiva…" | Singular, sem números. **Substituir** pelo texto do Pacote 28/08: força 3.300 a 8.650 N, curso 381 mm, tração ≥ 20 kN, -20 a +60 °C, ASTM B117 |
| TCU | "Unidade eletrônica de controle para rastreadores solares fotovoltaicos, destinada à gestão e ao controle de uma ou mais fileiras" | Sem parâmetros, e a memória usa "TCU Sunner" (marca). **Substituir** pelo texto do Pacote (backtracking, Zigbee/BLE/RS485, OTA, IP65/NEMA 3R, IEC 62817) e apagar a marca |
| Painel dedicado | "Módulo fotovoltaico monocristalino de 45 W, com 68 células em série, Vmp 39,16 V, conectores IP68, destinado à alimentação dedicada de unidades de controle…" | Melhor dos quatro. Passar para o plural, acrescentar dimensões 1.540 × 185 × 25 mm e "incompatível com geração à rede" |
| Sistema de Giro | **"Unidade eletrônica de controle para rastreadores solares…"** (texto da TCU) | **ERRO de copiar/colar.** Redigir texto próprio: redutores de coroa sem-fim 55:1, torque nominal 4.000 N·m, retenção 18 a 28 kN·m, saída 0,027 rpm, precisão ≤ 0,3°, IP66, -35 a +70 °C, com motorredutor planetário 24 Vcc |

Regra prática: plural, sem marca/modelo, parâmetros numéricos verificáveis no catálogo do fabricante, restritivo o suficiente para não abranger produto nacional.

---

## 3. DOCUMENTOS — STATUS POR ITEM

Legenda: **OK** pronto · **AJUSTAR** existe mas precisa correção · **FALTA** não recebido · **N/A** não se aplica

| Documento | Amortecedor | TCU | Painel dedicado | Sistema de Giro | Ação necessária | Responsável | Prazo |
|---|---|---|---|---|---|---|---|
| 00. Ficha de pleito | OK | AJUSTAR (BK/14%/Ex 403 vs 8517.62.59) | OK (campo "[DEFINIR OCP E LABORATÓRIO]" aberto) | OK | Alinhar NCM/categoria/alíquota da TCU; preencher OCP do painel | Videl | 05/09 |
| 01. Catálogo/datasheet **original do fabricante** | FALTA (só Item Data Sheet Factiun; pedir catálogo XSD) | AJUSTAR (DS Sunner em espanhol; traduzir) | AJUSTAR (Sunpro em imagem, não pesquisável; obter PDF nativo) | AJUSTAR (ficha Factiun PT + planos do fornecedor; obter catálogo Youju) | Obter catálogo do fabricante + tradução simples para português; anexar **somente o catálogo** no campo próprio | Factiun (Iñigo) | 08/09 |
| 03. Fatura proforma | AJUSTAR (XSD → Factiun Sun S.L., FOB Qingdao, 5.040 un., jun/2026, projeto espanhol) | AJUSTAR (fatura real IED SI26-0666, 2 un., EXW Navarra, IVA 21%) | AJUSTAR (Sunpro → Factiun Sun S.L., 2.420 un.) | AJUSTAR (Youju → Factiun Espanha, projeto "ILLIO III", HS 8483.40.90) | **Emitir proformas em nome de Factiun Sun BR Ltda**, destino Brasil (Recife/Salvador), quantidades e valores do projeto Boa Hora, com tradução | Factiun (compras) | 08/09 |
| 04. Procuração | OK (assinada 21/08, ICP) | OK | OK | OK | O arquivo "04. Procuração" nos zips é na verdade o **contrato social**; renomear e juntar a procuração real em cada processo | Videl | 05/09 |
| 04b. Contrato social consolidado | AJUSTAR | AJUSTAR | AJUSTAR | AJUSTAR | Recebida só a constituição (22/01/2026, sócia única Lamenha Participações, sede BH). Faltam a **1ª alteração (30/04, entrada da Factiun Sun SL com 90%)** e a **2ª alteração (10/08, sede Salvador)**, registradas na Junta | Factiun (Tony) | 05/09 |
| 04c. Cartão CNPJ | OK (recebido 01/09) | OK | OK | OK | Conferir se já consta o endereço de Salvador; a carta usa Salvador e a IE ainda é de MG | Videl | 03/09 |
| 05. Memória técnica | OK (Rev. 00, 21/08) | AJUSTAR (marca "Sunner", NCM) | OK | OK (Rev. 01, 01/09) | Remover marca; alinhar NCM | Factiun | 05/09 |
| 06. Projeto de investimento (art. 4º §3º) | OK | OK | OK | OK | Documento de 15 páginas completo (função, cronograma/local, ganho, tecnologia). Gerar PDF único e idêntico para todos os processos | Videl | OK |
| 07. Declaração de usuário final (BCP Energy S/A, CNPJ 48.909.887/0001-61) | **FALTA assinatura** | **FALTA assinatura** | **FALTA** (só versão 20/08) | **FALTA assinatura** | Assinatura do representante legal da BCP (gov.br ou ICP), datar em Fortaleza, título "Declaração de Usuário Final", corrigir NCM no corpo por processo, anexar simulação PVsyst como Anexo I | Factiun (Tony) + BCP | 09/09 |
| 08. Carta justificativa | OK (assinada 21/08; texto do Ex a substituir) | OK (assinada 20/08; texto do Ex a substituir) | OK (assinada 21/08) | **FALTA assinatura + texto do Ex errado** | Substituir textos TEC, reemitir e reassinar as quatro | Videl redige / Tony assina | 08/09 |
| Relatório PVsyst completo | FALTA | FALTA | FALTA | FALTA | Os números 1.539 → 1.998 kWh/kWp/ano não têm lastro; as cartas trazem geração 216.452 → 281.106 MWh/ano, que **não bate** com 1.539/1.998 × 150 MWp (230.850 → 299.700). Anexar o relatório e alinhar todas as tabelas | Factiun (engenharia) | 08/09 |
| Laudo técnico de engenheiro (CREA) | FALTA | FALTA | FALTA | FALTA | Não obrigatório; **recomendado** para Amortecedor e Sistema de Giro (dissimilaridade com número) antes da consulta pública | Videl contrata | 30/09 |
| Atestado ABIMAQ de inexistência de produção nacional | FALTA | FALTA | FALTA | FALTA | Solicitar antes do protocolo; blinda o pleito na consulta pública | Videl | 15/09 |
| Consultas a fabricantes nacionais (≥ 3) | FALTA | FALTA | FALTA | FALTA | Factiun confirmou em 04/08 que não fez. Não obrigatório na 512/2023, mas 3 consultas documentadas por e-mail (com prazo de resposta) fortalecem a réplica | Videl + Factiun | 15/09 |
| Cadastro SEI usuário externo (Gearlison) | **FALTA** | | | | Sem evidência de início. Caminho crítico | Gearlison | **02/09** |
| PDFs pesquisáveis, sem comentários, ≤ 30 MB | OK (docx sem comentários/track changes verificados nos zips de 20/08) | OK | AJUSTAR (datasheet Sunpro e cartão CNPJ são imagem) | OK | Regerar após correções; conferir texto selecionável | Videl | 09/09 |
| Contrato de consultoria Videl × Factiun (minuta v2.0) | interno | | | | Sem evidência de assinatura. Retainer R$ 2.000/mês a partir do protocolo, êxito 20% da economia de II. Formalizar antes do protocolo | Gearlison / Adam | 10/09 |

**Advertência do rito:** no SEI, o catálogo vai em documento separado dos demais anexos, pois é publicado na íntegra na consulta pública. Nunca juntar proforma, contrato social ou projeto de investimento no mesmo PDF do catálogo.

---

## 4. ESTRUTURA DO PROJETO DE INVESTIMENTO (preenchida com os dados da Factiun)

```
1. IDENTIFICAÇÃO DO PLEITEANTE
   Factiun Sun BR Ltda · CNPJ 64.947.469/0001-15 · NIRE 31217517922 (JUCEMG, 04/02/2026)
   Sede/fábrica: Rua dos Franciscanos, Galpão 8, Loteamento Dom Avelar, Pirajá, Salvador-BA, CEP 41.315-000
   Capital: R$ 500.000 (Factiun Sun SL 90% · Lamenha Participações 10%) · Lucro real
   Representante legal: Tony Wellington Lamenha Lins (CPF 081.907.294-03) · twlamenha@factiun.com
   Procurador SEI: Gearlison da Silva Caires (Videl T&L) · procuração de 21/08/2026, 12 meses

2. DESCRIÇÃO DO EQUIPAMENTO (um processo por NCM)
   2.1 Amortecedores hidráulicos — NCM 8479.90.90 (BK) — XSD Industrial, China
       Descrição TEC: "Amortecedores hidráulicos para seguidores solares fotovoltaicos, com força de
       amortecimento entre 3.300 e 8.650 N, curso nominal de 381 mm, resistência mínima à tração de 20 kN,
       faixa de operação de -20 °C a +60 °C e revestimento anticorrosivo ensaiado em névoa salina conforme
       ASTM B117, destinados à mitigação de vibrações estruturais induzidas pelo vento."
   2.2 Unidades de controle de seguidores (TCU) — NCM a fixar (8479.90.90 ou 8517.62.59) — IED/Sunner, Espanha
       Descrição TEC: "Unidades eletrônicas de controle de seguidores solares fotovoltaicos, com algoritmos
       integrados de rastreamento solar e de backtracking para terrenos inclinados, comunicação sem fio Zigbee
       e Bluetooth Low Energy e serial RS485, atualização remota de firmware, grau de proteção IP65/NEMA 3R,
       conforme IEC 62817, destinadas à gestão e ao acionamento de uma ou mais fileiras de seguidores."
   2.3 (2ª onda) Módulos FV dedicados 45 W — NCM 8479.90.90 — Sunpro, China
   2.4 (condicional) Sistema de giro — NCM 8483.40.10 — Youju, China — só para o que o Ex 454 não cobrir
   Aplicação: integração e montagem de seguidores solares Factiun TRX na unidade de Salvador-BA

3. PROJETO DE INVESTIMENTO
   Função na linha: integração de componentes mecânicos e eletrônicos nos trackers (etapa 6 do processo produtivo)
   Cronograma e local: protocolo set/2026 → decisão dez/2026–fev/2027 → 1º embarque (Shanghai/Valência → Recife)
       → montagem 12/2026 a 12/2027 na usina Boa Hora, Tacaimbó-PE (150,014 MWp, 1.709 seguidores)
   Ganho de produtividade: 1.539 → 1.998 kWh/kWp/ano (+459, +29,8%), simulação PVsyst; +68.850 MWh/ano nos 150 MWp
       Contribuição por bem: TCU habilita o rastreamento (backtracking = 3 a 5 p.p.); amortecedor amplia a
       disponibilidade sob vento (1,5 a 2,5 p.p.); sistema de giro executa o movimento
   Tecnologia inovadora: backtracking em terreno inclinado, 7 posições de segurança, OTA, amortecimento
       dimensionado para vento (2 milhões de ciclos)
   Valor do investimento (Factiun Sun BR): imobilizado R$ 585.300 (3 anos) · insumos importados ano 1
       R$ 8,07 mi (TCU R$ 2,76 mi · sistema de rotação R$ 2,49 mi · rolamentos R$ 2,16 mi · amortecedores
       R$ 636 mil · painéis R$ 165 mil) · receita ano 1 R$ 31 mi, ano n R$ 126 mi · 5 → 13 empregos diretos
   Operação amparada (usuária final BCP Energy): R$ 41,66 mi FOB em trackers, importação 12/2026 a 03/2027

4. COMPROVAÇÃO DE INEXISTÊNCIA DE PRODUÇÃO NACIONAL
   Memória técnica com dissimilaridade parametrizada (por bem) · carta justificativa · atestado ABIMAQ (a obter)
   · 3 consultas a fabricantes nacionais documentadas (a fazer) · laudo CREA (recomendado)

5. ANEXOS (um PDF por documento, pesquisável, em português, ≤ 30 MB)
   Catálogo do fabricante (separado) · proforma em nome da Factiun Sun BR + tradução · projeto de investimento
   · declaração de usuário final assinada + PVsyst · contrato social consolidado + cartão CNPJ · procuração
```

---

## 5. PASSOS OPERACIONAIS (SEI)

### 5.1 Onde e quem

- O MDIC não tem mais SEI próprio: o peticionamento é no **SEI/ColaboraGov** (colaboragov.sei.gov.br), operado pelo MGI (IN SSC/MGI nº 79/2026, art. 84). O login do SEI é próprio (não é a conta gov.br); gov.br entra só para assinar o Termo.
- Quem protocola é **pessoa física cadastrada como usuário externo**: Gearlison Caires, com a procuração de 21/08. O interessado do processo é a Factiun Sun BR (PJ, CNPJ).
- **E-mail do cadastro tem de ser pessoal e nominal.** E-mail corporativo (gcaires@videltel.com.br) é rejeitado. Criar regra de encaminhamento para não perder prazo de exigência.

### 5.2 Cadastro (caminho crítico — começar 02/09)

1. Pré-cadastro em colaboragov.sei.gov.br, "usuário externo", órgão MDIC. Dados idênticos ao RG, sem caixa alta.
2. Termo de Concordância e Veracidade (PDF do portal MGI) com os mesmos dados do passo 1.
3. Assinar: gov.br (assinador.iti.br, conta prata ou ouro) ou ICP-Brasil, ou próprio punho digitalizado.
4. Juntar RG e CPF em PDF.
5. Enviar: assinatura gov.br/ICP → e-mail sei@gestao.gov.br com assunto exatamente "Cadastro de Usuário Externo"; assinatura de próprio punho → Protocolo GOV.BR do MGI, tipo "11 — Solicitar cadastro de usuário externo no SEI".
6. Liberação: até 5 dias úteis (média 3).

### 5.3 Peticionamento (um processo por NCM)

1. Peticionamento → Processo Novo → tipo **"Política de Comércio Exterior: Ex-tarifário para BK e BIT: Concessão"**.
2. Especificação: razão social da pleiteante (nunca Videl). Interessado: PJ, CNPJ da Factiun Sun BR (conferir que a linha apareceu na tabela).
3. Documento principal: **formulário eletrônico dentro do SEI** (não é anexo). Só células vazias são editáveis; uma pessoa de contato; valores sem separador de milhar. **Copiar todo o conteúdo para um Word antes de peticionar** (o usuário externo perde acesso ao formulário depois).
4. Anexos, um por vez, tipo "Anexos", formato "Nato-digital" (PDF nascido digital) ou "Digitalizado". Só PDF, ≤ 30 MB.
5. **Janela de 1 hora**: o SEI apaga os arquivos se passar mais de 1 hora entre o primeiro e o último upload. Subir tudo de uma vez.
6. Peticionar → cargo/função → senha do SEI. Guardar o **Recibo Eletrônico de Protocolo** (número do processo).
7. Repetir para cada NCM (Amortecedor e TCU na 1ª onda).

### 5.4 Depois do protocolo

- Consulta pública de 30 dias no Portal do Ex-Tarifário (Painel de Consultas Públicas).
- Contestação de fabricante nacional → **réplica em 10 dias úteis, exclusivamente por Peticionamento Intercorrente** no mesmo processo. E-mail não integra o processo. Silêncio no prazo = desistência e arquivamento.
- Exigência/complementação: idem, só intercorrente.
- Decisão em reunião do Gecex; publicação no DOU por Resolução Gecex. Vigência a partir da publicação.

### 5.5 Contatos e referências

| Item | Contato |
|---|---|
| Divisão de Ex-tarifário MDIC (dúvidas de rito) | extarifario@mdic.gov.br (digitar à mão: o link do site aponta para endereço extinto do ME) |
| Consultas públicas | sdp.extarifario@mdic.gov.br |
| Cadastro SEI (MGI) | sei@gestao.gov.br · colaboragov.sei.gov.br |
| Encaminhar pleito (modelos) | gov.br/mdic/pt-br/assuntos/sdic/ex-tarifario/encaminhar-pleito |
| Plano B se o SEI travar | Protocolo.GOV.BR do MDIC, mesmos modelos |
| Despachante aduaneiro (classificação, DI) | Raimundo Nascimento (Marear) · Emerson Oliveira (PlanetaComex) |

---

## 6. RISCOS E RECOMENDAÇÕES

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Cadastro SEI atrasa e derruba a janela de setembro | Alta | Alto | Iniciar 02/09 com e-mail pessoal; assinatura gov.br para evitar o protocolo físico |
| R2 | Devolução por proforma em nome de terceiro (Factiun S.L.) / TCU com fatura real EXW | Alta | Alto | Proformas novas em nome da Factiun Sun BR, destino Brasil, quantidades do projeto |
| R3 | Devolução por declaração de usuário final sem assinatura ou com NCM divergente | Alta | Alto | Assinatura BCP (gov.br/ICP), uma declaração por processo com NCM correto |
| R4 | NCM da TCU errada: perda do precedente Ex 403, ou reclassificação na DI com multa | Média | Alto | Parecer do despachante + Solução de Consulta RFB; regra padrão 8479.90.90 |
| R5 | Sistema de Giro arquivado por já existir Ex 454 | Alta | Médio | Cotejo formal antes de protocolar; usar Ex 454/401 na DI |
| R6 | Contestação na consulta pública (amortecedor: fabricantes de amortecedores industriais; TCU: integradores nacionais) | Média | Alto | Descrição TEC com números, atestado ABIMAQ, 3 consultas documentadas, laudo CREA, kit de réplica pronto antes da CP (prazo de 10 dias úteis) |
| R7 | Números de produtividade sem lastro ou divergentes entre documentos (216.452 vs 230.850 MWh) | Alta | Médio | Anexar PVsyst e alinhar todas as tabelas ao relatório |
| R8 | Embarque em nov/2026 antes da decisão: II cheio no 1º lote | Alta | Médio | Decidir com a Factiun/BCP: adiar embarque ou assumir II cheio; não há retroatividade |
| R9 | Reclassificação do painel dedicado para 8541.43.00 (II 25%, vedado a Ex) | Média | Baixo (R$ 165 mil/ano) | 2ª onda, com parecer prévio; INMETRO em paralelo |
| R10 | Impacto no índice de nacionalização/FINAME do projeto Boa Hora | Baixa | Alto | Confirmar com a BCP/financiador se a importação dos componentes afeta enquadramento FINAME antes de decidir importar vs nacionalizar |
| R11 | Contrato Videl × Factiun não assinado; Videl protocola por procuração sem contrato | Média | Médio | Assinar minuta v2.0 antes do protocolo |
| R12 | Perda de prazo de exigência por notificação no e-mail pessoal do procurador | Média | Alto | Regra de encaminhamento + verificação semanal do processo no SEI (Adailton) |

**Duas correções ao entendimento anterior (já registradas no Pacote de 28/08):** a ABIMAQ não é adversária, é quem emite o Atestado de Inexistência de Produção Nacional; quem contesta é o fabricante individual na consulta pública. E a classificação 8479.90.90 do amortecedor e das partes do tracker está correta (tracker = 8479.89.99 pela SC COSIT 98011/2021; partes = 8479.90.90, BK com 112 Ex vigentes).

---

## 7. PRÓXIMOS PASSOS

### Até 48h (02 e 03/09)

| Ação | Responsável |
|---|---|
| Iniciar cadastro de usuário externo no SEI/ColaboraGov com e-mail pessoal | Gearlison |
| Responder à Factiun (rascunho pronto no Gmail): pendências 2, 3, 6, 7 e cotejo do Sistema de Giro | Gearlison |
| Pedir ao despachante parecer de classificação: TCU (8479.90.90 × 8517.62.59), Sistema de Giro (8483.40.10 × .90 × Ex 454), painel | Adailton |
| Conferir cartão CNPJ (endereço Salvador) e pedir 1ª e 2ª alterações contratuais | Adailton |
| Definir com Factiun/BCP quem assina a declaração e como (gov.br/ICP) | Tony / Iñigo |

### Até 09/09

| Ação | Responsável |
|---|---|
| Proformas novas (Factiun Sun BR, destino Brasil) para amortecedor, TCU, painel e sistema de giro | Factiun compras |
| Catálogos originais XSD, Sunner (traduzido), Sunpro (PDF nativo), Youju | Iñigo |
| Relatório PVsyst; alinhar 1.539/1.998 e MWh em memórias, cartas e declaração | Engenharia Factiun |
| Reescrever textos TEC nas 4 cartas e no formulário; remover "Sunner"; reassinar (Tony) | Videl redige / Tony |
| Declarações de usuário final assinadas pela BCP, uma por processo | Tony / BCP |
| Cotejo Sistema de Giro × Ex 454/455/401/306/331/474 | Adailton + despachante |
| Solicitar atestado ABIMAQ; disparar 3 consultas a fabricantes nacionais (amortecedor e TCU) | Videl |
| Regerar PDFs limpos e pesquisáveis; montar pasta final por processo | Adailton |
| Assinar contrato de consultoria Videl × Factiun | Gearlison / Nathalyn |

### 10 a 15/09 — protocolo da 1ª onda

Amortecedor (8479.90.90) e TCU (NCM fixada). Copiar formulário para Word antes de peticionar; subir anexos na janela de 1 hora; guardar recibos. Registrar números de processo na planilha de acompanhamento.

### Médio prazo (set a dez/2026)

- Monitorar Painel de Consultas Públicas semanalmente; kit de réplica pronto (comparativo ponto a ponto, capacidade real do contestante, prazo de entrega).
- 2ª onda: painel dedicado (com parecer) e sistema de giro (só o que ficar fora do Ex 454).
- INMETRO do painel 45 W em paralelo.
- Decisão comercial sobre o 1º embarque versus data de publicação no DOU.
- Laudo CREA para amortecedor e sistema de giro antes da CP.

### Ponto de contato na Videl

Gearlison Caires (procurador e usuário SEI) · gcaires@videltel.com.br · +55 11 94376-0266
José Adailton Santos (condução do processo) · jadam@videltel.com.br

**Planilha de acompanhamento:** `docs/ex-tarifario-factiun-acompanhamento.xlsx` (abas: Componentes, Documentos, Ações, Riscos, Cronograma).
