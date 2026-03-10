---
id: DOC-INS-AGT-005
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” Р”РћРњР•РќРќР«Р• Р РђР—Р Р«Р’Р« Р РњРћР”РЈР›Р Р‘Р•Р— РђР“Р•РќРўРќРћР“Рћ Р’Р›РђР”Р•Р›Р¬Р¦Рђ

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ РґРѕРјРµРЅС‹, РіРґРµ:

- Р±РёР·РЅРµСЃ-РјРѕРґСѓР»СЊ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚;
- Р»РёР±Рѕ Stage 2 СѓР¶Рµ С‚СЂРµР±СѓРµС‚ agent-owner;
- РЅРѕ owner-agent РЅРµ РґРѕРІРµРґС‘РЅ РґРѕ canonical runtime СЃРѕСЃС‚РѕСЏРЅРёСЏ;
- Р»РёР±Рѕ Р»РѕРіРёС‡РµСЃРєРёР№ owner СѓР¶Рµ РѕРїСЂРµРґРµР»С‘РЅ, РЅРѕ direct production-routing РІ РЅРµРіРѕ РµС‰С‘ Р·Р°РїСЂРµС‰С‘РЅ.

Р”РѕРєСѓРјРµРЅС‚ РЅСѓР¶РµРЅ, С‡С‚РѕР±С‹:

- РЅРµ РїСѓС‚Р°С‚СЊ РЅР°Р»РёС‡РёРµ РјРѕРґСѓР»СЏ СЃ РЅР°Р»РёС‡РёРµРј Р°РіРµРЅС‚Р°;
- РЅРµ РїСѓС‚Р°С‚СЊ Р»РѕРіРёС‡РµСЃРєРѕРіРѕ owner РґРѕРјРµРЅР° СЃ production owner РґР»СЏ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂР°;
- РїСЂРѕРµРєС‚РёСЂРѕРІР°С‚СЊ СЃР»РµРґСѓСЋС‰СѓСЋ РІРѕР»РЅСѓ ownership map;
- РїСЂРёРѕСЂРёС‚РёР·РёСЂРѕРІР°С‚СЊ РЅРѕРІС‹Рµ agent families;
- РѕР±СЉСЏСЃРЅСЏС‚СЊ UX-РёРЅС†РёРґРµРЅС‚С‹, РєРѕРіРґР° СЃРёСЃС‚РµРјР° СЃРІР°Р»РёРІР°РµС‚СЃСЏ РІ fallback РІРјРµСЃС‚Рѕ СЂРµР°Р»СЊРЅРѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ Р°РіРµРЅС‚Р°.

---

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РЅСѓР¶РЅРѕ, РµСЃР»Рё:

- РЅР°Р№РґРµРЅ СЃС†РµРЅР°СЂРёР№, РіРґРµ С‡Р°С‚ РїРѕРєР°Р·С‹РІР°РµС‚ fallback РІРјРµСЃС‚Рѕ СЂРµР°Р»СЊРЅРѕРіРѕ execution path;
- РѕР±СЃСѓР¶РґР°РµС‚СЃСЏ СЂР°СЃС€РёСЂРµРЅРёРµ ownership map;
- СЃРѕР·РґР°С‘С‚СЃСЏ РЅРѕРІС‹Р№ canonical Р°РіРµРЅС‚;
- РЅСѓР¶РЅРѕ РѕР±РѕСЃРЅРѕРІР°С‚СЊ, РїРѕС‡РµРјСѓ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ РјРѕРґСѓР»СЊ РµС‰С‘ РЅРµ СЃС‡РёС‚Р°РµС‚СЃСЏ agent-enabled;
- РЅСѓР¶РЅРѕ РїРѕРЅСЏС‚СЊ, РєР°РєРѕР№ СЃР»РµРґСѓСЋС‰РёР№ РґРѕРјРµРЅ РїСЂРµРІСЂР°С‰Р°С‚СЊ РІ owner-agent.

---

## 3. Р§С‚Рѕ СЃС‡РёС‚Р°РµС‚СЃСЏ Р°РіРµРЅС‚РЅС‹Рј СЂР°Р·СЂС‹РІРѕРј

РђРіРµРЅС‚РЅС‹Рј СЂР°Р·СЂС‹РІРѕРј СЃС‡РёС‚Р°РµС‚СЃСЏ СЃРёС‚СѓР°С†РёСЏ, РєРѕРіРґР°:

- backend-РјРѕРґСѓР»СЊ СЃСѓС‰РµСЃС‚РІСѓРµС‚;
- РїСЂРѕРґСѓРєС‚РѕРІС‹Р№ СЃС†РµРЅР°СЂРёР№ СЃСѓС‰РµСЃС‚РІСѓРµС‚;
- Stage 2 Р»РѕРіРёРєР° РїСЂРµРґРїРѕР»Р°РіР°РµС‚ owner-agent;
- РЅРѕ РІ production-routing РЅРµС‚ РґРѕРїСѓСЃС‚РёРјРѕРіРѕ РєР°РЅРѕРЅРёС‡РµСЃРєРѕРіРѕ agent-owner;
- РЅРµС‚ intent-owner РІ routing layer;
- РЅРµС‚ tool surface Рё rich-output path РґР»СЏ СЌС‚РѕРіРѕ РґРѕРјРµРЅР°.

РРЅС‹РјРё СЃР»РѕРІР°РјРё:

`РјРѕРґСѓР»СЊ РµСЃС‚СЊ` != `agent-owner РµСЃС‚СЊ`

### 3.1 РўРёРїС‹ Р°РіРµРЅС‚РЅС‹С… СЂР°Р·СЂС‹РІРѕРІ

Р”Р»СЏ СЌС‚РѕРіРѕ РґРѕРєСѓРјРµРЅС‚Р° РЅСѓР¶РЅРѕ СЂР°Р·Р»РёС‡Р°С‚СЊ РґРІР° СЂР°Р·РЅС‹С… РєР»Р°СЃСЃР° gap:

- `NO OWNER YET` вЂ” Сѓ РґРѕРјРµРЅР° РЅРµС‚ РЅРё canonical runtime owner, РЅРё even template-role, РїСЂРёРіРѕРґРЅРѕР№ РєР°Рє production owner;
- `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE` вЂ” Р»РѕРіРёС‡РµСЃРєРёР№ owner СѓР¶Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РІ Stage 2 Рё template-layer, РЅРѕ direct production-routing РІ РЅРµРіРѕ РµС‰С‘ Р·Р°РїСЂРµС‰С‘РЅ.

Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ СЂР°Р±РѕС‡РёР№ СЃР»СѓС‡Р°Р№:

- `PARTIAL CANONICAL COVERAGE` вЂ” canonical owner СѓР¶Рµ РµСЃС‚СЊ, РЅРѕ РґРѕРјРµРЅ РїРѕРєСЂС‹С‚ РЅРµ РїРѕР»РЅРѕСЃС‚СЊСЋ. Р­С‚Рѕ РІР°Р¶РЅРѕ РґР»СЏ roadmap, РЅРѕ РЅРµ СЂР°РІРЅРѕ РѕС‚СЃСѓС‚СЃС‚РІРёСЋ owner-agent.

---

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РєР°РЅРѕРЅ Stage 2 РїРѕ ownership

РџРѕ Stage 2 Р·СЂРµР»С‹Р№ РґРѕРјРµРЅ РґРѕР»Р¶РµРЅ РёРјРµС‚СЊ:

- owner-agent;
- СЏРІРЅСѓСЋ Р·РѕРЅСѓ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё;
- contracts СѓСЂРѕРІРЅСЏ `Focus / Intent / Context / UI`;
- governed execution path;
- explainability Рё traceability;
- С‚РµСЃС‚С‹ Рё smoke-РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ.

Р•СЃР»Рё СЌС‚РѕРіРѕ РЅРµС‚, РґРѕРјРµРЅ СЃС‡РёС‚Р°РµС‚СЃСЏ РЅРµРїРѕР»РЅРѕСЃС‚СЊСЋ РїРѕРґРєР»СЋС‡С‘РЅРЅС‹Рј Рє Agent Platform.

РСЃС‚РѕС‡РЅРёРєРё:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)

---

## 5. РўРµРєСѓС‰Р°СЏ РєР°СЂС‚Р° СЂР°Р·СЂС‹РІРѕРІ

### 5.1 Р”РѕРјРµРЅС‹, РіРґРµ Р»РѕРіРёС‡РµСЃРєРёР№ owner СѓР¶Рµ РµСЃС‚СЊ, РЅРѕ production-routing РµС‰С‘ Р·Р°РїСЂРµС‰С‘РЅ

| Р”РѕРјРµРЅ | Р›РѕРіРёС‡РµСЃРєРёР№ owner | Р§С‚Рѕ СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ | Р§С‚Рѕ РµС‰С‘ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | Routing СЃРµРіРѕРґРЅСЏ | Gap severity |
|---|---|---|---|---|---|
| `legal` | `legal_advisor` | РµСЃС‚СЊ legal-module; РµСЃС‚СЊ template-role; legal advisory-path СѓР¶Рµ Р»РѕРіРёС‡РµСЃРєРё Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ | РЅРµС‚ canonical runtime family; РЅРµС‚ РѕС‚РґРµР»СЊРЅРѕРіРѕ intent catalog; РЅРµС‚ production execution path | direct routing РІ `legal_advisor` Р·Р°РїСЂРµС‰С‘РЅ; mixed legal/contract Р·Р°РїСЂРѕСЃС‹ СѓРґРµСЂР¶РёРІР°СЋС‚СЃСЏ Сѓ `contracts_agent`, retrieval РёРґС‘С‚ С‡РµСЂРµР· `knowledge` | `HIGH` |
| `strategy` | `strategist` | РµСЃС‚СЊ strategic module; РµСЃС‚СЊ template-role; strategy semantics РѕРїРёСЃР°РЅР° | РЅРµС‚ canonical runtime family; РЅРµС‚ strategy intent-owner РєР°Рє РѕС‚РґРµР»СЊРЅРѕР№ family; РЅРµС‚ production execution path | direct routing РІ `strategist` Р·Р°РїСЂРµС‰С‘РЅ; production-routing РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `economist` РёР»Рё `knowledge` РїРѕ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРјСѓ РґРµР№СЃС‚РІРёСЋ | `HIGH` |
| `marketing` | `marketer` | РµСЃС‚СЊ template-role; marketing template semantics СѓР¶Рµ РѕРїРёСЃР°РЅР° | РЅРµС‚ canonical runtime family; РЅРµС‚ runtime intents; РЅРµС‚ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅРѕРіРѕ tool layer РІ `rai-chat` runtime | direct routing РІ `marketer` Р·Р°РїСЂРµС‰С‘РЅ; marketing/advisory Р·Р°РїСЂРѕСЃС‹ СѓРґРµСЂР¶РёРІР°СЋС‚СЃСЏ Сѓ `knowledge` РёР»Рё `crm_agent` РїРѕ РєРѕРЅС‚РµРєСЃС‚Сѓ | `MEDIUM` |
| `control` | `controller` | РµСЃС‚СЊ template-role; control semantics Рё template inheritance РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ | РЅРµС‚ canonical runtime family; РЅРµС‚ exception contract; РЅРµС‚ production split СЃ `monitoring` Рё `economist` | direct routing РІ `controller` Р·Р°РїСЂРµС‰С‘РЅ; production-routing РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `monitoring` РёР»Рё `economist` | `HIGH` |
| `personal_ops` | `personal_assistant` | РµСЃС‚СЊ template-role; РµСЃС‚СЊ delegated/personal semantics | РЅРµС‚ canonical runtime family; РЅРµС‚ personal context contract; РЅРµС‚ privacy-safe production tool surface | direct routing РІ `personal_assistant` Р·Р°РїСЂРµС‰С‘РЅ; business-Р·Р°РїСЂРѕСЃС‹ РѕСЃС‚Р°СЋС‚СЃСЏ Сѓ РґРѕРјРµРЅРЅРѕРіРѕ owner-agent | `MEDIUM` |

### 5.2 Р”РѕРјРµРЅС‹, РіРґРµ owner-agent РµС‰С‘ РЅРµ РѕРїСЂРµРґРµР»С‘РЅ РІРѕРѕР±С‰Рµ

| Р”РѕРјРµРЅ | Р§С‚Рѕ СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ | Р§РµРіРѕ РЅРµС‚ | Routing СЃРµРіРѕРґРЅСЏ | Gap severity |
|---|---|---|---|---|
| `hr` | РґРѕРјРµРЅ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚ РІ platform map | РЅРµС‚ owner-agent; РЅРµС‚ template-role; РЅРµС‚ intent-owner; РЅРµС‚ agent runtime path | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` |
| `exploration` | РµСЃС‚СЊ product/module presence РІ platform map | РЅРµС‚ owner-agent; РЅРµС‚ canonical intent-owner; РЅРµС‚ runtime family | `BACKLOG_ONLY` РёР»Рё read-only support С‡РµСЂРµР· `knowledge` | `LOW` |

### 5.3 РљР°Рє С‡РёС‚Р°С‚СЊ severity РїРѕСЃР»Рµ РІРІРµРґРµРЅРёСЏ production gate

- `HIGH` вЂ” РґРѕРјРµРЅ СѓР¶Рµ Р»РѕРіРёС‡РµСЃРєРё РІС‹РґРµР»РµРЅ, РЅРѕ РµРіРѕ РѕС‚СЃСѓС‚СЃС‚РІРёРµ РєР°Рє production owner СЃРµСЂСЊС‘Р·РЅРѕ РёСЃРєР°Р¶Р°РµС‚ routing РёР»Рё РІР°Р¶РЅС‹Рµ advisory/execution РіСЂР°РЅРёС†С‹.
- `MEDIUM` вЂ” РґРѕРјРµРЅ РЅСѓР¶РµРЅ, РЅРѕ СЃРµР№С‡Р°СЃ РјРѕР¶РµС‚ Р¶РёС‚СЊ С‡РµСЂРµР· bounded fallback Р±РµР· РєСЂРёС‚РёС‡РµСЃРєРѕРіРѕ СЂР°СЃРїР°РґР° ownership.
- `LOW` вЂ” РїРѕРґРґРµСЂР¶РёРІР°СЋС‰РёР№ РёР»Рё РёСЃСЃР»РµРґРѕРІР°С‚РµР»СЊСЃРєРёР№ РєРѕРЅС‚СѓСЂ, РіРґРµ РѕС‚СЃСѓС‚СЃС‚РІРёРµ owner-agent РµС‰С‘ РЅРµ Р»РѕРјР°РµС‚ РѕСЃРЅРѕРІРЅСѓСЋ multi-agent topology.

---

## 6. Р РµРєРѕРјРµРЅРґСѓРµРјС‹Р№ Р±СѓРґСѓС‰РёР№ agent-owner

| Р”РѕРјРµРЅ | Р РµРєРѕРјРµРЅРґСѓРµРјС‹Р№ owner-agent | Р§С‚Рѕ СЌС‚Рѕ Р·Р°РєСЂРѕРµС‚ |
|---|---|---|
| `legal` | `legal_advisor` РєР°Рє Р±СѓРґСѓС‰РёР№ canonical agent | legal advisory РїРµСЂРµСЃС‚Р°РЅРµС‚ РјР°СЃРєРёСЂРѕРІР°С‚СЊСЃСЏ РїРѕРґ `contracts_agent` РёР»Рё `knowledge`, Р° РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ РїРѕР»СѓС‡РёС‚ С‡РµСЃС‚РЅС‹Р№ legal owner-path |
| `strategy` | `strategist` РєР°Рє Р±СѓРґСѓС‰РёР№ canonical agent | СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёРµ СЃС†РµРЅР°СЂРёРё РїРµСЂРµСЃС‚Р°РЅСѓС‚ СЂР°Р·РјС‹РІР°С‚СЊСЃСЏ РјРµР¶РґСѓ `economist` Рё `knowledge` |
| `marketing` | `marketer` РєР°Рє Р±СѓРґСѓС‰РёР№ canonical agent | marketing advisory Рё CRM-adjacent СЃС†РµРЅР°СЂРёРё РїРѕР»СѓС‡Р°С‚ РѕС‚РґРµР»СЊРЅС‹Р№ ownership РІРјРµСЃС‚Рѕ РєРѕСЃРІРµРЅРЅРѕРіРѕ routing С‡РµСЂРµР· `knowledge`/`crm_agent` |
| `control` | `controller` РєР°Рє Р±СѓРґСѓС‰РёР№ canonical agent | РєРѕРЅС‚СЂРѕР»СЊРЅС‹Рµ exceptions РїРµСЂРµСЃС‚Р°РЅСѓС‚ СЂР°Р·РјР°Р·С‹РІР°С‚СЊСЃСЏ РјРµР¶РґСѓ `monitoring` Рё `economist` |
| `personal_ops` | `personal_assistant` РєР°Рє Р±СѓРґСѓС‰РёР№ canonical agent | Р»РёС‡РЅС‹Р№ delegated contour РѕС‚РґРµР»РёС‚СЃСЏ РѕС‚ Р±РёР·РЅРµСЃ-owner-Р°РіРµРЅС‚РѕРІ Рё РЅРµ Р±СѓРґРµС‚ РёСЃРєР°Р¶Р°С‚СЊ routing |
| `hr` | owner-agent РїРѕРєР° РЅРµ РѕРїСЂРµРґРµР»С‘РЅ | СЃРЅР°С‡Р°Р»Р° РЅСѓР¶РЅРѕ Р·Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ owner-domain semantics Рё intent-owner Р·РѕРЅСѓ |
| `exploration` | owner-agent РїРѕРєР° РЅРµ РѕРїСЂРµРґРµР»С‘РЅ | СЃРЅР°С‡Р°Р»Р° РЅСѓР¶РЅРѕ СЂРµС€РёС‚СЊ, РЅСѓР¶РµРЅ Р»Рё РІРѕРѕР±С‰Рµ РѕС‚РґРµР»СЊРЅС‹Р№ owner-agent, Р° РЅРµ supporting read contour |

### РџСЂР°РІРёР»Рѕ

Р•СЃР»Рё РґРѕРјРµРЅ:

- РёРјРµРµС‚ СЃРѕР±СЃС‚РІРµРЅРЅСѓСЋ Р±РёР·РЅРµСЃ-Р»РѕРіРёРєСѓ;
- РЅРµСЃС‘С‚ РѕС‚РґРµР»СЊРЅС‹Рµ СЂРёСЃРєРё;
- С‚СЂРµР±СѓРµС‚ СЃРІРѕРёС… intent-РѕРІ Рё guardrails;

С‚Рѕ РµРіРѕ Р»СѓС‡С€Рµ СЂР°Р·РІРёРІР°С‚СЊ РєР°Рє РѕС‚РґРµР»СЊРЅРѕРіРѕ owner-agent, Р° РЅРµ РєР°Рє Р±РµСЃРєРѕРЅС‚СЂРѕР»СЊРЅРѕРµ СЂР°СЃС€РёСЂРµРЅРёРµ С‡СѓР¶РѕРіРѕ Р°РіРµРЅС‚Р°.

РќРѕ РѕС‚РґРµР»СЊРЅС‹Р№ owner-agent СЃС‡РёС‚Р°РµС‚СЃСЏ Р·Р°РєСЂС‹С‚С‹Рј С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РїРѕСЏРІР»РµРЅРёСЏ:

- canonical runtime family;
- intent catalog;
- required context contract;
- execution path, РІ РєРѕС‚РѕСЂС‹Р№ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ РёРјРµРµС‚ РїСЂР°РІРѕ РґРµР»Р°С‚СЊ production-routing.

---

## 7. Р РёСЃРє РґР»СЏ РѕСЂРєРµСЃС‚СЂР°С†РёРё Рё UX

Р•СЃР»Рё РґРѕРјРµРЅ РѕСЃС‚Р°С‘С‚СЃСЏ РІ gap-СЃРѕСЃС‚РѕСЏРЅРёРё, РІРѕР·РЅРёРєР°СЋС‚ СЂР°Р·РЅС‹Рµ РєР»Р°СЃСЃС‹ СЂРёСЃРєРѕРІ.

### 7.1 Р РёСЃРє РґР»СЏ `NO OWNER YET`

- СЃС†РµРЅР°СЂРёР№ СѓС…РѕРґРёС‚ РІ `MANUAL_HUMAN_REQUIRED` РёР»Рё `BACKLOG_ONLY`;
- ownership map РёРјРµРµС‚ СЂРµР°Р»СЊРЅСѓСЋ РґС‹СЂСѓ;
- РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ РЅРµ РјРѕР¶РµС‚ РґР°Р¶Рµ Р»РѕРіРёС‡РµСЃРєРё РѕРїСЂРµРґРµР»РёС‚СЊ Р±СѓРґСѓС‰РёР№ owner-path;
- РІРѕР·РЅРёРєР°РµС‚ РґР°РІР»РµРЅРёРµ РЅР° СЃРѕСЃРµРґРЅРёРµ Р°РіРµРЅС‚С‹, С‡С‚РѕР±С‹ РѕРЅРё Р·Р°С…РІР°С‚РёР»Рё С‡СѓР¶РѕР№ РґРѕРјРµРЅ.

### 7.2 Р РёСЃРє РґР»СЏ `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE`

- fallback РјР°СЃРєРёСЂСѓРµС‚ РѕС‚СЃСѓС‚СЃС‚РІРёРµ СЂРµР°Р»СЊРЅРѕРіРѕ agent path;
- responsibility map РїР»Р°С‚С„РѕСЂРјС‹ СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РЅРµС‡С‘С‚РєРѕР№;
- РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ РєР°Р¶РµС‚СЃСЏ, С‡С‚Рѕ Р°РіРµРЅС‚ вЂњСѓРјРµРµС‚ РґРѕРјРµРЅвЂќ, С…РѕС‚СЏ СЌС‚Рѕ РЅРµ С‚Р°Рє;
- СѓСЃР»РѕР¶РЅСЏРµС‚СЃСЏ routing;
- РІРѕР·РЅРёРєР°РµС‚ СЃРѕР±Р»Р°Р·РЅ РЅР°РїСЂР°РІРёС‚СЊ Р·Р°РїСЂРѕСЃ РїСЂСЏРјРѕ РІ template-role, РїРѕС‚РѕРјСѓ С‡С‚Рѕ Сѓ РЅРµС‘ СѓР¶Рµ РµСЃС‚СЊ profile Рё manifest;
- РІРѕР·РЅРёРєР°РµС‚ СЃРѕР±Р»Р°Р·РЅ СЂР°СЃС€РёСЂСЏС‚СЊ С‡СѓР¶РѕР№ Р°РіРµРЅС‚ Р·Р° РїСЂРµРґРµР»С‹ РµРіРѕ РґРѕРјРµРЅР°;
- СЂР°СЃС‚С‘С‚ СЂРёСЃРє С…Р°РѕС‚РёС‡РµСЃРєРѕРіРѕ `all-to-all` РјС‹С€Р»РµРЅРёСЏ РІРјРµСЃС‚Рѕ hub-and-spoke РјРѕРґРµР»Рё.

Р”Р»СЏ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёРё С‚Р°РєРёРµ СЂР°Р·СЂС‹РІС‹ РґРѕР»Р¶РЅС‹ С‚СЂР°РєС‚РѕРІР°С‚СЊСЃСЏ РїРѕ РїСЂР°РІРёР»Р°Рј
[INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md),
Р° РЅРµ Р·Р°РєСЂС‹РІР°С‚СЊСЃСЏ prose-fallback.

---

## 8. Р§С‚Рѕ РґРѕР»Р¶РЅРѕ РїРѕР»СѓС‡РёС‚СЊСЃСЏ РЅР° РІС‹С…РѕРґРµ

РџРѕСЃР»Рµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ РґРѕРєСѓРјРµРЅС‚Р° РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ РІРѕР·РјРѕР¶РЅРѕ:

- Р±С‹СЃС‚СЂРѕ РѕРїСЂРµРґРµР»РёС‚СЊ, РїРѕС‡РµРјСѓ РєРѕРЅРєСЂРµС‚РЅС‹Р№ РґРѕРјРµРЅРЅС‹Р№ СЃС†РµРЅР°СЂРёР№ РµС‰С‘ РЅРµ СЂР°Р±РѕС‚Р°РµС‚ С‡РµСЂРµР· AI;
- Р±С‹СЃС‚СЂРѕ РїРѕРЅСЏС‚СЊ, СЌС‚Рѕ `NO OWNER YET` РёР»Рё `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE`;
- СѓРІРёРґРµС‚СЊ, РєС‚Рѕ СЏРІР»СЏРµС‚СЃСЏ С‚РµРєСѓС‰РёРј routing substitute РґРѕ enablement;
- РѕР±РѕСЃРЅРѕРІР°С‚СЊ СЃРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ owner-agent;
- РїСЂРёРѕСЂРёС‚РёР·РёСЂРѕРІР°С‚СЊ СЃР»РµРґСѓСЋС‰РёР№ РєРѕРЅС‚СѓСЂ РґР»СЏ enablement;
- РЅРµ РїСѓС‚Р°С‚СЊ С‡Р°СЃС‚РёС‡РЅС‹Р№ UX fallback Рё СЂРµР°Р»СЊРЅСѓСЋ agent integration.

---

## 9. РљСЂРёС‚РёС‡РµСЃРєРёРµ РѕС€РёР±РєРё Рё Р·Р°РїСЂРµС‚С‹

- Р—Р°РїСЂРµС‰РµРЅРѕ СЃС‡РёС‚Р°С‚СЊ РґРѕРјРµРЅ РїРѕРєСЂС‹С‚С‹Рј, РµСЃР»Рё Сѓ РЅРµРіРѕ РЅРµС‚ owner-agent.
- Р—Р°РїСЂРµС‰РµРЅРѕ СЃС‡РёС‚Р°С‚СЊ gap Р·Р°РєСЂС‹С‚С‹Рј С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ Сѓ РґРѕРјРµРЅР° СѓР¶Рµ РµСЃС‚СЊ template-role РёР»Рё profile.
- Р—Р°РїСЂРµС‰РµРЅРѕ Р»РµС‡РёС‚СЊ ownership gap С‚РѕР»СЊРєРѕ РєРѕСЃРјРµС‚РёРєРѕР№ UI.
- Р—Р°РїСЂРµС‰РµРЅРѕ СЂР°СЃС€РёСЂСЏС‚СЊ С‡СѓР¶РѕР№ agent scope Р±РµР· СЏРІРЅРѕР№ С„РёРєСЃР°С†РёРё РЅРѕРІРѕРіРѕ ownership contract.
- Р—Р°РїСЂРµС‰РµРЅРѕ РЅР°Р·С‹РІР°С‚СЊ future role СЂРµС€РµРЅРёРµРј РїСЂРѕР±Р»РµРјС‹, РµСЃР»Рё runtime family РЅРµ СЃРѕР·РґР°РЅР°.
- Р—Р°РїСЂРµС‰РµРЅРѕ СЃРјРµС€РёРІР°С‚СЊ `NO OWNER YET` Рё `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE` РєР°Рє Р±СѓРґС‚Рѕ СЌС‚Рѕ РѕРґРёРЅ Рё С‚РѕС‚ Р¶Рµ С‚РёРї СЂР°Р·СЂС‹РІР°.

---

## 10. РџСЂРѕРІРµСЂРєР° РіРѕС‚РѕРІРЅРѕСЃС‚Рё

Р”РѕРєСѓРјРµРЅС‚ СЃС‡РёС‚Р°РµС‚СЃСЏ РїСЂРёРіРѕРґРЅС‹Рј, РµСЃР»Рё:

- РїРµСЂРµС‡РёСЃР»РµРЅС‹ РѕР±Р° С‚РёРїР° gap, РµСЃР»Рё РѕРЅРё РїСЂРёСЃСѓС‚СЃС‚РІСѓСЋС‚ РІ СЃРёСЃС‚РµРјРµ;
- РґР»СЏ РєР°Р¶РґРѕРіРѕ СЂР°Р·СЂС‹РІР° РѕРїРёСЃР°РЅРѕ, С‡С‚Рѕ РµСЃС‚СЊ Рё С‡РµРіРѕ РЅРµС‚;
- РґР»СЏ РєР°Р¶РґРѕРіРѕ gap СѓРєР°Р·Р°РЅ С‚РµРєСѓС‰РёР№ routing-СЂРµР¶РёРј;
- РґР»СЏ future/template-РґРѕРјРµРЅРѕРІ СЏРІРЅРѕ СѓРєР°Р·Р°РЅРѕ, С‡С‚Рѕ direct production-routing Р·Р°РїСЂРµС‰С‘РЅ;
- СѓРєР°Р·Р°РЅ СЂРµРєРѕРјРµРЅРґСѓРµРјС‹Р№ Р±СѓРґСѓС‰РёР№ owner-agent;
- РѕРїРёСЃР°РЅ СЂРёСЃРє РґР»СЏ РѕСЂРєРµСЃС‚СЂР°С†РёРё Рё UX;
- РґРѕРєСѓРјРµРЅС‚ СЃСЃС‹Р»Р°РµС‚СЃСЏ РЅР° Stage 2 canon Рё РЅР° СЂРµР°Р»СЊРЅС‹Рµ С‚РѕС‡РєРё РєРѕРґР°.

---

## 11. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](./INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [RAI_CONTRACTS_AGENT_CANON.md](../00_STRATEGY/STAGE%202/RAI_CONTRACTS_AGENT_CANON.md)
- [commerce.controller.ts](../../apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](../../apps/api/src/modules/commerce/services/commerce-contract.service.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agent-management.service.ts](../../apps/api/src/modules/explainability/agent-management.service.ts)

