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

Уточнение **чат vs документы репозитория**: раздел 10 в `memory-bank/LANGUAGE_POLICY.md`; при необходимости см. корневой `AGENTS.override.md`.

## Proposal Rule

При предложениях следующих шагов или развития работы действуют обязательные правила формулировки:

- запрещено использовать размытые конструкции вида `если хочешь`, `если хотите`, `могу`, `могу сделать`, когда они подменяют конкретное предложение действия
- любое предложение развития должно сразу содержать:
  - конкретное действие к выполнению
  - ожидаемый эффект этого действия
  - объяснение, зачем это действие делается и что оно улучшит для пользователя, продукта или кода
- предложение нужно формулировать как прямой следующий шаг, а не как абстрактную опцию
- если есть несколько допустимых путей, нужно перечислить их как конкретные действия с ожидаемым эффектом каждого пути, а не оставлять предложение расплывчатым

Цель правила:

- уменьшить расплывчатость коммуникации
- ускорить принятие решений
- всегда связывать следующий шаг с понятным полезным эффектом

## Autonomous Plan Execution

Если в репозитории существует `PLAN.md`, он считается источником истины для текущей задачи.

Политика исполнения:

- выполнять план от первой незавершённой milestone до полного завершения
- не останавливаться после промежуточных задач
- не спрашивать про `next steps`, пока текущий план остаётся исполнимым
- разрешать мелкие неоднозначности автономно, самым простым способом, совместимым с репозиторием
- после каждого значимого изменения выполнять релевантную проверку: build, tests, lint, typecheck или локальные checks
- если проверка падает, отлаживать и продолжать, пока milestone не начнёт работать
- вести `PLAN.md` как живой документ: отмечать прогресс, фиксировать решения и записывать blockers
- завершать работу только после полной реализации плана и прохождения acceptance checks

Условие остановки:

- останавливаться только при жёстком blocker, который нельзя разрешить из репозитория и доступных инструментов

В этом случае нужно вернуть blocker report со следующими пунктами:

1. выполненная работа
2. точный blocker
3. предпринятые попытки исправления
4. минимальный input, необходимый от пользователя

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
- `docs/00_STRATEGY/`
- `docs/01_ARCHITECTURE/`
- `docs/02_DOMAINS/`
- `docs/02_PRODUCT/`
- `docs/03_ENGINEERING/`
- `docs/04_AI_SYSTEM/`
- `docs/05_OPERATIONS/`
- `docs/06_METRICS/`
- `docs/07_EXECUTION/`
- `docs/08_TESTING/`
- `docs/10_FRONTEND_MENU_IMPLEMENTATION/`
- `docs/11_INSTRUCTIONS/`
- `docs/06_ARCHIVE/`

`docs/06_ARCHIVE/` не является источником текущей истины.

## Active Layer Model

Документация проекта состоит из трёх разных режимов знания.

- `verified operational canon` живёт прежде всего в `00_CORE`, `01_ARCHITECTURE`, `04_AI_SYSTEM`, `05_OPERATIONS` и в claim-managed документах других слоёв
- `active intent / design / planning` живёт в `00_STRATEGY`, `02_DOMAINS`, `02_PRODUCT`, `03_ENGINEERING`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS`
- `historical / raw context` живёт в `06_ARCHIVE`

Ключевое правило:

- не все активные документы обязаны быть зеркалом текущего кода
- стратегия, доменная логика, планы, execution-пакеты и frontend-карты являются действующими знаниями проекта
- только claim-managed документы и `code/tests/gates` можно цитировать как подтверждённую runtime truth

## Archive Recovery Rule

`docs/06_ARCHIVE/` не является мусором и не должен игнорироваться при поиске смысла системы.

Обязательное правило:

- если нужен текущий intent, сначала нужно читать активные слои `docs/00_STRATEGY/`, `docs/02_DOMAINS/`, `docs/07_EXECUTION/`, `docs/10_FRONTEND_MENU_IMPLEMENTATION/`, `docs/11_INSTRUCTIONS/`
- если в активных слоях не хватает контекста по бизнес-логике, intended behavior, исторической архитектурной мотивации, agent logic, consulting logic или product intent, нужно искать ответ в `docs/06_ARCHIVE/`
- внутри архива в первую очередь нужно проверять `docs/06_ARCHIVE/LEGACY_TREE_2026-03-20/`, `docs/06_ARCHIVE/ROOT_DROP_2026-03-20/`, `docs/06_ARCHIVE/LEGACY_TREE_2026-03-20/frontend-audit-2026-03-16/`

Жёсткое разграничение:

- архив обязателен для `historical context recovery`
- архив запрещено выдавать за `verified operational truth` без перепроверки по коду, тестам, гейтам или без переноса утверждения в активные canonical docs

Если ответ опирается на архив:

- явно помечай это как `историческая логика / legacy intent`
- отдельно указывай, подтверждено ли это текущим кодом

## How To Create Docs

Перед созданием документа определи его роль:

- foundation / cross-cutting canon -> `00_CORE`
- strategy / business logic / consulting model / future plan -> `00_STRATEGY`
- architecture / ADR / topology / invariants -> `01_ARCHITECTURE`
- domain semantics / domain models / guides -> `02_DOMAINS`
- product behavior / UX / bot scenarios -> `02_PRODUCT`
- engineering design / implementation contract / technical spec -> `03_ENGINEERING`
- AI runtime / agent platform / swarm governance -> `04_AI_SYSTEM`
- runbook / ops policy / operational risk -> `05_OPERATIONS`
- KPI / quality gates / success metrics -> `06_METRICS`
- execution plan / WBS / delivery checklist / rollout packet -> `07_EXECUTION`
- testing matrix / formal verification / audit -> `08_TESTING`
- frontend menu / screen map / frontend implementation package -> `10_FRONTEND_MENU_IMPLEMENTATION`
- действующая исполняемая инструкция / agent playbook / enablement standard -> `11_INSTRUCTIONS`
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

## Правило Плановых Claim-Документов

Не все `claim`-документы являются утверждением о текущем runtime.

- strategy / frontend / execution / instruction / business-документы могут быть `claim-managed`, если они являются каноническими точками входа, планами, governance-источниками или обязательными навигационными документами
- для таких документов `claim` утверждает роль документа в системе знаний проекта, а не факт полной реализации в коде
- в таких случаях используй `verified_by: manual`
- если из такого документа берётся тезис о текущем поведении системы, его всё равно нужно отдельно сверять по `code/tests/gates`

## Evidence Rules

`evidence_refs` должны указывать на реальные артефакты проверки:

- код
- тесты
- scripts / gates
- generated manifests

Не используй только другие документы как единственное доказательство для operational claims.

Для плановых и governance claims допускается evidence на:

- активные канонические документы
- navigation-индексы
- связанные кодовые директории

Но такие claims нельзя выдавать за подтверждённую runtime truth без отдельной проверки по `code/tests/gates`.

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
