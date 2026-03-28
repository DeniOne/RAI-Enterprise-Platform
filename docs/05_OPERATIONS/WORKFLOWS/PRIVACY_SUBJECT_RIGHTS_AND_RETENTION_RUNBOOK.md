---
id: DOC-OPS-WORKFLOWS-PRIVACY-SUBJECT-RIGHTS-RETENTION-RUNBOOK-20260328
layer: Operations
type: Runbook
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-WORKFLOWS-PRIVACY-SUBJECT-RIGHTS-RETENTION-RUNBOOK-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: packages/prisma-client/schema.prisma;apps/api/src/shared/auth/front-office-auth.service.ts;apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.ts;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md
---
# PRIVACY SUBJECT RIGHTS AND RETENTION RUNBOOK

## CLAIM
id: CLAIM-OPS-WORKFLOWS-PRIVACY-SUBJECT-RIGHTS-RETENTION-RUNBOOK-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Когда использовать
- запрос субъекта на доступ, исправление, удаление, ограничение обработки;
- termination / прекращение отношений;
- privacy incident с риском раскрытия ПДн;
- аудит retention/deletion obligations.

## Intake checklist
1. Подтвердить личность заявителя и его связь с tenant / account / party.
2. Определить контур данных:
   - auth/front-office;
   - telegram;
   - AI/explainability/audit;
   - legal/finance/domain entities.
3. Проверить legal basis и stop-factors:
   - действующие договорные обязательства;
   - mandatory retention;
   - immutable/WORM storage;
   - active incident/investigation hold.

## System map для проверки
- `User`, `Invitation`, `CounterpartyUserBinding`, связанные snapshots.
- Tenant/domain entities с контактными и договорными данными.
- Explainability / audit / incident artifacts, включая `PII_LEAK` traces.
- WORM / immutable receipts: удаление может быть недоступно, допускаются restriction и access cut-off вместо hard delete.

## SLA baseline
- `TTA`: до 1 рабочего дня.
- `Первичный legal triage`: до 3 рабочих дней.
- `Выполнение подтверждённого action`: до 30 календарных дней, если нет законного stop-factor.

## Stop criteria
- роль оператора не подтверждена;
- невозможно надёжно идентифицировать субъекта;
- данные попадают под mandatory retention / litigation hold / WORM immutability;
- запрос затрагивает transborder/provider contours без отдельного legal owner.

## Результат выполнения
- зафиксировать request id, owner, affected systems, итог `fulfilled / denied / partially fulfilled`;
- если отказ или частичное выполнение, отдельно зафиксировать правовое основание;
- обновить внешний legal log и incident/audit trail.
