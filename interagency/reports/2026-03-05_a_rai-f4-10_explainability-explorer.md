## Report — 2026-03-05_a_rai-f4-10_explainability-explorer

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-10_explainability-explorer.md`
- **Scope**: Explainability Explorer (Forensics) — API для обогащённого таймлайна трейса (TraceSummary + AiAuditEntry с evidenceRefs + QualityAlert в окне трейса).

---

## 1. Изменённые файлы

- **Prisma**:
  - `packages/prisma-client/schema.prisma` — в модель `AiAuditEntry` добавлено поле `metadata Json?` (evidenceRefs и прочие данные Evidence Tagging).

- **Backend (api)**:
  - `apps/api/src/modules/explainability/dto/trace-forensics.dto.ts` — DTO: `TraceForensicsSummaryDto`, `EvidenceRefDto`, `TraceForensicsEntryDto`, `TraceForensicsAlertDto`, `TraceForensicsResponseDto`.
  - `apps/api/src/modules/explainability/explainability-panel.service.ts` — метод `getTraceForensics(traceId, companyId)`: загрузка AiAuditEntry (tenant check как в getTraceTimeline), TraceSummary по traceId+companyId, QualityAlert по companyId в окне ±12ч от времени трейса; таймлайн с evidenceRefs из `metadata.evidence`.
  - `apps/api/src/modules/explainability/explainability-panel.controller.ts` — эндпоинт `GET /rai/explainability/trace/:traceId/forensics`, JwtAuthGuard + companyId из TenantContext.
  - `apps/api/src/modules/explainability/explainability-panel.service.spec.ts` — моки `traceSummary.findFirst`, `qualityAlert.findMany`; тесты getTraceForensics: успешный ответ (summary + timeline с evidenceRefs + qualityAlerts), 403 при запросе чужого traceId.

- **Interagency**:
  - `interagency/INDEX.md` — статус промта F4-10 → DONE, отчёт READY_FOR_REVIEW.

---

## 2. tsc --noEmit

Команда (из `apps/api`):

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Результат: **Exit code 0**, ошибок нет.

---

## 3. Jest — целевые тесты

Команда (из `apps/api`):

```bash
cd apps/api && pnpm test -- --runTestsByPath src/modules/explainability/explainability-panel.service.spec.ts
```

Результат:

- **PASS**: 1 suite, 8 tests (в т.ч. 2 новых для getTraceForensics).
- getTraceForensics: возвращает summary, timeline с evidenceRefs, qualityAlerts для своего traceId.
- getTraceForensics: для traceId другого тенанта — ForbiddenException (403).

---

## 4. Поведение Forensics API

- **Эндпоинт**: `GET /rai/explainability/trace/:traceId/forensics`. Guard: JwtAuthGuard, companyId только из TenantContext.
- **Ответ**: `TraceForensicsResponseDto` — traceId, companyId, summary (или null), timeline (массив записей с evidenceRefs из metadata), qualityAlerts (BS_DRIFT в окне ±12ч от времени трейса).
- **Изоляция**: проверка по AiAuditEntry (traceId + companyId); при несовпадении tenant — 403. TraceSummary и QualityAlert запрашиваются по companyId.

---

## 5. READY_FOR_REVIEW

Ревью-пак собран. Дальше — ревью Antigravity (TECHLEAD).
