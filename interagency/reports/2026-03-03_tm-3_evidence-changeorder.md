# REPORT — TechMap Sprint TM-3: Evidence + ChangeOrder Protocol
Дата: 2026-03-03
Статус: **APPROVED**

## Ревью: APPROVED
**Ревьюер**: Antigravity Orchestrator
**Дата**: 2026-03-03

### Чек-лист ревью (REVIEW & FINALIZE PROMPT §1)
| # | Критерий | Результат |
|---|----------|----|
| 1 | Нет секретов в диффе | ✅ PASS |
| 2 | `companyId` НЕ из payload | ✅ PASS — все методы принимают `companyId` параметром; `EvidenceService.attachEvidence` использует переданный companyId, не из dto |
| 3 | Tenant isolation в схеме | ✅ PASS — Evidence, ChangeOrder, Approval: `companyId` + `@@index([companyId])` + `Company @relation` |
| 4 | Append-only соблюдён | ✅ PASS — статус меняется через выделенные методы с `$transaction` |
| 5 | Safe nullable в calculateContingency | ✅ PASS — при любом null → return 0 → дефолт AGRONOMIST |
| 6 | FSM не перезаписан | ✅ PASS — `this.fsm.canTransition` вызывается как проверка, без мутации |
| 7 | prisma validate + db push | ✅ PASS |
| 8 | tsc | ✅ PASS |
| 9 | Адресные тесты TM-3 | ✅ PASS — 5 suites / 16 tests |
| 10 | Полный pnpm test | ⚠️ 25 failed / 555 total — все изучены: `tech-map.concurrency.spec.ts` падает из-за pre-existing опечатки `prismaMock.tecmhMap` (не scope TM-3); остальные — TS-ошибки удалённых файлов и DI-проблемы в других модулях. TM-3 не является причиной. |

**Замечаний к доработке**: нет.

---


## Что было целью
- Реализовать контур цифровых доказательств исполнения операций `Evidence`.
- Реализовать протокол изменений техкарты `ChangeOrder + Approval`.
- Ограничить изменения `packages/prisma-client/schema.prisma` и `apps/api/src/modules/tech-map/` без затрагивания UI и API-контроллеров.

## Что сделано (факты)
- Подтверждён `Decision-ID: AG-TM-EV-003` со статусом `ACCEPTED` в `DECISIONS.log`.
- В `packages/prisma-client/schema.prisma` добавлены enum-ы `EvidenceType`, `ChangeOrderType`, `ChangeOrderStatus`, `ApproverRole`, `ApprovalDecision`.
- В `packages/prisma-client/schema.prisma` добавлены модели `Evidence`, `ChangeOrder`, `Approval`.
- В `packages/prisma-client/schema.prisma` добавлены relation-поля:
- `Company`: `evidence`, `changeOrders`, `approvals`
- `TechMap`: `changeOrders`
- `MapOperation`: `evidence`
- В `apps/api/src/shared/prisma/prisma.service.ts` добавлены tenant-scoped модели `Evidence`, `ChangeOrder`, `Approval`.
- Созданы DTO:
- `apps/api/src/modules/tech-map/dto/evidence.dto.ts`
- `apps/api/src/modules/tech-map/dto/change-order.dto.ts`
- `apps/api/src/modules/tech-map/dto/approval.dto.ts`
- Созданы unit-тесты DTO:
- `evidence.dto.spec.ts`
- `change-order.dto.spec.ts`
- `approval.dto.spec.ts`
- Создан `apps/api/src/modules/tech-map/evidence/evidence.service.ts` с методами:
- `attachEvidence`
- `validateOperationCompletion`
- `getByOperation`
- Создан `apps/api/src/modules/tech-map/change-order/change-order.service.ts` с методами:
- `createChangeOrder`
- `routeForApproval`
- `decideApproval`
- `applyChangeOrder`
- `rejectChangeOrder`
- В `apps/api/src/modules/tech-map/tech-map.module.ts` зарегистрированы `EvidenceService` и `ChangeOrderService`.

## Изменённые файлы
- `packages/prisma-client/schema.prisma`
- `apps/api/src/shared/prisma/prisma.service.ts`
- `apps/api/src/modules/tech-map/tech-map.module.ts`
- `apps/api/src/modules/tech-map/evidence/evidence.service.ts`
- `apps/api/src/modules/tech-map/evidence/evidence.service.spec.ts`
- `apps/api/src/modules/tech-map/change-order/change-order.service.ts`
- `apps/api/src/modules/tech-map/change-order/change-order.service.spec.ts`
- `apps/api/src/modules/tech-map/dto/evidence.dto.ts`
- `apps/api/src/modules/tech-map/dto/evidence.dto.spec.ts`
- `apps/api/src/modules/tech-map/dto/change-order.dto.ts`
- `apps/api/src/modules/tech-map/dto/change-order.dto.spec.ts`
- `apps/api/src/modules/tech-map/dto/approval.dto.ts`
- `apps/api/src/modules/tech-map/dto/approval.dto.spec.ts`

## Проверки/прогоны
- `bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'` → PASS
- `bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'` → PASS
- `pnpm --filter api exec tsc --noEmit` → PASS
- `cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/evidence/ src/modules/tech-map/change-order/ src/modules/tech-map/dto/evidence.dto.spec.ts src/modules/tech-map/dto/change-order.dto.spec.ts src/modules/tech-map/dto/approval.dto.spec.ts` → PASS, 5 suites / 16 tests

## Что сломалось / что не получилось
- Полный `pnpm --filter api test -- --passWithNoTests` для TM-3 не запускался в рамках этого пакета; в TM-1 уже были зафиксированы существующие красные тесты вне TechMap scope.
- В `git status` присутствуют посторонние изменения вне TM-3:
- `DECISIONS.log`
- `apps/api/DETERMINISM_PROOF.json`
- `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md`
- `docs/CURSOR SOFTWARE FACTORY — REVIEW & FINALIZE PROMPT.md`
- `interagency/INDEX.md`
- файлы cache/прочие артефакты среды
- В `git diff` также присутствуют ранее изменённые файлы TM-2 (`tech-map.service.ts`, `tech-map.concurrency.spec.ts`, `validation/*`, `calculators/*`); они не изменялись в рамках данного TM-3 исполнения, но уже находятся в рабочем дереве.

## Следующий шаг
- Внешнее ревью пакета TM-3.
- После APPROVED: отдельным этапом собирать финализацию, обновления execution-checklist и memory-bank по канону.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/DETERMINISM_PROOF.json
 M apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts
 M apps/api/src/modules/tech-map/tech-map.module.ts
 M apps/api/src/modules/tech-map/tech-map.service.ts
 M apps/api/src/shared/prisma/prisma.service.ts
 M docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md
 M "docs/CURSOR SOFTWARE FACTORY — REVIEW & FINALIZE PROMPT.md"
 M interagency/INDEX.md
 M packages/prisma-client/schema.prisma
 M v8-compile-cache-0/x64/12.4.254.21-node.21/zSrootzS.nvmzSversionszSnodezSv22.10.0zSlibzSnode_moduleszScorepackzSdistzSpnpm.js.BLOB
 M v8-compile-cache-0/x64/12.4.254.21-node.21/zSrootzS.nvmzSversionszSnodezSv22.10.0zSlibzSnode_moduleszScorepackzSdistzSpnpm.js.MAP
?? apps/api/src/modules/tech-map/calculators/
?? apps/api/src/modules/tech-map/change-order/
?? apps/api/src/modules/tech-map/dto/approval.dto.spec.ts
?? apps/api/src/modules/tech-map/dto/approval.dto.ts
?? apps/api/src/modules/tech-map/dto/change-order.dto.spec.ts
?? apps/api/src/modules/tech-map/dto/change-order.dto.ts
?? apps/api/src/modules/tech-map/dto/evidence.dto.spec.ts
?? apps/api/src/modules/tech-map/dto/evidence.dto.ts
?? apps/api/src/modules/tech-map/evidence/
?? apps/api/src/modules/tech-map/validation/
?? interagency/plans/2026-03-03_tm-2_dag-validation.md
?? interagency/plans/2026-03-03_tm-3_evidence-changeorder.md
?? interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md
```

### git diff (ключевые фрагменты)
```diff
diff --git a/apps/api/src/modules/tech-map/tech-map.module.ts b/apps/api/src/modules/tech-map/tech-map.module.ts
+++ b/apps/api/src/modules/tech-map/tech-map.module.ts
@@
+import { EvidenceService } from "./evidence/evidence.service";
+import { ChangeOrderService } from "./change-order/change-order.service";
@@
+    EvidenceService,
+    ChangeOrderService,
@@
+  exports: [TechMapService, EvidenceService, ChangeOrderService],

diff --git a/apps/api/src/shared/prisma/prisma.service.ts b/apps/api/src/shared/prisma/prisma.service.ts
+++ b/apps/api/src/shared/prisma/prisma.service.ts
@@
+    "Evidence",
@@
+    "ChangeOrder",
+    "Approval",

diff --git a/packages/prisma-client/schema.prisma b/packages/prisma-client/schema.prisma
+++ b/packages/prisma-client/schema.prisma
@@
+  evidence           Evidence[]
+  changeOrders       ChangeOrder[]
+  approvals          Approval[]
@@
+enum EvidenceType { ... }
+enum ChangeOrderType { ... }
+enum ChangeOrderStatus { ... }
+enum ApproverRole { ... }
+enum ApprovalDecision { ... }
@@
+  changeOrders        ChangeOrder[]
@@
+  evidence  Evidence[]
@@
+model Evidence { ... }
+model ChangeOrder { ... }
+model Approval { ... }
```

### git diff --stat
```text
 apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts  |  14 ++
 apps/api/src/modules/tech-map/tech-map.module.ts            |  20 ++-
 apps/api/src/modules/tech-map/tech-map.service.ts           | 169 ++++++++++++++++++++-
 apps/api/src/shared/prisma/prisma.service.ts                |   3 +
 packages/prisma-client/schema.prisma                        | 108 +++++++++++++
 5 files changed, 309 insertions(+), 5 deletions(-)
```

### Логи прогонов
```text
$ bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'
The schema at schema.prisma is valid 🚀

$ bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'
Datasource "db": PostgreSQL database "rai_platform", schema "public" at "localhost:5432"
Your database is now in sync with your Prisma schema. Done in 543ms
✔ Generated Prisma Client (v6.19.2) to ./generated-client in 5.13s

$ pnpm --filter api exec tsc --noEmit
PASS

$ cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/evidence/ src/modules/tech-map/change-order/ src/modules/tech-map/dto/evidence.dto.spec.ts src/modules/tech-map/dto/change-order.dto.spec.ts src/modules/tech-map/dto/approval.dto.spec.ts
PASS src/modules/tech-map/change-order/change-order.service.spec.ts
PASS src/modules/tech-map/evidence/evidence.service.spec.ts
PASS src/modules/tech-map/dto/approval.dto.spec.ts
PASS src/modules/tech-map/dto/evidence.dto.spec.ts
PASS src/modules/tech-map/dto/change-order.dto.spec.ts
Test Suites: 5 passed, 5 total
Tests: 16 passed, 16 total
```
