# REPORT — TechMap Sprint TM-4: Adaptive Rules + Regionalization
Дата: 2026-03-04
Статус: **APPROVED**

## Ревью: APPROVED
**Ревьюер**: Antigravity Orchestrator
**Дата**: 2026-03-04

### Чек-лист ревью
| # | Критерий | Результат |
|---|----------|----|
| 1 | Нет секретов в диффе | ✅ PASS |
| 2 | Нет изменений вне scope | ✅ PASS — только schema.prisma, tech-map/, concurrency.spec.ts fix |
| 3 | `evaluateCondition` — pure function | ✅ PASS — только `typeof value !== 'number'` guard + switch, нет IO |
| 4 | Нет прямых мутаций TechMap/MapOperation | ✅ PASS — `applyTriggeredRule` вызывает только `ChangeOrderService.createChangeOrder` + `routeForApproval` |
| 5 | Tenant isolation | ✅ PASS — `adaptiveRule.findMany({ where: { techMapId, companyId, isActive: true } })` |
| 6 | `lastEvaluatedAt` разделён от triggered mutations | ✅ PASS — `updateMany` вызывается отдельно после цикла |
| 7 | `getProfileForField` schema-first | ✅ PASS — `TechMap → cropZone` через фактические relation-ы; fallback через `(this.prisma as any)` с optional chaining безопасен (graceful null); глобальный fallback `OR: [{ companyId }, { companyId: null }]` |
| 8 | HybridPhenologyModel lookup order | ✅ PASS — tenant→global |
| 9 | `calculateSowingWindow` корректен | ✅ PASS — `direction = reverse ? -1 : 1`, MARITIME_HUMID: windowDays=14, CONTINENTAL_COLD: 7 |
| 10 | `suggestOperationTypes` | ✅ PASS — CONTINENTAL_COLD: SEED_TREATMENT+DESICCATION mandatory; MARITIME_HUMID: 2×FUNGICIDE_APP mandatory |
| 11 | tsc | ✅ PASS |
| 12 | 17/17 адресных тестов (≥17 DoD) | ✅ PASS |
| 13 | Регрессия tech-map/ 75/75 | ✅ PASS (включая исправленный concurrency.spec.ts) |

**Замечаний к доработке**: нет. Исправление опечатки `tecmhMap` в `concurrency.spec.ts` принято — pre-existing баг, затруднявший регрессию.

---


## Что было целью
- Реализовать второй адаптивный контур TechMap: `AdaptiveRule`, `TriggerEvaluationService`, `RegionProfileService`, `HybridPhenologyService`.
- Ограничить изменения только `packages/prisma-client/schema.prisma` и `apps/api/src/modules/tech-map/`.
- Сохранить tenant isolation через `companyId` и не допустить прямых мутаций вне `ChangeOrderService`.

## Что сделано (факты)
- В `packages/prisma-client/schema.prisma` добавлены enum-ы `TriggerType`, `TriggerOperator`.
- В `packages/prisma-client/schema.prisma` добавлены модели `AdaptiveRule` и `HybridPhenologyModel`.
- В `packages/prisma-client/schema.prisma` добавлены relation-поля:
- `Company`: `adaptiveRules`, `hybridPhenologyModels`
- `TechMap`: `adaptiveRules`
- Созданы DTO:
- `apps/api/src/modules/tech-map/dto/adaptive-rule.dto.ts`
- `apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.ts`
- Созданы unit-тесты DTO:
- `adaptive-rule.dto.spec.ts`
- `hybrid-phenology.dto.spec.ts`
- Создана директория `apps/api/src/modules/tech-map/adaptive-rules/`.
- Реализованы сервисы:
- `TriggerEvaluationService` с методами `evaluateTriggers`, `applyTriggeredRule`, `evaluateCondition`
- `RegionProfileService` с методами `getProfileForField`, `calculateSowingWindow`, `suggestOperationTypes`
- `HybridPhenologyService` с методами `predictBBCH`, `getOrCreateModel`
- В `apps/api/src/modules/tech-map/tech-map.module.ts` зарегистрированы `TriggerEvaluationService`, `RegionProfileService`, `HybridPhenologyService`; экспортирован `TriggerEvaluationService`.
- Для прохождения полной регрессии исправлен pre-existing дефект в `apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts`: опечатка `tecmhMap` → удалён ошибочный вызов, оставлен корректный `techMap.findFirstOrThrow`.

## Изменённые файлы
- `packages/prisma-client/schema.prisma`
- `apps/api/src/modules/tech-map/tech-map.module.ts`
- `apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts`
- `apps/api/src/modules/tech-map/dto/adaptive-rule.dto.ts`
- `apps/api/src/modules/tech-map/dto/adaptive-rule.dto.spec.ts`
- `apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.ts`
- `apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.spec.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/trigger-evaluation.service.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/trigger-evaluation.service.spec.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/region-profile.service.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/region-profile.service.spec.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/hybrid-phenology.service.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/hybrid-phenology.service.spec.ts`
- `interagency/plans/2026-03-04_tm-4_adaptive-rules.md`

## Проверки/прогоны
- `bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'` → PASS
- `bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'` → PASS
- `pnpm --filter api exec tsc --noEmit` → PASS
- `cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/dto/adaptive-rule.dto.spec.ts src/modules/tech-map/dto/hybrid-phenology.dto.spec.ts src/modules/tech-map/adaptive-rules/trigger-evaluation.service.spec.ts src/modules/tech-map/adaptive-rules/region-profile.service.spec.ts src/modules/tech-map/adaptive-rules/hybrid-phenology.service.spec.ts` → PASS, 5 suites / 17 tests
- `cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/` → PASS, 22 suites / 75 tests
- Manual check: PASS — проверено, что `TriggerEvaluationService` создаёт изменения только через `ChangeOrderService.createChangeOrder` и `ChangeOrderService.routeForApproval`, без прямой мутации `TechMap`/`MapOperation`.

## Что сломалось / что не получилось
- В промпте `RegionProfileService.getProfileForField` описан путь через `Field.regionProfileId` или `CropZone → TechMap.regionProfileId`, но в текущей Prisma-схеме такой подтверждённой связи нет. Реализация сделана безопасно: сначала поиск через доступный `TechMap.cropZone`, затем fallback на tenant/global `RegionProfile`.
- Первый прогон `tsc` и адресных тестов падал до `prisma db push`, потому что локальный Prisma client ещё не содержал новые enum-ы и модели. После `db push` и генерации клиента все проверки стали зелёными.
- В рабочем дереве присутствуют посторонние изменения вне TM-4:
- `DECISIONS.log`
- `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md`
- `interagency/INDEX.md`
- `interagency/prompts/2026-03-04_tm-5_economics-contract.md`
- другие незакоммиченные артефакты пользователя

## Что сделано дополнительно
- Полная регрессия `src/modules/tech-map/` была прогнана сверх адресного test-plan из промпта.
- Исправлен существующий дефект в `tech-map.concurrency.spec.ts`, который мешал зелёной регрессии, но не относился к функциональности TM-4.

## Следующий шаг
- Внешнее ревью пакета TM-4.
- После APPROVED: отдельным этапом финализировать чеклист TM-4, `interagency/INDEX.md` и при необходимости `memory-bank`.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts
 M apps/api/src/modules/tech-map/tech-map.module.ts
 M docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md
 M interagency/INDEX.md
 M packages/prisma-client/schema.prisma
?? apps/api/src/modules/tech-map/adaptive-rules/
?? apps/api/src/modules/tech-map/dto/adaptive-rule.dto.spec.ts
?? apps/api/src/modules/tech-map/dto/adaptive-rule.dto.ts
?? apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.spec.ts
?? apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.ts
?? interagency/plans/2026-03-04_tm-4_adaptive-rules.md
?? interagency/prompts/2026-03-04_tm-4_adaptive-rules.md
?? interagency/prompts/2026-03-04_tm-5_economics-contract.md
```

### git diff (ключевые фрагменты)
```diff
diff --git a/apps/api/src/modules/tech-map/tech-map.module.ts b/apps/api/src/modules/tech-map/tech-map.module.ts
+++ b/apps/api/src/modules/tech-map/tech-map.module.ts
@@
+import { TriggerEvaluationService } from "./adaptive-rules/trigger-evaluation.service";
+import { RegionProfileService } from "./adaptive-rules/region-profile.service";
+import { HybridPhenologyService } from "./adaptive-rules/hybrid-phenology.service";
@@
+    TriggerEvaluationService,
+    RegionProfileService,
+    HybridPhenologyService,
@@
+    TriggerEvaluationService,

diff --git a/packages/prisma-client/schema.prisma b/packages/prisma-client/schema.prisma
+++ b/packages/prisma-client/schema.prisma
@@
+  adaptiveRules      AdaptiveRule[]
+  hybridPhenologyModels HybridPhenologyModel[]
@@
+enum TriggerType { ... }
+enum TriggerOperator { ... }
@@
+  adaptiveRules       AdaptiveRule[]
@@
+model AdaptiveRule { ... }
+model HybridPhenologyModel { ... }

diff --git a/apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts b/apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts
+++ b/apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts
@@
-    prismaMock.tecmhMap?.findFirstOrThrow?.mockResolvedValue({
-      ...mockMap,
-      status: TechMapStatus.ARCHIVED,
-    });
```

### git diff --stat
```text
 .../modules/tech-map/tech-map.concurrency.spec.ts  |  4 --
 apps/api/src/modules/tech-map/tech-map.module.ts   | 13 ++++-
 packages/prisma-client/schema.prisma               | 62 ++++++++++++++++++++++
 3 files changed, 74 insertions(+), 5 deletions(-)
```

### Логи прогонов
```text
$ bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'
The schema at schema.prisma is valid 🚀

$ bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'
Datasource "db": PostgreSQL database "rai_platform", schema "public" at "localhost:5432"
Your database is now in sync with your Prisma schema. Done in 499ms
✔ Generated Prisma Client (v6.19.2) to ./generated-client in 2.92s

$ pnpm --filter api exec tsc --noEmit
PASS

$ cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/dto/adaptive-rule.dto.spec.ts src/modules/tech-map/dto/hybrid-phenology.dto.spec.ts src/modules/tech-map/adaptive-rules/trigger-evaluation.service.spec.ts src/modules/tech-map/adaptive-rules/region-profile.service.spec.ts src/modules/tech-map/adaptive-rules/hybrid-phenology.service.spec.ts
PASS src/modules/tech-map/adaptive-rules/region-profile.service.spec.ts
PASS src/modules/tech-map/dto/hybrid-phenology.dto.spec.ts
PASS src/modules/tech-map/dto/adaptive-rule.dto.spec.ts
PASS src/modules/tech-map/adaptive-rules/trigger-evaluation.service.spec.ts
PASS src/modules/tech-map/adaptive-rules/hybrid-phenology.service.spec.ts
Test Suites: 5 passed, 5 total
Tests:       17 passed, 17 total

$ cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/
PASS src/modules/tech-map/tech-map.concurrency.spec.ts
Test Suites: 22 passed, 22 total
Tests:       75 passed, 75 total
```
