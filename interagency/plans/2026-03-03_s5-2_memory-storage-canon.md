# PLAN — S5.2 Memory Storage Canon (Tiered Storage & Carcass+Flex)
Дата: 2026-03-03  
Статус: active (ACCEPTED)  
Decision-ID: AG-MEMORY-CANON-001

## Результат (какой артефакт получим)
- Канонический документ `docs/01_ARCHITECTURE/PRINCIPLES/MEMORY_CANON.md`.
- Запись о принятии решения в `DECISIONS.log` (ID: AG-MEMORY-CANON-001).

## Границы (что входит / что НЕ входит)
- **Входит**: Описание 3-уровневой модели (Short/Middle/Long), структура данных Carcass+Flex, правила консолидации (сжатия логов в эпизоды и профили), политики хранения (retention), правила изоляции тенантов.
- **Не входит**: Физическое создание Prisma-схем, миграции БД или написание кода сжатия (это будет в следующих задачах).

## Риски (что может пойти не так)
- Противоречие с `SECURITY_CANON.md`.
  - *Решение*: Явный фокус на `companyId` изоляции и RBAC при извлечении из памяти.

## План работ (коротко, исполнимо)
- [ ] Сформировать текст `MEMORY_CANON.md` на базе требований из Agent OS Implementation Plan.
- [ ] Описать 3 уровня (S-tier: Raw logs, M-tier: Episodes, L-tier: Profile/Knowledge).
- [ ] Описать принцип Carcass+Flex (JSONB `attrs` + `schemaKey`, обязательные `provenance`/`confidence`).
- [ ] Добавить запись в `DECISIONS.log`.
- [ ] Обновить `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (пункт 5.3 Carcass+Flex модель памяти — отметить как проработанный/залинковать канон).

## DoD
- [ ] `MEMORY_CANON.md` создан и залинкован.
- [ ] Запись `AG-MEMORY-CANON-001` в `DECISIONS.log`.
