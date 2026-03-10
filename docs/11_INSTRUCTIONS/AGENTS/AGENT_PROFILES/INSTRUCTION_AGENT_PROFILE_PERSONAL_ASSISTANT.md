---
id: DOC-INS-AGT-PROFILE-011
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# РРќРЎРўР РЈРљР¦РРЇ вЂ” РџР РћР¤РР›Р¬ РђР“Р•РќРўРђ PERSONAL_ASSISTANT

## 1. РќР°Р·РЅР°С‡РµРЅРёРµ

Р”РѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ plan/template-role `personal_assistant`.

## 2. РљРѕРіРґР° РїСЂРёРјРµРЅСЏС‚СЊ

РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРѕРєСѓРјРµРЅС‚ РїСЂРё РїСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёРё Р»РёС‡РЅРѕРіРѕ delegated-assistant РєРѕРЅС‚СѓСЂР° Рё РїСЂРё СЂР°Р·РІРµРґРµРЅРёРё РµРіРѕ РіСЂР°РЅРёС† СЃ business owner-agents.

## 3. РЎС‚Р°С‚СѓСЃ Р°РіРµРЅС‚Р°

- РЎС‚Р°С‚СѓСЃ: РїР»Р°РЅРѕРІР°СЏ template/future role.
- Runtime family: РЅРµ СЂРµР°Р»РёР·РѕРІР°РЅР°.
- Owner domain РІ template: `personal_ops`.
- Execution adapter: `knowledge`.

## 4. РЎС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РѕР±СЂР°Р· Р°РіРµРЅС‚Р° РІ Stage 2

Р РѕР»СЊ РЅСѓР¶РЅР° РґР»СЏ:

- personal tasks;
- agenda coordination;
- delegated summaries;
- reminders;
- personal productivity РІ СѓР·РєРёС… Рё privacy-safe РіСЂР°РЅРёС†Р°С… Р±РµР· РїРµСЂРµС…РІР°С‚Р° Р±РёР·РЅРµСЃ ownership.

## 5. Р¤Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Р°РіРµРЅС‚Р° РїРѕ РєРѕРґСѓ

РџРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ РєР°Рє onboarding template:

- `ownerDomain: personal_ops`
- `profileId: personal-assistant-runtime-v1`
- `executionAdapterRole: knowledge`
- `ProductivityToolsRegistry`
- connector `calendar_read_model` РІ СЂРµР¶РёРјРµ `read`
- `personal-assistant-v1` output contract
- `personal-assistant-memory-v1`
- `personal-assistant-governance-v1`
- human gate rule `delegated_actions_require_confirmation`
- critical action rule `no_unreviewed_external_writes`
- fallback rule `use_context_summary_if_llm_unavailable`
- optional `personal-ops-adapter`

Canonical runtime role РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚.

## 6. Р”РѕРјРµРЅС‹ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё

- personal tasks;
- reminders;
- delegated summaries;
- agenda and lightweight coordination;
- personal context interpretation РІ РґРµР»РµРіРёСЂРѕРІР°РЅРЅС‹С… РіСЂР°РЅРёС†Р°С…, Р° РЅРµ business execution.

## 7. Р§С‚Рѕ Р°РіРµРЅС‚ РѕР±СЏР·Р°РЅ РґРµР»Р°С‚СЊ

- Р Р°Р±РѕС‚Р°С‚СЊ С‚РѕР»СЊРєРѕ РІ РґРµР»РµРіРёСЂРѕРІР°РЅРЅС‹С… Рё privacy-safe РїСЂРµРґРµР»Р°С….
- РЈРІР°Р¶Р°С‚СЊ personal context Рё masking policy.
- РћС‚РґРµР»СЏС‚СЊ summary Рё coordination РѕС‚ РІРЅРµС€РЅРµРіРѕ РґРµР№СЃС‚РІРёСЏ.
- РќРµ СЃРѕРІРµСЂС€Р°С‚СЊ РІРЅРµС€РЅРёРµ writes Р±РµР· РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ.

## 8. Р§С‚Рѕ Р°РіРµРЅС‚Сѓ Р·Р°РїСЂРµС‰РµРЅРѕ РґРµР»Р°С‚СЊ

- Р’С‹РїРѕР»РЅСЏС‚СЊ unreviewed external writes.
- Р—Р°С…РІР°С‚С‹РІР°С‚СЊ ownership Р±РёР·РЅРµСЃ-РґРѕРјРµРЅРѕРІ.
- РџРѕРґРјРµРЅСЏС‚СЊ `crm_agent`, `contracts_agent`, `economist`, `legal_advisor`, `front_office_agent` РёР»Рё РґСЂСѓРіРёРµ owner-Р°РіРµРЅС‚С‹.
- РџСЂРёС‚РІРѕСЂСЏС‚СЊСЃСЏ production-ready runtime owner, РїРѕРєР° canonical personal_ops family РЅРµ РїРѕРґРЅСЏС‚Р°.
- РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ personal contour РєР°Рє РѕР±С…РѕРґ Р±РёР·РЅРµСЃ-guardrails.

## 9. РўРµРєСѓС‰РёР№ С„Р°РєС‚РёС‡РµСЃРєРёР№ С„СѓРЅРєС†РёРѕРЅР°Р»

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current state РЅР° template-СѓСЂРѕРІРЅРµ:

- template manifest РґР»СЏ `personal_assistant`;
- runtime defaults РґР»СЏ Р±СѓРґСѓС‰РµРіРѕ personal_ops-РєРѕРЅС‚СѓСЂР°;
- adapter binding Рє `knowledge`;
- `ProductivityToolsRegistry` РЅР° template-СѓСЂРѕРІРЅРµ;
- read-only connector `calendar_read_model` СЃРѕ scope `events`, `availability`;
- `personal-assistant-v1` output contract СЃ СЃРµРєС†РёСЏРјРё `summary`, `tasks`, `constraints`, `next_steps`;
- memory policy `personal-assistant-memory-v1` СЃРѕ `scoped_recall`, `append_interaction` Рё `allow_masked_only`;
- governance defaults РґР»СЏ delegated advisory-only path;
- optional `personal-ops-adapter` РґР»СЏ deterministic formatting РєР°Р»РµРЅРґР°СЂСЏ Рё Р·Р°РґР°С‡.

Р§С‚Рѕ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ СЃРµР№С‡Р°СЃ РєР°Рє runtime-С„СѓРЅРєС†РёРѕРЅР°Р»:

- canonical runtime family;
- РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅС‹Р№ personal_ops intent catalog РІ `rai-chat`;
- production personal-assistant tool surface;
- direct production routing РІ `personal_assistant` РєР°Рє РІ `primary owner-agent`.

## 10. РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

- Calendar and task summary;
- next-step planning;
- delegated reminders;
- lightweight coordination РІРЅСѓС‚СЂРё user scope;
- read-only follow-up preparation;
- advisory handoff Рє РґРѕРјРµРЅРЅС‹Рј owner-Р°РіРµРЅС‚Р°Рј Р±РµР· РїРѕРґРјРµРЅС‹ РёС… ownership.

Р РѕР»СЊ РЅРµ РґРѕР»Р¶РЅР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РґРѕ:

- ownership РЅР°Рґ CRM, contracts, finance, legal, agronomy РёР»Рё monitoring;
- communicator ingress ownership Сѓ `front_office_agent`;
- retrieval ownership Сѓ `knowledge`;
- СЃРєСЂС‹С‚РѕРіРѕ executive assistant, РєРѕС‚РѕСЂС‹Р№ РёСЃРїРѕР»РЅСЏРµС‚ business actions Р±РµР· РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ;
- bypass-path РІРѕРєСЂСѓРі РїРѕРґС‚РІРµСЂР¶РґРµРЅРёР№ Рё privacy restrictions.

## 11. РЎРІСЏР·Рё СЃ РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј

- РЎРµР№С‡Р°СЃ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· onboarding template.
- Р’ canonical runtime topology РєР°Рє РѕС‚РґРµР»СЊРЅР°СЏ family РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚.
- Р”Рѕ canonical enablement direct production routing РІ `personal_assistant` Р·Р°РїСЂРµС‰С‘РЅ.

## 12. РЎРІСЏР·Рё СЃ РґСЂСѓРіРёРјРё Р°РіРµРЅС‚Р°РјРё

- РЎ `knowledge`: С‚РµРєСѓС‰РµРµ template inheritance Рё retrieval support.
- РЎ РґРѕРјРµРЅРЅС‹РјРё owner-agents: С‚РѕР»СЊРєРѕ РєР°Рє РїРѕС‚СЂРµР±РёС‚РµР»СЊ РёС… read-only СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ, Р° РЅРµ РІР»Р°РґРµР»РµС† СЃС†РµРЅР°СЂРёСЏ.
- РЎ `front_office_agent`: Р±СѓРґСѓС‰РёР№ restricted handoff РїРѕ personal/delegated summaries, РєРѕРіРґР° Р·Р°РїСЂРѕСЃ РЅРµ СЏРІР»СЏРµС‚СЃСЏ business ingress.

### 12.1 РќРѕСЂРјР°С‚РёРІРЅС‹Рµ handoff-trigger Р·РѕРЅС‹

`personal_assistant` РјРѕР¶РµС‚ Р±С‹С‚СЊ owner С‚РѕР»СЊРєРѕ standalone delegated/personal-Р·Р°РїСЂРѕСЃР°, РєРѕРіРґР° РґРѕРјРёРЅРёСЂСѓСЋС‰РµРµ РґРµР№СЃС‚РІРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РѕС‚РЅРѕСЃРёС‚СЃСЏ Рє personal coordination:

- СЃРѕР±СЂР°С‚СЊ Р»РёС‡РЅСѓСЋ СЃРІРѕРґРєСѓ РїРѕ РєР°Р»РµРЅРґР°СЂСЋ Рё Р·Р°РґР°С‡Р°Рј;
- РїРѕРґРіРѕС‚РѕРІРёС‚СЊ delegated reminder;
- РѕС„РѕСЂРјРёС‚СЊ next steps РїРѕ СѓР¶Рµ РёР·РІРµСЃС‚РЅРѕРјСѓ Р»РёС‡РЅРѕРјСѓ РєРѕРЅС‚РµРєСЃС‚Сѓ;
- РЅР°РїРѕРјРЅРёС‚СЊ РѕРіСЂР°РЅРёС‡РµРЅРёСЏ, РІСЃС‚СЂРµС‡Рё РёР»Рё availability;
- СЃРґРµР»Р°С‚СЊ read-only personal follow-up Р±РµР· Р±РёР·РЅРµСЃ-РёСЃРїРѕР»РЅРµРЅРёСЏ.

Р”Р°Р¶Рµ РІ СЌС‚РёС… СЃР»СѓС‡Р°СЏС… РґРѕ canonical enablement direct production routing РІ `personal_assistant` РѕСЃС‚Р°С‘С‚СЃСЏ Р·Р°РїСЂРµС‰С‘РЅРЅС‹Рј. РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ РґРѕР»Р¶РµРЅ С‚СЂР°РєС‚РѕРІР°С‚СЊ СЌС‚Рѕ РєР°Рє future delegated/personal path, Р° РЅРµ РєР°Рє СѓР¶Рµ РґРѕСЃС‚СѓРїРЅС‹Р№ runtime owner.

Ownership РЅРµ РґРѕР»Р¶РµРЅ РїРµСЂРµС…РѕРґРёС‚СЊ РІ `personal_assistant`, РєРѕРіРґР° РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°:

- РѕР±РЅРѕРІРёС‚СЊ CRM record, account, contact РёР»Рё interaction;
- СЃРѕР·РґР°С‚СЊ РёР»Рё РёСЃРїРѕР»РЅРёС‚СЊ РґРѕРіРѕРІРѕСЂРЅС‹Р№, invoice, payment РёР»Рё AR action;
- РІС‹РїРѕР»РЅРёС‚СЊ finance analysis, legal review, agronomy action РёР»Рё monitoring remediation;
- РѕР±СЂР°Р±РѕС‚Р°С‚СЊ communicator ingress, thread classification РёР»Рё escalation;
- РЅР°Р№С‚Рё РґРѕРєСѓРјРµРЅС‚, policy РёР»Рё corpus evidence РєР°Рє РѕСЃРЅРѕРІРЅРѕР№ СЂРµР·СѓР»СЊС‚Р°С‚.

Р–С‘СЃС‚РєРёРµ СЂР°Р·Р»РёС‡РёСЏ:

- `personal_assistant` РЅСѓР¶РµРЅ РґР»СЏ delegated summaries, reminders Рё personal coordination;
- `front_office_agent` РІР»Р°РґРµРµС‚ communicator ingress Рё РґРёР°Р»РѕРіРѕРІС‹РјРё СЌСЃРєР°Р»Р°С†РёСЏРјРё;
- РґРѕРјРµРЅРЅС‹Рµ owner-Р°РіРµРЅС‚С‹ РІР»Р°РґРµСЋС‚ business decisions Рё execution;
- `knowledge` РІР»Р°РґРµРµС‚ retrieval Рё grounding;
- `personal_assistant` РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІСЂР°С‰Р°С‚СЊСЃСЏ РІ СѓРЅРёРІРµСЂСЃР°Р»СЊРЅС‹Р№ РѕР±С…РѕРґРЅРѕР№ Р°РіРµРЅС‚ РґР»СЏ Р»СЋР±С‹С… РїРѕСЂСѓС‡РµРЅРёР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

Р”РѕРїСѓСЃС‚РёРјС‹Рµ governed handoff:

- РёР· Р»СЋР±РѕРіРѕ owner-agent, РєРѕРіРґР° РЅСѓР¶РµРЅ delegated summary РёР»Рё read-only follow-up РїРѕ СѓР¶Рµ Р·Р°РІРµСЂС€С‘РЅРЅРѕРјСѓ РґРѕРјРµРЅРЅРѕРјСѓ СЂРµР·СѓР»СЊС‚Р°С‚Сѓ;
- РёР· `front_office_agent`, РєРѕРіРґР° РёР· РІС…РѕРґСЏС‰РµРіРѕ РѕР±С‰РµРЅРёСЏ РІС‹РґРµР»РµРЅ РёРјРµРЅРЅРѕ personal/delegated Р·Р°РїСЂРѕСЃ, Р° РЅРµ business escalation;
- РёР· `knowledge`, РєРѕРіРґР° retrieval СѓР¶Рµ РЅР°Р№РґРµРЅ Рё РЅСѓР¶РµРЅ personal summary layer;
- РІ РґРѕРјРµРЅРЅРѕРіРѕ owner-agent, РєРѕРіРґР° personal discussion РїРµСЂРµС…РѕРґРёС‚ РІ business action;
- РІ `knowledge`, РєРѕРіРґР° personal request СѓРїРёСЂР°РµС‚СЃСЏ РІ retrieval, policy РёР»Рё corpus lookup.

РђРЅС‚Рё-С‚СЂРёРіРіРµСЂС‹:

- РЅР°Р»РёС‡РёРµ СЃР»РѕРІ `РЅР°РїРѕРјРЅРё`, `Р·Р°РґР°С‡Р°`, `РїР»Р°РЅ`, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРѕ СЃСѓС‚Рё РїСЂРѕСЃРёС‚ business execution;
- РЅР°Р»РёС‡РёРµ personal wording РІРЅСѓС‚СЂРё CRM, contracts, finance РёР»Рё legal Р·Р°РїСЂРѕСЃР°;
- РЅР°Р»РёС‡РёРµ РєР°Р»РµРЅРґР°СЂРЅРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р° Р±РµР· СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ personal/delegated РІРѕРїСЂРѕСЃР°;
- РЅР°Р»РёС‡РёРµ route `/dashboard/tasks` Р±РµР· СЃРјРµРЅС‹ РґРѕРјРёРЅРёСЂСѓСЋС‰РµРіРѕ РґРµР№СЃС‚РІРёСЏ;
- РЅР°Р»РёС‡РёРµ summary-РІРѕРїСЂРѕСЃР°, РєРѕРіРґР° РЅСѓР¶РµРЅ owner-result РґСЂСѓРіРѕРіРѕ РґРѕРјРµРЅР°, Р° РЅРµ personal wrapper.

Р­С‚Рё РїСЂРёР·РЅР°РєРё РЅРµ РґРѕР»Р¶РЅС‹ РїРµСЂРµРІРѕРґРёС‚СЊ ownership РІ `personal_assistant`, РµСЃР»Рё РіР»Р°РІРЅРѕРµ РґРµР№СЃС‚РІРёРµ РѕСЃС‚Р°С‘С‚СЃСЏ Сѓ РґРѕРјРµРЅРЅРѕРіРѕ owner-Р°, `front_office_agent` РёР»Рё `knowledge`.

## 13. РЎРІСЏР·Рё СЃ РґРѕРјРµРЅРЅС‹РјРё РјРѕРґСѓР»СЏРјРё

- `ProductivityToolsRegistry`
- `calendar_read_model`
- Р±СѓРґСѓС‰РёР№ `personal-ops-adapter`

## 14. Required Context Contract

РљР°Рє canonical runtime contract РЅРµ С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ.

РќР° future/template-СѓСЂРѕРІРЅРµ РґР»СЏ personal/delegated СЂР°Р·Р±РѕСЂР° РїРѕР»РµР·РЅС‹:

- user-scoped task РёР»Рё calendar context;
- availability / event summary;
- privacy and masking constraints;
- explicit delegated question РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ;
- РіСЂР°РЅРёС†Р° РјРµР¶РґСѓ personal coordination Рё business action.

## 15. Intent Catalog

### 15.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ current intent-С‹

РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… canonical runtime intent-РѕРІ СЃРµР№С‡Р°СЃ РЅРµС‚.

Р•СЃС‚СЊ С‚РѕР»СЊРєРѕ template-level semantics РґР»СЏ:

- personal summary;
- delegated reminders;
- task and calendar overview;
- next-step coordination.

### 15.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ intent-scope

Р’ РїСЂРµРґРµР»Р°С… personal_ops-domain РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ С‚Р°РєРёРµ Р±СѓРґСѓС‰РёРµ intent-С‹:

- summarize_personal_context;
- prepare_delegated_reminder;
- review_calendar_constraints;
- outline_next_steps;
- governed advisory handoff support РґР»СЏ personal/delegated follow-up.

Р­С‚Рё intent-С‹ РЅРµ РґРѕР»Р¶РЅС‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ `personal_assistant` РІ owner РґР»СЏ CRM, contracts, finance, legal, agronomy, monitoring РёР»Рё front-office actions.

## 16. Tool surface

### 16.1 РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ current tool surface

РќР° С‚РµРєСѓС‰РµРј СЌС‚Р°РїРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‚РѕР»СЊРєРѕ template-level surface:

- `ProductivityToolsRegistry`

Canonical runtime tool surface РІ `rai-chat` РїРѕРєР° РЅРµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.

### 16.2 РњР°РєСЃРёРјР°Р»СЊРЅРѕ РґРѕРїСѓСЃС‚РёРјС‹Р№ tool surface

Р’ С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё РґРѕРїСѓСЃС‚РёРјС‹ С‚РѕР»СЊРєРѕ personal/productivity-СЃРїРµС†РёС„РёС‡РЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

- calendar summary tooling;
- task prioritization tooling;
- delegated reminder tooling;
- personal context preparation tooling.

Tool surface РЅРµ РґРѕР»Р¶РµРЅ СЂР°СЃС€РёСЂСЏС‚СЊСЃСЏ РІ:

- CRM-owner tools;
- contracts execution tools;
- finance-owner tools;
- legal-owner tools;
- monitoring-owner tools;
- external write tools Р±РµР· СЏРІРЅРѕРіРѕ confirmation gate.

## 17. UI surface

- РџРѕРєР° С‚РѕР»СЊРєРѕ onboarding.
- Productized personal assistant windows РµС‰С‘ РЅРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹.

## 18. Guardrails

- `delegated_actions_require_confirmation`
- `no_unreviewed_external_writes`
- masked / privacy-safe sensitive data policy
- С‚РѕР»СЊРєРѕ delegated and read-safe path

## 19. РћСЃРЅРѕРІРЅС‹Рµ СЂРёСЃРєРё Рё failure modes

- РЎР»РёС€РєРѕРј С€РёСЂРѕРєРёР№ РґРѕСЃС‚СѓРї Рє Р»РёС‡РЅС‹Рј РґР°РЅРЅС‹Рј.
- РџРѕРґРјРµРЅР° personal assistance Р±РёР·РЅРµСЃ-ownership Р·Р°РґР°С‡Р°РјРё.
- Р›РѕР¶РЅРѕРµ РѕС‰СѓС‰РµРЅРёРµ production-ready СЃС‚Р°С‚СѓСЃР° РёР·-Р·Р° РЅР°Р»РёС‡РёСЏ template.
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ personal contour РєР°Рє РѕР±С…РѕРґРЅРѕРіРѕ РїСѓС‚Рё РІРѕРєСЂСѓРі domain guardrails.

## 20. РўСЂРµР±РѕРІР°РЅРёСЏ Рє С‚РµСЃС‚Р°Рј

- Template validation.
- Governance validation.
- Privacy and masking validation.
- РџРѕСЃР»Рµ enablement: delegated action, confirmation Рё routing regression tests.

## 21. РљСЂРёС‚РµСЂРёРё production-ready

- Canonical runtime family.
- Р›РёС‡РЅС‹Р№ context contract.
- Privacy-safe tool surface.
- РџРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РЅР° РІСЃРµ РІРЅРµС€РЅРёРµ actions.
- Smoke-СЃС†РµРЅР°СЂРёРё РїРѕ summaries, reminders Рё delegated coordination.

## 22. РЎРІСЏР·Р°РЅРЅС‹Рµ С„Р°Р№Р»С‹ Рё С‚РѕС‡РєРё РєРѕРґР°

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)

