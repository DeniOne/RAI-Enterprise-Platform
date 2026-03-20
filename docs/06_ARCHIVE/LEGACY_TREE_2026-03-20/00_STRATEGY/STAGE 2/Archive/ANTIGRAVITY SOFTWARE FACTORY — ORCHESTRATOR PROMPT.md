---
id: DOC-ARV-ARCHIVE-ANTIGRAVITY-SOFTWARE-FACTORY-ORCHE-1JFC
layer: Archive
type: Legacy
status: archived
version: 0.3.0
owners: [@techlead]
last_updated: 2026-03-05
---
# SOFTWARE FACTORY
## ORCHESTRATOR PROMPT — ИНСТРУКЦИИ ДЛЯ КОДЕРА

## 1. ОБЯЗАТЕЛЬНОЕ ЧТЕНИЕ (ПЕРЕД НАЧАЛОМ)

Ты **ОБЯЗАН** прочитать эти файлы, чтобы понимать архитектурные ограничения A_RAI:

- `/root/RAI_EP/docs/00_STRATEGY/BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md` — как работает бизнес.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md` — принципы Рэй.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md` — топория AI Swarm.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md` — основной операционный чеклист текущей серии работ `R1-R12`. Каждый промт и ревью-пак должен двигать соответствующий пункт этого чеклиста.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` — верхний production-readiness gate. Используй его как ограничение и критерий полноты: нельзя закрывать локальные задачи так, чтобы это ухудшало готовность мультиагентной системы к внедрению AI.

---

## 2. ПРАВИЛА ИСПОЛНЕНИЯ (ЖЕСТКО)

1. **Промт = полное ТЗ.** Отдельный файл плана в `interagency/plans/` **НЕ ТРЕБУЕТСЯ.** Весь скоп, DoD и ограничения — в промте.
2. **Нет гейта ACCEPTED.** Сразу после получения промта — пиши код.
3. **Multi-tenancy:** Всегда используй `companyId` для изоляции данных. **НИКОГДА** не бери `companyId` из payload запроса.
4. **Service = IO / Orchestrator = Brain:** Не смешивай логику. Инфраструктура (БД/Redis) — только в сервисах.
5. **Язык:** Весь вывод — **СТРОГО НА РУССКОМ**. См. `memory-bank/LANGUAGE_POLICY.md`.
6. **Рабочий vs Финальный чеклист:** `TRUTH_SYNC_RECOVERY_CHECKLIST.md` — это текущий рабочий инструмент для выполнения промта. `A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` — это финальный стратегический gate перед реальным внедрением AI. Если локальная задача закрыта, но нарушает production-readiness, задача считается проваленной.

---

## 3. АЛГОРИТМ РАБОТЫ

1. Взять промт из `interagency/prompts/`.
2. **Сразу писать код** — файл плана не нужен, промт является полным ТЗ.
3. После кода сразу Собрать отчёт в `interagency/reports/` — **ревью-пак**:
   - Список изменённых файлов
   - Вывод `tsc --noEmit` (PASS)
   - Вывод `jest` для целевых тестов (PASS)
   - Логи/доказательства smoke-проверок
4. Выставить `READY_FOR_REVIEW` в `interagency/INDEX.md`.
5. **СТОП.** Дальше — Antigravity (TECHLEAD) делает ревью.

---

## 4. ГДЕ НЕЛЬЗЯ ОШИБАТЬСЯ

- **Security Canon:** Проверяй соответствие `SECURITY_CANON.md`.
- **Audit & Telemetry:** Каждый вызов AI должен быть привязан к `traceId` и залогирован в `AuditService`. Всегда заполнять `TraceSummary` (подсчет токенов, времени, версий промптов).
- **Deterministic:** Астрономические/агрономические расчеты — только через детерминированные движки, а не через галлюцинации LLM.
- **Truthfulness (BS%):** Любой ответ агента должен сопровождаться разметкой утверждений (Evidence Tagging) для расчёта качества (BS%) и вывода на Explainability панель.
