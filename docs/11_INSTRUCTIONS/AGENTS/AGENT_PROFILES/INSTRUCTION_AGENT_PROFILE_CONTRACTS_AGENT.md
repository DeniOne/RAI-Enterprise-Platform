﻿---
id: DOC-INS-AGT-PROFILE-013
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ CONTRACTS_AGENT

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ РїСЂРѕС„РёР»СЊ `contracts_agent` РєР°Рє РєР°РЅРѕРЅРёС‡РµСЃРєРѕРіРѕ owner-agent РґР»СЏ РїРѕР»РЅРѕРіРѕ `commerce`-РєРѕРЅС‚СѓСЂР° РїРµСЂРІРѕР№ РІРѕР»РЅС‹.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР°:

- РїСЂРѕРµРєС‚РёСЂСѓСЋС‚СЃСЏ РґРѕРіРѕРІРѕСЂРЅС‹Рµ Рё commerce-СЃС†РµРЅР°СЂРёРё;
- РѕР±СЃСѓР¶РґР°РµС‚СЃСЏ РіСЂР°РЅРёС†Р° РјРµР¶РґСѓ `crm_agent`, `contracts_agent`, `legal_advisor` Рё `economist`;
- РїРѕРґРєР»СЋС‡Р°СЋС‚СЃСЏ РЅРѕРІС‹Рµ commerce tools;
- РїСЂРѕРІРµСЂСЏРµС‚СЃСЏ governed write path РІ commerce.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ runtime-Р°РіРµРЅС‚.
- Runtime family: СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain: `commerce`.
- Adapter role: `contracts_agent`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

`contracts_agent` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ primary execution owner РґР»СЏ:

- РґРѕРіРѕРІРѕСЂРѕРІ;
- РґРѕРіРѕРІРѕСЂРЅС‹С… СЂРѕР»РµР№;
- РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІ;
- РёСЃРїРѕР»РЅРµРЅРёСЏ;
- СЃС‡РµС‚РѕРІ;
- РїР»Р°С‚РµР¶РµР№;
- Р°Р»Р»РѕРєР°С†РёР№;
- AR balance.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РµСЂРµР·:

- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [contracts-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/contracts-agent.service.ts)
- [contracts-tools.registry.ts](../../../apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Р¤Р°РєС‚РёС‡РµСЃРєРё СЃРµР№С‡Р°СЃ СЂРµР°Р»РёР·РѕРІР°РЅС‹:

- СЃРѕР·РґР°РЅРёРµ, РїСЂРѕСЃРјРѕС‚СЂ Рё СЂРµРµСЃС‚СЂ РґРѕРіРѕРІРѕСЂРѕРІ;
- СЃРѕР·РґР°РЅРёРµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°;
- С„РёРєСЃР°С†РёСЏ РёСЃРїРѕР»РЅРµРЅРёСЏ;
- СЃРѕР·РґР°РЅРёРµ Рё РїСЂРѕРІРµРґРµРЅРёРµ СЃС‡РµС‚Р°;
- СЃРѕР·РґР°РЅРёРµ, РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Рё Р°Р»Р»РѕРєР°С†РёСЏ РїР»Р°С‚РµР¶Р°;
- РїСЂРѕСЃРјРѕС‚СЂ AR balance;
- clarification path Рё rich output РІ С‡Р°С‚Рµ.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- `commerce/contracts`
- `commerce/obligations` РєР°Рє РґРѕРіРѕРІРѕСЂРЅС‹Рµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°, Р° РЅРµ CRM follow-up obligations
- `commerce/fulfillment`
- `commerce/invoices`
- `commerce/payments`
- `commerce/payment-allocations`
- `ar-balance` РєР°Рє operational artefact РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ РєРѕРЅС‚СѓСЂР°

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р Р°СЃРїРѕР·РЅР°РІР°С‚СЊ РґРѕРіРѕРІРѕСЂРЅС‹Рµ Рё commerce-intent-С‹.
- РЈС…РѕРґРёС‚СЊ РІ `NEEDS_MORE_DATA`, РµСЃР»Рё РґР»СЏ write-path РЅРµ С…РІР°С‚Р°РµС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р°.
- Р’С‹РїРѕР»РЅСЏС‚СЊ commerce write С‡РµСЂРµР· governed tool path.
- РЎРѕС…СЂР°РЅСЏС‚СЊ explainability Рё evidence trail.
- РќРµ РїРѕРґРјРµРЅСЏС‚СЊ legal authority Рё finance strategy ownership.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р‘СЂР°С‚СЊ ownership РїРѕ CRM-РєР°СЂС‚РѕС‡РєР°Рј Рё РєРѕРЅС‚Р°РєС‚Р°Рј.
- РџРѕРґРјРµРЅСЏС‚СЊ `contract obligation` CRM follow-up РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕРј РёР»Рё РЅР°РѕР±РѕСЂРѕС‚.
- Р‘СЂР°С‚СЊ ownership РїРѕ legal review Рё policy interpretation.
- Р‘СЂР°С‚СЊ ownership РїРѕ standalone finance analysis С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РІ Р·Р°РїСЂРѕСЃРµ РµСЃС‚СЊ invoice, payment РёР»Рё AR.
- Р”РµР»Р°С‚СЊ peer-to-peer РІС‹Р·РѕРІС‹ РґСЂСѓРіРёРј Р°РіРµРЅС‚Р°Рј.
- РњР°СЃРєРёСЂРѕРІР°С‚СЊ blocked / pending / failed commerce action РєР°Рє СѓСЃРїРµС….

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- РґРѕРіРѕРІРѕСЂРЅС‹Р№ СЂРµРµСЃС‚СЂ Рё РєР°СЂС‚РѕС‡РєР° РґРѕРіРѕРІРѕСЂР°:
  - `create_commerce_contract`
  - `list_commerce_contracts`
  - `review_commerce_contract`
- РґРѕРіРѕРІРѕСЂРЅС‹Рµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°:
  - `create_contract_obligation`
- С„РёРєСЃР°С†РёСЏ РёСЃРїРѕР»РЅРµРЅРёСЏ:
  - `create_fulfillment_event`
- invoice flow:
  - `create_invoice_from_fulfillment`
  - `post_invoice`
- payment flow:
  - `create_payment`
  - `confirm_payment`
  - `allocate_payment`
- operational AR review:
  - `review_ar_balance`
- clarification path РїСЂРё РЅРµС…РІР°С‚РєРµ contract / invoice / payment context;
- governed commerce write path С‡РµСЂРµР· tool layer;
- read surfaces РґР»СЏ contract, fulfillment, invoices Рё AR РІРЅСѓС‚СЂРё commerce-РєРѕРЅС‚СѓСЂР°;
- rich output РґР»СЏ contract/payment/invoice СЃС†РµРЅР°СЂРёРµРІ РІ orchestration flow.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

Р’ РїСЂРµРґРµР»Р°С… СЃРІРѕРµРіРѕ РґРѕРјРµРЅР° Р°РіРµРЅС‚ РјРѕР¶РµС‚ РїРѕРєСЂС‹РІР°С‚СЊ:

- РїРѕР»РЅС‹Р№ governed contract lifecycle;
- commerce execution РїРѕ РёСЃРїРѕР»РЅРµРЅРёСЋ, СЃС‡РµС‚Р°Рј Рё РѕРїР»Р°С‚Р°Рј;
- contract workspace Рё lifecycle navigation;
- contract-context summaries Рё execution-state summaries;
- governed preparation Рє advisory handoff РІ legal/economics;
- handoff РІ `legal_advisor`, `economist` Рё `knowledge` С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ;
- rich work windows РґР»СЏ contract and billing workflow.

РђРіРµРЅС‚ РЅРµ РґРѕР»Р¶РµРЅ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- CRM record management;
- standalone legal owner-path;
- standalone finance owner-path;
- generic `commerce_agent` Р±РµР· СЏРІРЅРѕР№ РіСЂР°РЅРёС†С‹ ownership;
- controller РёР»Рё monitoring ownership.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РўРѕР»СЊРєРѕ С‡РµСЂРµР· `SupervisorAgent -> Runtime -> Adapter`.
- Handoff РёРґС‘С‚ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ orchestration spine.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `crm_agent`: handoff РёР· РєР»РёРµРЅС‚СЃРєРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р° РІ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РїСЂРѕС†РµСЃСЃ.
- РЎ `front_office_agent`: handoff РёР· communicator ingress РІ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РїСЂРѕС†РµСЃСЃ.
- РЎ `legal_advisor`: advisory handoff РїРѕ clause review Рё legal risk.
- РЎ `economist`: advisory handoff РїРѕ financial impact.
- РЎ `knowledge`: evidence/grounding.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`contracts_agent` РґРѕР»Р¶РµРЅ РѕСЃС‚Р°РІР°С‚СЊСЃСЏ primary owner, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє contract lifecycle РёР»Рё commerce execution:

- СЃРѕР·РґР°С‚СЊ РґРѕРіРѕРІРѕСЂ;
- РїСЂРѕСЃРјРѕС‚СЂРµС‚СЊ РґРѕРіРѕРІРѕСЂ;
- РёР·РјРµРЅРёС‚СЊ РёР»Рё РёСЃРїРѕР»РЅРёС‚СЊ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РѕР±СЉРµРєС‚;
- СЃРѕР·РґР°С‚СЊ РґРѕРіРѕРІРѕСЂРЅРѕРµ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ;
- Р·Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ fulfillment;
- СЃРѕР·РґР°С‚СЊ РёР»Рё РїСЂРѕРІРµСЃС‚Рё invoice;
- СЃРѕР·РґР°С‚СЊ, РїРѕРґС‚РІРµСЂРґРёС‚СЊ РёР»Рё Р°Р»Р»РѕС†РёСЂРѕРІР°С‚СЊ payment;
- РїРѕСЃРјРѕС‚СЂРµС‚СЊ AR РєР°Рє operational artefact РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ РїСЂРѕС†РµСЃСЃР°.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РёР· `contracts_agent` С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РІ РєРѕРЅС‚РµРєСЃС‚Рµ РµСЃС‚СЊ:

- РєРѕРЅС‚СЂР°РіРµРЅС‚;
- account workspace;
- CRM-card;
- clause risk;
- СЌРєРѕРЅРѕРјРёС‡РµСЃРєР°СЏ РѕС†РµРЅРєР°;
- РґРµР±РёС‚РѕСЂРєР° РєР°Рє С„РёРЅР°РЅСЃРѕРІР°СЏ С‚РµРјР°.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `contract obligation` = РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ РІРЅСѓС‚СЂРё РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ РёСЃРїРѕР»РЅРµРЅРёСЏ;
- `crm_obligation` = follow-up РІРЅСѓС‚СЂРё РєР»РёРµРЅС‚СЃРєРѕРіРѕ workspace;
- `AR balance` РІ СЌС‚РѕРј РїСЂРѕС„РёР»Рµ = operational artefact contract contour;
- С„РёРЅР°РЅСЃРѕРІР°СЏ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёСЏ AR РѕСЃС‚Р°С‘С‚СЃСЏ advisory-layer Сѓ `economist`.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РІ `crm_agent`, РєРѕРіРґР° Р·Р°РїСЂРѕСЃ СѓС…РѕРґРёС‚ РѕР±СЂР°С‚РЅРѕ РІ РєР°СЂС‚РѕС‡РєСѓ РєР»РёРµРЅС‚Р°, РєРѕРЅС‚Р°РєС‚С‹, relations РёР»Рё CRM-history;
- РІ `legal_advisor`, РєРѕРіРґР° РЅСѓР¶РµРЅ clause review, legal commentary, compliance analysis;
- РІ `economist`, РєРѕРіРґР° РЅСѓР¶РµРЅ financial impact, scenario comparison, economics interpretation;
- РІ `knowledge`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / corpus grounding.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- СЃР°Рј С„Р°РєС‚, С‡С‚Рѕ Р·Р°РїСЂРѕСЃ СЃС‚Р°СЂС‚РѕРІР°Р» РёР· CRM-route;
- РЅР°Р»РёС‡РёРµ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° РєР°Рє СЃС‚РѕСЂРѕРЅС‹ РґРѕРіРѕРІРѕСЂР°;
- СЃР»РѕРІР° `risk`, `impact`, `analysis` РІРЅСѓС‚СЂРё execution-Р·Р°РїСЂРѕСЃР°;
- РЅР°Р»РёС‡РёРµ clause РёР»Рё compliance СЃР»РѕРІР° РІ mixed contract action Р·Р°РїСЂРѕСЃРµ.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ СѓРІРѕРґРёС‚СЊ ownership РёР· `contracts_agent`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ РґРѕРіРѕРІРѕСЂРЅС‹Рј РёР»Рё РїР»Р°С‚С‘Р¶РЅС‹Рј.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- [commerce.controller.ts](../../../apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](../../../apps/api/src/modules/commerce/services/commerce-contract.service.ts)
- [fulfillment.service.ts](../../../apps/api/src/modules/commerce/services/fulfillment.service.ts)
- [billing.service.ts](../../../apps/api/src/modules/commerce/services/billing.service.ts)

## 14. Required Context Contract

РњРёРЅРёРјР°Р»СЊРЅС‹Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РєРѕРЅС‚РµРєСЃС‚С‹:

- РґР»СЏ РґРѕРіРѕРІРѕСЂР°: `number`, `type`, `validFrom`, `jurisdictionId`, `roles[]`;
- РґР»СЏ РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°: `contractId`, `type`;
- РґР»СЏ РёСЃРїРѕР»РЅРµРЅРёСЏ: `obligationId`, `eventDomain`, `eventType`, `eventDate`;
- РґР»СЏ СЃС‡РµС‚Р°: `fulfillmentEventId`, `sellerJurisdiction`, `buyerJurisdiction`, `supplyType`, `vatPayerStatus`, `subtotal`;
- РґР»СЏ РїР»Р°С‚РµР¶Р°: `payerPartyId`, `payeePartyId`, `amount`, `currency`, `paymentMethod`;
- РґР»СЏ Р°Р»Р»РѕРєР°С†РёРё: `paymentId`, `invoiceId`, `allocatedAmount`;
- РґР»СЏ AR balance: `invoiceId`.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

- `create_commerce_contract`
- `list_commerce_contracts`
- `review_commerce_contract`
- `create_contract_obligation`
- `create_fulfillment_event`
- `create_invoice_from_fulfillment`
- `post_invoice`
- `create_payment`
- `confirm_payment`
- `allocate_payment`
- `review_ar_balance`

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… РґРѕРјРµРЅР° РґРѕРїСѓСЃС‚РёРјС‹ РґР°Р»СЊРЅРµР№С€РёРµ intent-С‹ С‚РѕР»СЊРєРѕ С‚Р°РєРѕРіРѕ С‚РёРїР°:

- contract lifecycle review Рё summaries;
- execution-state review РїРѕ fulfillment / invoice / payment;
- governed navigation РїРѕ contract workspace;
- advisory handoff preparation Рє `legal_advisor` Рё `economist`.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `contracts_agent` РІ owner РґР»СЏ CRM, standalone legal РёР»Рё standalone finance analysis.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

- `CreateCommerceContract`
- `ListCommerceContracts`
- `GetCommerceContract`
- `CreateCommerceObligation`
- `CreateFulfillmentEvent`
- `ListFulfillmentEvents`
- `CreateInvoiceFromFulfillment`
- `PostInvoice`
- `ListInvoices`
- `CreatePayment`
- `ConfirmPayment`
- `AllocatePayment`
- `GetArBalance`

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ commerce-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- contract workspace tooling;
- lifecycle review tooling;
- governed execution tooling РїРѕ fulfillment / billing / payment;
- context-assembly tooling РґР»СЏ advisory handoff.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- CRM tools;
- legal interpretation tools;
- finance-owner tools;
- monitoring-owner tools.

## 17. UI surface

- rich result panel РґРѕРіРѕРІРѕСЂР°;
- clarification panel РґР»СЏ commerce context;
- route actions РІ `/commerce/contracts` Рё `/commerce/contracts/create`;
- structured result РґР»СЏ obligation / fulfillment / invoice / payment / AR.

## 18. Guardrails

- primary owner С‚РѕР»СЊРєРѕ РґР»СЏ `commerce`;
- `legal_advisor` Рё `economist` РЅРµ Р·Р°РјРµРЅСЏСЋС‚СЃСЏ;
- `QUARANTINE` Р±Р»РѕРєРёСЂСѓРµС‚ write tools;
- `TOOL_FIRST` С„РѕСЂСЃРёСЂСѓРµС‚ governed confirmation РґР»СЏ risky writes.

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РЅРµРїРѕР»РЅС‹Р№ contract context;
- blocked/pending commerce writes;
- РїРѕРїС‹С‚РєР° СЂР°СЃРїРѕР»Р·Р°РЅРёСЏ РІ CRM РёР»Рё legal ownership;
- Р»РѕР¶РЅС‹Р№ fallback РІРјРµСЃС‚Рѕ real contract path.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- intent routing РїРѕ РґРѕРіРѕРІРѕСЂР°Рј Рё commerce flows;
- clarification tests;
- registry tests РґР»СЏ contract/invoice/payment paths;
- composer rich output tests;
- autonomy / pending-action gating tests.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Р§Р°С‚РѕРІС‹Р№ Р·Р°РїСЂРѕСЃ РЅР° РґРѕРіРѕРІРѕСЂ СЂРµР°Р»СЊРЅРѕ СѓС…РѕРґРёС‚ РІ `contracts_agent`.
- Commerce backend РІС‹Р·С‹РІР°РµС‚СЃСЏ РїРѕ СЂРµР°Р»СЊРЅС‹Рј tool paths.
- РќРµС‚ РјР°СЃРєРёСЂРѕРІРєРё fallback backlog РІРјРµСЃС‚Рѕ СЂРµР·СѓР»СЊС‚Р°С‚Р°.
- Agent РІРёРґРµРЅ РІ runtime governance Рё reliability.
- Р•СЃС‚СЊ smoke-РЅР°Р±РѕСЂ РїРѕ CRM -> contracts -> governance.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_CONTRACTS_AGENT_CANON.md](../../00_STRATEGY/STAGE%202/RAI_CONTRACTS_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [contracts-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/contracts-agent.service.ts)
- [contracts-tools.registry.ts](../../../apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

