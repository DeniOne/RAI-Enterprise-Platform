# CODEX PROMPT: INSTITUTIONAL COMMERCE & PARTY CORE IMPLEMENTATION (RAI ENTERPRISE)

## Р’Р’Р•Р”Р•РќРР• Р”Р›РЇ РђРЎРЎРРЎРўР•РќРўРђ (CODEX)
РўС‹ РІС‹СЃС‚СѓРїР°РµС€СЊ РІ СЂРѕР»Рё Senior Backend/Database Engineer (Р РѕР»СЊ: CODER). 
РўРІРѕСЏ Р·Р°РґР°С‡Р° вЂ” РїРµСЂРµРІРµСЃС‚Рё СѓС‚РІРµСЂР¶РґРµРЅРЅС‹Р№ 10/10 Enterprise Architectural Design РІ РєРѕРЅРєСЂРµС‚РЅС‹Р№ РєРѕРґ (Prisma Schema, Types, API Services). 

РњС‹ СЃС‚СЂРѕРёРј **Institutional Core** РїР»Р°С‚С„РѕСЂРјС‹ RAI Enterprise. Р­С‚Рѕ РЅРµ РїСЂРѕСЃС‚Рѕ SaaS CRM, СЌС‚Рѕ СЏРґСЂРѕ (Ledger + Р”РѕРєСѓРјРµРЅС‚РѕРѕР±РѕСЂРѕС‚), РєРѕС‚РѕСЂРѕРµ СЃРІСЏР·С‹РІР°РµС‚ РІРѕРµРґРёРЅРѕ РљРѕРјРјРµСЂС†РёСЋ, РЎРєР»Р°РґС‹, Р¤РёРЅР°РЅСЃС‹ Рё Р­РєРѕРЅРѕРјРёРєСѓ С‡РµСЂРµР· СЃС‚СЂРѕРіРёР№ РєРѕРЅРІРµР№РµСЂ РґРѕРєСѓРјРµРЅС‚РѕРІ.

---

## РЁРђР“ 1: РћР‘РЇР—РђРўР•Р›Р¬РќРћР• РћР—РќРђРљРћРњР›Р•РќРР• РЎ РљРћРќРўР•РљРЎРўРћРњ (Р§РўР•РќРР• Р¤РђР™Р›РћР’)
РџСЂРµР¶РґРµ С‡РµРј РїРёСЃР°С‚СЊ С…РѕС‚СЏ Р±С‹ СЃС‚СЂРѕС‡РєСѓ РєРѕРґР°, С‚С‹ **РћР‘РЇР—РђРќ** РїСЂРѕС‡РёС‚Р°С‚СЊ Рё РїРѕРЅСЏС‚СЊ СЃР»РµРґСѓСЋС‰РёРµ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Рµ РєРѕРЅС‚СЂР°РєС‚С‹:
1. `f:\RAI_EP\docs\01_ARCHITECTURE\PARTY_MANAGEMENT_CONTRACT.md` (РЈР·Р»С‹, РРµСЂР°СЂС…РёРё, Р РѕР»Рё, Р®СЂРёСЃРґРёРєС†РёРё)
2. `f:\RAI_EP\docs\01_ARCHITECTURE\DOCFLOW_AND_BILLING_CONTRACT.md` (5 СЃР»РѕРµРІ РґРѕРєСѓРјРµРЅС‚РѕРѕР±РѕСЂРѕС‚Р° Рё 9 Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹С… РёРјРїРµСЂР°С‚РёРІРѕРІ)
3. `f:\RAI_EP\docs\10_FRONTEND_MENU_IMPLEMENTATION\18_ARCHITECTURE_COMMERCE_INTEGRATION_MAP.md` (Entity Graph Рё РёРЅС‚РµРіСЂР°С†РёСЏ СЃ РґСЂСѓРіРёРјРё РјРѕРґСѓР»СЏРјРё ERP)
4. `f:\RAI_EP\docs\10_FRONTEND_MENU_IMPLEMENTATION\17_BUTTON_РљРѕРјРјРµСЂС†РёСЏ.md` (UX РђСЂС…РёС‚РµРєС‚СѓСЂР° Рё 4-РєРѕРјРїРѕРЅРµРЅС‚РЅРѕРµ РјРµРЅСЋ)

*Р—Р°РїСЂРµС‰РµРЅРѕ: РґРѕРґСѓРјС‹РІР°С‚СЊ Р°СЂС…РёС‚РµРєС‚СѓСЂСѓ, РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ CRM-С€Р°Р±Р»РѕРЅС‹ РёР»Рё СЃСЂРµР·Р°С‚СЊ СѓРіР»С‹. Р•СЃР»Рё РІ `schema.prisma` РїРѕСЏРІРёС‚СЃСЏ РїРѕР»Рµ `sellerId` РІ С‚Р°Р±Р»РёС†Рµ `Contract` РІРјРµСЃС‚Рѕ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ `ContractPartyRole` вЂ” СЌС‚Рѕ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Р№ РїСЂРѕРІР°Р».*

---

## РЁРђР“ 2: РџР РћР’Р•Р РљРђ Р¤РЈРќР”РђРњР•РќРўРђР›Р¬РќР«РҐ РРќР’РђР РРђРќРўРћР’ (FOUNDATION LAWS)
РџСЂРё РЅР°РїРёСЃР°РЅРёРё Prisma Schema Рё Р±СЌРєРµРЅРґР° С‚С‹ РґРѕР»Р¶РµРЅ СЃС‚СЂРѕРіРѕ СЃРѕР±Р»СЋСЃС‚Рё СЃР»РµРґСѓСЋС‰РёРµ РїСЂР°РІРёР»Р°:

0. **РљР РРўРР§Р•РЎРљРћР• РџР РђР’РР›Рћ (NAME COLLISION):** 
   - Р’ `schema.prisma` РЈР–Р• РЎРЈР©Р•РЎРўР’РЈР®Рў legacy-РјРѕРґРµР»Рё `Contract` Рё `Obligation` (РёР· СЃС‚Р°СЂРѕРіРѕ CRM-РјРѕРґСѓР»СЏ). 
   - **РЎРўР РћР“Рћ Р—РђРџР Р•Р©Р•РќРћ** РёР·РјРµРЅСЏС‚СЊ РёС… РёР»Рё РїС‹С‚Р°С‚СЊСЃСЏ Рє РЅРёРј РїСЂРёРІСЏР·Р°С‚СЊСЃСЏ. 
   - Р’РЎР• РЅРѕРІС‹Рµ РёРЅСЃС‚РёС‚СѓС†РёРѕРЅР°Р»СЊРЅС‹Рµ РјРѕРґРµР»Рё РєРѕРјРјРµСЂС‡РµСЃРєРѕРіРѕ СЏРґСЂР° **РћР‘РЇР—РђРќР«** РёРјРµС‚СЊ РїСЂРµС„РёРєСЃ `Commerce` (РЅР°РїСЂРёРјРµСЂ: `CommerceContract`, `CommerceObligation`, `CommerceFulfillmentEvent`). Р­С‚Рѕ РѕР±РµСЃРїРµС‡РёС‚ Р±РµР·РѕРїР°СЃРЅРѕРµ side-by-side СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёРµ.

1. **Zero Trust Tenant Isolation (RLS ENFORCEMENT):** 
   - Р’ РєР°Р¶РґРѕР№ С‚Р°Р±Р»РёС†Рµ РћР‘РЇР—РђРќРћ Р±С‹С‚СЊ РїРѕР»Рµ `companyId` (РїРѕ-СѓРјРѕР»С‡Р°РЅРёСЋ String).
   - Р—Р°РїСЂРµС‰РµРЅС‹ РїСЂРѕСЃС‚С‹Рµ primary keys. Р’РµР·РґРµ РґРѕР»Р¶РЅР° Р±С‹С‚СЊ СЃРІСЏР·РєР°: `@@unique([companyId, id])`.
   - Foreign key РѕС‚РЅРѕС€РµРЅРёСЏ Р”РћР›Р–РќР« РІРєР»СЋС‡Р°С‚СЊ `companyId` (РЅР°РїСЂ. `[companyId, obligationId] references [companyId, id]`).
   - РќР° СѓСЂРѕРІРЅРµ СЃРµСЂРІРёСЃР°: Р·Р°РїСЂРµС‚ cross-tenant СЃРІСЏР·РµР№ (СЏРІРЅР°СЏ РїСЂРѕРІРµСЂРєР° `source.companyId == target.companyId`).
2. **Double-Entry Ledger Canon:** 
   - РњРѕРґСѓР»Рё CRM Рё Commerce С…СЂР°РЅСЏС‚ Р±РёР·РЅРµСЃ-РґРѕРєСѓРјРµРЅС‚С‹. Ledger С…СЂР°РЅРёС‚ РЅРµРёР·РјРµРЅСЏРµРјС‹Рµ С„РёРЅР°РЅСЃРѕРІС‹Рµ РєРѕРЅС‚СЂРѕР»СЊРЅС‹Рµ СЃРѕР±С‹С‚РёСЏ.
   - Р’ `Invoice`: РїРѕР»Рµ `ledgerTxId String? @unique`. РРЅРІР°СЂРёР°РЅС‚: `status == POSTED => ledgerTxId != null`.
   - Р’ `Payment`: РїРѕР»Рµ `ledgerTxId String? @unique`. РРЅРІР°СЂРёР°РЅС‚: `status == CONFIRMED => ledgerTxId != null`.
   - РСЃРєР»СЋС‡Р°РµС‚СЃСЏ "posted Р±РµР· РїСЂРѕРІРѕРґРєРё".
3. **5 РЎР»РѕРµРІ РљРѕРјРјРµСЂС†РёРё (РЎРўР РћР“РђРЇ Р¦Р•РџРћР§РљРђ):** 
   - `CommerceContract` -> `CommerceObligation` -> `CommerceFulfillmentEvent` -> `Invoice` -> `Payment`.
   - РќРёРєР°РєРёС… РІРёСЃСЏС‰РёС… РёРЅРІРѕР№СЃРѕРІ: `Invoice.obligationId` **NOT NULL**.
   - `CommerceFulfillmentEvent.obligationId` **NOT NULL**.
   - `CommerceObligation.contractId` **NOT NULL**. Р—Р°РїСЂРµС‰РµРЅРѕ РѕР±С…РѕРґРёС‚СЊ СЌС‚Сѓ С†РµРїРѕС‡РєСѓ.
4. **Р”РѕРјРµРЅРЅР°СЏ РР·РѕР»СЏС†РёСЏ (CommerceFulfillmentEvent Enums):** 
   - РЎС‚СЂРѕРіРѕРµ РїРѕР»Рµ `eventDomain` (`COMMERCIAL`, `PRODUCTION`, `LOGISTICS`, `FINANCE_ADJ`).
   - РЎС‚СЂРѕРіРёР№ enum `eventType`, Р·Р°РІРёСЃСЏС‰РёР№ РѕС‚ РґРѕРјРµРЅР°:
     - `COMMERCIAL`: `GOODS_SHIPMENT`, `SERVICE_ACT`, `LEASE_USAGE`
     - `PRODUCTION`: `MATERIAL_CONSUMPTION`, `HARVEST`
     - `LOGISTICS`: `INTERNAL_TRANSFER`
     - `FINANCE_ADJ`: `WRITE_OFF`
5. **View-Models & Regulatory:** 
   РўР°РєРёРµ СЃСѓС‰РЅРѕСЃС‚Рё РєР°Рє РЎРєР»Р°Рґ (`StockMove`), РџР»Р°РЅ РїР»Р°С‚РµР¶РµР№ (`PaymentSchedule`) Рё Р­РєРѕРЅРѕРјРёРєР° (`RevenueRecognitionEvent`) СЏРІР»СЏСЋС‚СЃСЏ СЃР»РµРґСЃС‚РІРёРµРј Р±Р°Р·РѕРІС‹С… С„Р°РєС‚РѕРІ.

---

## РЁРђР“ 3: CHECKLIST РРњРџР›Р•РњР•РќРўРђР¦РР (РџР›РђРќ Р”Р•Р™РЎРўР’РР™)

РўРµР±Рµ РЅРµРѕР±С…РѕРґРёРјРѕ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕ РІС‹РїРѕР»РЅРёС‚СЊ СЃР»РµРґСѓСЋС‰РёРµ Р±Р»РѕРєРё Р·Р°РґР°С‡:

### Р‘Р›РћРљ Рђ: РРјРїР»РµРјРµРЅС‚Р°С†РёСЏ РЎС…РµРјС‹ Р‘Р°Р·С‹ Р”Р°РЅРЅС‹С… (Prisma)
РџСЂРёРґРµСЂР¶РёРІР°Р№СЃСЏ СЃС‚СЂРѕРіРёС… С‚РёРїРѕРІ Рё СЃРІСЏР·РµР№ СЃ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј `companyId`:
- [ ] **Р”РѕР±Р°РІРёС‚СЊ Party Management Models:** `Party`, `Jurisdiction`, `RegulatoryProfile`, `PartyRelation` (СЃ С‚РёРїР°РјРё `OWNERSHIP`, `COMMERCIAL`, `AFFILIATION`).
- [ ] **Р”РѕР±Р°РІРёС‚СЊ Contract Level 1 & 2:** `CommerceContract`, `CommerceContractPartyRole`, `CommerceObligation` (С‚РёРїС‹ `DELIVER`, `PAY`, `PERFORM`), `BudgetReservation`, `PaymentSchedule`.
- [ ] **Р”РѕР±Р°РІРёС‚СЊ Fulfillment Level 3:** `CommerceFulfillmentEvent` (СЃ РґРѕРјРµРЅРѕРј Рё С‚РёРїРѕРј РєР°Рє Enum), `StockMove` (РІРёСЂС‚СѓР°Р»СЊРЅР°СЏ РїРѕР·РёС†РёСЏ СЃРєР»Р°РґР°), `RevenueRecognitionEvent`.
- [ ] **Р”РѕР±Р°РІРёС‚СЊ Financial Level 4 & 5:** `Invoice` (AR/AP), `Payment`, `PaymentAllocation`.
- [ ] **Р”РѕР±Р°РІРёС‚СЊ RegulatoryArtifact Lifecycle:** РЎСѓС‰РЅРѕСЃС‚СЊ `RegulatoryArtifact` СЃРѕ СЃС‚Р°С‚СѓСЃР°РјРё (`PENDING`, `ISSUED`, `REJECTED`, `ACCEPTED`), РїРѕР»РµРј `externalRefId` (String).
- [ ] **РЎРІСЏР·Р°С‚СЊ СЃ Ledger:** РџРѕР»СЏ `ledgerTxId` (String?) РІ `Invoice` Рё `Payment` + РёРЅРІР°СЂРёР°РЅС‚С‹ NOT NULL.
- [ ] **РџСЂРѕРІРµСЂРєР° РјРёРіСЂР°С†РёР№:** РЈР±РµРґРёС‚СЊСЃСЏ, С‡С‚Рѕ `schema.prisma` РїСЂРѕС…РѕРґРёС‚ `npx prisma format` Рё `npx prisma validate`. РЎРѕР·РґР°С‚СЊ РјРёРіСЂР°С†РёСЋ.

### Р‘Р›РћРљ B: Р‘Р°Р·РѕРІС‹Рµ Domain Services (Backend - NestJS/Express/etc.)
- [ ] **Р РµР°Р»РёР·РёСЂРѕРІР°С‚СЊ С„СѓРЅРєС†РёСЋ `isIntercompany(sellerPartyId, buyerPartyId, asOf)`:** РљР°Рє СЃРµСЂРІРёСЃ-СѓС‚РёР»РёС‚Сѓ РґР»СЏ СЃРєР°РЅРёСЂРѕРІР°РЅРёСЏ РіСЂР°С„Р° `PartyRelation` РЅР° РїСЂРµРґРјРµС‚ `OWNERSHIP` СЃ РєРѕСЂРЅРµРІС‹Рј С…РѕР»РґРёРЅРіРѕРј.
- [ ] **РЎРѕР·РґР°С‚СЊ `CommerceContractService`:** РћСЂРєРµСЃС‚СЂР°С†РёСЏ СЃРѕР·РґР°РЅРёСЏ СЂР°РјРѕРє Рё РІР°Р»РёРґР°С†РёСЏ СЂРѕР»РµР№ (`CommerceContractPartyRole`). РќРёРєР°РєРёС… РґСѓР±Р»РµР№ СЂРѕР»РµР№.
- [ ] **РЎРѕР·РґР°С‚СЊ `FulfillmentService`:** РћР±СЂР°Р±РѕС‚РєР° СЃРѕР±С‹С‚РёР№. РџСЂРё СЃРѕР±С‹С‚РёРё `COMMERCIAL GOODS_SHIPMENT` СЃРµСЂРІРёСЃ РґРѕР»Р¶РµРЅ РїРѕСЂРѕР¶РґР°С‚СЊ Р°СЃСЃРѕС†РёРёСЂРѕРІР°РЅРЅС‹Р№ `StockMove`, СЃРїРёСЃС‹РІР°СЏ РўРњР¦ СЃРѕ СЃРєР»Р°РґР°.
- [ ] **РЎРѕР·РґР°С‚СЊ `BillingService` Рё `TaxEngine` Interface:** 
  Р›РѕРіРёРєР° РїРµСЂРµРІРѕРґР° `CommerceFulfillmentEvent` РІ `Invoice`. 
  `TaxEngine` РћР‘РЇР—РђРќ Р±С‹С‚СЊ РёРЅС‚РµСЂС„РµР№СЃРѕРј `calculate(context: TaxContext): TaxResult`, РіРґРµ Context: `sellerJurisdiction`, `buyerJurisdiction`, `supplyType`, `vatPayerStatus`, `productTaxCode?`.
  *РРЅРІР°СЂРёР°РЅС‚:* РЎРіРµРЅРµСЂРёСЂРѕРІР°РЅРЅС‹Р№ `Invoice` РґРѕР»Р¶РµРЅ С…СЂР°РЅРёС‚СЊ СЂРµР·СѓР»СЊС‚РёСЂСѓСЋС‰РёР№ `taxSnapshotJson` РєР°Рє РёРјРјСѓС‚Р°Р±РµР»СЊРЅС‹Р№ СЃР»РµРїРѕРє.
  РџРµСЂРµС…РѕРґ `Invoice` РІ СЃС‚Р°С‚СѓСЃ `POSTED` РґРѕР»Р¶РµРЅ Р±СЂРѕСЃР°С‚СЊ РёРІРµРЅС‚ СЃ СЃРѕР·РґР°РЅРёРµРј `ledgerTxId`.

### Р‘Р›РћРљ C: Data Transfer Objects (DTO) & Validations
- [ ] **РћРїСЂРµРґРµР»РёС‚СЊ Zod / Class-Validator DTOs:** Р”Р»СЏ СЃРѕР·РґР°РЅРёСЏ Р”РѕРіРѕРІРѕСЂР° (РІРєР»СЋС‡Р°СЏ РјР°СЃСЃРёРІ Р РѕР»РµР№).
- [ ] **РћРїСЂРµРґРµР»РёС‚СЊ DTO РґР»СЏ Fulfillment:** РЎ РІР°Р»РёРґР°С†РёРµР№ РїРѕР»СЏ `eventDomain` Рё СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РёС… РїРѕР»РµР№ (РЅР°РїСЂРёРјРµСЂ, `batchId` РѕР±СЏР·Р°С‚РµР»РµРЅ РґР»СЏ РѕС‚РіСЂСѓР·РєРё РЎР—Р ).

---

## РЁРђР“ 4: РљР РРўР•Р РР РџР РР•РњРљР (DEFINITION OF DONE - РЎРўР РћР“РР•!)
1. Р‘Р°Р·Р° СѓСЃРїРµС€РЅРѕ РіРµРЅРµСЂРёСЂСѓРµС‚СЃСЏ Рё РјРёРіСЂРёСЂСѓРµС‚ РЅР° PostgreSQL, С„РѕСЂРјР°С‚ СЃС…РµРјС‹ РІС‹РґРµСЂР¶Р°РЅ.
2. Р’ `schema.prisma` РЅРµС‚ С…Р°СЂРґРєРѕРґР°: `sellerId` Рё `buyerId` РІ РґРѕРіРѕРІРѕСЂРµ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚ (С‚РѕР»СЊРєРѕ `CommerceContractPartyRole`). РќРёРєР°РєРёС… nullable СЃРІСЏР·РµР№ (Not Null: `Invoice.obligationId`, `CommerceObligation.contractId`).
3. РљРѕРґ РїРѕР»РЅРѕСЃС‚СЊСЋ РїРѕРєСЂС‹С‚ RLS РєРѕРјРїРѕР·РёС‚РЅС‹РјРё РєР»СЋС‡Р°РјРё `@@unique([companyId, id])` Рё РїСЂРѕРІРµСЂРєР°РјРё СЃРІСЏР·РµР№ РїРѕ `companyId`.
4. **E2E RUNTIME РўР•РЎРў-РљР•Р™РЎ (РћР‘РЇР—РђРўР•Р›Р•Рќ Рљ РќРђРџРРЎРђРќРР® Р РџР РћРҐРћР–Р”Р•РќРР®):**
   - РЎРѕР·РґР°С‚СЊ `CommerceContract` (3 СЂРѕР»Рё: РџСЂРѕРґР°РІРµС†, РџРѕРєСѓРїР°С‚РµР»СЊ, РђРіРµРЅС‚).
   - РЎРѕР·РґР°С‚СЊ `CommerceObligation` (`DELIVER`).
   - РЎРѕР·РґР°С‚СЊ `CommerceFulfillmentEvent` (РґРѕРјРµРЅ `COMMERCIAL`, С‚РёРї `GOODS_SHIPMENT`) СЃСЃС‹Р»Р°СЋС‰РёР№СЃСЏ РЅР° Obligation.
   - РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ `Invoice` (СЃ РёРјРјСѓС‚Р°Р±РµР»СЊРЅС‹Рј `taxSnapshotJson`).
   - POST Invoice в†’ РїСЂРѕРІРµСЂРёС‚СЊ СЃРѕР·РґР°РЅРёРµ `LedgerTx`.
   - РЎРѕР·РґР°С‚СЊ `Payment`.
   - CONFIRM Payment в†’ РїСЂРѕРІРµСЂРёС‚СЊ СЃРѕР·РґР°РЅРёРµ `LedgerTx`.
   - РџСЂРѕРІРµСЂРёС‚СЊ AR Balance (РёР»Рё Р°РЅР°Р»РѕРі), Р·Р°РєСЂС‹РІР°РµРјС‹Р№ PaymentAllocation'РѕРј.

---
*Р”РµР№СЃС‚РІСѓР№ С€Р°Рі Р·Р° С€Р°РіРѕРј. Р’С‹РІРѕРґРё РёР·РјРµРЅРµРЅРёСЏ РїРѕСЃС‚РµРїРµРЅРЅРѕ. Р•СЃР»Рё СЃРѕРјРЅРµРІР°РµС€СЊСЃСЏ РІ РґРѕРјРµРЅРµ РёР»Рё РјР°РїРїРёРЅРіРµ вЂ” РѕСЃС‚Р°РЅРѕРІРёСЃСЊ Рё СЃРїСЂРѕСЃРё TECHLEAD.*

