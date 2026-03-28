---
id: DOC-STR-RAI-EP-SYSTEM-BLUEPRINT-AND-GENERAL-PLAN-20260328
layer: Strategy
type: Vision
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-STR-RAI-EP-SYSTEM-BLUEPRINT-AND-GENERAL-PLAN-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md;apps/api;apps/web;apps/telegram-bot
---
# RAI_EP SYSTEM BLUEPRINT AND GENERAL PLAN

## CLAIM
id: CLAIM-STR-RAI-EP-SYSTEM-BLUEPRINT-AND-GENERAL-PLAN-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Зачем нужен этот документ

Аудит уже отвечает на вопросы:
- что есть в репозитории;
- что сейчас работает;
- где риски;
- что блокирует enterprise launch.

Этот документ отвечает на другой класс вопросов:
- что именно мы строим как систему в целом;
- какой у системы целевой облик;
- что является ядром, а что вторичным контуром;
- в какой последовательности систему доводить до зрелости.

## Стратегическое определение системы

`RAI_EP` — это governed multi-agent operating system для управления урожаем, агрооперациями, экономикой сезона, исполнением техкарты, explainability, контролем рисков и управленческой координацией вокруг хозяйства или группы хозяйств.

## Центральный бизнес-артефакт

Техкарта в системе должна быть не генератором текста, а центральным исполнимым артефактом, вокруг которого собираются:
- агрономическая гипотеза;
- операционный план сезона;
- бюджет и финансовая модель;
- контроль исполнения;
- журнал отклонений;
- рекомендации и предупреждения;
- explainability и evidence trail;
- review, approval, publication.

## Что является ядром продукта

Ядро продукта:
- `TechMap`
- `Governed Runtime`
- `Execution Control`
- `Evidence / Truthfulness`
- `Auditability`

Именно эта связка должна оставаться несущей конструкцией системы.

## North Star

Система считается пришедшей к целевому состоянию, когда она умеет:

1. Создавать и сопровождать техкарту как проект урожая.
2. Управлять исполнением сезона, а не только хранить справочники и записи.
3. Поддерживать управленческие решения доказательствами, а не красивыми ответами.
4. Безопасно использовать AI/агентов в governed-контуре.
5. Давать прозрачный audit trail по данным, решениям, изменениям и рекомендациям.
6. Работать как multi-tenant enterprise система с понятными legal, security и ops-границами.
7. Поддерживать `self-host / localized` deployment как реалистичный основной путь внедрения.

## Анти-цели

`RAI_EP` не должен превращаться в:
- очередной “чат с агентами”, где архитектура подчинена демонстрации AI;
- набор слабо связанных модулей `CRM + dashboard + bot + AI`;
- документогенератор без операционного исполнения;
- автономный AI без policy map, evidence thresholds и HITL;
- `SaaS-first` продукт, если legal/compliance и residency пока подталкивают систему в `self-host / localized`.

## Системные слои

1. Interaction Layer: web, telegram, internal operator surfaces.
2. Governed Application Layer: auth, tenant context, routing, policy, orchestration.
3. Core Domain Layer: TechMap, season execution, finance/economy, risks, front-office entities.
4. AI / Agent Runtime Layer: routing, governed tools, evidence-first generation, uncertainty handling, HITL.
5. Data / Evidence / Audit Layer: primary data, explainability traces, incidents, immutable evidence artifacts.
6. Governance / Security / Compliance Layer: release gates, secrets, licenses, SBOM, privacy/legal controls.
7. Deployment / Operations Layer: self-host, managed, backup/restore, DR, installability, support boundaries.

## Ключевая бизнес-ценность

Система должна снижать не только ручной труд, но и стоимость неправильного решения через:
- техкарту как управленческий контракт;
- цифровое сопровождение исполнения;
- своевременные сигналы об отклонениях;
- evidence-based рекомендации;
- прозрачный цифровой след для контроля, споров, аудита и масштабирования.

## Практический вывод

На текущем этапе `RAI_EP` нужно развивать как installable governed platform с сильным доменным ядром и controlled AI, а не как интерфейсную витрину или автономный AI-продукт.
