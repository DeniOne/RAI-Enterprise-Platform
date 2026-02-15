---
id: DOC-MET-GEN-132
type: KPI Spec
layer: Metrics
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

---
id: metric-techmap-completion
type: metric
status: approved
owners: [agronomy-leads]
relations:
  measures: [principle-vision, control-audit-system]
tags: [operational, execution-quality]
---

# Метрика: Techmap Completion Rate

## Описание
Процент выполнения запланированных агроопераций. Показывает дисциплину исполнения и точность планирования.

## Методика расчета
`Rate = (Количество закрытых фактов) / (Количество запланированных операций) * 100%`

## Характеристики
- **Unit**: %
- **Granularity**: Field / Season
- **Target**: > 95%
