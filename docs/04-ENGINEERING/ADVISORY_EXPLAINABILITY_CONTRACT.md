# Advisory Explainability Contract (Sprint 4)

## Статус

- Scope: Sprint 4 (Gamma)
- Decision: `GAMMA-SPRINT3-001` (расширение shadow advisory UX)
- Режим: human-in-the-loop (без автопринятия)

## 1) Explainability Contract

Источник: `ShadowAdvisoryService.evaluate()`.

Обязательные поля explainability:
- `traceId: string`
- `confidence: number` (`0..1`)
- `why: string` (детерминированная строка причины)
- `factors: Array<{ name: string; value: number; direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL" }>`

В ответе advisory:
- `recommendation: "ALLOW" | "REVIEW" | "BLOCK"`
- `confidence: number`
- `traceId: string`
- `explainability` (блок выше)

## 2) Human Confirmation API

`GET /api/advisory/recommendations/my`
- Возвращает pending-рекомендации в рамках `companyId` текущего пользователя.

`POST /api/advisory/recommendations/:traceId/accept`
- Логирует `ADVISORY_ACCEPTED`.

`POST /api/advisory/recommendations/:traceId/reject`
- Логирует `ADVISORY_REJECTED`.

`POST /api/advisory/recommendations/:traceId/feedback`
- Логирует `ADVISORY_FEEDBACK_RECORDED` с `reason` и опциональным `outcome`.

`GET /api/advisory/recommendations/:traceId/feedback`
- Возвращает feedback-записи по `traceId`.

## 3) Audit Contract

Используемые события аудита:
- `SHADOW_ADVISORY_EVALUATED`
- `ADVISORY_ACCEPTED`
- `ADVISORY_REJECTED`
- `ADVISORY_FEEDBACK_RECORDED`

Обязательные поля `metadata`:
- `traceId`
- `companyId`

Дополнительные поля:
- `reason` (для reject/feedback)
- `outcome` (для feedback)
- `explainability` (для shadow evaluated)

## 4) Security & Governance

- Все операции с tenant-данными фильтруются по `companyId`.
- Автопринятие отсутствует: решение фиксируется только через `accept/reject` endpoint.
- Все high-impact действия трассируются в аудите через `traceId`.
