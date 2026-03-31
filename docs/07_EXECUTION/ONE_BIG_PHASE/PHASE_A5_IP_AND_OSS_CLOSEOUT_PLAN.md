---
id: DOC-EXE-ONE-BIG-PHASE-A5-IP-OSS-CLOSEOUT-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-IP-OSS-CLOSEOUT-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md
---
# PHASE A5 IP AND OSS CLOSEOUT PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-IP-OSS-CLOSEOUT-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A5` из общей строки “IP / OSS / chain-of-title” в прямой execution-пакет по лицензиям, цепочке прав и коммерческой защищённости продукта.

Для первого рабочего прохода использовать также [PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md).

## 1. Текущее состояние `A5`

На текущий момент подтверждено:

- машинно-воспроизводимый `OSS` inventory уже есть через `pnpm security:licenses`;
- зафиксирован локальный baseline:
  - `189 packages`
  - `33 unknown licenses`
- существует активный [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md);
- опубликован [PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md) как working triage register по `33 UNKNOWN`;
- опубликован [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md) как working notice perimeter;
- опубликован [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md) как conservative first-party licensing baseline;
- внешний legal lifecycle уже умеет вести `ELP-20260328-09` и `ELP-20260328-10`;
- RF review прямо фиксирует, что `chain-of-title` и `OSS unknown-license triage` остаются незакрытым стоп-фактором.

Одновременно остаются реальные незакрытые вопросы:

- `33 unknown licenses` не прошли final legal triage;
- notice/obligations packet пока рабочий, а не финально принятый legal bundle;
- не подтверждена непрерывная цепочка прав на first-party code и database rights;
- внешний pilot нельзя считать безопасным при спорных правах на ПО и БД.

## 2. Что именно нужно закрыть

### `A5.1` Unknown-license triage

Сделать:

- выгрузить актуальный список `UNKNOWN` пакетов из `var/security/license-inventory.json`;
- отделить допустимые, спорные и требующие замены зависимости;
- зафиксировать итог triage в активном register;
- определить, какие пакеты блокируют внешний pilot и дистрибуцию.

Сильное доказательство:

- актуализированный [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md) с ручным legal triage;
- закрытый `UNKNOWN` perimeter или явный replacement-plan для проблемных пакетов.

Текущий execution-артефакт:

- [PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md)

### `A5.2` Notice / obligations packet

Сделать:

- определить, какие notice/attribution obligations реально возникают по текущему dependency set;
- отделить обязательные действия от опциональных;
- зафиксировать, что должно идти в дистрибутив, self-host packet или procurement pack.

Сильное доказательство:

- оформленный notice/obligations packet, привязанный к финальному inventory и policy по дистрибуции.

Текущий execution-артефакт:

- [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md)

### `A5.3` Chain-of-title

Сделать:

- принять внешний пакет `ELP-20260328-09`;
- подтвердить права на first-party code, contractor contributions и database rights;
- связать принятый evidence с register и legal lifecycle.

Сильное доказательство:

- accepted `ELP-20260328-09`;
- обновлённый [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md) со статусом, который уже не опирается на предположения.

### `A5.4` First-party licensing strategy

Сделать:

- определить правовой режим first-party кода;
- решить, нужен ли root `LICENSE`/policy packet для дистрибуции и procurement;
- не смешивать private repo status с реальной licensing strategy.

Сильное доказательство:

- зафиксированная first-party licensing strategy в active ops/legal packet.

Текущий execution-артефакт:

- [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md)

## 3. Режим исполнения `A5`

Работать в таком порядке:

1. Сначала оттриажить `unknown licenses`.
2. Затем собрать notice/obligations packet.
3. Затем принять `ELP-20260328-09`.
4. Затем зафиксировать first-party licensing strategy.

Нельзя:

- считать `private`-флаг заменой цепочке прав;
- считать inventory достаточным без ручного legal review;
- двигаться к внешнему pilot, пока права и license-risk остаются спорными.

## 4. Что обновлять в execution-пакете

После каждого движения по `A5` обновлять:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- при необходимости [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)
- [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md)
- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md), если меняется форма исполнения трека

Board должен меняться так:

- `open` -> `in_progress`, когда начат реальный triage по `UNKNOWN` пакетам или собран obligations packet;
- `waiting_external` -> `in_progress`, когда по `ELP-20260328-09` появился реальный intake;
- `guard_active` остаётся запретом на внешний pilot до полного closeout;
- `done` допустим только после внешне подтверждённого `chain-of-title` и закрытого OSS-risk perimeter.

## 5. Проверки `A5`

Обязательные проверяемые артефакты:

- `pnpm security:licenses`
- `var/security/license-inventory.json`
- [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md)
- `ELP-20260328-09` status
- `ELP-20260328-10` status
- [RF_COMPLIANCE_REVIEW_2026-03-28.md](/root/RAI_EP/docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md)

Смотреть нужно не просто на наличие файлов, а на то:

- разобраны ли `UNKNOWN` лицензии;
- определены ли notice obligations;
- подтверждены ли права на код и БД;
- исчез ли запрет на внешний pilot из-за спорного IP-периметра.

## 6. Условие выхода для `A5`

Трек `A5` считается закрытым только когда одновременно выполняются условия:

- строка `A-2.6.1` уходит из `open`;
- строка `A-2.6.2` уходит из `waiting_external`;
- строка `A-2.6.3` перестаёт быть активным release-stop guard;
- `UNKNOWN` licenses закрыты triage-решением или replacement-plan;
- accepted `ELP-20260328-09` подтверждает chain-of-title;
- `IP / OSS` перестаёт удерживать внешний pilot как красный коммерческий и юридический риск.
