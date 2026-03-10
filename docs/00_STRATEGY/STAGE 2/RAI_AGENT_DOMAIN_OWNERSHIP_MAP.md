# RAI Agent Domain Ownership Map

> Р’РµСЂСЃРёСЏ: 1.1  
> Р”Р°С‚Р°: 2026-03-10  
> РЎС‚Р°С‚СѓСЃ: Active Canon Input  
> РќР°Р·РЅР°С‡РµРЅРёРµ: РµРґРёРЅР°СЏ РєР°СЂС‚Р° РґРѕРјРµРЅРѕРІ РїР»Р°С‚С„РѕСЂРјС‹, owner-Р°РіРµРЅС‚РѕРІ, intent-owner Рё handoff paths РґР»СЏ Stage 2.

---

## 1. Р—Р°С‡РµРј РЅСѓР¶РµРЅ СЌС‚РѕС‚ РґРѕРєСѓРјРµРЅС‚

Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ Р·Р°РєСЂС‹РІР°РµС‚ РіР»Р°РІРЅС‹Р№ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Р№ СЂР°Р·СЂС‹РІ Stage 2:

- РґРѕРјРµРЅРЅС‹Рµ РјРѕРґСѓР»Рё Рё UX-РјР°СЂС€СЂСѓС‚С‹ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‚;
- С‡Р°СЃС‚СЊ owner-Р°РіРµРЅС‚РѕРІ СѓР¶Рµ СЂР°Р±РѕС‚Р°РµС‚;
- С‡Р°СЃС‚СЊ future-role СѓР¶Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅР°;
- РЅРѕ РїРѕР»РЅРѕР№ Рё СЏРІРЅРѕР№ `ownership map` РїРѕ РїР»Р°С‚С„РѕСЂРјРµ РґРѕ СЃРёС… РїРѕСЂ РЅРµ Р±С‹Р»Рѕ.

Р‘РµР· СЌС‚РѕРіРѕ РЅРµРІРѕР·РјРѕР¶РЅРѕ:

- С‡РµСЃС‚РЅРѕ РїРѕРЅСЏС‚СЊ, РєР°РєРѕР№ Р°РіРµРЅС‚ РІР»Р°РґРµРµС‚ РєР°РєРёРј РґРѕРјРµРЅРѕРј;
- РѕРїСЂРµРґРµР»РёС‚СЊ owner РґР»СЏ РЅРѕРІРѕРіРѕ intent-Р°;
- РѕС‚Р»РёС‡РёС‚СЊ СЂРµР°Р»СЊРЅС‹Р№ agent path РѕС‚ route-based fallback;
- РїСЂРѕРµРєС‚РёСЂРѕРІР°С‚СЊ handoff Р±РµР· Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕР№ РєР°С€Рё;
- СѓРІРёРґРµС‚СЊ, РєР°РєРёРµ РґРѕРјРµРЅС‹ СѓР¶Рµ РїРѕРєСЂС‹С‚С‹, Р° РєР°РєРёРµ РµС‰С‘ СЃРёСЂРѕС‚С‹.

Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ РґРѕР»Р¶РµРЅ С‡РёС‚Р°С‚СЊСЃСЏ РІРјРµСЃС‚Рµ СЃ:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](./RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](./RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](./A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](./TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../../11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)

---

## 2. Р‘Р°Р·РѕРІС‹Рµ РѕРїСЂРµРґРµР»РµРЅРёСЏ

### 2.1 Domain owner

`Domain owner` вЂ” СЌС‚Рѕ Р°РіРµРЅС‚РЅС‹Р№ РёР»Рё СЃРёСЃС‚РµРјРЅС‹Р№ РІР»Р°РґРµР»РµС† С†РµР»РѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ РєРѕРЅС‚СѓСЂР°.

РћРЅ РѕС‚РІРµС‡Р°РµС‚ Р·Р°:

- РїРµСЂРІРёС‡РЅС‹Р№ ownership СЃС†РµРЅР°СЂРёРµРІ СЌС‚РѕРіРѕ РґРѕРјРµРЅР°;
- РЅР°Р±РѕСЂ intent-owner;
- РґРѕРїСѓСЃС‚РёРјС‹Рµ handoff;
- guardrails;
- РїСЂРѕРґСѓРєС‚РѕРІСѓСЋ РїРѕРІРµСЂС…РЅРѕСЃС‚СЊ РґРѕРјРµРЅР°.

### 2.2 Owner-agent

`Owner-agent` вЂ” СЌС‚Рѕ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ РёР»Рё РїР»Р°РЅРѕРІС‹Р№ Р°РіРµРЅС‚, РєРѕС‚РѕСЂС‹Р№ РЅР°Р·РЅР°С‡РµРЅ РѕСЃРЅРѕРІРЅС‹Рј РёСЃРїРѕР»РЅРёС‚РµР»РµРј РґРѕРјРµРЅР°.

РљР°С‚РµРіРѕСЂРёРё:

- `canonical owner-agent` вЂ” СѓР¶Рµ СЂРµР°Р»РёР·РѕРІР°РЅ РєР°Рє runtime family;
- `future owner-agent` вЂ” Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РєР°Рє template/future role;
- `missing owner-agent` вЂ” РґРѕРјРµРЅ РµСЃС‚СЊ, owner РµС‰С‘ РЅРµ РЅР°Р·РЅР°С‡РµРЅ РєР°Рє Р°РіРµРЅС‚.

### 2.3 Intent owner

`Intent owner` вЂ” СЌС‚Рѕ Р°РіРµРЅС‚, РєРѕС‚РѕСЂС‹Р№ РёРјРµРµС‚ РїСЂР°РІРѕ Р±С‹С‚СЊ primary executor РґР»СЏ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ intent-Р°.

РџСЂР°РІРёР»Рѕ:

- Сѓ РєР°Р¶РґРѕРіРѕ intent-Р° РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ СЂРѕРІРЅРѕ РѕРґРёРЅ primary owner;
- secondary/handoff paths РґРѕРїСѓСЃС‚РёРјС‹, РЅРѕ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.

### 2.3.1 Secondary read / evidence owner

`Secondary read / evidence owner` вЂ” СЌС‚Рѕ Р°РіРµРЅС‚, РєРѕС‚РѕСЂС‹Р№ РЅРµ РІР»Р°РґРµРµС‚ РёСЃРїРѕР»РЅРµРЅРёРµРј РґРѕРјРµРЅР°, РЅРѕ РёРјРµРµС‚ РїСЂР°РІРѕ:

- С‡РёС‚Р°С‚СЊ РєРѕРЅС‚РµРєСЃС‚ РґРѕРјРµРЅР°;
- РѕР±РѕРіР°С‰Р°С‚СЊ РѕС‚РІРµС‚ РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІР°РјРё;
- РІС‹РїРѕР»РЅСЏС‚СЊ grounding;
- РІРѕР·РІСЂР°С‰Р°С‚СЊ read-only РјР°С‚РµСЂРёР°Р»С‹ РґР»СЏ primary owner.

РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ РїСЂРёРјРµСЂ:

- `knowledge` РєР°Рє evidence-owner РґР»СЏ С‡СѓР¶РёС… РґРѕРјРµРЅРѕРІ.

### 2.3.2 Secondary advisory owner

`Secondary advisory owner` вЂ” СЌС‚Рѕ Р°РіРµРЅС‚, РєРѕС‚РѕСЂС‹Р№ РЅРµ РІР»Р°РґРµРµС‚ write- РёР»Рё execution-path, РЅРѕ РёРјРµРµС‚ РїСЂР°РІРѕ:

- РёРЅС‚РµСЂРїСЂРµС‚РёСЂРѕРІР°С‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚ С‡СѓР¶РѕРіРѕ РґРѕРјРµРЅР°;
- РґР°РІР°С‚СЊ advisory РїРѕРІРµСЂС… primary owner РґР°РЅРЅС‹С…;
- СѓС‡Р°СЃС‚РІРѕРІР°С‚СЊ РІ governed handoff.

РљР°РЅРѕРЅРёС‡РµСЃРєРёРµ РїСЂРёРјРµСЂС‹:

- `economist` РєР°Рє interpretive owner РґР»СЏ Р°РіСЂРѕ- РёР»Рё РґРѕРіРѕРІРѕСЂРЅС‹С… РїРѕСЃР»РµРґСЃС‚РІРёР№;
- `monitoring` РєР°Рє signal owner Р±РµР· business execution ownership.

### 2.4 Handoff path

`Handoff path` вЂ” СЌС‚Рѕ РґРѕРїСѓСЃС‚РёРјР°СЏ РїРµСЂРµРґР°С‡Р° СЃС†РµРЅР°СЂРёСЏ РёР· РѕРґРЅРѕРіРѕ РґРѕРјРµРЅРЅРѕРіРѕ owner-agent РІ РґСЂСѓРіРѕР№.

РќРѕСЂРјР°С‚РёРІРЅР°СЏ РјРѕРґРµР»СЊ:

- `source agent -> orchestrator -> target agent`

Р—Р°РїСЂРµС‰С‘РЅРЅР°СЏ РјРѕРґРµР»СЊ:

- `source agent -> target agent` РЅР°РїСЂСЏРјСѓСЋ РєР°Рє СЃРєСЂС‹С‚С‹Р№ peer-to-peer РІС‹Р·РѕРІ.

### 2.5 System domain

Р•СЃС‚СЊ РґРѕРјРµРЅС‹, РєРѕС‚РѕСЂС‹Рµ РЅРµ РґРѕР»Р¶РЅС‹ РёРјРµС‚СЊ business owner-agent.

Р­С‚Рѕ:

- РѕСЂРєРµСЃС‚СЂР°С†РёСЏ;
- governance;
- explainability;
- identity Рё tenant infrastructure;
- СЃРёСЃС‚РµРјРЅС‹Рµ supporting contours.

Р”Р»СЏ РЅРёС… owner СЃСѓС‰РµСЃС‚РІСѓРµС‚ РєР°Рє platform/system owner, Р° РЅРµ РєР°Рє Р±РёР·РЅРµСЃ-Р°РіРµРЅС‚.

### 2.6 Authority layers

Р”Р»СЏ РєР°Р¶РґРѕРіРѕ Р±РёР·РЅРµСЃ-РґРѕРјРµРЅР° РЅСѓР¶РЅРѕ РѕС‚РґРµР»СЊРЅРѕ С„РёРєСЃРёСЂРѕРІР°С‚СЊ:

- `read authority` вЂ” РєС‚Рѕ РёРјРµРµС‚ РїСЂР°РІРѕ С‡РёС‚Р°С‚СЊ Рё РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґР°РЅРЅС‹Рµ РґРѕРјРµРЅР°;
- `advisory authority` вЂ” РєС‚Рѕ РёРјРµРµС‚ РїСЂР°РІРѕ РёРЅС‚РµСЂРїСЂРµС‚РёСЂРѕРІР°С‚СЊ РґРѕРјРµРЅ Р±РµР· РёСЃРїРѕР»РЅРµРЅРёСЏ;
- `write authority` вЂ” РєС‚Рѕ РёРјРµРµС‚ РїСЂР°РІРѕ РІС‹РїРѕР»РЅСЏС‚СЊ СѓРїСЂР°РІР»СЏРµРјС‹Рµ РёР·РјРµРЅРµРЅРёСЏ РІ СЌС‚РѕРј РґРѕРјРµРЅРµ.

Р–С‘СЃС‚РєРѕРµ РїСЂР°РІРёР»Рѕ:

- `domain owner` РЅРµ РІСЃРµРіРґР° СЂР°РІРµРЅ `write authority`;
- `read authority` Рё `advisory authority` РЅРµ РґР°СЋС‚ РїСЂР°РІР° Р·Р°С…РІР°С‚С‹РІР°С‚СЊ ownership.

### 2.7 Fallback mode

Р”Р»СЏ РєР°Р¶РґРѕРіРѕ РґРѕРјРµРЅР° РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ СѓРєР°Р·Р°РЅ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Р№ fallback mode:

- `NONE` вЂ” fallback РЅРµ РЅСѓР¶РµРЅ, РµСЃС‚СЊ РїРѕР»РЅРѕС†РµРЅРЅС‹Р№ agent path;
- `READ_ONLY_SUPPORT` вЂ” РІРѕР·РјРѕР¶РЅР° С‚РѕР»СЊРєРѕ РІСЃРїРѕРјРѕРіР°С‚РµР»СЊРЅР°СЏ read-only РїРѕРґРґРµСЂР¶РєР°;
- `ROUTE_FALLBACK` вЂ” UI СѓС…РѕРґРёС‚ РІ route-based fallback;
- `BACKLOG_ONLY` вЂ” СЃРёСЃС‚РµРјР° СѓРјРµРµС‚ С‚РѕР»СЊРєРѕ СЃС„РѕСЂРјРёСЂРѕРІР°С‚СЊ backlog РёР»Рё Р·Р°РґР°С‡Сѓ Р±РµР· СЂРµР°Р»СЊРЅРѕРіРѕ РёСЃРїРѕР»РЅРµРЅРёСЏ;
- `MANUAL_HUMAN_REQUIRED` вЂ” РґРѕРјРµРЅ РѕР±СЃР»СѓР¶РёРІР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ С‡РµР»РѕРІРµРєРѕРј РёР»Рё СЂСѓС‡РЅС‹Рј РїСЂРѕС†РµСЃСЃРѕРј.

### 2.8 Gap severity

Р Р°Р·СЂС‹РІС‹ ownership РЅСѓР¶РЅРѕ СЂР°РЅР¶РёСЂРѕРІР°С‚СЊ С‚Р°Рє:

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`
- `SYSTEM-SUPPORT`

---

## 3. Р“Р»Р°РІРЅС‹Рµ РїСЂР°РІРёР»Р° ownership map

1. РќР°Р»РёС‡РёРµ РјРѕРґСѓР»СЏ РЅРµ РѕР·РЅР°С‡Р°РµС‚ РЅР°Р»РёС‡РёРµ owner-agent.
2. РќР°Р»РёС‡РёРµ template-role РЅРµ РѕР·РЅР°С‡Р°РµС‚ РЅР°Р»РёС‡РёРµ canonical runtime owner-agent.
3. РЈ РєР°Р¶РґРѕРіРѕ РїСЂРѕРґСѓРєС‚РѕРІРѕРіРѕ intent-Р° РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ primary owner.
4. РЈ РєР°Р¶РґРѕРіРѕ Р±РёР·РЅРµСЃ-РґРѕРјРµРЅР° РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ РѕС‚РґРµР»СЊРЅРѕ СѓРєР°Р·Р°РЅС‹ `read authority`, `advisory authority` Рё `write authority`.
5. РњРµР¶РґСѓ Р°РіРµРЅС‚Р°РјРё РЅРµ РґРѕРїСѓСЃРєР°РµС‚СЃСЏ СЃРІРѕР±РѕРґРЅР°СЏ `all-to-all` mesh-СЃРІСЏР·РЅРѕСЃС‚СЊ.
6. Р’СЃРµ handoff РїСЂРѕС…РѕРґСЏС‚ С‡РµСЂРµР· orchestration spine.
7. Р•СЃР»Рё РґРѕРјРµРЅ РЅРµ РёРјРµРµС‚ owner-agent, СЌС‚Рѕ РЅРµ вЂњС‡Р°СЃС‚РЅС‹Р№ UX-Р±Р°РівЂќ, Р° Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Р№ СЂР°Р·СЂС‹РІ.
8. System domains РЅРµ РґРѕР»Р¶РЅС‹ РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕ РЅР°С‚СЏРіРёРІР°С‚СЊСЃСЏ РЅР° business owner-agent.
9. `Secondary read/evidence owner` Рё `secondary advisory owner` РЅРµ РјРѕРіСѓС‚ РїРµСЂРµРѕРїСЂРµРґРµР»СЏС‚СЊ primary owner.
10. Fallback mode РѕР±СЏР·Р°РЅ Р±С‹С‚СЊ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ, Р° РЅРµ СЃРєСЂС‹С‚ РІ prose.

### 3.1 Production routing gate РґР»СЏ future/template roles

Р­С‚Р° РєР°СЂС‚Р° С„РёРєСЃРёСЂСѓРµС‚ РґРІР° СЂР°Р·РЅС‹С… СѓСЂРѕРІРЅСЏ РёСЃС‚РёРЅС‹:

- Р»РѕРіРёС‡РµСЃРєРёР№ owner РґРѕРјРµРЅР° РІ С†РµР»РµРІРѕР№ Stage 2-РјРѕРґРµР»Рё;
- production routing owner, РІ РєРѕС‚РѕСЂРѕРіРѕ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ СѓР¶Рµ РёРјРµРµС‚ РїСЂР°РІРѕ РЅР°РїСЂР°РІР»СЏС‚СЊ СЂРµР°Р»СЊРЅС‹Р№ Р·Р°РїСЂРѕСЃ.

Р–С‘СЃС‚РєРѕРµ РїСЂР°РІРёР»Рѕ:

- future/template role РјРѕР¶РµС‚ Р±С‹С‚СЊ СѓР¶Рµ РЅР°Р·РЅР°С‡РµРЅР° Р»РѕРіРёС‡РµСЃРєРёРј owner СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РµРіРѕ РґРѕРјРµРЅР°;
- РЅРѕ СЌС‚Рѕ РЅРµ РѕР·РЅР°С‡Р°РµС‚, С‡С‚Рѕ РѕРЅР° СѓР¶Рµ СЏРІР»СЏРµС‚СЃСЏ РґРѕРїСѓСЃС‚РёРјС‹Рј `primary owner-agent` РґР»СЏ production-routing;
- direct production routing РІ future/template role СЂР°Р·СЂРµС€Р°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РїРѕСЏРІР»РµРЅРёСЏ canonical runtime family, intent contract Рё РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅРѕРіРѕ execution path;
- source of truth РґР»СЏ production-routing Рё enablement gate РЅР°С…РѕРґРёС‚СЃСЏ РІ [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../../11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md).

---

## 4. РўРµРєСѓС‰Р°СЏ С‚РѕРїРѕР»РѕРіРёСЏ ownership

### 4.1 Р§С‚Рѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ РєРѕРґРѕРј

РљР°РЅРѕРЅРёС‡РµСЃРєРёРµ runtime-Р°РіРµРЅС‚С‹:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`
- `front_office_agent`
- `contracts_agent`

РСЃС‚РѕС‡РЅРёРєРё:

- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

РџР»Р°РЅРѕРІС‹Рµ future/template roles:

- `marketer`
- `strategist`
- `finance_advisor`
- `legal_advisor`
- `controller`
- `personal_assistant`

РСЃС‚РѕС‡РЅРёРєРё:

- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)

### 4.2 Р§С‚Рѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕ

Ownership Рё handoff РґРѕР»Р¶РЅС‹ РїСЂРѕС…РѕРґРёС‚СЊ С‡РµСЂРµР·:

- `SupervisorAgent`
- `IntentRouterService`
- `AgentRuntimeService`
- `AgentExecutionAdapterService`

РўРѕ РµСЃС‚СЊ С‚РµРєСѓС‰Р°СЏ РЅРѕСЂРјР°С‚РёРІРЅР°СЏ РјРѕРґРµР»СЊ:

```text
РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ / UI
  -> РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ
  -> Intent owner
  -> Tool / module path
  -> Result / clarification / handoff С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ
```

---

## 5. РџРѕР»РЅР°СЏ РєР°СЂС‚Р° РґРѕРјРµРЅРѕРІ РїР»Р°С‚С„РѕСЂРјС‹

РќРёР¶Рµ РїРµСЂРµС‡РёСЃР»РµРЅС‹ Р±РёР·РЅРµСЃ-РґРѕРјРµРЅС‹ Рё СЃРёСЃС‚РµРјРЅС‹Рµ РґРѕРјРµРЅС‹ РїР»Р°С‚С„РѕСЂРјС‹ СЃ С‚РµРєСѓС‰РёРј СЃС‚Р°С‚СѓСЃРѕРј ownership.

### 5.1 Р‘РёР·РЅРµСЃ-РґРѕРјРµРЅС‹

| Р”РѕРјРµРЅ | РћСЃРЅРѕРІРЅРѕР№ scope | РЎРІСЏР·Р°РЅРЅС‹Рµ РјРѕРґСѓР»Рё / РјР°СЂС€СЂСѓС‚С‹ | Primary owner-agent | Secondary read / evidence owner | Secondary advisory owner | Read authority | Advisory authority | Write authority | Fallback mode | Gap severity | РЎС‚Р°С‚СѓСЃ ownership | РљРѕРјРјРµРЅС‚Р°СЂРёР№ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `agronomy` | С‚РµС…РєР°СЂС‚С‹, РїРѕР»СЏ, СЃРµР·РѕРЅ, РѕС‚РєР»РѕРЅРµРЅРёСЏ, Р°РіСЂРѕ-СЂРµРєРѕРјРµРЅРґР°С†РёРё | `consulting`, `tech-map`, `technology-card`, `agro-events`, `field-registry`, `field-observation`, `season`, `crop-variety`, `satellite`, `vision`, `/consulting/techmaps`, `/consulting/deviations` | `agronomist` | `knowledge` | `economist` | `agronomist`, `knowledge`, `monitoring` | `agronomist`, `economist` | `agronomist` | `NONE` | `MEDIUM` | `CANONICAL` | Owner РїРѕРґС‚РІРµСЂР¶РґС‘РЅ, РЅРѕ РїРѕРєСЂС‹РІР°РµС‚ РЅРµ РІРµСЃСЊ Р°РіСЂРѕ-РєРѕРЅС‚СѓСЂ platform-wide. |
| `finance` | plan/fact, СЃС†РµРЅР°СЂРёРё, risk assessment, С„РёРЅР°РЅСЃРѕРІР°СЏ Р°РЅР°Р»РёС‚РёРєР° | `finance-economy`, `/finance`, `/consulting/plans`, `/consulting/budgets`, `/consulting/results`, `/consulting/yield` | `economist` | `knowledge` | `strategist`, `finance_advisor` | `economist`, `knowledge`, `controller` | `economist`, `finance_advisor`, `strategist` | `economist` РІ РїСЂРµРґРµР»Р°С… tools; С‚СЂР°РЅР·Р°РєС†РёРѕРЅРЅС‹Р№ write РЅРµ РґРµР»РµРіРёСЂРѕРІР°РЅ | `READ_ONLY_SUPPORT` | `MEDIUM` | `CANONICAL` | Owner РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РґР»СЏ core intents, РЅРѕ РЅРµ РґР»СЏ РІСЃРµРіРѕ finance landscape; `strategist`, `finance_advisor`, `controller` Р·РґРµСЃСЊ advisory/template-only Рё РЅРµ СЏРІР»СЏСЋС‚СЃСЏ production primary owners. |
| `knowledge` | РґРѕРєСѓРјРµРЅС‚С‹, РїРѕР»РёС‚РёРєРё, knowledge corpus, grounding | `knowledge`, `knowledge-graph`, `/knowledge` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `knowledge` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `READ_ONLY_SUPPORT` | `LOW` | `CANONICAL` | Р­С‚Рѕ evidence-owner РґРѕРјРµРЅ, Р° РЅРµ operational write domain. |
| `monitoring` | СЃРёРіРЅР°Р»С‹, Р°Р»РµСЂС‚С‹, risk contour, monitoring summaries | `risk`, `/control-tower`, supporting monitoring routes | `monitoring` | `knowledge` | `controller`, `economist` | `monitoring`, `knowledge` | `monitoring`, `controller` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `READ_ONLY_SUPPORT` | `MEDIUM` | `CANONICAL` | Signal owner, РЅРµ business execution owner; `controller` РѕСЃС‚Р°С‘С‚СЃСЏ future/template advisory role Рё РЅРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµС‚ production ownership. |
| `crm` | РєРѕРЅС‚СЂР°РіРµРЅС‚С‹, Р°РєРєР°СѓРЅС‚С‹, РєРѕРЅС‚Р°РєС‚С‹, РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏ, РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°, СЃС‚СЂСѓРєС‚СѓСЂС‹ | `crm`, `commerce/parties`, `client-registry`, `/consulting/crm`, `/crm`, `/parties` | `crm_agent` | `knowledge` | `economist` | `crm_agent`, `knowledge`, `monitoring` РїРѕ СЃРёРіРЅР°Р»Р°Рј | `crm_agent`, `economist` | `crm_agent` С‡РµСЂРµР· governed CRM write path | `NONE` | `MEDIUM` | `CANONICAL` | Core CRM owner РїРѕРґС‚РІРµСЂР¶РґС‘РЅ. |
| `front_office` | РІС…РѕРґСЏС‰РёРµ Рё РёСЃС…РѕРґСЏС‰РёРµ СЃРѕРѕР±С‰РµРЅРёСЏ, РґРёР°Р»РѕРіРё, РєР»Р°СЃСЃРёС„РёРєР°С†РёСЏ РѕР±С‰РµРЅРёСЏ, task/process detection, СЌСЃРєР°Р»Р°С†РёРё | `front-office`, `telegram`, `task`, `advisory`, `/front-office` | `front_office_agent` | `knowledge` | `crm_agent`, `personal_assistant` | `front_office_agent`, `knowledge`, `crm_agent` РїРѕ РєР»РёРµРЅС‚СЃРєРѕРјСѓ РєРѕРЅС‚РµРєСЃС‚Сѓ | `front_office_agent`, `crm_agent`, `personal_assistant` | С‚РѕР»СЊРєРѕ communicator log, thread state, escalation/task records СЃРІРѕРµРіРѕ РґРѕРјРµРЅР° | `MANUAL_HUMAN_REQUIRED` | `HIGH` | `CANONICAL FIRST WAVE` | Owner РєРѕРјРјСѓРЅРёРєР°С†РёРѕРЅРЅРѕРіРѕ ingress СѓР¶Рµ СЂРµР°Р»РёР·РѕРІР°РЅ РєР°Рє canonical role РїРµСЂРІРѕР№ РІРѕР»РЅС‹; `personal_assistant` Р·РґРµСЃСЊ С‚РѕР»СЊРєРѕ future/template advisory semantics Рё РЅРµ production owner. |
| `contracts` | РґРѕРіРѕРІРѕСЂС‹, РґРѕРіРѕРІРѕСЂРЅС‹Рµ СЂРѕР»Рё, РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІР°, fulfillment events, invoices, payments, allocations, AR balance | `commerce`, `/commerce/contracts`, `/commerce/fulfillment`, `/commerce/invoices`, `/commerce/payments` | `contracts_agent` | `knowledge` | `legal_advisor`, `economist` | `contracts_agent`, `knowledge`, `crm_agent` РїРѕ СЃРІСЏР·Р°РЅРЅРѕРјСѓ РєРѕРЅС‚СЂР°РіРµРЅС‚Сѓ | `contracts_agent`, `legal_advisor`, `economist` | `contracts_agent` С‡РµСЂРµР· governed commerce write path | `NONE` | `MEDIUM` | `CANONICAL` | Р”РѕРіРѕРІРѕСЂРЅС‹Р№ Рё commerce execution owner СЂРµР°Р»РёР·РѕРІР°РЅ РєР°Рє canonical runtime role РїРµСЂРІРѕР№ РІРѕР»РЅС‹; `legal_advisor` РѕСЃС‚Р°С‘С‚СЃСЏ secondary advisory future path Рё РЅРµ production primary owner. |
| `legal` | clauses, policy review, legal risk, legal corpus | `legal`, `/strategic/legal` | `legal_advisor` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `legal_advisor`, `knowledge` | `legal_advisor` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `MANUAL_HUMAN_REQUIRED` | `HIGH` | `FUTURE ROLE` | Р­С‚Рѕ Р»РѕРіРёС‡РµСЃРєРёР№ owner legal-РґРѕРјРµРЅР° РІ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё, РЅРѕ direct production routing РІ `legal_advisor` РїРѕРєР° Р·Р°РїСЂРµС‰С‘РЅ: canonical runtime owner РµС‰С‘ РЅРµ РїРѕРґРЅСЏС‚. |
| `strategy` | strategic scenarios, portfolio tradeoffs, initiatives | `strategic`, `rd`, `/strategy`, `/strategic/rd` | `strategist` | `knowledge` | `economist` | `strategist`, `knowledge` | `strategist`, `economist` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `MANUAL_HUMAN_REQUIRED` | `HIGH` | `FUTURE ROLE` | Р­С‚Рѕ Р»РѕРіРёС‡РµСЃРєРёР№ owner strategy-РґРѕРјРµРЅР°, РЅРѕ РЅРµ production-routable owner: canonical runtime family РµС‰С‘ РЅРµС‚. |
| `marketing` | campaigns, segments, funnel advisory | supporting front-office routes, CRM read models | `marketer` | `crm_agent`, `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `marketer`, `crm_agent`, `knowledge` | `marketer` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `BACKLOG_ONLY` | `MEDIUM` | `FUTURE ROLE` | Template-level owner semantics СѓР¶Рµ РµСЃС‚СЊ, РЅРѕ РѕС‚РґРµР»СЊРЅС‹Р№ production owner-agent РµС‰С‘ РЅРµ СЂР°Р·СЂРµС€С‘РЅ. |
| `control` | СЃРІРµСЂРєРё, control exceptions, СѓРїСЂР°РІР»СЏРµРјС‹Рµ СЌСЃРєР°Р»Р°С†РёРё | `finance-economy`, `risk`, control-related workflows | `controller` | `monitoring`, `knowledge` | `economist` | `controller`, `monitoring`, `knowledge` | `controller`, `economist` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `READ_ONLY_SUPPORT` | `HIGH` | `FUTURE ROLE` | Р­С‚Рѕ Р»РѕРіРёС‡РµСЃРєРёР№ control owner РІ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё, РЅРѕ РЅРµ production-routable owner: runtime family РµС‰С‘ РЅРµС‚. |
| `personal_ops` | tasks, reminders, delegated summaries, personal coordination | `task`, `/dashboard/tasks`, calendar read model | `personal_assistant` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `personal_assistant`, `knowledge` | `personal_assistant` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ Р±РµР· РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` | `FUTURE ROLE` | Р›РёС‡РЅС‹Р№ РєРѕРЅС‚СѓСЂ РѕСЃС‚Р°С‘С‚СЃСЏ template-only; direct production routing РІ `personal_assistant` РєР°Рє owner Р·Р°РїСЂРµС‰С‘РЅ РґРѕ enablement. |
| `hr` | РєР°РґСЂРѕРІС‹Рµ СЃС†РµРЅР°СЂРёРё | `hr`, `/hr` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | module/UI read | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` | `NO AGENT YET` | Р”РѕРјРµРЅ РµСЃС‚СЊ РІ РїР»Р°С‚С„РѕСЂРјРµ, РЅРѕ agent ownership РЅРµ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ. |
| `exploration` | exploration / research views | `exploration`, `/exploration` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `knowledge` | `strategist` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | module/UI read | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `BACKLOG_ONLY` | `LOW` | `NO AGENT YET` | Р”РѕРјРµРЅРЅРѕ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚, agent-owner РЅРµ РѕРїСЂРµРґРµР»С‘РЅ. |

### 5.2 РЎРёСЃС‚РµРјРЅС‹Рµ Рё РїР»Р°С‚С„РѕСЂРјРµРЅРЅС‹Рµ РґРѕРјРµРЅС‹

| Р”РѕРјРµРЅ | Scope | РўРµРєСѓС‰РёР№ owner | РќСѓР¶РµРЅ Р»Рё business owner-agent | РљРѕРјРјРµРЅС‚Р°СЂРёР№ |
|---|---|---|---|---|
| `orchestration` | routing, runtime, adapter, supervisor | platform orchestration spine | РЅРµС‚ | Р­С‚Рѕ СЃРёСЃС‚РµРјРЅС‹Р№ owner, Р° РЅРµ Р±РёР·РЅРµСЃ-Р°РіРµРЅС‚. |
| `governance` | change requests, eval, canary, promote/rollback | explainability / governance contour | РЅРµС‚ | Р­С‚Рѕ policy/system ownership. |
| `explainability` | traces, evidence, BS%, panels, forensics | explainability contour | РЅРµС‚ | РќРµ РґРѕР»Р¶РµРЅ РїРѕРґРјРµРЅСЏС‚СЊСЃСЏ Р±РёР·РЅРµСЃ-Р°РіРµРЅС‚РѕРј. |
| `identity` | tenant, auth, rights, user context | identity / tenant infrastructure | РЅРµС‚ | РЎРёСЃС‚РµРјРЅР°СЏ Р·РѕРЅР°. |
| `integrity` | policy integrity Рё technical safety | integrity contour | РЅРµС‚ | РЎРёСЃС‚РµРјРЅР°СЏ Р·РѕРЅР°. |
| `health` | health checks, diagnostics, readiness | health module / infra contour | РЅРµС‚ | Р­С‚Рѕ СЃРёСЃС‚РµРјРЅС‹Р№ support domain, Р° РЅРµ Р±РёР·РЅРµСЃ-РґРѕРјРµРЅ Р±РµР· owner-agent. |
| `telegram` | channel integration | telegram integration layer | РЅРµС‚ | РљР°РЅР°Р», Р° РЅРµ Р±РёР·РЅРµСЃ-domain owner. |
| `adaptive_learning` | learning support / meta-contour | adaptive-learning | РЅРµС‚ | РќРµ business owner-agent. |
| `generative_engine` | provider/runtime support | platform layer | РЅРµС‚ | РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂРЅС‹Р№ РєРѕРЅС‚СѓСЂ. |

---

## 6. РљР°СЂС‚Р° owner-agent РїРѕ intent-Р°Рј

### 6.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent owners

| Intent | Domain | Primary owner-agent | Secondary read / evidence owner | Secondary advisory owner | Write authority | РЎС‚Р°С‚СѓСЃ | РљРѕРјРјРµРЅС‚Р°СЂРёР№ |
|---|---|---|---|---|---|---|---|
| `tech_map_draft` | `agronomy` | `agronomist` | `knowledge` | `economist` | `agronomist` | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ agronomy intent. |
| `compute_deviations` | `agronomy` | `agronomist` | `knowledge` | `economist` | `agronomist` | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ agronomy intent. |
| `compute_plan_fact` | `finance` | `economist` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `economist` РІ deterministic scope | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ finance intent. |
| `simulate_scenario` | `finance` | `economist` | `knowledge` | `strategist` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | `economist` РІ deterministic scope | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ finance intent. |
| `compute_risk_assessment` | `finance` | `economist` | `knowledge` | `controller` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | `economist` РІ deterministic scope | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ finance intent. |
| `query_knowledge` | `knowledge` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ retrieval intent. |
| `emit_alerts` | `monitoring` | `monitoring` | `knowledge` | `controller` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `CONFIRMED` | РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ monitoring intent. |
| `register_counterparty` | `crm` | `crm_agent` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `create_counterparty_relation` | `crm` | `crm_agent` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `create_crm_account` | `crm` | `crm_agent` | `knowledge` | `economist` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `review_account_workspace` | `crm` | `crm_agent` | `knowledge` | `economist` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `CONFIRMED` | CRM owner-intent. |
| `update_account_profile` | `crm` | `crm_agent` | `knowledge` | `economist` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `create_crm_contact` | `crm` | `crm_agent` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `update_crm_contact` | `crm` | `crm_agent` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `delete_crm_contact` | `crm` | `crm_agent` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `log_crm_interaction` | `crm` | `crm_agent` | `knowledge` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `update_crm_interaction` | `crm` | `crm_agent` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `delete_crm_interaction` | `crm` | `crm_agent` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `create_crm_obligation` | `crm` | `crm_agent` | `knowledge` | `economist` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `update_crm_obligation` | `crm` | `crm_agent` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `economist` РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `delete_crm_obligation` | `crm` | `crm_agent` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `crm_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | CRM owner-intent. |
| `create_commerce_contract` | `contracts` | `contracts_agent` | `knowledge` | `legal_advisor`, `economist` | `contracts_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | Commerce owner-intent. |
| `list_commerce_contracts` | `contracts` | `contracts_agent` | `knowledge` | `economist` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `CONFIRMED` | Commerce owner-intent. |
| `review_commerce_contract` | `contracts` | `contracts_agent` | `knowledge` | `legal_advisor`, `economist` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `CONFIRMED` | Commerce owner-intent. |
| `create_contract_obligation` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | Commerce owner-intent. |
| `create_fulfillment_event` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | Commerce owner-intent. |
| `create_invoice_from_fulfillment` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | Commerce owner-intent. |
| `post_invoice` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· pending-action / risk gate | `CONFIRMED` | Commerce owner-intent. |
| `create_payment` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· governed path | `CONFIRMED` | Commerce owner-intent. |
| `confirm_payment` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· pending-action / risk gate | `CONFIRMED` | Commerce owner-intent. |
| `allocate_payment` | `contracts` | `contracts_agent` | `knowledge` | `economist` | `contracts_agent` С‡РµСЂРµР· pending-action / risk gate | `CONFIRMED` | Commerce owner-intent. |
| `review_ar_balance` | `contracts` | `contracts_agent` | `knowledge` | `economist` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `CONFIRMED` | Commerce owner-intent. |

### 6.2 Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅРЅС‹Рµ future intent-owner Р·РѕРЅС‹

Р­С‚Рѕ РµС‰С‘ РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ runtime intent-С‹, Р° ownership РЅР°РїСЂР°РІР»РµРЅРёСЏ, РєРѕС‚РѕСЂС‹Рµ СѓР¶Рµ Р»РѕРіРёС‡РµСЃРєРё Р·Р°РєСЂРµРїР»РµРЅС‹ РІ platform templates.

Р–С‘СЃС‚РєРѕРµ РїСЂР°РІРёР»Рѕ:

- СЌС‚Рё СЃС‚СЂРѕРєРё РѕРїРёСЃС‹РІР°СЋС‚ С†РµР»РµРІРѕРµ ownership-РЅР°РїСЂР°РІР»РµРЅРёРµ;
- РЅРѕ РЅРµ РґР°СЋС‚ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂСѓ РїСЂР°РІР° РґРµР»Р°С‚СЊ direct production routing РІ СѓРєР°Р·Р°РЅРЅС‹Рµ СЂРѕР»Рё;
- РґРѕ enablement production-routing РґРѕР»Р¶РµРЅ РѕСЃС‚Р°РІР°С‚СЊСЃСЏ РЅР° canonical runtime owners, РѕРїРёСЃР°РЅРЅС‹С… РІ [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../../11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md).

| Р”РѕРјРµРЅ | Р‘СѓРґСѓС‰РёР№ owner-agent | Intent-owner Р·РѕРЅР° | Production routing СЃРµРіРѕРґРЅСЏ |
|---|---|---|---|
| `marketing` | `marketer` | campaigns, segments, funnel recommendations | Р·Р°РїСЂРµС‰С‘РЅ; РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `knowledge` РёР»Рё `crm_agent` РїРѕ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРјСѓ РґРµР№СЃС‚РІРёСЋ |
| `strategy` | `strategist` | scenario framing, strategic tradeoffs, initiative prioritization | Р·Р°РїСЂРµС‰С‘РЅ; РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `economist` РёР»Рё `knowledge` РїРѕ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРјСѓ РґРµР№СЃС‚РІРёСЋ |
| `finance` advisory | `finance_advisor` | executive finance advisory РїРѕРІРµСЂС… deterministic evidence | Р·Р°РїСЂРµС‰С‘РЅ; advisory РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ `economist` РёР»Рё `contracts_agent` |
| `legal` | `legal_advisor` | clause risks, legal summaries, policy review | Р·Р°РїСЂРµС‰С‘РЅ; advisory future-path РЅРѕСЂРјРёСЂРѕРІР°РЅ, РЅРѕ runtime owner РµС‰С‘ РЅРµ enabled |
| `control` | `controller` | reconciliation exceptions, control alerts, governed escalation | Р·Р°РїСЂРµС‰С‘РЅ; РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `monitoring` РёР»Рё `economist` РїРѕ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРјСѓ РґРµР№СЃС‚РІРёСЋ |
| `personal_ops` | `personal_assistant` | personal tasks, reminders, delegated summaries | Р·Р°РїСЂРµС‰С‘РЅ; РґРѕРјРµРЅРЅС‹Рµ business-Р·Р°РїСЂРѕСЃС‹ РѕСЃС‚Р°СЋС‚СЃСЏ Сѓ canonical owner-agents |

### 6.3 РљСЂРёС‚РёС‡РЅС‹Рµ missing intent owners

| Р”РѕРјРµРЅ | Missing intent owner | Fallback mode | Gap severity | РљРѕРјРјРµРЅС‚Р°СЂРёР№ |
|---|---|---|---|---|
| `hr` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` | Р”РѕРјРµРЅРЅС‹Рµ СЃС†РµРЅР°СЂРёРё РІ platform map РїСЂРёСЃСѓС‚СЃС‚РІСѓСЋС‚, owner-agent РЅРµ РЅР°Р·РЅР°С‡РµРЅ. |
| `exploration` | РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ | `BACKLOG_ONLY` | `LOW` | РќРµС‚ agent-owner Рё intent-owner. |

---

## 7. РќРѕСЂРјР°С‚РёРІРЅР°СЏ РєР°СЂС‚Р° handoff paths

РќРёР¶Рµ РїРµСЂРµС‡РёСЃР»РµРЅС‹ РґРѕРїСѓСЃС‚РёРјС‹Рµ handoff paths.  
Р•СЃР»Рё РїСѓС‚СЊ РЅРµ СѓРєР°Р·Р°РЅ Р·РґРµСЃСЊ, РѕРЅ РЅРµ РґРѕР»Р¶РµРЅ СЃС‡РёС‚Р°С‚СЊСЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°Р·СЂРµС€С‘РЅРЅС‹Рј.

### 7.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ Рё Р»РѕРіРёС‡РµСЃРєРё РґРѕРїСѓСЃС‚РёРјС‹Рµ current paths

| Source owner | Target owner | РљРѕРіРґР° РЅСѓР¶РµРЅ handoff | РџСѓС‚СЊ | РЎС‚Р°С‚СѓСЃ |
|---|---|---|---|---|
| `agronomist` | `economist` | Р°РіСЂРѕ-СЂР°СЃС‡С‘С‚ С‚СЂРµР±СѓРµС‚ С„РёРЅР°РЅСЃРѕРІРѕР№ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёРё | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `agronomist` | `knowledge` | РЅСѓР¶РЅС‹ СЂРµРіР»Р°РјРµРЅС‚С‹, РґРѕРєСѓРјРµРЅС‚С‹, policy grounding | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED` |
| `economist` | `knowledge` | РЅСѓР¶РЅС‹ РЅРѕСЂРјС‹, РґРѕРєСѓРјРµРЅС‚С‹, policy grounding | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED` |
| `monitoring` | `agronomist` | СЃРёРіРЅР°Р» РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє Р°РіСЂРѕ-СЂРёСЃРєСѓ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `monitoring` | `economist` | СЃРёРіРЅР°Р» РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє С„РёРЅР°РЅСЃРѕРІРѕРјСѓ СЂРёСЃРєСѓ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `monitoring` | `crm_agent` | СЃРёРіРЅР°Р» РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє РєР»РёРµРЅС‚СЃРєРѕРјСѓ РёР»Рё CRM-РєРѕРЅС‚РµРєСЃС‚Сѓ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `crm_agent` | `knowledge` | РЅСѓР¶РµРЅ policy / corpus grounding | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED` |
| `crm_agent` | `economist` | РЅСѓР¶РµРЅ С„РёРЅР°РЅСЃРѕРІС‹Р№ follow-up РїРѕ РєР»РёРµРЅС‚СЃРєРѕРјСѓ РєРµР№СЃСѓ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `front_office_agent` | `crm_agent` | РєР»РёРµРЅС‚СЃРєРёР№ Р·Р°РїСЂРѕСЃ РёР»Рё CRM-РєРѕРЅС‚РµРєСЃС‚ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `front_office_agent` | `agronomist` | Р°РіСЂРѕ-Р·Р°РґР°С‡Р° РёР»Рё РїРѕР»РµРІРѕР№ РІРѕРїСЂРѕСЃ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `front_office_agent` | `economist` | С„РёРЅР°РЅСЃРѕРІС‹Р№ РІРѕРїСЂРѕСЃ РёР»Рё process signal | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `front_office_agent` | `monitoring` | escalation signal РёР»Рё С‚СЂРµРІРѕР¶РЅС‹Р№ РїР°С‚С‚РµСЂРЅ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `front_office_agent` | `contracts_agent` | СЂР°Р·РіРѕРІРѕСЂ РїРµСЂРµС€С‘Р» РІ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РїСЂРѕС†РµСЃСЃ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `crm_agent` | `contracts_agent` | СЃРѕР·РґР°РЅРёРµ Рё СЃРѕРїСЂРѕРІРѕР¶РґРµРЅРёРµ РґРѕРіРѕРІРѕСЂРѕРІ РїРѕ РєРѕРЅС‚СЂР°РіРµРЅС‚Сѓ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |
| `contracts_agent` | `knowledge` | РЅСѓР¶РµРЅ grounding РїРѕ РїРѕР»РёС‚РёРєРµ РёР»Рё РґРѕРєСѓРјРµРЅС‚Сѓ | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED` |
| `contracts_agent` | `legal_advisor` | РЅСѓР¶РµРЅ legal review Рё clause commentary | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `REQUIRED FUTURE` |
| `contracts_agent` | `economist` | РЅСѓР¶РЅС‹ С„РёРЅР°РЅСЃРѕРІС‹Рµ РїРѕСЃР»РµРґСЃС‚РІРёСЏ РґРѕРіРѕРІРѕСЂР°, СЃС‡РµС‚Р°, РѕРїР»Р°С‚С‹ Рё РґРµР±РёС‚РѕСЂРєР° | С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ | `ALLOWED / PARTIAL` |

### 7.2 РћР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ future handoff paths

РќРёР¶Рµ РїРµСЂРµС‡РёСЃР»РµРЅС‹ С†РµР»РµРІС‹Рµ handoff paths Р±СѓРґСѓС‰РµР№ РјРѕРґРµР»Рё. Р­С‚Рё РїСѓС‚Рё РЅРµ СЃС‡РёС‚Р°СЋС‚СЃСЏ Р°РєС‚РёРІРЅС‹РјРё production-routing РїРµСЂРµС…РѕРґР°РјРё, РїРѕРєР° target role РѕСЃС‚Р°С‘С‚СЃСЏ template/future Рё РЅРµ РїСЂРѕР№РґС‘С‚ enablement gate РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂР°.

| Source owner | Target owner | Р”Р»СЏ С‡РµРіРѕ РЅСѓР¶РµРЅ РїСѓС‚СЊ | РЎС‚Р°С‚СѓСЃ |
|---|---|---|---|
| `front_office_agent` | `legal_advisor` | РЅСѓР¶РµРЅ СЋСЂРёРґРёС‡РµСЃРєРёР№ СЂР°Р·Р±РѕСЂ РєРѕРјРјСѓРЅРёРєР°С†РёРё | `REQUIRED FUTURE` |
| `contracts_agent` | `legal_advisor` | clause review, legal risk, compliance | `REQUIRED FUTURE` |
| `contracts_agent` | `finance_advisor` | executive finance advisory РїРѕРІРµСЂС… commerce facts | `REQUIRED FUTURE` |
| `strategist` | `economist` | СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ СЃС†РµРЅР°СЂРёР№ С‚СЂРµР±СѓРµС‚ С„РёРЅР°РЅСЃРѕРІРѕР№ РѕС†РµРЅРєРё | `REQUIRED FUTURE` |
| `controller` | `economist` | control exception С‚СЂРµР±СѓРµС‚ finance follow-up | `REQUIRED FUTURE` |
| `controller` | `monitoring` | escalation Рё signal correlation | `REQUIRED FUTURE` |
| `marketer` | `crm_agent` | campaign / lead activity РІ CRM-РєРѕРЅС‚СѓСЂРµ | `REQUIRED FUTURE` |
| `personal_assistant` | Р»СЋР±РѕР№ owner-agent | Р·Р°РїСЂРѕСЃ РЅР° РґРµР»РµРіРёСЂРѕРІР°РЅРЅС‹Р№ summary РёР»Рё read-only follow-up | `RESTRICTED FUTURE` |

### 7.3 Р—Р°РїСЂРµС‰С‘РЅРЅС‹Рµ handoff patterns

Р—Р°РїСЂРµС‰РµРЅРѕ:

- `agent -> agent` РЅР°РїСЂСЏРјСѓСЋ Р±РµР· СѓС‡Р°СЃС‚РёСЏ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂР°;
- handoff РІ РґРѕРјРµРЅ, Сѓ РєРѕС‚РѕСЂРѕРіРѕ РЅРµС‚ owner-agent, РєР°Рє Р±СѓРґС‚Рѕ owner СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚;
- handoff, РєРѕС‚РѕСЂС‹Р№ РјРµРЅСЏРµС‚ ownership РґРѕРјРµРЅР° РїРѕ route РёР»Рё РїРѕ prompt;
- handoff РёР· monitoring РїСЂСЏРјРѕ РІ write-path С‡СѓР¶РѕРіРѕ РґРѕРјРµРЅР°.

---

## 8. Р”РѕРјРµРЅС‹ Р±РµР· Р·Р°РєСЂС‹С‚РѕРіРѕ ownership

### 8.1 Р“Р»Р°РІРЅС‹Рµ С‚РµРєСѓС‰РёРµ СЂР°Р·СЂС‹РІС‹

- `legal` вЂ” СЂРѕР»СЊ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅР°, РЅРѕ runtime owner РµС‰С‘ РЅРµ СЃРѕР·РґР°РЅ.
- `strategy` вЂ” СЂРѕР»СЊ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅР°, РЅРѕ runtime owner РµС‰С‘ РЅРµ СЃРѕР·РґР°РЅ.
- `control` вЂ” СЂРѕР»СЊ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅР°, РЅРѕ runtime owner РµС‰С‘ РЅРµ СЃРѕР·РґР°РЅ.
- `marketing` вЂ” СЂРѕР»СЊ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅР°, РЅРѕ runtime owner РµС‰С‘ РЅРµ СЃРѕР·РґР°РЅ.
- `personal_ops` вЂ” СЂРѕР»СЊ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅР°, РЅРѕ runtime owner РµС‰С‘ РЅРµ СЃРѕР·РґР°РЅ.
- `hr`, `exploration` вЂ” РґРѕРјРµРЅС‹ РїСЂРёСЃСѓС‚СЃС‚РІСѓСЋС‚, ownership map РЅРµ Р·Р°РєСЂС‹С‚Р°.

### 8.2 Р’С‚РѕСЂРёС‡РЅС‹Рµ СЂР°Р·СЂС‹РІС‹

- `front_office_agent` СѓР¶Рµ СЂРµР°Р»РёР·РѕРІР°РЅ, РЅРѕ РµС‰С‘ РЅРµ РґРѕРІРµРґС‘РЅ РґРѕ РїРѕР»РЅРѕРіРѕ Telegram-first ingress Рё РѕС‚РґРµР»СЊРЅРѕРіРѕ thread/task state.
- `contracts_agent` СѓР¶Рµ СЂРµР°Р»РёР·РѕРІР°РЅ РєР°Рє owner-agent, РЅРѕ legal advisory handoff Рё СЂР°СЃС€РёСЂРµРЅРЅС‹Р№ product UX РІРѕРєСЂСѓРі commerce-РєРѕРЅС‚СѓСЂР° РѕСЃС‚Р°СЋС‚СЃСЏ СЃР»РµРґСѓСЋС‰РµР№ РІРѕР»РЅРѕР№.

### 8.3 Р Р°РЅР¶РёСЂРѕРІР°РЅРёРµ СЂР°Р·СЂС‹РІРѕРІ РїРѕ severity

| Р”РѕРјРµРЅ | Severity | РџРѕС‡РµРјСѓ |
|---|---|---|
| `front_office` | `HIGH` | Owner-agent СѓР¶Рµ РµСЃС‚СЊ, РЅРѕ ingress-РєРѕРЅС‚СѓСЂ РµС‰С‘ РЅРµ РґРѕРІРµРґС‘РЅ РґРѕ РїРѕР»РЅРѕРіРѕ production envelope. |
| `legal` | `HIGH` | Р”РѕРјРµРЅРЅРѕ РІР°Р¶РЅС‹Р№ РєРѕРЅС‚СѓСЂ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚, РЅРѕ agent ownership С‚РѕР»СЊРєРѕ template-level. |
| `strategy` | `HIGH` | Р”РѕРјРµРЅРЅРѕ РІР°Р¶РЅС‹Р№ РєРѕРЅС‚СѓСЂ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚, РЅРѕ ownership РµС‰С‘ РЅРµ РґРѕРІРµРґС‘РЅ РґРѕ runtime family. |
| `control` | `HIGH` | Р’Р°Р¶РµРЅ РґР»СЏ governed operations Рё quality loops, РЅРѕ role РїРѕРєР° С‚РѕР»СЊРєРѕ template-level. |
| `marketing` | `MEDIUM` | Р”РѕРјРµРЅРЅРѕ РїРѕР»РµР·РµРЅ, РЅРѕ РЅРµ Р±Р»РѕРєРёСЂСѓРµС‚ core operational testing С‚Р°Рє, РєР°Рє contracts/legal. |
| `personal_ops` | `MEDIUM` | Р’Р°Р¶РµРЅ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ РєРѕРЅС‚СѓСЂ, РЅРѕ РЅРµ РєСЂРёС‚РёС‡РµРЅ РґР»СЏ core business execution. |
| `hr` | `MEDIUM` | Р”РѕРјРµРЅ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚ РІ РїСЂРѕРґСѓРєС‚Рµ, РЅРѕ РЅРµ Р·Р°РєСЂС‹С‚ agent ownership. |
| `exploration` | `LOW` | Р”РѕРјРµРЅРЅРѕ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚, РЅРѕ РЅРµ СЏРІР»СЏРµС‚СЃСЏ РєСЂРёС‚РёС‡РЅС‹Рј owner gap РґР»СЏ core operational Stage 2. |

---

## 9. Р§С‚Рѕ СЃС‡РёС‚Р°РµС‚СЃСЏ Р·Р°РІРµСЂС€С‘РЅРЅРѕР№ ownership map

Ownership map СЃС‡РёС‚Р°РµС‚СЃСЏ Р·СЂРµР»РѕР№, РµСЃР»Рё РґР»СЏ РєР°Р¶РґРѕРіРѕ Р±РёР·РЅРµСЃ-РґРѕРјРµРЅР° РµСЃС‚СЊ:

- domain owner;
- owner-agent РёР»Рё СЏРІРЅР°СЏ РїРѕРјРµС‚РєР°, С‡С‚Рѕ owner РїРѕРєР° РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚;
- primary intent-owner;
- РґРѕРїСѓСЃС‚РёРјС‹Рµ handoff paths;
- Р·Р°РїСЂРµС‚С‹ РЅР° handoff;
- route / module evidence;
- product-level explanation, РїРѕС‡РµРјСѓ СЌС‚Рѕ РёРјРµРЅРЅРѕ СЌС‚РѕС‚ owner, Р° РЅРµ СЃРѕСЃРµРґРЅРёР№.

---

## 10. Naming decision РґР»СЏ РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ owner-domain

Р”Р»СЏ Stage 2 Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРѕ РЅРѕСЂРјР°С‚РёРІРЅРѕРµ СЂРµС€РµРЅРёРµ:

- РґРѕРјРµРЅ РЅР°Р·С‹РІР°РµС‚СЃСЏ `contracts`;
- canonical owner-agent РЅР°Р·С‹РІР°РµС‚СЃСЏ `contracts_agent`.

Р§С‚Рѕ СЌС‚Рѕ РѕР·РЅР°С‡Р°РµС‚:

- `commerce` РѕСЃС‚Р°С‘С‚СЃСЏ РёРјРµРЅРµРј РїСЂРѕРґСѓРєС‚РѕРІРѕРіРѕ/С‚РµС…РЅРёС‡РµСЃРєРѕРіРѕ РјРѕРґСѓР»СЏ, РєРѕС‚РѕСЂС‹Р№ СЃРµР№С‡Р°СЃ С…РѕСЃС‚РёС‚ РґРѕРіРѕРІРѕСЂРЅС‹Р№ РєРѕРЅС‚СѓСЂ;
- РЅРѕ ownership-РґРѕРјРµРЅ РЅРµ РЅР°Р·С‹РІР°РµС‚СЃСЏ `commerce`, РїРѕС‚РѕРјСѓ С‡С‚Рѕ СЌС‚Рѕ СЃР»РёС€РєРѕРј С€РёСЂРѕРєРёР№ РєРѕРЅС‚РµР№РЅРµСЂ;
- РґРѕРіРѕРІРѕСЂРЅС‹Р№ owner РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РѕС‚РґРµР»СЊРЅС‹Рј Рё СЏРІРЅС‹Рј, Р° РЅРµ СЂР°Р·РјС‹С‚С‹Рј РїРѕРґРјРѕРґСѓР»РµРј CRM РёР»Рё generic commerce.

РЎР»РµРґСЃС‚РІРёРµ:

- РІ handoff, registry, contract-layer Рё UX РЅСѓР¶РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РёРјРµРЅРЅРѕ `contracts_agent`;
- С„РѕСЂРјСѓР»РёСЂРѕРІРєР° `commerce_agent` РґР»СЏ РґРѕРіРѕРІРѕСЂРЅРѕРіРѕ ownership СЃС‡РёС‚Р°РµС‚СЃСЏ РЅРµРЅРѕСЂРјР°С‚РёРІРЅРѕР№.

---

## 11. Ownership decision rules РґР»СЏ РЅРѕРІС‹С… РґРѕРјРµРЅРѕРІ

РќРѕРІС‹Р№ РґРѕРјРµРЅ РїРѕР»СѓС‡Р°РµС‚ РѕС‚РґРµР»СЊРЅРѕРіРѕ owner-agent С‚РѕР»СЊРєРѕ РµСЃР»Рё РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ РІС‹РїРѕР»РЅСЏСЋС‚СЃСЏ СѓСЃР»РѕРІРёСЏ:

1. РЈ РґРѕРјРµРЅР° РµСЃС‚СЊ СѓСЃС‚РѕР№С‡РёРІС‹Р№ `bounded context`.
2. РЈ РґРѕРјРµРЅР° РµСЃС‚СЊ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ `Intent Catalog`.
3. РЈ РґРѕРјРµРЅР° РµСЃС‚СЊ СЃРІРѕРё `guardrails`.
4. РЈ РґРѕРјРµРЅР° РµСЃС‚СЊ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ `tool surface` РёР»Рё РѕС‚РґРµР»СЊРЅС‹Р№ deterministic/service contour.
5. Р”РѕРјРµРЅ РЅРµ СѓРєР»Р°РґС‹РІР°РµС‚СЃСЏ РІ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРіРѕ owner-agent Р±РµР· СЂР°Р·РјС‹РІР°РЅРёСЏ РіСЂР°РЅРёС†.
6. Р”Р»СЏ РґРѕРјРµРЅР° РјРѕР¶РЅРѕ СЃС„РѕСЂРјСѓР»РёСЂРѕРІР°С‚СЊ РѕС‚РґРµР»СЊРЅС‹Рµ `read / advisory / write authority`.
7. Р”Р»СЏ РґРѕРјРµРЅР° РјРѕР¶РЅРѕ РѕРїРёСЃР°С‚СЊ handoff paths Р±РµР· РїСЂРµРІСЂР°С‰РµРЅРёСЏ РїР»Р°С‚С„РѕСЂРјС‹ РІ `all-to-all` mesh.

Р•СЃР»Рё СЌС‚Рё СѓСЃР»РѕРІРёСЏ РЅРµ РІС‹РїРѕР»РЅРµРЅС‹, РЅРѕРІС‹Р№ owner-agent СЃРѕР·РґР°РІР°С‚СЊ РЅРµ РЅСѓР¶РЅРѕ.

Р’РјРµСЃС‚Рѕ СЌС‚РѕРіРѕ РЅСѓР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ РѕРґРёРЅ РёР· РїСѓС‚РµР№:

- СЂР°СЃС€РёСЂРёС‚СЊ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ owner-domain;
- РѕС„РѕСЂРјРёС‚СЊ РґРѕРјРµРЅ РєР°Рє secondary advisory owner;
- РѕС„РѕСЂРјРёС‚СЊ РґРѕРјРµРЅ РєР°Рє secondary read/evidence owner;
- РѕСЃС‚Р°РІРёС‚СЊ РґРѕРјРµРЅ СЃРёСЃС‚РµРјРЅС‹Рј, Р° РЅРµ Р±РёР·РЅРµСЃ-Р°РіРµРЅС‚РЅС‹Рј.

---

## 12. РќРµРїРѕСЃСЂРµРґСЃС‚РІРµРЅРЅС‹Рµ СЃР»РµРґСѓСЋС‰РёРµ С€Р°РіРё

1. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ `contracts_agent` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ owner-domain, Р° РЅРµ СЂР°Р·РјС‹РІР°С‚СЊ РµРіРѕ РІ `crm_agent`.
2. Р¤РѕСЂРјР°Р»РёР·РѕРІР°С‚СЊ `legal` Рё `strategy` РєР°Рє СЃР»РµРґСѓСЋС‰РёРµ owner families.
3. Р”РѕРІРµСЃС‚Рё `front_office_agent -> contracts_agent` РґРѕ РїРѕР»РЅРѕРіРѕ production handoff РЅР° СЂРµР°Р»СЊРЅРѕРј ingress.
4. Р”Р»СЏ РІСЃРµС… future-role РїРµСЂРµРІРѕРґРёС‚СЊ template ownership РІ canonical runtime ownership.
5. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ СЌС‚Сѓ РєР°СЂС‚Сѓ РєР°Рє РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ РёСЃС‚РѕС‡РЅРёРє РёСЃС‚РёРЅС‹ РїСЂРё РґРѕР±Р°РІР»РµРЅРёРё РЅРѕРІРѕРіРѕ РґРѕРјРµРЅР° РёР»Рё intent-Р°.

---

## 13. РЎРІРѕРґРЅС‹Р№ РІС‹РІРѕРґ

РўРµРєСѓС‰Р°СЏ РїР»Р°С‚С„РѕСЂРјР° СѓР¶Рµ РёРјРµРµС‚ СЏРґСЂРѕ ownership map:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`
- `front_office_agent`
- `contracts_agent`

РќРѕ platform-wide ownership РµС‰С‘ РЅРµ Р·Р°РјРєРЅСѓС‚.

Р“Р»Р°РІРЅС‹Рµ СЃС‚СЂСѓРєС‚СѓСЂРЅС‹Рµ СЂР°Р·СЂС‹РІС‹:

- `legal` Рё `strategy` РїРѕРєР° РµС‰С‘ РЅРµ РїРѕРґРЅСЏС‚С‹ РєР°Рє canonical runtime families;
- С‡Р°СЃС‚СЊ future-role РІСЃС‘ РµС‰С‘ РѕСЃС‚Р°С‘С‚СЃСЏ РЅР° template-СѓСЂРѕРІРЅРµ;
- `front_office_agent` РµС‰С‘ РЅРµ РґРѕРІРµРґС‘РЅ РґРѕ РїРѕР»РЅРѕРіРѕ production ingress envelope.

Р“Р»Р°РІРЅРѕРµ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕРµ РїСЂР°РІРёР»Рѕ:

- РЅРµ `РІСЃРµ СЃРѕ РІСЃРµРјРё`,
- Р° `РІСЃРµ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ`,
- СЃ СЏРІРЅС‹Рј `domain owner -> intent owner -> governed handoff`.

Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј companion-canon РґР»СЏ РІСЃРµС… РґР°Р»СЊРЅРµР№С€РёС… СЂР°Р±РѕС‚ РїРѕ agent enablement.

---

## 14. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](./RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](./RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](./A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](./TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [supervisor-agent.service.ts](../../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-execution-adapter.service.ts](../../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](../../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [commerce.controller.ts](../../../apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](../../../apps/api/src/modules/commerce/services/commerce-contract.service.ts)

