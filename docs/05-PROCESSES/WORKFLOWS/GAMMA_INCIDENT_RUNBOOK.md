---
id: process-gamma-incident-runbook
type: process
status: review
owners: [ops, security-officers]
implements: [principle-ai-governance-canon]
---

# Gamma: Incident Runbook

## Сценарии
- Деградация качества AI.
- Отказ инференс API.
- Нарушение контура данных (Data Drift).

## Действия
1. Идентификация аномалии по алертам.
2. Перевод в режим Fallback (базовые правила).
3. Анализ причин и фикс.
4. Пост-мортем.
