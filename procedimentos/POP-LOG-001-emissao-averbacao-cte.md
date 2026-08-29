# POP-LOG-001 — Emissão e Averbação de CT-e

**Responsável:** Hudson — Coordenador de Logística
**Versão:** 1.0 — 29/08/2026 · Elaborado por Moita Rev1
**Escopo:** da análise das notas fiscais à emissão do CT-e no Bsoft, averbação no NDD Averba e liberação do veículo.

> **REGRA DE OURO:** nenhum veículo sai do pátio sem que **100% dos CT-es do embarque estejam emitidos E averbados** (chancela no NDD Averba). Embarque sem averbação = sem cobertura de seguro — e a omissão de embarques pode isentar a Sompo até nos embarques averbados. Ordem obrigatória: **emitir CT-e → averbar → liberar veículo**.

## Sistemas e acessos

| Sistema | Endereço | Uso |
|---|---|---|
| Bsoft CT-e | cte.bsoft.app | Emissão de CT-e e MDF-e (sempre pela filial correta) |
| NDD Averba | portal NDD Averba | Averbação eletrônica junto à Sompo — usuário kcosta@videltel.com.br (senha com a equipe; não anotar em documento) |
| Suporte Bsoft | suporte.tms@bsoft.com.br | Erros de sistema na emissão |
| Suporte NDD | 0800-461-0000 (24h) | Problemas de averbação/portal |

## Fase 1 — Análise das notas fiscais

1. Receber os **XMLs ou PDFs (DANFE)** de todas as NF-es do embarque. Preferir o XML.
2. Conferir em cada nota: **remetente e destinatário** (CNPJ, IE, endereço), **valor total**, **peso bruto/líquido**, **volumes**, **produto** e o campo **frete por conta** (0 = remetente / 1 = destinatário) — indício de quem é o tomador.
3. **Checar o seguro** antes de aceitar a carga (tabela abaixo). Carga excluída ou acima do limite → escalar para a gestão ANTES de seguir.
4. **Agrupar as notas por par remetente → destinatário.** A SEFAZ exige 1 CT-e por par: notas do mesmo remetente para o mesmo destinatário vão juntas num único CT-e; pares diferentes = CT-es separados.
5. Definir o **valor do frete de cada CT-e**: ratear o frete total do lote proporcionalmente ao **peso bruto** de cada entrega. A soma dos CT-es deve fechar exatamente com o valor negociado.
6. Calcular o **KPI de custo**: custo do motorista ÷ frete total. Meta 60–62%. Acima de 65% é crítico — registrar e avisar o comercial.

### Checagem de seguro (apólices Sompo — RCTR-C / RC-DC / RC-V)

| Verificação | Limite / Regra |
|---|---|
| Valor máximo da carga (geral) | R$ 1.000.000 |
| Valor máximo por veículo/viagem | R$ 550.000 |
| Contêineres | R$ 300.000 |
| Cargas Grupo A (alto risco) | R$ 500.000 |
| Cargas excluídas (nunca aceitar sem autorização da gestão) | Animais vivos · armas/explosivos · cigarros · **grãos a granel** · farinha de peixe · obras de arte · relógios > R$ 2.000 · veículos de coleção · radioativos · pedras e metais preciosos · dinheiro/títulos · perecíveis sem refrigeração |
| Requisitos do transporte | RNTRC válido · CNH válida e compatível · veículo em condições adequadas |

## Fase 2 — Emissão do CT-e no Bsoft

1. Acessar cte.bsoft.app e **selecionar a filial emitente correta** (ex.: Filial SP para coletas em SP). Filial errada = CFOP e ICMS errados.
2. Criar novo CT-e: tipo **Original**, serviço **Normal**, modal **Rodoviário**.
3. **CFOP**: `5353` mesmo estado; `6353` interestadual (ex.: SP → GO). Município de início = coleta; fim = entrega.
4. Preencher **remetente e destinatário** exatamente como nas NF-es. Em cadastros novos, evitar colar textos com caracteres especiais de PDF.
5. Definir o **tomador do serviço** — quem contratou e paga a Videl. O "frete por conta" da NF-e é indício; confirmar com o comercial. Se um cliente contratou o lote inteiro, ele é o tomador de todos os CT-es (tomador "Outros" quando não é remetente nem destinatário).
6. **Referenciar todas as NF-es** do par pela chave de acesso (44 dígitos), conferindo dígito a dígito.
7. **Carga e valores**: valor da carga = soma das NF-es; peso bruto, volumes e produto predominante em texto CURTO (ex.: `MASSAS P/ CONSTRUCAO A SECO`). Valor do frete = rateio da Fase 1. Remover componentes de valor zerados (ex.: "Taxa de entrega R$ 0,00").
8. **Bloco de seguro** (igual em todos): responsável **Empresa** · tomador CNPJ 63.147.064/0001-30 · seguradora **SOMPO SEGUROS S/A** · nº da apólice vigente · nº da averbação **em branco**.
9. **Salvar como rascunho, revisar, emitir** e confirmar a autorização na SEFAZ.
10. Baixar o **XML autorizado** (CTes → ações do documento → Baixar XML) e o DACTE em PDF.

> **Erro "PersistenceException / could not execute statement"**: erro interno do Bsoft (não é rejeição SEFAZ). (1) Tentar de novo; (2) salvar como rascunho para isolar a etapa; (3) encurtar textos longos, remover caracteres especiais e componentes zerados; (4) persistindo, acionar suporte.tms@bsoft.com.br com print, data/hora e filial.

## Fase 3 — Averbação no NDD Averba

1. Acessar o portal NDD Averba (usuário kcosta@videltel.com.br).
2. **Averba fácil** → upload do(s) **XML(s) autorizado(s)** dos CT-es (aceita vários de uma vez).
3. Conferir o painel: **"Total com sucesso" = total de uploads e "Total de erros" = 0.**
4. Conferir a **Chancela** (data/hora) de cada CT-e — é o protocolo de averbação da Sompo. Sem chancela = não averbado.
5. **Registrar o protocolo/chancela na operação** (planilha/plataforma Videl), junto do nº do CT-e.
6. **Recusas**: abrir, ler o motivo, corrigir o CT-e (carta de correção ou substituição) e averbar de novo. Veículo NÃO sai com recusa pendente.
7. Só com **todos os CT-es chancelados**, liberar o veículo.

> **Fallback (portal NDD fora do ar):** enviar os XMLs para **faturamentotransp@sompo.com.br** ANTES de liberar o veículo e regularizar no portal depois. Guardar o e-mail como comprovante.

## Fase 4 — MDF-e e liberação do veículo

1. Emitir o **MDF-e** no Bsoft vinculando todos os CT-es do veículo, com motorista (nome, CPF, CNH) e veículo (placa, RNTRC).
2. Entregar ao motorista: DACTEs, DAMDFE e orientações de entrega.
3. Liberar o veículo **somente com**: CT-es autorizados ✔ averbações chanceladas ✔ MDF-e autorizado ✔.
4. No destino final, **encerrar o MDF-e** no Bsoft.

## Fase 5 — Pós-embarque

1. Confirmar embarque ao cliente/tomador com dados do motorista/veículo e DACTEs/XMLs.
2. Arquivar XMLs, DACTEs e protocolos de averbação na pasta da operação no Drive.
3. Acompanhar viagem e entregas; registrar ocorrências.
4. Cobrar e arquivar o **comprovante de entrega (canhoto)** — sustenta faturamento e sinistro.
5. Registrar a operação como concluída com todos os números (CT-es, MDF-e, averbações, frete, custo).

### Em caso de sinistro

- **Comunicar em até 24h**: sinistromercadoria@sompo.com.br
- Acionar o **S.O.S. Cargas Sompo** (0800) e registrar B.O. quando aplicável
- Reunir: CT-e, NF-es, MDF-e, protocolo de averbação, comprovantes e relato do motorista

## Checklist rápido

- [ ] NF-es conferidas (CNPJ, valor, peso, frete por conta) e carga liberada no seguro
- [ ] Notas agrupadas por par remetente → destinatário (1 CT-e por par)
- [ ] Frete rateado por peso — soma fecha com o valor negociado · custo na meta 60–62%
- [ ] CT-e emitido pela filial correta, CFOP certo, chaves das NF-es conferidas
- [ ] Bloco de seguro preenchido (Empresa · Sompo · apólice) — averbação em branco
- [ ] XML autorizado baixado e averbado no NDD — chancela conferida em 100% dos CT-es
- [ ] MDF-e emitido — veículo liberado — MDF-e encerrado no destino
- [ ] Cliente avisado · documentos arquivados · canhoto cobrado na entrega

---
*Próxima revisão sugerida: ao receber o nº definitivo da apólice Sompo (pendência PAIVA SP).*
