---
id: DOC-OPS-WORKFLOWS-DB-MIGRATION-DEPLOY-RUNBOOK-178K
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---
# DB MIGRATION DEPLOY RUNBOOK (RU)

Дата: 2026-02-16  
Область: безопасное применение Prisma-миграций в non-interactive окружениях.

## 1. Цель
- Исключить интерактивные/разрушающие сценарии в pipeline.
- Применять только уже зафиксированные миграции через `migrate deploy`.

## 2. Команды
- Prod/CI-safe:
- `pnpm db:migrate:prod`
- Package-level:
- `pnpm --filter @rai/prisma-client db:migrate:prod`
- Dev-only (интерактивно, для разработки новой миграции):
- `pnpm --filter @rai/prisma-client db:migrate:dev`

## 3. Preconditions
- Бэкап БД сделан и проверен.
- Приложение в режиме, допускающем кратковременное окно schema-change.
- `DATABASE_URL` указывает на целевое окружение.
- Все миграции закоммичены в `packages/prisma-client/migrations`.

## 4. Процедура выката
1. Выполнить dry-check:
- `pnpm --filter @rai/prisma-client exec prisma migrate status`
2. Применить миграции:
- `pnpm db:migrate:prod`
3. Проверить результат:
- в логе `No pending migrations to apply` или список успешно применённых migration IDs.
4. Выполнить инвариантные проверки:
- `pnpm lint:tenant-context:enforce`
- `pnpm gate:invariants:enforce`

## 5. Stop criteria
- Любая ошибка `migrate deploy`.
- Рост критичных инвариантных алертов после релиза.
- Ошибки старта API из-за schema mismatch.

## 6. Recovery
1. Остановить rollout.
2. Переключить трафик/фичи на предыдущий стабильный контур.
3. Применить forward-fix миграцию (предпочтительно) или rollback по утвержденному плану.
4. Повторить rollout только после зелёных invariant gates.

## 7. Запрещённые практики в CI/Prod
- `prisma migrate dev`
- `prisma migrate reset`
- ручные destructive SQL без зафиксированного migration artefact

## 8. Migration Window + SLA + Business Communication

### 8.1 Migration window (��������� ����� ������ ������)
- `window_start_utc`: YYYY-MM-DD HH:mm
- `window_end_utc`: YYYY-MM-DD HH:mm
- `change_owner`: role + ��� ��������������
- `rollback_owner`: role + ��� ��������������
- `scope`: ������ migration IDs � ���������� �������

### 8.2 SLA �� ���� ��������
- TTA (time-to-ack) ��� ��������� � ����: <= 15 �����.
- TTC (time-to-containment): <= 30 ����� (rollback/kill-switch/traffic shift).
- TTR (time-to-recovery) ��� ���������� ��������������� ��������: <= 60 �����.
- ���� SLA ����������, ����� ����������� ��� `No-Go` �� ��������������� �����.

### 8.3 ������������ ��� �������
- ���������������: �� 24 ���� �� ����.
- �����������: �� 60 ����� �� ������.
- ������ � ����: ������ 30 ����� ��� ��� ������ milestone.
- ��������� ���������: `completed` ��� `rolled back` � ������ �� ������.

### 8.4 ������ ���������
- Pre-window:
  - `�������� ���� �������� <start-end UTC>, scope: <...>, ����: <low|medium|high>, owner: <...>.`
- In-window:
  - `�������� <id> ���������/� ��������. ������ �����������: <ok|degraded>. ��������� ������: <time>.`
- Post-window success:
  - `���� ������� �������. ��������: <...>. Invariant gates: green.`
- Post-window rollback:
  - `�������� rollback/forward-fix �� ������� <...>. ������ ��������������, follow-up: <ticket/doc>.`
