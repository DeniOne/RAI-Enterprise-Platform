---
id: DOC-ARH-GEN-178
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

Consulting Domain Schema
RAI Enterprise Platform

1. Назначение документа

Формальное описание канонических сущностей консалтингового ядра RAI_EP.

2. Основные сущности
HarvestPlan

Назначение: постановка консалтинговой задачи.

Поля (ключевые):

id

client_id

context_snapshot

target_metric

period

min_value

opt_value

max_value

baseline_value (optional)

status

TechMap

Назначение: эталон под конкретный Harvest Plan.

Поля:

id

harvest_plan_id

target_state

streams[]

checkpoints[]

assumptions[]

risk_flags[]

version

status

PerformanceContract

Назначение: экономическая модель оплаты.

Поля:

id

harvest_plan_id

model_type (History / NoHistory / Hybrid)

fee_rules

safety_net_rules

settlement_status

DeviationReview

Назначение: фиксация и анализ отклонений.

Поля:

id

techmap_id

deviation_type

description

detected_at

impact_estimate

status

DecisionRecord

Назначение: юридически и логически значимое решение.

Поля:

id

deviation_review_id

decision_type

rationale

expected_impact

approved_by

timestamp

3. Связи
HarvestPlan
   ├─ TechMap (1:1)
   ├─ PerformanceContract (1:1)
   └─ DeviationReview (1:N)
            └─ DecisionRecord (1:1)

4. Инварианты

Нельзя создать TechMap без Approved HarvestPlan

Performance считается только по закрытому периоду

DecisionRecord неизменяем