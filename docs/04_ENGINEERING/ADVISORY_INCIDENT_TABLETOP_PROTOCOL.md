---
id: DOC-ENG-GEN-105
type: Service Spec
layer: Engineering
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Advisory Incident Tabletop Protocol (Sprint 5)

## Session Metadata

- Session ID: `ADVISORY-TABLETOP-2026-02-08`
- Date: 2026-02-08
- Incident Class: `SEV-1`
- Trigger: резкий рост `rejectRate` и жалобы pilot cohort на шумовые рекомендации.

## Objective

Проверить оперативность и корректность процедуры:
- активация kill-switch,
- сдерживание инцидента,
- controlled rollback,
- восстановление pilot-контура.

## Timeline (Simulated)

1. `T+00m` — зафиксирован инцидент по метрикам `ops/metrics`.
2. `T+03m` — активирован kill-switch (`/incident/kill-switch/enable`).
3. `T+05m` — проверено, что `pilot/status` возвращает `enabled=false`.
4. `T+09m` — pilot cohort ограничен на user-scope (`pilot/cohort/remove`).
5. `T+18m` — применен rollback tuning thresholds (`/tuning/thresholds`).
6. `T+27m` — метрики стабилизированы (падение rejectRate, нормализация decision lag).
7. `T+32m` — kill-switch выключен (`/incident/kill-switch/disable`).
8. `T+40m` — pilot cohort частично восстановлен (`pilot/cohort/add`).

## Verification Checklist

- [x] Kill-switch activation event зааудирован.
- [x] Pilot gating после kill-switch отрабатывает корректно.
- [x] Rollback thresholds выполняется без ошибок.
- [x] Recovery sequence документирован и воспроизводим.
- [x] Все high-impact шаги имеют `traceId`, `companyId`, `actor`, timestamp.

## Measured Results

- Kill-switch activation latency: `3 min`
- Full containment latency: `9 min`
- Recovery readiness decision: `27 min`
- Partial pilot restore: `40 min`

## Gaps & Actions

- Gap: отсутствуют авто-оповещения при threshold drift.
- Action: добавить alert rule на рост `rejectRate` > 0.45 в окне 1h.

- Gap: нет визуального индикатора kill-switch в Telegram UX.
- Action: показать явный banner/сообщение о режимах incident lock.

## Conclusion

Tabletop считается успешно пройденным: процедура kill-switch + rollback + controlled recovery рабочая.
