---
id: DOC-MET-GEN-134
type: KPI Spec
layer: Metrics
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

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
