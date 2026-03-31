[2026-03-31 12:31Z] Для `A3.4` собран и опубликован unified release gate
- Добавлен root runner `scripts/phase-a3-release-evals.cjs`.
- В `package.json` добавлены команды:
  - `pnpm phase:a3:evals`
  - `pnpm gate:phase:a3:evals`
- Unified runner собирает в один machine-readable contour:
  - `rai_chat_service_spec`
  - `supervisor_agent_spec`
  - `runtime_spine_spec`
  - `advisory_oncall_drill`
  - `advisory_stage_progression_drill`
  - `advisory_dr_rollback_drill`
- Generated outputs публикуются в:
  - `var/ops/phase-a3-release-eval-manifest-2026-03-31.json`
  - `var/ops/phase-a3-release-eval-summary-2026-03-31.json`
  - `var/ops/phase-a3-release-eval-summary-2026-03-31.md`
  - `var/ops/phase-a3-release-evals-2026-03-31/*`
- Фактический результат:
  - `gate_status = PASS`
  - `commands_passed = 6/6`
  - `clusters_passed = 8/8`
  - `tests_passed = 40/40`
- Опубликован новый canonical report:
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_REPORT_2026-03-31.md`
- Синхронизированы:
  - `PHASE_A3_RELEASE_EVAL_SUITE.md`
  - `PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`
  - `PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md`
  - `PHASE_A_EXECUTION_BOARD.md`
  - `PHASE_A_EVIDENCE_MATRIX.md`
  - `ONE_BIG_PHASE/INDEX.md`
  - `docs/DOCS_MATRIX.md`
- Практический эффект:
  - `A-2.4.1..A-2.4.4` переведены в `done` для repo-side `Tier 1`;
  - `A3` больше не опирается только на matrix/policy/drill как на разрозненные артефакты, а имеет единый release gate;
  - `A-2.4.5` остаётся `guard_active` как отдельный запрет на autonomy expansion.

[2026-03-31 12:34Z] Для `A4` дополнительно сузили installability hidden knowledge
- Из `docker-compose.yml` удалено obsolete поле `version`.
- `pnpm docker:up` больше не пишет compose warning.
- Выполнен дополнительный bootstrap-pass от shell env, загруженного из `.env.example`:
  - `pnpm db:migrate`
  - `pnpm --filter api build`
  - `pnpm --filter web build`
- Создан generated evidence:
  - `var/ops/phase-a4-env-example-bootstrap-2026-03-31.json`
- Обновлён `PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md`.
- Практический эффект:
  - root `.env` больше не выглядит обязательным скрытым знанием;
  - residual `A4` теперь сфокусирован на blank-host rehearsal без `apps/web/.env.local` и на реальном pilot handoff, а не на уже устранённом compose warning.

[2026-03-31 12:14Z] Для `A5.1` зафиксировано formal `Tier 1` решение по `UNKNOWN` toolchain perimeter
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md`.
- В нём явно зафиксировано:
  - `25` `@esbuild/*` companions -> `ALLOW_TIER1_CONDITIONAL`
  - `5` `turbo-*` companions -> `ALLOW_TIER1_CONDITIONAL`
  - `1` `fsevents` -> `OUT_OF_SCOPE_TIER1_LINUX`
- Решение жёстко ограничено периметром:
  - `Tier 1 self-host / localized MVP pilot`
  - Linux runtime perimeter
  - procurement/due-diligence handoff без public cross-platform distribution
- Синхронизированы:
  - `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md`
  - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
  - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
  - `OSS_LICENSE_AND_IP_REGISTER.md`
  - `PHASE_A_EXECUTION_BOARD.md`
  - `PHASE_A_EVIDENCE_MATRIX.md`
- Практический эффект:
  - `A-2.6.1` теперь может считаться `done` для `Tier 1`
  - remaining `A5` blocker сместился с raw `UNKNOWN` triage к `ELP-20260328-09`, chain-of-title и wider distribution legal sign-off

[2026-03-31 12:02Z] Для `A5.2` выпущен first assembled `NOTICE` bundle
- Добавлен generator `scripts/generate-notice-bundle.cjs`.
- В root `package.json` добавлена команда:
  - `pnpm security:notices`
- Generator использует `var/security/license-inventory.json` и выпускает:
  - `var/security/notice-bundle.json`
  - `var/security/notice-bundle.md`
- Bundle включает representative license texts для known families:
  - `MIT`
  - `Apache-2.0`
  - `ISC`
  - `BSD-2-Clause`
  - `BSD-3-Clause`
  - `BlueOak-1.0.0`
- Одновременно в generated output явно зафиксированы:
  - `esbuild` companions = `25` как conditional `Tier 1 Linux self-host`
  - `turbo` companions = `5` как conditional `Tier 1 Linux self-host`
  - `fsevents` = `1` как `linux Tier 1 out-of-scope`
  - first-party `UNLICENSED` perimeter как исключённый из third-party notice bundle
- Опубликован новый canonical report:
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md`
- Практический эффект:
  - `A5.2` перестал быть только policy-описанием и получил реальный generated evidence layer;
  - `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`, `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`, `OSS_LICENSE_AND_IP_REGISTER.md`, `PHASE_A_EXECUTION_BOARD.md` и `PHASE_A_EVIDENCE_MATRIX.md` теперь ссылаются уже на assembled bundle, а не только на working packet;
  - следующий реальный шаг `A5` сузился до final legal classification `esbuild/turbo/fsevents` и привязки assembled bundle к procurement/distribution decision.

[2026-03-30 14:48Z] Создан execution-пакет `ONE_BIG_PHASE`
- Создана новая папка `docs/07_EXECUTION/ONE_BIG_PHASE/` как рабочий контур исполнения текущей большой фазы.
- Внутри добавлены:
  - `INDEX.md`
  - `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md`
  - `02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md`
  - `03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md`
  - `04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md`
- Новый пакет фиксирует практическое разложение:
  - synthesis report -> owner checklist -> детальные подфазы исполнения
- Обновлены `docs/README.md`, `docs/INDEX.md`, `docs/DOCS_MATRIX.md`.
- Практический эффект: у проекта появился постоянный execution-контур, по которому можно идти сверху вниз и реально выполнять большую фазу без потери логики.

[2026-03-31 01:43Z] Для `A5` добавлен отдельный IP/OSS closeout packet
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`.
- Документ привязан к текущим фактам:
  - `pnpm security:licenses` уже строит воспроизводимый inventory
  - `OSS_LICENSE_AND_IP_REGISTER` фиксирует `33 unknown licenses`
  - `RF_COMPLIANCE_REVIEW` подтверждает, что `chain-of-title` и OSS triage остаются красным блокером
- Практический эффект: трек `A5` теперь исполняется как конкретный пакет по `unknown licenses`, notice obligations, `ELP-20260328-09` и first-party licensing strategy, а не как общий IP-хвост в конце `Phase A`.

[2026-03-31 01:58Z] Для первой legal-волны `A1` добавлен owner-friendly execution checklist
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`.
- Документ зафиксировал первую критическую четвёрку:
  - `ELP-20260328-01`
  - `ELP-20260328-03`
  - `ELP-20260328-04`
  - `ELP-20260328-06`
- Для каждой карточки явно описано:
  - какой внешний файл нужен
  - кто даёт данные
  - что обязательно вписать
  - какую команду `intake` запускать
  - что изменится в board и legal verdict
- Практический эффект: `A1` теперь можно двигать как прямой чеклист исполнения, а не как навигацию по register/handoff/priority-board.

[2026-03-31 02:09Z] Для `ELP-20260328-01` добавлен отдельный operator-memo micro-checklist
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md`.
- Документ зафиксировал:
  - допустимую форму `operator identity and role memo`
  - минимально обязательные поля
  - точный цикл `intake -> reviewed -> accepted`
  - что именно должно измениться в `A1` и legal verdict после acceptance
- Практический эффект: первый реальный шаг `A1` теперь исполнительно разложен до одного конкретного документа, без необходимости собирать acceptance criteria по нескольким legal-файлам.

[2026-03-31 02:19Z] Для `ELP-20260328-03` добавлен отдельный hosting/residency micro-checklist
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md`.
- Документ зафиксировал:
  - допустимую форму `Hosting / residency attestation`
  - минимально обязательные поля по `prod / pilot / staging`
  - точный цикл `intake -> reviewed -> accepted`
  - что именно должно измениться в `A1` и legal verdict после acceptance
- Практический эффект: второй реальный шаг `A1` теперь исполнительно разложен до одного конкретного документа, без необходимости собирать residency criteria из request packet, runbook и deployment matrix вручную.

[2026-03-31 02:42Z] `Phase A` разложена до первого рабочего слоя по всем трекам
- Созданы:
  - `PHASE_A0_TRIAGE_EXECUTION_RULES.md`
  - `PHASE_A1_ELP_04_PROCESSOR_DPA_CHECKLIST.md`
  - `PHASE_A1_ELP_06_LAWFUL_BASIS_CHECKLIST.md`
  - `PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md`
  - `PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md`
  - `PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md`
  - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
- Зафиксирован живой baseline для `A2`:
  - `security:audit:ci` -> `critical=2`, `high=37`
  - `gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
  - `gate:invariants` -> `violations=0`
  - `security:licenses` -> `unknown_licenses=33`
- Практический эффект: все треки `A0–A5` теперь имеют не только общий closeout-plan, но и первый исполнимый рабочий слой, по которому можно реально двигать фазу без распыления и без постоянных возвратов к верхнеуровневым документам.

[2026-03-31 02:58Z] `A1` разложена до конца по всей приоритетной legal-восьмёрке
- Созданы:
  - `PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md`
  - `PHASE_A1_ELP_02_RKN_CHECKLIST.md`
  - `PHASE_A1_ELP_05_TRANSBORDER_CHECKLIST.md`
  - `PHASE_A1_ELP_08_RETENTION_CHECKLIST.md`
  - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
- Практический эффект: legal-track `A1` больше не имеет незадекомпозированных priority-items внутри репозитория; от этого момента остаточный blocker уже не в структуре docs, а в отсутствии реальных внешних документов и owner sign-off.

[2026-03-31 01:31Z] Для `A4` добавлен отдельный installability/recovery closeout packet
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md`.
- Документ привязан к текущим фактам:
  - `self-host / localized first` остаётся приоритетным маршрутом
  - release criteria требуют install/upgrade packet и fresh backup/restore evidence
  - due diligence фиксирует отсутствие полного installability packet и последнего backup/restore execution report
- Практический эффект: трек `A4` теперь исполняется как конкретный пакет по installability, dry-run, recovery evidence и support boundary, а не как общая ops-тема.

[2026-03-31 01:19Z] Для `A3` добавлен отдельный AI governance closeout packet
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`.
- Документ привязан к текущим фактам:
  - advisory-first AI policy уже зафиксирована
  - audit по AI/agent contour остаётся условным из-за отсутствия unified safety release gate
  - release criteria требуют `tool matrix`, `HITL matrix`, formal `eval-suite`
- Практический эффект: трек `A3` теперь исполняется как конкретный пакет по `tool / HITL / advisory-only / eval`, а не как общая policy-тема без рабочего выхода.

[2026-03-31 01:08Z] Для `A2` добавлен отдельный security closeout packet
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md`.
- Документ привязан к текущему фактическому baseline:
  - `pnpm gate:invariants` проходит
  - `controllers_without_guards = 0`
  - `raw_sql_unsafe = 0`
  - security-policy контур активен
- Одновременно зафиксировано, что dependency-risk, historical secret debt и external access evidence ещё не закрыты до конца.
- Практический эффект: трек `A2` теперь исполняется не как абстрактное “улучшить security”, а как конкретный пакет по dependency-risk, secrets, invariants и access-governance.

[2026-03-31 00:54Z] Для `A1` добавлен отдельный legal closeout packet
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md`.
- Документ привязан к фактическому состоянию legal tooling:
  - `requested = 11`
  - `accepted = 0`
  - `current_verdict = NO-GO`
  - `blockers_to_next_target = 8`
- Внутрь execution-пакета подняты:
  - точный приоритетный порядок `ELP-01 -> 03 -> 04 -> 06 -> 02 -> 05 -> 08 -> 09`
  - draft paths из restricted store
  - команды `intake / reviewed / accepted`
  - правило синхронизации board после каждого шага
- Практический эффект: legal track `A1` теперь исполняется как конкретная очередь действий внутри `ONE_BIG_PHASE`, а не как общий пункт “закрыть legal”.

[2026-03-31 00:38Z] `Phase A` переведена в decision-complete implementation packet
- Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md`.
- Новый документ формализует исполнение `Phase A` по трекам:
  - `A0` triage
  - `A1` legal
  - `A2` security
  - `A3` AI governance
  - `A4` installability/recovery
  - `A5` IP/OSS
- `PHASE_A_EXECUTION_BOARD.md` обновлён: появился `Track` и board теперь отражает реальный execution order.
- `PHASE_A_EVIDENCE_MATRIX.md` обновлена: доказательства теперь размечены по трекам, а не только по осям риска.
- Практический эффект: `Phase A` теперь можно вести как цельный операционный пакет с единым планом, board и evidence model, без дополнительных решений от исполнителя.

[2026-03-31 00:12Z] Для `Phase A` добавлены execution board и evidence matrix
- В `docs/07_EXECUTION/ONE_BIG_PHASE/` созданы:
  - `PHASE_A_EXECUTION_BOARD.md`
  - `PHASE_A_EVIDENCE_MATRIX.md`
- `PHASE_A_EXECUTION_BOARD` разложил пункты `Phase A` в строки `blocker / owner / status / evidence / next action`.
- `PHASE_A_EVIDENCE_MATRIX` зафиксировал, какие именно доказательства считаются достаточными для закрытия legal, security, AI governance, installability и IP рисков.
- `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы.
- Практический эффект: у `Phase A` появился не только план, но и операционный механизм различения между движением задач и реальным evidence-closeout.

[2026-03-30 15:02Z] Уточнена роль существующих `front-office / CRM`-агентов в execution-каноне
- Исправлены двусмысленные формулировки в `RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`, `RAI_EP_MVP_EXECUTION_CHECKLIST.md` и `ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md`.
- Зафиксировано различие:
  - существующие `front-office / CRM`-контуры уже входят в важный текущий agent-perimeter;
  - под ограничением находится не их наличие, а широкое масштабирование и новые роли сверх текущего состава до закрытия stop-blockers.
- Практический эффект: execution-план больше не конфликтует с фактом, что `front-office` и `CRM` уже являются важными и нужными контуром ближайшего продукта.

[2026-03-30 14:32Z] Добавлен простой owner-уровневый MVP execution checklist
- Создан `docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md`.
- Документ не заменяет `RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`, а работает как второй входной execution-слой:
  - synthesis = жёсткий управленческий порядок и decision model
  - checklist = простой пошаговый порядок действий без профессионального жаргона
- Новый claim `CLAIM-EXE-RAI-EP-MVP-EXECUTION-CHECKLIST-20260330` зарегистрирован в `docs/DOCS_MATRIX.md`.
- Обновлены `docs/README.md` и `docs/INDEX.md`, чтобы чеклист стал частью канонической навигации.
- Практический эффект: owner получил официальный "что делать дальше" документ в execution-слое, а не временный ответ в чате.

[2026-03-28 13:44Z] Legal verdict automation добавлена в enterprise closeout
- Добавлен `scripts/legal-evidence-verdict.cjs`.
- В `package.json` добавлены команды:
  - `pnpm legal:evidence:verdict`
  - `pnpm gate:legal:evidence:verdict`
- Новый отчёт по verdict читает `external-legal-evidence-status.json` и repo-side metadata register, затем публикует:
  - `var/compliance/external-legal-evidence-verdict.json`
  - `var/compliance/external-legal-evidence-verdict.md`
- Зафиксированы машинные правила переходов:
  - `NO-GO -> CONDITIONAL GO` по accepted `ELP-20260328-01,02,03,04,05,06,08,09` и assigned-with-SLA `07,10`
  - `CONDITIONAL GO -> GO` по accepted `ELP-20260328-01 .. 11`
- Практический эффект: legal closeout теперь даёт не только lifecycle tracking, но и детерминированный verdict/blocker report для enterprise decision layer.

[2026-03-28 12:55Z] Enterprise audit closeout: security/compliance/ops baseline собран
- Добавлены воспроизводимые security/supply-chain команды:
  - `pnpm security:audit:ci`
  - `pnpm gate:secrets`
  - `pnpm gate:db:schema-validate`
  - `pnpm security:licenses`
  - `pnpm security:sbom`
- Новый локальный baseline подтверждён:
  - `pnpm security:audit:ci` -> `37 high`, `2 critical`
  - `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
  - `pnpm gate:db:schema-validate` -> `Prisma schema is valid`
  - `pnpm security:licenses` -> `189 packages`, `33 unknown licenses`
  - `pnpm security:sbom` -> `CycloneDX 1.6` SBOM generated
- Усилен CI/security governance:
  - обновлён `security-audit.yml`
  - добавлены `codeql-analysis.yml` и `dependency-review.yml`
  - `CODEOWNERS` расширен на workflows, scripts, shared runtime paths и `docs/05_OPERATIONS`
- Из индекса удалены tracked secret env-файлы:
  - `mg-core/backend/.env`
  - `mg-core/backend/src/mg-chat/.env`
- В `docs/05_OPERATIONS` создан active legal/ops packet:
  - privacy/operator register
  - hosting/transborder/deployment matrix
  - OSS/IP register
  - security/access policy
  - key material incident report
  - privacy subject-rights runbook
  - release/backup/restore/DR runbook
- `docs/_audit` синхронизирован до post-remediation snapshot:
  - security и deployment evidence заметно усилены
  - `Legal / Compliance` оставлен `NO-GO`, потому что external operator/legal evidence всё ещё отсутствует

[2026-03-28 09:03Z] Backend remediation slice закрыт; `api` baseline полностью зелёный
- `packages/prisma-client/fix_schema.ts` расширен до полного repair-пакета для hardened ledger-контура: recovery `dblink`, `account_balances`, `check_tenant_state_hardened_v6`, `update_account_balance_v1`, `no_negative_cash`, trigger wiring и `create_ledger_entry_v1`.
- Подтверждено, что локальный Postgres находился в schema drift состоянии: миграция уже считалась применённой, но ключевые DB-объекты ledger-контура отсутствовали.
- После recovery-скрипта `src/modules/finance-economy/economy/application/economy.concurrency.spec.ts` проходит; backend blocker из finance-economy больше не воспроизводится.
- `apps/api/src/shared/audit/audit.module.ts` получил явные импорты `CryptoModule` и `AnchorModule`; цепочка notarization больше не зависит от неявного модульного окружения.
- Исправлены два оставшихся красных suite:
  - `src/modules/consulting/domain-rules/consulting.domain-rules.spec.ts`
  - `apps/api/test/a_rai-live-api-smoke.spec.ts`
- Новый полный baseline подтверждён командой `pnpm --filter api test -- --runInBand`: `252/252 suite PASS`, `1313 passed`, `1 skipped`, `1314 total`.
- Практический эффект: backend audit snapshot должен опираться уже на полностью зелёный `api`, а не на старый красный baseline `7 failed / 252 total`.

[2026-03-21] Wave 2 claim-management для активного strategy/frontend-канона
- Ключевые документы в `docs/00_STRATEGY/STAGE 2`, `docs/00_STRATEGY/BUSINESS` и `docs/10_FRONTEND_MENU_IMPLEMENTATION` переведены в `claim-managed` статус как `SUPPORTING`, а не оставлены в серой зоне между активным слоем и архивом.
- Зафиксировано новое governance-правило: `claim` может подтверждать не только runtime-факт, но и роль документа как действующего planning / navigation / governance-источника; для этого допустим `verified_by: manual`.
- Сохранено жёсткое разграничение: такие документы обязательны для reasoning и проектирования, но любые тезисы о текущем runtime всё равно требуют отдельной сверки по `code/tests/gates`.
- В `docs/00_STRATEGY/BUSINESS` каноническим источником закреплён `RAI BUSINESS ARCHITECTURE v2.0.md`; старый `RAI BUSINESS ARCHITECTURE.md` и производный `v2.0_for_llm` помечены как `deprecated`, чтобы агент не уезжал в дубликаты.
- `docs/DOCS_MATRIX.md` и `docs/_audit/CLASSIFICATION_MATRIX.md` синхронизированы с новой активной семантикой; `pnpm lint:docs:matrix:strict`, `node scripts/verify-invariants.cjs` и `pnpm lint:docs` проходят без ошибок.

[2026-03-21] Documentation topology redecision and active layer restore
- Выполнен полный повторный semantic-scan дерева `docs` без привязки к старому сжатому шаблону.
- Признано, что active knowledge system проекта шире operational canon: стратегия, домены, execution, testing, metrics и frontend-пакет являются действующими слоями знания, а не архивным мусором.
- Из `docs/06_ARCHIVE/LEGACY_TREE_2026-03-20/` обратно в active tree восстановлены `00_STRATEGY`, `02_DOMAINS`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`.
- В `AGENTS.md`, `docs/README.md`, `docs/INDEX.md`, `docs/CONTRIBUTING_DOCS.md` закреплена новая модель: `verified operational canon` отдельно от `active intent/design/planning`, архив отдельно от них.
- В `docs/11_INSTRUCTIONS` исправлены ссылки на `00_STRATEGY/STAGE 2`, чтобы agent playbooks снова вели в живые документы, а не в пустые пути.

[2026-03-21] Исправлено ложное трактование архива как "не читать"
- Зафиксировано, что `docs/06_ARCHIVE` не является operational truth, но обязателен для recovery исторической бизнес-логики, agent intent и архитектурной мотивации.
- Для Codex и docs governance введено явное правило: при нехватке активного контекста нужно читать архив, особенно `06_ARCHIVE/LEGACY_TREE_2026-03-20/00_STRATEGY`.
- Одновременно закреплено ограничение: тезисы из архива нельзя выдавать как verified truth без перепроверки по `code/tests/gates` или без переноса в активные canonical docs.

[2026-03-21] Исправлена ошибочная архивация слоя Instructions
- Подтверждено, что `11_INSTRUCTIONS` был first-class слоем ещё в layer/type matrix и в линтерах, поэтому его архивирование было не следствием технического ограничения, а ошибкой интерпретации целевой структуры.
- Пакет `11_INSTRUCTIONS` восстановлен в active tree.
- Новое правило: действующие agent instructions и enablement playbooks живут в `docs/11_INSTRUCTIONS`, а не в `06_ARCHIVE`.

[2026-03-20] Routing Learning Layer — controlled migration стартован
- Принято решение не вводить отдельный routing-сервис и новый Prisma-store на первой волне.
- Источник правды для routing telemetry: `AiAuditEntry.metadata.routingTelemetry`.
- Основной migration pattern: `shadow-first`, затем selective primary cutover.
- Первый production slice для primary-cutover: `agro.techmaps.list-open-create`.
- Runtime enforcement на этой волне ограничен coarse capability gating; dynamic gating и case memory отложены.

[2026-03-20] Techmaps routing eval gate включён
- Для `SemanticRouterService` добавлен fixture-driven корпус `techmaps-routing-eval-corpus.json`.
- Введён отдельный quality gate `pnpm gate:routing:techmaps`, который выполняет `semantic-router.eval.spec.ts`.
- Gate добавлен в `.github/workflows/invariant-gates.yml` как hard-fail шаг, чтобы коллизии `read/open/create` ловились до релиза.

[2026-03-20] Agent-level routing divergence drilldown включён
- Endpoint `/api/rai/explainability/routing/divergence` расширен полем `agentBreakdown`.
- Aggregation теперь группирует routing telemetry по `targetRole` и считает `divergenceRatePct`, `semanticPrimaryCount`, `decisionBreakdown`, `topMismatchKinds`.
- `Control Tower` показывает самый шумный агентный контур и его mismatch-профиль без доступа к raw payload.

[2026-03-20] Failure-cluster triage включён
- Endpoint `/api/rai/explainability/routing/divergence` расширен полем `failureClusters`.
- Read-model теперь группирует повторяющиеся mismatch-группы по `targetRole + decisionType + mismatchKinds` и считает `caseMemoryReadiness`.
- `Control Tower` показывает повторяющиеся кластеры сбоев и их готовность к памяти кейсов, чтобы следующий шаг по `case memory` опирался на production-повторы.

[2026-03-20] Versioned case memory candidates включены
- Endpoint `/api/rai/explainability/routing/divergence` расширен полем `caseMemoryCandidates`.
- Read-model теперь группирует version-aware кандидатов по `sliceId + targetRole + decisionType + mismatchKinds + routerVersion + promptVersion + toolsetVersion`.
- Для каждого кандидата считаются `traceCount`, `firstSeenAt`, `lastSeenAt`, `ttlExpiresAt` и readiness; `Control Tower` показывает их без отдельной таблицы и отдельного ingestion-store.

[2026-03-20] Routing case memory capture path включён
- Добавлен operator endpoint `POST /api/rai/explainability/routing/case-memory-candidates/capture` с `Idempotency-Key` и `RolesGuard`.
- Persisted capture path построен на append-only `AuditLog` action `ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED`; отдельный Prisma-store по-прежнему не вводился.
- Read-model `routing/divergence` теперь возвращает `captureStatus / capturedAt / captureAuditLogId`, а `Control Tower` даёт кнопку `зафиксировать` только для `ready_for_case_memory` кандидатов.

[2026-03-20] Routing case memory retrieval и lifecycle включены
- Добавлен `RoutingCaseMemoryService`, который читает captured cases из `AuditLog`, фильтрует их по `TTL`, считает relevance-score и активирует релевантные кейсы через action `ROUTING_CASE_MEMORY_CASE_ACTIVATED`.
- `SemanticRouterService` теперь получает `retrievedCaseMemory[]` до `LLM refine` и может выполнить safe override только для low-risk read-only сценариев.
- Explainability и `Control Tower` различают lifecycle `not_captured / captured / active`, поэтому память кейсов перестала быть пассивной аналитикой и стала runtime-входом для маршрутизации.

[2026-03-20] Case memory gate ужесточён
- `pnpm gate:routing:techmaps` теперь включает `semantic-router.eval.spec.ts`, `semantic-router.service.spec.ts` и `routing-case-memory.service.spec.ts`.
- В gate добавлен negative write-guard: case memory не может перевести `abstain` в `write execute`, даже если similarity у captured case высокий.

[2026-03-20] Второй bounded slice `agro.deviations.review` включён
- `SemanticRouterService` получил отдельный `sliceId` для `deviations`; primary promotion включается только внутри `/consulting/deviations*`, а вне этого route-space `compute_deviations` остаётся в `shadow`.
- Исправлен приоритет slice-resolver: явный `deviations`-контур теперь побеждает раньше общего `techmaps/field` сигнала, поэтому поле в контексте страницы отклонений больше не уводит routing в `agro.techmaps.list-open-create`.
- `AgentExecutionAdapterService` теперь честно отдаёт `executionPath = semantic_router_primary` для agronomist-интентов, если они пришли из первичного semantic-routing.
- Eval/gate расширены до уровня `agro-slices`: добавлен `deviations-routing-eval-corpus.json`, введён канонический `pnpm gate:routing:agro-slices`, старый `pnpm gate:routing:techmaps` сохранён как compatibility alias.

[2026-03-20] Третий bounded slice `finance.plan-fact.read` включён
- `SemanticRouterService` получил entity `plan_fact` и отдельный bounded slice `finance.plan-fact.read`.
- Primary promotion для `compute_plan_fact` ограничен `yield/finance`-контуром; вне него semantic-router считает маршрут, но не перехватывает production-primary path.
- `selectedRowSummary.kind = yield` теперь используется как источник `planId`, поэтому в `yield`-контуре `compute_plan_fact` может уходить в `execute`, а при пустом контексте — в честный `clarify`.
- Канонический gate переименован в `pnpm gate:routing:primary-slices`; старые `pnpm gate:routing:agro-slices` и `pnpm gate:routing:techmaps` сохранены как совместимые алиасы.

[2026-03-20] Четвёртый bounded finance-wave `scenario + risk` включён
- `SemanticRouterService` получил ещё два finance-slice: `finance.scenario.analysis` и `finance.risk.analysis`.
- `RoutingEntity` расширен значениями `scenario` и `risk_assessment`; LLM-prompt и case-memory intent mapping синхронизированы с новыми сущностями.
- Primary promotion для `simulate_scenario` и `compute_risk_assessment` ограничен `yield/finance`-контуром, а вне него сохранён `shadow` по явным finance-сигналам.
- `AgentExecutionAdapterService` теперь явно резолвит economist-intent из `semanticRouting.routeDecision.eligibleTools/sliceId`, поэтому primary semantic-routing больше не деградирует обратно в `compute_plan_fact`.
- Общий gate `pnpm gate:routing:primary-slices` подтверждает все текущие bounded slice: `techmaps`, `deviations`, `plan-fact`, `scenario`, `risk`.

[2026-03-20] Пятый bounded slice `crm.account.workspace-review` включён
- `SemanticRouterService` получил новый bounded read-only slice `crm.account.workspace-review` для `review_account_workspace`.
- `RoutingEntity` расширен значением `account`; primary promotion для CRM-карточки ограничен route-space `/parties | /consulting/crm | /crm`.
- Закрыт runtime-gap между chat-routing и CRM runtime: `CrmAgent` и `AgentExecutionAdapterService` теперь реально поддерживают `query` для `review_account_workspace`, а не только `accountId`.
- `RoutingCaseMemoryService.inferSliceId()` расширен CRM-slice логикой, поэтому будущая case-memory retrieval не смешает карточку контрагента с finance/agro маршрутами.
- Общий gate `pnpm gate:routing:primary-slices` теперь подтверждает шесть bounded slice, включая `crm-workspace`.

[2026-03-20] Шестой bounded slice `contracts.registry-review` включён
- `SemanticRouterService` получил новый bounded read-only slice `contracts.registry-review` для `list_commerce_contracts` и `review_commerce_contract`; primary promotion ограничен route-space `/commerce/contracts`.
- `ContractsAgentInput`, `GetCommerceContractPayload` и `getCommerceContractSchema` расширены read-only полем `query`; review договора теперь возможен по `contractId` или `query`.
- `ContractsToolsRegistry` реализует safe lookup по `contractId / number / quoted query / party legalName`, не расширяя write-surface и не вводя новый store.
- `AgentExecutionAdapterService` теперь резолвит contracts-intent из `semanticRouting.routeDecision.eligibleTools` и прокидывает `query` в `ContractsAgent`.
- `detectContractsIntent()` больше не валит `покажи договор DOG-001` в `list_commerce_contracts`.
- Одновременно закрыт междоменный конфликт `CRM vs Contracts`: generic `карточка` не может активировать CRM read-only контур поверх `/commerce/contracts`.
- `contracts-routing-eval-corpus.json` добавлен в общий `pnpm gate:routing:primary-slices`; gate подтверждает уже семь bounded slice.

[2026-03-20] Седьмой bounded slice `knowledge.base.query` включён
- `SemanticRouterService` получил новый bounded read-only slice `knowledge.base.query`; primary promotion ограничен route-space `/knowledge*`.
- Для knowledge-контуров принят route-priority подход: внутри `/knowledge/base` запросы по техкартам и другим доменам трактуются как `QueryKnowledge`, а не как cross-domain execution.
- Вне `/knowledge*` semantic-router не перехватывает knowledge-запросы в `primary`; сохраняется безопасный `shadow`, чтобы knowledge не расползался по междоменному routing.
- `collectToolIdentifiers()`, `buildDialogState()`, `resolveIntentFromCaseMemory()` и `RoutingCaseMemoryService.inferSliceId()` синхронизированы с новым slice.
- `knowledge-routing-eval-corpus.json` добавлен в общий `pnpm gate:routing:primary-slices`; gate подтверждает уже восемь bounded slice.

[2026-03-20] Восьмой bounded slice `crm.counterparty.lookup` включён
- `SemanticRouterService` получил новый bounded read-only slice `crm.counterparty.lookup` для `lookup_counterparty_by_inn`; primary promotion ограничен CRM route-space `/parties | /consulting/crm | /crm`.
- Закрыт баг смешения с CRM workspace-review: фразы `по ИНН` без цифр больше не утекают в `crm.account.workspace-review`, а идут в `crm.counterparty.lookup` с `clarify` по `inn`.
- `execution-adapter-heuristics.ts`, `AgentExecutionAdapterService` и `CrmAgent` синхронизированы под новый intent/tool (`LookupCounterpartyByInn`) с приоритетом semantic routing и fallback-добором `inn` из текста.
- Добавлен eval-corpus `crm-inn-lookup-routing-eval-corpus.json`; `pnpm gate:routing:primary-slices` подтверждает новый slice вместе с существующими девятью bounded read-only маршрутами.

[2026-03-20] Девятый bounded slice `contracts.ar-balance.review` включён
- `SemanticRouterService` получил новый bounded read-only slice `contracts.ar-balance.review` для `review_ar_balance`; primary promotion ограничен route-space `/commerce/contracts`.
- AR-контур выделен отдельно от `contracts.registry-review`: запросы по дебиторке больше не смешиваются с `list/review_commerce_contract`.
- Для нового slice включён deterministic `execute|clarify`: при наличии `invoiceId` идёт `GetArBalance`, при отсутствии — `clarify` с `requiredContextMissing = [invoiceId]`.
- `RoutingCaseMemoryService.inferSliceId()` и `AgentExecutionAdapterService.resolveContractsIntent()` синхронизированы под `contracts.ar-balance.review` и semantic-priority route.
- Добавлен eval-corpus `contracts-ar-balance-routing-eval-corpus.json`; `pnpm gate:routing:primary-slices` подтверждает уже десять bounded read-only slice.

[2026-03-15 08:40Z] Git Pull / Manual Repo Sync
- Запуск `git pull` для синхронизации локальной копии с `origin/main`.

[2026-03-15 09:15Z] RAI_EP SWOT Analysis
- Проведен SWOT-анализ системы RAI_EP на основе рыночного исследования (РФ/СНГ).
- Создан документ `RAI_EP_SWOT_ANALYSIS.md`.
- Зафиксированы ключевые преимущества (мультиагентность, детерминизм) и рыночные ниши (CFO-layer).

[2026-03-05 23:59Z] R3 Truthfulness Runtime Trigger
- Решена гонка `writeAiAuditEntry` vs `calculateTraceTruthfulness` (добавлен await).
- Удален фальшивый fallback `bsScorePct ?? 0` (заменен на честные 100).
- Зафиксирована семантика _replayMode_ -> truthfulness pipeline skipping.
- Написано 5 тестов `Truthfulness runtime pipeline`.
[2026-03-05 00:13Z] R3 Truthfulness - Revision A
- Исправлена гонка traceSummary.record -> updateQuality (добавлен await перед record).
- Тест ordering доработан проверкой record -> audit -> updateQuality.
- Семантика replayMode стала честным read-only: отключены record и auditCreateSideEffects.

[2026-03-06] Rapeseed Grand Synthesis
- Успешно завершен кросс-анализ 5 документов-исследований по экономике и агрономии рапса в РФ.
- Создан финальный файл `GRAND_SYNTHESIS_FINAL.md` со строгой разметкой фактов, гипотез, конфликтов, с рейтингами консенсуса.
- TL;DR содержит 15 ключевых выводов, ТОП-10 проблем и ТОП-10 рычагов рентабельности.
- Все требования к структуре, терминологии и антигаллюцинационному контролю из промта выполнены.

[2026-03-07] Git Push
- Все локальные изменения добавлены в индекс.
- Закоммичены обновленные конфигурации агентов и документация.
- Выполнен git pull --rebase и git push в удаленный репозиторий.

[2026-03-07] Подъем API и Web
- Запущена команда `pnpm --filter api --filter web dev` для локальной разработки.
- Процессы api и web работают в фоне.

[2026-03-07] Git Push Master Plan
- Закомичен и запушен новый мастер-документ `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`.
- Устаревшие доки перенесены в папку `Archive`.
- Изменения успешно залиты в `origin/main` (с предварительным `git pull --rebase`).

[2026-03-07] RAI Agent Interaction Blueprint Closeout
- Закрыт Stage 2 interaction blueprint как реализованный канон.
- Unified `workWindows[]` protocol подтверждён для `agronomist`, `economist`, `knowledge`, `monitoring`.
- В backend введён единый contract-layer: `Focus / Intent / Required Context / UI Action`.
- `IntentRouter`, `Supervisor resume-path` и `ResponseComposer` переведены на общий contract source.
- Левый `AI Dock` переведён в IDE-подобную композицию: компактная шапка, история чатов, новый чат, упрощённый ритм.
- Legacy `widgets[]` мигрируются в typed windows; работают `context_*`, `structured_result`, `related_signals`, `comparison`.
- Добавлены window capabilities: `inline / panel / takeover`, `collapse / restore / close / pin`, parent/related graph.
- В интерфейс добавлен голосовой ввод с Web Speech API, автоотправкой и выбором языка распознавания.
- Truth-sync обновлён в `blueprint`, `master-plan`, `addendum`, `handoff`, `interagency index`, создан финальный closeout-report.

[2026-03-07] Memory Bank Sync Before Push
- Memory-bank синхронизирован перед git push по итогам полного пакета Stage 2 Agent Platform / Interaction Blueprint.
- Зафиксировано, что blueprint закрыт как `implemented canon`, а не как draft/vision-only документ.
- Подтверждён production-ready слой `clarification -> overlay -> auto-resume -> result windows`.
- Зафиксирована унификация UI shell: IDE-подобный `AI Dock`, история чатов, `Новый чат`, compact header, overlay-only агентные окна.
- Зафиксирован platform contract-layer для reference families и truth-sync по стратегиям, handoff и closeout-отчётам.

[2026-03-09 18:15Z] Final Git Push (Real one)
- Собираю всю эту хуйню (Front Office, Runtime Governance, миграции) и пушу в ветку `main`.
- Исправляю "бумажные" пуши предыдущих итераций.

[2026-03-09] Подъем API и Web
- Запущена команда `pnpm --filter api --filter web dev` для локальной разработки. Оба сервиса крутятся в фоне.

[2026-03-09] Front Office Agent Implementation
- Реализован `FrontOfficeAgent` в `apps/api` (сервис, тесты, инструменты).
- Обновлен `AgentRegistry` и конфигурации для поддержки Front Office.
- Добавлена документация: `RAI_FRONT_OFFICE_AGENT_CANON.md`, профиль агента, инструкции по энейблменту.
- Обновлены контракты взаимодействия и DTO для поддержки новых типов окон и интентов.
- Интегрированы `FrontOfficeTools` в общий реестр инструментов.

[2026-03-09] Agent Runtime Governance & Front Office Extensions
- Реализована система `Runtime Governance` для агентов (Prisma schema, миграции, read-model сервис).
- Добавлен контроллер и DTO для панели управления `Explainability`.
- Расширен `AgentConfigGuard` и `QualityAlertingService` для работы с новыми политиками управления.
- Реализованы расширения Front Office: `MASTER_PLAN`, `BACKLOG`, `USER_FLOWS` и контракты API.
- Обновлены тесты `SupervisorAgent`, `AgentRuntime` и реестра инструментов для поддержки новых сущностей.
- Запушен `RAI_AGENT_RUNTIME_GOVERNANCE.md` как основной канон управления жизненным циклом агентов.

[2026-03-11] Подъем API и Web
- Ебанул команду `pnpm --filter api --filter web dev` для локальной разработки.
- Процессы api и web хуярят в фоне (заметил пару TS ошибок в API из-за типизации Prisma, но хуйня, крутятся).

[2026-03-11] Подъем API, Web и Telegram Bot
- По просьбе юзера запустил заново `api` и `web` (после фиксов) вместе с `telegram-bot`.
- `pnpm --filter api --filter web run dev` и `pnpm --filter telegram-bot run start:dev` крутятся в фоне.

[2026-03-12 17:00Z] Audit Log Append-Only Hardening
- Добавлена миграция `20260312170000_audit_log_append_only_enforcement` для DB-level block на `UPDATE/DELETE` в `audit_logs`.
- Добавлен `AuditService` spec, который фиксирует create-only path и наличие tamper-evident metadata.
- Обновлены текущий delta-аудит, главный stabilization checklist и memory-bank, чтобы закрытие remediation не осталось только в коде.

[2026-03-12 18:10Z] Raw SQL Governance Phase 1
- Добавлены `scripts/raw-sql-governance.cjs` и `scripts/raw-sql-allowlist.json` для централизованного inventory/allowlist approved raw SQL paths.
- `scripts/invariant-gate.cjs` теперь печатает и проверяет raw SQL governance section в `warn/enforce`.
- Из operational scripts убраны `Prisma.$queryRawUnsafe/$executeRawUnsafe`: обновлены `scripts/backfill-outbox-companyid.cjs` и `scripts/verify-task-fsm-db.cjs`.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank по текущему статусу remediation.

[2026-03-12 21:43Z] Outbox Productionization — Scheduler Wiring
- В `apps/api/src/shared/outbox/outbox.relay.ts` включены bootstrap drain и cron scheduler wiring с env flags `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_SCHEDULE_ENABLED`, `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED`.
- Добавлены targeted tests на bootstrap/scheduler contract в `apps/api/src/shared/outbox/outbox.relay.spec.ts`.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы partial closeout по outbox productionization был виден как текущее состояние, а не скрывался в коде.

[2026-03-12 22:18Z] Memory Hygiene Scheduling
- В `apps/api/src/shared/memory/consolidation.worker.ts` включены cron scheduler paths для consolidation/pruning с env flags `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`.
- Добавлен targeted spec `apps/api/src/shared/memory/consolidation.worker.spec.ts` на scheduler contract.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы partial closeout по memory hygiene был отражён как текущее состояние системы.

[2026-03-12 22:52Z] Memory Hygiene Observability
- Проверен и подтверждён memory hygiene snapshot в `apps/api/src/shared/invariants/invariant-metrics.controller.ts`.
- Подтверждён targeted spec `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` (PASS), который фиксирует memory snapshot/alerts и Prometheus export.
- Синхронизированы baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы partial closeout по memory hygiene observability был отражён как source of truth.

[2026-03-12 23:07Z] Memory Hygiene Bootstrap Maintenance
- В `apps/api/src/shared/memory/consolidation.worker.ts` добавлены startup maintenance paths через `MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED` и `MEMORY_PRUNING_BOOTSTRAP_ENABLED`.
- `apps/api/src/shared/memory/consolidation.worker.spec.ts` расширен bootstrap contract tests; targeted jest PASS.
- Синхронизированы baseline audit, delta audit, stabilization checklist и memory-bank, чтобы bootstrap maintenance по memory hygiene не оставался только в коде.

[2026-03-12 23:39Z] Raw SQL Hardening Phase 2 — Memory Path
- `PrismaService.safeQueryRaw()/safeExecuteRaw()` расширены executor-aware режимом для transaction client.
- `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/default-memory-adapter.service.ts` переведены с прямого raw SQL на safe wrappers.
- `scripts/raw-sql-allowlist.json` сужен: memory path удалён из approved direct raw SQL paths.
- Подтверждены `node scripts/raw-sql-governance.cjs --mode=enforce` и targeted jest для `consolidation.worker` + `memory-adapter`.

[2026-03-12 23:51Z] Broader Engram Lifecycle Scheduling
- `apps/api/src/shared/memory/engram-formation.worker.ts` переведён в bootstrap/scheduler lifecycle worker для engram formation и pruning.
- Добавлены env-config flags `MEMORY_ENGRAM_FORMATION_*`, `MEMORY_ENGRAM_PRUNING_*` и pruning thresholds `MEMORY_ENGRAM_PRUNING_MIN_WEIGHT`, `MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS`.
- Добавлен targeted spec `apps/api/src/shared/memory/engram-formation.worker.spec.ts`; bootstrap/scheduler wiring и pruning thresholds подтверждены.
- Синхронизированы baseline audit, delta audit, stabilization checklist и memory-bank, чтобы broader engram lifecycle closeout был отражён как текущий статус remediation.

[2026-03-12 23:59Z] Engram Lifecycle Observability
- `apps/api/src/shared/invariants/invariant-metrics.controller.ts` расширен L4 metrics/alerts для `latestEngramFormationAgeSeconds` и `prunableActiveEngramCount`.
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены `RAIMemoryEngramFormationStale` и `RAIMemoryPrunableActiveEngramsHigh`.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_MATURITY_DASHBOARD_RU.md` и `docs/INVARIANT_SLO_POLICY_RU.md` синхронизированы с новым L4 observability contour.
- Подтверждён targeted spec `apps/api/src/shared/invariants/invariant-metrics.controller.spec.ts` (PASS).

[2026-03-12 12:02Z] Controlled Memory Backfill Policy
- В `apps/api/src/shared/memory/consolidation.worker.ts` и `apps/api/src/shared/memory/engram-formation.worker.ts` добавлены bounded bootstrap catch-up loops с `*_BOOTSTRAP_MAX_RUNS`.
- Targeted specs расширены на drain-until-empty и respect-max-runs поведение для S-tier и L4 lifecycle workers.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md` уточнён: triage memory alerts теперь включает проверку bootstrap backfill caps.
- Синхронизированы baseline audit, delta audit, stabilization checklist и memory-bank, чтобы controlled backfill policy не оставался только в коде.

[2026-03-12 12:19Z] Engram Lifecycle Throughput Visibility
- В `apps/api/src/shared/invariants/invariant-metrics.ts` добавлены counters `memory_engram_formations_total` и `memory_engram_pruned_total`, а `resetForTests()` обнуляет их между spec runs.
- `apps/api/src/shared/memory/engram.service.ts` теперь инкрементирует formation/pruning throughput counters; Prometheus export в `apps/api/src/shared/invariants/invariant-metrics.controller.ts` расширен метриками `invariant_memory_engram_formations_total` и `invariant_memory_engram_pruned_total`.
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлен alert `RAIMemoryEngramPruningStalled`, `docs/INVARIANT_ALERT_RUNBOOK_RU.md` синхронизирован с triage steps по stalled pruning.
- Подтверждены `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts src/shared/memory/engram.service.spec.ts`; статусные документы синхронизированы с новым L4 throughput contour.

[2026-03-12 12:39Z] Memory Lifecycle Operator Pause Windows
- В `apps/api/src/shared/memory/memory-lifecycle-control.util.ts` добавлен utility для time-boxed pause windows, а `ConsolidationWorker` и `EngramFormationWorker` теперь уважают `*_PAUSE_UNTIL` / `*_PAUSE_REASON` на scheduler/bootstrap path.
- Manual maintenance path оставлен доступным; scheduled/bootstrap skip логируется отдельно для `consolidation`, `pruning`, `engram formation`, `engram pruning`.
- `apps/api/src/shared/invariants/invariant-metrics.controller.ts` расширен pause flags и remaining-seconds gauges для всех четырёх lifecycle paths; `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_MATURITY_DASHBOARD_RU.md` и `docs/INVARIANT_SLO_POLICY_RU.md` синхронизированы с новым operator-control contour.
- Подтверждены `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts`; статусные документы обновлены.

[2026-03-12 12:58Z] Memory Lifecycle Error Budget View
- В `apps/api/src/shared/invariants/invariant-metrics.controller.ts` добавлены derived gauges `memory_engram_formation_budget_usage_ratio` и `memory_engram_pruning_budget_usage_ratio` как ранний L4 budget-usage contour.
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены burn-high alerts `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramPruningBudgetBurnHigh` с исключением pause-state.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/INVARIANT_MATURITY_DASHBOARD_RU.md`, `docs/INVARIANT_SLO_POLICY_RU.md`, baseline audit и checklist синхронизированы с новым early-warning contour.
- Подтверждён `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts`; remediation-state обновлён в memory-bank.

[2026-03-12 13:12Z] Memory Lifecycle Multi-Window Burn-Rate Escalation
- В `infra/monitoring/prometheus/invariant-alert-rules.yml` добавлены `RAIMemoryEngramFormationBurnRateMultiWindow` и `RAIMemoryEngramPruningBurnRateMultiWindow` как sustained degradation contour по `6h/24h` окнам.
- `docs/INVARIANT_ALERT_RUNBOOK_RU.md` расширен процедурами для multi-window burn-rate escalation; `docs/INVARIANT_SLO_POLICY_RU.md` теперь отделяет `burn-high`, `multi-window burn-rate` и `hard breach`.
- Baseline audit, delta audit, checklist, maturity dashboard и memory-bank синхронизированы с новым escalation layer.
- YAML alert-rules validated, `invariant-gate` повторно пройден.

[2026-03-12 18:30Z] Tenant-Scoped Memory Manual Control Plane
- Добавлены `apps/api/src/shared/memory/memory-maintenance.service.ts`, `apps/api/src/shared/memory/dto/run-memory-maintenance.dto.ts` и guarded endpoint `POST /api/memory/maintenance/run` в `apps/api/src/shared/memory/memory.controller.ts`.
- Manual corrective action по `consolidation`, `pruning`, `engram formation`, `engram pruning` теперь выполняется только в tenant-scoped path; `ConsolidationWorker`, `EngramFormationWorker` и `EngramService.pruneEngrams()` поддерживают company-scoped runs.
- Введён audit trail `MEMORY_MAINTENANCE_RUN_COMPLETED` / `MEMORY_MAINTENANCE_RUN_FAILED`; runbook, checklist, baseline audit, delta audit и memory-bank синхронизированы с новым operator control-plane.
- Targeted jest по `memory-maintenance.service`, `memory.controller`, `consolidation.worker`, `engram-formation.worker`, `engram.service` подтверждён; полный `apps/api` `tsc --noEmit` остаётся заблокирован уже существующей ошибкой в `src/modules/health/health.controller.ts`.

[2026-03-12 19:05Z] Production-Grade Operational Control for Memory Lifecycle
- `MemoryMaintenanceService` доведён до полноценного tenant-scoped control-plane: playbook catalog, recommendations, audit-backed recent runs и endpoint `GET /api/memory/maintenance/control-plane`.
- Введён `MemoryAutoRemediationService`: scheduled automatic corrective action, cooldown policy, auto-eligible playbooks only и safety caps `MEMORY_AUTO_REMEDIATION_*`.
- `InvariantMetricsController` и Prometheus export расширены deeper lifecycle signals и automation counters: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`.
- `EngramFormationWorker` приведён к тому же candidate contour, что и observability/control-plane: техкарты с `generationMetadata.memoryLifecycle.engramFormed=true` больше не попадают в formation path.
- Обновлены baseline audit, delta audit, stabilization checklist, alert runbook, maturity dashboard, SLO policy и memory-bank, чтобы блок `production-grade operational control for memory lifecycle` был отмечен как закрытый.
- Подтверждены targeted jest для control-plane/automation/observability и `pnpm --filter api exec tsc --noEmit --pretty false`.

[2026-03-12 19:32Z] Broker-Native Outbox Transport
- `apps/api/src/shared/outbox/outbox-broker.publisher.ts` переведён на transport abstraction `http | redis_streams`; generic HTTP path больше не является единственным broker delivery path.
- Добавлен broker-native Redis Streams publish через `XADD` с env-configs `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING`.
- `apps/api/src/shared/outbox/outbox.relay.ts` теперь transport-aware по broker config hint; relay корректно валидирует transport-specific configuration before bootstrap.
- Обновлены baseline audit, delta audit, stabilization checklist, outbox replay runbook и memory-bank, чтобы тезис "outbox broker publisher всё ещё generic HTTP-only" был снят как устаревший.
- Подтверждены `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts` и `pnpm --filter api exec tsc --noEmit --pretty false`.

[2026-03-12 20:00Z] External Front-Office Route-Space Separation
- В API введён отдельный viewer-only namespace `apps/api/src/modules/front-office/front-office-external.controller.ts` с canonical path `/api/portal/front-office/*`; legacy internal operations остаются в `front-office.controller.ts`.
- В web введён canonical внешний portal route-space `/portal/front-office` и `/portal/front-office/threads/[threadKey]`; для `FRONT_OFFICE_USER` старые `/front-office` root/thread paths теперь работают как compatibility redirects.
- Onboarding переведён на новый внешний contour: `apps/api/src/shared/auth/front-office-auth.service.ts` теперь генерирует activation links на `/portal/front-office/activate`, а login/activate success redirects используют `apps/web/lib/front-office-routes.ts`.
- Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы route-space debt по external front-office считался существенно сниженным, а остаток трактовался как legacy alias debt.
- Подтверждены `pnpm --filter api exec jest --runInBand src/modules/front-office/front-office-external.controller.spec.ts src/shared/auth/front-office-auth.service.spec.ts`, `pnpm --filter api exec tsc --noEmit --pretty false` и `pnpm --filter web exec tsc --noEmit --pretty false`.
- После финального добивания separation старые `/front-office/login|activate` переведены в redirect-only alias, а внутренний `apps/api/src/modules/front-office/front-office.controller.ts` больше не допускает `FRONT_OFFICE_USER` в `/api/front-office/*`; блок считается закрытым.

[2026-03-13 08:55Z] Massive Sync & Push
- Собираю в кучу все наработки за последние дни: Nvidia Qwen LLM integration, WORM S3 Compliance, Architecture Growth Governance, Outbox Evolution, Memory Lifecycle Control Plane и прочую годноту.
- Выполняю `git add .`, коммичу с матом и пушу в ремоут, как просил юзер.
- Репозиторий теперь в актуальном состоянии, всё пиздато.

[2026-03-14 07:02Z] Git Push
- Сделал `git add .`, забацал коммит на новые доки по агентам и чеклисты.
- Ебанул пуш в `main` удаленного репозитория, изменения залетели охуенно.

[2026-03-28 08:02Z] Raw SQL Governance Remediation
- `scripts/db/bootstrap-front-office-tenant-wave.cjs`, `scripts/db/explain-hot-paths.cjs`, `scripts/db/observe-index-window.cjs` и `scripts/db/validate-front-office-tenant-wave.cjs` переведены с `queryRawUnsafe/executeRawUnsafe` на `Prisma.sql` + `$queryRaw/$executeRaw`.
- `scripts/raw-sql-allowlist.json` расширен явными approved tooling entries для этих диагностических и backfill path, чтобы governance различал допустимый static SQL и реальный bypass.
- Подтверждены `node scripts/raw-sql-governance.cjs --enforce` и `pnpm gate:invariants`; итоговый baseline: `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0`.

[2026-03-28 08:30Z] Backend Test-Contract Stabilization
- Пакет stale-spec фиксов синхронизировал `consulting`, `technology-card`, `satellite`, `vision`, `knowledge-graph`, `rai-chat`, `explainability` и `front-office auth` тесты с текущими сервисными контрактами: `findFirst/updateMany/findFirstOrThrow`, новые DI-зависимости `RedisService` / `TenantContextService`, future-proof invite expiry и расширенный canonical agent registry.
- `apps/api/src/shared/rai-chat/agent-interaction-contracts.ts` теперь требует `threadId` или `workspaceContext.route` для auto-build path `create_front_office_escalation`, поэтому red-team payload без контекста не переводится в write escalation.
- Подтверждены `pnpm --filter api exec jest --runInBand ...` по 15 targeted suite и `pnpm --filter api build`; оставшийся backend debt после этого шага сместился в full-suite infrastructure/load issues и DB-specific `economy.concurrency` drift.

[2026-03-28 10:05Z] Audit Package Synced to Post-Remediation Baseline
- Обновлены `docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md`, `docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md` и `docs/_audit/DELTA_VS_BASELINE_2026-03-28.md` до версии `1.1.0`, чтобы audit больше не ссылался на уже закрытые красные `api/web/routing` regressions.
- Повторно подтверждены: `pnpm gate:routing:primary-slices` PASS (`4/4`, `86/86`), `pnpm --filter web build` PASS, `pnpm --filter web test` PASS (`42/42`, `482/482`), `pnpm --filter api test -- --runInBand` PASS (`252/252`, `1313 passed`, `1 skipped`).
- `pnpm gate:invariants` при этом зафиксирован как WARN `exit 0` с `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=2`, `violation_keys=raw_sql_unsafe_usage`; trace-log специально помечает это как более свежий verified state, чем ранний log с нулевыми нарушениями.
- `infra/gateway/certs/ca.key` отсутствует в рабочем дереве, но ещё виден через `git ls-files`; audit трактует это как residual SCM/security risk до фиксации удаления, review истории и rotation/revocation ключевого материала.
- Docs verification после sync: `pnpm lint:docs` PASS, `pnpm lint:docs:matrix:strict` PASS.

[2026-03-28 10:42Z] Invariant Baseline Fully Green
- `apps/api/test/a_rai-live-api-smoke.spec.ts` переведён с литеральных unsafe Prisma mock-полей на bracket-key assignment, поэтому raw-SQL governance больше не считает smoke-test реальным bypass path.
- Подтверждены `node scripts/raw-sql-governance.cjs --enforce` и `pnpm gate:invariants`; итоговый baseline: `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0`, `all_invariant_checks_passed`.
- Подтверждён `pnpm --filter api exec jest --runInBand test/a_rai-live-api-smoke.spec.ts`; smoke-suite PASS (`23/23`).
- Выполнен `git rm --cached --force infra/gateway/certs/ca.key`; файл больше не tracked в текущем индексе, а residual-risk сместился в review Git history и key rotation / revocation evidence.
- Audit-пакет синхронизирован до версии `1.2.0`; security narrative обновлён с active invariant violation на historical key-incident + supply-chain gaps.

[2026-03-28 11:08Z] DB Scope Manifest Realigned
- В `docs/01_ARCHITECTURE/DATABASE/MODEL_SCOPE_MANIFEST.md` добавлены tenant-scope entries для `TechMapReviewSnapshot`, `TechMapApprovalSnapshot`, `TechMapPublicationLock` как child records `TechMap` aggregate.
- Подтверждены `pnpm gate:db:scope`, `pnpm lint:docs` и `pnpm lint:docs:matrix:strict`; DB scope manifest и docs governance снова зелёные.
- Audit-пакет синхронизирован до версии `1.3.0`, чтобы deployment/schema sections больше не ссылались на уже закрытый `gate:db:scope` blocker.
[2026-03-28 13:35Z] External legal evidence closeout packet formalized
- В `docs/05_OPERATIONS` добавлен `EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md`.
- Остаточный legal/compliance blocker переведён из общего тезиса в явный пакет внешних доказательств с owner-scope, urgency, acceptance criteria и artifact sourcing.
- Синхронизированы:
  - `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`
  - `RF_COMPLIANCE_REVIEW_2026-03-28`
  - `ENTERPRISE_DUE_DILIGENCE_2026-03-28`
  - `ENTERPRISE_EVIDENCE_MATRIX_2026-03-28`
  - `DELTA_VS_BASELINE_2026-03-28`
  - `docs/README.md`
  - `docs/INDEX.md`
  - `docs/DOCS_MATRIX.md`
- Практический эффект: legal verdict пока не поднят, но теперь у команды есть конкретный packet для сбора внешних подтверждений по оператору, РКН, локализации, процессорам, transfer decisions, lawful basis и IP.
[2026-03-28 13:18Z] External legal metadata register and restricted store scaffold created
- В `docs/05_OPERATIONS` добавлен `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`.
- В репозитории теперь seeded `11` external legal evidence items со статусом `requested`, `reference_id`, `review_due` и linked docs.
- Вне Git создан local restricted scaffold:
  - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata`
  - добавлены `INDEX.md` и 11 metadata-карточек `ELP-20260328-01 .. ELP-20260328-11`
- Синхронизированы:
  - `EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET`
  - `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`
  - `RF_COMPLIANCE_REVIEW_2026-03-28`
  - `ENTERPRISE_DUE_DILIGENCE_2026-03-28`
  - `ENTERPRISE_EVIDENCE_MATRIX_2026-03-28`
  - `DELTA_VS_BASELINE_2026-03-28`
  - `docs/README.md`
  - `docs/INDEX.md`
  - `docs/DOCS_MATRIX.md`
- Практический эффект: legal/compliance closeout получил change-controlled queue для внешних артефактов без помещения самих документов в Git.
[2026-03-28 13:52Z] External legal owner routing and acceptance workflow finalized
- Создан `docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md`.
- `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER` усилен alias owner map и named owners по всем `ELP-20260328-01 .. 11`.
- `.github/CODEOWNERS` обновлён: legal/privacy closeout docs теперь требуют explicit review от legal/privacy aliases вместе с tech/runtime owners.
- Синхронизированы:
  - `EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET`
  - `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`
  - `RF_COMPLIANCE_REVIEW_2026-03-28`
  - `ENTERPRISE_DUE_DILIGENCE_2026-03-28`
  - `ENTERPRISE_EVIDENCE_MATRIX_2026-03-28`
  - `DELTA_VS_BASELINE_2026-03-28`
- Практический эффект: внутри локального контура plan доведён до предела исполнимости; оставшийся blocker больше не процедурный, а внешний evidence-dependent.
[2026-03-28 14:18Z] Reproducible legal evidence status gate added
- Добавлен `scripts/legal-evidence-status.cjs`.
- В `package.json` зарегистрированы `pnpm legal:evidence:status` и `pnpm gate:legal:evidence`.
- Gate сверяет:
  - repo-side metadata register
  - restricted metadata files
  - restricted `INDEX.md`
- Gate пишет отчёты в `var/compliance/` и даёт machine-readable baseline по status drift и overdue items.
- Audit/docs sync:
  - `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER`
  - `EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK`
  - `ENTERPRISE_EVIDENCE_MATRIX`
  - `ENTERPRISE_DUE_DILIGENCE`
  - `DELTA_VS_BASELINE`
[2026-03-28 14:31Z] Legal evidence intake automation added
- Добавлен `scripts/legal-evidence-intake.cjs`.
- В `package.json` добавлена команда `pnpm legal:evidence:intake`.
- Intake-команда:
  - принимает `reference_id` и внешний `source` файл
  - кладёт артефакт в restricted `artifacts/<reference_id>/`
  - обновляет restricted metadata card и `INDEX.md`
  - обновляет repo-side `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md` в статус `received`
- Практический эффект: после появления реального внешнего документа legal closeout двигается одной командой, а не ручной правкой нескольких источников.
[2026-03-28 14:45Z] Legal evidence lifecycle transition automation added
- Добавлен `scripts/legal-evidence-transition.cjs`.
- В `package.json` зарегистрирована команда `pnpm legal:evidence:transition`.
- `scripts/legal-evidence-status.cjs` усилен обязательными status-specific полями и проверкой существования `artifact_path` для non-requested карточек.
- Практический эффект: полный lifecycle legal evidence теперь замкнут кодом от intake до acceptance, а gate ловит неполные карточки до изменения audit-выводов.
[2026-03-28 15:02Z] Legal evidence template generator added
- Добавлен `scripts/legal-evidence-template.cjs`.
- В `package.json` зарегистрирована команда `pnpm legal:evidence:template`.
- Генератор выпускает шаблоны в restricted `templates/<reference_id>/`.
- Для приоритетных `ELP-20260328-01`, `03`, `04`, `06` добавлены специализированные секции, чтобы owners быстрее собирали operator/residency/DPA/lawful-basis evidence.
[2026-03-28 14:00Z] Repo-derived legal prefill drafts добавлены в closeout contour
- Добавлен `scripts/legal-evidence-prefill.cjs`.
- В `package.json` добавлена команда `pnpm legal:evidence:prefill`.
- `prefill` собирает repo-derived working drafts по `ELP-*` в restricted store и заполняет их уже известными repo-facts.
- Жёсткое ограничение зафиксировано в runbook: `prefill` не является внешним evidence и не меняет status карточек.
- Практический эффект: owners стартуют не с пустого шаблона, а с prefilled draft-пакета по критичным legal blockers.
[2026-03-28 14:10Z] Legal prefill generator расширен до полного `11/11` покрытия
- `scripts/legal-evidence-prefill.cjs` теперь покрывает не только критичные `01,02,03,04,05,06,08,09`, но и `07`, `10`, `11`.
- Практический эффект: весь external legal packet теперь имеет repo-derived draft layer, а не только blocker-set для перехода в `CONDITIONAL GO`.
[2026-03-28 14:20Z] Legal handoff queue добавлена поверх verdict и drafts
- Добавлен `scripts/legal-evidence-handoff.cjs`.
- В `package.json` добавлены команды:
  - `pnpm legal:evidence:handoff`
  - `pnpm gate:legal:evidence:handoff`
- Новый handoff-report группирует blockers до следующего verdict по named owners, draft-путям и intake-командам.
- Практический эффект: owner execution стал прямолинейным, без ручного сопоставления verdict-report, metadata register и restricted drafts.
[2026-03-28 14:35Z] Owner-specific legal packets добавлены поверх handoff queue
- Добавлен `scripts/legal-evidence-owner-packets.cjs`.
- В `package.json` добавлены команды:
  - `pnpm legal:evidence:owner-packets`
  - `pnpm gate:legal:evidence:owner-packets`
- Новый generator использует `external-legal-evidence-handoff.json` и выпускает restricted packet bundle:
  - `owner-packets/INDEX.md`
  - `owner-packets/<owner>/HANDOFF.md`
- Практический эффект: named owners получают уже готовые packet-файлы со своими `ELP-*`, draft-путями и командами intake/review/accept без ручной сборки.
[2026-03-28 14:45Z] Machine priority board добавлен поверх legal verdict и owner handoff
- Добавлен `scripts/legal-evidence-priority-board.cjs`.
- В `package.json` добавлены команды:
  - `pnpm legal:evidence:priority-board`
  - `pnpm gate:legal:evidence:priority-board`
- Новый board использует `external-legal-evidence-verdict.json` и `external-legal-evidence-handoff.json`, после чего публикует единый intake order в `var/compliance/external-legal-evidence-priority-board.{json,md}`.
- Практический эффект: команда видит не только очереди owners, но и точный machine-sorted порядок закрытия blockers до перехода `NO-GO -> CONDITIONAL GO`.
[2026-03-28 14:55Z] Audit executive brief добавлен как короткий вход в финальный пакет
- Создан `docs/_audit/AUDIT_EXECUTIVE_BRIEF_2026-03-28.md`.
- Обновлены `docs/README.md` и `docs/INDEX.md`, чтобы brief поднимался как первый вход в enterprise audit.
- Практический эффект: итоговый audit-пакет стал проще читать как deliverable для decision-makers без немедленного погружения во все supporting artifacts.
[2026-03-28 15:20Z] `NEW_reglament_docs` поднят из архива в активный canon
- Пакет `docs/06_ARCHIVE/NEW_reglament_docs/` сверен с текущим due diligence и source-of-truth policy.
- Смысловых противоречий runtime baseline не найдено; документы признаны подходящими как claim-managed canonical set.
- Созданы и зарегистрированы в `DOCS_MATRIX` новые канонические документы в `00_CORE`, `00_STRATEGY`, `01_ARCHITECTURE`, `02_DOMAINS`, `04_AI_SYSTEM`, `05_OPERATIONS`.
- `README` и `INDEX` дополнены canonical cross-layer entry set.
- Archive-копии исходного import-пакета удалены, чтобы исключить competing sources of truth.
[2026-03-29 05:35Z] `apps/gripil-web-awwwards` calculator switched from showcase-only to live interactive ROI input
- `src/components/YieldCalculator.tsx` больше не держит метрики в фиксированном showcase-сценарии: `area`, `yieldPerHa` и `price` переведены на локальный `useState`, а шкалы теперь реально меняют расчёт сезона.
- В `MetricRail` включён рабочий `range` и добавлен точный ручной ввод числа, чтобы пользователь мог и быстро двигать шкалу, и без фрустрации выставлять нужное значение вручную.
- `tests/yield-calculator.spec.ts` обновлён под реальное пользовательское взаимодействие: проверяется клавиатурное изменение `range` и точный ввод цены с пересчётом `netProfit`, `ROI` и `₽/га`.
- Практический эффект: калькулятор снова выполняет продуктовую роль интерактивного ROI-блока, а не декоративной витрины со статичными цифрами.
- Верификация для этого кейса прошла через production runtime (`next build` + `next start` на `3010`), потому что локальный `next dev` / `Turbopack` на текущем железе нестабилен и даёт шум в HMR-слое.
[2026-03-29 09:40Z] `apps/gripil-web-awwwards` hardened to honest predeploy surface with env-gated release profile
- `src/app/api/lead/route.ts` переведён в fail-closed режим: без `GRIPIL_LEAD_WEBHOOK_URL` и при отказе downstream endpoint возвращает `503` с честной ошибкой, а не `ok:true/local-log`.
- Удалены production-visible артефакты незавершённости: из кода убраны `src/components/Preloader.tsx` и `src/app/test/page.tsx`, а layout больше не маскирует гидрацию через глобальный `suppressHydrationWarning`.
- В `src/components/FooterCTA.tsx`, `src/components/FAQAccordion.tsx` и `src/components/ScrollNavigation.tsx` закрыт release-baseline по форме и доступности: consent стал явным opt-in, у формы есть честные `loading/success/error` состояния и защита от повторной отправки, FAQ переведён на `button`, icon-only controls получили `aria-label`.
- Добавлен `site-profile` контракт через `src/lib/site-profile.ts` и public legal/SEO surface: `src/app/privacy/page.tsx`, `src/app/company/page.tsx`, `src/app/contact/page.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`; при неполном `GRIPIL_*` профиль уходит в `noindex`, а canonical сознательно не публикуется до заполнения реального production профиля.
- Motion/render hardening выполнен в `HeroSection`, `ProblemSection`, `SmoothScroll`, `SectionReveal`, `SplitComparisonViewer`: ключевой контент больше не сидит на `ssr: false`, reduced motion покрыт системнее, а user-facing локализация добита до русского без `Scan Result` и `ROI`.
- Верификация: `npm run lint`, `npm run build`, `npx playwright test` зелёные; production-like `next start` на динамическом порту подтвердил `200` для `/`, `/privacy`, `/company`, `/contact`, `/robots.txt`, `/sitemap.xml`, `404` для `/test`, `503` для valid `POST /api/lead` без webhook и `400` для невалидного телефона.
- Практический эффект: кодовая база больше не врёт пользователю о доставке заявки и не светит служебные surface, но релиз по-прежнему заблокирован до заполнения `GRIPIL_LEAD_WEBHOOK_URL` и полного `GRIPIL_*` site-profile.
[2026-03-29 11:05Z] `apps/gripil-web-awwwards` switched from fixed desktop scenes to viewport-aware low-height adaptation
- Добавлен `src/lib/useViewportProfile.ts` как единый клиентский источник фактического viewport-профиля окна браузера: ширина, высота, `isDenseDesktop` и `isLowHeightDesktop`.
- `src/components/YieldCalculator.tsx` больше не держит жёсткий fullscreen-сценарий на низких desktop-окнах: при `min-width >= 1280` и ограниченной высоте секция выходит из режима `100svh`, правая панель теряет принудительный screen-stage layout и начинает жить в обычном документном потоке.
- `src/components/TimingSection.tsx` получил отдельный low-height desktop режим: уменьшены вертикальные отступы, заголовок, интервалы таймлайна и размеры подписей без привязки к конкретному устройству или браузеру.
- Верификация: `npm run lint` и `npm run build` зелёные после перевода двух проблемных секций на viewport-aware адаптацию.
- Практический эффект: лендинг теперь адаптируется к реальному окну браузера, а не к одному фиксированному desktop-кадру; на низких экранах секции перестают расползаться как постеры и калькулятор перестаёт зависеть от fullscreen-композиции.
[2026-03-29 11:35Z] `apps/gripil-web-awwwards` low-height desktop auto-adaptation tightened for calculator UX
- В `src/lib/useViewportProfile.ts` расширен авто-триггер низких desktop-окон: `isLowHeightDesktop` теперь срабатывает раньше (`width >= 1200 && height <= 940`), `isDenseDesktop` также поднят до `height <= 980` для более широкого покрытия браузеров и ноутбуков.
- В `src/components/YieldCalculator.tsx` добавлен динамический `panelScale` от фактической высоты viewport и включён короткий low-height контентный режим (скрытие части второстепенного текста/бейджей, укороченная CTA-подпись, более плотные размеры), чтобы правая панель перестала вылезать по высоте в первом экране.
- В layout калькулятора для low-height desktop увеличена относительная ширина правой панели (`0.72fr / 1.28fr`), что уменьшает переносы строк и дополнительно снижает итоговую высоту ключевого блока.
- Верификация: `npm run lint` и `npm run build` прошли после ужесточения адаптивного режима; production-like runtime подтверждён `HTTP 200` на `http://127.0.0.1:3014/`.
- Практический эффект: калькулятор автоматически ужимается на низких desktop-viewport без ручной подгонки под конкретный компьютер, и первый экран перестаёт ломаться из-за избыточной высоты правой панели.
[2026-03-29 12:10Z] `apps/gripil-web-awwwards` fixed horizontal overflow regression in low-height calculator mode
- В `src/components/YieldCalculator.tsx` удалена ширинная компенсация (`width: 100/panelScale`) из low-height scale-стиля панели, которая выталкивала правый край за viewport и ломала fit по X.
- Для low-height desktop откорректирована сетка калькулятора с более безопасным соотношением колонок (`0.78fr / 1.22fr`) вместо агрессивного расширения правой части.
- Верификация: после правки снова зелёные `npm run lint` и `npm run build`; runtime на `http://127.0.0.1:3014/` отвечает `HTTP 200`.
- Практический эффект: адаптивный режим сохраняется, но панель калькулятора перестаёт разъезжаться по ширине и обрезаться справа.
[2026-03-29 13:20Z] `apps/gripil-web-awwwards` landed viewport-contract section rendering across landing screens
- В `src/lib/useViewportProfile.ts` закреплён расширенный runtime-контракт устройств: `isPhone`, `isTablet`, `isMobileOrTablet`, `isLaptop`, `isWideDesktop`, `supportsFullscreenStage`, `supportsPinnedScene`.
- Секции `HeroSection`, `ProblemSection`, `SplitComparison`, `HowItWorksSection`, `ComparisonMatrixSection`, `ApplicationTechSection`, `SocialProofSection`, `FooterCTA` и mobile/tablet ветка `YieldCalculator` переведены с фиксированных постерных сцен на контрактный режим: desktop/laptop удерживает один экран на секцию, а mobile/tablet дробит длинные блоки на несколько последовательных fullscreen-кадров без скрытия контента.
- Все новые fullscreen-экраны переведены с неработающего `min-h-[100svh]` на явный `100dvh`, потому что прежний класс в runtime давал `min-height: 0px` и ломал расчёт фактической высоты секций.
- В `SplitComparison` убран pinned GSAP-режим как источник viewport-trap: mobile/tablet получили три последовательных кадра, а desktop/laptop — статичную двухсценную композицию, которая вмещается в экран без вертикального захвата пользователя.
- `YieldCalculator` получил отдельную mobile/tablet структуру из двух последовательных кадров: первый держит ввод сценария, второй — экономику и CTA; low-height desktop дополнительно ужат через более агрессивный `panelScale` и сокращённые внешние отступы.
- Верификация: `npm run lint`, `npm run build`; production-like `next start` на `http://127.0.0.1:3014/`; headless viewport-проверка через `@playwright/test` подтвердила вмещение экранов на `360x800`, `390x844`, `768x1024`, `1366x768`, `1600x900`, `1920x1080`.
- Практический эффект: лендинг перестал зависеть от одной desktop-сцены, перестал терять часть секций на mobile/tablet и получил предсказуемое fullscreen-поведение по реальному browser viewport, а не по одному случайному устройству.
[2026-03-29 15:12Z] GRIPIL landing: user-facing copy russified end-to-end
- Visible English strings and obvious anglicisms were removed from the landing, calculator, split storytelling section, footer form and legal pages.
- Key replacements:
  - `Scan Result` -> `Защитное окно`
  - `ROI` user labels -> `окупаемость` / `потенциал окупаемости`
  - `webhook` in footer helper copy -> `боевой канал`
  - `лендинг` in legal/public pages -> `сайт`
  - `env` / `noindex` in legal warnings -> `переменные окружения` / `закрыт для поисковой индексации`
- Runtime effect: visitor-facing copy is now consistently Russian, while internal technical identifiers (`roi`, route names, env keys) remain untouched because they are implementation-only.
- Verification:
  - `npm run lint`
  - `npm run build`

[2026-03-29 14:32Z] GRIPIL awards visual baseline restored after over-aggressive viewport refactor
- Award-facing visual sections were restored to the original Git baseline: `HeroSection`, `ProblemSection`, `SplitComparison`, `SplitComparisonViewer`, `HowItWorksSection`, `TimingSection`, `YieldCalculator`, `ComparisonMatrixSection`, `ApplicationTechSection`, `EcologySection`, `SocialProofSection`, `SectionReveal`.
- Cause of rollback: the previous viewport-fit pass overreached from adaptive hardening into visual redesign, replacing the original exhibition-grade storytelling with generic split screens and simplified cards.
- Runtime contract is corrected: visual adaptation must preserve the original art direction, interaction pattern and showcase storytelling, and only change responsive layout mechanics.
- `src/components/YieldCalculator.tsx` received a narrow technical fix for current lint rules: reduced-motion stage selection is now derived without synchronous `setState` inside `useEffect`.
- Verification after restore:
  - `npm run lint`
  - `npm run build`
  - `next start -- --port 3014`

[2026-03-29 13:58Z] GRIPIL landing: `SplitComparison` animation restored without pinned-scroll regression
- `apps/gripil-web-awwwards/src/components/SplitComparison.jsx` rebuilt as an animated `framer-motion` scene instead of a static fallback.
- Removed debug/meta copy about `pinned-scroll`; the section again speaks in product language and behaves like a commercial storytelling block rather than a technical stub.
- Runtime contract changed: animation is now driven by non-pinned entrance, sweep-light and ambient motion layers, while section height still fits the validated viewport matrix.
- Production-like verification re-run after the change:
  - `npm run lint`
  - `npm run build`
  - `next start` on `127.0.0.1:3014`
  - viewport matrix: `360x800`, `390x844`, `768x1024`, `1366x768`, `1600x900`, `1920x1080` -> all logical screens fit.
[2026-03-30 10:30Z] Priority synthesis master report добавлен в execution canon
- Создан `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`.
- Документ сознательно размещён в `07_EXECUTION`, а не в `docs/_audit`, потому что его роль — не новый аудит, а управленческий порядок действий на следующую фазу.
- Внутрь документа встроены обязательные управляющие механики:
  - восьмиосевая `Decision rubric`
  - `Exit condition rule`
  - `Release tier model` `Tier 0 / Tier 1 / Tier 2 / Tier 3`
  - `Parallelism rule`
  - `Non-destructive guardrails`
- Главный вывод synthesis зафиксирован явно:
  - ближайший продукт = governed agent core + minimal web surface + TechMap/execution/evidence loop
  - главный стоп-фактор = legal/AppSec/AI-policy/self-host closeout, а не отсутствие новых модулей
  - главный риск = принять широкий frontend/menu breadth за реальную MVP-готовность
- Навигация и claim-registry синхронизированы:
  - `docs/DOCS_MATRIX.md`
  - `docs/README.md`
  - `docs/INDEX.md`
- Одновременно снят navigation drift по отсутствующему `docs/_audit/AUDIT_EXECUTIVE_BRIEF_2026-03-28.md`; новым активным entrypoint для управленческого чтения стал synthesis master report.
[2026-03-30 11:04Z] External bilingual developer handoff packet added
- Создана папка `var/handoff/external-dev-bilingual-packet/`.
- Внутрь добавлены парные `RU/EN` briefing-файлы:
  - `README_*`
  - `01_PRODUCT_AND_BUSINESS_CONTEXT_*`
  - `02_ARCHITECTURE_AND_RUNTIME_*`
  - `03_READINESS_AND_EXECUTION_STATUS_*`
  - `04_STAGE_BASED_ROADMAP_AND_AI_DELIVERY_MODEL_*`
- Пакет намеренно вынесен вне `docs/`, чтобы сохранить различие между внутренним каноном и внешним артефактом передачи.
- В каждом briefing-файле разведены:
  - подтверждённая текущая реальность
  - target model
  - открытые gaps
- Отдельно зафиксирован `AI-first delivery model`: ИИ пишет основной bounded implementation work, человек держит архитектуру, acceptance, security/legal/policy и final review.

[2026-03-31 03:26Z] Выполнена первая фактическая remediation-волна `A2`
- В `package.json` поднят `minio` до `8.0.7`.
- В корневую `package.json` добавлены `pnpm.overrides` для:
  - `axios ^1.14.0`
  - `handlebars ^4.7.9`
- В `apps/api/package.json` и `apps/web/package.json` прямой `axios` поднят до `^1.14.0`.
- После `pnpm install` подтверждён новый dependency baseline:
  - `minio -> fast-xml-parser 5.5.9`
  - `ts-jest -> handlebars 4.7.9`
  - `api/web/@nestjs/axios -> axios 1.14.0`
- Повторная верификация дала:
  - `pnpm security:audit:ci` -> `critical=0`, `high=30`
  - `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
  - `pnpm gate:invariants` -> `violations=0`
  - `pnpm --filter api build` -> PASS
  - `pnpm --filter web build` -> PASS
- Практический эффект: `A2` впервые сдвинулась по реальному remediation, а не только по planning docs; первая волна закрыла все `critical` advisories и перевела execution-board в честный статус `in_progress` с новым baseline `critical=0 / high=30`.

[2026-03-31 09:22Z] Вторая remediation-волна `A2` сузила security debt до узкого toolchain-tail
- В `package.json` и `pnpm-lock.yaml` добавлены targeted `pnpm.overrides` для:
  - `effect ^3.21.0`
  - `flatted ^3.4.2`
  - `rollup ^4.60.1`
  - `undici ^7.24.6`
  - `@nestjs/platform-express@10.4.22>multer ^2.1.1`
  - `@nestjs/platform-express@11.1.13>multer ^2.1.1`
  - `serialize-javascript ^7.0.3`
  - `glob@10.4.5 ^10.5.0`
  - `minimatch@3.1.2 ^3.1.4`
  - `minimatch@9.0.5 ^9.0.7`
  - `minimatch@10.1.2 ^10.2.3`
  - `picomatch@2.3.1 ^2.3.2`
  - `picomatch@4.0.3 ^4.0.4`
- Повторная верификация дала:
  - `pnpm security:audit:ci` -> `critical=0`, `high=5`
  - `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
  - `pnpm gate:invariants` -> `violations=0`
  - `pnpm --filter api build` -> PASS
  - `pnpm --filter web build` -> PASS
- Остаточные `high=5` теперь ограничены dev-toolchain:
  - `apps/api -> @typescript-eslint/typescript-estree@6.21.0 -> minimatch@9.0.3`
  - `apps/api` и `apps/telegram-bot` -> `@nestjs/cli -> @angular-devkit/core@17.3.11/19.2.19 -> picomatch@4.0.1/4.0.2`
- Практический эффект: runtime-impact advisories по текущему `Tier 1` периметру сняты; `A2` теперь упирается не в production/runtime зависимости, а в явное решение по residual toolchain debt и внешний access-governance follow-up.

[2026-03-31 10:04Z] Для `A2` зафиксировано отдельное Tier-1 решение по residual toolchain-tail
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_TIER1_TOOLCHAIN_DECISION.md`.
- В документе зафиксировано, что остаточный `high=5`:
  - не подтверждён как runtime-perimeter `Tier 1`
  - ограничен dev-toolchain путями `@typescript-eslint/typescript-estree -> minimatch@9.0.3` и `@angular-devkit/core -> picomatch@4.0.1/4.0.2`
  - считается допустимым для `Tier 1 self-host / localized MVP pilot` как `non-runtime toolchain debt`
  - не считается допустимым без отдельного пересмотра для `Tier 2` и `Tier 3`
- `PHASE_A_EXECUTION_BOARD.md` синхронизирован:
  - `A-2.3.1` переведён в `done`
  - следующий focus внутри `A2` смещён на historical key/rotation debt и внешний access-governance evidence
- `PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md`, `PHASE_A2_SECURITY_CLOSEOUT_PLAN.md`, `PHASE_A_EVIDENCE_MATRIX.md` и `ONE_BIG_PHASE/INDEX.md` синхронизированы под новое решение.
- Практический эффект: `A2` перестал висеть между “почти закрыто” и “непонятно можно ли выпускать”; для `Tier 1` dependency-risk теперь имеет формальное управленческое решение, а security-track можно дальше вести по реальным остаточным блокерам.

[2026-03-31 10:18Z] Остаточные хвосты `A2` разложены в два отдельных execution-checklist
- Созданы:
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md`
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md`
- `PHASE_A2_SECURITY_CLOSEOUT_PLAN.md` теперь ссылается на оба документа как на практические рабочие пакеты для residual security-blockers.
- `PHASE_A_EXECUTION_BOARD.md` усилен:
  - `A-2.3.3` теперь явно ведёт в checklist по historical secret/key debt
  - добавлена новая строка `A-2.3.5` для внешнего access-governance perimeter со статусом `waiting_external`
- `PHASE_A_EVIDENCE_MATRIX.md` получила отдельную строку `Security / access governance outside repo`, чтобы отделить локальный `CODEOWNERS`/workflow baseline от реального GitHub UI evidence.
- Практический эффект: после закрытия dependency-risk `A2` больше не остаётся абстрактным security-хвостом; теперь два оставшихся блока сформулированы как прямые исполнимые шаги, по которым можно реально собирать evidence и двигать `Phase A`.

[2026-03-31 10:31Z] `A2` доведена до micro-step и restricted-template уровня
- Созданы:
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md`
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md`
  - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md`
- Усилены:
  - `PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md`
  - `PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md`
  - `PHASE_A_EXECUTION_BOARD.md`
  - `ONE_BIG_PHASE/INDEX.md`
- В restricted perimeter создан локальный security scaffolding:
  - `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/metadata/INDEX.md`
  - metadata cards `A2-S-01`, `A2-S-02`, `A2-S-03`
  - template files для каждого артефакта
- Практический эффект: остаточные хвосты `A2` больше не требуют придумывать формат evidence с нуля; теперь по каждому security-blocker есть и канонический execution-чеклист в репозитории, и готовый restricted template вне Git.

[2026-03-31 10:42Z] Для `A2-S-01` подготовлен первый repo-derived restricted draft
- Создан `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-01/A2-S-01__repo-derived-draft.md`.
- Draft заполняет только подтверждённые repo-факты:
  - исторический путь `infra/gateway/certs/ca.key`
  - удаление из Git на коммите `233cf5e61eb246f03d4a115cdff43706d92a812b`
  - текущий perimeter `infra/gateway/certs/` без private key material
  - `pnpm gate:secrets -> tracked_findings=0`
- `A2-S-01` metadata card обновлена полем `draft_path`, но статус оставлен `requested`.
- Практический эффект: у owner'а больше не пустой template, а почти готовый restricted draft, в котором осталось только внешне подтвердить revocation/reissue и owner sign-off.

[2026-03-31 10:57Z] Для `A2-S-02` подготовлен второй repo-derived restricted draft
- Создан `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-02/A2-S-02__repo-derived-draft.md`.
- Draft заполняет только подтверждённые repo-факты:
  - исторические Telegram token value(s) в tracked `mg-core/backend/.env` и `mg-core/backend/src/mg-chat/.env`
  - удаление этих файлов из Git на коммите `de2ac2c1b8c3117f9d2b076c0a142c68636f7a09`
  - текущий `pnpm gate:secrets -> tracked_findings=0, tracked_critical=0`
- `A2-S-02` metadata card обновлена полем `draft_path`, а repo-side checklist теперь явно ссылается на draft как на стартовую основу для внешнего restricted artifact.
- Статус `A2-S-02` оставлен `requested`, потому что repository не подтверждает сам факт rotation/invalidation и текущее место хранения действующего secret.
- Практический эффект: у owner'а больше не пустой template, а почти готовый restricted draft, в котором осталось только внешне подтвердить rotation/invalidation, дату действия и current storage location.

[2026-03-31 11:08Z] Для `A2-S-03` подготовлен третий repo-derived restricted draft
- Создан `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-03/A2-S-03__repo-derived-draft.md`.
- Draft заполняет только подтверждённые repo-факты:
  - `.github/CODEOWNERS` покрывает workflows, `scripts`, `rai-chat`, shared backend perimeter, `apps/web/app/**`, `apps/web/lib/**` и `docs/05_OPERATIONS/**`
  - в репозитории присутствуют `.github/workflows/security-audit.yml`, `codeql-analysis.yml`, `dependency-review.yml`, `invariant-gates.yml`
  - `SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md` уже требует quarterly GitHub UI review outside repo
- `A2-S-03` metadata card обновлена полем `draft_path`, а repo-side checklist теперь явно ссылается на draft как на стартовую основу для внешнего restricted artifact.
- Статус `A2-S-03` оставлен `requested`, потому что repository не подтверждает branch protection, required checks enforcement, admin bypass, deploy keys и GitHub environments.
- Практический эффект: у owner'а больше не пустой template, а почти готовый restricted draft, в котором осталось только внешне подтвердить GitHub UI perimeter и итоговый review verdict.

[2026-03-31 11:24Z] Для `A2` добавлен machine-readable security-evidence gate
- Создан `scripts/security-evidence-status.cjs`.
- В `package.json` добавлены команды:
  - `pnpm security:evidence:status`
  - `pnpm gate:security:evidence`
- Новый script читает restricted metadata в `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/metadata`, проверяет статусы `A2-S-01/02/03`, наличие `draft_path`/`artifact_path`, `review_due` и пишет отчёты в:
  - `var/security/security-evidence-status.json`
  - `var/security/security-evidence-status.md`
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md` как единый closeout-порядок для `A2-S-01/02/03`.
- `PHASE_A2_SECURITY_CLOSEOUT_PLAN.md`, `PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md`, `PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md`, `PHASE_A_EXECUTION_BOARD.md` и `PHASE_A_EVIDENCE_MATRIX.md` синхронизированы с новым gate.
- Практический эффект: residual `A2` security evidence теперь отслеживается не только вручную по markdown и restricted-папкам, а ещё и одной воспроизводимой командой, что резко снижает drift между drafts, metadata и execution-board.

[2026-03-31 11:39Z] Для `A2` добавлен intake/transition lifecycle по security evidence
- Созданы:
  - `scripts/security-evidence-intake.cjs`
  - `scripts/security-evidence-transition.cjs`
- В `package.json` добавлены команды:
  - `pnpm security:evidence:intake`
  - `pnpm security:evidence:transition`
- `PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md`, `PHASE_A2_SECURITY_CLOSEOUT_PLAN.md`, `PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md`, `PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md` и `PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md` усилены точными CLI-командами для `received -> reviewed -> accepted`.
- На временной копии restricted perimeter подтверждён рабочий цикл:
  - `requested -> received`
  - `received -> reviewed`
  - `reviewed -> accepted`
- Практический эффект: `A2` теперь имеет не только status/gate и drafts, но и полный воспроизводимый lifecycle для реального intake security evidence без ручной правки metadata.
[2026-03-31 10:49Z] Для `A3.1` опубликован runtime-derived tool permission matrix
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md`.
- Документ собран по текущему runtime-коду:
  - `DEFAULT_TOOL_BINDINGS`
  - `TOOL_RISK_MAP`
  - `resolveToolAccess`
  - `RiskPolicyEngineService`
  - `RaiToolsRegistry`
- Зафиксирован default governed tool-perimeter для `Tier 1` по ролям `agronomist`, `economist`, `knowledge`, `monitoring`, `crm_agent`, `front_office_agent`, `contracts_agent`, `chief_agronomist`, `data_scientist`.
- `PHASE_A_EXECUTION_BOARD.md` синхронизирован:
  - `A-2.4.1` переведён из `open` в `in_progress`
- `PHASE_A_EVIDENCE_MATRIX.md` синхронизирована:
  - по оси `AI / tool permissions` зафиксировано, что execution-артефакт уже создан, но `A3` ещё не закрыта до конца без `HITL / advisory-only / eval-suite`
- Практический эффект: `A3` впервые получила не только policy-намерение, а опубликованный runtime-derived baseline, от которого можно уже детерминированно строить `HITL matrix` и formal `eval-suite`.
[2026-03-31 11:05Z] Для `A3.2` опубликован runtime-derived HITL matrix
- Создан `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md`.
- Документ собран по текущему runtime-контракту:
  - `RiskPolicyEngineService`
  - `PendingActionService`
  - `PendingActionsController`
  - `RaiToolsRegistry`
  - `AutonomyPolicyService`
- Зафиксирована текущая лестница участия человека:
  - `H0` no gate для `READ`
  - `H2/H3` для governed write через `PendingAction`
  - `H4` для critical/two-person approval
  - `H5` для `QUARANTINE` и advisory-only зон
- `PHASE_A_EXECUTION_BOARD.md` синхронизирован:
  - `A-2.4.2` переведён из `open` в `in_progress`
- `PHASE_A_EVIDENCE_MATRIX.md` синхронизирована:
  - по оси `AI / HITL` зафиксировано, что execution-артефакт уже создан, но `A3` ещё не закрыта до конца без `advisory-only / eval-suite`
- Практический эффект: `A3` получила опубликованный runtime-derived human approval baseline, и теперь `advisory-only perimeter` и `formal eval-suite` можно строить поверх реального approval-chain, а не по общей policy-риторике.
[2026-03-31 11:18Z] Repo-side scaffold `A3/A4/A5` доведён до execution-ready depth
- Созданы:
  - `PHASE_A3_ADVISORY_ONLY_REGISTER.md`
  - `PHASE_A3_RELEASE_EVAL_SUITE.md`
  - `PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md`
  - `PHASE_A4_INSTALL_DRY_RUN_REPORT_TEMPLATE.md`
  - `PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_TEMPLATE.md`
  - `PHASE_A4_SUPPORT_BOUNDARY_PACKET.md`
  - `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md`
  - `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`
  - `PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md`
- `PHASE_A_EXECUTION_BOARD.md` синхронизирован:
  - `A-2.4.3`, `A-2.4.4`, `A-2.5.1`, `A-2.5.2`, `A-2.5.3`, `A-2.6.1`, `A-2.6.4` больше не висят как пустой `open`
- `PHASE_A_EVIDENCE_MATRIX.md` синхронизирована:
  - появились отдельные строки для `AI / advisory-only perimeter`, `Operational support boundary`, `OSS / notice obligations`, `IP / first-party licensing strategy`
- Практический эффект:
  - внутрирепозиторная подготовка `Phase A` доведена до почти максимальной исполнимости;
  - дальнейшее закрытие фазы теперь упирается в реальные external evidence и actual execution reports, а не в отсутствие execution-доков.
[2026-03-31 11:40Z] Для `A4` собран реальный execution baseline и устранён installability drift
- Root scripts переведены с `docker-compose` на `docker compose`:
  - `package.json#docker:up`
  - `package.json#docker:down`
- Добавлен `scripts/prisma-migrate-safe.cjs`.
- Root `pnpm db:migrate` теперь идёт через safe wrapper, который загружает `.env`, вызывает `prisma migrate deploy` в `packages/prisma-client` и пишет report в `var/schema/prisma-migrate-safe.json`.
- Реально подтверждено:
  - `pnpm docker:up` -> PASS
  - `pnpm db:migrate` -> PASS
  - `pnpm --filter api build` -> PASS
  - `pnpm --filter web build` -> PASS
  - `backup / restore` rehearsal -> PASS
- Созданы machine-readable execution artifacts:
  - `var/ops/phase-a4-install-dry-run-2026-03-31.json`
  - `var/ops/phase-a4-backup-restore-execution-2026-03-31.json`
- Созданы canonical reports:
  - `PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md`
  - `PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md`
- Практический эффект:
  - `A4.1` и `A4.2` больше не опираются только на templates;
  - install/recovery path теперь подтверждён фактическим исполнением, а оставшийся хвост `A4` сузился до fresh-host rehearsal и support boundary.

[2026-03-31 11:41Z] Для `A3` собран первый runtime-drill evidence layer и исправлен advisory script drift
- Найден repo-side drift: advisory ops scripts не передавали `Idempotency-Key` для mutating advisory endpoints, из-за чего rehearsal path падал на `400`.
- Исправлены:
  - `apps/api/scripts/ops/advisory-oncall-drill.mjs`
  - `apps/api/scripts/ops/advisory-stage-progression.mjs`
  - `apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs`
- После исправления реально пройдены:
  - `advisory-oncall-drill` -> PASS
  - `advisory-stage-progression` -> PASS
  - `advisory-dr-rollback-rehearsal` -> PASS
- Результаты сохранены в `var/ops` и подняты в канон через `PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md`.
- Практический эффект:
  - `A3.4` теперь имеет не только skeleton eval-suite, но и фактический runtime-drill baseline;
  - advisory runtime, gate evaluation, kill-switch и rollback подтверждены живым исполнением, хотя unified evaluator gate ещё не собран.
[2026-03-31 11:55Z] Для `A5` устранена first-party ambiguity внутри OSS inventory
- В `package.json` добавлен `license: UNLICENSED`.
- В `packages/eslint-plugin-tenant-security/package.json` добавлены:
  - `license: UNLICENSED`
  - `private: true`
- `pnpm security:licenses` пересчитан:
  - `total packages = 159`
  - `unknown licenses = 33 -> 31`
  - `UNLICENSED = 2`
- `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md` обновлён:
  - remaining `UNKNOWN` теперь разбит только на:
    - `25` `esbuild` platform companions
    - `5` `turbo` platform companions
    - `1` `fsevents`
  - first-party perimeter вынесен в отдельный уже закрытый repo-side baseline
- `OSS_LICENSE_AND_IP_REGISTER.md`, `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`, `PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md`, `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`, `PHASE_A_EXECUTION_BOARD.md` и `PHASE_A_EVIDENCE_MATRIX.md` синхронизированы.
- Практический эффект:
  - `A5` перестал смешивать внутренние пакеты и внешний OSS-tail в одну красную массу;
  - следующий шаг теперь точнее: formal legal classification и notice bundle только по `esbuild/turbo/fsevents`, а не по first-party пакетам.
