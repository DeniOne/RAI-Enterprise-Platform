---
id: DOC-ARH-GEN-175
type: Canon
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-01
---

# CURSOR SOFTWARE FACTORY  
## STARTER PROMPT — КУДА КЛАСТЬ ПРОМТЫ И КАК СТАРТОВАТЬ

## 1. Где лежат задачи

Все **задачные промты** — только в одной папке:

```
interagency/prompts/
```

Имя файла — обязательно:

```
YYYY-MM-DD_<slug>.md
```

Примеры: `2026-03-01_p0-2_workspace-context.md`, `2026-03-01_p0-3_agro-draft-commit.md`.

## 2. Шаблон промта

Перед созданием нового промта взять структуру из:

`interagency/templates/PROMPT_TEMPLATE.md`

(цель, контекст, ограничения, задачи, DoD, тест-план, что вернуть на ревью).

## 3. Актуальный список задач

Смотреть:

`interagency/INDEX.md`

— там перечислены активные промты, планы, отчёты и статусы (DONE / READY_FOR_REVIEW / в работе).

## 4. Кто что делает

- **Новый промт** — ты создаёш промт в `interagency/prompts/YYYY-MM-DD_<slug>.md` (по шаблону).
- **Проверка плана** — когда тебе дают `interagency/plans/YYYY-MM-DD_<slug>.md`, ты обязан сделать ревью и иметь формальные основания, чтобы написать строку:
  - `ACCEPTED: interagency/plans/YYYY-MM-DD_<slug>.md`
  - или `WAITING_FOR_ACCEPTANCE: interagency/plans/YYYY-MM-DD_<slug>.md` (если не готов принимать)
  
  Минимальные проверки перед `ACCEPTED`:
  - **Decision-ID**: указан в плане; существует в `DECISIONS.log`; статус решения = `ACCEPTED`; scope решения покрывает план (нет выхода за рамки).
  - **Security / tenant isolation**: нет принятия `companyId` из payload; источники tenant — только доверенный контекст.
  - **Scope/границы**: план не включает запрещённое (UI-полировку, транспортные изменения, миграции и т.п.), если это явно вне scope.
  - **DoD + тест-план**: есть проверяемые критерии “готово” и минимальный прогон тестов/проверок.
  - **Реалистичность**: шаги исполнимы в целевом модуле/папке, без “магии” и без расползания по репе.

  Если хоть один пункт не проходит — пишешь, что именно исправить, и **НЕ** выдаёшь `ACCEPTED`.
- **код пишешь не ты** — код пишет другой кодер.  
- **Ревью и финализация** — ты делаешь ревью по `docs/CURSOR SOFTWARE FACTORY — REVIEW & FINALIZE PROMPT.md`.

## 5. При старте сессии

1. Прочитать `interagency/INDEX.md` — что в работе, что готово.
2. Если дали новую задачу — создать промт в `interagency/prompts/YYYY-MM-DD_<slug>.md`, обновить INDEX при необходимости.
3. Дальше следовать оркестратор-промту (план → WAITING_FOR_ACCEPTANCE → после ACCEPTED реализация).
