---
id: DOC-ENG-GEN-104
type: Service Spec
layer: Engineering
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Advisory Incident Runbook (Sprint 5)

## Scope

Runbook для инцидентов advisory-контура (pilot mode):
- деградация качества рекомендаций,
- всплеск ложных срабатываний,
- нарушение latency/error SLO,
- необходимость экстренной остановки выдачи advisory.

## Severity Levels

- `SEV-1`: критический риск для принятия решений в поле, требуется немедленный kill-switch.
- `SEV-2`: существенная деградация качества/доступности, pilot ограничивается или выключается.
- `SEV-3`: локальные сбои без системного воздействия, устраняются без остановки пилота.

## Immediate Actions (First 15 Minutes)

1. Подтвердить инцидент по метрикам (`/api/advisory/ops/metrics`) и журналам аудита.
2. Для `SEV-1` активировать kill-switch:
   - `POST /api/advisory/incident/kill-switch/enable`
   - обязательный `traceId` и `reason`.
3. Зафиксировать событие в incident log и назначить Incident Commander.
4. Уведомить pilot-cohort и стейкхолдеров (операционный канал + TechLead).

## Containment

- Проверить, что `GET /api/advisory/pilot/status` возвращает `enabled=false` (kill-switch enforcement).
- При необходимости отключить pilot cohort точечно:
  - `POST /api/advisory/pilot/cohort/remove`
- Заморозить обновления tuning thresholds до стабилизации.

## Recovery

1. Устранить root cause (правила тюнинга, ingestion quality, перегрузка API).
2. Валидировать стабилизацию по SLO-метрикам (минимум 30 минут).
3. Откатить kill-switch:
   - `POST /api/advisory/incident/kill-switch/disable`
4. Выполнить controlled re-enable для pilot cohort:
   - `POST /api/advisory/pilot/cohort/add`

## Rollback Strategy

- Primary rollback: global advisory stop через kill-switch.
- Secondary rollback: user-scope/tenant-scope деактивация pilot.
- Tuning rollback: вернуть предыдущие threshold значения через `POST /api/advisory/tuning/thresholds`.

## Evidence & Audit Requirements

Обязательные поля для high-impact действий:
- `traceId`
- `actor/userId`
- `companyId`
- `timestamp`
- `reason` (для kill-switch enable)

Audit actions:
- `ADVISORY_KILL_SWITCH_ENABLED`
- `ADVISORY_KILL_SWITCH_DISABLED`
- `ADVISORY_PILOT_ENABLED`
- `ADVISORY_PILOT_DISABLED`
- `ADVISORY_TUNING_UPDATED`

## Tabletop Drill Protocol (Template)

- Scenario ID:
- Date:
- Trigger:
- Decision timeline:
- Kill-switch activation latency:
- Rollback latency:
- Gaps found:
- Action items:

## Post-Incident

1. Провести postmortem в течение 24 часов.
2. Обновить tuning policy и alert thresholds при необходимости.
3. Обновить этот runbook, если выявлены пробелы в процедуре.

## Sprint 6 Operational Drill Evidence

- Automation command: `pnpm --dir apps/api run drill:advisory:oncall`
- Latest report: `docs/04-ENGINEERING/ADVISORY_ONCALL_DRILL_REPORT_2026-02-08.md`
- DR command: `pnpm --dir apps/api run drill:advisory:dr`
- DR report: `docs/04-ENGINEERING/ADVISORY_DR_REHEARSAL_REPORT_2026-02-08.md`
