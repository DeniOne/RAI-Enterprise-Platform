---
id: DOC-OPS-OSS-LICENSE-IP-REGISTER-20260328
layer: Operations
type: Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-OSS-LICENSE-IP-REGISTER-20260328
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: package.json;pnpm-lock.yaml;scripts/generate-license-inventory.cjs;var/security/license-inventory.json;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
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
  - `total packages = 189`
  - `unknown licenses = 33`
  - крупнейшие классы: `MIT = 136`, `Apache-2.0 = 8`, `ISC = 4`, `BSD-2-Clause = 4`
- Корневого `LICENSE`/`COPYING` файла в репозитории не найдено.
- Репозиторий и root package помечены как `private`, но это не заменяет legal chain-of-title.

## Register

| Вопрос | Текущий статус | Evidence |
|---|---|---|
| Есть ли машинно-воспроизводимый OSS inventory | `да` | `scripts/generate-license-inventory.cjs`, `var/security/license-inventory.json` |
| Есть ли полный compatibility review | `нет` | inventory считает лицензии, но не делает legal interpretation |
| Есть ли notice / attribution packet | `нет` | в repo не обнаружен отдельный NOTICE/license obligations pack |
| Есть ли root license strategy для first-party кода | `нет` | `LICENSE` file отсутствует |
| Есть ли chain-of-title по first-party IP | `не подтверждено` | договорной/legal evidence вне репозитория не найден |
| Есть ли packet для реестра российского ПО | `нет` | prerequisites не собраны |

## Красные зоны
1. `33` пакета идут как `UNKNOWN`; это требует ручной legal triage, а не только технического списка.
2. Нет корневой лицензии/правового режима first-party кода.
3. Нет chain-of-title пакета по ПО и БД.

## Прямой следующий operational шаг
Провести manual legal review по `unknown licenses`, определить first-party licensing strategy и собрать chain-of-title pack.

Эффект:
- legal/compliance verdict перестанет провисать на OSS/IP контуре;
- станет возможной честная оценка readiness для реестра российского ПО и enterprise procurement.
