# STAGE 2 — Canon Index

> RAI Enterprise Platform | Agent Platform & AI Canon

---

## Главный активный документ

**[RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](./RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)**  
→ Главный active canon Stage 2. С него нужно начинать. Он заменяет старую россыпь архитектурных и чеклистовых файлов как основной source of truth.

---

## Canon Input

Эти документы остаются важными входными канонами, но больше не являются параллельными “главными” документами.

| Документ | Статус | Роль |
|----------|--------|------|
| [RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md](./RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md) | `CANON INPUT` | Верхний бизнесовый и системный манифест A_RAI |
| [RAI_AI_SYSTEM_ARCHITECTURE.md](./RAI_AI_SYSTEM_ARCHITECTURE.md) | `CANON INPUT` | Базовая архитектура swarm/runtime/governance |
| [RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md](./RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md) | `CANON INPUT` | Принципы anti-hallucination, evidence, verification |
| [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](./A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md) | `CANON INPUT` | Верхний readiness gate |
| [TRUTH_SYNC_STAGE_2_CLAIMS.md](./TRUTH_SYNC_STAGE_2_CLAIMS.md) | `CANON INPUT` | Truth baseline по claims |
| [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](./A_RAI_AGENT_INTERACTION_BLUEPRINT.md) | `CANON INPUT` | Blueprint UX/runtime-композиции: chat thread, overlay canvas, мультиоконность, clarification loop |
| [2026-03-07_a_rai-s24_interactive-clarification-overlay-closeout_report.md](../../../interagency/reports/2026-03-07_a_rai-s24_interactive-clarification-overlay-closeout_report.md) | `REFERENCE ONLY` | Closeout evidence по reusable clarification/window pattern для agronomist + economist |
| [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](./RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md) | `ACTIVE ADDENDUM` | Дополнение к master-plan: фокусные зоны ответственности агентов, intent-каталог, required context и UI action contracts |
| [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](./RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md) | `ACTIVE MAP` | Единая карта доменов платформы, owner-агентов, intent-owner и нормативных handoff paths |

---

## Reference

Эти документы полезны как технический или исторический reference, но не как главный план Stage 2.

| Документ | Статус | Роль |
|----------|--------|------|
| [RAI_AI_SYSTEM_RESEARCH.md](./Archive/RAI_AI_SYSTEM_RESEARCH.md) | `REFERENCE ONLY` | Исследовательская база и кодовый инвентарь |
| [RAI_AI_SWARM_RUNTIME_ARCHITECTURE.md](./Archive/RAI_AI_SWARM_RUNTIME_ARCHITECTURE.md) | `REFERENCE ONLY` | Историческая runtime-спека |
| [RAI_AI_EVOLUTION_ARCHITECTURE.md](./Archive/RAI_AI_EVOLUTION_ARCHITECTURE.md) | `REFERENCE ONLY` | Score / reputation / evolution контур |
| [TRUTH_SYNC_RECOVERY_CHECKLIST.md](./Archive/TRUTH_SYNC_RECOVERY_CHECKLIST.md) | `REFERENCE ONLY` | Recovery-checklist серии truth-sync |
| [SPEC_AGENT_FIRST_RAI_EP.md](./Archive/SPEC_AGENT_FIRST_RAI_EP.md) | `REFERENCE ONLY` | Product law / interaction law |
| [PROJECT_EXECUTION_CHECKLIST.md](./Archive/PROJECT_EXECUTION_CHECKLIST.md) | `REFERENCE ONLY` | Исторический execution tracker |
| [PROMPT_CHANGE_RFC.md](./Archive/PROMPT_CHANGE_RFC.md) | `REFERENCE ONLY` | Нормативный reference по prompt governance |
| [RAI_AGRONOMIC_DIGITAL_TWIN_ARCHITECTURE.md](./Archive/RAI_AGRONOMIC_DIGITAL_TWIN_ARCHITECTURE.md) | `REFERENCE ONLY` | Доменный reference по digital twin |
| [RAI_AGRONOMIC_NERVOUS_SYSTEM_ARCHITECTURE.md](./Archive/RAI_AGRONOMIC_NERVOUS_SYSTEM_ARCHITECTURE.md) | `REFERENCE ONLY` | Доменный reference по event/signal contour |

---

## Stale

Эти документы сохраняются, но не должны использоваться как активный truth source без сверки с кодом и master-plan.

| Документ | Статус | Причина |
|----------|--------|---------|
| [A_RAI_IMPLEMENTATION_CHECKLIST.md](./Archive/A_RAI_IMPLEMENTATION_CHECKLIST.md) | `STALE` | Исторически полезен, но закрытые фазы не равны текущему agent-platform roadmap |
| [PROJECT_REALITY_MAP.md](./Archive/PROJECT_REALITY_MAP.md) | `STALE` | Часть выводов уже не соответствует состоянию после truth-sync и `S13-S23` |
| [RAI_AGENT_OS_IMPLEMENTATION_PLAN.md](./Archive/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md) | `STALE` | Важен для Agent OS shell, но не покрывает текущую фазу Agent Platform & AI |

---

## Archive / Legacy

Эти файлы сохраняются как история, research trail или process-артефакты.

| Документ | Статус | Роль |
|----------|--------|------|
| [AI_SWARM_ARCHITECTURE_ECONOMICS.md](./Archive/AI_SWARM_ARCHITECTURE_ECONOMICS.md) | `ARCHIVE` | Историческое исследование economics / model landscape |
| [RAI_EP — Agent-First Sprint 1 Spec (v1).md](./Archive/RAI_EP%20%E2%80%94%20Agent-First%20Sprint%201%20Spec%20(v1).md) | `ARCHIVE` | Исторический sprint law |
| [A_RAI_AGENT_REGISTRY_PROMPT.md](./Archive/A_RAI_AGENT_REGISTRY_PROMPT.md) | `ARCHIVE` | Исторический implementation prompt |
| [ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md](./Archive/ANTIGRAVITY%20SOFTWARE%20FACTORY%20%E2%80%94%20ORCHESTRATOR%20PROMPT.md) | `ARCHIVE` | Процессный orchestration doc |
| [CURSOR SOFTWARE FACTORY — STARTER PROMPT.md](./Archive/CURSOR%20SOFTWARE%20FACTORY%20%E2%80%94%20STARTER%20PROMPT.md) | `ARCHIVE` | Процессный starter/review doc |

---

## Как теперь читать Stage 2

```text
1. Прочитай RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md      ← главный активный canon
2. Прочитай RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md     ← бизнесовый и системный контекст
3. Сверься с TRUTH_SYNC_STAGE_2_CLAIMS.md                 ← truth baseline
4. Сверься с A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md ← readiness gate
5. Дальше открывай только точечные reference/archive документы
```
