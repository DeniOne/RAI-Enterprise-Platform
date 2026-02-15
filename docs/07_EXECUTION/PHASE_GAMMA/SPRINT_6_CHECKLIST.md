---
id: DOC-EXE-GEN-151
type: Phase Plan
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Чек-лист Sprint 6 (Phase Gamma)

**Название:** «Hardening и Controlled Go-Live»  
**Срок:** 2 недели  
**Статус:** completed  
**Цель:** завершить техническое упрочнение advisory-контура, провести безопасный canary rollout и выполнить финальный go/no-go перед общим запуском.

## Объем Sprint 6
- [x] **Canary Rollout Plan:** staged rollout внедрен в API (stage config/promote/rollback/gate/auto-stop) и подтвержден drill-сценариями.
- [x] **Load & Stress Validation:** проведен базовый load-run advisory read-path (errorRate 0, p95 409ms, p99 726ms), зафиксирован отчет и baseline.
- [x] **Reliability Hardening:** state-cache + invalidation внедрены, stress-профили `25/50 VU` пройдены в рамках SLO.
- [x] **Operational Alerts & On-call Readiness:** выполнен on-call drill (rollout gate fail -> auto-stop audit -> kill-switch -> rollback), evidence зафиксирован.
- [x] **Disaster Recovery Drill:** rehearsal выполнен, rollback до safe-stage подтвержден, RTO/RPO зафиксированы.
- [x] **Final Go/No-Go Review:** подготовлен decision record (`GO`) с evidence и стадийными ограничениями для перехода к `S4`.

## Критерии готовности (DoD)
- [x] Canary rollout выполнен по staged-процедуре в pilot rehearsal без критичных инцидентов Sev-1/Sev-2.
- [x] Есть подтвержденные результаты load/stress тестов с измеримыми порогами capacity.
- [x] P95/P99 latency, error rate и conversion по advisory не выходят за целевые SLO на каждой стадии rollout.
- [x] Проверены rollback-процедуры и kill-switch в условиях реального canary.
- [x] On-call команда прошла operational readiness check (алерты, runbook, эскалации).
- [x] Нет регрессий в explainability, human confirmation и audit-trail цепочке.
- [x] Минимум 10 тестов (unit/integration/e2e) по rollout hooks, resilience и incident paths зеленые.

## Anti-Goals Sprint 6
- [x] Нет мгновенного full rollout без canary-стадий и gate-критериев.
- [x] Нет ослабления tenant-изоляции и security-политик ради скорости запуска.
- [x] Нет отключения обязательного human-in-the-loop для high-impact рекомендаций.
- [x] Нет запуска в production без формального go/no-go протокола.

## Security & Governance Gate
- [x] Проверка соответствия `SECURITY_CANON.md` для rollout/hardening изменений.
- [x] Проверка сохранения tenant-boundary на всех новых оптимизациях и fallback-маршрутах.
- [x] Проверка полной аудируемости rollout-событий (стадия, actor, traceId, timestamp, outcome).
- [x] Проверка корректности rollback и incident-команд в условиях production-like среды.

## Артефакты на выходе
- [x] Документ canary rollout protocol (этапы, gate-метрики, stop/rollback критерии).
- [x] Отчет load/stress тестирования с целевыми и фактическими значениями.
- [x] Обновленный operations runbook (incident + rollback + escalation matrix).
- [x] Go/No-Go decision record с итоговым статусом Sprint 6.
- [x] Security & Governance gate report: `docs/04-ENGINEERING/ADVISORY_SECURITY_GATE_REPORT_SPRINT6.md`.
- [x] S4 promotion smoke report: `docs/04-ENGINEERING/ADVISORY_S4_PROMOTION_SMOKE_REPORT_2026-02-08.md`.
- [x] Обновление `SPRINT_CHECKLIST.md`, `TECHNICAL_DEVELOPMENT_PLAN.md`, `FULL_PROJECT_WBS.md`, `memory-bank/task.md`.

## Исполнимый план (Owner + Estimate)
- [x] **S6-WP1 API Rollout Controls** (`owner: backend`, `estimate: 2d`): rollout stage config, gate evaluation, auto-stop/rollback hooks, rollout audit events.
- [x] **S6-WP2 Web Rollout Observability** (`owner: web`, `estimate: 1.5d`): operational block со stage-status, SLO индикаторами и incident banner.
- [x] **S6-WP3 Telegram Safety UX** (`owner: bot`, `estimate: 1d`): корректное поведение advisory команд при stage stop/rollback/kill-switch.
- [x] **S6-WP4 Load & Stress Suite** (`owner: backend+qa`, `estimate: 2d`): сценарии готовы, выполнен baseline load-run, отчет p95/p99/error budget зафиксирован.
- [x] **S6-WP5 Reliability Hardening** (`owner: backend`, `estimate: 2d`): кэширование состояний + стресс-валидация под нагрузкой, без деградации SLO.
- [x] **S6-WP6 Alerting & On-call Drill** (`owner: sre/ops`, `estimate: 1.5d`): drill выполнен, audit/evidence подтверждены.
- [x] **S6-WP7 DR/Rollback Rehearsal** (`owner: sre+backend`, `estimate: 1d`): учение выполнено, audit и recovery-метрики подтверждены.
- [x] **S6-WP8 Go/No-Go Evidence Pack** (`owner: techlead`, `estimate: 1d`): пакет подготовлен, статус зафиксирован (`GO`, effective stage `S3`).

## Календарь спринта (2 недели)
- [x] **Day 1-2:** WP1 + базовые rollout gates + аудит событий rollout.
- [x] **Day 3:** WP2/WP3 интеграция UI/Telegram с rollout stage состояниями.
- [x] **Day 4-5:** WP4 нагрузочная кампания + первичный capacity report.
- [x] **Day 6-7:** WP5 hardening по bottleneck'ам + повторный прогон stress.
- [x] **Day 8:** WP6 operational readiness drill (alerts/escalation/runbook).
- [x] **Day 9:** WP7 DR/rollback rehearsal + фиксация фактического RTO/RPO.
- [x] **Day 10:** WP8 go/no-go review + итоговый decision record.
