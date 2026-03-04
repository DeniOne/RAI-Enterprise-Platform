# REPORT — TM-POST-B: Season → CropZone + Rapeseed → CropVariety
Дата: 2026-03-04  
Статус: final
Decision-ID: AG-TM-POST-B-006
Ревью: APPROVED (Antigravity Orchestrator)

## Что было целью
- Перевести доменную модель на `CropZone` как primary relation для `TechMap`.
- Выполнить переход `Rapeseed` → `CropVariety` с поддержкой `CropType` и без удаления legacy-моделей.
- Сохранить tenant isolation и пройти проверки из DoD без destructive reset БД.

## Что сделано (факты)
- Обновлена Prisma-схема (`Season`, `TechMap`, `CropZone`, `CropVariety`, `CropVarietyHistory`, `CropType`), legacy `Rapeseed*` оставлены.
- Добавлен новый модуль `crop-variety` в `apps/api` (module/service/dto/tests), модуль подключён в `AppModule`.
- Обновлён `SeasonService`:
- `fieldId` перестал быть обязательным при создании сезона.
- добавлена валидация `cropVarietyId` в tenant scope.
- Обновлён `TechMapService`:
- создание/генерация карты теперь опирается на `CropZone`.
- добавлены проверки наличия `CropZone` в tenant scope.
- Реализованы migration-скрипты:
- `migrate-rapeseed-to-cropvariety.ts`.
- `migrate-season-to-cropzone.ts` (дополнительно исправлен для idempotent-работы при `cropZoneId NOT NULL`).
- Закрыт backup-gate: создан дамп БД перед DDL.
- Выполнен безопасный pre-migration SQL в БД (без `--force-reset`):
- backfill `tech_maps.cropZoneId` через `crop_zones`.
- подготовка `budget_lines.companyId`.
- приведение `budget_lines.category` и `crop_zones.cropType` к enum-типам, совместимым со схемой.
- После pre-migration выполнен `prisma db push` с успешной синхронизацией схемы.
- Исправлены регрессионные тестовые моки в `season`/`consulting` тестах под текущие зависимости и контракт сервисов.

## Изменённые файлы
- `packages/prisma-client/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/season/season.service.ts`
- `apps/api/src/modules/season/dto/create-season.input.ts`
- `apps/api/src/modules/season/dto/season.type.ts`
- `apps/api/src/modules/season/services/season-business-rules.service.ts`
- `apps/api/src/modules/season/services/season-snapshot.service.ts`
- `apps/api/src/modules/tech-map/tech-map.service.ts`
- `apps/api/src/modules/crop-variety/crop-variety.module.ts`
- `apps/api/src/modules/crop-variety/crop-variety.service.ts`
- `apps/api/src/modules/crop-variety/dto/crop-variety.dto.ts`
- `apps/api/src/modules/crop-variety/crop-variety.service.spec.ts`
- `apps/api/src/modules/season/season.service.spec.ts`
- `apps/api/src/modules/season/season.transition.spec.ts`
- `apps/api/src/modules/consulting/test/season-isolation.spec.ts`
- `packages/prisma-client/scripts/migrate-rapeseed-to-cropvariety.ts`
- `packages/prisma-client/scripts/migrate-season-to-cropzone.ts`
- `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md`
- `memory-bank/progress.md`
- `DECISIONS.log`

## Проверки/прогоны
- `pnpm --filter @rai/prisma-client exec prisma validate --schema schema.prisma` → PASS.
- `pnpm --filter @rai/prisma-client exec prisma db push --schema schema.prisma` → PASS (после pre-migration SQL + backup).
- `pnpm --filter api exec tsc --noEmit` → PASS.
- `pnpm --filter api test -- --testPathPattern='crop-variety|season' --runInBand` → PASS (5 suites, 34 tests).
- `pnpm --filter api test -- --testPathPattern='tech-map'` → PASS (28 suites, 95 tests).
- Migration script: `migrate-rapeseed-to-cropvariety.ts` → PASS (`migratedRapeseedToCropVariety=1`, `linkedSeasons=1`).
- Migration script: `migrate-season-to-cropzone.ts` → PASS (`seasonsProcessed=1`, `createdCropZones=0`, `linkedTechMaps=0`) после фикса условия обновления.

## Что сломалось / что не получилось
- Первичный запуск `prisma db push` был заблокирован существующими данными (`budget_lines` и `tech_maps.cropZoneId`).
- `migrate-season-to-cropzone.ts` падал после введения `cropZoneId NOT NULL` (фильтр по `NULL` стал невалиден) — исправлено на idempotent-фильтр `not: cropZone.id`.
- Параллельный запуск test jobs однажды завершился `exit 137` (ресурсное убийство процесса) — повторный последовательный прогон прошёл.

## Что сделано дополнительно
- Добавлен backup-артефакт БД: `backups/rai_platform_20260304T114020Z.dump`.
- Выполнен pre-migration SQL для безопасного приведения данных к новой схеме без `--force-reset`.
- Актуализированы тестовые моки (`RiskService`, `ActionDecisionService`, `updateMany`, `count`) под текущую реализацию сервисов.

## Следующий шаг
- Внешний ревью по `CURSOR SOFTWARE FACTORY — REVIEW & FINALIZE PROMPT`.
- После `APPROVED`: синхронизировать финальные чеклисты/memory-bank статусы и только затем обсуждать commit/push (по явной команде USER).

## Технические артефакты

### 1) git status
```text
 M DECISIONS.log
 M apps/api/src/app.module.ts
 M apps/api/src/modules/consulting/test/season-isolation.spec.ts
 M apps/api/src/modules/season/dto/create-season.input.ts
 M apps/api/src/modules/season/dto/season.type.ts
 M apps/api/src/modules/season/season.service.spec.ts
 M apps/api/src/modules/season/season.service.ts
 M apps/api/src/modules/season/season.transition.spec.ts
 M apps/api/src/modules/season/services/season-business-rules.service.ts
 M apps/api/src/modules/season/services/season-snapshot.service.ts
 M apps/api/src/modules/tech-map/tech-map.service.ts
 M docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md
 M interagency/INDEX.md
 M memory-bank/progress.md
 M packages/prisma-client/schema.prisma
?? apps/api/src/modules/crop-variety/
?? backups/
?? interagency/plans/2026-03-04_tm-post-b_season-cropzone-cropvariety.md
?? interagency/plans/2026-03-04_tm-post-c_ui-workbench-v2.md
?? interagency/prompts/2026-03-04_tm-post-b_season-cropzone-cropvariety.md
?? interagency/prompts/2026-03-04_tm-post-c_ui-workbench-v2.md
?? packages/prisma-client/scripts/
```

### 2) git diff (ключевые фрагменты)
```diff
diff --git a/apps/api/src/app.module.ts b/apps/api/src/app.module.ts
+import { CropVarietyModule } from "./modules/crop-variety/crop-variety.module";
+    CropVarietyModule,


diff --git a/apps/api/src/modules/season/season.service.ts b/apps/api/src/modules/season/season.service.ts
- // fieldId always required
+ // fieldId optional for global Season
+ if (input.fieldId) { ... }
+ if (input.cropVarietyId) { ...tenant validation... }


diff --git a/apps/api/src/modules/tech-map/tech-map.service.ts b/apps/api/src/modules/tech-map/tech-map.service.ts
- include: { rapeseed: true },
+ const cropZone = await prisma.cropZone.findFirst(...)
+ if (!cropZone) throw NotFoundException(...)
+ const crop = String(cropZone.cropType ?? "RAPESEED").toLowerCase();


diff --git a/packages/prisma-client/scripts/migrate-season-to-cropzone.ts b/packages/prisma-client/scripts/migrate-season-to-cropzone.ts
- cropZoneId: null as any,
+ cropZoneId: { not: cropZone.id },
```

### 3) Логи прогонов из тест-плана
```text
[backup]
docker exec rai-postgres pg_dump -U rai_admin -d rai_platform -Fc > backups/rai_platform_20260304T114020Z.dump
PASS (516K dump created)

[prisma validate]
The schema at schema.prisma is valid 🚀

[prisma db push]
🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client (v6.19.2)

[tsc]
pnpm --filter api exec tsc --noEmit
PASS (exit code 0)

[jest crop-variety|season]
Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total

[jest tech-map]
Test Suites: 28 passed, 28 total
Tests:       95 passed, 95 total

[migrate-rapeseed-to-cropvariety.ts]
{ "migratedRapeseedToCropVariety": 1, "linkedSeasons": 1, "sourceLatestRapeseeds": 1 }

[migrate-season-to-cropzone.ts]
{ "seasonsProcessed": 1, "createdCropZones": 0, "linkedTechMaps": 0 }
```

### 4) Manual check
- Manual check: PASS (Техническая верификация схем, данных и транзакционной логики сервисов завершена успешно).
- Сценарии: Season creation (global), CropZone auto-linking, CropVariety CRUD, Migration idempotent-check.
