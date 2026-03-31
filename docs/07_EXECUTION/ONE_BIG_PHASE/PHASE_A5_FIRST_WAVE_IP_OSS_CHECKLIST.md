---
id: DOC-EXE-ONE-BIG-PHASE-A5-FIRST-WAVE-IP-OSS-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.3.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-FIRST-WAVE-IP-OSS-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;var/security/license-inventory.json;var/compliance/phase-a5-chain-of-title-source-register.json;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# PHASE A5 FIRST WAVE IP OSS CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-FIRST-WAVE-IP-OSS-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы начать `A5` не с общих слов про IP, а с текущего воспроизводимого baseline.

## 1. Текущий baseline

На `2026-03-31` подтверждено:

- `pnpm security:licenses` -> `total_packages=159`, `unknown_licenses=31`
- `pnpm security:notices` -> `families=6`, `conditional_unknowns=30`
- `OSS_LICENSE_AND_IP_REGISTER` уже существует
- `ELP-20260328-09` и `ELP-20260328-10` всё ещё в `requested`

Это означает:

- inventory уже есть;
- проблема не в отсутствии списка, а в отсутствии legal triage и chain-of-title evidence.

## 2. Что делать первой волной

### Шаг 1. Оттриажить `31 unknown licenses`

Нужно:

- выгрузить список `UNKNOWN` из `var/security/license-inventory.json`;
- разделить их на:
  - допустимые
  - спорные
  - требующие замены

Текущий статус:

- working register уже создан в [PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md);
- отдельное `Tier 1` решение уже создано в [PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md);
- первая волна `A5.1` для Linux `Tier 1 self-host` теперь считается закрытой.

### Шаг 2. Собрать notice/obligations packet

Нужно:

- понять, какие notice obligations реально возникают;
- отделить обязательное для дистрибуции от необязательного.

Текущий статус:

- working packet уже создан в [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md);
- assembled bundle уже выпущен в [PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md);
- `A5.2` закрыта для `Tier 1` assembled baseline, но не для universal legal distribution verdict.

### Шаг 3. Подготовить `ELP-20260328-09`

Нужно:

- выпустить repo-derived source register через `pnpm phase:a5:chain-of-title`;
- открыть draft по `ELP-09`;
- определить, какие employment/contractor/IP transfer документы реально нужны;
- не ждать “потом”, а сразу собрать список missing evidence.

### Шаг 4. Зафиксировать first-party licensing strategy

Нужно:

- определить, как юридически трактуется first-party код;
- не считать `private repo` достаточной licensing strategy.

Текущий статус:

- conservative baseline уже создан в [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md);
- первая волна для `A5.4` теперь продолжается от явной strategy, а не от неформального предположения “repo private = всё нормально”.

## 3. Что считать реальным прогрессом

Реальный прогресс:

- `33 unknown licenses` начинают уменьшаться как открытый perimeter;
- появляется отдельный triage-результат;
- `ELP-09` перестаёт быть “просто requested без подготовки”.

Не считать прогрессом:

- просто повторный запуск `pnpm security:licenses`;
- новый markdown без triage-решения;
- общую уверенность “права наверно наши”.

## 4. Условие завершения первой волны `A5`

Первая волна считается завершённой только когда:

- `unknown licenses` разбиты по triage-классам и опубликовано `Tier 1` решение;
- notice/obligations perimeter не только описан, но и assembled в generated bundle;
- по `ELP-09` понятен точный пакет внешних документов;
- в board `A-2.6.1` и `A-2.6.2` переходят из чистого `open / waiting_external` в рабочий execution-state.
