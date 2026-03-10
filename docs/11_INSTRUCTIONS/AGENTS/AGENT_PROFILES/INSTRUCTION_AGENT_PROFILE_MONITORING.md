---
id: DOC-INS-AGT-PROFILE-004
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ MONITORING

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ СЂРѕР»СЊ, РѕРіСЂР°РЅРёС‡РµРЅРёСЏ Рё РїСЂРµРґРµР»СЊРЅС‹Р№ scope Р°РіРµРЅС‚Р° `monitoring`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР°:

- РїСЂРѕРµРєС‚РёСЂСѓРµС‚СЃСЏ monitoring РёР»Рё alerting СЃС†РµРЅР°СЂРёР№;
- РґРѕР±Р°РІР»СЏСЋС‚СЃСЏ РЅРѕРІС‹Рµ СЃРёРіРЅР°Р»С‹ Рё risk tools;
- РЅСѓР¶РЅРѕ РёР·Р±РµР¶Р°С‚СЊ РїРѕРґРјРµРЅС‹ РґРѕРјРµРЅРЅС‹С… operational owners РјРѕРЅРёС‚РѕСЂРёРЅРіРѕРІС‹Рј РєРѕРЅС‚СѓСЂРѕРј.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ runtime-Р°РіРµРЅС‚.
- Runtime family: СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain: `risk`.
- Adapter role: `monitoring`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

РџРѕ Stage 2 `monitoring` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ:

- owner-agent РґР»СЏ СЃРёРіРЅР°Р»РѕРІ, Р°Р»РµСЂС‚РѕРІ Рё risk contour;
- read-mostly / control-oriented Р°РіРµРЅС‚РѕРј;
- РєРѕРЅС‚СѓСЂРѕРј СЂР°РЅРЅРµРіРѕ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ, Р° РЅРµ Р°РіРµРЅС‚РѕРј Р±РёР·РЅРµСЃ-РёСЃРїРѕР»РЅРµРЅРёСЏ.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РµСЂРµР·:

- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [monitoring-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/monitoring-agent.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Р¤Р°РєС‚РёС‡РµСЃРєРё РїРѕРєСЂС‹РІР°РµС‚ intent:

- `emit_alerts`

РРјРµРµС‚ РІСЃС‚СЂРѕРµРЅРЅС‹Рµ:

- rate limit;
- deduplication;
- deterministic alert execution С‡РµСЂРµР· `RiskToolsRegistry`.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- СЃРёРіРЅР°Р»С‹;
- Р°Р»РµСЂС‚С‹;
- incidents;
- risk monitoring;
- СЃРІРѕРґРєР° РїСЂРёС‡РёРЅ Рё РёСЃС‚РѕС‡РЅРёРєРѕРІ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёР№;
- signal review Рё incident contour РєР°Рє read/control-layer, Р° РЅРµ remediation-layer.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- РџСЂРёРЅРёРјР°С‚СЊ СЃРёРіРЅР°Р»С‹ Рё РїСЂРµРІСЂР°С‰Р°С‚СЊ РёС… РІ alerts.
- РќРµ РґСѓР±Р»РёСЂРѕРІР°С‚СЊ РѕРґРёРЅР°РєРѕРІС‹Рµ alerts.
- РЎРѕР±Р»СЋРґР°С‚СЊ rate limiting.
- Р”Р°РІР°С‚СЊ explainable summary РїРѕ monitoring snapshot.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р‘СЂР°С‚СЊ ownership CRM, finance Рё agronomy operations.
- Р‘СЂР°С‚СЊ ownership РїРѕ РґРѕРіРѕРІРѕСЂРЅРѕРјСѓ, CRM, agronomy РёР»Рё finance remediation С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ РµСЃС‚СЊ alert РёР»Рё incident.
- Р’С‹РїРѕР»РЅСЏС‚СЊ Р±РёР·РЅРµСЃ-РґРµР№СЃС‚РІРёСЏ РІРјРµСЃС‚Рѕ owner-agent РґРѕРјРµРЅР°.
- РџРѕРґРјРµРЅСЏС‚СЊ escalation СЂРµС€РµРЅРёРµРј Рѕ СЂРµР°Р»СЊРЅРѕРј write-action.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- РѕР±СЂР°Р±РѕС‚РєР° СЃРёРіРЅР°Р»РѕРІ:
  - `emit_alerts`
- deterministic alert execution С‡РµСЂРµР· `RiskToolsRegistry`;
- РґРµРґСѓРїР»РёРєР°С†РёСЏ СЃРёРіРЅР°Р»РѕРІ Рё limit alert emission;
- monitoring summary РїРѕРІРµСЂС… deterministic result;
- signal-first behaviour Р±РµР· РїРµСЂРµС…РѕРґР° РІ remediation ownership;
- route-level support РґР»СЏ `/control-tower` Рё `/monitoring`.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё Р°РіРµРЅС‚ РјРѕР¶РµС‚ РїРѕРєСЂС‹РІР°С‚СЊ:

- multi-signal correlation;
- risk prioritization;
- incident digest Рё anomaly snapshots;
- signal-to-owner escalation preparation;
- governed escalation РІ owner-domains С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ;
- СЃРІСЏР·РєСѓ СЃ `controller` РєР°Рє Р±СѓРґСѓС‰РµР№ СЂРѕР»СЊСЋ РєРѕРЅС‚СЂРѕР»СЏ.

РќРµ РґРѕР»Р¶РµРЅ РїРѕРєСЂС‹РІР°С‚СЊ:

- РїСЂСЏРјРѕРµ РІС‹РїРѕР»РЅРµРЅРёРµ remediation РґРµР№СЃС‚РІРёР№;
- РїРµСЂРµС…РІР°С‚ ownership Сѓ finance, agro, CRM;
- contract execution РёР»Рё CRM updates;
- СЃРєСЂС‹С‚С‹Р№ operational mesh.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- Р’СЃРµ РІС‹Р·РѕРІС‹ РёРґСѓС‚ С‡РµСЂРµР· orchestration spine.
- Handoff РІ РґСЂСѓРіРѕР№ РґРѕРјРµРЅ РґРѕРїСѓСЃС‚РёРј С‚РѕР»СЊРєРѕ РєР°Рє governed escalation.
- РђРіРµРЅС‚ РЅРµ РґРѕР»Р¶РµРЅ РЅР°РїСЂСЏРјСѓСЋ Р°РєС‚РёРІРёСЂРѕРІР°С‚СЊ peer agent.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `agronomist`: РІРѕР·РјРѕР¶РЅР° РїРµСЂРµРґР°С‡Р° СЃРёРіРЅР°Р»РѕРІ agro-risk С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.
- РЎ `economist`: РІРѕР·РјРѕР¶РЅР° РїРµСЂРµРґР°С‡Р° finance-risk С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.
- РЎ `crm_agent`: РІРѕР·РјРѕР¶РЅР° СЌСЃРєР°Р»Р°С†РёСЏ РєР»РёРµРЅС‚СЃРєРѕРіРѕ СЃРёРіРЅР°Р»Р°, РЅРѕ РЅРµ ownership.
- РЎ `knowledge`: РІРѕР·РјРѕР¶РЅР° РїСЂРѕРІРµСЂРєР° policy РїРѕ incident rules С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`monitoring` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ primary owner, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє signal/risk review:

- РІС‹РїСѓСЃС‚РёС‚СЊ alert;
- РїРѕРєР°Р·Р°С‚СЊ alerts summary;
- СЃРѕР±СЂР°С‚СЊ incident snapshot;
- РїРѕРєР°Р·Р°С‚СЊ anomaly digest;
- РѕР±СЉСЏСЃРЅРёС‚СЊ, РєР°РєРёРµ СЃРёРіРЅР°Р»С‹ СЃСЂР°Р±РѕС‚Р°Р»Рё Рё РїРѕС‡РµРјСѓ;
- РїРѕРєР°Р·Р°С‚СЊ monitoring summary Р±РµР· business remediation.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `monitoring`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ СѓР¶Рµ РґРѕРјРµРЅРЅРѕРµ:

- РІС‹РїРѕР»РЅРёС‚СЊ agronomy remediation РёР»Рё РїРѕР»РµРІРѕРµ РґРµР№СЃС‚РІРёРµ;
- РїРѕСЃС‡РёС‚Р°С‚СЊ finance impact РёР»Рё РІС‹РїРѕР»РЅРёС‚СЊ finance analysis;
- РѕР±РЅРѕРІРёС‚СЊ CRM-record РёР»Рё РѕС‚СЂР°Р±РѕС‚Р°С‚СЊ РєР»РёРµРЅС‚СЃРєРёР№ РєРµР№СЃ;
- РІС‹РїРѕР»РЅРёС‚СЊ РґРѕРіРѕРІРѕСЂРЅРѕРµ, invoice РёР»Рё payment РґРµР№СЃС‚РІРёРµ;
- РёР·РјРµРЅРёС‚СЊ business state РІ Р»СЋР±РѕРј operational domain.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `monitoring` С„РёРєСЃРёСЂСѓРµС‚ Рё РѕР±СЉСЏСЃРЅСЏРµС‚ СЃРёРіРЅР°Р»;
- `agronomist` РІР»Р°РґРµРµС‚ СЂРµР°РєС†РёРµР№ РЅР° agro-risk С‡РµСЂРµР· РїРѕР»РµРІРѕРµ РґРµР№СЃС‚РІРёРµ;
- `economist` РІР»Р°РґРµРµС‚ financial interpretation finance-risk;
- `crm_agent` РІР»Р°РґРµРµС‚ РєР»РёРµРЅС‚СЃРєРёРј remediation path;
- `contracts_agent` РІР»Р°РґРµРµС‚ contract / invoice / payment remediation path.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РІ `agronomist`, РєРѕРіРґР° СЃРёРіРЅР°Р» С‚СЂРµР±СѓРµС‚ agronomy remediation;
- РІ `economist`, РєРѕРіРґР° СЃРёРіРЅР°Р» С‚СЂРµР±СѓРµС‚ finance interpretation;
- РІ `crm_agent`, РєРѕРіРґР° СЃРёРіРЅР°Р» РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє account issue, CRM anomaly РёР»Рё РєР»РёРµРЅС‚СЃРєРѕРјСѓ РєРѕРЅС‚РµРєСЃС‚Сѓ;
- РІ `contracts_agent`, РєРѕРіРґР° СЃРёРіРЅР°Р» РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє РґРѕРіРѕРІРѕСЂРЅРѕРјСѓ СЃР±РѕСЋ, invoice/payment issue;
- РІ `knowledge`, РєРѕРіРґР° РЅСѓР¶РµРЅ policy / incident-rule grounding.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- alert РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє СѓР¶Рµ РёР·РІРµСЃС‚РЅРѕРјСѓ business object;
- incident С‚СЂРµР±СѓРµС‚ downstream write-action;
- РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїСЂРѕСЃРёС‚ `РёСЃРїСЂР°РІРёС‚СЊ`, `Р·Р°РєСЂС‹С‚СЊ`, `РїСЂРѕРІРµСЃС‚Рё`, `РѕР±РЅРѕРІРёС‚СЊ`, `СЃРѕР·РґР°С‚СЊ`;
- monitoring route РѕС‚РєСЂС‹С‚ РєР°Рє С‚РѕС‡РєР° РІС…РѕРґР°, РЅРѕ С†РµР»РµРІРѕРµ РґРµР№СЃС‚РІРёРµ СѓР¶Рµ РґРѕРјРµРЅРЅРѕРµ.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ СѓРґРµСЂР¶РёРІР°С‚СЊ ownership Сѓ `monitoring`, РµСЃР»Рё РіР»Р°РІРЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ Р·Р°РїСЂРѕСЃР° СѓР¶Рµ РЅРµ signal review, Р° remediation РёР»Рё business execution.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `RiskToolsRegistry`
- monitoring / control tower contour

## 14. Required Context Contract

- Р‘Р°Р·РѕРІС‹Р№ РєРѕРЅС‚РµРєСЃС‚: РЅР°Р±РѕСЂ `signals`.
- РџСЂРё РѕС‚СЃСѓС‚СЃС‚РІРёРё СЏРІРЅС‹С… СЃРёРіРЅР°Р»РѕРІ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ mock/default snapshot, С‡С‚Рѕ РґРѕРїСѓСЃС‚РёРјРѕ РґР»СЏ fallback-СЂРµР¶РёРјР°, РЅРѕ РЅРµ Р·Р°РјРµРЅСЏРµС‚ production feed.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

- `emit_alerts`

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… monitoring-domain РґРѕРїСѓСЃС‚РёРјС‹ РґР°Р»СЊРЅРµР№С€РёРµ intent-С‹ С‚РѕР»СЊРєРѕ С‚Р°РєРѕРіРѕ С‚РёРїР°:

- incident summary;
- anomaly review;
- multi-signal correlation;
- signal prioritization;
- governed escalation preparation.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `monitoring` РІ owner РґР»СЏ agronomy, finance, CRM РёР»Рё contracts execution.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

- `EmitAlerts`
- `GetWeatherForecast` РєР°Рє supporting tool, РЅРѕ РЅРµ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ owner-intent

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ monitoring-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- signal correlation tooling;
- anomaly review tooling;
- incident summary tooling;
- escalation context assembly.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- agronomy-owner tools;
- finance-owner tools;
- CRM write tools;
- contracts execution tools.

## 17. UI surface

- РєРѕРЅС‚СЂРѕР»СЊРЅС‹Рµ Рё monitoring windows;
- alerts summary;
- risk status output.

## 18. Guardrails

- Р—Р°РїСЂРµС‚ РЅР° ownership С‡СѓР¶РёС… operational domains.
- Read/control-first С…Р°СЂР°РєС‚РµСЂ.
- Handoff С‚РѕР»СЊРєРѕ С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ СѓР·РµР».

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РЎРёРіРЅР°Р»СЊРЅС‹Р№ РєРѕРЅС‚СѓСЂ РјР°СЃРєРёСЂСѓРµС‚ РѕС‚СЃСѓС‚СЃС‚РІРёРµ owner-agent РІ РґСЂСѓРіРѕРј РґРѕРјРµРЅРµ.
- Alert fatigue РёР·-Р·Р° СЃР»Р°Р±РѕР№ РЅР°СЃС‚СЂРѕР№РєРё dedup Рё rate limit.
- РќРµСЏРІРЅРѕРµ СЂР°СЃС€РёСЂРµРЅРёРµ РІ business execution.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- РўРµСЃС‚ РЅР° `emit_alerts` routing.
- РўРµСЃС‚С‹ РЅР° rate limit.
- РўРµСЃС‚С‹ РЅР° dedup.
- РўРµСЃС‚С‹ РЅР° Р·Р°РїСЂРµС‚ cross-domain execution.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- РЎРёРіРЅР°Р»С‹ РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅРѕ.
- Dedup Рё rate limit СЂР°Р±РѕС‚Р°СЋС‚.
- РќРµС‚ РїРѕРґРјРµРЅС‹ operational ownership.
- Р•СЃС‚СЊ smoke-РЅР°Р±РѕСЂ РїРѕ СЃРёРіРЅР°Р»Р°Рј Рё Р°Р»РµСЂС‚Р°Рј.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [monitoring-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/monitoring-agent.service.ts)


