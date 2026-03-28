---
id: DOC-DOM-RAI-EP-TECHMAP-OPERATING-CORE-20260328
layer: Domain
type: Domain Spec
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-DOM-RAI-EP-TECHMAP-OPERATING-CORE-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md;apps/api/src/shared/tech-map;apps/api/src/modules/tech-map
---
# RAI_EP TECHMAP OPERATING CORE

## CLAIM
id: CLAIM-DOM-RAI-EP-TECHMAP-OPERATING-CORE-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Определение

Техкарта в `RAI_EP` — это не просто шаблон документа и не только агрономическая заметка.

Техкарта — это одновременно:
- проект урожая;
- операционная модель сезона;
- финансовая модель;
- цифровой контракт исполнения;
- контур explainability и контроля;
- точка координации ролей и событий.

## Что обязательно связано с техкартой

- культура, поле, сезон, хозяйство;
- гипотеза достижения результата;
- последовательность операций;
- сроки и условия исполнения;
- ресурсы;
- экономические параметры;
- риски и допущения;
- `review / approval / publication state`;
- фактическое исполнение;
- отклонения;
- рекомендации и корректировки;
- audit trail.

## Lifecycle техкарты

1. `Draft` — создание черновика, первичное заполнение и сбор исходных данных.
2. `Review` — проверка предметной логики, полноты, рисков, экономики и ограничений.
3. `Approval` — утверждение ответственными ролями.
4. `Publication` — перевод в активный контур исполнения.
5. `Execution` — связка с реальными событиями сезона, операциями, фактами и отклонениями.
6. `Revision` — корректировка по результатам исполнения, новых условий или выявленных рисков.
7. `Closure / Archive` — фиксация итогов цикла и подготовка базы для следующего сезона.

## Domain events

- `TechMapCreated`
- `TechMapReviewed`
- `TechMapApproved`
- `TechMapPublished`
- `SeasonExecutionStarted`
- `OperationPlanned`
- `OperationExecuted`
- `DeviationDetected`
- `RecommendationIssued`
- `RecommendationAccepted`
- `RecommendationRejected`
- `TechMapRevised`
- `TechMapClosed`

## Главные связи

### TechMap <-> Season Execution
Техкарта задаёт целевой сценарий, а execution показывает фактическую реальность.

### TechMap <-> Finance / Economy
Любое изменение значимых операций должно быть связано с влиянием на бюджет, затраты и ожидаемую рентабельность.

### TechMap <-> Risk
Отклонения и риски должны быть видимы не отдельно, а в контексте конкретной техкарты и сезона.

### TechMap <-> AI
AI не создаёт отдельную реальность, а работает на усиление review, analysis, recommendations и explainability вокруг техкарты.

## Что нельзя допускать

- техкарта существует отдельно от исполнения;
- экономический контур не связан с изменениями техкарты;
- рекомендации не привязаны к lifecycle и evidence;
- approval существует как формальная кнопка без управленческого смысла;
- revision происходит без фиксируемой причины и следа изменений.

## Критерий зрелости ядра

Ядро можно считать зрелым, когда по любой техкарте система показывает:
- исходный замысел;
- кто и что согласовал;
- что реально исполнялось;
- где возникли отклонения;
- какие рекомендации выдавались;
- какие решения были приняты;
- какой был эффект по срокам, затратам и результату.
