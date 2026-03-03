# PROMPT — S5.2 Memory Storage Canon (Tiered Storage & Carcass+Flex)
Дата: 2026-03-03  
Статус: active  
Приоритет: P1  

## Цель
Разработать и зафиксировать `MEMORY_CANON.md`, который определит архитектурные стандарты хранения памяти агента, уровни хранения (S/M/L Tiers) и структуру данных "Carcass + Flex".

## Контекст
- Внедрен `MemoryAdapter` (S5.1), но отсутствуют формальные правила того, КАК данные должны храниться и консолидироваться.
- Необходимо предотвратить "зоопарк таблиц" и обеспечить масштабируемость памяти.
- Основание: [RAI_AGENT_OS_IMPLEMENTATION_PLAN.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md) пункт 5.2.

## Задачи (что сделать)
- [ ] Описать трехуровневую модель: Short-term (S), Middle-term (M), Long-term (L).
- [ ] Зафиксировать принцип "Carcass + Flex" для JSONB метаданных.
- [ ] Описать правила консолидации (сжатия) сырых логов в эпизоды и профили.
- [ ] Определить политики Retention для каждого уровня.
- [ ] Согласовать канон с `SECURITY_CANON.md` (изоляция тенантов).

## Definition of Done (DoD)
- [ ] Создан файл `docs/01_ARCHITECTURE/PRINCIPLES/MEMORY_CANON.md`.
- [ ] Решение зарегистрировано в `DECISIONS.log` с ID `AG-MEMORY-CANON-001`.
- [ ] Канон залинкован в общий план реализации Stage 2.

## Что вернуть на ревью
- Текст `MEMORY_CANON.md`.
- Запись в `DECISIONS.log`.
