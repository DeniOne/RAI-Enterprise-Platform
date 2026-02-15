---
id: DOC-STR-GEN-004
type: Vision
layer: Strategy
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿---
id: control-gamma-risk-policy
type: control
status: review
owners: [security-officers, architects]
aligned_with: [principle-gamma-vision-scope]
measured_by: [metric-gamma-quality-gates, metric-gamma-business-impact]
---

# Phase Gamma: Политика рисков

## Фокус
Стык автоматического принятия решений и физической реальности (полевые работы и финансовые активы).

## Области рисков
- Модель: Галлюцинации, предвзятость, дрейф данных.
- Данные: Несоблюдение форматов, задержки спутниковых слоёв.
- Говернанс: Отсутствие подтверждения человеком критичных действий.

## Мониторинг отказов (AI Failure Policy)
- **Допустимые ошибки:** Рекомендации с низким Confidence Score, помеченные как «экспериментальные».
- **Стоп-кран (Critical Halt):**
    - Деградация точности ниже 60% на проверочном датасете.
    - Массовый негативный фидбек пользователей (отклонение > 80% советов).
    - Обход Risk Engine (ошибка целостности).

## Интеграция управления
- **Verdict-first:** Любая проактивная выдача обязана получить одобрение от Risk Engine.
- **Traceability:** В Audit Trail записывается не только совет, но и вердикт Risk Engine.

