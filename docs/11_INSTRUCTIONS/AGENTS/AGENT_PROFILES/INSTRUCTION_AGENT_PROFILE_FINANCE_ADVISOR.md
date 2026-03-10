---
id: DOC-INS-AGT-PROFILE-008
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ FINANCE_ADVISOR

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ template-role `finance_advisor`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РїСЂРё РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёРё СЃРїРµС†РёР°Р»РёР·РёСЂРѕРІР°РЅРЅРѕРіРѕ С„РёРЅР°РЅСЃРѕРІРѕРіРѕ advisory РїРѕРІРµСЂС… `economist`.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РїР»Р°РЅРѕРІР°СЏ template/future role.
- Runtime family: РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain РІ template: `finance`.
- Execution adapter: `economist`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

Р РѕР»СЊ РЅСѓР¶РЅР° РєР°Рє СѓРїСЂР°РІР»СЏРµРјС‹Р№ С„РёРЅР°РЅСЃРѕРІС‹Р№ advisory-РєРѕРЅС‚СѓСЂ РїРѕРІРµСЂС… РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅС‹С… РјРµС‚СЂРёРє Рё СЃС†РµРЅР°СЂРёРµРІ.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ template СЃ:

- `ownerDomain: finance`
- strong-model routing
- `FinanceToolsRegistry`
- advisory-only governance
- explicit no-payment / no-booking writes

РљР°Рє canonical runtime role РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅ.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- С„РёРЅР°РЅСЃРѕРІС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё;
- РјРµС‚СЂРёРєРё;
- budgets;
- СЃС†РµРЅР°СЂРЅС‹Рµ С„РёРЅР°РЅСЃРѕРІС‹Рµ РІС‹РІРѕРґС‹;
- executive finance commentary РєР°Рє advisory-only СЃР»РѕР№, Р° РЅРµ finance execution РёР»Рё finance analysis owner-path.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- РћРїРёСЂР°С‚СЊСЃСЏ РЅР° deterministic finance evidence.
- Р’РѕР·РІСЂР°С‰Р°С‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё, Р° РЅРµ С‚СЂР°РЅР·Р°РєС†РёРё.
- Р Р°Р±РѕС‚Р°С‚СЊ РІ advisory-only СЂРµР¶РёРјРµ.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- РџР»Р°С‚С‘Р¶РЅС‹Рµ Рё СѓС‡С‘С‚РЅС‹Рµ writes.
- Р‘СЂР°С‚СЊ ownership РїРѕ plan/fact, scenario РёР»Рё risk assessment С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ Р·Р°РїСЂРѕСЃ РѕС„РѕСЂРјР»РµРЅ РєР°Рє advisory.
- РџРѕРґРјРµРЅСЏС‚СЊ `economist` owner-agent Р±РµР· formalized runtime split.
- РџСЂРёС‚РІРѕСЂСЏС‚СЊСЃСЏ production-ready runtime owner, РїРѕРєР° canonical finance-advisor family РЅРµ РїРѕРґРЅСЏС‚Р°.
- Р’С‹С…РѕРґРёС‚СЊ РІ CRM РёР»Рё legal.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current state РЅР° template-СѓСЂРѕРІРЅРµ:

- template manifest РґР»СЏ `finance_advisor`;
- governance policy Рё advisory-only constraints;
- adapter binding Рє `economist`;
- `FinanceToolsRegistry` РЅР° template-СѓСЂРѕРІРЅРµ;
- template semantics РґР»СЏ management-ready finance advisory РїРѕРІРµСЂС… deterministic evidence.

Р§С‚Рѕ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ СЃРµР№С‡Р°СЃ РєР°Рє runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- canonical runtime family;
- РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅС‹Р№ finance-advisor intent catalog РІ `rai-chat`;
- production tool surface РѕС‚РґРµР»СЊРЅС‹Р№ РѕС‚ `economist`;
- direct production routing РІ `finance_advisor` РєР°Рє РІ `primary owner-agent`.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

- СѓРїСЂР°РІР»СЏРµРјС‹Р№ С„РёРЅР°РЅСЃРѕРІС‹Р№ advisory;
- portfolio and budget commentary;
- management-ready summaries РїРѕРІРµСЂС… `economist` outputs;
- executive commentary РїРѕ commerce facts Рё deterministic metrics;
- governed advisory handoff РґР»СЏ finance / contracts / control РєРѕРЅС‚СѓСЂРѕРІ.

Р РѕР»СЊ РЅРµ РґРѕР»Р¶РЅР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- ownership РЅР°Рґ `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment`;
- payment, booking РёР»Рё contract execution;
- CRM, agronomy РёР»Рё legal ownership;
- СЃРєСЂС‹С‚РѕРіРѕ runtime-РґСѓР±Р»СЏ `economist`.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РЎРµР№С‡Р°СЃ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· future-role onboarding.
- Р’ РєР°РЅРѕРЅРёС‡РµСЃРєРѕРј runtime РєР°Рє РѕС‚РґРµР»СЊРЅР°СЏ family РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚.
- Р”Рѕ canonical enablement direct production routing РІ `finance_advisor` Р·Р°РїСЂРµС‰С‘РЅ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `economist`: С‚РµРєСѓС‰РµРµ adapter inheritance.
- РЎ `controller`: Р±СѓРґСѓС‰Р°СЏ СЃРІСЏР·РєР° РїРѕ control exceptions.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`finance_advisor` РјРѕР¶РµС‚ Р±С‹С‚СЊ owner С‚РѕР»СЊРєРѕ standalone finance-advisory-Р·Р°РїСЂРѕСЃР°, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє executive finance commentary:

- РїРѕРґРіРѕС‚РѕРІРёС‚СЊ management-ready financial summary;
- РґР°С‚СЊ advisory commentary РїРѕ budget / portfolio / metrics;
- РѕС„РѕСЂРјРёС‚СЊ executive interpretation РїРѕРІРµСЂС… СѓР¶Рµ СЂР°СЃСЃС‡РёС‚Р°РЅРЅС‹С… deterministic finance outputs;
- РґР°С‚СЊ advisory summary РїРѕ commerce facts Р±РµР· Р·Р°РїСЂРѕСЃР° РЅР° execution.

Р”Р°Р¶Рµ РІ СЌС‚РёС… СЃР»СѓС‡Р°СЏС… РґРѕ canonical enablement direct production routing РІ `finance_advisor` РѕСЃС‚Р°С‘С‚СЃСЏ Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рј. РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ РґРѕР»Р¶РµРЅ С‚СЂР°РєС‚РѕРІР°С‚СЊ СЌС‚Рѕ РєР°Рє future advisory-path, Р° РЅРµ РєР°Рє СѓР¶Рµ РґРѕСЃС‚СѓРїРЅС‹Р№ runtime owner.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `finance_advisor`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ runtime owner:

- РїРѕСЃС‡РёС‚Р°С‚СЊ plan/fact;
- РІС‹РїРѕР»РЅРёС‚СЊ scenario simulation;
- РІС‹РїРѕР»РЅРёС‚СЊ finance risk assessment;
- СЃРѕР·РґР°С‚СЊ РёР»Рё РїСЂРѕРІРµСЃС‚Рё invoice / payment;
- РёСЃРїРѕР»РЅРёС‚СЊ contract lifecycle action;
- РёР·РјРµРЅРёС‚СЊ CRM, agronomy РёР»Рё monitoring state.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `finance_advisor` РґР°С‘С‚ executive advisory Рё management commentary;
- `economist` РІР»Р°РґРµРµС‚ deterministic finance analysis Рё finance interpretation;
- `contracts_agent` РІР»Р°РґРµРµС‚ contract / invoice / payment execution;
- `finance_advisor` РЅРµ РґРѕР»Р¶РµРЅ РїРѕРґРјРµРЅСЏС‚СЊ `economist` С‚РѕР»СЊРєРѕ РёР·-Р·Р° Р±РѕР»РµРµ "СѓРїСЂР°РІР»РµРЅС‡РµСЃРєРѕР№" С„РѕСЂРјСѓР»РёСЂРѕРІРєРё Р·Р°РїСЂРѕСЃР°.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· `economist`, РєРѕРіРґР° РЅСѓР¶РµРЅ executive advisory РїРѕРІРµСЂС… СѓР¶Рµ СЂР°СЃСЃС‡РёС‚Р°РЅРЅС‹С… metrics;
- РёР· `contracts_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ management-level finance commentary РїРѕ commerce facts;
- РёР· `controller`, РєРѕРіРґР° control exception С‚СЂРµР±СѓРµС‚ executive finance interpretation;
- РёР· `knowledge`, РєРѕРіРґР° corpus retrieval СѓР¶Рµ РЅР°Р№РґРµРЅ Рё РЅСѓР¶РµРЅ finance-advisory СЃР»РѕР№.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- РЅР°Р»РёС‡РёРµ СЃР»РѕРІ `budget`, `portfolio`, `advisory`, `summary` РІРЅСѓС‚СЂРё Р·Р°РїСЂРѕСЃР°, РєРѕС‚РѕСЂС‹Р№ РЅР° СЃР°РјРѕРј РґРµР»Рµ С‚СЂРµР±СѓРµС‚ `compute_plan_fact` РёР»Рё `simulate_scenario`;
- РЅР°Р»РёС‡РёРµ invoice / payment / contract context Р±РµР· СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ advisory-РІРѕРїСЂРѕСЃР°;
- РЅР°Р»РёС‡РёРµ finance route Р±РµР· СЃРјРµРЅС‹ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРіРѕ РґРµР№СЃС‚РІРёСЏ;
- РЅР°Р»РёС‡РёРµ deterministic result, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїСЂРѕСЃРёС‚ РёРјРµРЅРЅРѕ operational execution, Р° РЅРµ commentary.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `finance_advisor`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `economist` РёР»Рё `contracts_agent`.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `FinanceToolsRegistry`
- Р±СѓРґСѓС‰РёР№ finance domain adapter

## 14. Required Context Contract

РљР°Рє canonical runtime contract РЅРµ РѕС„РѕСЂРјР»РµРЅ.

РќР° future/template-СѓСЂРѕРІРЅРµ С„РёРЅР°РЅСЃРѕРІРѕ РїРѕР»РµР·РЅС‹:

- metrics / budget / portfolio context;
- deterministic finance outputs РёР»Рё commerce facts;
- РїРµСЂРёРѕРґ, СЃС†РµРЅР°СЂРёР№ РёР»Рё management question;
- СЏРІРЅС‹Р№ advisory-РІРѕРїСЂРѕСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… canonical runtime intent-РѕРІ СЃРµР№С‡Р°СЃ РЅРµС‚.

Р•СЃС‚СЊ С‚РѕР»СЊРєРѕ template-level semantics РґР»СЏ:

- executive finance advisory;
- budget / portfolio commentary;
- management-ready finance summary.

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… finance-advisory domain РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ С‚Р°РєРёРµ Р±СѓРґСѓС‰РёРµ intent-С‹:

- executive finance commentary;
- management summary РїРѕ metrics;
- portfolio / budget advisory;
- governed advisory handoff support РґР»СЏ finance / contracts / control РєРѕРЅС‚СѓСЂРѕРІ.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `finance_advisor` РІ owner РґР»СЏ `economist` analysis, contracts execution, CRM, agronomy РёР»Рё monitoring.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

РќР° С‚РµРєСѓС‰РµРј СЌС‚Р°РїРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ template-level surface:

- `FinanceToolsRegistry`

Canonical runtime tool surface РІ `rai-chat` РїРѕРєР° РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ finance-advisory-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- executive summary tooling;
- commentary assembly РїРѕРІРµСЂС… deterministic metrics;
- budget / portfolio advisory tooling;
- advisory context preparation.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- payment or booking execution tools;
- contracts execution tools;
- CRM tools;
- agronomy tools;
- monitoring-owner tools.

## 17. UI surface

- РџРѕРєР° С‚РѕР»СЊРєРѕ onboarding.
- Full finance advisor windows РЅРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹.

## 18. Guardrails

- РўРѕР»СЊРєРѕ advisory.
- `financial_actions_disallowed`
- `no_payment_or_booking_writes`

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РџСѓС‚Р°РЅРёС†Р° РјРµР¶РґСѓ `finance_advisor` Рё `economist`.
- РЎРєСЂС‹С‚Р°СЏ РїРѕРїС‹С‚РєР° СЃРґРµР»Р°С‚СЊ runtime-РґСѓР±Р»СЊ СЌРєРѕРЅРѕРјРёСЃС‚Р° Р±РµР· ownership split.
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ СЃРѕРІРµС‚РЅРёРєР° РєР°Рє transaction actor.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- Template validation.
- Governance validation.
- Р’ Р±СѓРґСѓС‰РµРј: routing, evidence, no-write regression.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- РћС‚РґРµР»СЊРЅС‹Р№ role contract.
- РЇСЃРЅРѕРµ СЂР°Р·РіСЂР°РЅРёС‡РµРЅРёРµ СЃ `economist`.
- No-write governance.
- Deterministic evidence path.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)


