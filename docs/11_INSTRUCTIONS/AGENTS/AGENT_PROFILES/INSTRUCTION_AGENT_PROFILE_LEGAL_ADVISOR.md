﻿---
id: DOC-INS-AGT-PROFILE-009
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ LEGAL_ADVISOR

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ plan/template-role `legal_advisor`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РїСЂРё РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёРё СЋСЂРёРґРёС‡РµСЃРєРѕРіРѕ owner-agent РёР»Рё legal handoff РёР· РґСЂСѓРіРёС… РєРѕРЅС‚СѓСЂРѕРІ.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РїР»Р°РЅРѕРІР°СЏ template/future role.
- Runtime family: РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain РІ template: `legal`.
- Execution adapter: `knowledge`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

Р РѕР»СЊ РЅСѓР¶РЅР° РґР»СЏ:

- Р°РЅР°Р»РёР·Р° СѓСЃР»РѕРІРёР№ Рё РѕРіРѕРІРѕСЂРѕРє;
- legal risk review;
- policy/corpus grounding;
- evidence-first advisory Р±РµР· Р°РІС‚РѕРЅРѕРјРЅС‹С… РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІ.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

Р’ РєРѕРґРµ РµСЃС‚СЊ template СЃ:

- `ownerDomain: legal`
- `LegalToolsRegistry`
- `legal_corpus` connector
- strict advisory governance

РќРµС‚:

- canonical runtime role;
- legal routing owner;
- production legal tool surface РІ `rai-chat`.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- clauses;
- policies;
- legal requirements;
- legal risk commentary;
- legal interpretation Рё compliance commentary РєР°Рє advisory-only СЃР»РѕР№, Р° РЅРµ execution-layer.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р”Р°РІР°С‚СЊ evidence-based legal advisory.
- РџРѕРєР°Р·С‹РІР°С‚СЊ РёСЃС‚РѕС‡РЅРёРєРё Рё uncertainty.
- РћСЃС‚Р°РІР°С‚СЊСЃСЏ advisory-only.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- РџСЂРёРЅРёРјР°С‚СЊ СЋСЂРёРґРёС‡РµСЃРєРёРµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР° РѕС‚ РёРјРµРЅРё РєРѕРјРїР°РЅРёРё.
- Р‘СЂР°С‚СЊ ownership contract execution С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РІ Р·Р°РїСЂРѕСЃРµ РµСЃС‚СЊ clause, compliance РёР»Рё legal risk.
- РџРѕРґРјРµРЅСЏС‚СЊ contract-owner РёР»Рё external counsel.
- РџСЂРёС‚РІРѕСЂСЏС‚СЊСЃСЏ production-ready runtime owner, РїРѕРєР° canonical legal family РЅРµ РїРѕРґРЅСЏС‚Р°.
- Р’С‹РїРѕР»РЅСЏС‚СЊ CRM, finance РёР»Рё agronomy ownership.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current state РЅР° template-СѓСЂРѕРІРЅРµ:

- template manifest РґР»СЏ `legal_advisor`;
- governance defaults Рё advisory-only policy;
- adapter binding Рє `knowledge`;
- `LegalToolsRegistry` РЅР° template-СѓСЂРѕРІРЅРµ;
- `legal_corpus` connector РЅР° template-СѓСЂРѕРІРЅРµ;
- future-role semantics РґР»СЏ clause risk, policy review Рё compliance commentary.

Р§С‚Рѕ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ СЃРµР№С‡Р°СЃ РєР°Рє runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- canonical runtime family;
- РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ legal intent catalog РІ `rai-chat`;
- production legal tool surface;
- direct production routing РІ `legal_advisor` РєР°Рє РІ `primary owner-agent`.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

- Clause risk review;
- contract clause commentary;
- policy and regulation grounding;
- compliance interpretation;
- governed advisory handoff РґР»СЏ РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ Рё communication РєРѕРЅС‚СѓСЂРѕРІ;
- legal summary Рё uncertainty commentary РїРѕРІРµСЂС… corpus evidence.

Р РѕР»СЊ РЅРµ РґРѕР»Р¶РЅР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- contract execution ownership;
- CRM, finance РёР»Рё agronomy ownership;
- autonomous legal commitments;
- РїРѕРґРјРµРЅС‹ external counsel РёР»Рё human legal review.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РўРѕР»СЊРєРѕ С‡РµСЂРµР· future-role onboarding.
- РљР°Рє runtime owner-agent РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅ.
- Р”Рѕ canonical enablement direct production routing РІ `legal_advisor` Р·Р°РїСЂРµС‰С‘РЅ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `knowledge`: С‚РµРєСѓС‰РµРµ adapter inheritance.
- РЎ `contracts_agent`: РЅРµРѕР±С…РѕРґРёРјС‹Р№ legal handoff РґР»СЏ clause review, compliance Рё legal risk commentary.
- РЎ `crm_agent`: РІРѕР·РјРѕР¶РµРЅ handoff РїРѕ СЋСЂРёРґРёС‡РµСЃРєРёРј Р°СЃРїРµРєС‚Р°Рј РєРѕРЅС‚СЂР°РіРµРЅС‚Р°, РЅРѕ РЅРµ ownership.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`legal_advisor` РјРѕР¶РµС‚ Р±С‹С‚СЊ owner С‚РѕР»СЊРєРѕ standalone legal/advisory-Р·Р°РїСЂРѕСЃР°, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє legal interpretation:

- СЂР°Р·РѕР±СЂР°С‚СЊ clause risk;
- РїСЂРѕРІРµСЂРёС‚СЊ С‚СЂР°РєС‚РѕРІРєСѓ СѓСЃР»РѕРІРёСЏ;
- РІС‹РїРѕР»РЅРёС‚СЊ policy review;
- РґР°С‚СЊ compliance commentary;
- РѕР±СЉСЏСЃРЅРёС‚СЊ legal risk РїРѕ РґРѕРєСѓРјРµРЅС‚Сѓ РёР»Рё СѓСЃР»РѕРІРёСЋ.

Р”Р°Р¶Рµ РІ СЌС‚РёС… СЃР»СѓС‡Р°СЏС… РґРѕ canonical enablement direct production routing РІ `legal_advisor` РѕСЃС‚Р°С‘С‚СЃСЏ Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рј. РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ РґРѕР»Р¶РµРЅ С‚СЂР°РєС‚РѕРІР°С‚СЊ СЌС‚Рѕ РєР°Рє future advisory-path, Р° РЅРµ РєР°Рє СѓР¶Рµ РґРѕСЃС‚СѓРїРЅС‹Р№ runtime owner.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `legal_advisor`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ execution:

- СЃРѕР·РґР°С‚СЊ РёР»Рё РёСЃРїРѕР»РЅРёС‚СЊ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РѕР±СЉРµРєС‚;
- РёР·РјРµРЅРёС‚СЊ contract lifecycle state;
- РїСЂРѕРІРµСЃС‚Рё invoice РёР»Рё payment РґРµР№СЃС‚РІРёРµ;
- РѕР±РЅРѕРІРёС‚СЊ CRM-record;
- РІС‹РїРѕР»РЅРёС‚СЊ agronomy РёР»Рё finance action.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `legal_advisor` РёРЅС‚РµСЂРїСЂРµС‚РёСЂСѓРµС‚ clause, policy Рё compliance risk;
- `contracts_agent` РІР»Р°РґРµРµС‚ contract execution;
- `knowledge` РІР»Р°РґРµРµС‚ corpus retrieval Рё evidence lookup;
- `legal_advisor` РЅРµ СЂР°РІРµРЅ external counsel Рё РЅРµ Р·Р°РјРµРЅСЏРµС‚ human legal authority.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· `contracts_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ clause review, legal commentary РёР»Рё compliance analysis;
- РёР· `front_office_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ СЋСЂРёРґРёС‡РµСЃРєРёР№ СЂР°Р·Р±РѕСЂ РєРѕРјРјСѓРЅРёРєР°С†РёРё;
- РёР· `crm_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ legal Р°СЃРїРµРєС‚ РїРѕ РєРѕРЅС‚СЂР°РіРµРЅС‚Сѓ РёР»Рё РґРѕРєСѓРјРµРЅС‚Сѓ;
- РёР· `knowledge`, РєРѕРіРґР° retrieval СѓР¶Рµ РЅР°Р№РґРµРЅ Рё РЅСѓР¶РµРЅ РёРјРµРЅРЅРѕ legal interpretation.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- СЃР°Рј С„Р°РєС‚, С‡С‚Рѕ Р·Р°РїСЂРѕСЃ РѕС‚РєСЂС‹С‚ РІ contract route;
- РЅР°Р»РёС‡РёРµ clause, compliance РёР»Рё policy СЃР»РѕРІР° РІРЅСѓС‚СЂРё execution-Р·Р°РїСЂРѕСЃР°;
- РЅР°Р»РёС‡РёРµ РґРѕРєСѓРјРµРЅС‚Р° Р±РµР· Р·Р°РїСЂРѕСЃР° РЅР° РїСЂР°РІРѕРІСѓСЋ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёСЋ;
- РЅР°Р»РёС‡РёРµ legal corpus evidence Р±РµР· СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ legal question.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `legal_advisor`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `contracts_agent` РёР»Рё РґСЂСѓРіРѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `LegalToolsRegistry`
- `legal_corpus`

## 14. Required Context Contract

РљР°Рє canonical runtime contract РЅРµ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ.

РќР° future/template-СѓСЂРѕРІРЅРµ СЋСЂРёРґРёС‡РµСЃРєРё РїРѕР»РµР·РЅС‹:

- clause / document reference;
- policy or corpus reference;
- jurisdiction / compliance context;
- СЏРІРЅС‹Р№ legal question РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… canonical runtime intent-РѕРІ СЃРµР№С‡Р°СЃ РЅРµС‚.

Р•СЃС‚СЊ С‚РѕР»СЊРєРѕ template-level semantics РґР»СЏ:

- clause risk review;
- policy review;
- compliance commentary;
- legal summary.

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… legal-domain РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ С‚Р°РєРёРµ Р±СѓРґСѓС‰РёРµ intent-С‹:

- clause interpretation;
- policy and regulation review;
- compliance commentary;
- legal risk summary;
- governed advisory handoff support РґР»СЏ РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ Рё РєРѕРјРјСѓРЅРёРєР°С†РёРѕРЅРЅРѕРіРѕ РєРѕРЅС‚СѓСЂРѕРІ.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `legal_advisor` РІ owner РґР»СЏ contracts execution, CRM, finance РёР»Рё agronomy.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

РќР° С‚РµРєСѓС‰РµРј СЌС‚Р°РїРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ template-level surface:

- `LegalToolsRegistry`
- `legal_corpus` connector

Canonical runtime tool surface РІ `rai-chat` РїРѕРєР° РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ legal-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- clause analysis tooling;
- policy / regulation lookup tooling;
- compliance interpretation tooling;
- legal evidence assembly.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- contracts execution tools;
- CRM tools;
- finance-owner tools;
- agronomy-owner tools.

## 17. UI surface

- РџРѕРєР° С‚РѕР»СЊРєРѕ onboarding.
- Legal work windows РµС‰С‘ РЅРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹.

## 18. Guardrails

- `legal_decisions_require_human_review`
- `no_autonomous_legal_commitments`
- С‚РѕР»СЊРєРѕ advisory path

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РџСѓС‚Р°РЅРёС†Р° РјРµР¶РґСѓ advisory Рё legal authority.
- РџРѕРїС‹С‚РєР° Р·Р°РєСЂС‹С‚СЊ contract ownership РѕРґРЅРѕР№ only-template role.
- РћС‚СЃСѓС‚СЃС‚РІРёРµ canonical legal owner РїСЂРё РЅР°Р»РёС‡РёРё РїСЂРѕРґСѓРєС‚Р° Рё РјРѕРґСѓР»РµР№.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- Template validation.
- Governance validation.
- Р’ Р±СѓРґСѓС‰РµРј: clause regression set Рё corpus grounding tests.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Canonical runtime role.
- Legal contracts Рё routing owner.
- Corpus-backed evidence path.
- Р–С‘СЃС‚РєРёР№ human review gate.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)

