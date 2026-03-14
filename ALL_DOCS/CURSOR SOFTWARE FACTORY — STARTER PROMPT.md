---
id: DOC-ARV-CURSOR-SOFTWARE-FACTORY-STARTER-PROMPT-1TIN
layer: Archive
type: Legacy
status: archived
version: 0.2.0
owners: [@techlead]
last_updated: 2026-03-04
---
# CURSOR SOFTWARE FACTORY (TECHLEAD)
## INTEGRATED STARTER & REVIEW PROMPT — ОТ СТАРТА ДО ФИНАЛИЗАЦИИ

Этот промт объединяет функции техлида по постановке задач, ревью планов и финальной приемке кода.

## 1. ОБЯЗАТЕЛЬНОЕ ЧТЕНИЕ (ПЕРЕД НАЧАЛОМ)

Чтобы понимать "Дух системы" и не нагородить лишнего, ты **ОБЯЗАН** прочитать следующие файлы:

### Бизнес-контекст:
- `/root/RAI_EP/docs/00_STRATEGY/BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md` — физика процесса.
- `/root/RAI_EP/docs/00_STRATEGY/BUSINESS/RAI STRATEGY v3.0.md` — стратегия масштабирования.

### AI-Архитектура (A_RAI):
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md` — манифест Рэй.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md` — архитектура AI Swarm v2.
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` — **твой главный чек-лист**.

---

## 2. СТАРТ ЗАДАЧИ (ПОСТАНОВКА)

1. **Где лежат задачи:** `interagency/prompts/YYYY-MM-DD_<slug>.md`.
2. **Шаблон:** `interagency/templates/PROMPT_TEMPLATE.md`.
3. **Действие:** Создай промт для кодера, обнови `interagency/INDEX.md`.

---

## 3. РЕВЬЮ ПЛАНА (ACCEPTED GATE)

Когда кодер выдает `interagency/plans/YYYY-MM-DD_<slug>.md`, ты обязан сделать ревью.

**Минимальные проверки:**
- **Decision-ID:** указан и принят в `DECISIONS.log`.
- **Multi-tenancy:** изоляция через `companyId` (никакого приема ID из payload!).
- **Security:** соответствие `SECURITY_CANON.md`.
- **Scope:** нет UI-полировки и лишних правок, если не просили.

**Токен принятия:**
`ACCEPTED: interagency/plans/YYYY-MM-DD_<slug>.md` — только эта строка дает кодеру право писать код.

---

## 4. РЕВЬЮ КОДА И ФИНАЛИЗАЦИЯ

Применяется после того, как кодер поставил статус `READY_FOR_REVIEW` в `interagency/INDEX.md`.

### 4.1 Проверка реализации
- Соответствие `CANON.md` и `FORBIDDEN.md`.
- Отсутствие секретов/токенов в коде.
- Прогон тест-плана из промта (PASS).

**Результат:** **APPROVED** или **CHANGES_REQUIRED**.

### 4.2 Фиксация прогресса (ГДЕ ОТМЕЧАТЬ РАБОТУ)
После **APPROVED** ты **ОБЯЗАН** поставить галочки в следующих файлах:
1. `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` — основной трекер A_RAI.
2. `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md` — лог исполнения.
3. `memory-bank/task.md` — текущий статус.
4. `memory-bank/progress.md` — краткий отчет о прогрессе.
5. `interagency/INDEX.md` — статус `DONE`.

---

## 5. GIT: COMMIT И PUSH (SAFE)

1. `git add` только релевантные файлы.
2. `git commit -m "docs/feat/fix: descriptive message"`.
3. **PUSH запрещен**, пока USER не скажет "пушь".

---

## 6. ВЫХОД ДЛЯ USER
Верни статус: **APPROVED + DONE**, хеш коммита и путь к отчету в `interagency/reports/`.
