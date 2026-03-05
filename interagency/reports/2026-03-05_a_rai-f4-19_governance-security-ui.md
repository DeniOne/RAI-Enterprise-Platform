# Отчёт — Governance & Security Control UI (F4.19)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-19_governance-security-ui.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые / добавленные файлы

### Backend (API)
- `packages/prisma-client/schema.prisma` — модель `SystemIncident`: добавлены поля `resolvedAt` (DateTime?), `resolveComment` (String? @db.Text).
- `packages/prisma-client/migrations/20260305000000_system_incident_resolve/migration.sql` — миграция: ADD COLUMN resolvedAt, resolveComment в system_incidents.
- `apps/api/src/modules/rai-chat/incident-ops.service.ts` — типы `IncidentFeedItem` (resolvedAt, resolveComment), `GovernanceCountersDto`; методы `resolveIncident(id, companyId, comment)`, `getGovernanceCounters(companyId)` (агрегат по incidentType); маппинг feed с resolvedAt/resolveComment.
- `apps/api/src/modules/rai-chat/incidents-governance.controller.ts` — контроллер `GET /rai/incidents/feed`, `POST /rai/incidents/:id/resolve`, `GET /rai/governance/counters`; JwtAuthGuard + RolesGuard, @Roles(ADMIN); companyId из TenantContext.
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` — регистрация `IncidentsGovernanceController`.
- `apps/api/src/modules/rai-chat/incident-ops.service.spec.ts` — тесты для resolveIncident, getGovernanceCounters; мок с resolvedAt/resolveComment в getIncidentsFeed.

### Web
- `apps/web/lib/api.ts` — блок `api.governance`: incidentsFeed(params), resolveIncident(id, comment), counters(); типы IncidentFeedItem, GovernanceCountersDto.
- `apps/web/app/(app)/governance/security/page.tsx` — страница Governance & Security: виджет Governance Counters (Tenant Isolation, SensitiveDataFilter, по типам), Incidents Feed с фильтром по критичности (High/Medium/Low), ссылки на `/control-tower/trace/:traceId`, кнопка Resolve с общим полем комментария; блок Security Alerts (placeholder под Auto-Runbooks). Стиль zinc-950, Card/Button.

## Реализовано

- **Governance Counters Widget:** счётчики crossTenantBreach и piiLeak из SystemIncident по companyId; разбивка byType (CROSS_TENANT_BREACH, PII_LEAK, и др.).
- **Incidents Feed:** список инцидентов с фильтром по severity (ALL/High/Medium/Low), бейджи типа и критичности, ссылка на Forensic Explorer по traceId, кнопка Resolve с вводом комментария (одно поле на странице).
- **Resolve:** POST /rai/incidents/:id/resolve с body { comment }; обновление resolvedAt и resolveComment в БД; tenant isolation (updateMany по id + companyId).
- **Доступ:** API под @Roles(UserRole.ADMIN). Роль COMPLIANCE в схеме нет — использован только ADMIN.
- **Security Alerts:** блок-заглушка с текстом про Auto-Runbooks (детали в details инцидента).

## Результаты проверок

### tsc
- apps/api: PASS  
- apps/web: PASS  

### jest
- incident-ops.service.spec.ts: 4 tests PASS (logIncident, getIncidentsFeed, resolveIncident, getGovernanceCounters)

### Prisma
- prisma generate: OK  
- Миграция: 20260305000000_system_incident_resolve добавлена.

## DoD

- [x] Лента инцидентов работает, отображает данные и позволяет помечать решёнными (Resolve + комментарий).
- [x] Счётчики безопасности обновляются при загрузке страницы.
- [x] Ссылки на Control Tower ведут на `/control-tower/trace/:traceId`.
- [x] tsc (api + web) проходят.

## UI (кратко)

- **Governance Counters:** карточки — Tenant Isolation (попытки кросс-тенанта), SensitiveDataFilter (PII), по типам (byType).
- **Incidents Feed:** фильтр по severity, строки с типом/severity/датой, ссылка на trace, кнопка Resolve; при решённом — метка «Решён» и комментарий.
- **Security Alerts:** текст про Auto-Runbooks и details.runbookTriggered.
