# RAI_EP — Карта канонических документов

**Назначение:** зафиксировать, какой документ за что отвечает и куда его класть в существующей структуре `docs/`.

---

## 1. Главный принцип

Документная система должна работать по правилу:

- `code / tests / gates` = фактическая истина исполнения;
- `generated artifacts` = измеримая истина состояния и readiness;
- `canonical docs` = замысел, контракты, политики, архитектурные правила и roadmap;
- `docs/_audit` = датированные исследовательские и доказательные срезы, но не основной operational truth.

То есть аудит не исчезает, но перестаёт быть единственным местом, где собрана логика системы.

---

## 2. Что куда класть

### `docs/00_CORE`

Здесь лежат документы, которые объясняют саму систему документов и базовые правила чтения.

Класть сюда:

1. `RAI_EP_DOCUMENT_SYSTEM_MAP.md` — карта канонических документов.
2. `README.md` / `INDEX.md` — краткий вход в документацию.
3. Правило source of truth и порядок чтения.

### `docs/00_STRATEGY`

Здесь лежат документы уровня north star и генерального плана.

Класть сюда:

1. `RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
2. `RAI_EP_TARGET_OPERATING_MODEL.md`
3. `RAI_EP_EXECUTION_ROADMAP.md`

### `docs/01_ARCHITECTURE`

Здесь лежит целевая карта системы и архитектурные границы.

Класть сюда:

1. `RAI_EP_TARGET_ARCHITECTURE_MAP.md`
2. runtime boundaries
3. integration boundaries
4. deployment topology overview

### `docs/02_DOMAINS`

Здесь лежат документы предметного ядра.

Класть сюда:

1. `RAI_EP_TECHMAP_OPERATING_CORE.md`
2. затем отдельные domain docs по season execution, finance/economy, CRM/front-office, legal events, knowledge.

### `docs/04_AI_SYSTEM`

Здесь лежат документы по governed AI runtime.

Класть сюда:

1. `RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
2. дальше — eval suites, routing policies, incident model, truthfulness policies.

### `docs/05_OPERATIONS`

Здесь лежат release, compliance, deployment и operational readiness документы.

Класть сюда:

1. `RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`
2. privacy / legal / transborder / backup / DR / installability runbooks
3. access review / support boundary / release approval docs

### `docs/_audit`

Сюда остаются датированные audit snapshots.

Класть сюда:

- executive brief
- due diligence
- evidence matrix
- privacy/data-flow map
- RF compliance review
- AI failure scenarios
- delta vs baseline
- runtime map

Важно: эти документы используются как evidence base, но не заменяют канонические стратегии и политики.

---

## 3. Минимальный обязательный комплект верхнего уровня

Чтобы система перестала быть разрозненной, минимально должны существовать и поддерживаться 7 документов:

1. `00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
2. `00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
3. `00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md`
4. `01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
5. `02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
6. `04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
7. `05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`

---

## 4. Порядок чтения для нового участника команды

1. `00_CORE/RAI_EP_DOCUMENT_SYSTEM_MAP.md`
2. `00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
3. `00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
4. `01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
5. `02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
6. `04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
7. `05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`
8. `00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md`
9. потом уже `docs/_audit/*` как доказательная база и текущий snapshot состояния

---

## 5. Практическое правило обновления

- Изменился стратегический замысел — обновлять `00_STRATEGY`.
- Изменились системные границы — обновлять `01_ARCHITECTURE`.
- Изменился доменный lifecycle — обновлять `02_DOMAINS`.
- Изменились AI policies — обновлять `04_AI_SYSTEM`.
- Изменились release/compliance правила — обновлять `05_OPERATIONS`.
- Появился новый проверочный snapshot — добавлять его в `docs/_audit`.

---

## 6. Эффект от такой раскладки

- стратегия перестаёт жить в голове и чатах;
- архитектура отвязывается от случайных локальных решений;
- аудит становится доказательством, а не заменой генерального плана;
- новые участники быстрее понимают, что является ядром системы;
- roadmap начинает опираться на канонические документы, а не на разрозненные обсуждения.
