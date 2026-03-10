﻿---
id: DOC-INS-AGT-PROFILE-006
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ MARKETER

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ plan/template-role `marketer`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РїСЂРё РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёРё marketing owner-agent Рё РїСЂРё СЂР°Р·РІРµРґРµРЅРёРё РіСЂР°РЅРёС† РјРµР¶РґСѓ marketing advisory, CRM ownership Рё knowledge-based retrieval.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РїР»Р°РЅРѕРІР°СЏ template/future role.
- Runtime family: РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅР° РєР°Рє canonical.
- Owner domain РІ template: `marketing`.
- Execution adapter: `knowledge`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

РњР°СЂРєРµС‚РёРЅРіРѕРІС‹Р№ Р°РіРµРЅС‚ РЅСѓР¶РµРЅ РґР»СЏ:

- campaign planning;
- funnel review;
- segment insights;
- messaging recommendations;
- marketing interpretation РїРѕРІРµСЂС… CRM read model Р±РµР· Р°РІС‚РѕРЅРѕРјРЅРѕРіРѕ campaign execution.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ РєР°Рє onboarding template:

- `ownerDomain: marketing`
- `profileId: marketer-runtime-v1`
- `executionAdapterRole: knowledge`
- `MarketingToolsRegistry`
- connector `crm_read_model` РІ СЂРµР¶РёРјРµ `read`
- `marketer-v1` output contract
- `marketer-memory-v1`
- `marketer-governance-v1`
- human gate rule `campaign_launch_requires_human_gate`
- critical action rule `no_unreviewed_writes`
- fallback rule `use_read_model_summary_if_llm_unavailable`
- optional `marketing-domain-adapter`

РќРµ СЂРµР°Р»РёР·РѕРІР°РЅРѕ:

- canonical runtime family;
- РѕС‚РґРµР»СЊРЅС‹Р№ production owner-routing;
- РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ marketing intent catalog РІ `rai-chat`;
- СЂРµР°Р»СЊРЅС‹Р№ runtime tool surface РїРѕРІРµСЂС… template-level semantics.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- marketing;
- campaigns;
- segments;
- funnel review;
- messaging and recommendation layer РїРѕРІРµСЂС… CRM read model, Р° РЅРµ CRM record execution.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р”Р°РІР°С‚СЊ evidence-backed marketing advisory.
- РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ CRM read model РєР°Рє РёСЃС‚РѕС‡РЅРёРє РєРѕРЅС‚РµРєСЃС‚Р°, Р° РЅРµ РєР°Рє write-path.
- РћС‚РґРµР»СЏС‚СЊ recommendations РѕС‚ execution.
- РћСЃС‚Р°РІР°С‚СЊСЃСЏ РІ advisory-only РєРѕРЅС‚СѓСЂРµ.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- РђРІС‚РѕРЅРѕРјРЅРѕ Р·Р°РїСѓСЃРєР°С‚СЊ РєР°РјРїР°РЅРёРё.
- Р”РµР»Р°С‚СЊ uncontrolled writes.
- Р‘СЂР°С‚СЊ ownership РЅР°Рґ CRM record management С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ Р·Р°РїСЂРѕСЃ СЃРІСЏР·Р°РЅ СЃ Р»РёРґР°РјРё, Р°РєРєР°СѓРЅС‚Р°РјРё РёР»Рё СЃРµРіРјРµРЅС‚Р°РјРё.
- РџРѕРґРјРµРЅСЏС‚СЊ `knowledge` РІ retrieval-Р·Р°РґР°С‡Р°С… Рё `crm_agent` РІ РєР°СЂС‚РѕС‡РµС‡РЅС‹С… РґРµР№СЃС‚РІРёСЏС….
- РџСЂРёС‚РІРѕСЂСЏС‚СЊСЃСЏ production-ready runtime owner, РїРѕРєР° canonical marketing family РЅРµ РїРѕРґРЅСЏС‚Р°.
- РЈС…РѕРґРёС‚СЊ РІ finance, contracts РёР»Рё front-office execution Р±РµР· РѕС‚РґРµР»СЊРЅРѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current state РЅР° template-СѓСЂРѕРІРЅРµ:

- template manifest РґР»СЏ `marketer`;
- runtime defaults РґР»СЏ Р±СѓРґСѓС‰РµРіРѕ marketing-РєРѕРЅС‚СѓСЂР°;
- adapter binding Рє `knowledge`;
- `MarketingToolsRegistry` РЅР° template-СѓСЂРѕРІРЅРµ;
- read-only connector `crm_read_model` СЃРѕ scope `campaigns`;
- `marketer-v1` output contract СЃ СЃРµРєС†РёСЏРјРё `summary`, `recommendations`, `risks`, `evidence`, `next_steps`;
- memory policy `marketer-memory-v1` СЃРѕ `scoped_recall`, `append_summary` Рё `mask`;
- governance defaults РґР»СЏ advisory-only marketing path;
- optional `marketing-domain-adapter` РґР»СЏ campaign-specific deterministic enrichments.

Р§С‚Рѕ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ СЃРµР№С‡Р°СЃ РєР°Рє runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- canonical runtime family;
- РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅС‹Р№ marketing intent catalog РІ `rai-chat`;
- production tool surface, РѕС‚РґРµР»С‘РЅРЅС‹Р№ РѕС‚ template profile;
- direct production routing РІ `marketer` РєР°Рє РІ `primary owner-agent`.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

- Campaign planning advisory;
- funnel review;
- messaging recommendations;
- segment and lead insights С‡РµСЂРµР· governed read model;
- marketing summary Рё risk commentary;
- advisory handoff РґР»СЏ CRM Рё knowledge contour.

Р РѕР»СЊ РЅРµ РґРѕР»Р¶РЅР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- CRM ownership Сѓ `crm_agent`;
- retrieval ownership Сѓ `knowledge`;
- finance analysis ownership Сѓ `economist`;
- direct campaign execution;
- contract, front-office РёР»Рё agronomy execution;
- СЃРєСЂС‹С‚РѕРіРѕ runtime-РґСѓР±Р»СЏ `crm_agent`.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РЎРµР№С‡Р°СЃ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· future-role onboarding Рё adapter binding Рє `knowledge`.
- Р’ canonical runtime topology РєР°Рє РѕС‚РґРµР»СЊРЅР°СЏ family РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚.
- Р”Рѕ canonical enablement direct production routing РІ `marketer` Р·Р°РїСЂРµС‰С‘РЅ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `crm_agent`: Р±СѓРґСѓС‰РёР№ governed handoff РїРѕ lead activity, campaign context Рё СЃРµРіРјРµРЅС‚Р°Рј, РєРѕС‚РѕСЂС‹Рµ РїСЂРёРІСЏР·Р°РЅС‹ Рє CRM records.
- РЎ `knowledge`: С‚РµРєСѓС‰РµРµ template execution inheritance Рё retrieval support.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`marketer` РјРѕР¶РµС‚ Р±С‹С‚СЊ owner С‚РѕР»СЊРєРѕ standalone marketing/advisory-Р·Р°РїСЂРѕСЃР°, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє marketing interpretation:

- РїСЂРµРґР»РѕР¶РёС‚СЊ campaign concept;
- СЂР°Р·РѕР±СЂР°С‚СЊ funnel Рё conversion narrative;
- РїРѕРґРіРѕС‚РѕРІРёС‚СЊ messaging recommendations;
- РѕР±СЉСЏСЃРЅРёС‚СЊ segment-specific opportunity;
- СЃРѕР±СЂР°С‚СЊ marketing summary РїРѕ read-model РґР°РЅРЅС‹Рј Р±РµР· CRM write-РґРµР№СЃС‚РІРёСЏ.

Р”Р°Р¶Рµ РІ СЌС‚РёС… СЃР»СѓС‡Р°СЏС… РґРѕ canonical enablement direct production routing РІ `marketer` РѕСЃС‚Р°С‘С‚СЃСЏ Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рј. РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ РґРѕР»Р¶РµРЅ С‚СЂР°РєС‚РѕРІР°С‚СЊ СЌС‚Рѕ РєР°Рє future marketing-path, Р° РЅРµ РєР°Рє СѓР¶Рµ РґРѕСЃС‚СѓРїРЅС‹Р№ runtime owner.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `marketer`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ runtime owner:

- РѕР±РЅРѕРІРёС‚СЊ РєР°СЂС‚РѕС‡РєСѓ РєР»РёРµРЅС‚Р°, account, contact РёР»Рё CRM interaction;
- Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ lead-related РґРµР№СЃС‚РІРёРµ РІ CRM;
- СЃРІСЏР·Р°С‚СЊ РєРѕРЅС‚СЂР°РіРµРЅС‚Р°, relation РёР»Рё obligation РІ CRM-РєРѕРЅС‚СѓСЂРµ;
- РЅР°Р№С‚Рё РґРѕРєСѓРјРµРЅС‚, РїРѕР»РёС‚РёРєСѓ, РёРЅСЃС‚СЂСѓРєС†РёСЋ РёР»Рё corpus evidence;
- РІС‹РїРѕР»РЅРёС‚СЊ front-office, finance, contracts РёР»Рё agronomy action.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `marketer` РЅСѓР¶РµРЅ РґР»СЏ campaign/funnel/segment advisory;
- `crm_agent` РІР»Р°РґРµРµС‚ CRM records, accounts, contacts, interactions Рё CRM follow-up;
- `knowledge` РІР»Р°РґРµРµС‚ retrieval, corpus lookup Рё grounding;
- `marketer` РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІСЂР°С‰Р°С‚СЊСЃСЏ РІ РєР°СЂС‚РѕС‡РµС‡РЅС‹Р№ CRM owner С‚РѕР»СЊРєРѕ РёР·-Р·Р° marketing vocabulary.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· `crm_agent`, РєРѕРіРґР° CRM read model СѓР¶Рµ СЃРѕР±СЂР°РЅ Рё РЅСѓР¶РµРЅ marketing advisory layer;
- РёР· `knowledge`, РєРѕРіРґР° retrieval СѓР¶Рµ РЅР°Р№РґРµРЅ Рё РЅСѓР¶РµРЅ marketing interpretation layer;
- РІ `crm_agent`, РєРѕРіРґР° marketing discussion РїРµСЂРµС…РѕРґРёС‚ РІ РѕР±РЅРѕРІР»РµРЅРёРµ РєР°СЂС‚РѕС‡РєРё, lead activity РёР»Рё client workspace;
- РІ `knowledge`, РєРѕРіРґР° marketing request СѓРїРёСЂР°РµС‚СЃСЏ РІ policy, guideline, corpus lookup РёР»Рё evidence retrieval.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- РЅР°Р»РёС‡РёРµ СЃР»РѕРІ `campaign`, `segment`, `lead`, `funnel`, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРѕ СЃСѓС‚Рё РїСЂРѕСЃРёС‚ CRM-РґРµР№СЃС‚РІРёРµ;
- РЅР°Р»РёС‡РёРµ marketing route Р±РµР· СЃРјРµРЅС‹ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРіРѕ РґРµР№СЃС‚РІРёСЏ;
- РЅР°Р»РёС‡РёРµ read-model summary Р±РµР· СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ advisory-РІРѕРїСЂРѕСЃР°;
- РЅР°Р»РёС‡РёРµ РґРѕРєСѓРјРµРЅС‚Р°, СЂРµРіР»Р°РјРµРЅС‚Р° РёР»Рё policy Р±РµР· Р·Р°РїСЂРѕСЃР° РёРјРµРЅРЅРѕ РЅР° marketing recommendation;
- РЅР°Р»РёС‡РёРµ client context, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ С…РѕС‡РµС‚ РёР·РјРµРЅРёС‚СЊ CRM record, Р° РЅРµ РїРѕР»СѓС‡РёС‚СЊ marketing interpretation.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `marketer`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `crm_agent`, `knowledge` РёР»Рё РґСЂСѓРіРѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `crm_read_model` connector
- `MarketingToolsRegistry`
- Р±СѓРґСѓС‰РёР№ `marketing-domain-adapter`

## 14. Required Context Contract

РљР°Рє canonical runtime contract РЅРµ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ.

РќР° future/template-СѓСЂРѕРІРЅРµ РґР»СЏ marketing advisory РїРѕР»РµР·РЅС‹:

- campaign context РёР»Рё funnel slice;
- read-model summary РїРѕ СЃРµРіРјРµРЅС‚Сѓ, Р»РёРґР°Рј РёР»Рё Р°РєС‚РёРІРЅРѕСЃС‚Рё;
- tenant / team / period context;
- evidence Рё risk notes;
- СЏРІРЅС‹Р№ РІРѕРїСЂРѕСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїСЂРѕ campaign planning, funnel review РёР»Рё messaging.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… canonical runtime intent-РѕРІ СЃРµР№С‡Р°СЃ РЅРµС‚.

Р•СЃС‚СЊ С‚РѕР»СЊРєРѕ template-level semantics РґР»СЏ:

- campaign planning summary;
- funnel review;
- messaging recommendations;
- segment insights;
- marketing advisory summary.

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… marketing-domain РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ С‚Р°РєРёРµ Р±СѓРґСѓС‰РёРµ intent-С‹:

- plan_campaign_advisory;
- review_funnel;
- generate_messaging_recommendations;
- summarize_segment_insights;
- governed advisory handoff support РґР»СЏ CRM Рё knowledge РєРѕРЅС‚СѓСЂРѕРІ.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `marketer` РІ owner РґР»СЏ CRM writes, retrieval, finance analysis, contract execution РёР»Рё front-office actions.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

РќР° С‚РµРєСѓС‰РµРј СЌС‚Р°РїРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ template-level surface:

- `MarketingToolsRegistry`

Canonical runtime tool surface РІ `rai-chat` РїРѕРєР° РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ marketing-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- campaign planning tooling;
- funnel summary tooling;
- messaging recommendation tooling;
- segment insight tooling;
- advisory context preparation РїРѕРІРµСЂС… read models.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- CRM-owner tools РґР»СЏ record updates;
- retrieval-owner tools;
- finance-owner tools;
- contracts execution tools;
- front-office execution tools;
- unreviewed campaign launch tools.

## 17. UI surface

- РџРѕРєР° С‚РѕР»СЊРєРѕ onboarding UX.
- Product UI РґР»СЏ marketing work windows РµС‰С‘ РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

## 18. Guardrails

- С‚РѕР»СЊРєРѕ advisory
- `campaign_launch_requires_human_gate`
- `no_unreviewed_writes`
- trace/evidence required

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РџСѓС‚Р°РЅРёС†Р° РјРµР¶РґСѓ marketing advisory Рё CRM record ownership.
- РџРѕРїС‹С‚РєР° РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ marketing role РєР°Рє production owner Р±РµР· runtime family.
- Р Р°Р·СЂР°СЃС‚Р°РЅРёРµ template-role РІ СЃРєСЂС‹С‚С‹Р№ CRM-РґСѓР±Р»СЊ.
- РџРѕРґРјРµРЅР° retrieval-Р·Р°РґР°С‡ РјР°СЂРєРµС‚РёРЅРіРѕРІРѕР№ СЂРѕР»СЊСЋ Р±РµР· СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ marketing question.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- Template manifest validation.
- Governance validation.
- Output contract validation.
- РџРѕСЃР»Рµ enablement: routing, no-write, read-model and advisory regression tests.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- РЎРѕР±СЃС‚РІРµРЅРЅС‹Р№ canonical runtime role.
- Focus/Intent/Context/UI contracts.
- Р РµР°Р»СЊРЅС‹Р№ marketing tool surface.
- Formal CRM handoff contract.
- Smoke-СЃС†РµРЅР°СЂРёРё РїРѕ campaigns, segments Рё funnel advisory.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)

