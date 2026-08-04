---
tipo: motorista
cpf: 
placa: 
base: 
uf: 
kyc: pendente   # pendente | validado | reprovado
nota: 
---

# {{title}}

## Dados
- **CPF:** 
- **CNH:** (categoria / validade)
- **Telefone / Telegram:** 
- **Cidade base:** 

## Veículo
- **Tipo:** 
- **Placa:** 
- **ANTT/RNTRC:** 

## KYC
- [ ] CPF conferido
- [ ] CNH válida
- [ ] Placa x documento do veículo
- [ ] Conta bancária no mesmo CPF/CNPJ
- [ ] Antecedentes / restrição

## Comercial
- **Rotas que aceita:** 
- **Faixa de valor:** R$ 
- **Histórico:** viagens / ocorrências

## Viagens
```dataview
TABLE origem, destino, valor_frete AS "Frete", status
FROM "02-Videl/Operacoes"
WHERE contains(file.outlinks, this.file.link)
SORT data_coleta DESC
```
