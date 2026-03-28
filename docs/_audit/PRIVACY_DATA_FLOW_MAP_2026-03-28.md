---
id: DOC-ARV-AUDIT-PRIVACY-DATA-FLOW-MAP-20260328
layer: Archive
type: Research
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
---
# PRIVACY DATA FLOW MAP 2026-03-28

## 1. Общий Вердикт

В проекте уже есть признаки privacy-aware engineering:

- `SensitiveDataFilterService`
- `PII_LEAK` incidents
- tenant-scoped explainability / incident feed
- WORM / audit trail контуры

Но applied privacy baseline остаётся неполным: нет единого data inventory, retention/deletion policy pack, transborder/provider registry и operator artifact set.

## 2. Вероятные Субъекты Данных

| Субъект | Evidence |
|---|---|
| сотрудники / пользователи платформы | auth/user/company контуры, web/telegram runtime |
| представители контрагентов | CRM / commerce / party assets surfaces |
| операторы и эксперты | explainability, advisory, audit trail |
| лица из коммуникационных каналов | telegram, front-office, AI chat traces |

## 3. Категории Данных

| Категория | Evidence | Статус |
|---|---|---|
| идентификационные и контактные данные | PII masking patterns: email, телефон, ИНН-подобные значения | подтверждено кодом |
| tenant/company context | `companyId`, trace, incident feeds | подтверждено кодом |
| operational / advisory traces | explainability, incidents, trace summaries | подтверждено кодом |
| документооборот и party assets | web commerce/party flows, `party-assets-api` tests | подтверждено кодом |
| retention / deletion metadata | projection/deletion semantics в части docs/gates | частично подтверждено |

## 4. Основные Потоки

| Поток | Откуда | Куда | Контроли | Gap |
|---|---|---|---|---|
| Web forms / CRM / party flows | `apps/web` | `apps/api` + DB | auth, tenant context, tests on party flows | build/test красные; нет formal privacy inventory |
| Telegram interactions | `apps/telegram-bot` | API/web workspace links, traces | runtime tests PASS, tenant-aware behavior | нет отдельной privacy policy for messaging data |
| Rai Chat / agent outputs | `apps/api/src/modules/rai-chat/*` | response composer, traces, incidents | `SensitiveDataFilter`, truthfulness/evidence, incidents | routing regressions, нет full AI safety release gate |
| Explainability / incidents | decision traces | explainability panel / incidents feed | tenant isolation, PII masking, audit trail | retention/deletion/SLA не сведены в единый privacy contract |
| Audit / WORM artifacts | audit events | local fs / S3-compatible WORM | fail-closed WORM checks, object lock intent | production topology and retention evidence не подтверждены |

## 5. Внешние И Трансграничные Paths

- Прямой production-grade provider matrix для внешних LLM/cloud tools из локального кода не подтверждён.
- При этом архитектура agent/tool/runtime допускает внешние provider-like integrations, поэтому transborder review нельзя считать `неприменимым` автоматически.
- На дату аудита верный статус: `требуется отдельная валидация`.

## 6. Что Уже Есть

1. Маскирование PII на выходе LLM/agent paths.
2. `PII_LEAK` как отдельный incident type.
3. Tenant-scoped feeds и explainability read paths.
4. Audit/WORM intent и связанные implementation traces.

## 7. Что Не Доказано

1. Formal privacy policy pack.
2. Data retention matrix по каждому классу данных.
3. Subject rights workflow.
4. Notification/localization status.
5. Provider/transborder register.
6. Legal basis registry по процессам обработки.

## 8. Applied Priority

1. Свести `data inventory` и `processing register`.
2. Зафиксировать `retention/deletion` policy.
3. Отделить `confirmed local-only flows` от `potential external provider flows`.
4. Связать privacy map с legal packet и launch checklist.
