---
id: DOC-STR-RAI-EP-EXECUTION-ROADMAP-20260328
layer: Strategy
type: Roadmap
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-STR-RAI-EP-EXECUTION-ROADMAP-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md
---
# RAI_EP EXECUTION ROADMAP

## CLAIM
id: CLAIM-STR-RAI-EP-EXECUTION-ROADMAP-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Горизонт

`30 / 60 / 90 / 180` дней.

Назначение roadmap: перевести blueprint в последовательность работ с измеримыми выходами.

## Фаза 0. Канонизация замысла (`0-14` дней)

### Цель
Убрать разрозненность и закрепить единый управляющий контур документации.

### Результат
- утверждён `RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
- создан минимальный пакет канонических документов
- для команды зафиксирован порядок чтения и source-of-truth policy

### Выходной критерий
Новые архитектурные решения и проектные задачи начинают ссылаться на канонические документы, а не на чатовые формулировки.

## Фаза 1. TechMap Operating Core (`до 30 дней`)

### Цель
Сделать техкарту реальным центром orchestration.

### Что сделать
- зафиксировать lifecycle техкарты end-to-end
- описать critical workflows: create, review, approve, publish, execute, revise
- связать техкарту с season execution, deviations и economics
- определить обязательные статусы и системные события

### Выходной критерий
Есть единая доменная модель, по которой можно проверить, как продукт должен работать в ядре.

## Фаза 2. Governed AI Runtime (`до 60 дней`)

### Цель
Замкнуть AI-контур вокруг управляемых правил.

### Что сделать
- ввести universal tool-permission matrix
- ввести universal HITL matrix
- formalize evidence thresholds и uncertainty policy
- собрать release AI safety eval suite
- определить agent scorecards и incident review cadence

### Выходной критерий
AI-контур управляется правилами выпуска и перестаёт быть неформальным источником риска.

## Фаза 3. Enterprise Release Discipline (`до 90 дней`)

### Цель
Перевести сильную разработку в управляемый rollout contour.

### Что сделать
- закрыть top dependency/AppSec debt
- провести backup/restore drill с evidence
- оформить install/upgrade packet
- закрыть critical external legal evidence
- зафиксировать access review и branch protection baseline
- связать release с security, legal и ops criteria

### Выходной критерий
Появляется честный, повторяемый release packet для pilot и controlled rollout.

## Фаза 4. Масштабирование платформы (`до 180 дней`)

### Цель
Расширять роли, каналы и модули без потери управляемости.

### Что сделать
- расширить control tower и executive analytics
- вводить новые агентные роли только через policy framework
- расширять CRM/front-office как надстройку над ядром
- закрепить шаблон запуска новых доменных контуров

### Выходной критерий
Система масштабируется через шаблоны и контракты, а не через ad hoc-реализацию.

## Очередность по критичности

### Сначала
1. Канонические документы.
2. TechMap lifecycle.
3. Policy map для AI и high-impact flows.

### Затем
4. Release discipline.
5. Legal, AppSec, backup и installability closeout.

### Потом
6. Масштабирование ролей, витрин, новых агентов и growth-фич.

## Что считать провалом roadmap

- новые модули появляются раньше, чем стабилизировано ядро;
- AI растёт быстрее, чем policy и release controls;
- документация снова становится архивом без канонического центра;
- UI и интеграции начинают диктовать архитектуру сверху вниз;
- команда не может ответить, какой документ является истиной по тому или иному вопросу.
