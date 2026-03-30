# RAI_EP External Developer Briefing Packet

## What This Is

This is an external bilingual handoff packet prepared for an overseas developer. It is a separate non-canonical delivery artifact and does not replace the internal source-of-truth structure of the project.

Packet snapshot: `March 30, 2026`.

Reading rule:

`code/tests/gates > generated manifests > docs > this external packet`

## Who This Is For

- An external senior tech lead or strong full-stack engineer who needs a fast, decision-grade understanding before a first technical discussion.
- A developer who must quickly see where the system already has a live engineering baseline and where the critical gaps still are.
- A contributor expected to work inside an `AI-first delivery model`, where AI produces most bounded implementation work and humans own architecture, policy, acceptance, and release decisions.

## Recommended Reading Order

1. `01_PRODUCT_AND_BUSINESS_CONTEXT_*`
2. `02_ARCHITECTURE_AND_RUNTIME_*`
3. `03_READINESS_AND_EXECUTION_STATUS_*`
4. `04_STAGE_BASED_ROADMAP_AND_AI_DELIVERY_MODEL_*`

## Five Key Statements

- `RAI_EP` is not just a `chat with agents`; it is a governed operating system for seasonal agricultural execution.
- The central system artifact is `TechMap`, which ties together agronomy, season execution, economics, deviations, evidence, and approval.
- AI in this project is a governed advisory and orchestration layer, not an autonomous decision center for high-impact actions.
- The engineering baseline is already strong enough for controlled development and a limited pilot contour.
- External production is currently blocked not by lack of product ideas, but by unresolved `Legal / Compliance`, AppSec, and ops-hardening work.

## What Is Verified Now

- The repository is an active `pnpm`/`Turborepo` monorepo with live contours in `apps/api`, `apps/web`, `apps/telegram-bot`, `packages/*`, and `infra/*`.
- The project already contains a governed AI/runtime foundation, season and `TechMap` domain modules, plus docs-as-code governance and reproducible gates/scripts.
- Based on audit evidence from `March 28, 2026` and execution synthesis from `March 30, 2026`, the system is roughly at `6.5/10` program/runtime maturity.
- Controlled development and a limited `self-host / localized` pilot are realistic; external production is not yet an honest claim.

## Target State

- `RAI_EP` is intended to operate as an installable governed enterprise platform centered on `TechMap`, season execution, finance/economy, explainability, auditability, and controlled AI.
- In the target model, the system should support a transparent cycle of `plan -> TechMap -> execution -> deviations -> recommendations -> approval -> result`.
- AI should accelerate analysis, routing, explainability, and draft assembly without bypassing `HITL`, policy, or evidence requirements.
- Expansion of UI breadth, agent roles, and integrations should happen only after core governance and release discipline are closed.

## What Not To Confuse

- This packet is a fast management and technical briefing, not a substitute for reading the code.
- Strategy and roadmap materials describe the intended system shape; they must not be presented as fully delivered runtime behavior.
- If anything here conflicts with code, tests, or gates, trust code, tests, and gates.

## Primary Internal Sources

- `README.md`
- `docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
- `docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
- `docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
- `docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
- `docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md`
- `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`
