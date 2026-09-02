# 05 — Memória descritiva técnica — Unidades de controle de seguidores solares (TCU)

**Pleiteante:** Factiun Sun BR Ltda · CNPJ 64.947.469/0001-15
**NCM:** 8479.90.90 — Partes de máquinas e aparelhos mecânicos com função própria (partes de seguidores solares, classificados em 8479.89.99 — SC COSIT 98011/2021) · **Categoria:** BK · **II atual:** 14%
**Revisão:** 02, de 02/09/2026 (substitui a Rev. 01 de 20/08/2026: remove a marca comercial da descrição e retorna à NCM 8479.90.90, alinhada à Ficha 00, à declaração de usuário final e ao precedente Ex 403)

## 1. Descrição do bem (texto do Ex pretendido)

Unidades eletrônicas de controle de seguidores solares fotovoltaicos, com algoritmos integrados de rastreamento solar e de backtracking para terrenos inclinados, comunicação sem fio Zigbee e Bluetooth Low Energy e serial RS485, atualização remota de firmware, grau de proteção IP65/NEMA 3R, conforme IEC 62817, destinadas à gestão e ao acionamento de uma ou mais fileiras de seguidores.

## 2. Função e aplicação

A unidade de controle (TCU) é o elemento que transforma uma estrutura móvel em seguidor solar: calcula a posição do sol, comanda o motorredutor do sistema de giro, aplica o algoritmo de backtracking (evita sombreamento entre fileiras ao amanhecer e entardecer, inclusive em terreno inclinado), gerencia as posições de segurança (7 posições: vento, granizo, neve, limpeza, manutenção, noite e falha) e comunica-se com a unidade de campo (RSU, Zigbee) e com o sistema supervisório. Sem a TCU o seguidor não rastreia. Dentro do ganho total de 1.539 → 1.998 kWh/kWp/ano (+29,8%) do seguidor sobre a estrutura fixa, o backtracking em terreno inclinado responde por **3 a 5 pontos percentuais**.

## 3. Características técnicas (parâmetros verificáveis no catálogo do fabricante)

| Parâmetro | Valor | Por que é requisito de projeto |
|---|---|---|
| Algoritmos de rastreamento e backtracking | Integrados, com correção para terreno inclinado | O sítio de Tacaimbó-PE tem declividade; backtracking plano gera sombreamento residual |
| Comunicação sem fio | Zigbee e Bluetooth Low Energy | Rede de campo entre 1.709 seguidores sem cabeamento de dados; comissionamento local por BLE |
| Comunicação serial | RS485 | Integração com inclinômetro, anemômetro e sistema supervisório |
| Atualização de firmware | Remota (OTA) | Atualização de algoritmos em campo sem intervenção física em 1.709 unidades |
| Grau de proteção | IP65 / NEMA 3R | Instalação ao ar livre, no poste do seguidor |
| Norma de referência | IEC 62817 | Norma de qualificação de projeto para seguidores solares |
| Posições de segurança | 7 | Proteção da estrutura em vento, granizo e falha |
| Alimentação | [tensão e consumo — catálogo IED] | Alimentação por módulo dedicado de 45 W |
| Faixa de temperatura | [catálogo IED] | Semiárido nordestino |

*Campos entre colchetes: preencher a partir do catálogo do fabricante (doc. 01) antes do protocolo.*

## 4. Dissimilaridade com produtos nacionais

Não foi identificado fabricante nacional de unidades de controle de seguidores solares que reúna algoritmo de backtracking para terreno inclinado, comunicação Zigbee/BLE/RS485, OTA e proteção IP65/NEMA 3R conforme IEC 62817. Controladores lógicos programáveis de uso geral produzidos no país não incorporam os algoritmos de rastreamento nem a rede de campo sem fio, e exigiriam desenvolvimento e certificação próprios. A comprovação será complementada por Atestado ABIMAQ (doc. 10) e consultas a integradores nacionais (doc. 12).

## 5. Precedentes de classificação e de Ex

- Seguidor solar: NCM 8479.89.99 (Solução de Consulta COSIT nº 98011/2021); partes: 8479.90.90 (BK).
- **Ex 403** — NCM 8479.90.90 — "Unidades de controle para seguidor solar" — vigente até 31/03/2026, não renovado: o MDIC já reconheceu a unidade de controle como parte de seguidor nesta posição.
- Nota de classificação: a unidade possui interfaces de comunicação (Zigbee, BLE, RS485), mas sua função essencial é o controle do movimento do seguidor, não a transmissão de dados; por isso classifica-se como parte do seguidor (8479.90.90) e não como aparelho de comunicação (8517.62). *Este entendimento será confirmado por parecer de classificação fiscal do despachante antes do protocolo.*

## 6. Origem e fornecimento

Fabricante: IED (Espanha). Importação direta pela Factiun Sun BR, via Valência → Recife, para integração na unidade de Salvador-BA. Valor previsto: R$ 2,76 mi no ano 1; R$ 10,6 mi no ano n.

## 7. Anexos da memória
- Catálogo do fabricante com tradução (documento 01, anexado em separado no SEI)
