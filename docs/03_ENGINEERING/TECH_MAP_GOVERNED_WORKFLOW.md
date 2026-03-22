---
id: DOC-ENG-TECH-MAP-GOVERNED-WORKFLOW-20260322
layer: Engineering
type: Service Spec
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-22
claim_id: CLAIM-ENG-TECH-MAP-GOVERNED-WORKFLOW-20260322
claim_status: asserted
verified_by: manual
last_verified: 2026-03-22
evidence_refs: docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md;docs/00_STRATEGY/BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md;docs/00_STRATEGY/CONSULTING/CONSULTING CORE — Каноническая модель консалтинга RAI_EP.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md;apps/api/src/shared/rai-chat/semantic-ingress.types.ts;apps/api/src/modules/rai-chat/semantic-ingress.service.ts;apps/api/src/shared/rai-chat/semantic-routing.types.ts;apps/api/src/shared/rai-chat/branch-trust.types.ts;apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts;apps/api/src/modules/tech-map/tech-map.service.ts;apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts;packages/prisma-client/schema.prisma
---
# TECH_MAP_GOVERNED_WORKFLOW

## CLAIM
id: CLAIM-ENG-TECH-MAP-GOVERNED-WORKFLOW-20260322
status: asserted
verified_by: manual
last_verified: 2026-03-22

Этот документ является канонической инженерной спецификацией для целевого governed workflow Техкарты в `RAI_EP`.

Он утверждает роль документа как основы для:

- `runtime`-архитектуры
- backend-имплементации
- policy/governance
- оркестрации агентов
- explainability/truthfulness-контуров
- дальнейшей декомпозиции в bounded implementation-пакеты

Документ не утверждает, что весь описанный workflow уже полностью реализован в runtime.
Любые тезисы о текущем поведении системы должны отдельно сверяться по `code/tests/gates`.

## 0. Исполнительный вывод

Техкарта в `RAI_EP` должна проектироваться не как ответ `LLM`, а как governed composite workflow первого класса.

Канонический путь:

```text
свободный пользовательский запрос
  -> semantic ingress normalization
  -> governed context intake
  -> missing context triage
  -> lead owner selection
  -> branch execution по typed JSON contracts
  -> branch trust gate
  -> honest composition
  -> draft / review / approval / publication boundary
  -> audit + forensics
```

Ключевое решение этого документа:

- бизнес-owner workflow Техкарты = `agronomist`
- orchestration-owner = `SupervisorAgent`
- межветочный обмен = только typed `JSON`, не prose
- финальная Техкарта собирается только из веток, прошедших trust-gate
- при нехватке критичного контекста система обязана делать `clarify`, а не импутацию
- статус `готовой техкарты` запрещён при unresolved blocking gaps
- `LLM` используется для semantic normalization, synthesis и explainability, но не как источник фактов, расчётов и нормативных оснований

## 1. Назначение и границы

Документ покрывает:

- создание новой Техкарты с нуля
- пересборку Техкарты по существующему полю/сезону
- multi-variant сравнение вариантов Техкарты
- governed draft assembly
- trust/evidence verification
- human review / approval / publication boundary
- explainability и audit trail

Документ не покрывает полностью:

- post-publication `change order` lifecycle
- детальную модель полевого исполнения задач
- юридическую механику `digital signature`
- low-level UI layout

Но документ задаёт обязательные handoff-границы к этим контурам.

## 2. Бизнес-смысл Техкарты

В `RAI_EP` Техкарта является одновременно:

- проектом урожая
- операционной моделью сезона
- финансовой моделью
- цифровым контрактом
- юридически значимым артефактом
- зафиксированной гипотезой достижения урожайности
- вычисленным результатом методологии на базе контекста, данных, ограничений и сценариев

Следствие:

- Техкарта не является просто текстом
- Техкарта не является шаблоном “на культуру вообще”
- Техкарта не может считаться достоверной без provenance, evidence и disclosure
- Техкарта не может становиться `ACTIVE` без governed approval

## 3. Почему workflow Техкарты должен быть governed

Техкарта требует governed runtime по пяти причинам:

1. Высокая цена ошибки.
   Неверная норма, ложное основание или скрытая дырка в контексте бьют по урожаю, экономике и доверию.

2. Многодоменная природа.
   В одном артефакте сходятся агрономия, экономика, техника, compliance, история поля, прогноз и контрактные ограничения.

3. Юридическая и финансовая значимость.
   Артефакт влияет не только на рекомендации, но и на обязательства, KPI, review и будущую монетизацию результата.

4. Наличие переменной полноты контекста.
   Пользовательский вход всегда свободный и часто неполный, поэтому система обязана отделять факты от пробелов.

5. Необходимость честного explainability.
   Пользователь должен видеть, из чего собрана Техкарта, что было рассчитано, что предположено и почему результат ещё может быть только `draft`.

## 4. Цели workflow

Workflow Техкарты должен обеспечивать:

- свободный `ingress` без командного синтаксиса
- строгую нормализацию в structured semantic frame
- owner-led orchestration вместо хаотического multi-agent fan-out
- typed branch execution с детерминированными расчётами там, где это возможно
- trust-verdict до финальной композиции
- различение `fact / derived metric / assumption / recommendation / gap`
- понятную publication boundary
- полный audit trail для forensics

## 5. Базовые принципы проектирования

1. `LLM is not source of truth`.
2. Контекст первичен, Техкарта вторична.
3. Нет blocking context -> нет ложной “готовой техкарты”.
4. Нет branch trust verdict -> нет фактической композиции.
5. Нет typed contract -> нет межагентного handoff.
6. Нет disclosure -> нет честного partial-result.
7. `SupervisorAgent` оркестрирует, но не забирает бизнес-ownership.
8. Один workflow должен иметь одного `lead business owner`.
9. Все write/publication переходы проходят policy/governance gate.
10. Workflow status и persisted `TechMapStatus` должны быть разведены.

## 6. Подтверждённая runtime-база и целевое расширение

| Контур | Что уже подтверждено кодом | Что вводит этот документ |
|---|---|---|
| `semantic ingress` | Есть `SemanticIngressFrame`, `SemanticIngressService`, `semantic_router_primary/shadow` | Специализированное tech-map расширение frame и readiness-модель Техкарты |
| branch trust | Есть `BranchResultContract`, `BranchTrustAssessment`, `BranchVerdict`, honest composition в `ResponseComposer` | Отраслевой trust-контур именно для branch-веток Техкарты и workflow verdict `BLOCKED` |
| governance | Есть `RuntimeGovernancePolicyService` с trust budgets и fallback policy | Publication/approval matrix именно для Техкарты |
| tech-map persistence | Есть `TechMapService`, `TechMapStatus`, `TechMapStateMachine`, draft/review/approved/active lifecycle | First-class governed workflow поверх текущего persistence-контура |
| текущий tool-surface | Есть `GenerateTechMapDraft`, но это узкий draft-path | Полноценный governed composite workflow с intake, clarify, branching, trust, compare, review |

Жёсткое разграничение:

- текущий `runtime truth` по техкарте доказывается кодом
- этот документ задаёт целевую инженерную модель
- новый workflow не должен противоречить текущему `TechMapStatus` и current branch-trust enum

## 7. Точки входа и пользовательские intents

| Интент пользователя | Пример запроса | Целевой workflow mode | Lead owner | Базовый выход |
|---|---|---|---|---|
| `create_new` | `собери техкарту по рапсу на поле 12` | `new_draft` | `agronomist` | clarify или governed draft |
| `rebuild_existing` | `пересобери техкарту по полю 12 на сезон 2026` | `rebuild` | `agronomist` | reuse context + new draft version |
| `compare_variants` | `сравни две техкарты: экономную и интенсивную` | `comparison` | `agronomist` | diff report + scenario matrix |
| `review_draft` | `покажи почему эта техкарта draft only` | `review_explain` | `agronomist` | explainability + missing approvals |
| `approve_publish` | `отправь техкарту на согласование` | `review_submission` | `agronomist` + governance | review packet |
| `resume_clarify` | `добавляю анализ почвы и бюджет` | `clarification_resume` | текущий owner | продолжение workflow |
| `explain_block` | `почему система не выпустила техкарту` | `blocked_analysis` | `agronomist` | gap/conflict disclosure |

## 8. Semantic ingress frame для Техкарты

Базовый `SemanticIngressFrame` уже существует в runtime.
Для Техкарты поверх него вводится tech-map specialization.

```ts
type TechMapWorkflowIntent =
  | "create_new"
  | "rebuild_existing"
  | "compare_variants"
  | "review_draft"
  | "approve_publish"
  | "resume_clarify"
  | "explain_block";

type TechMapWorkflowStageHint =
  | "intake"
  | "clarify"
  | "assemble"
  | "compare"
  | "review"
  | "approval"
  | "publication";

type TechMapRequestedArtifact =
  | "workflow_draft"
  | "persisted_draft"
  | "comparison_report"
  | "review_packet"
  | "publication_packet"
  | "block_explanation";

type TechMapContextReadiness =
  | "S0_UNSCOPED"
  | "S1_SCOPED"
  | "S2_MINIMUM_COMPUTABLE"
  | "S3_DRAFT_READY"
  | "S4_REVIEW_READY"
  | "S5_PUBLISHABLE";

interface TechMapSemanticFrame {
  workflow_kind: "tech_map";
  user_intent: TechMapWorkflowIntent;
  workflow_stage_hint: TechMapWorkflowStageHint;
  requested_artifact: TechMapRequestedArtifact;
  scope: {
    legal_entity_id?: string;
    farm_id?: string;
    field_ids: string[];
    season_id?: string;
    crop_code?: string;
    existing_tech_map_id?: string;
  };
  context_readiness: TechMapContextReadiness;
  required_actions: Array<"clarify" | "execute" | "confirm" | "human_review" | "block">;
  policy_constraints: string[];
  result_constraints: string[];
  comparison_mode?: {
    enabled: boolean;
    variant_count: number;
  };
}
```

Обязательные смысловые поля frame:

- `user_intent`
- `scope`
- `context_readiness`
- `requested_artifact`
- `required_actions`
- `policy_constraints`

Нормативные правила:

- `scope.field_ids` и `scope.season_id` не должны угадываться без evidence
- `requested_artifact` должен отделять `workflow_draft` от `publication_packet`
- `context_readiness` должен вычисляться детерминированно по slot-registry
- `required_actions` не должны определяться prose-моделью без policy layer

## 9. Required context model

### 9.1 Канонические группы контекста

Контекст Техкарты делится на семь групп:

1. `identity_scope`
2. `agronomic_basis`
3. `resource_feasibility`
4. `economic_basis`
5. `external_basis`
6. `history_and_evidence`
7. `methodology_and_governance`

### 9.2 Slot matrix

| Группа | Slot key | Критичность | Требуется на стадии | Допустимая замена | Freshness / special rule |
|---|---|---|---|---|---|
| `identity_scope` | `legal_entity_id` | `REQUIRED_BLOCKING` | `S1+` | нет | обязателен для persist/review/publication |
| `identity_scope` | `farm_id` | `REQUIRED_BLOCKING` | `S1+` | допустимо derive из `field_id` | нельзя публиковать без resolved owner scope |
| `identity_scope` | `field_ids[]` | `REQUIRED_BLOCKING` | `S1+` | нет | multi-field допускается только при explicit workflow mode |
| `identity_scope` | `season_id` | `REQUIRED_BLOCKING` | `S1+` | нет | must match field/company scope |
| `identity_scope` | `crop_code` | `REQUIRED_BLOCKING` | `S1+` | нет | must match plan/context |
| `agronomic_basis` | `predecessor_crop` | `REQUIRED_BLOCKING` | `S2+` | нет | отсутствие блокирует agronomic branch |
| `agronomic_basis` | `soil_profile` | `REQUIRED_BLOCKING` | `S2+` | только verified latest valid profile | stale profile не может стать `VERIFIED` |
| `agronomic_basis` | `target_yield_profile` | `REQUIRED_BLOCKING` | `S2+` | linked harvest plan или scenario set | является hypothesis, не fact |
| `agronomic_basis` | `field_history` | `REQUIRED_REVIEW` | `S3+` | historical snapshot | при rebuild желательно обязательно |
| `agronomic_basis` | `seed_or_hybrid` | `OPTIONAL_ENRICHING` | `S2+` | допустим variant alternative | exact publishable map требует resolved choice |
| `resource_feasibility` | `machinery_profile` | `REQUIRED_REVIEW` | `S3+` | verified contractor capacity | без этого execution feasibility не выше `PARTIAL` |
| `resource_feasibility` | `labor_or_contractor_profile` | `OPTIONAL_ENRICHING` | `S3+` | org default profile | default требует disclosure |
| `resource_feasibility` | `input_availability` | `REQUIRED_REVIEW` | `S3+` | warehouse snapshot / procurement status | publication без availability запрещена для critical inputs |
| `economic_basis` | `budget_policy` | `REQUIRED_BLOCKING` | `S2+` | performance plan / budget cap | finance branch без этого не публикуется |
| `economic_basis` | `price_book_version` | `REQUIRED_REVIEW` | `S3+` | company price snapshot | stale prices дают `PARTIAL` или `BLOCKED` |
| `economic_basis` | `currency_tax_mode` | `REQUIRED_REVIEW` | `S3+` | company accounting profile | must be fixed before approval |
| `external_basis` | `weather_normals` | `DERIVED` | `S2+` | trusted integration | derive автоматически, но с evidence ref |
| `external_basis` | `forecast_window` | `OPTIONAL_ENRICHING` | `S3+` | weather provider | forecast не может быть единственным основанием publication |
| `external_basis` | `irrigation_or_water_constraints` | `REQUIRED_REVIEW` | `S3+` | farm constraint profile | для соответствующих культур может стать blocking |
| `history_and_evidence` | `previous_tech_map` | `OPTIONAL_ENRICHING` | `S2+` | prior version | при `rebuild_existing` становится required |
| `history_and_evidence` | `execution_history` | `OPTIONAL_ENRICHING` | `S3+` | fact history snapshot | compare/rebuild без этого теряет trust depth |
| `history_and_evidence` | `past_outcomes` | `OPTIONAL_ENRICHING` | `S3+` | harvest result | используется для yield hypothesis calibration |
| `methodology_and_governance` | `methodology_profile_id` | `REQUIRED_BLOCKING` | `S2+` | default approved profile | must be versioned |
| `methodology_and_governance` | `allowed_input_catalog_version` | `REQUIRED_REVIEW` | `S3+` | company-approved catalog | publication без version lock запрещена |
| `methodology_and_governance` | `contract_mode` | `REQUIRED_REVIEW` | `S4+` | consulting default | влияет на approval chain |
| `methodology_and_governance` | `target_kpi_policy` | `REQUIRED_REVIEW` | `S4+` | linked performance model | must be disclosed in review packet |

### 9.3 Уровни readiness

| Уровень | Что означает | Что можно делать | Что запрещено |
|---|---|---|---|
| `S0_UNSCOPED` | не определён объект Техкарты | только intake и scope-clarify | branch execution |
| `S1_SCOPED` | определены поле/сезон/культура/owner scope | governed context collection | draft assembly |
| `S2_MINIMUM_COMPUTABLE` | есть минимум для агрономического и экономического расчёта | branch execution и workflow draft | review/publication |
| `S3_DRAFT_READY` | есть достаточный контекст для versioned `DRAFT` | persist draft, compare variants, explainability | approval/publication |
| `S4_REVIEW_READY` | закрыты review-critical slots и нет blocking conflicts | submit to review | publication without human review |
| `S5_PUBLISHABLE` | approval-critical контур закрыт, approvals complete | publication / activation handoff | auto-publish bypass |

Норматив:

- `S2` минимален для запуска branch execution
- `S3` минимален для persisted `DRAFT`
- `S4` минимален для review packet
- `S5` минимален для publication packet

## 10. Missing context / clarify model

### 10.1 Классы missing slots

```ts
type TechMapMissingSlotSeverity =
  | "REQUIRED_BLOCKING"
  | "REQUIRED_REVIEW"
  | "OPTIONAL_ENRICHING"
  | "ASSUMPTION_ALLOWED"
  | "DERIVED";
```

Правила по классам:

- `REQUIRED_BLOCKING`
  - не может быть выдуман
  - блокирует branch execution или composition
  - всегда уходит в `clarify` или `block`

- `REQUIRED_REVIEW`
  - допускает draft, но не publication
  - обязан быть раскрыт в disclosure

- `OPTIONAL_ENRICHING`
  - не блокирует draft
  - влияет на quality/trust score

- `ASSUMPTION_ALLOWED`
  - может быть временно закрыт только формализованным assumption object
  - assumption не имеет права превращаться в `fact`

- `DERIVED`
  - строится системой детерминированно или через trusted integration
  - должен нести `derived_from` и `evidence_refs`

### 10.2 Assumption policy

| Assumption kind | Описание | Допустимо в `DRAFT` | Допустимо в `REVIEW` | Допустимо в `PUBLICATION` |
|---|---|---|---|---|
| `USER_DECLARED` | пользователь прямо сообщил ограничение или выбор | да | да, с disclosure | да, если подтверждено ответственным лицом |
| `METHOD_DEFAULT` | approved methodology default | да | да, с versioned reference | да, если политика допускает default |
| `MODEL_ESTIMATE` | оценка модели или эвристики | да, только как hypothesis | только как advisory | нет |
| `TEMP_PLACEHOLDER` | временное заполнение для продолжения intake | да, только до `S2` | нет | нет |

### 10.3 Clarify contract

```ts
interface TechMapClarifyItem {
  slot_key: string;
  label: string;
  severity: TechMapMissingSlotSeverity;
  reason: string;
  blocks_phases: Array<"branch_execution" | "composition" | "publication">;
  acceptable_sources: string[];
  can_be_assumed: boolean;
  assumption_kind?: "USER_DECLARED" | "METHOD_DEFAULT";
}
```

Clarify-пакет обязан содержать четыре секции:

- `missing_blocking_slots`
- `missing_review_slots`
- `assumptions_proposed`
- `derived_placeholders_used`

Система не должна:

- смешивать blocking и optional gaps в одном бесформенном сообщении
- задавать пользователю вопрос “на всякий случай”, если slot уже может быть безопасно поднят из record/integration
- закрывать conflict красивым текстом без explicit choice

## 11. Lead owner и participating agents

### 11.1 Роли

| Роль | Статус в workflow | Ответственность |
|---|---|---|
| `SupervisorAgent` | orchestration-owner | semantic ingress, policy, branch graph, trust gate, audit |
| `agronomist` | lead business owner | agronomic intent ownership, draft semantics, final owner answer |
| `crm_agent` | context contributor | юрлицо, хозяйство, поле, сезон, registry context |
| `knowledge` | evidence owner | methodology lookup, reference grounding, evidence bundle |
| `economist` | advisory owner | cost model, budget fit, scenario economics |
| `monitoring` | signal owner | weather, climate, risk signals, forecast enrichments |
| `contracts_agent` | publication/compliance contributor | contract mode, approval implications, publication restrictions |
| human reviewers | approval authority | review, approval, publication decision |

### 11.2 Норматив выбора lead owner

Для Техкарты `lead business owner` фиксируется жёстко:

- `agronomist` для create/rebuild/compare/review/explain
- `SupervisorAgent` не подменяет бизнес-owner
- `economist`, `knowledge`, `monitoring`, `contracts_agent` не могут перехватить ownership у Техкарты

Будущее расширение:

- отдельный `chief_agronomist` может появиться как review-owner
- до появления canonical runtime family он не должен использоваться как обязательный production owner

### 11.3 Parallel / sequential / blocking orchestration

| Блок | Тип | Примечание |
|---|---|---|
| intake from CRM/registry/history | `parallel` | безопасный read-only сбор контекста |
| missing slot triage | `blocking` | must run before branch execution |
| agronomic / soil-input / compliance / evidence branches | `parallel` | стартуют после `S2` |
| finance branch | `dependent` | зависит от agronomic + price/budget basis |
| risk/scenario branch | `dependent` | зависит от agronomic branch и external basis |
| execution feasibility branch | `dependent` | зависит от operation graph и machinery profile |
| composition | `blocking` | только после trust verdict |
| review/publication | `blocking` | только после governance gate |

## 12. Фазы workflow

| Фаза | Вход | Выход | Авто/confirm/human boundary |
|---|---|---|---|
| `INTAKE` | user request | raw request + workflow candidate | auto |
| `SEMANTIC_NORMALIZATION` | message + workspace + history | `TechMapSemanticFrame` | auto |
| `CONTEXT_ASSEMBLY` | frame | structured context snapshot | auto |
| `MISSING_CONTEXT_TRIAGE` | context snapshot | clarify packet или `S2+ readiness` | auto |
| `OWNER_HANDOFF` | normalized frame | owner-led branch plan | auto |
| `BRANCH_EXECUTION` | context + branch graph | typed branch results | auto |
| `TRUST_GATE` | branch results | branch assessments + workflow verdict | auto |
| `COMPOSITION` | trusted branches | governed draft / compare / block explanation | auto |
| `PERSIST_DRAFT` | `S3+` draft | versioned `DRAFT` | explicit command auto, otherwise confirm |
| `REVIEW_SUBMISSION` | `S4` review packet | persisted review request | human action |
| `APPROVAL` | review packet | approved or rejected decision | human approval |
| `PUBLICATION` | `S5` + approvals | publication packet / `ACTIVE` handoff | human approval only |

## 13. Branch architecture

| Branch | Назначение | Основные входы | Основные выходы | Publication critical |
|---|---|---|---|---|
| `context_intake_branch` | собрать и нормализовать весь входной контур | CRM, field registry, season, prior data | unified context snapshot | да |
| `agronomic_branch` | построить agronomic core и operation graph | crop, predecessor, target yield, field context | operations, stage windows, yield hypothesis | да |
| `soil_input_branch` | рассчитать soil/input basis | soil profile, nutrient history, catalog | dose basis, deficiencies, input requirements | да |
| `finance_branch` | собрать cost/ROI/budget model | operation graph, price book, budget policy | cost lines, totals, scenario economics | да |
| `risk_scenario_branch` | оценить варианты и риски | agronomic core, history, weather | scenario matrix, risk register | нет, но high-value |
| `compliance_methodology_branch` | проверить допустимость и методологическую базу | methodology profile, catalog version, rules | allowed/disallowed, required approvals | да |
| `execution_feasibility_branch` | проверить исполнимость | operations, machinery, labor, windows | bottlenecks, feasibility verdict | да |
| `evidence_reference_branch` | собрать provenance/evidence bundle | all source refs | source lineage, freshness coverage | да |
| `forecast_branch` | enrich по прогнозу и погоде | weather normals, forecast provider | weather-sensitive adjustments | нет |
| `comparison_branch` | сравнить variant outputs | results of variant A/B | diffs in yield/cost/risk/assumptions | нет, comparison-only |

### 13.1 Обязательное правило branch outputs

Каждая ветка обязана вернуть:

- branch envelope
- typed payload
- assumption list
- data gaps
- evidence refs
- derived_from chain
- freshness summary

Без этого branch result не имеет права идти в trust gate.

## 14. Typed contracts между ветками

### 14.1 Workflow-level types

```ts
type TechMapWorkflowVerdict =
  | "VERIFIED"
  | "PARTIAL"
  | "UNVERIFIED"
  | "BLOCKED";

type TechMapPublicationState =
  | "WORKING_DRAFT"
  | "GOVERNED_DRAFT"
  | "REVIEW_REQUIRED"
  | "APPROVAL_REQUIRED"
  | "PUBLISHABLE"
  | "PUBLISHED";

interface TechMapAssumption {
  assumption_id: string;
  kind: "USER_DECLARED" | "METHOD_DEFAULT" | "MODEL_ESTIMATE" | "TEMP_PLACEHOLDER";
  label: string;
  value: unknown;
  impact_level: "low" | "medium" | "high";
  publishable: boolean;
  requires_human_review: boolean;
  source_ref?: string;
}

interface TechMapGap {
  gap_id: string;
  kind: "missing_input" | "stale_input" | "conflict" | "policy_block" | "non_deterministic_basis";
  severity: "blocking" | "review" | "informational";
  branch_id?: string;
  slot_key?: string;
  disclosure: string;
}
```

### 14.2 Branch envelope

```ts
interface TechMapBranchResultContract extends BranchResultContract {
  workflow_id: string;
  variant_id: string;
  branch_type:
    | "context_intake"
    | "agronomic"
    | "soil_input"
    | "finance"
    | "risk_scenario"
    | "compliance_methodology"
    | "execution_feasibility"
    | "evidence_reference"
    | "forecast"
    | "comparison";
  publication_critical: boolean;
  assumptions_detail: TechMapAssumption[];
  gaps_detail: TechMapGap[];
  conflicts?: Array<{
    conflict_id: string;
    kind: string;
    left_ref: string;
    right_ref: string;
    summary: string;
  }>;
}
```

### 14.3 Composition contract

```ts
interface TechMapStatement {
  statement_id: string;
  kind:
    | "fact"
    | "derived_metric"
    | "assumption"
    | "recommendation"
    | "alternative"
    | "risk"
    | "gap"
    | "next_action";
  label: string;
  value: unknown;
  unit?: string;
  branch_ids: string[];
  verdict: TechMapWorkflowVerdict;
  evidence_refs: string[];
  disclosure: string[];
}

interface TechMapGovernedComposition {
  workflow_id: string;
  variant_id: string;
  publication_state: TechMapPublicationState;
  overall_verdict: TechMapWorkflowVerdict;
  facts: TechMapStatement[];
  derived_metrics: TechMapStatement[];
  assumptions: TechMapStatement[];
  recommendations: TechMapStatement[];
  alternatives: TechMapStatement[];
  risks: TechMapStatement[];
  gaps: TechMapStatement[];
  next_actions: TechMapStatement[];
}
```

### 14.4 Mapping к текущему runtime enum

Текущий подтверждённый кодом raw enum branch trust:

- `VERIFIED`
- `PARTIAL`
- `UNVERIFIED`
- `CONFLICTED`
- `REJECTED`

Чтобы не создавать drift с runtime, workflow-layer использует mapping:

| Raw runtime verdict | Workflow verdict |
|---|---|
| `VERIFIED` | `VERIFIED` |
| `PARTIAL` | `PARTIAL` |
| `UNVERIFIED` | `UNVERIFIED` |
| `CONFLICTED` | `BLOCKED` |
| `REJECTED` | `BLOCKED` |

Дополнительно `BLOCKED` выставляется при:

- blocking missing slots
- policy block
- approval denial
- deterministic recompute failure на publication-critical branch

## 15. Truth / trust / evidence model

### 15.1 Проверки trust gate

Для каждой ветки обязательно выполняются проверки:

1. `schema_check`
2. `source_resolution`
3. `ownership_check`
4. `deterministic_recompute`
5. `cross_branch_consistency`
6. `freshness_check`
7. `gap_disclosure`
8. `policy_compliance_check`

### 15.2 Правила verdict

| Verdict | Критерий | Как можно использовать |
|---|---|---|
| `VERIFIED` | все critical checks пройдены, blocking assumptions отсутствуют | можно включать как подтверждённый факт |
| `PARTIAL` | branch usable, но есть non-blocking gaps или allowed assumptions | можно включать только с disclosure |
| `UNVERIFIED` | нет достаточного основания для утверждения факта, но нет hard conflict | только advisory/explanatory use |
| `BLOCKED` | conflict, reject, policy block или blocking gap | в factual composition не участвует |

### 15.3 Truth classes финального артефакта

| Класс | Что это | Может ли подаваться как факт |
|---|---|---|
| `fact` | подтверждённые входные данные | да, только при `VERIFIED` |
| `derived_metric` | пересчитываемый результат по данным и формулам | да, если формула deterministic и basis trusted |
| `assumption` | допущение или default | нет, всегда отдельно раскрывается |
| `recommendation` | предлагаемое решение | нет, это рекомендация, не факт |
| `alternative` | сравнимый вариант | нет, это вариант сценария |
| `risk` | риск или ограничение | да, как risk statement с basis/disclosure |
| `gap` | пробел или ограничение | да, как честное раскрытие отсутствия данных |

### 15.4 Критические truth-rules

1. `target_yield` всегда трактуется как hypothesis, а не факт.
2. `expected_cost` является `derived_metric`, а не “реальной стоимостью”.
3. Нормы, ограничения и допустимость препаратов не могут браться из prose `LLM`.
4. `MODEL_ESTIMATE` не может перейти в publication fact.
5. Открытый blocking gap запрещает статус “готово”.

## 16. Deterministic vs LLM responsibilities

| Задача | Deterministic / data-grounded | `LLM` |
|---|---|---|
| извлечение field/season/crop из record/workspace | да | только fallback normalization |
| slot completeness scoring | да | нет |
| дозировки, нормы, агрегаты, суммы, unit conversion | да | нет |
| построение operation graph по approved methodology | да | нет |
| price/cost recompute | да | нет |
| freshness и conflict detection | да | допускается assistive explanation |
| semantic normalization user request | частично | да |
| controlled clarify wording | нет | да |
| сравнение вариантов по готовым typed payloads | частично | да |
| final human-readable explanation | нет | да |
| policy decision `execute/confirm/clarify/block` | да | нет |

Норматив:

- `LLM` не может быть единственным источником для agronomy/finance/compliance assertions
- `LLM` не может придумывать отсутствующий blocking context
- `LLM` не может повышать trust verdict ветки

## 17. Governance, approvals и publication rules

### 17.1 Decision matrix

| Действие | Auto | Confirm | Human approval | Forbidden auto-execute |
|---|---|---|---|---|
| intake и context retrieval | да | нет | нет | нет |
| missing slot triage и clarify packet | да | нет | нет | нет |
| branch execution для workflow draft | да | нет | нет | нет |
| persisted `DRAFT` при explicit direct command | да | нет | нет | нет |
| persisted `DRAFT` без explicit write-intent | нет | да | нет | нет |
| compare variants | да | нет | нет | нет |
| review submission | нет | нет | да | да |
| approval to `APPROVED` | нет | нет | да | да |
| activation/publication to `ACTIVE` | нет | нет | да | да |
| contract publication / signature side effects | нет | нет | да | да |

### 17.2 Publication boundary

Workflow обязан различать:

- `WORKING_DRAFT`
  - эпизодический workflow result
  - ещё не authoritative

- `GOVERNED_DRAFT`
  - versioned persisted draft
  - branch-trusted
  - explainable
  - не является approved execution baseline

- `REVIEW_REQUIRED`
  - пакет готов к human review

- `APPROVAL_REQUIRED`
  - review пройден, но нужны formal approvals

- `PUBLISHABLE`
  - publication gate зелёный

- `PUBLISHED`
  - опубликованный baseline для исполнения

### 17.3 Mapping к текущему `TechMapStatus`

| Workflow state | Persisted `TechMapStatus` |
|---|---|
| `WORKING_DRAFT` | ещё может не существовать persisted record |
| `GOVERNED_DRAFT` | `DRAFT` |
| `REVIEW_REQUIRED` | `REVIEW` |
| `APPROVAL_REQUIRED` | `REVIEW` или `APPROVED`, в зависимости от шага |
| `PUBLISHABLE` | `APPROVED` |
| `PUBLISHED` | `ACTIVE` |
| superseded version | `ARCHIVED` |

### 17.4 Approval chain

Минимальная approval chain:

- agronomy review
- finance review, если бюджет или ROI materially affected
- legal/contracts review, если Техкарта участвует в contract/publication contour
- strategic approval для перехода в `ACTIVE`

## 18. Explainability model

Финальный пользовательский explainability-пакет обязан отвечать на шесть вопросов:

1. Из каких данных собрана Техкарта.
2. Какие assumptions были использованы.
3. Какие ограничения и policy были учтены.
4. Какие ветки `VERIFIED / PARTIAL / UNVERIFIED / BLOCKED`.
5. Почему предложен именно этот вариант.
6. Что мешает публикации, если результат остаётся draft-only.

Минимальный explainability bundle:

```ts
interface TechMapExplainabilityBundle {
  workflow_id: string;
  source_summary: Array<{ source: string; kind: string; freshness: string }>;
  branch_summary: Array<{ branch_id: string; verdict: string; summary: string }>;
  assumptions: TechMapAssumption[];
  gaps: TechMapGap[];
  why_this_variant: string[];
  why_not_publishable?: string[];
  next_actions: string[];
}
```

Пользовательский ответ обязан визуально и смыслово разделять:

- `что подтверждено`
- `что рассчитано`
- `что предположено`
- `где есть пробелы`
- `что нужно сделать дальше`

## 19. Audit / forensics model

### 19.1 Что писать в аудит

Обязательные audit artifacts:

- `trace_id`
- `workflow_id`
- `semantic frame`
- `context snapshot hash`
- `owner role`
- `branch graph`
- `tool usage`
- `branch results`
- `branch trust assessments`
- `clarify packets`
- `policy decisions`
- `approval decisions`
- `final composition basis`
- `publication outcome`

### 19.2 Event model

| Event | Когда пишется | Зачем нужен |
|---|---|---|
| `tech_map_workflow_started` | после semantic normalization | реконструкция старта |
| `tech_map_context_collected` | после intake | восстановление входных оснований |
| `tech_map_clarify_issued` | при missing slots | объяснение, почему execution не пошёл дальше |
| `tech_map_branch_started` | перед каждой веткой | execution trace |
| `tech_map_branch_completed` | после каждой ветки | raw outputs |
| `tech_map_branch_trust_assessed` | после trust gate | why included / why blocked |
| `tech_map_composed` | после composition | basis финального артефакта |
| `tech_map_review_submitted` | при переходе в review | audit review chain |
| `tech_map_approval_recorded` | при human decision | юридически значимый trail |
| `tech_map_publication_committed` | при публикации | publication boundary |

### 19.3 Forensics questions, которые должны решаться по логу

Аудит должен позволять без домыслов ответить:

- почему система запросила `clarify`
- почему конкретная ветка получила `PARTIAL` или `BLOCKED`
- из какого источника взят каждый publication-critical input
- почему результат остался `draft only`
- кто и на каком основании одобрил публикацию

## 20. Failure modes и anti-hallucination safeguards

| Failure mode | Риск | Guardrail |
|---|---|---|
| отсутствует blocking input, но система продолжает как будто всё известно | ложная готовность | `clarify` вместо generation |
| `LLM` генерирует операции без approved methodology | галлюцинация agronomy logic | только deterministic blueprint/rule engine |
| stale soil profile используется как свежий | неверные дозировки | freshness gate + `PARTIAL/BLOCKED` |
| field/season mismatch | scope error | source resolution + cross-branch consistency |
| currency/unit mismatch в finance | ложная экономика | deterministic recompute + unit normalization |
| target yield подан как факт | ложная истинность | semantic class = `assumption/hypothesis` |
| variant comparison идёт по разным baseline context | ложное сравнение | shared baseline hash required |
| publication-critical branch остаётся `UNVERIFIED`, но compose всё равно “сглаживает” ответ | ложная техкарта | honest composition rules |
| conflict между compliance и agronomic branch скрыт | нормативный риск | raw `CONFLICTED/REJECTED` -> workflow `BLOCKED` |

Дополнительные запреты:

- запрет `prose -> fact promotion`
- запрет silent fallback для blocking missing slots
- запрет auto-publication
- запрет скрытых `default` без assumption object

## 21. Sequence diagrams ключевых сценариев

### 21.1 Сценарий 1. Новая Техкарта с нуля, контекст неполный

```text
User
  -> SupervisorAgent: "Собери техкарту по рапсу"
SupervisorAgent
  -> SemanticIngress: build tech_map frame
SemanticIngress
  -> SupervisorAgent: intent=create_new, readiness=S0/S1
SupervisorAgent
  -> ContextIntakeBranch: collect company/field/season/crop context
ContextIntakeBranch
  -> MissingContextTriage: slot ledger
MissingContextTriage
  -> PolicyGate: blocking slots missing
PolicyGate
  -> Composer: decision=clarify, publication_state=WORKING_DRAFT
Composer
  -> User: missing blocking slots + assumptions forbidden + next action
Audit
  <- semantic frame, missing slots, clarify reason, draft boundary
```

Нормативный результат:

- persisted `TechMap` ещё не обязателен
- система формирует controlled clarify
- статус результата = `WORKING_DRAFT`, не “готовая техкарта”

### 21.2 Сценарий 2. Пересборка по существующему полю/сезону

```text
User
  -> SupervisorAgent: "Пересобери техкарту по полю 12 на сезон 2026"
SupervisorAgent
  -> SemanticIngress: intent=rebuild_existing
SupervisorAgent
  -> ContextIntakeBranch: reuse field/season/previous tech map/history
ContextIntakeBranch
  -> BranchPlanner: launch agronomic + soil + compliance + evidence
BranchPlanner
  -> FinanceBranch: after agronomic payload
BranchPlanner
  -> ExecutionFeasibilityBranch: after operation graph
AllBranches
  -> TrustGate: assessments
TrustGate
  -> Composer: governed draft composition
Composer
  -> Persistence: new version as DRAFT
Composer
  -> User: draft summary + branch verdicts + disclosures
Audit
  <- branch results, trust verdicts, composition basis, version id
```

Нормативный результат:

- reuse контекста обязателен
- новая версия создаётся только как `DRAFT`
- финальная композиция строится после trust gate

### 21.3 Сценарий 3. Сравнение двух вариантов Техкарты

```text
User
  -> SupervisorAgent: "Сравни экономный и интенсивный варианты"
SupervisorAgent
  -> SemanticIngress: intent=compare_variants, comparison_mode=2
SupervisorAgent
  -> ContextIntakeBranch: build shared baseline snapshot
SupervisorAgent
  -> VariantA branches: execute on baseline + overrides A
SupervisorAgent
  -> VariantB branches: execute on baseline + overrides B
VariantBranches
  -> TrustGate: verdicts per variant
TrustGate
  -> ComparisonBranch: diff by yield/cost/risk/assumptions
ComparisonBranch
  -> Composer: comparison report only
Composer
  -> User: differences, assumptions, risks, unresolved gaps
```

Нормативный результат:

- сравниваются не prose-ответы, а variant payloads
- baseline context должен быть общим
- пользователь видит различия по `assumptions / cost / risk / yield`

### 21.4 Сценарий 4. Конфликт данных или недостаток критичного основания

```text
User
  -> SupervisorAgent: "Собери техкарту"
SupervisorAgent
  -> Branches: execute
ComplianceBranch
  -> TrustGate: raw verdict=CONFLICTED
FinanceBranch
  -> TrustGate: raw verdict=UNVERIFIED
TrustGate
  -> WorkflowVerdictMapper: overall=BLOCKED
WorkflowVerdictMapper
  -> Composer: no factual final tech map
Composer
  -> User: conflict disclosure + blocking gaps + exact next actions
Audit
  <- conflict refs, failed checks, block reason
```

Нормативный результат:

- система не имеет права выдать “готовую техкарту”
- конфликт обязан быть показан как конфликт
- `BLOCKED` лучше ложной завершённости

### 21.5 Сценарий 5. Draft -> human review -> approval -> publication

```text
User
  -> SupervisorAgent: "Отправь техкарту на согласование"
SupervisorAgent
  -> GovernanceGate: validate review readiness
GovernanceGate
  -> HumanReview: agronomy/finance/legal approvers as required
HumanReview
  -> ApprovalLedger: approve or reject
ApprovalLedger
  -> Persistence: TechMapStatus REVIEW -> APPROVED
StrategicApprover
  -> PublicationGate: approve activation
PublicationGate
  -> Persistence: APPROVED -> ACTIVE
Audit
  <- approval chain, actors, timestamps, publication basis
```

Нормативный результат:

- `draft` и `published` — разные truth states
- publication требует human approval chain
- audit trail обязан быть полным

## 22. MVP slice

### 22.1 Что входит в MVP

- single field
- single season
- single crop
- intents:
  - `create_new`
  - `rebuild_existing`
  - `compare_variants` на 2 варианта
  - `review_draft`
  - `explain_block`
- branches:
  - `context_intake`
  - `agronomic`
  - `soil_input`
  - `finance`
  - `compliance_methodology`
  - `evidence_reference`
  - `execution_feasibility`
- trust gate + honest composition
- `DRAFT -> REVIEW -> APPROVED -> ACTIVE` handoff mapping

### 22.2 Что не входит в MVP

- multi-field optimization
- autonomous publication
- legal digital signature
- full `change order` loop
- fully automated weather-driven adaptive replanning

### 22.3 Рекомендуемая первая декомпозиция в implementation-пакеты

| Пакет | Смысл | Ожидаемый эффект |
|---|---|---|
| `TMW-1 Slot Registry` | ввести canonical registry контекстных slot-ов Техкарты | controlled clarify и readiness перестанут быть эвристикой |
| `TMW-2 Semantic Frame Extension` | расширить ingress frame tech-map specialization | оркестратор начнёт видеть именно workflow Техкарты, а не общий chat intent |
| `TMW-3 Workflow Orchestrator` | собрать owner-led phase engine Техкарты | появится first-class governed pipeline |
| `TMW-4 Branch Contracts` | ввести typed payloads по всем веткам | межветочный обмен станет машинно проверяемым |
| `TMW-5 Trust + Composition` | применить trust gate и final composition rules | ложная “готовая техкарта” перестанет проходить |
| `TMW-6 Review/Publication Gate` | зафиксировать approval chain и versioning | draft/review/publication boundary станет enforceable |

## 23. Future evolution

Целевое развитие после MVP:

- dedicated `tech_map_workflow_owner` service поверх `SupervisorAgent`
- полноценный scenario optimizer для `min/base/max/intensive` вариантов
- versioned methodology registry и catalog locks
- change-order governed loop после публикации
- tighter integration с execution facts и plan/fact feedback
- evidence-backed learning loop: `tech map -> execution -> outcome -> knowledge`

## 24. Нормативный итог

Техкарта в `RAI_EP` должна существовать как governed artifact со следующими обязательными свойствами:

- свободный вход
- жёсткая semantic normalization
- owner-led orchestration
- typed branch contracts
- trust verdict до composition
- честное различение фактов, расчётов, допущений и пробелов
- publication только после governance и approvals
- explainability и audit trail по умолчанию

Любая реализация Техкарты, которая:

- строит финальный ответ раньше trust gate
- скрывает blocking gaps
- поднимает `LLM` до источника истины
- не различает `draft` и `published`

считается некорректной относительно этого документа.
