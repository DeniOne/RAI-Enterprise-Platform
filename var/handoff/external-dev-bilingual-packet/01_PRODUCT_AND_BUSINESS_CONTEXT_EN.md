# 01. Product And Business Context

## Short Definition

`RAI_EP` is a governed operating system for seasonal agricultural management. Its central executable artifact is `TechMap`, while AI strengthens analysis, routing, and advisory workflows without replacing domain governance or human approval.

## What Is Verified Now

- The project is already beyond the level of an idea or a demo chat: the codebase contains active domain contours for season planning, fields, tasks, `TechMap`, finance/economy, front-office, legal, knowledge, and `rai-chat`.
- The business core is not organized around a single role and not around a single channel. The system ties together management, agronomy, field execution, economics, evidence, and audit trail.
- The internal product logic already treats `TechMap` as the linking artifact between seasonal intent, real execution, deviations, and recommendations.
- In the current model, AI is allowed only as a governed advisory and orchestration layer: it may classify, explain, suggest, and route, but it must not perform high-impact actions on its own.

## Target Business Model

### Main Roles

- Owner or executive sponsor: sets the season goals, risk limits, and overall management direction.
- Operations lead: turns goals into execution and tracks deviations.
- Agronomist or domain expert: builds and validates the agronomic hypothesis, review process, and recommendations.
- Finance role: connects the season design to budget, cost structure, liquidity, and expected profitability.
- Front-office / CRM contour: links obligations, communication, counterparties, and operational follow-up.
- Compliance / audit role: owns policy, explainability, evidence trail, access discipline, and release governance.
- AI contour: helps structure context, surface risks, propose options, and explain the basis of recommendations.

### Central Artifact: `TechMap`

In `RAI_EP`, `TechMap` is not just a document. It acts at the same time as:

- a crop project;
- a season operating model;
- a financial model;
- a digital execution contract;
- an explainability and control contour;
- a coordination point for events, decisions, and roles.

That is why `TechMap` must connect:

- crop, field, season, and tenant;
- operations plan and resources;
- review, approval, and publication states;
- real execution events;
- deviations and risk signals;
- recommendations, corrections, and audit trail.

### Canonical Business Cycle

1. A season intent is formed.
2. A `TechMap` is created or updated.
3. The `TechMap` goes through review, approval, and publication.
4. Season execution begins.
5. The system receives facts, events, and deviations.
6. Domain and AI contours produce signals, warnings, and action options.
7. High-impact changes pass through policy and a human gate.
8. Significant actions preserve evidence, explainability, and audit trail.
9. The cycle outcome feeds the next planning loop.

## What The Project Is Not

- It is not just a `chat with agents` product where AI itself is the whole offering.
- It is not merely a loose combination of `CRM + dashboard + bot`.
- It is not a document generator that produces attractive text without operational execution.
- It is not an autonomous AI system without `HITL`, policy maps, and evidence thresholds.

## Open Gaps And Constraints

- The domain center around `TechMap` is already defined as canon, but the full target lifecycle is not yet closed evenly across the runtime.
- Not every supporting module has the same maturity or the same importance for the near-term product core.
- The project must deliberately resist growing in breadth before the governed core is closed.
- External production cannot be presented honestly until the legal/compliance and release-hardening contours reach decision-grade maturity.

## Source Anchors

- `docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
- `docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
- `docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md`
- `docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
- `README.md`
