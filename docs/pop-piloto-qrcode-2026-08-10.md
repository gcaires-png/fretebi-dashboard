# POP — Piloto de Rastreabilidade de Operação (QR Code)
**Videl T&L · CNPJ 63.147.064/0001-30**
Versão 1.0 · Início: segunda-feira, 10/08/2026 · Duração: 5 dias úteis (10 a 14/08)
Dono do piloto: **José Adailton (Gerente)** · Patrocinador: Gearlison Caires (Diretor Geral)

---

## 1. Por que este piloto existe

Não é um projeto de tecnologia. É a resposta a duas perdas reais e recentes:

| Evento | Data | Perda |
|---|---|---|
| Golpe CT-e 189 — "Manoel Fitz" (Construcrill, Itapevi/SP → Feira de Santana/BA) | 23–24/07/2026 | Adiantamento de 80% pago a motorista não validado. Operação fechou com prejuízo. |
| Ocorrência AVT 3263 / NF 29946-29947 — entrega fora do padrão (ajudante não previsto) | 06/08/2026 | Retrabalho e desgaste com o cliente |
| CT-e 190 — saldo solicitado duas vezes com valores divergentes (R$800 e R$1.600) | 28/07/2026 | Risco de pagamento em duplicidade |

O procedimento de KYC obrigatório já foi instituído por e-mail em **30/07/2026**. Este POP faz três coisas
que aquele e-mail não fez: define **quem** faz, **onde fica a evidência** e **o que bloqueia o pagamento**.

**Os dois portões que este piloto fecha:**

1. **Nenhum adiantamento de 80% sai sem KYC do motorista registrado.** (fecha o buraco do CT-e 189)
2. **Nenhum saldo de 20% sai sem comprovante de entrega do cliente.** (hoje o gatilho é um e-mail
   "FRETE CONCLUÍDO COM SUCESSO" escrito pelo próprio assistente, sem canhoto anexado)

---

## 2. Escopo do piloto

**Clientes:** GRAMTOK e AVT Energy — os dois de maior recorrência hoje.

| Cliente | Rota do piloto | Perfil |
|---|---|---|
| **GRAMTOK** | Aguaí/SP → Contagem/MG (527 km) ou Aguaí/SP → Guarulhos/SP (210 km) | Truck, carga seca, frete R$5.000–6.800 |
| **AVT Energy** | Três Lagoas/MS ↔ Santos/SP, ou Nova Odessa/SP → Pouso Alegre/MG | Frete R$2.900–17.200 |

**Meta:** 4 a 6 embarques na semana, sendo no mínimo 2 de cada cliente.

**Fora do escopo (não fazer no piloto):** app do motorista, PWA, rastreamento por GPS de celular,
pagamento automático por PIX, escrita automática no VSystem, WhatsApp Business API.
Tudo isso depende de coisas que ainda não existem — ver seção 9.

---

## 3. Papéis

| Papel | Responsável | O que faz |
|---|---|---|
| Dono do piloto | José Adailton | Garante que os 7 gates aconteçam; decide exceções |
| Programação de frete | Anderson S. Fernandes | Abre a operação e preenche os dados da carga |
| Logística / motorista | Marcos Hungria · Hudson Melonio | Executa KYC, gera QR, acompanha viagem, coleta POD |
| Financeiro | Giovani Cantanhede | Só paga contra evidência; recusa o que estiver sem gate |
| Comercial / cliente | Gideoni Vieira | Comunica cliente e coleta a confirmação de entrega |
| Gerenciadora de risco | Shogun GR (Gilson — operacional) | Análise de perfil do motorista |
| Seguro | PAIVA Seguros / Rodrigo Tibaldi (corretora) · **Sompo** (seguradora) | Averbação da viagem |

---

## 4. Os 7 gates

Cada gate tem **dono**, **evidência** e **regra de bloqueio**. Sem evidência, não passa.

### Gate 1 — Operação aberta
**Dono:** Anderson · **Quando:** cotação aprovada no VSystem

Registrar na aba `Piloto QR` (seção 6): nº do embarque (EMB-2026-XXXXX), cliente, origem, destino,
veículo, produto, peso, valor da NF, valor do frete de venda, prazo de entrega.

**Campo novo, obrigatório:** `Necessita ajudante? (S/N)` — se sim, quem paga e quantos.
*Origem: ocorrência AVT 3263 de 06/08.*

---

### Gate 2 — Seguro (Sompo)
**Dono:** Marcos ou Hudson · **Bloqueia:** o embarque

Conferir na ordem, **antes de fechar motorista**:

- [ ] A carga **não** está na lista de exclusões da apólice (grãos, tabaco, metais e pedras preciosas,
      armas, dinheiro e títulos, animais vivos, material radioativo, perecível sem refrigeração, obras de arte)
- [ ] Valor da carga dentro do limite: geral **R$1.000.000** · Grupo A **R$500.000** ·
      contêineres **R$300.000** · por viagem-veículo **R$550.000**
- [ ] RNTRC do transportador válido
- [ ] CNH válida e compatível com o veículo
- [ ] **Averbação solicitada à PAIVA ANTES do embarque** — sem averbação não há cobertura

> ⚠️ **Carga excluída ou acima do limite = escalar para a Diretoria antes de aceitar.** Não é decisão da logística.

---

### Gate 3 — KYC do motorista ⛔ *bloqueia o adiantamento*
**Dono:** Marcos ou Hudson · **Aprovação:** José Adailton

Formaliza o e-mail de 30/07/2026.

- [ ] Nome completo, **CPF**, **CNH (número e validade)**, telefone
- [ ] **Placa do cavalo e da carreta**
- [ ] Foto do documento do motorista **e** foto do motorista segurando o documento
- [ ] Chave PIX **em nome do próprio motorista** — titular confere com o CPF informado
- [ ] Cruzamento com a base de motoristas / cadastro no VSystem
- [ ] **Análise de Perfil Shogun** solicitada e retornada — retorno em até 90 min (R$38,00 por conjunto motorista+veículo+carreta)
- [ ] Evidência anexada à planilha de pagamento

**Regra de bloqueio (sem exceção):**
> Faltando qualquer item acima, **o financeiro devolve a solicitação de adiantamento**.
> Exceção só com aprovação por escrito do Diretor Geral, registrada na planilha.

**Bandeiras vermelhas — parar e escalar:**
- Chave PIX de terceiro, ou nome do titular diferente do CPF
- Motorista recusa enviar foto com documento
- Placa não confere com o documento do veículo
- Pressa incomum para receber o adiantamento
- Contato só por WhatsApp, sem chamada de voz atendida

---

### Gate 4 — Adiantamento 80%
**Dono:** Giovani (financeiro)

- [ ] Gates 2 e 3 completos, com evidência
- [ ] Valor confere com o CT-e e com a planilha de pagamento
- [ ] Comprovante de pagamento anexado à aba `Piloto QR`

> **Uma solicitação por CT-e.** Correção de valor entra como *alteração* na mesma linha da planilha,
> nunca como novo e-mail. *(origem: CT-e 190, dois pedidos de saldo com valores diferentes)*

---

### Gate 5 — Embarque e QR
**Dono:** Marcos ou Hudson

- [ ] CT-e emitido no Bsoft
- [ ] **QR da viagem gerado e impresso** — colar na pasta de documentos do motorista
- [ ] Rastreador do veículo ativo e visível (fonte oficial de posição)
- [ ] Motorista compartilha **localização ao vivo do WhatsApp** por 8h no grupo da operação
- [ ] Foto da carga carregada, antes de sair

**O QR do piloto contém apenas isto — nada mais:**

```
EMB-2026-XXXXX | CT-e XXX | VIDEL T&L | (11) 94376-0266
```

> 🔒 **Proibido colocar no QR:** CPF, telefone do motorista, valor do frete, adiantamento, saldo.
> É dado pessoal e informação comercial em código que qualquer pessoa no pátio consegue ler.

---

### Gate 6 — Entrega e comprovação ⛔ *bloqueia o saldo*
**Dono:** Marcos ou Hudson · **Confirmação:** Gideoni

- [ ] Foto do **canhoto assinado e carimbado** pelo cliente, legível
- [ ] Foto da carga entregue
- [ ] Data e hora da descarga
- [ ] **Confirmação do próprio cliente**, por e-mail ou WhatsApp, do recebimento
      — GRAMTOK: `expedicao@tokbothanico.com.br` · AVT: `emanuelle.alves@avtenergy.com.br`
- [ ] Ocorrências registradas (atraso, avaria, falta de ajudante, diária, reentrega)

**Regra de bloqueio:**
> O e-mail "FRETE CONCLUÍDO COM SUCESSO" **não é comprovante**. Sem canhoto **e** sem confirmação
> do cliente, o saldo não é liberado.

---

### Gate 7 — Saldo 20%
**Dono:** Giovani (financeiro)

- [ ] Gate 6 completo
- [ ] Diárias e extras aprovados por escrito pelo Diretor Comercial, com valor e motivo
- [ ] Valor final confere com o CT-e
- [ ] Comprovante anexado

---

## 5. Fluxo resumido

```
Cotação aprovada (VSystem)
   └─ G1 Operação aberta ......................... Anderson
        └─ G2 Gate de seguro (Sompo/PAIVA) ....... Marcos/Hudson    ⛔ bloqueia embarque
             └─ G3 KYC + Shogun .................. Marcos/Hudson    ⛔ bloqueia adiantamento
                  └─ G4 Adiantamento 80% ......... Giovani
                       └─ G5 Embarque + QR ....... Marcos/Hudson
                            └─ G6 POD do cliente . Marcos/Hudson    ⛔ bloqueia saldo
                                 └─ G7 Saldo 20% . Giovani
```

---

## 6. Registro — aba `Piloto QR`

Criar na planilha de Logística. Uma linha por embarque, estas colunas:

`EMB` · `CT-e` · `Cliente` · `Origem` · `Destino` · `Ajudante S/N` · `Frete venda` · `Frete compra` ·
`% custo` · `Motorista` · `CPF` · `Placa` · `KYC OK (S/N)` · `Shogun OK (S/N)` · `Averbação OK (S/N)` ·
`Data adiantamento` · `Data embarque` · `Data entrega` · `Canhoto OK (S/N)` · `Cliente confirmou (S/N)` ·
`Data saldo` · `Ocorrências` · `Minutos gastos nos gates`

A coluna **`Minutos gastos nos gates`** é a mais importante do piloto: é ela que diz o que vale a pena
automatizar depois — e o que não vale.

---

## 7. Métricas de sucesso (avaliadas em 14/08)

| Indicador | Meta |
|---|---|
| Embarques com KYC completo antes do adiantamento | **100%** |
| Saldos liberados com canhoto **e** confirmação do cliente | **100%** |
| Averbação solicitada antes do embarque | **100%** |
| Tempo médio adicional por embarque | **< 20 min** |
| Custo de frete dentro da meta 60–62% | acompanhar, sem meta no piloto |
| Divergências de valor entre solicitação e pagamento | **0** |

Se o tempo adicional passar de 20 min por embarque, o gargalo é o alvo da automação — não o QR Code.

---

## 8. Plano B

| Se falhar | O que fazer |
|---|---|
| Shogun não responde em 90 min | Escalar ao Gilson; se passar de 3h, decisão do Adam de embarcar ou não, registrada por escrito |
| PAIVA não averba a tempo | **Não embarcar.** Sem averbação não há cobertura |
| Cliente não confirma a entrega | Canhoto assinado + carimbado vale como evidência; Gideoni cobra a confirmação em até 48h |
| Motorista sem WhatsApp para localização ao vivo | O rastreador do veículo é a fonte oficial; localização ao vivo é complemento |
| VSystem fora do ar | Registrar na planilha e lançar depois |

---

## 9. O que ficou de fora e por quê

| Item do projeto original | Por que não entra agora |
|---|---|
| App PWA do motorista com GPS em background | Tecnicamente impossível: no iOS o PWA não coleta GPS com a tela apagada, e no Android é instável. O rastreador do veículo já resolve, e é ele que a seguradora aceita |
| QR com dados completos da viagem | Dado pessoal e financeiro legível por qualquer um; e o payload estoura o limite de 2.953 bytes do QR |
| Confirmação de entrega por scan do motorista | O motorista escaneia o próprio celular — a prova ficaria sob custódia de quem é pago por ela |
| Liberação automática de saldo por evento | Nenhum pagamento sai por gatilho automático enquanto o processo não estiver estável |
| Escrita automática de status no VSystem | A integração atual é **somente leitura** (GET). Depende do Manuel — ver seção 10 |
| WhatsApp Business API | Exige verificação de negócio no Meta e aprovação de templates. Prazo em dias/semanas |

---

## 10. Pendências abertas (fora do piloto, mesmos prazos)

| # | Pendência | Responsável | Prazo |
|---|---|---|---|
| 1 | **Confirmar a seguradora vigente com a PAIVA e corrigir `insurance-rules.json`**: o arquivo diz "Allianz Seguros S.A."; toda a documentação localizada (apólices, boletos, termo de aceite Shogun) diz **Sompo**. É a fonte de verdade do Moita Rev1 — não pode ficar ambíguo | Gearlison | 10/08 |
| 2 | Confirmar com a PAIVA os limites vigentes da apólice (o R$1M consta no arquivo interno, não foi conferido contra a apólice) | Gearlison | 12/08 |
| 3 | Especificação de requisitos da API do VSystem (escrita de status + validação de motorista) | Manuel Nunes | 14/08 |
| 4 | Revisar contrato Shogun — reajuste anual cai em **agosto** e "Automatização via integração" está NÃO COTADO | Gearlison | 14/08 |
| 5 | Cotar alternativas de GR com API (Buonny, BRK, Opentech) para comparação | Geanderson | 21/08 |
| 6 | Termo de ciência do motorista sobre monitoramento (LGPD + defesa trabalhista) | Jhennifer / RH | 21/08 |

---

## 11. Cronograma de implantação

| Quando | O quê | Quem |
|---|---|---|
| Sexta 07/08 | Aprovar este POP; enviar pedido ao Manuel; enviar pedido à Shogun | Gearlison |
| Sábado 08/08 | Criar aba `Piloto QR`; imprimir 10 checklists; gerar 10 QRs em branco | Marcos |
| Segunda 10/08, 8h30 | Briefing de 20 min com Anderson, Marcos, Hudson, Giovani, Gideoni | Adam |
| Segunda 10/08 | Primeiro embarque com os 7 gates | Todos |
| Diariamente, 17h | Adam confere a aba `Piloto QR` e cobra o que ficou em branco | Adam |
| Sexta 14/08 | Retrospectiva com dados reais → decidir o que automatizar | Gearlison + Adam |

---

**Regra que resume o POP:** *nenhum dinheiro sai sem evidência anexada.*
