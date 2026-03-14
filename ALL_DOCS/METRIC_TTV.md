---
id: DOC-MET-06-METRICS-METRIC-TTV-1FBO
layer: Metrics
type: KPI Spec
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
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
