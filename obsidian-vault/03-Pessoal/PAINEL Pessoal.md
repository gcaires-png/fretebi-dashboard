# 🏠 Painel Pessoal

## Metas do ano
```dataview
LIST
FROM "03-Pessoal/Metas"
```

## Tarefas pessoais abertas
```dataview
TASK
FROM "03-Pessoal" OR "01-Diario"
WHERE !completed AND contains(tags, "pessoal")
```

## Revisão semanal
- [ ] Inbox zerado
- [ ] Finanças do mês atualizadas
- [ ] Metas: o que avançou?
- [ ] Agenda da próxima semana revisada
