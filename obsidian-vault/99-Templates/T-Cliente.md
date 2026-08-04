---
tipo: cliente
cnpj: 
cidade: 
uf: 
status: ativo
---

# {{title}}

## Dados
- **CNPJ:** 
- **IE:** 
- **Endereço:** 
- **Tomador do serviço:** 

## Contatos
| Nome | Cargo | E-mail | Telefone |
|---|---|---|---|
| | | | |

## Perfil de carga
- **Tipo:** 
- **Rotas frequentes:** 
- **Veículo típico:** 
- **Ticket médio:** R$ 

## Particularidades
<!-- exigências, prazos, forma de pagamento, quem aprova -->

## Operações
```dataview
TABLE status, origem, destino, valor_operacao AS "Valor"
FROM "02-Videl/Operacoes"
WHERE contains(cliente, this.file.name)
SORT data_coleta DESC
```
