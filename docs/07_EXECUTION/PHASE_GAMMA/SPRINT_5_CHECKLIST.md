---
id: DOC-EXE-GEN-150
type: Phase Plan
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Чек-лист Sprint 5 (Phase Gamma)

**Название:** «Живой пилот и тюнинг»  
**Срок:** 2 недели  
**Статус:** planned  
**Цель:** запустить ограниченный pilot advisory-контур на фокус-группе, стабилизировать ранжирование и ввести эксплуатационные SLO/incident-процедуры.

## Объем Sprint 5
- [x] **Pilot Activation (Feature Flags):** включить advisory-flow для фокус-группы tenant/user через управляемые флаги, без глобального rollout.
- [x] **Ranking Tuning Loop:** внедрить цикл тюнинга порогов (`ALLOW/REVIEW/BLOCK`) на основе `accept/reject/feedback` и baseline-метрик.
- [x] **Prompt Fatigue Control:** ограничить частоту/повторяемость рекомендаций (anti-spam / anti-noise policy).
- [x] **SLO Dashboard:** добавить эксплуатационную панель (latency, error rate, recommendation coverage, decision conversion).
- [x] **Pilot Telemetry:** фиксировать события pilot-активации/деактивации и контрольных срезов качества.
- [x] **Incident Runbook:** оформить и валидировать runbook на случаи деградации/ошибочных рекомендаций (kill-switch + rollback).

## Критерии готовности (DoD)
- [x] Pilot включается/отключается точечно (tenant/user scope), без redeploy.
- [x] Тюнинг порогов опирается на измеримые метрики и зафиксирован в документации решений.
- [ ] Доля шумовых рекомендаций снижена относительно baseline Sprint 4 (определен и выполнен целевой threshold).
- [x] SLO-метрики доступны в dashboard и пригодны для операционного мониторинга.
- [x] Incident runbook отработан минимум в 1 tabletop-сценарии.
- [x] Минимум 8 тестов (unit/integration) по pilot flags + ranking tuning + anti-spam policy + incident hooks зеленые.
- [x] Нет регрессий в Sprint 4 confirmation/explainability flow.

## Anti-Goals Sprint 5
- [ ] Нет full rollout на всех пользователей.
- [ ] Нет отключения human-in-the-loop.
- [ ] Нет расширения продуктового scope на новые внешние интеграции/API.
- [ ] Нет «тихой» смены рекомендационных порогов без аудируемого следа.

## Security & Governance Gate
- [x] Проверка соответствия `SECURITY_CANON.md` для pilot-flag endpoint/handlers.
- [x] Проверка tenant-изоляции во всех pilot/tuning write-операциях (`companyId` scope).
- [x] Проверка обязательной трассировки изменений порогов/флагов (`traceId`, actor, timestamp).
- [x] Проверка наличия kill-switch и rollback-процедуры для high-impact инцидентов.

## Артефакты на выходе
- [x] Документ pilot-rollout policy (scope, eligibility, rollback).
- [x] Документ tuning policy (метрики, пороги, cadence пересмотра).
- [x] Реализация feature-flag контура для advisory pilot (API + Telegram/Web enforcement).
- [x] Реализация anti-spam/anti-noise политики рекомендаций.
- [x] SLO dashboard для advisory (операционные метрики + алерты).
- [x] Incident runbook + протокол tabletop-проверки.
- [x] Обновление `SPRINT_CHECKLIST.md`, `TECHNICAL_DEVELOPMENT_PLAN.md`, `FULL_PROJECT_WBS.md`, `memory-bank/task.md`.


