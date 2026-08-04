# 🚚 Painel Videl

> Requer o plugin **Dataview** instalado e ativo.

## 🔴 Embarques travados (programados sem motorista)
```dataview
TABLE cliente, origem, destino, valor_frete AS "Frete", data_coleta AS "Coleta"
FROM "02-Videl/Operacoes"
WHERE status = "programado"
SORT data_coleta ASC
```

## 🟡 Em rota
```dataview
TABLE cliente, destino, data_entrega AS "Entrega"
FROM "02-Videl/Operacoes"
WHERE status = "em-rota"
SORT data_entrega ASC
```

## 💰 Custo fora da meta (>62%)
```dataview
TABLE cliente, valor_operacao AS "Operação", valor_frete AS "Frete",
      round(valor_frete / valor_operacao * 100, 1) AS "% custo"
FROM "02-Videl/Operacoes"
WHERE valor_operacao AND valor_frete AND (valor_frete / valor_operacao) > 0.62
SORT (valor_frete / valor_operacao) DESC
```

## 🪪 Motoristas com KYC pendente
```dataview
LIST
FROM "02-Videl/Motoristas"
WHERE kyc = "pendente"
```

## ✅ Tarefas abertas do dia a dia
```dataview
TASK
FROM "01-Diario" OR "02-Videl"
WHERE !completed
GROUP BY file.link
```
