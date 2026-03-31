---
id: DOC-OPS-OSS-LICENSE-IP-REGISTER-20260328
layer: Operations
type: Report
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-OPS-OSS-LICENSE-IP-REGISTER-20260328
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: package.json;pnpm-lock.yaml;scripts/generate-license-inventory.cjs;scripts/generate-notice-bundle.cjs;var/security/license-inventory.json;var/security/notice-bundle.json;var/security/notice-bundle.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
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

## Register

| Вопрос | Текущий статус | Evidence |
|---|---|---|
| Есть ли машинно-воспроизводимый OSS inventory | `да` | `scripts/generate-license-inventory.cjs`, `var/security/license-inventory.json` |
| Есть ли полный compatibility review | `нет` | inventory считает лицензии, но не делает legal interpretation |
| Есть ли notice / attribution packet | `assembled working bundle` | [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md), [PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md), [notice-bundle.md](/root/RAI_EP/var/security/notice-bundle.md) |
| Есть ли root license strategy для first-party кода | `partial` | root package и `eslint-plugin-tenant-security` уже `UNLICENSED`, strategy описана в [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md) |
| Есть ли chain-of-title по first-party IP | `не подтверждено` | договорной/legal evidence вне репозитория не найден |
| Есть ли packet для реестра российского ПО | `нет` | prerequisites не собраны |

## Красные зоны
1. `31` пакета всё ещё идут как `UNKNOWN`, но это уже не first-party ambiguity, а узкий optional/toolchain хвост.
2. Нет final legal sign-off по compatibility review и assembled notice bundle для внешней дистрибуции beyond `Tier 1 Linux self-host`.
3. Нет chain-of-title пакета по ПО и БД.

## Прямой следующий operational шаг
Зафиксировать final legal classification для `esbuild/turbo` toolchain companions, удержать `fsevents` вне Linux `Tier 1` perimeter, затем привязать assembled notice bundle к procurement/distribution decision и закрыть chain-of-title pack.

Эффект:
- legal/compliance verdict перестанет провисать на OSS/IP контуре;
- станет возможной честная оценка readiness для реестра российского ПО и enterprise procurement.
