---
id: metric-time-to-value
type: metric
status: approved
owners: [techleads]
relations:
  measures: [principle-axioms, control-admission-policy]
tags: [performance, agility, operational]
---

# Метрика: Time to Value (TTV)

## Описание
Скорость получения первой ценности пользователем после регистрации в системе.

## Методика расчета
`TTV = timestamp(First Task Completed) - timestamp(Company Created)`

## Характеристики
- **Unit**: Days
- **Granularity**: Project / Single Instance
- **Threshold**: < 3 days (Target)
