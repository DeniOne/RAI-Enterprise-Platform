---
id: DOC-ARH-GEN-176
type: Canon
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-01
---

# CURSOR SOFTWARE FACTORY  
## REVIEW & FINALIZE PROMPT (CANONICAL) — РЕВЬЮ → ОТМЕТКИ → COMMIT/PUSH

## 0. СТАТУС
Этот промт применяется **после** того, как Antigravity выполнил “REVIEW PACKET PROMPT” и подготовил:
- отчёт `interagency/reports/YYYY-MM-DD_<slug>.md`
- `git status` / `git diff` / логи прогонов
- статус в `interagency/INDEX.md` = `READY_FOR_REVIEW`

---

## 1. РЕВЬЮ (BLOCKING)
1) Проверить соответствие:
   - `docs/01_ARCHITECTURE/PRINCIPLES/CANON.md`
   - `docs/01_ARCHITECTURE/PRINCIPLES/FORBIDDEN.md`
   - `docs/01_ARCHITECTURE/PRINCIPLES/SECURITY_CANON.md`
2) Проверить дифф:
   - нет секретов/токенов/паролей
   - нет `companyId` из payload (tenant только из доверенного контекста)
   - нет моков, ставших источником истины вместо backend
3) Проверить прогоны:
   - тест-план из промта выполнен
   - если что-то не прогнано — это фиксируется в отчёте как “не проверено” и задача не финализируется

Результат ревью: **APPROVED** или **CHANGES_REQUIRED** (с конкретным списком правок).

Если **CHANGES_REQUIRED** → стоп, вернуть в Antigravity на доработку.

---

## 2. ФИНАЛИЗАЦИЯ (РАЗРЕШЕНО ТОЛЬКО ПРИ APPROVED)

### 2.1 Отметки в interagency
- Обновить `interagency/reports/YYYY-MM-DD_<slug>.md`:
  - добавить блок “Ревью: APPROVED” + короткие замечания (если были)
  - заменить “manual check не зафиксирован” на PASS/FAIL (если применимо)
- Обновить `interagency/INDEX.md`:
  - статус: `DONE`
  - 1 строка результата

### 2.2 Обновление чеклистов (главные + по задаче)
Обязательные:
- `docs/07_EXECUTION/FULL_PROJECT_WBS.md`
- `docs/07_EXECUTION/TECHNICAL_DEVELOPMENT_PLAN.md`
- `memory-bank/task.md` (если задача трекается там)

Правило:
- “код реально сделан и проверен” → ставим галочку
- “не сделан/не проверен” → НЕ ставим, а фиксируем причину в отчёте

### 2.3 Memory-bank (минимум один файл)
Обновить минимум один:
- `memory-bank/progress.md` и/или `memory-bank/activeContext.md` и/или `memory-bank/techContext.md`

Требование: коротко и фактами — что изменилось, где лежит, как проверить, какой следующий шаг.

---

## 3. GIT: COMMIT И PUSH (SAFE)
### 3.1 Commit (разрешено при APPROVED)
- `git status` → проверить ожидаемость изменений
- `git diff` → ещё раз проверить на секреты/мусор
- `git add ...` → только релевантные файлы
- `git commit` → короткое сообщение “зачем”, без воды

### 3.2 Push (только по явной команде USER)
По умолчанию push **запрещён**.
Разрешение на push даёт только USER явной фразой: “пушь”.

Запрещено:
- force push
- отключение хуков
- коммит `.env`/секретов

---

## 4. ВЫХОД ДЛЯ USER
Вернуть USER:
- статус: APPROVED + DONE
- хеш коммита
- путь к отчёту: `interagency/reports/...`
- что дальше (1–3 шага)

