﻿---
id: DOC-INS-AGT-PROFILE-012
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ FRONT_OFFICE_AGENT

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ РїСЂРѕС„РёР»СЊ `front_office_agent` РєР°Рє owner-agent РґР»СЏ РєРѕРјРјСѓРЅРёРєР°С†РёРѕРЅРЅРѕРіРѕ ingress-РєРѕРЅС‚СѓСЂР°.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚, РєРѕРіРґР°:

- РїСЂРѕРµРєС‚РёСЂСѓРµС‚СЃСЏ communicator ingress;
- РѕР±СЃСѓР¶РґР°РµС‚СЃСЏ Telegram-first routing;
- РЅСѓР¶РЅРѕ РѕРїСЂРµРґРµР»РёС‚СЊ РіСЂР°РЅРёС†Сѓ РјРµР¶РґСѓ РѕР±С‰РµРЅРёРµРј Рё Р·Р°РґР°С‡РµР№-РїСЂРѕС†РµСЃСЃРѕРј;
- РїСЂРѕРµРєС‚РёСЂСѓРµС‚СЃСЏ СЌСЃРєР°Р»Р°С†РёСЏ РёР· РєРѕРјРјСѓРЅРёРєР°С†РёРё РІ РґРѕРјРµРЅРЅС‹Рµ owner-Р°РіРµРЅС‚С‹.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: canonical first-wave role.
- Runtime family: СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Template role: Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅР° РІ onboarding templates.
- Owner domain: `front_office`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

`front_office_agent` СЏРІР»СЏРµС‚СЃСЏ РѕС‚РґРµР»СЊРЅС‹Рј owner-agent РґР»СЏ:

- РІС…РѕРґСЏС‰РёС… Рё РёСЃС…РѕРґСЏС‰РёС… РєРѕРјРјСѓРЅРёРєР°С†РёР№;
- Р»РѕРіРёСЂРѕРІР°РЅРёСЏ РґРёР°Р»РѕРіРѕРІ;
- РєР»Р°СЃСЃРёС„РёРєР°С†РёРё РѕР±С‰РµРЅРёСЏ;
- РІС‹РґРµР»РµРЅРёСЏ task/process signal;
- РїРµСЂРІРёС‡РЅРѕР№ СЌСЃРєР°Р»Р°С†РёРё Рё handoff РІ С†РµР»РµРІРѕР№ РґРѕРјРµРЅ.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕ РєРѕРґСѓ Р°РіРµРЅС‚ СѓР¶Рµ СЂРµР°Р»РёР·РѕРІР°РЅ РєР°Рє РєР°РЅРѕРЅРёС‡РµСЃРєР°СЏ runtime-СЂРѕР»СЊ РїРµСЂРІРѕР№ РІРѕР»РЅС‹.

РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ:

- `front_office_agent` РґРѕР±Р°РІР»РµРЅ РІ canonical agent registry;
- РµСЃС‚СЊ native `FrontOfficeAgent`;
- РµСЃС‚СЊ `FrontOfficeToolsRegistry`;
- РµСЃС‚СЊ intent-Рё:
  - `log_dialog_message`
  - `classify_dialog_thread`
  - `create_front_office_escalation`
- РµСЃС‚СЊ onboarding template;
- РµСЃС‚СЊ audit-backed dialogue log Рё escalation trail.

РџСЂРё СЌС‚РѕРј РІ С‚РµРєСѓС‰СѓСЋ РїРµСЂРІСѓСЋ РІРѕР»РЅСѓ РїРѕРєР° РЅРµ РІС…РѕРґСЏС‚:

- РїРѕР»РЅРѕС†РµРЅРЅС‹Р№ Telegram adapter handoff path;
- РѕС‚РґРµР»СЊРЅС‹Р№ thread state storage РІРЅРµ `auditLog`;
- РїРѕР»РЅРѕС†РµРЅРЅРѕРµ СЃРѕР·РґР°РЅРёРµ СѓРЅРёРІРµСЂСЃР°Р»СЊРЅС‹С… Р·Р°РґР°С‡ РІ `task` module;
- rich front-office workspace СЃ РѕС‡РµСЂРµРґСЏРјРё Рё СЃС‚Р°С‚СѓСЃР°РјРё handoff.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- `front_office`
- communicator ingress
- dialogue threads
- message logs
- task/process detection
- escalation routing

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р›РѕРіРёСЂРѕРІР°С‚СЊ СЃРѕРѕР±С‰РµРЅРёСЏ Рё РґРёР°Р»РѕРіРё.
- Р Р°Р·РґРµР»СЏС‚СЊ `free_chat` Рё `task_process`.
- Р’С‹РґРµР»СЏС‚СЊ РєР»РёРµРЅС‚СЃРєРёРµ Р·Р°РїСЂРѕСЃС‹ Рё СЃРёРіРЅР°Р»С‹ СЌСЃРєР°Р»Р°С†РёРё.
- Р”РµР»Р°С‚СЊ governed handoff РІ owner-domain С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- РџРѕРґРјРµРЅСЏС‚СЊ CRM, agronomy, finance, contracts, legal ownership.
- РЎР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕ Р·Р°РєСЂС‹РІР°С‚СЊ РїСЂРѕС†РµСЃСЃ РІ С‡СѓР¶РѕРј РґРѕРјРµРЅРµ.
- Р—Р°РїРёСЃС‹РІР°С‚СЊ С‡СѓР¶РёРµ Р±РёР·РЅРµСЃ-СЃСѓС‰РЅРѕСЃС‚Рё РєР°Рє primary owner.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ runtime-С„СѓРЅРєС†РёРѕРЅР°Р» РїРµСЂРІРѕР№ РІРѕР»РЅС‹:

- Р»РѕРіРёСЂРѕРІР°РЅРёРµ РІС…РѕРґСЏС‰РёС… Рё РёСЃС…РѕРґСЏС‰РёС… СЃРѕРѕР±С‰РµРЅРёР№ С‡РµСЂРµР· `auditLog`;
- `log_dialog_message` РєР°Рє РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ ingress-intent;
- `classify_dialog_thread` РєР°Рє РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ intent РєР»Р°СЃСЃРёС„РёРєР°С†РёРё thread;
- РєР»Р°СЃСЃРёС„РёРєР°С†РёСЏ РґРёР°Р»РѕРіР° РїРѕ С‚РёРїР°Рј:
  - `free_chat`
  - `task_process`
  - `client_request`
  - `escalation_signal`
- `create_front_office_escalation` РєР°Рє РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ intent СЌСЃРєР°Р»Р°С†РёРё;
- РѕРїСЂРµРґРµР»РµРЅРёРµ С†РµР»РµРІРѕРіРѕ owner-role РґР»СЏ governed handoff;
- СЃРѕР·РґР°РЅРёРµ front-office escalation record;
- routing/ownership С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕР±С‰РёР№ orchestration spine;
- onboarding template РґР»СЏ Control Tower.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р» РІ РїСЂРµРґРµР»Р°С… front-office ownership zone:

- Telegram-first communication routing;
- conversation log Рё thread state;
- dialogue classification Рё signal extraction;
- dialogue summary Рё handoff summary;
- client signal extraction;
- task/process detection;
- escalation creation;
- handoff preparation РІ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°;
- handoff status tracking РІ РїСЂРµРґРµР»Р°С… front-office РїСЂРѕС†РµСЃСЃР°;
- governed handoff to domain owners.

РђРіРµРЅС‚ РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- CRM record management;
- agronomy recommendations;
- finance analysis ownership;
- contracts execution;
- legal interpretation ownership;
- universal task executor РІРЅРµ СЃРІРѕРµРіРѕ ingress-РєРѕРЅС‚СѓСЂР°.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РђРіРµРЅС‚ РґРѕР»Р¶РµРЅ СЂР°Р±РѕС‚Р°С‚СЊ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ orchestration spine.
- РћРЅ РЅРµ РґРѕР»Р¶РµРЅ РЅР°РїСЂСЏРјСѓСЋ РґРµСЂРіР°С‚СЊ С‡СѓР¶РёС… owner-agent.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- `crm_agent` вЂ” РєР»РёРµРЅС‚СЃРєРёРµ Рё account-related handoff
- `agronomist` вЂ” Р°РіСЂРѕРЅРѕРјРёС‡РµСЃРєРёРµ Р·Р°РґР°С‡Рё Рё СЃРёРіРЅР°Р»С‹
- `economist` вЂ” С„РёРЅР°РЅСЃРѕРІС‹Рµ Р·Р°РїСЂРѕСЃС‹
- `contracts_agent` вЂ” РґРѕРіРѕРІРѕСЂРЅС‹Рµ РїСЂРѕС†РµСЃСЃС‹
- `legal_advisor` вЂ” СЋСЂРёРґРёС‡РµСЃРєРёРµ СЂРёСЃРєРё
- `monitoring` вЂ” escalation signals
- `personal_assistant` вЂ” Р»РёС‡РЅР°СЏ РєРѕРѕСЂРґРёРЅР°С†РёСЏ Р±РµР· business ownership

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`front_office_agent` РґРѕР»Р¶РµРЅ РѕСЃС‚Р°РІР°С‚СЊСЃСЏ owner С‚РѕР»СЊРєРѕ РїРѕРєР° Р·Р°РїСЂРѕСЃ РѕСЃС‚Р°С‘С‚СЃСЏ РІРЅСѓС‚СЂРё communication ingress.

Owner РґРѕР»Р¶РµРЅ РїРµСЂРµРґР°РІР°С‚СЊСЃСЏ РґР°Р»СЊС€Рµ, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РїСЂРµРґРјРµС‚РЅС‹Рј РґРѕРјРµРЅРЅС‹Рј СЃС†РµРЅР°СЂРёРµРј:

- РІ `crm_agent`:
  - РєР°СЂС‚РѕС‡РєР° РєР»РёРµРЅС‚Р°
  - РєРѕРЅС‚СЂР°РіРµРЅС‚
  - Р°РєРєР°СѓРЅС‚
  - РєРѕРЅС‚Р°РєС‚
  - CRM interaction
- РІ `contracts_agent`:
  - РґРѕРіРѕРІРѕСЂ
  - РѕР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ
  - fulfillment
  - invoice
  - payment
  - AR
- РІ `agronomist`:
  - РїРѕР»Рµ
  - СЃРµР·РѕРЅ
  - С‚РµС…РєР°СЂС‚Р°
  - Р°РіСЂРѕ-РѕС‚РєР»РѕРЅРµРЅРёРµ
  - Р°РіСЂРѕ-СЂРµРєРѕРјРµРЅРґР°С†РёСЏ
- РІ `economist`:
  - plan/fact
  - budget impact
  - scenario
  - financial analysis
- РІ `monitoring`:
  - signal review
  - alert digest
  - incident snapshot

`front_office_agent` РЅРµ РґРѕР»Р¶РµРЅ СѓРґРµСЂР¶РёРІР°С‚СЊ ownership С‚РѕР»СЊРєРѕ РїРѕС‚РѕРјСѓ, С‡С‚Рѕ Р·Р°РїСЂРѕСЃ РїСЂРёС€С‘Р» РёР· РјРµСЃСЃРµРЅРґР¶РµСЂР°, Telegram РёР»Рё thread UI.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `telegram`
- `task`
- `advisory`
- `client-registry`
- `front-office`

## 14. Required Context Contract

РњРёРЅРёРјР°Р»СЊРЅРѕ РЅСѓР¶РЅС‹:

- channel / communicator source
- dialog or chat identifier
- message payload
- sender / recipient context
- thread state

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

- `log_dialog_message`
- `classify_dialog_thread`
- `create_front_office_escalation`

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… РґРѕРјРµРЅР° РґРѕРїСѓСЃС‚РёРј СЃР»РµРґСѓСЋС‰РёР№ С†РµР»РµРІРѕР№ РЅР°Р±РѕСЂ, РЅРѕ РѕРЅ РЅРµ РґРѕР»Р¶РµРЅ СЃС‡РёС‚Р°С‚СЊСЃСЏ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рј runtime catalog РґРѕ РѕС‚РґРµР»СЊРЅРѕРіРѕ enablement:

- `detect_task_process`
- `detect_free_chat`
- `detect_client_request`
- `handoff_dialog_to_owner`
- `summarize_dialog_context`

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

- `LogDialogMessage`
- `ClassifyDialogThread`
- `CreateFrontOfficeEscalation`

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РІРѕР·РјРѕР¶РµРЅ СЃР»РµРґСѓСЋС‰РёР№ tool surface, РЅРѕ РѕРЅ РЅРµ РґРѕР»Р¶РµРЅ СЃС‡РёС‚Р°С‚СЊСЃСЏ С‚РµРєСѓС‰РёРј runtime surface Р±РµР· РѕС‚РґРµР»СЊРЅРѕРіРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ:

- communicator intake adapter
- dialogue log registry
- thread classifier
- escalation creator
- task link / create adapter
- owner handoff adapter

## 17. UI surface

- `front-office` workspace
- thread list
- message log
- process/task markers
- escalation queue
- handoff status

## 18. Guardrails

- РќРёРєР°РєРёС… direct writes РІ С‡СѓР¶РёРµ РґРѕРјРµРЅС‹.
- РќРёРєР°РєРѕРіРѕ peer-to-peer bypass РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂР°.
- РќРёРєР°РєРѕРіРѕ РїСЂРµРІСЂР°С‰РµРЅРёСЏ Р»СЋР±РѕРіРѕ РґРёР°Р»РѕРіР° РІ Р·Р°РґР°С‡Сѓ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ.

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РЎРјРµС€РµРЅРёРµ СЂРѕР»Рё СЃ `crm_agent`.
- РЎРјРµС€РµРЅРёРµ СЂРѕР»Рё СЃ `personal_assistant`.
- РџРѕС‚РµСЂСЏ РіСЂР°РЅРёС†С‹ РјРµР¶РґСѓ free chat Рё process.
- РЁСѓРјРЅС‹Рµ СЌСЃРєР°Р»Р°С†РёРё.
- РќРµСѓРїСЂР°РІР»СЏРµРјС‹Р№ Р»РѕРі Р±РµР· СЃС‚СЂСѓРєС‚СѓСЂС‹.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- classification tests РїРѕ С‚РёРїР°Рј РґРёР°Р»РѕРіРѕРІ;
- routing tests РёР· communicator РІ owner-domain;
- tests РЅР° free_chat vs task_process;
- escalation tests;
- audit/log persistence tests.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Р•СЃС‚СЊ canonical runtime family.
- Р•СЃС‚СЊ СЏСЃРЅС‹Р№ communication contract.
- Р•СЃС‚СЊ conversation log Рё thread state.
- Р•СЃС‚СЊ governed handoff.
- Telegram-first smoke СЂР°Р±РѕС‚Р°РµС‚ end-to-end.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_FRONT_OFFICE_AGENT_CANON.md](../../00_STRATEGY/STAGE%202/RAI_FRONT_OFFICE_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [front-office-agent.service.ts](../../../apps/api/src/modules/rai-chat/agents/front-office-agent.service.ts)
- [front-office-tools.registry.ts](../../../apps/api/src/modules/rai-chat/tools/front-office-tools.registry.ts)
- [agent-registry.service.ts](../../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [telegram.update.ts](../../../apps/telegram-bot/src/telegram/telegram.update.ts)
- [task.service.ts](../../../apps/api/src/modules/task/task.service.ts)
- [advisory.service.ts](../../../apps/api/src/modules/advisory/advisory.service.ts)
- [client-registry.service.ts](../../../apps/api/src/modules/client-registry/client-registry.service.ts)
- [page.tsx](../../../apps/web/app/(app)/front-office/page.tsx)

