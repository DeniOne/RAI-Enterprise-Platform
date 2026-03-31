---
id: DOC-EXE-ONE-BIG-PHASE-A2-TIER1-TOOLCHAIN-DECISION-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-TIER1-TOOLCHAIN-DECISION-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md;var/security/security-audit-summary.json;package.json;pnpm-lock.yaml
---
# PHASE A2 TIER1 TOOLCHAIN DECISION

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-TIER1-TOOLCHAIN-DECISION-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы не держать `A2` в подвешенном состоянии после remediation. Он фиксирует, как именно трактовать остаточный `high=5` для `Tier 1 self-host / localized MVP pilot`.

## 1. Вопрос решения

Нужно было принять управленческое решение:

- считать ли остаточный `high=5` стоп-блокером для `Tier 1`;
- или считать его узким toolchain-хвостом, который не блокирует ближайший MVP-pilot, но остаётся обязательным follow-up до более широких release tiers.

## 2. Подтверждённый baseline

На момент решения подтверждено:

- `pnpm security:audit:ci` -> `critical=0`, `high=5`
- `pnpm gate:secrets` -> `tracked_findings=0`
- `pnpm gate:invariants` -> `violations=0`
- `pnpm --filter api build` -> `PASS`
- `pnpm --filter web build` -> `PASS`

Остаточный `high=5` ограничен только такими путями:

- `apps/api -> @typescript-eslint/typescript-estree@6.21.0 -> minimatch@9.0.3`
- `apps/api` и `apps/telegram-bot` -> `@nestjs/cli -> @angular-devkit/core@17.3.11/19.2.19 -> picomatch@4.0.1/4.0.2`

То есть остаток не подтверждён как runtime-perimeter `Tier 1`, а сосредоточен в dev-toolchain и CLI-стеке.

## 3. Решение

Принято следующее решение:

- для `Tier 1 self-host / localized MVP pilot` остаточный `high=5` считается допустимым как `non-runtime toolchain debt`;
- этот остаток не считается самостоятельным release-stop blocker для `Tier 1`;
- это решение не распространяется на `Tier 2 controlled operational pilot` и тем более на `Tier 3 external production with ПДн citizens of RF`;
- до перехода выше `Tier 1` toolchain-tail должен быть либо устранён, либо пересмотрен отдельным security-решением.

## 4. Границы допустимости

Это решение действительно только пока одновременно выполняются условия:

- `critical=0` удерживается;
- новых runtime-impact `high` не появляется;
- `pnpm gate:secrets` остаётся зелёным по tracked perimeter;
- `pnpm gate:invariants` остаётся зелёным;
- `api` и `web` продолжают собираться на текущем dependency baseline;
- остаточный риск остаётся ограниченным dev-toolchain, а не уходит в runtime.

Если хотя бы одно из этих условий нарушается, решение перестаёт действовать и `A2` возвращается в red-review режим.

## 5. Что это меняет в `Phase A`

После этого решения:

- строка `A-2.3.1` в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) может считаться закрытой для `Tier 1`;
- `A2` в целом ещё не закрыта, потому что остаются:
  - historical key / rotation debt;
  - внешний access-governance evidence;
  - обязательный follow-up по toolchain перед движением в `Tier 2+`.

Иными словами:

- dependency-risk для ближайшего `Tier 1` больше не является главным стоп-блокером;
- security-track теперь упирается не в runtime advisories, а в governance и historical debt.

## 6. Что делать дальше

Следующий порядок действий после этого решения:

1. Держать `pnpm security:audit:ci`, `pnpm gate:secrets`, `pnpm gate:invariants` как обязательный baseline.
2. Закрывать historical key / rotation debt.
3. Собирать внешний access-governance evidence.
4. Перед движением к `Tier 2` отдельно вернуться к CLI/devkit refresh и снять residual toolchain-tail.

## 7. Что нельзя делать

Нельзя:

- выдавать это решение за полный security closeout;
- использовать его как основание для `Tier 2` или `Tier 3`;
- игнорировать historical secret debt только потому, что runtime advisories уже сняты;
- считать policy и board достаточными без регулярного пересчёта `security:audit:ci`.
