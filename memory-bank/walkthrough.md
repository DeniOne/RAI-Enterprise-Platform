# Track 1 Walkthrough: TechMap Integration & Production Gate

## 1. Database & Schema Hardening
- **PostgreSQL Partial Unique Index**: Внедрен индекс `unique_active_techmap` в таблицу `tech_maps`.
  - Правило: Только одна техкарта может быть в статусе `ACTIVE` для конкретной связки `fieldId + crop + seasonId + companyId`.
- **Migration Resolution**: Успешно завершена миграция `track_1` (`20260211223908`), которая ранее блокировалась из-за ошибок `2BP01` (зависимости типов).
  - Решение: Использование `DROP TYPE CASCADE` и поэтапное удаление/пересоздание колонок.
- **Drift Resolution**: База приведена в соответствие со схемой Prisma.

## 2. Infrastructure
- **Prisma Client**: Регенерация клиента (`prisma generate`) прошла успешно.
- **Environment**: Все переменные окружения и порты синхронизированы.

## 3. Verification
- **Migration Deploy**: `pnpm exec prisma migrate deploy` выполнена успешно.
- **Index Check**: Индекс `unique_active_techmap` виден в базе.
- **RBAC & FSM**: Все защитные механизмы Consulting-модуля теперь имеют надежный SQL-фундамент.

## 4. Manual Actions Checklist
- [x] Prisma Migration Deploy
- [x] Prisma Client Generate
- [ ] Prisma DB Seed (Baseline data)

---
*Документ обновлен 12.02.2026*
