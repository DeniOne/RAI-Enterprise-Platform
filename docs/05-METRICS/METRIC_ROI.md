---
id: metric-total-roi
type: metric
status: review
owners: [finance-leads]
relations:
  measures: [principle-vision]
  depends_on: [control-audit-system]
tags: [business-kpi, aggregate, lagging-indicator, derived]
---

# Метрика: Total ROI (Return on Investment)

## Описание
Определяет экономическую эффективность использования платформы на каждый вложенный рубль/доллар инвестиций в гектар.

## Методика расчета
`ROI = (Чистая прибыль с внедрением - Чистая прибыль без внедрения) / Затраты на внедрение`

## Характеристики
- **Unit**: USD/Hectare
- **Granularity**: Seasonal
- **Source**: Finance Module & Yield Reports
