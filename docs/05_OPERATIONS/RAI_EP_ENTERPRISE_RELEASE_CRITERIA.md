---
id: DOC-OPS-RAI-EP-ENTERPRISE-RELEASE-CRITERIA-20260328
layer: Operations
type: Policy
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-RAI-EP-ENTERPRISE-RELEASE-CRITERIA-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md
---
# RAI_EP ENTERPRISE RELEASE CRITERIA

## CLAIM
id: CLAIM-OPS-RAI-EP-ENTERPRISE-RELEASE-CRITERIA-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение

Этот документ фиксирует, какие оси должны быть закрыты для разных моделей запуска.

## Модели релиза

- `Controlled pilot`
- `Self-host / localized deployment`
- `Managed deployment`
- `External production`

## Обязательные оси readiness

1. Product core readiness
2. Architecture and domain integrity
3. AI governance readiness
4. Security / AppSec readiness
5. Privacy / legal / residency readiness
6. Deployment / backup / DR readiness
7. Installability / support boundary readiness
8. Access governance and release approval readiness

## Минимум для controlled pilot

Должно быть:
- зелёный `build/test/gates` baseline по основному контуру;
- зафиксированный TechMap core и основные domain workflows;
- advisory-first AI behavior;
- ограниченный deployment perimeter;
- понятный owner set;
- отсутствие критичного governance drift.

Не должно быть:
- внешнего массового rollout;
- неограниченной агентной автономии;
- неподтверждённой работы с чувствительными данными вне допустимого perimeter.

## Минимум для self-host / localized

Должно быть:
- install/upgrade packet;
- deployment topology;
- backup/restore runbook и свежий execution evidence;
- release checklist;
- базовая support model;
- формализованные data-boundary rules.

## Минимум для managed deployment

Дополнительно к `self-host`:
- подтверждённые support responsibilities;
- evidence по access governance;
- monitoring, incident и escalation contour;
- обновляемая release discipline и rollback logic.

## Минимум для external production

### Product and domain
- TechMap operating core замкнут;
- critical workflows покрыты и проверяемы;
- `план / факт / отклонения` работают как единая система.

### AI
- formal safety eval suite;
- tool matrix;
- HITL matrix;
- scorecards и incident discipline.

### Security
- критичный dependency debt закрыт до релизного порога;
- secret hygiene подтверждён;
- SAST, SCA и SBOM cycle реально отработан;
- access governance подтверждён.

### Privacy / Legal
- оператор и роли определены;
- статус уведомления и lawful basis понятны;
- residency и localization подтверждены;
- processor contracts и chain-of-title собраны;
- transborder decisions оформлены.

### Operations
- backup, restore и DR evidence актуален;
- installability подтверждена;
- support boundary формализована;
- release approval и rollback порядок зафиксированы.

## Release stop conditions

Релиз не должен идти дальше, если:
- legal/compliance остаётся в состоянии `NO-GO`;
- high-impact AI flows не покрыты HITL;
- критичный dependency/AppSec риск не опущен до допустимого уровня;
- нет актуального backup/restore evidence;
- архитектурный периметр релиза не описан честно.

## Практическое правило

До отдельного закрытия всех внешних legal и ops evidence каноническим путём для `RAI_EP` приоритетным маршрутом нужно считать:

`self-host / localized first -> controlled pilot -> managed -> external production`
