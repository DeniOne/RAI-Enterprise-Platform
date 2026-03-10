﻿---
id: DOC-INS-AGT-PROFILE-005
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ CRM_AGENT

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ С‚РµРєСѓС‰РёР№ Рё С†РµР»РµРІРѕР№ РїСЂРѕС„РёР»СЊ `crm_agent` РєР°Рє owner-agent РґР»СЏ CRM-РєРѕРЅС‚СѓСЂР°.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР°:

- СЂР°СЃС€РёСЂСЏРµС‚СЃСЏ CRM scope;
- РїРѕРґРєР»СЋС‡Р°СЋС‚СЃСЏ РЅРѕРІС‹Рµ CRM tools Рё connectors;
- РѕР±СЃСѓР¶РґР°РµС‚СЃСЏ РіСЂР°РЅРёС†Р° РјРµР¶РґСѓ CRM Рё contracts/legal;
- РїСЂРѕРµРєС‚РёСЂСѓСЋС‚СЃСЏ AI-СЃС†РµРЅР°СЂРёРё РїРѕ РєРѕРЅС‚СЂР°РіРµРЅС‚Р°Рј Рё РєР»РёРµРЅС‚СЃРєРёРј РґР°РЅРЅС‹Рј.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ runtime-Р°РіРµРЅС‚.
- Runtime family: СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain: `crm`.
- Adapter role: `crm_agent`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

РџРѕ Stage 2 `crm_agent` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ first-class owner-agent РґР»СЏ:

- РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ Рё РєР°СЂС‚РѕС‡РµРє;
- CRM-Р°РєРєР°СѓРЅС‚РѕРІ;
- РєРѕРЅС‚Р°РєС‚РѕРІ;
- РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёР№;
- РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІ;
- СЃС‚СЂСѓРєС‚СѓСЂС‹ СЃРІСЏР·РµР№ Рё РєР»РёРµРЅС‚СЃРєРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р°.

РђРіРµРЅС‚ РґРѕР»Р¶РµРЅ СЂР°Р±РѕС‚Р°С‚СЊ С‡РµСЂРµР· governed CRM write-path, РЅРµ РІС‹С…РѕРґСЏ РІ:

- С„РёРЅР°РЅСЃС‹;
- Р°РіСЂРѕРЅРѕРјРёСЋ;
- РјРѕРЅРёС‚РѕСЂРёРЅРі ownership;
- РґРѕРіРѕРІРѕСЂРЅС‹Р№ Рё legal ownership Р±РµР· РѕС‚РґРµР»СЊРЅРѕР№ С„РѕСЂРјР°Р»РёР·Р°С†РёРё.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РµСЂРµР·:

- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [crm-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/crm-agent.service.ts)
- [crm-tools.registry.ts](../../../apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Р¤Р°РєС‚РёС‡РµСЃРєРё СЃРµР№С‡Р°СЃ РїРѕРєСЂС‹РІР°РµС‚:

- СЂРµРіРёСЃС‚СЂР°С†РёСЋ РєРѕРЅС‚СЂР°РіРµРЅС‚Р°;
- СЃРѕР·РґР°РЅРёРµ СЃРІСЏР·Рё РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ;
- СЃРѕР·РґР°РЅРёРµ CRM-Р°РєРєР°СѓРЅС‚Р°;
- РѕР±Р·РѕСЂ workspace Р°РєРєР°СѓРЅС‚Р°;
- РѕР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕС„РёР»СЏ Р°РєРєР°СѓРЅС‚Р°;
- create/update/delete РєРѕРЅС‚Р°РєС‚РѕРІ;
- create/update/delete РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёР№;
- create/update/delete РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІ.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- `party` Рё РєРѕРЅС‚СЂР°РіРµРЅС‚С‹;
- CRM-Р°РєРєР°СѓРЅС‚С‹;
- РєРѕРЅС‚Р°РєС‚С‹;
- interactions;
- CRM-obligations РєР°Рє follow-up СЃСѓС‰РЅРѕСЃС‚Рё РєР»РёРµРЅС‚СЃРєРѕРіРѕ workspace, Р° РЅРµ РґРѕРіРѕРІРѕСЂРЅС‹Рµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°;
- holding / farm / СЃРІСЏР·Р°РЅРЅС‹Рµ Р°РєС‚РёРІС‹ РІ CRM-РєРѕРЅС‚РµРєСЃС‚Рµ;
- read/write path РїРѕ РєР°СЂС‚РѕС‡РєР°Рј РІ governance-РіСЂР°РЅСЏС….

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- РџСЂРѕРІРµСЂСЏС‚СЊ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° Рё СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ РєР°СЂС‚РѕС‡РєСѓ С‡РµСЂРµР· CRM tool chain.
- Р Р°Р±РѕС‚Р°С‚СЊ СЃ РєР°СЂС‚РѕС‡РєР°РјРё Рё СЃРІСЏР·СЏРјРё РєР°Рє CRM owner.
- РЈС…РѕРґРёС‚СЊ РІ `NEEDS_MORE_DATA`, РµСЃР»Рё РґР»СЏ write-РѕРїРµСЂР°С†РёРё РЅРµ С…РІР°С‚Р°РµС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р°.
- РЎРѕС…СЂР°РЅСЏС‚СЊ explainability Рё evidence.
- РќРµ РїРѕРґРјРµРЅСЏС‚СЊ РґРѕРіРѕРІРѕСЂРЅС‹Р№, С„РёРЅР°РЅСЃРѕРІС‹Р№ Рё legal ownership.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р’С‹РїРѕР»РЅСЏС‚СЊ finance, agronomy Рё monitoring intent-С‹.
- Р‘СЂР°С‚СЊ ownership РґРѕРіРѕРІРѕСЂР° С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РґРѕРіРѕРІРѕСЂ СЃРІСЏР·Р°РЅ СЃ РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРј.
- РџРѕРґРјРµРЅСЏС‚СЊ `crm_obligation` РґРѕРіРѕРІРѕСЂРЅС‹Рј РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕРј РёР»Рё РЅР°РѕР±РѕСЂРѕС‚.
- Р’С‹С…РѕРґРёС‚СЊ РІ legal commitments.
- РњР°СЃРєРёСЂРѕРІР°С‚СЊ handoff РІ `contracts_agent` РёР»Рё РїС‹С‚Р°С‚СЊСЃСЏ РЅРµР·Р°РјРµС‚РЅРѕ Р·Р°С…РІР°С‚С‹РІР°С‚СЊ commerce ownership.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- СЂРµРіРёСЃС‚СЂР°С†РёСЏ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° Рё СЂР°Р±РѕС‚Р° СЃ party-СЃСѓС‰РЅРѕСЃС‚СЏРјРё;
- `register_counterparty`
- `create_counterparty_relation`
- СЃРѕР·РґР°РЅРёРµ Рё РѕР±РЅРѕРІР»РµРЅРёРµ CRM-Р°РєРєР°СѓРЅС‚Р°:
  - `create_crm_account`
  - `review_account_workspace`
  - `update_account_profile`
- CRUD РїРѕ РєРѕРЅС‚Р°РєС‚Р°Рј:
  - `create_crm_contact`
  - `update_crm_contact`
  - `delete_crm_contact`
- CRUD РїРѕ РєР»РёРµРЅС‚СЃРєРёРј РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏРј:
  - `log_crm_interaction`
  - `update_crm_interaction`
  - `delete_crm_interaction`
- CRUD РїРѕ CRM follow-up РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°Рј:
  - `create_crm_obligation`
  - `update_crm_obligation`
  - `delete_crm_obligation`
- governed CRM write path СЃ РІРѕР·РІСЂР°С‚РѕРј РІ orchestration spine;
- workspace review Рё РїРµСЂРµС…РѕРґС‹ РїРѕ CRM route;
- read/evidence enrichment РїРѕ РєРѕРЅС‚СЂР°РіРµРЅС‚Сѓ С‡РµСЂРµР· tool surface CRM-РєРѕРЅС‚СѓСЂР°.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

Р’ РїСЂРµРґРµР»Р°С… CRM-РґРѕРјРµРЅР° Р°РіРµРЅС‚ РјРѕР¶РµС‚ РїРѕРєСЂС‹РІР°С‚СЊ:

- РїРѕР»РЅС‹Р№ С†РёРєР» client record management;
- onboarding РЅРѕРІС‹С… РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ;
- customer context enrichment;
- follow-up Рё activity management;
- relation graph Рё account workspace;
- duplicate detection Рё entity hygiene РІ РїСЂРµРґРµР»Р°С… CRM-РєРѕРЅС‚СѓСЂР°;
- governed preparation Рє handoff РІ СЃРѕСЃРµРґРЅРёР№ owner-domain;
- CRM handoff РІ contracts/legal/finance С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.

РђРіРµРЅС‚ РЅРµ РґРѕР»Р¶РµРЅ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- `commerce/contracts` ownership;
- full legal review;
- С„РёРЅР°РЅСЃРѕРІРѕРіРѕ РёСЃРїРѕР»РЅРµРЅРёСЏ;
- РѕР±С‰РµРіРѕ controller РёР»Рё monitoring ownership.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РњР°СЂС€СЂСѓС‚РёР·РёСЂСѓРµС‚СЃСЏ С‡РµСЂРµР· `SupervisorAgent -> Runtime -> Adapter`.
- РџРѕР»СѓС‡Р°РµС‚ owner-СЃС‚Р°С‚СѓСЃ С‚РѕР»СЊРєРѕ РїРѕ CRM-intent-Р°Рј.
- Handoff РІ РґСЂСѓРіРёРµ РґРѕРјРµРЅС‹ РґРѕРїСѓСЃС‚РёРј С‚РѕР»СЊРєРѕ С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ spine.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `knowledge`: РґР»СЏ policy / corpus grounding РїРѕ CRM-СЃС†РµРЅР°СЂРёСЋ.
- РЎ `economist`: РґР»СЏ С„РёРЅР°РЅСЃРѕРІРѕРіРѕ follow-up РїРѕ РєР»РёРµРЅС‚СЃРєРѕРјСѓ РєРѕРЅС‚РµРєСЃС‚Сѓ.
- РЎ `monitoring`: РґР»СЏ incident/risk escalation, РЅРѕ РЅРµ РЅР°РѕР±РѕСЂРѕС‚ РїРѕ ownership.
- РЎ `contracts_agent`: РґР»СЏ РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ Рё commerce handoff РїРѕ РєРѕРЅС‚СЂР°РіРµРЅС‚Сѓ.
- РЎ `legal_advisor`: РґР»СЏ РїСЂР°РІРѕРІРѕРіРѕ advisory handoff.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`crm_agent` РґРѕР»Р¶РµРЅ РѕСЃС‚Р°РІР°С‚СЊСЃСЏ primary owner, РєРѕРіРґР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЂР°Р±РѕС‚Р°РµС‚ СЃ CRM-СЃСѓС‰РЅРѕСЃС‚СЊСЋ Рё CRM lifecycle:

- РєРѕРЅС‚СЂР°РіРµРЅС‚;
- party relation;
- CRM-account;
- contact;
- CRM interaction;
- CRM-obligation РєР°Рє follow-up РїРѕ РєР»РёРµРЅС‚Сѓ.

Ownership РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `contracts_agent`, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РѕС‚РЅРѕСЃРёС‚СЃСЏ РЅРµ Рє CRM-record management, Р° Рє contract lifecycle:

- СЃРѕР·РґР°С‚СЊ РґРѕРіРѕРІРѕСЂ;
- РїСЂРѕСЃРјРѕС‚СЂРµС‚СЊ РёР»Рё РёР·РјРµРЅРёС‚СЊ РґРѕРіРѕРІРѕСЂ;
- Р·Р°РІРµСЃС‚Рё РґРѕРіРѕРІРѕСЂРЅРѕРµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ;
- Р·Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ fulfillment;
- СЃРѕР·РґР°С‚СЊ invoice;
- РїСЂРѕРІРµСЃС‚Рё payment;
- СЃРґРµР»Р°С‚СЊ allocation;
- РїРѕСЃРјРѕС‚СЂРµС‚СЊ AR.

Р–С‘СЃС‚РєРѕРµ СЂР°Р·Р»РёС‡РёРµ:

- `crm_obligation` = follow-up, Р·Р°РґР°С‡Р° РёР»Рё РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ РІРЅСѓС‚СЂРё РєР»РёРµРЅС‚СЃРєРѕРіРѕ workspace;
- `contract obligation` = РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ РІРЅСѓС‚СЂРё РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ РёСЃРїРѕР»РЅРµРЅРёСЏ;
- РЅР°Р»РёС‡РёРµ РѕРґРЅРѕРіРѕ Рё С‚РѕРіРѕ Р¶Рµ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° РЅРµ РґРµР»Р°РµС‚ СЌС‚Рё СЃСѓС‰РЅРѕСЃС‚Рё РІР·Р°РёРјРѕР·Р°РјРµРЅСЏРµРјС‹РјРё.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РІ `contracts_agent`, РєРѕРіРґР° CRM-РєРѕРЅС‚РµРєСЃС‚ РїРµСЂРµС…РѕРґРёС‚ РІ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РїСЂРѕС†РµСЃСЃ;
- РІ `economist`, РєРѕРіРґР° РЅСѓР¶РµРЅ С„РёРЅР°РЅСЃРѕРІС‹Р№ follow-up РїРѕ РєР»РёРµРЅС‚СЃРєРѕРјСѓ РєРµР№СЃСѓ;
- РІ `knowledge`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / corpus grounding;
- РІ `monitoring`, РєРѕРіРґР° С‚СЂРµР±СѓРµС‚СЃСЏ СЃРёРіРЅР°Р»РёР·Р°С†РёСЏ РёР»Рё risk escalation РїРѕ CRM-РєРѕРЅС‚РµРєСЃС‚Сѓ.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- СЃР°Рј С„Р°РєС‚, С‡С‚Рѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅР°С…РѕРґРёС‚СЃСЏ РІ CRM-route;
- РЅР°Р»РёС‡РёРµ РєР°СЂС‚РѕС‡РєРё РєР»РёРµРЅС‚Р° РІ РєРѕРЅС‚РµРєСЃС‚Рµ;
- СѓРїРѕРјРёРЅР°РЅРёРµ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° РєР°Рє СЃС‚РѕСЂРѕРЅС‹ РґРѕРіРѕРІРѕСЂР°;
- РѕС‚РєСЂС‹С‚РёРµ Р·Р°РїСЂРѕСЃР° РёР· account workspace.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ СѓРґРµСЂР¶РёРІР°С‚СЊ ownership Сѓ `crm_agent`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ СѓР¶Рµ РґРѕРіРѕРІРѕСЂРЅРѕРµ.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `CrmToolsRegistry`
- `CrmModule`
- `CommerceModule` РґР»СЏ `parties`
- РєР°СЂС‚РѕС‡РєРё, СЃРІСЏР·Рё, Р°РєС‚РёРІС‹ Рё workspace CRM-РєРѕРЅС‚СѓСЂРѕРІ

## 14. Required Context Contract

РџРѕ intent-Р°Рј РЅСѓР¶РµРЅ СЂР°Р·РЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚:

- РґР»СЏ СЂРµРіРёСЃС‚СЂР°С†РёРё РєРѕРЅС‚СЂР°РіРµРЅС‚Р°: `inn` Рё С‚РёРї/СЋСЂРёСЃРґРёРєС†РёСЏ РїРѕ РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё;
- РґР»СЏ СЃРІСЏР·РµР№: `fromPartyId`, `toPartyId`, `relationType`;
- РґР»СЏ Р°РєРєР°СѓРЅС‚Р°: `accountId` РёР»Рё `accountPayload`;
- РґР»СЏ РєРѕРЅС‚Р°РєС‚РѕРІ, РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёР№ Рё РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІ: СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РёРµ `accountId`, `contactId`, `interactionId`, `obligationId`.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

- `register_counterparty`
- `create_counterparty_relation`
- `create_crm_account`
- `review_account_workspace`
- `update_account_profile`
- `create_crm_contact`
- `update_crm_contact`
- `delete_crm_contact`
- `log_crm_interaction`
- `update_crm_interaction`
- `delete_crm_interaction`
- `create_crm_obligation`
- `update_crm_obligation`
- `delete_crm_obligation`

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… CRM-РґРѕРјРµРЅР° РґРѕРїСѓСЃС‚РёРјС‹ РґР°Р»СЊРЅРµР№С€РёРµ intent-С‹ С‚РѕР»СЊРєРѕ С‚Р°РєРѕРіРѕ С‚РёРїР°:

- record hygiene Рё deduplication;
- account context enrichment;
- relation graph maintenance;
- safe CRM summaries Рё workspace review;
- governed handoff preparation РІ СЃРѕСЃРµРґРЅРёР№ РґРѕРјРµРЅ.

РќРёРєР°РєРѕР№ РёР· СЌС‚РёС… intent-РѕРІ РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІСЂР°С‰Р°С‚СЊ `crm_agent` РІ РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ, legal РёР»Рё finance owner.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

- `LookupCounterpartyByInn`
- `RegisterCounterparty`
- `CreateCounterpartyRelation`
- `CreateCrmAccount`
- `GetCrmAccountWorkspace`
- `UpdateCrmAccount`
- `CreateCrmContact`
- `UpdateCrmContact`
- `DeleteCrmContact`
- `CreateCrmInteraction`
- `UpdateCrmInteraction`
- `DeleteCrmInteraction`
- `CreateCrmObligation`
- `UpdateCrmObligation`
- `DeleteCrmObligation`

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ CRM-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- duplicate detection РІРЅСѓС‚СЂРё CRM;
- relation graph maintenance;
- account hygiene and enrichment;
- governed read/write tooling РїРѕ РєР°СЂС‚РѕС‡РєР°Рј Рё workspace.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- contracts execution tools;
- legal review tools;
- finance execution tools;
- monitoring-owner tools.

## 17. UI surface

- CRM work windows;
- РєР°СЂС‚РѕС‡РєР° СЂРµР·СѓР»СЊС‚Р°С‚Р° СЂРµРіРёСЃС‚СЂР°С†РёРё РєРѕРЅС‚СЂР°РіРµРЅС‚Р°;
- РїРµСЂРµС…РѕРґ РІ РєР°СЂС‚РѕС‡РєСѓ Рё workspace Р°РєРєР°СѓРЅС‚Р°;
- actions РїРѕ РєРѕРЅС‚Р°РєС‚Р°Рј, РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏРј Рё РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°Рј;
- governed write feedback.

## 18. Guardrails

- Р—Р°РїСЂРµС‰С‘РЅРЅС‹Рµ РґРѕРјРµРЅС‹: `agronomy`, `finance`, `monitoring`.
- Р—Р°РїСЂРµС‰С‘РЅРЅС‹Рµ intent-С‹: agro, finance, knowledge-owner, monitoring-owner.
- Р—Р°РїСЂРµС‰С‘РЅРЅС‹Р№ scope: contracts execution ownership РІС‹РЅРµСЃРµРЅ РІ РѕС‚РґРµР»СЊРЅС‹Р№ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ РїСЂРѕС„РёР»СЊ `contracts_agent`.

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РќРµРєРѕСЂСЂРµРєС‚РЅР°СЏ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ РІ CRM РІРјРµСЃС‚Рѕ `contracts_agent` РЅР° РґРѕРіРѕРІРѕСЂРЅС‹С… СЃС†РµРЅР°СЂРёСЏС….
- Р›РѕР¶РЅС‹Р№ СѓСЃРїРµС… РїСЂРё blocked/governed write, РµСЃР»Рё composer СЃРєСЂС‹РІР°РµС‚ СЃС‚Р°С‚СѓСЃ.
- РќРµРїРѕР»РЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚ РґР»СЏ CRM write path.
- Р Р°СЃС€РёСЂРµРЅРёРµ CRM ownership РЅР° legal/contracts РїРѕ РёРЅРµСЂС†РёРё РјР°СЂС€СЂСѓС‚Р°.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- Intent routing РїРѕ РєР°Р¶РґРѕРјСѓ CRM-intent.
- Р РµРіРёСЃС‚СЂР°С†РёСЏ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° РїРѕ РРќРќ Рё Р·Р°С‰РёС‚Р° РѕС‚ РґСѓР±Р»РµР№.
- CRM workspace retrieval.
- CRUD РїРѕ РєРѕРЅС‚Р°РєС‚Р°Рј, РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏРј Рё РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°Рј.
- Guardrails РїСЂРѕС‚РёРІ `contracts`, finance Рё agronomy.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Р’СЃРµ Р·Р°СЏРІР»РµРЅРЅС‹Рµ CRM-intent-С‹ СЂРµР°Р»СЊРЅРѕ РёСЃРїРѕР»РЅСЏСЋС‚СЃСЏ.
- CRM write path governed Рё С‡РµСЃС‚РЅРѕ РѕС‚СЂР°Р¶Р°РµС‚ gate status.
- UI РЅРµ СЃРєСЂС‹РІР°РµС‚ blocked / pending / failed СЃРѕСЃС‚РѕСЏРЅРёСЏ.
- Р•СЃС‚СЊ smoke-РЅР°Р±РѕСЂ РЅР° РЅРѕРІС‹С… Рё СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ.
- Р”РѕРіРѕРІРѕСЂРЅС‹Рµ СЃС†РµРЅР°СЂРёРё С‡РµСЃС‚РЅРѕ СѓС…РѕРґСЏС‚ РІ `contracts_agent`, Р° РЅРµ СЂР°Р·РјС‹РІР°СЋС‚СЃСЏ РІ CRM scope.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [crm-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/crm-agent.service.ts)
- [crm-tools.registry.ts](../../../apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts)

