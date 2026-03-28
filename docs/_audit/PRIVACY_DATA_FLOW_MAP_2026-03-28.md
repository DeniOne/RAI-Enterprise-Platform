---
id: DOC-ARV-AUDIT-PRIVACY-DATA-FLOW-MAP-20260328
layer: Archive
type: Research
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-28
---
# PRIVACY DATA FLOW MAP 2026-03-28

## 1. Общий Вердикт

Privacy baseline больше не полностью разрозненный:
- есть active privacy/operator register;
- есть subject-rights / retention runbook;
- есть deployment/transborder/provider matrix;
- есть code-backed PII masking и `PII_LEAK` incidents.

Но legal readiness всё ещё неполная, потому что operator/legal evidence и actual residency/transborder decisions не подтверждены внешними артефактами.

## 2. Субъекты Данных

| Субъект | Evidence |
|---|---|
| сотрудники / внутренние пользователи | `User`, auth/runtime контуры |
| front-office пользователи и приглашённые | `Invitation`, `CounterpartyUserBinding`, front-office auth service |
| представители контрагентов | CRM / commerce / party/contact flows |
| пользователи telegram контуров | telegram bot runtime и notification paths |
| операторы и эксперты | explainability, advisory, audit trail |
| пользователи AI / trace контуров | `rai-chat`, incidents, trace summaries |

## 3. Категории Данных

| Категория | Evidence | Статус |
|---|---|---|
| email / phone / Telegram ID / password hash | `packages/prisma-client/schema.prisma` | подтверждено кодом |
| tenant/company context | `companyId`, trace, incident feeds | подтверждено кодом |
| operational / advisory traces | explainability, incidents, trace summaries | подтверждено кодом |
| party/contact / lookup identifiers | DaData and commerce flows | подтверждено кодом |
| retention metadata | `retentionMode`, `retentionUntil`, WORM contour | частично подтверждено |

## 4. Основные Потоки

| Поток | Откуда | Куда | Контроли | Residual gap |
|---|---|---|---|---|
| Web auth / CRM / front-office | `apps/web` | `apps/api` + DB | auth, tenant context, tests | public privacy notice and lawful basis not confirmed |
| Telegram interactions | `apps/telegram-bot` | API / notifications / auth links | runtime tests PASS, tokenized auth flows | messaging legal basis and transborder decision unresolved |
| Rai Chat / agent outputs | `apps/api/src/modules/rai-chat/*` | response composer, traces, incidents | `SensitiveDataFilterService`, truthfulness/evidence, incidents | provider/legal gate for external LLM unresolved |
| Explainability / incidents | decision traces | explainability panel / incidents feed | tenant isolation, PII masking, audit trail | retention/SLA only partially formalized |
| Audit / WORM artifacts | audit events | local fs / S3-compatible WORM | WORM runtime policy and runbooks | production hosting/residency evidence absent |

## 5. Внешние И Трансграничные Paths

| Контур | Статус |
|---|---|
| OpenRouter | внешний provider подтверждён кодом; legal/transborder decision обязателен |
| Telegram | внешняя платформа подтверждена кодом; legal/transborder decision обязателен |
| DaData | внешний provider подтверждён кодом; processor/legal review обязателен |
| Local Postgres / Redis / MinIO | self-host path подтверждён; actual production geography не подтверждена |

## 6. Что Уже Есть

1. Active `privacy/operator` register.
2. Active `subject rights / retention` runbook.
3. Active `hosting/transborder/deployment` matrix.
4. Маскирование PII на output path.
5. `PII_LEAK` как отдельный incident type.
6. Tenant-scoped feeds и explainability read paths.

## 7. Что Не Доказано

1. Operator legal entity и processor contracts.
2. Notification status в РКН.
3. Actual localization / hosting geography.
4. Full lawful basis / privacy notice wording.
5. Final transborder decision pack.

## 8. Applied Priority

1. Замкнуть active registers внешним legal evidence.
2. Подтвердить residency/transborder status по каждому external provider.
3. Зафиксировать owner и SLA для subject-rights runbook.
4. Связать privacy map с launch checklist и deployment target matrix.
