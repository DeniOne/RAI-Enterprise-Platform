---
id: DOC-INS-AGT-PROFILE-003
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ KNOWLEDGE

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ Р·РѕРЅСѓ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё Рё РѕРіСЂР°РЅРёС‡РµРЅРёСЏ Р°РіРµРЅС‚Р° `knowledge`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР°:

- РїСЂРѕРµРєС‚РёСЂСѓРµС‚СЃСЏ knowledge / RAG СЃС†РµРЅР°СЂРёР№;
- РЅСѓР¶РЅРѕ РїРѕРЅСЏС‚СЊ, РјРѕР¶РµС‚ Р»Рё РґРѕРјРµРЅРЅС‹Р№ Р°РіРµРЅС‚ РїРµСЂРµРґР°С‚СЊ РІРѕРїСЂРѕСЃ РІ knowledge РєРѕРЅС‚СѓСЂ;
- РѕС†РµРЅРёРІР°РµС‚СЃСЏ СЂРёСЃРє РїРѕРґРјРµРЅС‹ operational owners knowledge-Р°РіРµРЅС‚РѕРј.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ runtime-Р°РіРµРЅС‚.
- Runtime family: СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain: `knowledge`.
- Adapter role: `knowledge`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

РџРѕ Stage 2 `knowledge` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ:

- РёСЃС‚РѕС‡РЅРёРєРѕРј grounding;
- RAG-owner РґР»СЏ РґРѕРєСѓРјРµРЅС‚РѕРІ, РїРѕР»РёС‚РёРє Рё СЂРµРіР»Р°РјРµРЅС‚РѕРІ;
- Р°РіРµРЅС‚РѕРј РґРѕРєР°Р·Р°С‚РµР»СЊРЅРѕР№ РїР°РјСЏС‚Рё Рё retrieval-РїРѕРёСЃРєР°;
- read-oriented РєРѕРЅС‚СѓСЂРѕРј, РєРѕС‚РѕСЂС‹Р№ РЅРµ РїРѕРґРјРµРЅСЏРµС‚ operational owners.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РµСЂРµР·:

- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [knowledge-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/knowledge-agent.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Р¤Р°РєС‚РёС‡РµСЃРєРё СЃРµР№С‡Р°СЃ РїРѕРєСЂС‹РІР°РµС‚ intent:

- `query_knowledge`

РСЃРїРѕР»РЅРµРЅРёРµ РёРґС‘С‚ С‡РµСЂРµР· `KnowledgeToolsRegistry`.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- РґРѕРєСѓРјРµРЅС‚С‹;
- РїРѕР»РёС‚РёРєРё;
- СЂРµРіР»Р°РјРµРЅС‚С‹;
- С„СЂР°РіРјРµРЅС‚С‹ knowledge-base;
- grounding РґР»СЏ РґСЂСѓРіРёС… РєРѕРЅС‚СѓСЂРѕРІ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ;
- retrieval Рё evidence-layer РєР°Рє read-only РєРѕРЅС‚СѓСЂ, Р° РЅРµ operational execution.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р’С‹РїРѕР»РЅСЏС‚СЊ evidence-based retrieval.
- РџРѕРєР°Р·С‹РІР°С‚СЊ uncertainty РїСЂРё СЃР»Р°Р±РѕРј СЃРѕРІРїР°РґРµРЅРёРё.
- РќРµ РІС‹С…РѕРґРёС‚СЊ Р·Р° РїСЂРµРґРµР»С‹ read / retrieval ownership.
- Р’РѕР·РІСЂР°С‰Р°С‚СЊ grounded summary РІРјРµСЃС‚Рѕ РІРѕР»СЊРЅРѕР№ РіРµРЅРµСЂР°С†РёРё.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р’С‹РїРѕР»РЅСЏС‚СЊ РѕРїРµСЂР°С†РёРѕРЅРЅС‹Рµ write-РґРµР№СЃС‚РІРёСЏ.
- Р‘СЂР°С‚СЊ ownership С‡СѓР¶РёС… РґРѕРјРµРЅРѕРІ.
- РџРѕРґРјРµРЅСЏС‚СЊ domain result СЃРѕР±СЃС‚РІРµРЅРЅС‹Рј retrieval-РѕС‚РІРµС‚РѕРј, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїСЂРѕСЃРёС‚ business execution РёР»Рё domain analysis.
- РџСЂРёС‚РІРѕСЂСЏС‚СЊСЃСЏ CRM, finance, agro РёР»Рё legal owner-agent.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- knowledge retrieval:
  - `query_knowledge`
- РїРѕРёСЃРє РІ knowledge corpus Рё document fragments;
- С„РѕСЂРјРёСЂРѕРІР°РЅРёРµ grounded РѕС‚РІРµС‚Р° РїРѕ top hits;
- РІРѕР·РІСЂР°С‚ evidences РїРѕ РґРѕРєСѓРјРµРЅС‚РЅС‹Рј С„СЂР°РіРјРµРЅС‚Р°Рј;
- LLM summary С‚РѕР»СЊРєРѕ РїСЂРё РЅР°Р»РёС‡РёРё evidence;
- read-only support РґР»СЏ РґСЂСѓРіРёС… owner-Р°РіРµРЅС‚РѕРІ С‡РµСЂРµР· governed handoff.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

РђРіРµРЅС‚ РјРѕР¶РµС‚ РїРѕРєСЂС‹РІР°С‚СЊ:

- policy lookup;
- grounded summary РїРѕ РєРѕСЂРїСѓСЃСѓ РґРѕРєСѓРјРµРЅС‚РѕРІ;
- cross-domain grounding support С‡РµСЂРµР· governed handoff;
- retrieval-based explanation Рё С†РёС‚РёСЂРѕРІР°РЅРёРµ РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІ;
- corpus-based uncertainty explanation;
- evidence assembly РґР»СЏ handoff Рё policy validation.

РќРµ РґРѕР»Р¶РµРЅ РїРѕРєСЂС‹РІР°С‚СЊ:

- СЃРѕР·РґР°РЅРёРµ РёР»Рё РёР·РјРµРЅРµРЅРёРµ Р±РёР·РЅРµСЃ-СЃСѓС‰РЅРѕСЃС‚РµР№;
- СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРµ РїСЂРёРЅСЏС‚РёРµ РґРѕРјРµРЅРЅС‹С… СЂРµС€РµРЅРёР№;
- РІС‹РїРѕР»РЅРµРЅРёРµ РґРѕРіРѕРІРѕСЂРЅС‹С…, CRM, С„РёРЅР°РЅСЃРѕРІС‹С… РёР»Рё Р°РіСЂРѕРЅРѕРјРёС‡РµСЃРєРёС… РѕРїРµСЂР°С†РёР№.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- Р’С…РѕРґ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· orchestration spine.
- Р’С‹СЃС‚СѓРїР°РµС‚ РєР°Рє owner-agent РґР»СЏ `query_knowledge`.
- РњРѕР¶РµС‚ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ РєР°Рє РІСЃРїРѕРјРѕРіР°С‚РµР»СЊРЅС‹Р№ РєРѕРЅС‚СѓСЂ grounding РґР»СЏ РґСЂСѓРіРёС… Р°РіРµРЅС‚РѕРІ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- `agronomist`, `economist`, `crm_agent`, `monitoring` РјРѕРіСѓС‚ РїРѕР»СѓС‡Р°С‚СЊ evidence С‡РµСЂРµР· governed handoff.
- РџСЂСЏРјРѕР№ peer-to-peer СЂРµР¶РёРј РЅРµ СЏРІР»СЏРµС‚СЃСЏ РЅРѕСЂРјР°С‚РёРІРЅРѕР№ РјРѕРґРµР»СЊСЋ.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`knowledge` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ primary owner, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє retrieval Рё grounding:

- РЅР°Р№С‚Рё РґРѕРєСѓРјРµРЅС‚;
- РЅР°Р№С‚Рё РїРѕР»РёС‚РёРєСѓ РёР»Рё СЂРµРіР»Р°РјРµРЅС‚;
- РІРµСЂРЅСѓС‚СЊ corpus evidence;
- РґР°С‚СЊ grounded summary РїРѕ РґРѕРєСѓРјРµРЅС‚Р°Рј;
- РѕР±СЉСЏСЃРЅРёС‚СЊ, С‡С‚Рѕ РёР·РІРµСЃС‚РЅРѕ РїРѕ knowledge corpus Р±РµР· business execution.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `knowledge`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ СѓР¶Рµ РґРѕРјРµРЅРЅРѕРµ:

- РІС‹РїРѕР»РЅРёС‚СЊ agronomy, finance, CRM РёР»Рё contracts РґРµР№СЃС‚РІРёРµ;
- РґР°С‚СЊ operational recommendation РІРјРµСЃС‚Рѕ document lookup;
- РёРЅС‚РµСЂРїСЂРµС‚РёСЂРѕРІР°С‚СЊ business result РєР°Рє owner-domain conclusion;
- РІС‹РїРѕР»РЅРёС‚СЊ remediation РїРѕ incident РёР»Рё signal.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `knowledge` РІР»Р°РґРµРµС‚ retrieval Рё evidence;
- operational owner РІР»Р°РґРµРµС‚ domain result Рё execution;
- `legal_advisor` РІР»Р°РґРµРµС‚ legal interpretation, Р° РЅРµ corpus lookup РєР°Рє С‚Р°РєРѕРІРѕР№;
- `monitoring` РІР»Р°РґРµРµС‚ signal review, Р° РЅРµ policy corpus РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· `agronomist`, РєРѕРіРґР° РЅСѓР¶РµРЅ СЂРµРіР»Р°РјРµРЅС‚, РЅРѕСЂРјР° РёР»Рё document grounding;
- РёР· `economist`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / corpus grounding РґР»СЏ finance scenario;
- РёР· `crm_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / corpus grounding РїРѕ РєР»РёРµРЅС‚СЃРєРѕРјСѓ РєРµР№СЃСѓ;
- РёР· `contracts_agent`, РєРѕРіРґР° РЅСѓР¶РµРЅ grounding РїРѕ РїРѕР»РёС‚РёРєРµ, РґРѕРєСѓРјРµРЅС‚Сѓ РёР»Рё СѓСЃР»РѕРІРёСЋ;
- РёР· `monitoring`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / incident-rule grounding.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РѕС‚РєСЂС‹С‚ РЅР° route `/knowledge`, РЅРѕ РґРµР№СЃС‚РІРёРµ РїСЂРµРґРјРµС‚РЅРѕ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє РґСЂСѓРіРѕРјСѓ РґРѕРјРµРЅСѓ;
- РІ Р·Р°РїСЂРѕСЃРµ РµСЃС‚СЊ СЃР»РѕРІР° `РїРѕР»РёС‚РёРєР°`, `РґРѕРєСѓРјРµРЅС‚`, `СЂРµРіР»Р°РјРµРЅС‚`, РЅРѕ РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ operational;
- РґРѕРјРµРЅРЅС‹Р№ Р°РіРµРЅС‚ СѓР¶Рµ РІР»Р°РґРµРµС‚ СЃС†РµРЅР°СЂРёРµРј Рё РїСЂРѕСЃРёС‚ С‚РѕР»СЊРєРѕ evidence support;
- retrieval РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РєР°Рє С€Р°Рі РІРЅСѓС‚СЂРё larger domain workflow.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `knowledge`, РµСЃР»Рё РіР»Р°РІРЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ Р·Р°РїСЂРѕСЃР° СѓР¶Рµ РЅРµ retrieval, Р° domain execution РёР»Рё domain analysis.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `KnowledgeToolsRegistry`
- knowledge corpus / documents / policies

## 14. Required Context Contract

- Р‘Р°Р·РѕРІС‹Р№ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚: С‚РµРєСЃС‚РѕРІС‹Р№ `query`.
- Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚ РјРѕР¶РµС‚ РїСЂРёС…РѕРґРёС‚СЊ С‡РµСЂРµР· route Рё workspace, РЅРѕ РЅРµ СЏРІР»СЏРµС‚СЃСЏ Р¶С‘СЃС‚РєРёРј Р±Р»РѕРєРµСЂРѕРј.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

- `query_knowledge`

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… knowledge-domain РґРѕРїСѓСЃС‚РёРјС‹ РґР°Р»СЊРЅРµР№С€РёРµ intent-С‹ С‚РѕР»СЊРєРѕ С‚Р°РєРѕРіРѕ С‚РёРїР°:

- policy lookup;
- document / corpus retrieval;
- grounded summary;
- evidence assembly;
- governed grounding support РґР»СЏ owner-Р°РіРµРЅС‚РѕРІ.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `knowledge` РІ owner РґР»СЏ agronomy, finance, CRM, contracts РёР»Рё monitoring scenarios.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

- `QueryKnowledge`

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ knowledge-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- richer corpus retrieval;
- policy lookup tooling;
- evidence ranking and assembly;
- grounding context preparation.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- CRM tools;
- finance-owner tools;
- agronomy-owner tools;
- contracts execution tools;
- monitoring-owner tools.

## 17. UI surface

- knowledge route;
- result windows СЃ evidence;
- СЃРµРєС†РёРё grounded summary Рё РёСЃС‚РѕС‡РЅРёРєРѕРІ.

## 18. Guardrails

- Р—Р°РїСЂРµС‰РµРЅС‹ operational write paths.
- Р—Р°РїСЂРµС‰РµРЅРѕ РїСЂРёСЃРІР°РёРІР°С‚СЊ ownership С‡СѓР¶РёС… РґРѕРјРµРЅРѕРІ.
- РћС‚РІРµС‚С‹ РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ evidence-first.

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РџРѕРґРјРµРЅР° retrieval СЃРІРѕР±РѕРґРЅРѕР№ РіРµРЅРµСЂР°С†РёРµР№.
- РџСЃРµРІРґРѕ-РїСЂР°РІРѕРІС‹Рµ РёР»Рё РїСЃРµРІРґРѕ-С„РёРЅР°РЅСЃРѕРІС‹Рµ СЃРѕРІРµС‚С‹ Р±РµР· owner handoff.
- РЎР»Р°Р±РѕРµ evidence РєР°С‡РµСЃС‚РІРѕ РїСЂРё РїР»РѕС…РѕРј corpus coverage.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- РўРµСЃС‚С‹ РЅР° `query_knowledge` classification.
- РўРµСЃС‚С‹ РЅР° grounded output Рё evidence generation.
- РўРµСЃС‚С‹ РЅР° РѕС‚СЃСѓС‚СЃС‚РІРёРµ write behaviour.
- РўРµСЃС‚С‹ РЅР° low-hit / zero-hit scenario.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Retrieval СЃС‚Р°Р±РёР»РµРЅ Рё РІРѕСЃРїСЂРѕРёР·РІРѕРґРёРј.
- РћС‚РІРµС‚С‹ РЅРµ РІС‹С…РѕРґСЏС‚ Р·Р° РїСЂРµРґРµР»С‹ evidence.
- РќРµС‚ СЃРєСЂС‹С‚РѕРіРѕ operational ownership.
- Р•СЃС‚СЊ smoke-РЅР°Р±РѕСЂ РЅР° knowledge lookup Рё grounding.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [knowledge-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/knowledge-agent.service.ts)


