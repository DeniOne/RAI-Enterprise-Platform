---
id: DOC-INS-AGT-003
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РђР РҐРРўР•РљРўРЈР Рђ Р’Р—РђРРњРћР”Р•Р™РЎРўР’РРЇ РђР“Р•РќРўРќРћР™ РџР›РђРўР¤РћР РњР«

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚:

- РєР°Рє С„Р°РєС‚РёС‡РµСЃРєРё СѓСЃС‚СЂРѕРµРЅР° С‚РµРєСѓС‰Р°СЏ Р°РіРµРЅС‚РЅР°СЏ РїР»Р°С‚С„РѕСЂРјР° `RAI_EP`;
- РєР°Рє РґРѕР»Р¶РЅР° РІС‹РіР»СЏРґРµС‚СЊ С†РµР»РµРІР°СЏ СЃС…РµРјР° РїРѕ РєР°РЅРѕРЅСѓ `Stage 2`;
- РіРґРµ РјРµР¶РґСѓ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёРј Р·Р°РјС‹СЃР»РѕРј Рё РєРѕРґРѕРј СѓР¶Рµ РµСЃС‚СЊ СЂР°Р·СЂС‹РІС‹;
- РєР°Рє РїСЂР°РІРёР»СЊРЅРѕ РёРЅС‚РµСЂРїСЂРµС‚РёСЂРѕРІР°С‚СЊ СЃРІСЏР·Рё РјРµР¶РґСѓ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј, Р°РіРµРЅС‚Р°РјРё, РёРЅСЃС‚СЂСѓРјРµРЅС‚Р°РјРё Рё РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё.

Р”РѕРєСѓРјРµРЅС‚ РЅСѓР¶РµРЅ РєР°Рє СЂР°Р±РѕС‡РёР№ СЃС‚Р°РЅРґР°СЂС‚ РґР»СЏ:

- РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёСЏ РЅРѕРІС‹С… agent flows;
- РІС‹РґРµР»РµРЅРёСЏ owner-agent РґР»СЏ РґРѕРјРµРЅРЅС‹С… РєРѕРЅС‚СѓСЂРѕРІ;
- РїСЂРѕРІРµСЂРєРё, РЅРµ РјР°СЃРєРёСЂСѓРµС‚ Р»Рё UI fallback РѕС‚СЃСѓС‚СЃС‚РІРёРµ СЂРµР°Р»СЊРЅРѕРіРѕ agent-owner;
- РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёСЏ governed handoff РјРµР¶РґСѓ Р°РіРµРЅС‚Р°РјРё.

---

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ, РєРѕРіРґР°:

- СЃРѕР·РґР°С‘С‚СЃСЏ РЅРѕРІС‹Р№ Р°РіРµРЅС‚;
- СЂР°СЃС€РёСЂСЏРµС‚СЃСЏ Р·РѕРЅР° РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРіРѕ Р°РіРµРЅС‚Р°;
- РїРѕРґРєР»СЋС‡Р°РµС‚СЃСЏ РЅРѕРІС‹Р№ РґРѕРјРµРЅРЅС‹Р№ РјРѕРґСѓР»СЊ Рє AI-РєРѕРЅС‚СѓСЂСѓ;
- РїСЂРѕРµРєС‚РёСЂСѓРµС‚СЃСЏ handoff РјРµР¶РґСѓ Р°РіРµРЅС‚Р°РјРё;
- РІС‹СЏРІР»РµРЅ СЃС†РµРЅР°СЂРёР№, РіРґРµ С‡Р°С‚ РїРѕРєР°Р·С‹РІР°РµС‚ fallback РІРјРµСЃС‚Рѕ СЂРµР°Р»СЊРЅРѕР№ Р°РіРµРЅС‚РЅРѕР№ СЂР°Р±РѕС‚С‹;
- РЅСѓР¶РЅРѕ РїРѕРЅСЏС‚СЊ, СЏРІР»СЏРµС‚СЃСЏ Р»Рё РїСЂРѕР±Р»РµРјР° вЂњРѕС€РёР±РєРѕР№ Р°РіРµРЅС‚Р°вЂќ РёР»Рё вЂњРѕС‚СЃСѓС‚СЃС‚РІРёРµРј owner-agentвЂќ.

---

## 3. РџСЂРµРґРІР°СЂРёС‚РµР»СЊРЅС‹Рµ СѓСЃР»РѕРІРёСЏ

РџРµСЂРµРґ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµРј СЌС‚РѕРіРѕ РґРѕРєСѓРјРµРЅС‚Р° РЅСѓР¶РЅРѕ РѕРїРёСЂР°С‚СЊСЃСЏ РЅР°:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](../00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](../00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-execution-adapter.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

РќРѕСЂРјР°С‚РёРІРЅРѕРµ СЂР°Р·РґРµР»РµРЅРёРµ source of truth:

- trigger-level routing, primary owner Рё handoff rules С„РёРєСЃРёСЂСѓСЋС‚СЃСЏ РІ [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md);
- РіСЂР°РЅРёС†С‹ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ Р°РіРµРЅС‚Р°, РµРіРѕ `current / max allowed / handoff boundaries` С„РёРєСЃРёСЂСѓСЋС‚СЃСЏ РІ СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РµРј РїСЂРѕС„РёР»СЊРЅРѕРј РїР°СЃРїРѕСЂС‚Рµ РІ `AGENT_PROFILES`.

---

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РєР°РЅРѕРЅ Stage 2 РїРѕ Р°РіРµРЅС‚РЅРѕР№ РїР»Р°С‚С„РѕСЂРјРµ

### 4.1 Р§С‚Рѕ Р·Р°РґСѓРјР°РЅРѕ РІ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРѕРј РєР°РЅРѕРЅРµ

РџРѕ `Stage 2` Р°РіРµРЅС‚РЅР°СЏ РїР»Р°С‚С„РѕСЂРјР° РґРѕР»Р¶РЅР° Р±С‹С‚СЊ РЅРµ РЅР°Р±РѕСЂРѕРј LLM-Р±РѕС‚РѕРІ, Р° governed product-layer СЃРёСЃС‚РµРјРѕР№, РіРґРµ:

- РµСЃС‚СЊ РµРґРёРЅС‹Р№ orchestration spine;
- Р°РіРµРЅС‚ РѕРїСЂРµРґРµР»СЏРµС‚СЃСЏ РЅРµ С‚РѕР»СЊРєРѕ `prompt` Рё `model`, Р° С‡РµСЂРµР· product contracts;
- Сѓ Р°РіРµРЅС‚Р° РµСЃС‚СЊ first-class Р·РѕРЅР° РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё;
- С‡Р°С‚ РЅРµ РґРѕР»Р¶РµРЅ СЃРєСЂС‹РІР°С‚СЊ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Рµ РґС‹СЂС‹ РєСЂР°СЃРёРІС‹Рј fallback-РѕС‚РІРµС‚РѕРј;
- РїСЂР°РІР°СЏ СЂР°Р±РѕС‡Р°СЏ Р·РѕРЅР° РґРѕР»Р¶РЅР° РїРѕР»СѓС‡Р°С‚СЊ typed work windows, Р° РЅРµ РґРµРєРѕСЂР°С‚РёРІРЅС‹Рµ С‚РµРєСЃС‚РѕРІС‹Рµ Р·Р°РіР»СѓС€РєРё.

Р­С‚Рѕ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРѕ РІ:

- master-plan РєР°Рє РїРµСЂРµС…РѕРґ РѕС‚ `platform mostly done` Рє `functional agentization`;
- addendum РїРѕ `Focus / Intent / Required Context / UI Action Surface`;
- interaction blueprint РєР°Рє РєР°РЅРѕРЅ `РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ <-> РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ <-> Р°РіРµРЅС‚ <-> СЂР°Р±РѕС‡РёРµ РѕРєРЅР°`;
- readiness checklist РєР°Рє С‚СЂРµР±РѕРІР°РЅРёРµ Рє СЂРµР°Р»СЊРЅРѕРјСѓ owner РЅР° РєР°Р¶РґС‹Р№ РєСЂРёС‚РёС‡РЅС‹Р№ С‚СЂРµРє.

### 4.2 Р§С‚Рѕ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РєР°РЅРѕРЅ Р·Р°РїСЂРµС‰Р°РµС‚

РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРё Р·Р°РїСЂРµС‰РµРЅРѕ СЃС‡РёС‚Р°С‚СЊ РЅРѕСЂРјРѕР№:

- СЃРІРѕР±РѕРґРЅСѓСЋ `all-to-all` mesh-СЃРµС‚СЊ РјРµР¶РґСѓ Р°РіРµРЅС‚Р°РјРё;
- вЂњР°РіРµРЅС‚ Р±РµР· owner-domain Рё Р±РµР· explicit contractsвЂќ;
- UI fallback, РєРѕС‚РѕСЂС‹Р№ РІС‹РіР»СЏРґРёС‚ РєР°Рє СЂР°Р±РѕС‡РёР№ СЂРµР·СѓР»СЊС‚Р°С‚ РїСЂРё РѕС‚СЃСѓС‚СЃС‚РІРёРё agent-owner;
- РїСЂСЏРјРѕР№ РѕР±С…РѕРґ orchestration spine ad-hoc РІС‹Р·РѕРІР°РјРё РґРѕРјРµРЅРЅС‹С… СЃРµСЂРІРёСЃРѕРІ.

---

## 5. РўРµРєСѓС‰РµРµ С„Р°РєС‚РёС‡РµСЃРєРѕРµ СѓСЃС‚СЂРѕР№СЃС‚РІРѕ РїРѕ РєРѕРґСѓ

### 5.1 РљР°РЅРѕРЅРёС‡РµСЃРєРёРµ runtime-Р°РіРµРЅС‚С‹

РџРѕ РєРѕРґСѓ С‚РµРєСѓС‰РёРјРё РєР°РЅРѕРЅРёС‡РµСЃРєРёРјРё runtime-СЂРѕР»СЏРјРё СЏРІР»СЏСЋС‚СЃСЏ:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`
- `front_office_agent`
- `contracts_agent`

РСЃС‚РѕС‡РЅРёРє: [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)

### 5.2 Р¦РµРЅС‚СЂР°Р»СЊРЅС‹Р№ orchestration spine

Р¤Р°РєС‚РёС‡РµСЃРєРёР№ РїСѓС‚СЊ РёСЃРїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР° РІС‹РіР»СЏРґРёС‚ С‚Р°Рє:

```text
РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ
  -> UI / AI Dock
  -> RaiChatController
  -> RaiChatService
  -> SupervisorAgent
  -> IntentRouterService
  -> AgentRuntimeService
  -> AgentExecutionAdapterService
  -> РєРѕРЅРєСЂРµС‚РЅС‹Р№ Р°РіРµРЅС‚
  -> tools registry / deterministic services / domain modules
  -> ResponseComposerService
  -> С‡Р°С‚ + work windows
```

РСЃС‚РѕС‡РЅРёРєРё:

- [rai-chat.module.ts](../../apps/api/src/modules/rai-chat/rai-chat.module.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)

### 5.3 РљР°Рє СЂРµР°Р»СЊРЅРѕ СЃРіСЂСѓРїРїРёСЂРѕРІР°РЅС‹ РІС‹Р·РѕРІС‹ РІ runtime

РќР° СѓСЂРѕРІРЅРµ planner fan-out РёРґС‘С‚ РїРѕ РіСЂСѓРїРїР°Рј:

- `agronom`
- `economist`
- `knowledge`
- `crm`
- `contracts`
- `other`

РСЃС‚РѕС‡РЅРёРє: [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)

Р­С‚Рѕ РѕР·РЅР°С‡Р°РµС‚:

- orchestration РёРґС‘С‚ С‡РµСЂРµР· РµРґРёРЅС‹Р№ hub;
- РїСЂСЏРјРѕР№ СЃРІРѕР±РѕРґРЅРѕР№ СЃРµС‚Рё `Р°РіРµРЅС‚ -> Р°РіРµРЅС‚ -> Р°РіРµРЅС‚` СЃРµР№С‡Р°СЃ РІ РєРѕРґРµ РЅРµС‚;
- Р°РіРµРЅС‚РЅС‹Р№ РєРѕРЅС‚СѓСЂ Р±Р»РёР¶Рµ Рє `hub-and-spoke`, С‡РµРј Рє `mesh`.

---

## 6. РЎС…РµРјР° СЃРІСЏР·РµР№: С‚РµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ

### 6.1 РћР±С‰Р°СЏ СЃС…РµРјР°

```text
UI / AI Dock
  -> SupervisorAgent
    -> IntentRouterService
    -> MemoryCoordinatorService
    -> AgentRuntimeService
      -> AgentExecutionAdapterService
        -> AgronomAgent
        -> EconomistAgent
        -> KnowledgeAgent
        -> MonitoringAgent
        -> CrmAgent
        -> FrontOfficeAgent
        -> ContractsAgent
      -> typed tool calls
      -> domain registries
    -> ResponseComposerService
  -> С‡Р°С‚ + work windows + structured output
```

### 6.2 РљС‚Рѕ СЃ РєРµРј СЃРІСЏР·Р°РЅ СЃРµР№С‡Р°СЃ

#### РћРґРёРЅ СЃРѕ РІСЃРµРјРё

Р’ С‚РµРєСѓС‰РµР№ СЂРµР°Р»РёР·Р°С†РёРё СЂРѕР»СЊ вЂњРѕРґРёРЅ СЃРѕ РІСЃРµРјРёвЂќ РІС‹РїРѕР»РЅСЏРµС‚ orchestration spine:

- `SupervisorAgent`
- `AgentRuntimeService`
- `AgentExecutionAdapterService`

РРјРµРЅРЅРѕ РѕРЅРё Р·РЅР°СЋС‚:

- РєР°РєРѕР№ Р°РіРµРЅС‚ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РІС‹Р±СЂР°РЅ;
- РєР°РєРѕР№ tool РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РІС‹Р·РІР°РЅ;
- РєР°РєРѕР№ runtime budget РґРµР№СЃС‚РІСѓРµС‚;
- РєР°Рє СЃРѕР±СЂР°С‚СЊ РёС‚РѕРіРѕРІС‹Р№ РѕС‚РІРµС‚.

#### Р’СЃРµ СЃ РѕРґРЅРёРј

Р’СЃРµ СЃРїРµС†РёР°Р»РёР·РёСЂРѕРІР°РЅРЅС‹Рµ Р°РіРµРЅС‚С‹ С„Р°РєС‚РёС‡РµСЃРєРё СЃРІСЏР·Р°РЅС‹ СЃ РµРґРёРЅС‹Рј С†РµРЅС‚СЂРѕРј:

- `AgronomAgent`
- `EconomistAgent`
- `KnowledgeAgent`
- `MonitoringAgent`
- `CrmAgent`

РћРЅРё РЅРµ СЏРІР»СЏСЋС‚СЃСЏ РЅРµР·Р°РІРёСЃРёРјРѕР№ peer-to-peer СЃРµС‚СЊСЋ.

#### Р’СЃРµ СЃРѕ РІСЃРµРјРё

Р’ С‚РµРєСѓС‰РµРј РєРѕРґРµ РїРѕР»РЅРѕС†РµРЅРЅРѕР№ РјРѕРґРµР»Рё `РІСЃРµ СЃРѕ РІСЃРµРјРё` РЅРµС‚.

РўРѕ РµСЃС‚СЊ РЅРµРІРµСЂРЅРѕ РѕРїРёСЃС‹РІР°С‚СЊ С‚РµРєСѓС‰СѓСЋ РїР»Р°С‚С„РѕСЂРјСѓ РєР°Рє:

- вЂњРєР°Р¶РґС‹Р№ Р°РіРµРЅС‚ РјРѕР¶РµС‚ СЃРІРѕР±РѕРґРЅРѕ СЂР°Р·РіРѕРІР°СЂРёРІР°С‚СЊ СЃ РєР°Р¶РґС‹РјвЂќ;
- вЂњР°РіРµРЅС‚С‹ РѕР±СЂР°Р·СѓСЋС‚ mesh Р±РµР· С†РµРЅС‚СЂР°Р»СЊРЅРѕРіРѕ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂР°вЂќ.

### 6.3 Р§С‚Рѕ СЃРµР№С‡Р°СЃ СЃС‡РёС‚Р°РµС‚СЃСЏ РЅРѕСЂРјРѕР№

РќРѕСЂРјРѕР№ СЃС‡РёС‚Р°РµС‚СЃСЏ:

- `РІСЃРµ СЃ РѕРґРЅРёРј`
- `РѕРґРёРЅ СЃРѕ РІСЃРµРјРё`
- `governed orchestration С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ spine`

РќРµ СЃС‡РёС‚Р°РµС‚СЃСЏ РЅРѕСЂРјРѕР№:

- uncontrolled peer-to-peer;
- СЃРєСЂС‹С‚С‹Р№ РїСЂСЏРјРѕР№ РІС‹Р·РѕРІ С‡СѓР¶РѕРіРѕ РґРѕРјРµРЅР° РєР°Рє Р±СѓРґС‚Рѕ СЌС‚Рѕ handoff.

---

## 7. РЎС…РµРјР° СЃРІСЏР·РµР№: С†РµР»РµРІРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ

### 7.1 Р¦РµР»РµРІР°СЏ РјРѕРґРµР»СЊ Stage 2

Р¦РµР»РµРІР°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР° РґРѕР»Р¶РЅР° РІС‹РіР»СЏРґРµС‚СЊ С‚Р°Рє:

```text
РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ
  -> РµРґРёРЅС‹Р№ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ
  -> РєР»Р°СЃСЃРёС„РёРєР°С†РёСЏ РїРѕ Focus / Intent / Context contracts
  -> owner-agent РїРѕ РґРѕРјРµРЅСѓ
  -> governed tool / connector path
  -> typed result / clarification / work windows
  -> РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё governed handoff РѕР±СЂР°С‚РЅРѕ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ
```

### 7.2 Р¦РµР»РµРІРѕР№ handoff

Р”РѕРїСѓСЃС‚РёРјС‹Р№ handoff РІ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё:

- РЅРµ РїСЂСЏРјРѕР№ `agent A -> agent B` РєР°Рє СЃРєСЂС‹С‚С‹Р№ РІС‹Р·РѕРІ;
- Р° `agent A -> orchestration decision -> agent B`.

РРЅС‹РјРё СЃР»РѕРІР°РјРё:

- handoff РґРѕРїСѓСЃС‚РёРј;
- СЃРєСЂС‹С‚Р°СЏ mesh-РјРѕРґРµР»СЊ РЅРµ РґРѕРїСѓСЃС‚РёРјР°.

### 7.3 Р§С‚Рѕ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ Сѓ РєР°Р¶РґРѕРіРѕ РґРѕРјРµРЅР°

Р§С‚РѕР±С‹ РґРѕРјРµРЅ СЃС‡РёС‚Р°Р»СЃСЏ РЅРѕСЂРјР°Р»СЊРЅРѕ РїРѕРґРєР»СЋС‡С‘РЅРЅС‹Рј Рє РїР»Р°С‚С„РѕСЂРјРµ, Сѓ РЅРµРіРѕ РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ:

- owner-agent;
- `Focus Contract`;
- `Intent Catalog`;
- `Required Context Contract`;
- `UI Action Surface Contract`;
- tool surface;
- rich-output path;
- governance path;
- С‚РµСЃС‚С‹ Рё smoke-proof.

---

## 8. РўРёРїС‹ СЃРІСЏР·РЅРѕСЃС‚Рё

### 8.1 Р’СЃРµ СЃ РѕРґРЅРёРј

Р­С‚Рѕ С‚РµРєСѓС‰РёР№ РѕСЃРЅРѕРІРЅРѕР№ РїР°С‚С‚РµСЂРЅ РїР»Р°С‚С„РѕСЂРјС‹.

РЎРјС‹СЃР»:

- РІСЃРµ Р°РіРµРЅС‚С‹ СЂР°Р±РѕС‚Р°СЋС‚ С‡РµСЂРµР· РµРґРёРЅС‹Р№ РєРѕРѕСЂРґРёРЅР°С†РёРѕРЅРЅС‹Р№ С†РµРЅС‚СЂ;
- РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂ СЂРµС€Р°РµС‚, РєС‚Рѕ owner;
- orchestration spine СѓРїСЂР°РІР»СЏРµС‚ execution path.

РЎС‚Р°С‚СѓСЃ:

- СЂРµР°Р»РёР·РѕРІР°РЅРѕ;
- СЏРІР»СЏРµС‚СЃСЏ РєР°РЅРѕРЅРёС‡РµСЃРєРёРј С‚РµРєСѓС‰РёРј СЂРµР¶РёРјРѕРј.

### 8.2 РћРґРёРЅ СЃРѕ РІСЃРµРјРё

Р­С‚Рѕ РІС‚РѕСЂР°СЏ СЃС‚РѕСЂРѕРЅР° С‚РµРєСѓС‰РµР№ Р¶Рµ РјРѕРґРµР»Рё.

РЎРјС‹СЃР»:

- С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ orchestration hub Р·РЅР°РµС‚ РІСЃРµ РїРѕРґРєР»СЋС‡С‘РЅРЅС‹Рµ agent families;
- РѕРЅ РІС‹Р±РёСЂР°РµС‚ Рё Р°РєС‚РёРІРёСЂСѓРµС‚ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РёСЃРїРѕР»РЅРёС‚РµР»СЏ.

РЎС‚Р°С‚СѓСЃ:

- СЂРµР°Р»РёР·РѕРІР°РЅРѕ;
- СЏРІР»СЏРµС‚СЃСЏ РЅРѕСЂРјРѕР№.

### 8.3 Р’СЃРµ СЃРѕ РІСЃРµРјРё

РЎРјС‹СЃР»:

- Р»СЋР±РѕР№ Р°РіРµРЅС‚ РјРѕР¶РµС‚ РЅР°РїСЂСЏРјСѓСЋ РІС‹Р·С‹РІР°С‚СЊ Р»СЋР±РѕРіРѕ РґСЂСѓРіРѕРіРѕ;
- orchestration center РїРµСЂРµСЃС‚Р°С‘С‚ Р±С‹С‚СЊ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј.

РЎС‚Р°С‚СѓСЃ:

- РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅРѕ;
- РЅРµ РґРѕР»Р¶РЅРѕ СЃС‡РёС‚Р°С‚СЊСЃСЏ С‚РµРєСѓС‰РµР№ Р°СЂС…РёС‚РµРєС‚СѓСЂРѕР№;
- РЅРµ РґРѕР»Р¶РЅРѕ РѕРїРёСЃС‹РІР°С‚СЊСЃСЏ РєР°Рє РґРµР№СЃС‚РІСѓСЋС‰Р°СЏ РЅРѕСЂРјР°.

### 8.4 РЈРїСЂР°РІР»СЏРµРјС‹Р№ handoff С‡РµСЂРµР· С†РµРЅС‚СЂР°Р»СЊРЅС‹Р№ СѓР·РµР»

Р­С‚Рѕ С†РµР»РµРІРѕР№ Р±РµР·РѕРїР°СЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ.

РЎРјС‹СЃР»:

- РјРµР¶Р°РіРµРЅС‚РЅР°СЏ РїРµСЂРµРґР°С‡Р° РІРѕР·РјРѕР¶РЅР°;
- РЅРѕ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕСЂРєРµСЃС‚СЂР°С†РёРѕРЅРЅС‹Р№ spine;
- owner-agent Рё РїСЂРёРЅРёРјР°СЋС‰РёР№ Р°РіРµРЅС‚ РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ СЏРІРЅС‹РјРё;
- handoff РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ governed Рё traceable.

РЎС‚Р°С‚СѓСЃ:

- С‡Р°СЃС‚РёС‡РЅРѕ РїРѕРґРґРµСЂР¶Р°РЅ РєРѕРЅС†РµРїС‚СѓР°Р»СЊРЅРѕ;
- РЅРµ СЏРІР»СЏРµС‚СЃСЏ РµС‰С‘ РїРѕР»РЅРѕСЃС‚СЊСЋ СЂРµР°Р»РёР·РѕРІР°РЅРЅС‹Рј platform-wide СЃС‚Р°РЅРґР°СЂС‚РѕРј.

---

## 9. Р Р°Р·СЂС‹РІС‹ РјРµР¶РґСѓ С‚РµРєСѓС‰РёРј Рё С†РµР»РµРІС‹Рј СЃРѕСЃС‚РѕСЏРЅРёРµРј

### 9.1 Р”РѕРјРµРЅРЅС‹Рµ РјРѕРґСѓР»Рё Р±РµР· owner-agent

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ РїСЂРёРјРµСЂС‹:

- `legal`
- `strategy`

Р¤Р°РєС‚:

- РґРѕРјРµРЅРЅС‹Рµ РєРѕРЅС‚СѓСЂС‹ Рё template roles СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‚;
- advisory ownership Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ;
- canonical runtime owner-agent РµС‰С‘ РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅ.

### 9.2 РџР»Р°РЅРѕРІС‹Рµ СЂРѕР»Рё РЅРµ СЂР°РІРЅС‹ РєР°РЅРѕРЅРёС‡РµСЃРєРёРј runtime-Р°РіРµРЅС‚Р°Рј

Р’ СЃРёСЃС‚РµРјРµ СѓР¶Рµ РµСЃС‚СЊ template/future roles:

- `marketer`
- `strategist`
- `finance_advisor`
- `legal_advisor`
- `controller`
- `personal_assistant`

РќРѕ РѕРЅРё РЅРµ СЏРІР»СЏСЋС‚СЃСЏ РїРѕР»РЅРѕС†РµРЅРЅС‹РјРё canonical runtime families.

### 9.3 РќРµ Сѓ РІСЃРµС… РґРѕРјРµРЅРѕРІ РµСЃС‚СЊ first-class ownership map

Р Р°Р·СЂС‹РІ:

- РґРѕРјРµРЅРЅС‹Рµ РјРѕРґСѓР»Рё Рё СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёРµ СЂРѕР»Рё Stage 2 СѓР¶Рµ РѕРїРёСЃР°РЅС‹;
- РЅРѕ РЅРµ РґР»СЏ РєР°Р¶РґРѕРіРѕ РґРѕРјРµРЅР° Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ owner-agent;
- РёР·-Р·Р° СЌС‚РѕРіРѕ С‡Р°СЃС‚СЊ UX СЃС†РµРЅР°СЂРёРµРІ РїРѕРїР°РґР°РµС‚ РІ fallback РІРјРµСЃС‚Рѕ СЂРµР°Р»СЊРЅРѕРіРѕ РёСЃРїРѕР»РЅРµРЅРёСЏ.

### 9.4 Fallback РјРѕР¶РµС‚ РјР°СЃРєРёСЂРѕРІР°С‚СЊ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅСѓСЋ РґС‹СЂСѓ

Р•СЃР»Рё intent-owner РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚, РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РјРѕР¶РµС‚ СѓРІРёРґРµС‚СЊ:

- backlog;
- route-based task list;
- РІРёРґРёРјРѕСЃС‚СЊ вЂњСЃРёСЃС‚РµРјР° С‡С‚Рѕ-С‚Рѕ РїРѕРЅСЏР»Р°вЂќ.

РќРѕ СЌС‚Рѕ РЅРµ РѕР·РЅР°С‡Р°РµС‚, С‡С‚Рѕ РґРѕРјРµРЅ СЂРµР°Р»СЊРЅРѕ РїРѕРґРєР»СЋС‡С‘РЅ Рє Р°РіРµРЅС‚РЅРѕР№ РїР»Р°С‚С„РѕСЂРјРµ.

---

## 10. РљСЂРёС‚РёС‡РµСЃРєРёРµ РѕС€РёР±РєРё Рё Р·Р°РїСЂРµС‚С‹

- Р—Р°РїСЂРµС‰РµРЅРѕ РѕРїРёСЃС‹РІР°С‚СЊ С‚РµРєСѓС‰СѓСЋ РїР»Р°С‚С„РѕСЂРјСѓ РєР°Рє СЃРІРѕР±РѕРґРЅСѓСЋ `all-to-all` Р°РіРµРЅС‚РЅСѓСЋ СЃРµС‚СЊ.
- Р—Р°РїСЂРµС‰РµРЅРѕ СЃС‡РёС‚Р°С‚СЊ РЅР°Р»РёС‡РёРµ backend-РјРѕРґСѓР»СЏ РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІРѕРј С‚РѕРіРѕ, С‡С‚Рѕ Сѓ РґРѕРјРµРЅР° СѓР¶Рµ РµСЃС‚СЊ owner-agent.
- Р—Р°РїСЂРµС‰РµРЅРѕ СЃС‡РёС‚Р°С‚СЊ UI fallback СЂР°Р±РѕС‡РёРј Р°РіРµРЅС‚РЅС‹Рј СЃС†РµРЅР°СЂРёРµРј.
- Р—Р°РїСЂРµС‰РµРЅРѕ РЅР°Р·С‹РІР°С‚СЊ future/template role РїРѕР»РЅРѕС†РµРЅРЅС‹Рј canonical runtime-agent, РµСЃР»Рё РѕРЅР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅР° РєР°Рє РѕС‚РґРµР»СЊРЅР°СЏ runtime family.
- Р—Р°РїСЂРµС‰РµРЅРѕ РїСЂРѕРµРєС‚РёСЂРѕРІР°С‚СЊ direct peer-to-peer handoff РєР°Рє default-РјРѕРґРµР»СЊ Р±РµР· orchestration spine.

---

## 11. РџСЂРѕРІРµСЂРєР° РіРѕС‚РѕРІРЅРѕСЃС‚Рё

Р”РѕРєСѓРјРµРЅС‚ СЃС‡РёС‚Р°РµС‚СЃСЏ РѕС„РѕСЂРјР»РµРЅРЅС‹Рј РїСЂР°РІРёР»СЊРЅРѕ, РµСЃР»Рё:

- СЏРІРЅРѕ РѕРїРёСЃР°РЅРѕ С‚РµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РїРѕ РєРѕРґСѓ;
- СЏРІРЅРѕ РѕРїРёСЃР°РЅР° С†РµР»РµРІР°СЏ СЃС…РµРјР° РїРѕ Stage 2;
- СЂР°Р·РѕР±СЂР°РЅС‹ СЂРµР¶РёРјС‹ `РІСЃРµ СЃ РѕРґРЅРёРј`, `РѕРґРёРЅ СЃРѕ РІСЃРµРјРё`, `РІСЃРµ СЃРѕ РІСЃРµРјРё`;
- РїРѕРєР°Р·Р°РЅРѕ, С‡С‚Рѕ С‚РµРєСѓС‰Р°СЏ РјРѕРґРµР»СЊ = `hub-and-spoke`;
- РїРµСЂРµС‡РёСЃР»РµРЅС‹ СЂРµР°Р»СЊРЅС‹Рµ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Рµ СЂР°Р·СЂС‹РІС‹;
- РЅРµ СЃРјРµС€Р°РЅС‹ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РєР°РЅРѕРЅ Рё С„Р°РєС‚РёС‡РµСЃРєР°СЏ СЂРµР°Р»РёР·Р°С†РёСЏ;
- РїСЂРёРІРµРґРµРЅС‹ РєРѕРЅРєСЂРµС‚РЅС‹Рµ С‚РѕС‡РєРё РєРѕРґР°.

---

## 12. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [rai-chat.module.ts](../../apps/api/src/modules/rai-chat/rai-chat.module.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-runtime.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [agent-execution-adapter.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [response-composer.service.ts](../../apps/api/src/modules/rai-chat/composer/response-composer.service.ts)

