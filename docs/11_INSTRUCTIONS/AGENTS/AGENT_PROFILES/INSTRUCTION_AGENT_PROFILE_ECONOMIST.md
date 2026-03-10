---
id: DOC-INS-AGT-PROFILE-002
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ ECONOMIST

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ СЂР°РјРєРё Рё РїСЂРµРґРµР»СЊРЅС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р» Р°РіРµРЅС‚Р° `economist`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР°:

- РґРѕР±Р°РІР»СЏСЋС‚СЃСЏ РЅРѕРІС‹Рµ finance-intent-С‹;
- РѕР±СЃСѓР¶РґР°РµС‚СЃСЏ handoff РјРµР¶РґСѓ `economist` Рё `agronomist`;
- РїСЂРѕРµРєС‚РёСЂСѓСЋС‚СЃСЏ risk- Рё plan/fact-СЃС†РµРЅР°СЂРёРё;
- РЅСѓР¶РЅРѕ РїСЂРѕРІРµСЂРёС‚СЊ, РЅРµ СѓС€С‘Р» Р»Рё Р°РіРµРЅС‚ РІ С‡СѓР¶РѕР№ operational domain.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ runtime-Р°РіРµРЅС‚.
- Runtime family: СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain: `finance`.
- Adapter role: `economist`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

РџРѕ Stage 2 `economist` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ owner-agent РґР»СЏ:

- plan/fact Р°РЅР°Р»РёР·Р°;
- СЃС†РµРЅР°СЂРЅРѕРіРѕ РјРѕРґРµР»РёСЂРѕРІР°РЅРёСЏ;
- РѕС†РµРЅРєРё С„РёРЅР°РЅСЃРѕРІС‹С… Рё СЌРєРѕРЅРѕРјРёС‡РµСЃРєРёС… РєРѕРјРїСЂРѕРјРёСЃСЃРѕРІ;
- deterministic analytics СЃ evidence Рё caveats.

РђРіРµРЅС‚ РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІСЂР°С‰Р°С‚СЊСЃСЏ РІ:

- CRM-РѕРїРµСЂР°С‚РѕСЂР°;
- Р°РіСЂРѕРЅРѕРјР°;
- СЋСЂРёРґРёС‡РµСЃРєРѕРіРѕ СЃРѕРІРµС‚РЅРёРєР°;
- СѓРЅРёРІРµСЂСЃР°Р»СЊРЅРѕРіРѕ knowledge-Р±РѕС‚Р°.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РђРіРµРЅС‚ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РµСЂРµР·:

- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-execution-adapter.service.ts](../../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [economist-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/economist-agent.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Р¤Р°РєС‚РёС‡РµСЃРєРё СЃРµР№С‡Р°СЃ СЂРµР°Р»РёР·РѕРІР°РЅС‹ intent-С‹:

- `compute_plan_fact`
- `simulate_scenario`
- `compute_risk_assessment`

РСЃРїРѕР»РЅРµРЅРёРµ РёРґС‘С‚ С‡РµСЂРµР· `FinanceToolsRegistry`.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- СЌРєРѕРЅРѕРјРёРєР° Рё С„РёРЅР°РЅСЃС‹;
- plan/fact;
- ROI, EBITDA, cost deltas;
- СЃС†РµРЅР°СЂРёРё Рё СЂРёСЃРє-РѕС†РµРЅРєР°;
- С„РёРЅР°РЅСЃРѕРІР°СЏ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёСЏ РїРѕСЃР»РµРґСЃС‚РІРёР№ Р°РіСЂРѕ- Рё РґРѕРіРѕРІРѕСЂРЅС‹С… СЃС†РµРЅР°СЂРёРµРІ РєР°Рє advisory-layer, Р° РЅРµ operational execution.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅС‹Рµ С„РёРЅР°РЅСЃРѕРІС‹Рµ СЂР°СЃС‡С‘С‚С‹ РєР°Рє truth-source.
- Р’РѕР·РІСЂР°С‰Р°С‚СЊ caveats Рё РѕРіСЂР°РЅРёС‡РµРЅРёСЏ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёРё.
- Р—Р°РїСЂР°С€РёРІР°С‚СЊ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚, РµСЃР»Рё Р±РµР· РЅРµРіРѕ СЂР°СЃС‡С‘С‚ РЅРµРІРѕР·РјРѕР¶РµРЅ.
- РќРµ РїРµСЂРµС…РѕРґРёС‚СЊ РІ РѕРїРµСЂР°С†РёРѕРЅРЅС‹Рµ write-РґРµР№СЃС‚РІРёСЏ.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р‘СЂР°С‚СЊ РЅР° СЃРµР±СЏ CRM Рё РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ.
- Р’С‹РїРѕР»РЅСЏС‚СЊ Р°РіСЂРѕРЅРѕРјРёС‡РµСЃРєРёРµ РѕРїРµСЂР°С†РёРё.
- РџРѕРґРјРµРЅСЏС‚СЊ legal Рё knowledge ownership.
- Р‘СЂР°С‚СЊ ownership РїРѕ invoice, payment, AR РёР»Рё contract execution С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїСЂРѕСЃРёС‚ РѕС†РµРЅРёС‚СЊ impact.
- Р‘СЂР°С‚СЊ ownership РїРѕ signal review С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РІ Р·Р°РїСЂРѕСЃРµ РµСЃС‚СЊ СЃР»РѕРІРѕ `risk`.
- Р”РµР»Р°С‚СЊ РїР»Р°С‚С‘Р¶РЅС‹Рµ, СѓС‡С‘С‚РЅС‹Рµ РёР»Рё РёРЅС‹Рµ РєСЂРёС‚РёС‡РЅС‹Рµ write-РґРµР№СЃС‚РІРёСЏ Р±РµР· РѕС‚РґРµР»СЊРЅРѕРіРѕ governed path.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- С„РёРЅР°РЅСЃРѕРІС‹Р№ plan/fact analysis:
  - `compute_plan_fact`
- scenario simulation:
  - `simulate_scenario`
- finance risk assessment:
  - `compute_risk_assessment`
- deterministic execution С‡РµСЂРµР· `FinanceToolsRegistry`;
- `NEEDS_MORE_DATA` РїСЂРё РѕС‚СЃСѓС‚СЃС‚РІРёРё РЅСѓР¶РЅРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р° РґР»СЏ `compute_plan_fact`;
- explainable metrics, caveats Рё summary РїРѕРІРµСЂС… РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅС‹С… СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ;
- advisory interpretation РїРѕ С„РёРЅР°РЅСЃРѕРІС‹Рј РїРѕСЃР»РµРґСЃС‚РІРёСЏРј СѓР¶Рµ РёР·РІРµСЃС‚РЅС‹С… РґРѕРјРµРЅРЅС‹С… СЃС†РµРЅР°СЂРёРµРІ Р±РµР· РїРµСЂРµС…РІР°С‚Р° РёС… execution ownership.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё Р°РіРµРЅС‚ РјРѕР¶РµС‚ РїРѕРєСЂС‹РІР°С‚СЊ:

- СЂР°СЃС€РёСЂРµРЅРЅСѓСЋ С„РёРЅР°РЅСЃРѕРІСѓСЋ Р°РЅР°Р»РёС‚РёРєСѓ;
- portfolio Рё scenario comparison;
- explainable budget deviations;
- economic impact review РґР»СЏ Р°РіСЂРѕ- Рё РґРѕРіРѕРІРѕСЂРЅС‹С… СЂРµС€РµРЅРёР№;
- advisory preparation РґР»СЏ strategy / control follow-up С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ;
- safe handoff РІ strategy РёР»Рё controller РєРѕРЅС‚СѓСЂ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.

РќРµ РґРѕР»Р¶РµРЅ РїРѕРєСЂС‹РІР°С‚СЊ:

- РґРѕРіРѕРІРѕСЂС‹;
- CRM-РєР°СЂС‚РѕС‡РєРё Рё РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏ;
- Р°РіСЂРѕРЅРѕРјРёС‡РµСЃРєРёРµ СЂР°СЃС‡С‘С‚С‹;
- monitoring signal ownership;
- РїСЂРѕРёР·РІРѕР»СЊРЅС‹Р№ non-finance advisory Р±РµР· ownership.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- Р’С‹Р·РѕРІ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ orchestration spine.
- Runtime activation С‡РµСЂРµР· `AgentExecutionAdapterService`.
- Peer-to-peer РјР°СЂС€СЂСѓС‚ Рє РґСЂСѓРіРёРј Р°РіРµРЅС‚Р°Рј РєР°Рє РЅРѕСЂРјР° РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `agronomist`: handoff РґР»СЏ economics follow-up РЅР° РѕСЃРЅРѕРІРµ Р°РіСЂРѕРґР°РЅРЅС‹С….
- РЎ `knowledge`: handoff РґР»СЏ РїРѕР»РёС‚РёРєРё Рё СЂРµРіР»Р°РјРµРЅС‚РѕРІ.
- РЎ `monitoring`: handoff РїРѕ signal escalation РґРѕРїСѓСЃС‚РёРј С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.
- РЎ `crm_agent`: РїСЂСЏРјРѕР№ overlap Р·Р°РїСЂРµС‰С‘РЅ.
- РЎ `contracts_agent`: advisory handoff РїРѕ С„РёРЅР°РЅСЃРѕРІС‹Рј РїРѕСЃР»РµРґСЃС‚РІРёСЏРј РґРѕРіРѕРІРѕСЂР°, СЃС‡РµС‚РѕРІ, РѕРїР»Р°С‚ Рё РґРµР±РёС‚РѕСЂРєРё.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`economist` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ primary owner, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє finance interpretation РёР»Рё finance analysis:

- РїРѕСЃС‡РёС‚Р°С‚СЊ plan/fact;
- СЃСЂР°РІРЅРёС‚СЊ СЃС†РµРЅР°СЂРёРё;
- РѕС†РµРЅРёС‚СЊ budget impact;
- РѕС†РµРЅРёС‚СЊ ROI, EBITDA, cost delta;
- РІС‹РїРѕР»РЅРёС‚СЊ finance risk assessment;
- РѕС†РµРЅРёС‚СЊ С„РёРЅР°РЅСЃРѕРІС‹Рµ РїРѕСЃР»РµРґСЃС‚РІРёСЏ Р°РіСЂРѕ- РёР»Рё РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ СЂРµС€РµРЅРёСЏ Р±РµР· Р·Р°РїСЂРѕСЃР° РЅР° СЃР°РјРѕ РёСЃРїРѕР»РЅРµРЅРёРµ.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `economist`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ operational:

- СЃРѕР·РґР°С‚СЊ РёР»Рё РёР·РјРµРЅРёС‚СЊ РґРѕРіРѕРІРѕСЂ;
- СЃРѕР·РґР°С‚СЊ, РїСЂРѕРІРµСЃС‚Рё РёР»Рё РїРѕРґС‚РІРµСЂРґРёС‚СЊ payment / invoice;
- РїРѕСЃРјРѕС‚СЂРµС‚СЊ operational AR РєР°Рє С‡Р°СЃС‚СЊ contract execution flow;
- РІС‹РїРѕР»РЅРёС‚СЊ РїРѕР»РµРІРѕРµ РґРµР№СЃС‚РІРёРµ, СЃРєРѕСЂСЂРµРєС‚РёСЂРѕРІР°С‚СЊ С‚РµС…РєР°СЂС‚Сѓ РёР»Рё remediation;
- РїРѕРєР°Р·Р°С‚СЊ alert digest РёР»Рё incident summary Р±РµР· finance-analysis.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `economist` РёРЅС‚РµСЂРїСЂРµС‚РёСЂСѓРµС‚ С„РёРЅР°РЅСЃРѕРІС‹Рµ РїРѕСЃР»РµРґСЃС‚РІРёСЏ invoice / payment / AR;
- `contracts_agent` РёСЃРїРѕР»РЅСЏРµС‚ invoice / payment / allocation / AR flow;
- `economist` РёРЅС‚РµСЂРїСЂРµС‚РёСЂСѓРµС‚ СЌРєРѕРЅРѕРјРёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚ Р°РіСЂРѕ-СЂРµС€РµРЅРёСЏ;
- `agronomist` РІР»Р°РґРµРµС‚ РїРѕР»РµРІС‹Рј РґРµР№СЃС‚РІРёРµРј Рё agronomy remediation;
- `economist` Р°РЅР°Р»РёР·РёСЂСѓРµС‚ finance-risk;
- `monitoring` РІР»Р°РґРµРµС‚ signal review Рё incident contour.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· `contracts_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ financial impact РґРѕРіРѕРІРѕСЂР°, СЃС‡С‘С‚Р°, РѕРїР»Р°С‚С‹ РёР»Рё РґРµР±РёС‚РѕСЂРєРё;
- РёР· `agronomist`, РєРѕРіРґР° РЅСѓР¶РµРЅ economics follow-up РїРѕ РїРѕР»СЋ, СЃРµР·РѕРЅСѓ РёР»Рё С‚РµС…РєР°СЂС‚Рµ;
- РёР· `monitoring`, РєРѕРіРґР° СЃРёРіРЅР°Р» С‚СЂРµР±СѓРµС‚ finance interpretation;
- РІ `knowledge`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / corpus grounding.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- СЃР»РѕРІР° `invoice`, `payment`, `AR`, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїСЂРѕСЃРёС‚ РЅРµ Р°РЅР°Р»РёР·, Р° РґРµР№СЃС‚РІРёРµ;
- СЃР»РѕРІР° `field`, `season`, `tech_map`, РµСЃР»Рё РЅСѓР¶РµРЅ agronomy execution, Р° РЅРµ economics review;
- СЃР»РѕРІР° `alert`, `incident`, `signal`, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїСЂРѕСЃРёС‚ monitoring summary, Р° РЅРµ finance conclusion;
- РѕС‚РєСЂС‹С‚РёРµ Р·Р°РїСЂРѕСЃР° РёР· finance route Р±РµР· СЃРјРµРЅС‹ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРіРѕ РґРµР№СЃС‚РІРёСЏ.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `economist`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ РІ `contracts_agent`, `agronomist` РёР»Рё `monitoring`.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `FinanceToolsRegistry`
- deterministic finance contour
- `consulting` / economic analysis modules

## 14. Required Context Contract

- Р”Р»СЏ `compute_plan_fact` РѕР±СЏР·Р°С‚РµР»РµРЅ С…РѕС‚СЏ Р±С‹ `planId` РёР»Рё `seasonId`.
- Р”Р»СЏ СЃС†РµРЅР°СЂРёСЏ Рё СЂРёСЃРєР° С„Р°РєС‚РёС‡РµСЃРєРёР№ РєРѕРЅС‚СЂР°РєС‚ С€РёСЂРµ Рё Р·Р°РІРёСЃРёС‚ РѕС‚ РІС…РѕРґРЅРѕРіРѕ `scope`.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

- `compute_plan_fact`
- `simulate_scenario`
- `compute_risk_assessment`

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… finance-domain РґРѕРїСѓСЃС‚РёРјС‹ РґР°Р»СЊРЅРµР№С€РёРµ intent-С‹ С‚РѕР»СЊРєРѕ С‚Р°РєРѕРіРѕ С‚РёРїР°:

- deeper finance analytics;
- scenario comparison;
- budget / margin / cost interpretation;
- advisory summaries РїРѕ economics impact;
- governed handoff preparation РІ `strategy` РёР»Рё `controller`.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `economist` РІ owner РґР»СЏ contracts execution, agronomy execution, CRM РёР»Рё monitoring.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

- `ComputePlanFact`
- `SimulateScenario`
- `ComputeRiskAssessment`

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ finance-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- deeper deterministic finance analytics;
- scenario comparison tooling;
- budget deviation and metric explanation tooling;
- context-assembly tooling РґР»СЏ advisory follow-up.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- contracts execution tools;
- CRM tools;
- agronomy tools;
- monitoring-owner tools.

## 17. UI surface

- СЂР°Р±РѕС‡РёРµ РѕРєРЅР° СЃ РјРµС‚СЂРёРєР°РјРё;
- СЃРµРєС†РёРё `summary`, `metrics`, `risks`, `caveats`;
- clarification РїСЂРё РЅРµРґРѕСЃС‚Р°С‚РєРµ РєРѕРЅС‚РµРєСЃС‚Р°.

## 18. Guardrails

- Р—Р°РїСЂРµС‰РµРЅС‹ intent-С‹ Р°РіСЂРѕРЅРѕРјРёРё, CRM, knowledge-owner Рё monitoring-owner.
- Р—Р°РїСЂРµС‰РµРЅС‹ operational writes РїРѕ СѓС‡С‘С‚Сѓ Рё РїР»Р°С‚РµР¶Р°Рј.
- РђРіРµРЅС‚ advisory-first Рё grounded-in-metrics.

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- Р¤РёРЅР°РЅСЃРѕРІС‹Рµ РІС‹РІРѕРґС‹ Р±РµР· РґРѕСЃС‚Р°С‚РѕС‡РЅРѕРіРѕ РІС…РѕРґРЅРѕРіРѕ `scope`.
- РЎРјРµС€РµРЅРёРµ СЃС†РµРЅР°СЂРЅРѕРіРѕ advisory Рё СЂРµР°Р»СЊРЅРѕРіРѕ transaction/write path.
- Drift РІ СЃС‚СЂР°С‚РµРіРёСЋ РёР»Рё CRM Р±РµР· ownership.
- РЎР»РёС€РєРѕРј С€РёСЂРѕРєР°СЏ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёСЏ economic risk РєР°Рє РѕР±С‰РµРіРѕ business ownership.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- РљР»Р°СЃСЃРёС„РёРєР°С†РёСЏ РїРѕ РєР°Р¶РґРѕРјСѓ finance-intent.
- `NEEDS_MORE_DATA` РґР»СЏ plan/fact.
- Deterministic execution Рё evidence.
- Guardrail-tests РїСЂРѕС‚РёРІ cross-domain intent-РѕРІ.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Р¤РёРЅР°РЅСЃРѕРІС‹Рµ intent-С‹ РјР°СЂС€СЂСѓС‚РёР·РёСЂСѓСЋС‚СЃСЏ СѓСЃС‚РѕР№С‡РёРІРѕ.
- Р’СЃРµ РѕС‚РІРµС‚С‹ grounded РІ `FinanceToolsRegistry`.
- РќРµС‚ РЅРµСЃР°РЅРєС†РёРѕРЅРёСЂРѕРІР°РЅРЅРѕРіРѕ write-path.
- Р•СЃС‚СЊ smoke-РЅР°Р±РѕСЂ РґР»СЏ plan/fact, scenario Рё risk.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [economist-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/economist-agent.service.ts)

