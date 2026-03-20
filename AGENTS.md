# AGENTS.md

## Session Note

После изменений в `AGENTS.md`, `AGENTS.override.md` или ключевых rule-документах нужно перезапускать чат.

Эффект: команда не будет ошибочно ожидать, что уже открытая сессия мгновенно перечитает новые правила.

Эти правила действуют для всего репозитория `RAI_EP`.

## Language Policy

Обязательно используй `memory-bank/LANGUAGE_POLICY.md` как blocking rule-source для всего текстового вывода.

Это означает:

- весь текстовый вывод должен быть на русском языке
- английский допускается только для технических обозначений, имён файлов, кода, API, CLI-команд и общепринятых технических аббревиатур
- перед отправкой ответа нужно проходить внутреннюю языковую самопроверку

Если текущий вывод нарушает `memory-bank/LANGUAGE_POLICY.md`, вывод считается недопустимым и должен быть исправлен до отправки.

## Memory Bank Rule

Все логические изменения проекта должны быть записаны в `memory-bank`.

Под логическими изменениями понимать:

- изменения архитектурных решений
- изменения правил и контрактов
- изменения поведения системы
- изменения workflow, governance и runtime-инвариантов
- изменения, которые влияют на то, как проект нужно дальше понимать, развивать или сопровождать

Не оставляй значимые логические изменения только в коде или только в чате. Фиксируй их в релевантных файлах `memory-bank`.

## Source of Truth

Используй строгий порядок доверия:

1. `code/tests/gates`
2. `generated manifests`
3. `docs`

Если код и документ расходятся, не усиливай документ. Исправляй документ или явно фиксируй drift.

## Docs Root Policy

В `docs/` root разрешены только:

- `README.md`
- `INDEX.md`
- `DOCS_MATRIX.md`
- `CONTRIBUTING_DOCS.md`

Любой новый документ должен создаваться в одном из слоёв:

- `docs/00_CORE/`
- `docs/01_ARCHITECTURE/`
- `docs/02_PRODUCT/`
- `docs/03_ENGINEERING/`
- `docs/04_AI_SYSTEM/`
- `docs/05_OPERATIONS/`
- `docs/06_ARCHIVE/`

`docs/06_ARCHIVE/` не является источником текущей истины.

## How To Create Docs

Перед созданием документа определи его роль:

- operational truth -> целевой слой `00_CORE` ... `05_OPERATIONS`
- dated analysis / legacy / research / prompt artifact -> `06_ARCHIVE`

Не создавай документ "по теме". Создавай его по роли в системе.

## Mandatory Frontmatter For CORE/SUPPORTING Docs

Для каждого нового markdown-документа класса `CORE` или `SUPPORTING` обязательны:

- `id`
- `layer`
- `type`
- `status`
- `version`
- `owners`
- `last_updated`
- `claim_id`
- `claim_status`
- `verified_by`
- `last_verified`
- `evidence_refs`

Сразу после заголовка обязателен блок:

```md
## CLAIM
id: CLAIM-...
status: asserted
verified_by: code|tests|manual
last_verified: YYYY-MM-DD
```

## Claim Registration

Каждый новый `claim_id` обязан быть зарегистрирован в `docs/DOCS_MATRIX.md`.

Документ без `claim_id` или claim без записи в `DOCS_MATRIX.md` считается незавершённым.

## Evidence Rules

`evidence_refs` должны указывать на реальные артефакты проверки:

- код
- тесты
- scripts / gates
- generated manifests

Не используй только другие документы как единственное доказательство для operational claims.

## Layer And Type Rules

Выбирай `layer` и `type` только из канонической матрицы:

- `docs/01_ARCHITECTURE/TOPOLOGY/LAYER_TYPE_MATRIX.md`

Важно:

- `docs/04_AI_SYSTEM/` сейчас проходит через линт как `layer: Engineering`
- не придумывай новые `layer` и `type` без изменения матрицы и линтера

## Freshness Rules

Соблюдай SLA:

- `CORE`: 30 дней
- `SUPPORTING`: 45 дней

Правило источника:

- `docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md`

## Required Verification

Любая работа с документацией считается завершённой только после:

```bash
pnpm lint:docs
```

Если изменялись claims или структура docs, дополнительно используй:

```bash
pnpm lint:docs:matrix:strict
```

## README Rule

Корневой `README.md` — это operational entrypoint репозитория.

Не превращай его в:

- стратегический манифест
- roadmap
- архив аудитов
- маркетинговый текст

Он должен отвечать только на четыре вопроса:

1. Что такое репозиторий сейчас.
2. Какие entrypoints и контуры реально активны.
3. Как его поднять и проверить.
4. Где лежит operational truth.
