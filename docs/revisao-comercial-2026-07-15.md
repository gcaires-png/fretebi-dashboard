# Revisão da Planilha Comercial — Moita Rev1

**Data:** 15/07/2026
**Responsável pela revisão:** Moita Rev1 (Analista de Logística Virtual)
**Pasta de origem:** Controle de Demandas Videl
(`https://drive.google.com/drive/folders/1zwr-m1Lxqk5l6pbn9VL6Ywg7GiYBj2K9`)

## Contexto

A pasta "Controle de Demandas Videl" segue a governança das INSTRUÇÕES DE USO:
a planilha **00 - MASTER** é a fonte da verdade e cada planilha de área deve
espelhar as tarefas daquela área. Moita mantém a sincronização.

## Diagnóstico: "05 - Controle COMERCIAL" está dessincronizada da MASTER

### Estado atual da planilha 05 - Comercial
| ID | Demanda | Responsável | Prioridade | Prazo | Status |
|----|---------|-------------|-----------|-------|--------|
| COM-01 | Compras materiais escritório | Karol / Jhennifer | Baixa | 23/07/2026 | A fazer (0%) |

(demais linhas COM-02 a COM-19 em branco)

### Tarefa comercial na MASTER (não replicada na 05)
| ID | Demanda | Responsável | Prioridade | Prazo | Status | Próxima ação |
|----|---------|-------------|-----------|-------|--------|--------------|
| COM-01 | Trabalhar leads novos (DCA / Energis8 / J Faria / Sylvamo) | Hudson / Anderson | Média | 18/07/2026 | Em andamento | Energis8 agroquímica — checar apólice |

### Problemas encontrados
1. A tarefa comercial real ("Trabalhar leads novos") existe na MASTER mas **não**
   foi replicada na planilha do comercial.
2. **Conflito de ID:** as duas planilhas usam `COM-01` para tarefas diferentes.
3. "Compras materiais escritório" **não é tarefa comercial** (é compras/ADM) e
   não consta na MASTER. Está na planilha errada.

## Correção proposta

### 05 - Controle COMERCIAL (após sincronizar com a MASTER)
| ID | Demanda | Responsável | Prioridade | Abertura | Prazo | Status | % | Próxima ação |
|----|---------|-------------|-----------|----------|-------|--------|---|--------------|
| COM-01 | Trabalhar leads novos (DCA / Energis8 / J Faria / Sylvamo) | Hudson / Anderson | Média | 13/07/2026 | 18/07/2026 | Em andamento | 0% | Energis8 agroquímica — checar apólice |

> "Compras materiais escritório" deve ser **realocada para 01 - Controle ADM**
> (Karolay), pois é compras administrativas, não comercial.

### Follow-ups sugeridos (leads quentes parados — planilha LEADS_VIDELTEL_1 TRI)
Leads QUENTES sem contato há mais de 90 dias, sem controle de demanda formal.
Sugestão de virarem tarefas COM- com responsável e prazo:

| Lead | Segmento | Situação | Dias s/ contato |
|------|----------|----------|-----------------|
| Bauducco | Alimentos (alto volume) | Qualificado — Diretor de Logística | ~134 |
| Central Paletes e Papéis | Indústria | Proposta enviada, sem acerto | ~125 |
| 2P Energia Solar | Energia solar | 2 cotações enviadas 06/03, não aceitas | ~118 |
| JL Serviços | Serviços | Proposta enviada, sem acerto | ~114 |

## Próximos passos
- [ ] Sincronizar 05 - Comercial com a MASTER (adicionar COM-01 leads).
- [ ] Realocar "Compras materiais escritório" para 01 - ADM.
- [ ] (Opcional) Abrir tarefas COM- de follow-up dos leads quentes acima.
- [ ] Definir cadência de follow-up para leads > 90 dias sem contato.
