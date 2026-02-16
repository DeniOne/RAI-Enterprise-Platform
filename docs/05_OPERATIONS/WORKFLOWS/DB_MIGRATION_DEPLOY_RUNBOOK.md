---
id: DOC-OPS-RUN-134
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# DB MIGRATION DEPLOY RUNBOOK (RU)

Р”Р°С‚Р°: 2026-02-16  
РћР±Р»Р°СЃС‚СЊ: Р±РµР·РѕРїР°СЃРЅРѕРµ РїСЂРёРјРµРЅРµРЅРёРµ Prisma-РјРёРіСЂР°С†РёР№ РІ non-interactive РѕРєСЂСѓР¶РµРЅРёСЏС….

## 1. Р¦РµР»СЊ
- РСЃРєР»СЋС‡РёС‚СЊ РёРЅС‚РµСЂР°РєС‚РёРІРЅС‹Рµ/СЂР°Р·СЂСѓС€Р°СЋС‰РёРµ СЃС†РµРЅР°СЂРёРё РІ pipeline.
- РџСЂРёРјРµРЅСЏС‚СЊ С‚РѕР»СЊРєРѕ СѓР¶Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРЅС‹Рµ РјРёРіСЂР°С†РёРё С‡РµСЂРµР· `migrate deploy`.

## 2. РљРѕРјР°РЅРґС‹
- Prod/CI-safe:
- `pnpm db:migrate:prod`
- Package-level:
- `pnpm --filter @rai/prisma-client db:migrate:prod`
- Dev-only (РёРЅС‚РµСЂР°РєС‚РёРІРЅРѕ, РґР»СЏ СЂР°Р·СЂР°Р±РѕС‚РєРё РЅРѕРІРѕР№ РјРёРіСЂР°С†РёРё):
- `pnpm --filter @rai/prisma-client db:migrate:dev`

## 3. Preconditions
- Р‘СЌРєР°Рї Р‘Р” СЃРґРµР»Р°РЅ Рё РїСЂРѕРІРµСЂРµРЅ.
- РџСЂРёР»РѕР¶РµРЅРёРµ РІ СЂРµР¶РёРјРµ, РґРѕРїСѓСЃРєР°СЋС‰РµРј РєСЂР°С‚РєРѕРІСЂРµРјРµРЅРЅРѕРµ РѕРєРЅРѕ schema-change.
- `DATABASE_URL` СѓРєР°Р·С‹РІР°РµС‚ РЅР° С†РµР»РµРІРѕРµ РѕРєСЂСѓР¶РµРЅРёРµ.
- Р’СЃРµ РјРёРіСЂР°С†РёРё Р·Р°РєРѕРјРјРёС‡РµРЅС‹ РІ `packages/prisma-client/migrations`.

## 4. РџСЂРѕС†РµРґСѓСЂР° РІС‹РєР°С‚Р°
1. Р’С‹РїРѕР»РЅРёС‚СЊ dry-check:
- `pnpm --filter @rai/prisma-client exec prisma migrate status`
2. РџСЂРёРјРµРЅРёС‚СЊ РјРёРіСЂР°С†РёРё:
- `pnpm db:migrate:prod`
3. РџСЂРѕРІРµСЂРёС‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚:
- РІ Р»РѕРіРµ `No pending migrations to apply` РёР»Рё СЃРїРёСЃРѕРє СѓСЃРїРµС€РЅРѕ РїСЂРёРјРµРЅС‘РЅРЅС‹С… migration IDs.
4. Р’С‹РїРѕР»РЅРёС‚СЊ РёРЅРІР°СЂРёР°РЅС‚РЅС‹Рµ РїСЂРѕРІРµСЂРєРё:
- `pnpm lint:tenant-context:enforce`
- `pnpm gate:invariants:enforce`

## 5. Stop criteria
- Р›СЋР±Р°СЏ РѕС€РёР±РєР° `migrate deploy`.
- Р РѕСЃС‚ РєСЂРёС‚РёС‡РЅС‹С… РёРЅРІР°СЂРёР°РЅС‚РЅС‹С… Р°Р»РµСЂС‚РѕРІ РїРѕСЃР»Рµ СЂРµР»РёР·Р°.
- РћС€РёР±РєРё СЃС‚Р°СЂС‚Р° API РёР·-Р·Р° schema mismatch.

## 6. Recovery
1. РћСЃС‚Р°РЅРѕРІРёС‚СЊ rollout.
2. РџРµСЂРµРєР»СЋС‡РёС‚СЊ С‚СЂР°С„РёРє/С„РёС‡Рё РЅР° РїСЂРµРґС‹РґСѓС‰РёР№ СЃС‚Р°Р±РёР»СЊРЅС‹Р№ РєРѕРЅС‚СѓСЂ.
3. РџСЂРёРјРµРЅРёС‚СЊ forward-fix РјРёРіСЂР°С†РёСЋ (РїСЂРµРґРїРѕС‡С‚РёС‚РµР»СЊРЅРѕ) РёР»Рё rollback РїРѕ СѓС‚РІРµСЂР¶РґРµРЅРЅРѕРјСѓ РїР»Р°РЅСѓ.
4. РџРѕРІС‚РѕСЂРёС‚СЊ rollout С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ Р·РµР»С‘РЅС‹С… invariant gates.

## 7. Р—Р°РїСЂРµС‰С‘РЅРЅС‹Рµ РїСЂР°РєС‚РёРєРё РІ CI/Prod
- `prisma migrate dev`
- `prisma migrate reset`
- СЂСѓС‡РЅС‹Рµ destructive SQL Р±РµР· Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРЅРѕРіРѕ migration artefact

## 8. Migration Window + SLA + Business Communication

### 8.1 Migration window (фиксируем перед каждым батчем)
- `window_start_utc`: YYYY-MM-DD HH:mm
- `window_end_utc`: YYYY-MM-DD HH:mm
- `change_owner`: role + имя ответственного
- `rollback_owner`: role + имя ответственного
- `scope`: список migration IDs и затронутых доменов

### 8.2 SLA на окно миграции
- TTA (time-to-ack) для инцидента в окне: <= 15 минут.
- TTC (time-to-containment): <= 30 минут (rollback/kill-switch/traffic shift).
- TTR (time-to-recovery) для критичного деградационного сценария: <= 60 минут.
- Если SLA нарушается, релиз фиксируется как `No-Go` до корректирующего плана.

### 8.3 Коммуникация для бизнеса
- Предуведомление: за 24 часа до окна.
- Напоминание: за 60 минут до старта.
- Статус в окне: каждые 30 минут или при каждом milestone.
- Финальное сообщение: `completed` или `rolled back` с итогом по рискам.

### 8.4 Шаблон сообщений
- Pre-window:
  - `Плановое окно миграции <start-end UTC>, scope: <...>, риск: <low|medium|high>, owner: <...>.`
- In-window:
  - `Миграция <id> применена/в процессе. Статус инвариантов: <ok|degraded>. Следующий апдейт: <time>.`
- Post-window success:
  - `Окно закрыто успешно. Миграции: <...>. Invariant gates: green.`
- Post-window rollback:
  - `Выполнен rollback/forward-fix по причине <...>. Сервис стабилизирован, follow-up: <ticket/doc>.`
