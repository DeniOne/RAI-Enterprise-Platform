---
id: DOC-INS-AGT-009
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” Р’РљР›Р®Р§Р•РќРР• FRONT_OFFICE_AGENT

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚, РєР°Рє РїСЂР°РІРёР»СЊРЅРѕ РґРѕРІРµСЃС‚Рё `front_office_agent` РѕС‚ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРѕРіРѕ РєР°РЅРѕРЅР° РґРѕ production-ready owner-agent РїР»Р°С‚С„РѕСЂРјС‹.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР° РїСЂРёРЅСЏС‚Рѕ СЂРµС€РµРЅРёРµ Р·Р°РїСѓСЃРєР°С‚СЊ `front_office_agent` РєР°Рє РЅРѕРІС‹Р№ owner-domain.

## 3. РџСЂРµРґРІР°СЂРёС‚РµР»СЊРЅС‹Рµ СѓСЃР»РѕРІРёСЏ

РџРµСЂРµРґ РЅР°С‡Р°Р»РѕРј РЅСѓР¶РЅРѕ РѕРїРёСЂР°С‚СЊСЃСЏ РЅР°:

- [RAI_FRONT_OFFICE_AGENT_CANON.md](../00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md](./INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md)
- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](./INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)

Trigger-level routing, handoff Рё РіСЂР°РЅРёС†С‹ ingress РїСЂРѕС‚РёРІ downstream owner-domain РЅСѓР¶РЅРѕ СЃРІРµСЂСЏС‚СЊ СЃ:

- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)

## 4. РњРёРЅРёРјР°Р»СЊРЅС‹Р№ СЃРѕСЃС‚Р°РІ СЂРµР°Р»РёР·Р°С†РёРё

РќСѓР¶РЅРѕ СЂРµР°Р»РёР·РѕРІР°С‚СЊ РјРёРЅРёРјСѓРј:

- canonical runtime role `front_office_agent`;
- responsibility contract;
- intent catalog;
- communicator intake tool surface;
- dialogue log model;
- classification path `free_chat / task_process / client_request / escalation`;
- governed handoff path РІ owner-domains;
- front-office UI surface.

## 5. РўРѕС‡РєРё РёРЅС‚РµРіСЂР°С†РёРё

- `telegram` channel intake
- `task` module
- `advisory` module
- `client-registry`
- `rai-chat` runtime
- `front-office` web page

## 6. РџРѕС€Р°РіРѕРІС‹Р№ Р°Р»РіРѕСЂРёС‚Рј

1. Р—Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ domain ownership РІ `RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md`.
2. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ `front_office_agent` РєР°Рє canonical runtime role Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ ownership map.
3. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ responsibility profile:
   - `Focus Contract`
   - `Intent Catalog`
   - `Required Context Contract`
   - `UI Action Surface Contract`
   - `Guardrails`
4. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ runtime role РІ agent registry.
5. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ `FrontOfficeAgent`.
6. РџРѕРґРґРµСЂР¶РёРІР°С‚СЊ tools РїРµСЂРІРѕР№ РІРѕР»РЅС‹:
   - Р»РѕРіРёСЂРѕРІР°РЅРёРµ СЃРѕРѕР±С‰РµРЅРёСЏ
   - РєР»Р°СЃСЃРёС„РёРєР°С†РёСЏ thread
   - РІС‹РґРµР»РµРЅРёРµ task/process
   - СЌСЃРєР°Р»Р°С†РёСЏ
   - handoff summary
7. РџРѕРґРєР»СЋС‡РёС‚СЊ Telegram РєР°Рє РїРµСЂРІС‹Р№ communicator adapter.
8. РџРѕРґРєР»СЋС‡РёС‚СЊ task/escalation write path С‚РѕР»СЊРєРѕ РІ СЃРІРѕРёС… РіСЂР°РЅРёС†Р°С….
9. Р”РѕР±Р°РІРёС‚СЊ Рё СЂР°СЃС€РёСЂСЏС‚СЊ UI:
   - thread list
   - conversation log
   - markers
   - escalation queue
10. РџРѕРґРєР»СЋС‡РёС‚СЊ eval Рё smoke.

## 7. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- unit tests РґР»СЏ conversation classification;
- tests РЅР° `free_chat` РїСЂРѕС‚РёРІ `task_process`;
- tests РЅР° handoff РІ `crm_agent`, `agronomist`, `economist`;
- tests РЅР° РѕС‚СЃСѓС‚СЃС‚РІРёРµ С‡СѓР¶РѕРіРѕ domain write;
- Telegram-first smoke.

## 8. РљСЂРёС‚РµСЂРёРё production-ready

- agent family Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅР°;
- РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ СЂР°Р±РѕС‚Р°РµС‚;
- conversation log РїРµСЂСЃРёСЃС‚РµРЅС‚РµРЅ;
- handoff governed Рё traceable;
- free chat РЅРµ РїСЂРµРІСЂР°С‰Р°РµС‚СЃСЏ РІ Р·Р°РґР°С‡Сѓ Р±РµР· РѕСЃРЅРѕРІР°РЅРёСЏ;
- Telegram flow СЂР°Р±РѕС‚Р°РµС‚ end-to-end.

## 9. Р§С‚Рѕ РґРѕР»Р¶РЅРѕ РїРѕР»СѓС‡РёС‚СЊСЃСЏ РЅР° РІС‹С…РѕРґРµ

РќР° РІС‹С…РѕРґРµ РїР»Р°С‚С„РѕСЂРјР° РїРѕР»СѓС‡Р°РµС‚ РѕС‚РґРµР»СЊРЅРѕРіРѕ owner-agent РґР»СЏ communication ingress, РєРѕС‚РѕСЂС‹Р№:

- РІР»Р°РґРµРµС‚ front-office domain;
- РѕС‚Р»РёС‡Р°РµС‚ РѕР±С‰РµРЅРёРµ РѕС‚ РїСЂРѕС†РµСЃСЃР°;
- СЃРѕР·РґР°С‘С‚ structured handoff;
- РЅРµ РїРѕРґРјРµРЅСЏРµС‚ С‡СѓР¶РёРµ РґРѕРјРµРЅС‹.

## 10. РљСЂРёС‚РёС‡РµСЃРєРёРµ РѕС€РёР±РєРё Рё Р·Р°РїСЂРµС‚С‹

- РќРµР»СЊР·СЏ РґРµР»Р°С‚СЊ `front_office_agent` РІС‚РѕСЂС‹Рј `crm_agent`.
- РќРµР»СЊР·СЏ СЃРјРµС€РёРІР°С‚СЊ РµРіРѕ СЃ `personal_assistant`.
- РќРµР»СЊР·СЏ РґР°РІР°С‚СЊ РµРјСѓ С‡СѓР¶СѓСЋ operational write authority.
- РќРµР»СЊР·СЏ Р·Р°РїСѓСЃРєР°С‚СЊ Р°РіРµРЅС‚Р° Р±РµР· persistent dialogue log.

## 11. РџСЂРѕРІРµСЂРєР° РіРѕС‚РѕРІРЅРѕСЃС‚Рё

РРЅСЃС‚СЂСѓРєС†РёСЏ СЃС‡РёС‚Р°РµС‚СЃСЏ Р·Р°РєСЂС‹С‚РѕР№, РµСЃР»Рё:

- РµСЃС‚СЊ runtime role;
- РµСЃС‚СЊ contract layer;
- РµСЃС‚СЊ communicator ingestion;
- РµСЃС‚СЊ thread classification;
- РµСЃС‚СЊ task/escalation path;
- РµСЃС‚СЊ handoff РІ owner-domains;
- РµСЃС‚СЊ smoke-tests.

## 12. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_FRONT_OFFICE_AGENT_CANON.md](../00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
- [telegram.update.ts](../../apps/telegram-bot/src/telegram/telegram.update.ts)
- [task.service.ts](../../apps/api/src/modules/task/task.service.ts)
- [advisory.service.ts](../../apps/api/src/modules/advisory/advisory.service.ts)
- [client-registry.service.ts](../../apps/api/src/modules/client-registry/client-registry.service.ts)
- [page.tsx](../../apps/web/app/(app)/front-office/page.tsx)

