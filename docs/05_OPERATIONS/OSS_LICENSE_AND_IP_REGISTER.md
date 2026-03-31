---
id: DOC-OPS-OSS-LICENSE-IP-REGISTER-20260328
layer: Operations
type: Report
status: approved
version: 1.4.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-OPS-OSS-LICENSE-IP-REGISTER-20260328
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: package.json;pnpm-lock.yaml;scripts/generate-license-inventory.cjs;scripts/generate-notice-bundle.cjs;var/security/license-inventory.json;var/security/notice-bundle.json;var/security/notice-bundle.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# OSS LICENSE AND IP REGISTER

## CLAIM
id: CLAIM-OPS-OSS-LICENSE-IP-REGISTER-20260328
status: asserted
verified_by: code
last_verified: 2026-03-28

## Что подтверждено локально
- Добавлен воспроизводимый inventory path: `pnpm security:licenses`.
- Последний локальный baseline:
  - `total packages = 159`
  - `unknown licenses = 31`
  - `UNLICENSED = 2`
  - крупнейшие классы: `MIT = 107`, `Apache-2.0 = 8`, `ISC = 4`, `BSD-2-Clause = 4`
- Корневого `LICENSE`/`COPYING` файла в репозитории не найдено.
- Репозиторий и root package помечены как `private`, но это не заменяет legal chain-of-title.
- Root package и `packages/eslint-plugin-tenant-security` теперь явно помечены как `UNLICENSED`; это снимает first-party ambiguity внутри inventory, но не заменяет `ELP-20260328-09`.
- Published `Tier 1` decision уже разрешает трактовать remaining `UNKNOWN` perimeter так:
  - `esbuild` companions -> `ALLOW_TIER1_CONDITIONAL`
  - `turbo` companions -> `ALLOW_TIER1_CONDITIONAL`
  - `fsevents` -> `OUT_OF_SCOPE_TIER1_LINUX`
  - это решение ограничено Linux `self-host / localized MVP pilot` и не является universal legal verdict для внешней cross-platform дистрибуции.

## Register

| Вопрос | Текущий статус | Evidence |
|---|---|---|
| Есть ли машинно-воспроизводимый OSS inventory | `да` | `scripts/generate-license-inventory.cjs`, `var/security/license-inventory.json` |
| Есть ли полный compatibility review | `нет` | inventory считает лицензии, но не делает legal interpretation |
| Есть ли notice / attribution packet | `assembled working bundle` | [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md), [PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md), [notice-bundle.md](/root/RAI_EP/var/security/notice-bundle.md) |
| Есть ли root license strategy для first-party кода | `tier1 baseline recorded` | root package и `eslint-plugin-tenant-security` уже `UNLICENSED`, strategy описана в [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md), handoff perimeter зафиксирован в [PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md) |
| Есть ли chain-of-title по first-party IP | `не подтверждено` | договорной/legal evidence вне репозитория не найден |
| Есть ли packet для реестра российского ПО | `нет` | prerequisites не собраны |

## Красные зоны
1. `31` пакета всё ещё идут как `UNKNOWN` в inventory, но для `Tier 1 Linux self-host` они уже не являются неразобранным периметром: manual decision опубликован отдельно; красной зоной остаётся wider distribution verdict.
2. Нет final legal sign-off по compatibility review и assembled notice bundle для внешней дистрибуции beyond `Tier 1 Linux self-host`.
3. Нет chain-of-title пакета по ПО и БД.

## Прямой следующий operational шаг
Закрыть `ELP-20260328-09` и chain-of-title pack поверх уже опубликованного `Tier 1 procurement/distribution decision`.

Эффект:
- legal/compliance verdict перестанет провисать на OSS/IP контуре;
- станет возможной честная оценка readiness для реестра российского ПО и enterprise procurement.
