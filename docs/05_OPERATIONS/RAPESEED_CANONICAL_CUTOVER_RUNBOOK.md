---
id: DOC-OPS-RAPESEED-CANONICAL-CUTOVER-RUNBOOK-20260401
layer: Operations
type: Runbook
status: approved
version: 1.1.10
owners: ["@techlead"]
last_updated: 2026-04-02
claim_id: CLAIM-OPS-RAPESEED-CANONICAL-CUTOVER-RUNBOOK-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-02
evidence_refs:
  - docs/01_ARCHITECTURE/RAPESEED_ENGINE_INTEGRATION_MAP.md
  - docs/01_ARCHITECTURE/RAPESEED_TECHMAP_GENERATION_MIGRATION_PLAN.md
  - docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md
  - apps/api/src/modules/tech-map/tech-map.controller.ts
  - apps/api/src/modules/tech-map/tech-map.service.ts
  - scripts/techmap-rapeseed-cutover.cjs
  - scripts/techmap-rapeseed-cutover-matrix.cjs
  - scripts/techmap-rapeseed-cutover-wave.cjs
  - apps/api/src/modules/tech-map/tech-map.service.spec.ts
  - apps/api/src/modules/tech-map/generation/tech-map-generation-orchestrator.service.spec.ts
  - apps/web/app/consulting/dashboard/page.tsx
  - apps/web/app/consulting/techmaps/page.tsx
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-e.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-f.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-g.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-h.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-i.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-j.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-k.json
  - var/ops/techmap-rapeseed-cutover-matrix-operational.json
---

# Runbook переключения rapeseed TechMap на canonical generation

## CLAIM
id: CLAIM-OPS-RAPESEED-CANONICAL-CUTOVER-RUNBOOK-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-02

## 1. Назначение

Этот runbook задаёт обязательный operational порядок для переключения rapeseed `TechMap` с `legacy_blueprint` на canonical generation path без нарушения runtime/governance-инвариантов.

Документ закрывает финальный handoff между:

- кодовым readiness gate;
- rollout observability;
- fallback и parity incident-контуром;
- реальным tenant-level cutover и rollback.

### Текущий статус handoff

- `technical implementation complete`
- `live validation continues`

Практический смысл:

- engineering-контур migration завершён и не требует дальнейшей обязательной доработки для перехода в боевую валидацию;
- этот runbook теперь описывает уже не незавершённую реализацию, а порядок живого подтверждения и расширения rollout scope;
- новые pilot wave после этого считаются operational validation, а не условием завершения coding sprint.

## 2. Обязательные источники истины перед переключением

Перед любым cutover оператор обязан использовать только следующие read-path:

| Источник | Назначение | Где читать |
|---|---|---|
| `generation summary` | Проверка split по strategy, fallback, parity severity и version pinning coverage | `GET /tech-map/generation-rollout/summary` |
| `generation readiness` | Финальный вердикт `BLOCKED/WARN/PASS`, release gates, blockers и warnings | `GET /tech-map/generation-rollout/readiness` |
| `cutover packet` | Готовые `feature flags`, `releaseCommand`, `rollbackCommand`, checklist | `GET /tech-map/generation-rollout/cutover-packet` |
| `techmap explainability` | Проверка per-map generation metadata, parity, incidents и evidence semantics | `GET /tech-map/:id/explainability` |

Запрещено переключать tenant по устным договорённостям, по одному экрану UI или по ручной интерпретации логов без сверки с этими endpoint.

## 2.1. Исполняемый CLI-вход

Для воспроизводимого исполнения cutover использовать единый CLI:

```bash
pnpm techmap:rapeseed:cutover --action=prepare --company-id=<companyId>
pnpm techmap:rapeseed:cutover --action=apply --company-id=<companyId>
pnpm techmap:rapeseed:cutover --action=verify --company-id=<companyId>
pnpm techmap:rapeseed:cutover --action=rollback --company-id=<companyId>
```

CLI:

- читает `summary`, `readiness` и `cutover-packet` из API;
- сохраняет operational packet в `var/ops/`;
- при `apply` и `rollback` обновляет `TECHMAP_RAPESEED_CANONICAL_MODE` и `TECHMAP_RAPESEED_CANONICAL_COMPANIES` в `.env`;
- создаёт backup `.env.rapeseed-cutover.bak` перед правкой.
- при использовании `--restart-runtime` дополнительно выполняет `pm2 restart rai-api --update-env` с явной передачей rapeseed feature flags в runtime `process.env`.

CLI не заменяет smoke generation и post-cutover verification, а стандартизирует применение feature flags и фиксацию operational evidence.

Для serial rollout использовать также matrix-команду:

```bash
pnpm techmap:rapeseed:cutover:matrix
pnpm techmap:rapeseed:cutover:matrix --scope=all
```

Matrix-скрипт по умолчанию строит `operational`-срез и исключает `stress_test` tenant-ы из боевого cutover scope.

Для пакетного serial rollout использовать wave-команду:

```bash
pnpm techmap:rapeseed:cutover:wave \
  --wave-id=<waveId> \
  --tenant='company-id|Company Name|Region Name' \
  --tenant='company-id-2|Company Name 2|Region Name 2'
```

Wave-скрипт:

- non-destructive onboard-ит новые operational tenant-ы через единый bootstrap;
- аддитивно расширяет `TECHMAP_RAPESEED_CANONICAL_COMPANIES`;
- перезапускает `rai-api` с явной передачей rapeseed flags в runtime `process.env`;
- выполняет smoke generation, `prepare`, `apply`, `verify` по каждому tenant-у;
- пересобирает operational и full matrix;
- сохраняет единый wave packet в `var/ops/`.

Operational правило:

- после любого `pm2 restart` matrix или readiness нельзя читать мгновенно;
- сначала должен пройти `health-check` `GET /api/health`, затем уже выполняются `summary`, `readiness`, `cutover-packet` и matrix;
- для batch-wave это требование уже встроено в script retry-контур и не требует ручного повторения.

## 2.2. Tenant Scope Policy

Перед любым серийным rollout оператор обязан различать тип tenant-а:

| companyType | Назначение | Cutover policy |
|---|---|---|
| `demo_root` | demo/root tenant, используемый как canonical canary | допускается в operational matrix |
| `operational_tenant` | реальный tenant scope без stress-маркеров | допускается в operational matrix |
| `stress_test` | concurrency/stress fixture, созданный тестами | исключается из operational matrix по умолчанию |

Жёсткое правило:

- `STRESS_*` tenant-ы нельзя трактовать как клиентский rollout scope;
- они допускаются только в `--scope=all` как диагностический слой данных;
- боевой cutover decision принимается только по `operational` matrix.

## 2.3. Актуальный operational scope на 2026-04-02

Подтверждённый серийный rollout сейчас уже находится в live-состоянии `23 PASS / 0 BLOCKED` для `scope=operational`.

В этот scope входят:

- `default-rai-company`
- `pilot-rapeseed-bryansk-company`
- `pilot-rapeseed-kaluga-company`
- `pilot-rapeseed-kostroma-company`
- `pilot-rapeseed-kuban-company`
- `pilot-rapeseed-don-company`
- `pilot-rapeseed-volga-company`
- `pilot-rapeseed-stavropol-company`
- `pilot-rapeseed-rostov-company`
- `pilot-rapeseed-belgorod-company`
- `pilot-rapeseed-kursk-company`
- `pilot-rapeseed-orenburg-company`
- `pilot-rapeseed-samara-company`
- `pilot-rapeseed-saratov-company`
- `pilot-rapeseed-tambov-company`
- `pilot-rapeseed-ulyanovsk-company`
- `pilot-rapeseed-voronezh-company`
- `pilot-rapeseed-lipetsk-company`
- `pilot-rapeseed-penza-company`
- `pilot-rapeseed-tula-company`
- `pilot-rapeseed-ryazan-company`
- `pilot-rapeseed-vladimir-company`
- `pilot-rapeseed-yaroslavl-company`

Operational смысл этого состояния:

- batch-wave и serial cutover уже доказаны не на одном canary, а на устойчивом наборе non-stress tenant-ов;
- `STRESS_*` tenant-ы остаются только диагностическим слоем `scope=all` и не участвуют в боевом verdict;
- дальнейшее расширение operational scope выполняется через тот же воспроизводимый `wave`-контур без смены архитектуры cutover.

## 3. Preconditions

Cutover разрешён только если одновременно выполнены все условия:

- `generation readiness` возвращает `verdict = PASS`;
- `canEnableCanonicalDefault = true`;
- нет активных persisted incidents класса `TECHMAP_CANONICAL_PARITY_BLOCKED`;
- нет активных persisted incidents класса `TECHMAP_ROLLOUT_BLOCKING_PARITY`;
- нет повторяющегося fallback-паттерна `TECHMAP_ROLLOUT_FALLBACK_PERSISTING`;
- `shadowParitySummary.p0` по целевому scope равно `0`;
- version pinning coverage для новых rapeseed карт не ниже ожидаемого operational порога команды;
- explainability trace и `generationMetadata` читаются на техкарте без пропусков.

Если хотя бы одно условие не выполнено, переключение запрещено и tenant остаётся на текущем rollout mode.

## 4. Release gates

Перед включением canonical default оператор обязан вручную подтвердить следующий чеклист:

| Gate | Проверка | Ожидаемый результат |
|---|---|---|
| `G1` | `CropForm` и `canonicalBranch` заполнены у свежих rapeseed карт | Нет пустых branch identity на новых картах |
| `G2` | `generationMetadata` содержит strategy и version pinning | Есть `generationStrategy`, `schemaVersion`, `ruleRegistryVersion`, `ontologyVersion`, `generationTraceId` |
| `G3` | `shadow parity` не содержит `P0` | Блокирующие drift-сигналы отсутствуют |
| `G4` | Fallback не стал повторяющимся operational режимом | Нет active incident по persisting fallback |
| `G5` | Explainability открывается в UI | На техкарте видны generation trace, incidents, control-point outcomes и evidence semantics |
| `G6` | Execution loop не сломан | `control point -> recommendation -> decision gate -> change order/evidence` читается и работает |
| `G7` | Rollback packet сформирован заранее | `rollbackCommand` и rollback checklist доступны до релиза |

## 5. Порядок включения

### 5.1. Подготовка

1. Получить `generation summary` для целевого `companyId`.
2. Получить `generation readiness` для того же `companyId`.
3. Получить `cutover packet` и сохранить его как operational evidence релиза.
4. Сверить `currentFeatureFlags` и `recommendedFeatureFlags`.
5. Подтвердить, что оператор понимает текущий `rolloutMode`, список warnings и rollback-последовательность.

### 5.2. Переключение

1. Выполнить `releaseCommand` из `cutover packet` без ручного редактирования параметров.
2. Убедиться, что `feature flags` действительно изменились на рекомендуемое состояние.
3. Сгенерировать smoke rapeseed `TechMap` в tenant scope после переключения.
4. Открыть свежую карту и проверить:
   - `generationStrategy = canonical_schema`;
   - присутствует `CropForm`;
   - `generationMetadata` version-pinned;
   - explainability trace читается;
   - fallback не использован без явной причины.

### 5.3. Post-cutover verification

После smoke generation оператор обязан перепроверить:

- `generation summary`;
- `generation readiness`;
- отсутствие новых blocker incidents;
- отсутствие новых `P0` parity diff;
- отсутствие деградации `version pinning coverage`.

Если после включения readiness перестал быть `PASS`, cutover считается незавершённым и запускается rollback.

## 6. Smoke сценарий после включения

Минимальный smoke сценарий должен доказать, что canonical loop замкнут до runtime:

1. Сгенерировать новую rapeseed техкарту в целевом tenant scope.
2. Проверить в техкарте:
   - `cropType = RAPESEED`;
   - `cropForm` выбран;
   - `canonicalBranch` сохранён;
   - version pinning заполнен.
3. Проверить explainability:
   - доступен `GenerationExplanationTrace`;
   - доступен `FieldAdmissionResult`;
   - доступны parity/fallback/incident summary.
4. Проверить execution path:
   - `ControlPoint` доступен;
   - `Recommendation` и `DecisionGate` видимы;
   - evidence semantics читаются как `artifact` против `intermediate_route`.

## 7. Порядок rollback

Rollback обязателен при любом из следующих сигналов:

- readiness вернулся в `BLOCKED`;
- появился новый `P0` parity diff;
- canonical generation перешёл в повторяющийся fallback;
- explainability или version pinning перестали писаться;
- smoke generation не проходит базовый runtime/governance loop.

Порядок rollback:

1. Выполнить `rollbackCommand` из `cutover packet`.
2. Проверить, что `feature flags` вернулись к предыдущему состоянию.
3. Сгенерировать контрольную карту в fallback-режиме.
4. Убедиться, что новые blocker incidents больше не появляются.
5. Зафиксировать причину rollback в operational журнале команды.

## 8. Evidence для cutover

Для каждого tenant-level cutover нужно сохранить:

- снимок `generation summary`;
- снимок `generation readiness`;
- полный `cutover packet`;
- идентификатор smoke `TechMap`;
- итоговый статус `PASS` или rollback;
- список incidents, если они возникли.

Эти артефакты составляют минимальный operational evidence пакет переключения.

## 9. Роли и ответственность

| Роль | Ответственность |
|---|---|
| `@techlead` | Подтверждает readiness, release gates и факт допуска переключения |
| Backend owner | Проверяет endpoints, parity, fallback, incidents и rollback packet |
| Product/operations owner | Проверяет UI explainability и рабочий сценарий на smoke техкарте |

## 10. Критерий завершения cutover

Tenant считается переведённым на canonical default только если:

- `releaseCommand` выполнен;
- smoke generation прошёл;
- readiness остался в `PASS`;
- новые карты создаются через `canonical_schema`;
- persisted incidents не показывают blocker/fallback drift;
- rollback packet сохранён и готов к немедленному применению.

До выполнения всех условий tenant считается находящимся в переходном rollout состоянии.
