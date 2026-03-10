---
id: DOC-INS-AGT-PROFILE-010
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ CONTROLLER

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ template-role `controller`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РїСЂРё РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёРё control owner-agent, РєРѕС‚РѕСЂС‹Р№ РѕС‚РІРµС‡Р°РµС‚ Р·Р° СЃРІРµСЂРєРё, exception review Рё governed escalation, РЅРѕ РЅРµ РїРѕРґРјРµРЅСЏРµС‚ СЃРѕР±РѕР№ `monitoring` РёР»Рё `economist`.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РїР»Р°РЅРѕРІР°СЏ template/future role.
- Runtime family: РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain РІ template: `finance`.
- Execution adapter: `monitoring`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

Р РѕР»СЊ РЅСѓР¶РЅР° РєР°Рє РєРѕРЅС‚СЂРѕР»СЊРЅС‹Р№ РєРѕРЅС‚СѓСЂ РїРѕРІРµСЂС… signal Рё finance evidence:

- СЃРІРµСЂРєРё;
- control exceptions;
- governed escalation;
- quality / compliance follow-up;
- evidence-backed control commentary Р±РµР· Р°РІС‚РѕРЅРѕРјРЅРѕРіРѕ РёСЃРїРѕР»РЅРµРЅРёСЏ.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ РєР°Рє onboarding template:

- `ownerDomain: finance`
- `executionAdapterRole: monitoring`
- `profileId: controller-runtime-v1`
- `FinanceToolsRegistry`
- `RiskToolsRegistry`
- `controller-v1` output contract
- `controller-governance-v1`
- human gate rule `escalations_require_review_for_writes`
- critical action rule `deny_unreviewed_postings`
- fallback rule `use_controls_summary_if_llm_unavailable`

Canonical runtime role РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅР°.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- control;
- reconciliation;
- exception review;
- governed escalation;
- control interpretation РїРѕРІРµСЂС… signal Рё finance evidence РєР°Рє advisory/control layer, Р° РЅРµ РєР°Рє primary execution layer.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р’С‹РґРµР»СЏС‚СЊ control exceptions Рё РѕС‚РєР»РѕРЅРµРЅРёСЏ.
- Р’РѕР·РІСЂР°С‰Р°С‚СЊ evidence-backed control summary.
- РћС‚РґРµР»СЏС‚СЊ signal, exception Рё recommended follow-up.
- Р­СЃРєР°Р»РёСЂРѕРІР°С‚СЊ write-С‚СЂРµР±РѕРІР°РЅРёСЏ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· governed review.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р”РµР»Р°С‚СЊ uncontrolled postings РёР»Рё Р»СЋР±С‹Рµ unreviewed writes.
- Р‘СЂР°С‚СЊ ownership РїРѕ `emit_alerts`, `compute_plan_fact`, `simulate_scenario` РёР»Рё `compute_risk_assessment` С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ Р·Р°РїСЂРѕСЃ РѕС„РѕСЂРјР»РµРЅ РєР°Рє РєРѕРЅС‚СЂРѕР»СЊРЅС‹Р№.
- РџРѕРґРјРµРЅСЏС‚СЊ `monitoring` РІ signal review РёР»Рё `economist` РІ deterministic finance analysis.
- РџСЂРёС‚РІРѕСЂСЏС‚СЊСЃСЏ production-ready runtime owner, РїРѕРєР° canonical control family РЅРµ РїРѕРґРЅСЏС‚Р°.
- РЎР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕ РёСЃРїРѕР»РЅСЏС‚СЊ РєСЂРёС‚РёС‡РµСЃРєРёРµ business actions РІ CRM, contracts, finance РёР»Рё agronomy.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current state РЅР° template-СѓСЂРѕРІРЅРµ:

- template manifest РґР»СЏ `controller`;
- runtime defaults РґР»СЏ Р±СѓРґСѓС‰РµРіРѕ control-РєРѕРЅС‚СѓСЂР°;
- adapter binding Рє `monitoring`;
- `FinanceToolsRegistry` Рё `RiskToolsRegistry` РЅР° template-СѓСЂРѕРІРЅРµ;
- `controller-v1` output contract СЃ СЃРµРєС†РёСЏРјРё `signal_summary`, `exceptions`, `recommended_actions`, `evidence`;
- memory policy `controller-memory-v1` СЃ scoped recall Рё append-only summary write;
- governance defaults РґР»СЏ governed escalation Рё no-write control contour;
- optional `controller-domain-adapter` РґР»СЏ СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅРЅС‹С… РёСЃРєР»СЋС‡РµРЅРёР№ РґРІРёР¶РєРѕРІ СЃРІРµСЂРєРё.

Р§С‚Рѕ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ СЃРµР№С‡Р°СЃ РєР°Рє runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- canonical runtime family;
- РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅС‹Р№ control intent catalog РІ `rai-chat`;
- production control tool surface, РѕС‚РґРµР»С‘РЅРЅС‹Р№ РѕС‚ `monitoring`;
- direct production routing РІ `controller` РєР°Рє РІ `primary owner-agent`.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

- Reconciliation exception review;
- governed escalation preparation;
- control summary РїРѕ finance Рё monitoring evidence;
- exception triage Рё grouping;
- control follow-up recommendations Р±РµР· write-РёСЃРїРѕР»РЅРµРЅРёСЏ;
- advisory/control handoff РґР»СЏ finance Рё signal РєРѕРЅС‚СѓСЂРѕРІ.

Р РѕР»СЊ РЅРµ РґРѕР»Р¶РЅР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- signal ownership Сѓ `monitoring`;
- deterministic finance analysis Сѓ `economist`;
- executive finance commentary Сѓ `finance_advisor`;
- contract, CRM, agronomy РёР»Рё payment execution;
- СЃРєСЂС‹С‚РѕРіРѕ runtime-РґСѓР±Р»СЏ `monitoring` РёР»Рё `economist`.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РЎРµР№С‡Р°СЃ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· future-role onboarding.
- Р’ canonical runtime topology РєР°Рє РѕС‚РґРµР»СЊРЅР°СЏ family РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚.
- Р”Рѕ canonical enablement direct production routing РІ `controller` Р·Р°РїСЂРµС‰С‘РЅ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `monitoring`: С‚РµРєСѓС‰РµРµ adapter inheritance Рё Р±СѓРґСѓС‰РёР№ handoff РїРѕ СЃРёРіРЅР°Р»Р°Рј, РєРѕС‚РѕСЂС‹Рµ С‚СЂРµР±СѓСЋС‚ control interpretation.
- РЎ `economist`: Р±СѓРґСѓС‰РёР№ handoff РїРѕ finance exceptions Рё deterministic follow-up.
- РЎ `finance_advisor`: Р±СѓРґСѓС‰РёР№ advisory handoff РїРѕ executive control commentary.
- РЎ `knowledge`: evidence lookup Рё policy grounding Р±РµР· РїРµСЂРµРґР°С‡Рё control ownership.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`controller` РјРѕР¶РµС‚ Р±С‹С‚СЊ owner С‚РѕР»СЊРєРѕ standalone control/advisory-Р·Р°РїСЂРѕСЃР°, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє control interpretation:

- СЂР°Р·РѕР±СЂР°С‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚С‹ СЃРІРµСЂРєРё;
- РѕР±СЉСЏСЃРЅРёС‚СЊ control exception;
- СЃРѕР±СЂР°С‚СЊ governed escalation summary;
- РІС‹РґРµР»РёС‚СЊ СЃРїРёСЃРѕРє РѕС‚РєР»РѕРЅРµРЅРёР№ Рё evidence;
- РґР°С‚СЊ control follow-up recommendation Р±РµР· РёСЃРїРѕР»РЅРµРЅРёСЏ write-РґРµР№СЃС‚РІРёСЏ.

Р”Р°Р¶Рµ РІ СЌС‚РёС… СЃР»СѓС‡Р°СЏС… РґРѕ canonical enablement direct production routing РІ `controller` РѕСЃС‚Р°С‘С‚СЃСЏ Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рј. РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ РґРѕР»Р¶РµРЅ С‚СЂР°РєС‚РѕРІР°С‚СЊ СЌС‚Рѕ РєР°Рє future control-path, Р° РЅРµ РєР°Рє СѓР¶Рµ РґРѕСЃС‚СѓРїРЅС‹Р№ runtime owner.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `controller`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ runtime owner:

- РїСЂРѕСЃРјРѕС‚СЂРµС‚СЊ alert stream, signal summary РёР»Рё incident contour;
- РІС‹РїРѕР»РЅРёС‚СЊ `emit_alerts` РёР»Рё signal correlation;
- РїРѕСЃС‡РёС‚Р°С‚СЊ plan/fact;
- РІС‹РїРѕР»РЅРёС‚СЊ scenario simulation;
- РІС‹РїРѕР»РЅРёС‚СЊ finance risk assessment;
- РїСЂРѕРІРµСЃС‚Рё invoice, payment, booking РёР»Рё contract action;
- РёР·РјРµРЅРёС‚СЊ CRM, agronomy РёР»Рё front-office state.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `controller` РЅСѓР¶РµРЅ РґР»СЏ control interpretation, reconciliation exceptions Рё governed escalation;
- `monitoring` РІР»Р°РґРµРµС‚ СЃРёРіРЅР°Р»Р°РјРё, alerts, incident review Рё risk contour;
- `economist` РІР»Р°РґРµРµС‚ deterministic finance analysis Рё economic interpretation;
- `finance_advisor` РІ Р±СѓРґСѓС‰РµРј РЅСѓР¶РµРЅ РґР»СЏ executive finance commentary, Р° РЅРµ РґР»СЏ control exception ownership;
- `knowledge` РІР»Р°РґРµРµС‚ retrieval Рё grounding, РЅРѕ РЅРµ control ownership.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· `monitoring`, РєРѕРіРґР° signal review С‚СЂРµР±СѓРµС‚ control reconciliation layer;
- РёР· `economist`, РєРѕРіРґР° deterministic finance output С‚СЂРµР±СѓРµС‚ control exception review;
- РёР· `finance_advisor`, РєРѕРіРґР° executive finance commentary С‚СЂРµР±СѓРµС‚ exception-backed control detail;
- РёР· `knowledge`, РєРѕРіРґР° retrieval СѓР¶Рµ РЅР°Р№РґРµРЅ Рё РЅСѓР¶РµРЅ РёРјРµРЅРЅРѕ control interpretation;
- РІ `economist`, РєРѕРіРґР° control exception С‚СЂРµР±СѓРµС‚ finance follow-up;
- РІ `monitoring`, РєРѕРіРґР° control summary СѓРїРёСЂР°РµС‚СЃСЏ РІ signal correlation РёР»Рё incident contour.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- РЅР°Р»РёС‡РёРµ СЃР»РѕРІ `control`, `exception`, `risk`, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРѕ СЃСѓС‚Рё РїСЂРѕСЃРёС‚ `emit_alerts`;
- РЅР°Р»РёС‡РёРµ finance-РјРµС‚СЂРёРє Р±РµР· СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ Р·Р°РїСЂРѕСЃР° РЅР° СЃРІРµСЂРєСѓ РёР»Рё exception review;
- РЅР°Р»РёС‡РёРµ monitoring route Р±РµР· СЃРјРµРЅС‹ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРіРѕ РґРµР№СЃС‚РІРёСЏ;
- РЅР°Р»РёС‡РёРµ escalation wording РІРЅСѓС‚СЂРё execution-Р·Р°РїСЂРѕСЃР° РґСЂСѓРіРѕРіРѕ РґРѕРјРµРЅР°;
- РЅР°Р»РёС‡РёРµ governance РёР»Рё compliance СЃР»РѕРІ Р±РµР· Р·Р°РїСЂРѕСЃР° РёРјРµРЅРЅРѕ РЅР° control summary.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `controller`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `monitoring`, `economist` РёР»Рё РґСЂСѓРіРѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `FinanceToolsRegistry`
- `RiskToolsRegistry`
- Р±СѓРґСѓС‰РёР№ `controller-domain-adapter`

## 14. Required Context Contract

РљР°Рє canonical runtime contract РЅРµ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ.

РќР° future/template-СѓСЂРѕРІРЅРµ РґР»СЏ control-СЂР°Р·Р±РѕСЂР° РїРѕР»РµР·РЅС‹:

- structured exception set РёР»Рё reconciliation output;
- signal summary РёР»Рё alert context;
- period / scope / tenant context;
- evidence Рё gate status;
- СЏРІРЅС‹Р№ РІРѕРїСЂРѕСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїСЂРѕ control review, escalation РёР»Рё exception interpretation.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… canonical runtime intent-РѕРІ СЃРµР№С‡Р°СЃ РЅРµС‚.

Р•СЃС‚СЊ С‚РѕР»СЊРєРѕ template-level semantics РґР»СЏ:

- control summary;
- reconciliation exception review;
- governed escalation preparation;
- evidence-backed recommended actions.

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… control-domain РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ С‚Р°РєРёРµ Р±СѓРґСѓС‰РёРµ intent-С‹:

- review_control_exceptions;
- summarize_reconciliation_results;
- prepare_governed_escalation;
- explain_control_deviation;
- governed advisory handoff support РґР»СЏ finance Рё monitoring РєРѕРЅС‚СѓСЂРѕРІ.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `controller` РІ owner РґР»СЏ `emit_alerts`, `compute_plan_fact`, `simulate_scenario`, contract execution, CRM, agronomy РёР»Рё front-office actions.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

РќР° С‚РµРєСѓС‰РµРј СЌС‚Р°РїРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ template-level surface:

- `FinanceToolsRegistry`
- `RiskToolsRegistry`

Canonical runtime tool surface РІ `rai-chat` РїРѕРєР° РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ control-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- reconciliation summary tooling;
- exception clustering tooling;
- escalation preparation tooling;
- evidence assembly РїРѕ control contour.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- monitoring-owner tools РґР»СЏ alert emission Рё incident ownership;
- economist-owner tools РґР»СЏ plan/fact Рё deterministic simulation;
- contracts execution tools;
- CRM tools;
- agronomy tools;
- write-РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹ РґР»СЏ postings РёР»Рё unreviewed actions.

## 17. UI surface

- РџРѕРєР° С‚РѕР»СЊРєРѕ onboarding.
- РћС‚РґРµР»СЊРЅС‹Рµ control work windows РµС‰С‘ РЅРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РєРѕРґРѕРј.

## 18. Guardrails

- `escalations_require_review_for_writes`
- `deny_unreviewed_postings`
- trace/evidence/validation/gate_status required
- С‚РѕР»СЊРєРѕ governed control path

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РЎРјРµС€РёРІР°РЅРёРµ control summary СЃ monitoring signal ownership.
- РџРѕРґРјРµРЅР° `economist` С‡РµСЂРµР· РїСЃРµРІРґРѕ-control Р·Р°РїСЂРѕСЃС‹ РЅР° deterministic finance analysis.
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ role РєР°Рє СЃРєСЂС‹С‚РѕРіРѕ write-agent.
- РћС‚СЃСѓС‚СЃС‚РІРёРµ formalized runtime ownership contract РїСЂРё РЅР°Р»РёС‡РёРё template semantics.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- Template validation.
- Governance validation.
- Output contract validation.
- РџРѕСЃР»Рµ enablement: routing, exception handling, no-write Рё escalation regression tests.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Canonical runtime family.
- РЇСЃРЅРѕРµ СЂР°Р·РіСЂР°РЅРёС‡РµРЅРёРµ СЃ `monitoring` Рё `economist`.
- Structured exception model.
- Control-specific intent contract.
- Smoke-СЃС†РµРЅР°СЂРёРё РїРѕ СЃРІРµСЂРєР°Рј, exception review Рё governed escalation.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)

