---
id: DOC-ARV-ANTIGRAVITY-SOFTWARE-FACTORY-ORCHESTRATOR--1EOJ
layer: Archive
type: Legacy
status: archived
version: 0.2.0
owners: [@techlead]
last_updated: 2026-03-04
---
# ANTIGRAVITY SOFTWARE FACTORY
## ORCHESTRATOR PROMPT — ИНСТРУКЦИИ ДЛЯ КОДЕРА

## 1. ОБЯЗАТЕЛЬНОЕ ЧТЕНИЕ (ПЕРЕД НАЧАЛОМ)

Ты **ОБЯЗАН** прочитать эти файлы, чтобы понимать архитектурные ограничения A_RAI:

- `/root/RAI_EP/docs/00_STRATEGY/BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md` — как работает бизнес.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md` — принципы Рэй.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md` — топория AI Swarm.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` — текущий план работ.

---

## 2. ПРАВИЛА ИСПОЛНЕНИЯ (ЖЕСТКО)

1. **Никакой самодеятельности.** Весь код — только по плану.
2. **Гейт ACCEPTED:** Запрещено менять код, пока не получишь строку:
   `ACCEPTED: interagency/plans/YYYY-MM-DD_<slug>.md`.
3. **Plan-Only Mode:** До получения ACCEPTED ты имеешь право только писать планы в `interagency/plans/`.
4. **Multi-tenancy:** Всегда используй `companyId` для изоляции данных. **НИКОГДА** не бери `companyId` из входящего payload запроса.
5. **Service = IO / Orchestrator = Brain:** Не смешивай логику. Инфраструктура (БД/Redis) — только в сервисах.
6. **Язык:** Весь вывод — **СТРОГО НА РУССКОМ**. См. `memory-bank/LANGUAGE_POLICY.md`.

---

## 3. АЛГОРИТМ РАБОТЫ

1. Взять задачу из `interagency/prompts/`.
2. Составить план в `interagency/plans/`.
3. Вывести `WAITING_FOR_ACCEPTANCE: ...` и **ОСТАНОВИТЬСЯ**.
4. После ACCEPTED — реализовать задачу.
5. Собрать отчет в `interagency/reports/` и выполнить `REVIEW PACKET PROMPT`.
6. Выставить `READY_FOR_REVIEW` в `interagency/INDEX.md`.

---

## 4. ГДЕ НЕЛЬЗЯ ОШИБАТЬСЯ

- **Security Canon:** Проверяй соответствие `SECURITY_CANON.md`.
- **Audit:** Каждый вызов AI должен быть привязан к `traceId` и залогирован в `AuditService`.
- **Deterministic:** Астрономические/агрономические расчеты — только через детерминированные движки, а не через галлюцинации LLM.
