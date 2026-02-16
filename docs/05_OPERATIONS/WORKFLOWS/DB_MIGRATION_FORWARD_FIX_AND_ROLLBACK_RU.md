---
id: DOC-OPS-RUN-135
layer: Operations
type: Runbook
status: draft
version: 1.0.0
---

# DB Migration Forward-Fix And Rollback (RU)

## 1. Принцип
- По умолчанию используется `forward-fix`.
- Rollback-script применяется только для обратимых и заранее проверенных изменений.

## 2. Forward-fix сценарий (предпочтительный)
1. Зафиксировать migration failure point и impact scope.
2. Подготовить corrective migration (идемпотентный SQL + guarded checks).
3. Прогнать pre/post verification protocol.
4. Применить `pnpm db:migrate:prod`.
5. Подтвердить `gate:invariants:enforce`.

## 3. Rollback-script сценарий (для обратимых миграций)
1. Проверить, что миграция помечена как reversible.
2. Остановить rollout и включить kill switch (при необходимости).
3. Выполнить rollback SQL script.
4. Перепроверить schema + invariants.

## 4. Rollback SQL Template
```sql
BEGIN;

-- Example rollback steps (adapt per migration)
-- DROP TRIGGER IF EXISTS trg_name ON table_name;
-- DROP FUNCTION IF EXISTS function_name();
-- DROP INDEX IF EXISTS idx_name;
-- ALTER TABLE table_name DROP CONSTRAINT IF EXISTS constraint_name;
-- ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;

COMMIT;
```

## 5. Обязательные post-rollback проверки
```bash
pnpm lint:tenant-context:enforce
pnpm gate:invariants:enforce
```

