# Progress Report - Prisma, Agro Domain & RAI Chat Integration

## 2026-03-31

1. **Phase A external blockers packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a-external-blockers-packet.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a:external-blockers`
    - `pnpm gate:phase:a:external-blockers`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_BLOCKERS_PACKET.md`
  - Generated evidence выпускается в:
    - `var/execution/phase-a-external-blockers-packet.json`
    - `var/execution/phase-a-external-blockers-packet.md`
  - Restricted delivery packet выпускается в:
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-BLOCKERS/REQUEST_PACKET.md`
  - Практический эффект:
    - весь оставшийся внешний blocker-set `A1/A2/A4/A5` теперь открывается одной точкой входа;
    - legal, security, pilot handoff и chain-of-title перестали быть разорванными operational хвостами;
    - `Phase A` ещё сильнее сместилась к реальному внешнему intake и ещё меньше зависит от ручной навигации между packet-слоями.

1. **A1 owner queue packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a1-owner-queues.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a1:owner-queues`
    - `pnpm gate:phase:a1:owner-queues`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_OWNER_QUEUE_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a1-owner-queues.json`
    - `var/compliance/phase-a1-owner-queues.md`
  - Restricted owner packets выпускаются в:
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-OWNER-QUEUES/INDEX.md`
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-OWNER-QUEUES/<owner>/HANDOFF.md`
  - Практический эффект:
    - `A1` теперь читается не только как priority-eight packet, но и как owner-by-owner очередь;
    - внешний legal intake можно запускать по реальным owner scopes;
    - repo-side closeout ещё сильнее смещён к живому external evidence, а не к ручной организационной раскладке.

1. **A3 DR rollback drill stabilized for repeated gates** [DONE]:
  - В `apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs` и `apps/api/scripts/ops/advisory-stage-progression.mjs` добавлен retry/backoff на `429` при `login`
  - Практический эффект:
    - `phase:a3:evals` перестаёт случайно падать на transient auth rate-limit;
    - `phase:a:status` и `gate:phase:a:status` становятся воспроизводимыми при последовательных прогонах;
    - `A3` снова оценивается по реальному governance/runtime поведению, а не по флейку drill-а.

1. **Phase A unified status gate assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a-status.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a:status`
    - `pnpm gate:phase:a:status`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_STATUS_GATE.md`
  - Generated evidence выпускается в:
    - `var/execution/phase-a-status.json`
    - `var/execution/phase-a-status.md`
  - Этот слой связывает:
    - `phase-a1-status`
    - `security-evidence-status`
    - `phase-a3-release-eval-summary`
    - `phase-a4-pilot-handoff-status`
    - `phase-a5-status`
  - Практический эффект:
    - вся `Phase A` теперь читается одной машинной командой;
    - сразу видно, какие треки уже repo-side complete, а какие всё ещё внешне заблокированы;
    - главный остаток фазы перестал быть размазан по отдельным packet-слоям.

1. **A1 priority-eight request packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a1-priority-eight-request-packet.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a1:priority-eight:packet`
    - `pnpm gate:phase:a1:priority-eight:packet`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a1-priority-eight-request-packet.json`
    - `var/compliance/phase-a1-priority-eight-request-packet.md`
  - Restricted delivery packet выпускается в:
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-PRIORITY-EIGHT/REQUEST_PACKET.md`
  - Практический эффект:
    - весь legal blocker-set до `CONDITIONAL GO` теперь открывается одним owner-facing файлом;
    - первая и вторая wave остаются разделёнными по порядку, но управляются из одной точки входа;
    - repo-side closeout `A1` доведён почти до потолка перед живым external intake.

1. **A1 second-wave request packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a1-second-wave-request-packet.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a1:second-wave:packet`
    - `pnpm gate:phase:a1:second-wave:packet`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a1-second-wave-request-packet.json`
    - `var/compliance/phase-a1-second-wave-request-packet.md`
  - Restricted delivery packet выпускается в:
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-SECOND-WAVE/REQUEST_PACKET.md`
  - Практический эффект:
    - после первой волны `A1` не упрётся в новый слой ручной сборки;
    - `ELP-02 / 05 / 08 / 09` уже собраны в owner-ready очередь;
    - legal closeout теперь подготовлен по обеим priority-wave, а не только по стартовой четвёрке.

1. **A1 unified status gate assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a1-status.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a1:status`
    - `pnpm gate:phase:a1:status`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a1-status.json`
    - `var/compliance/phase-a1-status.md`
  - Этот слой связывает:
    - `external-legal-evidence-status`
    - `external-legal-evidence-verdict`
    - `phase-a1-first-wave-request-packet`
    - `phase-a1-first-wave-status`
    - вторую волну `ELP-02 / 05 / 08 / 09`
  - Практический эффект:
    - весь `A1` теперь виден одной командой как единый legal-track;
    - первая и вторая волна больше не смешиваются в один неявный backlog;
    - repo-side closeout `A1` стал управляемым так же, как `A2`, `A4` и `A5`.

1. **A1 first-wave status gate assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a1-first-wave-status.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a1:first-wave:status`
    - `pnpm gate:phase:a1:first-wave:status`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_STATUS_GATE.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a1-first-wave-status.json`
    - `var/compliance/phase-a1-first-wave-status.md`
  - Этот слой связывает:
    - `phase-a1-first-wave-request-packet`
    - `external-legal-evidence-verdict`
    - wave-state `not_started / in_progress / completed`
  - Синхронизированы:
    - `PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md`
    - `PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`
    - `PHASE_A1_LEGAL_CLOSEOUT_PLAN.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - первая legal-четвёрка теперь видна одной командой не только как packet, но и как состояние исполнения;
    - стало машинно видно, начался ли реальный intake или волна всё ещё стоит в `requested`;
    - `A1` ещё сильнее сместилась от repo-side подготовки к фактическому внешнему evidence intake.

1. **A1 first-wave request packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a1-first-wave-request-packet.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a1:first-wave:packet`
    - `pnpm gate:phase:a1:first-wave:packet`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a1-first-wave-request-packet.json`
    - `var/compliance/phase-a1-first-wave-request-packet.md`
  - В restricted evidence store выпускается:
    - `request-packets/PHASE-A1-FIRST-WAVE/REQUEST_PACKET.md`
  - Синхронизированы:
    - `PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`
    - `PHASE_A1_LEGAL_CLOSEOUT_PLAN.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - первая legal-волна теперь открывается одним owner-facing packet, а не рассыпана по status, draft, four checklists и priority-board;
    - `A1` честно остаётся внешне заблокированной, но её первый execution-slice стал существенно проще запускать;
    - remaining blocker ещё сильнее смещён от repo-side подготовки к реальному intake внешних документов.

1. **A5 unified status gate assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-status.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:status`
    - `pnpm gate:phase:a5:status`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_STATUS_GATE.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a5-status.json`
    - `var/compliance/phase-a5-status.md`
  - Фактический baseline должен сводиться в один machine-readable verdict:
    - `A5.1 = done_for_tier1`
    - `A5.2 = assembled_for_tier1`
    - `A5.3 repo-side = complete`
    - `A5.3 external = requested`
    - `A5.4 = done_for_tier1`
    - `current_state = external_blocked`
    - `tier1_state = conditional_ready_pending_elp09`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A5` теперь читается одной командой, а не вручную по множеству packet-слоёв;
    - repo-side closeout и внешний blocker `ELP-20260328-09` разделены честно и машинно;
    - `Tier 1` больше не висит в серой зоне между “почти готово” и “непонятно, чего не хватает”.

1. **A5 chain-of-title delivery packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-chain-of-title-delivery-packet.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:chain-of-title:delivery-packet`
    - `pnpm gate:phase:a5:chain-of-title:delivery-packet`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_DELIVERY_PACKET.md`
  - В restricted evidence store реально выпущен:
    - `request-packets/ELP-20260328-09/REQUEST_PACKET.md`
  - Фактический baseline:
    - `total_assets = 18`
    - `owner_queues = 3`
    - delivery packet содержит owner packet index и intake commands для `ELP-20260328-09`
    - `pnpm gate:phase:a5:chain-of-title:delivery-packet` -> `PASS`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A5.3` теперь delivery-ready в restricted perimeter, а не только request-ready в `var/compliance`;
    - repo-side подготовка `ELP-20260328-09` практически выжата до потолка;
    - remaining blocker окончательно смещён к реальному external signed intake.

1. **A5 chain-of-title request packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-chain-of-title-request-packet.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:chain-of-title:request-packet`
    - `pnpm gate:phase:a5:chain-of-title:request-packet`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_REQUEST_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a5-chain-of-title-request-packet.json`
    - `var/compliance/phase-a5-chain-of-title-request-packet.md`
  - Фактический baseline:
    - `total_assets = 18`
    - `owner_queues = 3`
    - request packet уже ссылается на restricted owner packets по всем трём owner scopes
    - `pnpm gate:phase:a5:chain-of-title:request-packet` -> `PASS`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A5.3` теперь request-ready, а не только owner-ready;
    - repo-side подготовка `ELP-20260328-09` практически выжата до конца;
    - remaining blocker окончательно смещён к реальному external signed intake.

1. **A5 chain-of-title owner packets assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-chain-of-title-owner-packets.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:chain-of-title:owner-packets`
    - `pnpm gate:phase:a5:chain-of-title:owner-packets`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_OWNER_PACKETS.md`
  - В restricted evidence store реально выпущены:
    - `chain-of-title-owner-packets/INDEX.md`
    - `chain-of-title-owner-packets/board_legal_product-governance/HANDOFF.md`
    - `chain-of-title-owner-packets/legal_data_governance_architecture/HANDOFF.md`
    - `chain-of-title-owner-packets/legal_engineering_management/HANDOFF.md`
  - Фактический baseline:
    - `total_assets = 18`
    - `owner_queues = 3`
    - `board / legal / product-governance = 1`
    - `legal / data governance / architecture = 3`
    - `legal / engineering management = 14`
    - `pnpm gate:phase:a5:chain-of-title:owner-packets` -> `PASS`
  - Restricted `ELP-20260328-09` draft/template усилены ссылками на:
    - `collection packet`
    - `handoff packet`
    - `owner packets`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `ELP-20260328-09` теперь owner-ready уже не только в общем handoff report, а в отдельных restricted handoff-файлах по очередям владельцев;
    - `A5.3` практически полностью выжат по внутреннему repo-side периметру;
    - remaining blocker окончательно смещён к реальному external signed intake.

1. **A5 chain-of-title handoff packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-chain-of-title-handoff.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:chain-of-title:handoff`
    - `pnpm gate:phase:a5:chain-of-title:handoff`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_HANDOFF_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a5-chain-of-title-handoff.json`
    - `var/compliance/phase-a5-chain-of-title-handoff.md`
  - Фактический baseline:
    - `total_assets = 18`
    - `owner_queues = 3`
    - `board / legal / product-governance = 1`
    - `legal / data governance / architecture = 3`
    - `legal / engineering management = 14`
    - `pnpm gate:phase:a5:chain-of-title:handoff` -> `PASS`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `ELP-20260328-09` теперь готовится не только по списку активов и evidence-классам, а по конкретным owner queues;
    - `A5.3` стал owner-ready handoff-пакетом, а не только collection-пакетом;
    - remaining blocker по `A5` окончательно смещён к реальному external signed intake.

1. **A5 chain-of-title collection packet assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-chain-of-title-collection.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:chain-of-title:collection`
    - `pnpm gate:phase:a5:chain-of-title:collection`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_COLLECTION_PACKET.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a5-chain-of-title-collection.json`
    - `var/compliance/phase-a5-chain-of-title-collection.md`
  - Фактический baseline:
    - `total_assets = 18`
    - `evidence_classes = 4`
    - `board_ownership_and_licensing = 1`
    - `employment_or_contractor_ip_assignment = 13`
    - `database_rights_and_schema_authorship = 3`
    - `derived_artifact_linkage = 1`
    - `pnpm gate:phase:a5:chain-of-title:collection` -> `PASS`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `ELP-20260328-09` теперь готовится не только по карте активов, а по явной матрице классов внешних доказательств;
    - `A5.3` перестал быть расплывчатым legal-хвостом и превратился в конкретный collection packet;
    - remaining blocker по `A5` окончательно смещён из repo-side подготовки к реальному external signed intake.

1. **A5 chain-of-title source register assembled** [DONE]:
  - Добавлен root generator:
    - `scripts/phase-a5-chain-of-title-register.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a5:chain-of-title`
    - `pnpm gate:phase:a5:chain-of-title`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md`
  - Generated evidence выпускается в:
    - `var/compliance/phase-a5-chain-of-title-source-register.json`
    - `var/compliance/phase-a5-chain-of-title-source-register.md`
  - Фактический baseline:
    - `total_assets = 18`
    - `application_workspaces = 5`
    - `library_workspaces = 8`
    - `database_assets = 4`
    - `pnpm gate:phase:a5:chain-of-title` -> `PASS`
  - Синхронизированы:
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `ELP-20260328-09` теперь готовится по явной карте first-party workspace и database perimeter;
    - `A5.3` больше не висит только на общей формуле “нужен chain-of-title pack”;
    - repo-side подготовка `ELP-09` усилилась без подмены внешних signed-артефактов.

1. **A4 pilot handoff lifecycle assembled** [DONE]:
  - Добавлены scripts:
    - `scripts/phase-a4-pilot-handoff-status.cjs`
    - `scripts/phase-a4-pilot-handoff-intake.cjs`
    - `scripts/phase-a4-pilot-handoff-transition.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a4:handoff:status`
    - `pnpm phase:a4:handoff:intake`
    - `pnpm phase:a4:handoff:transition`
    - `pnpm gate:phase:a4:handoff`
  - Создан новый canonical doc:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md`
  - В restricted evidence store подняты:
    - `pilot-handoffs/2026-03-31/metadata/INDEX.md`
    - `A4-H-01-first-tier1-pilot-handoff.md`
    - template и repo-derived draft для `A4-H-01`
  - Синхронизированы:
    - `PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md`
    - `PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md`
    - `PHASE_A4_SUPPORT_BOUNDARY_PACKET.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Фактическая проверка:
    - `pnpm phase:a4:handoff:status` -> `requested=1`, `issues=0`
    - `pnpm gate:phase:a4:handoff` -> `PASS`
    - на временной копии restricted root успешно пройдён путь `requested -> received -> reviewed -> accepted`
  - Практический эффект:
    - `A4.4` больше не держится только на checklist/template;
    - первый pilot handoff теперь можно вести через такой же evidence lifecycle, как legal и security;
    - внутренний хвост `Phase A` ещё сильнее сузился к реальным внешним accepted-артефактам.

1. **A0 daily triage execution layer published** [DONE]:
  - Создан:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_DAILY_TRIAGE_CHECKLIST.md`
  - Документ переводит `A0` из общего governance-правила в один ежедневный исполняемый ритуал.
  - Обновлён:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_TRIAGE_EXECUTION_RULES.md`
  - Синхронизированы:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md`
    - `docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A-2.1.1`, `A-2.1.2`, `A-2.1.3` теперь можно считать `done` для внутреннего `Phase A` execution-layer;
    - triage `Phase A` больше не держится только на правилах и чате;
    - breadth-задачи формально отрезаны от верхней очереди через отдельный daily loop.

1. **A4 Tier 1 pilot handoff kit assembled** [DONE]:
  - Созданы:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md`
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md`
  - Обновлён:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md`
  - Синхронизированы:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md`
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md`
    - `docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A4.4` больше не висит как абстрактный support-boundary хвост;
    - для первого `Tier 1 self-host / localized` handoff теперь есть полный repo-side kit;
    - реальный незакрытый шаг смещён из docs-layer в первый фактический заполненный handoff report на живой pilot-среде.

1. **A5 Tier 1 procurement/distribution decision published** [DONE]:
  - Создан:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md`
  - Новый execution-doc связал в одно `Tier 1` решение:
    - `PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md`
    - `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`
    - `PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md`
    - `PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md`
    - `OSS_LICENSE_AND_IP_REGISTER.md`
  - Синхронизированы:
    - `PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md`
    - `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `OSS_LICENSE_AND_IP_REGISTER.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A-2.6.4` теперь можно считать `done` для внутреннего `Tier 1` perimeter;
    - `A5` больше не висит между OSS triage и first-party licensing strategy;
    - главный оставшийся blocker `A5` сузился до `ELP-20260328-09` и full chain-of-title.

1. **A4 blank-worktree bootstrap confirmed as repo-side installability evidence** [DONE]:
  - Из `docker-compose.yml` удалены фиксированные `container_name`.
  - В `.env.example` добавлены:
    - `BACKEND_URL`
    - `NEXT_PUBLIC_API_URL`
  - В отдельной копии рабочего дерева без root `.env` и без `apps/web/.env.local` успешно пройдены:
    - `pnpm install --frozen-lockfile`
    - `pnpm db:migrate`
    - `pnpm --filter api build`
    - `pnpm --filter web build`
  - Создан generated evidence:
    - `var/ops/phase-a4-blank-worktree-bootstrap-2026-03-31.json`
  - Опубликован новый canonical report:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md`
  - Синхронизированы:
    - `README.md`
    - `PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md`
    - `PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md`
    - `PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
    - `ONE_BIG_PHASE/INDEX.md`
    - `docs/DOCS_MATRIX.md`
  - Практический эффект:
    - `A-2.5.3` теперь можно считать `done` для repo-side `Phase A`;
    - install path перестал зависеть от локального env residue;
    - живой хвост `A4` сузился до operational support boundary и реального pilot handoff.

1. **A3 unified release gate assembled and published** [DONE]:
  - Добавлен новый root runner:
    - `scripts/phase-a3-release-evals.cjs`
  - В `package.json` добавлены команды:
    - `pnpm phase:a3:evals`
    - `pnpm gate:phase:a3:evals`
  - Новый runner объединяет в один machine-readable `PASS/FAIL` contour:
    - `src/modules/rai-chat/rai-chat.service.spec.ts`
    - `src/modules/rai-chat/supervisor-agent.service.spec.ts`
    - `src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts`
    - `apps/api/scripts/ops/advisory-oncall-drill.mjs`
    - `apps/api/scripts/ops/advisory-stage-progression.mjs`
    - `apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs`
  - Generated outputs публикуются в:
    - `var/ops/phase-a3-release-eval-manifest-2026-03-31.json`
    - `var/ops/phase-a3-release-eval-summary-2026-03-31.json`
    - `var/ops/phase-a3-release-eval-summary-2026-03-31.md`
    - `var/ops/phase-a3-release-evals-2026-03-31/*`
  - Фактический результат:
    - `gate_status = PASS`
    - `commands_passed = 6 / 6`
    - `clusters_passed = 8 / 8`
    - `tests_passed = 40 / 40`
  - Опубликован canonical report:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_REPORT_2026-03-31.md`
  - Практический эффект:
    - `A3.4` перестала быть skeleton/planning-заготовкой и стала реальным executable release gate;
    - `A-2.4.1 .. A-2.4.4` в `PHASE_A_EXECUTION_BOARD.md` теперь могут считаться `done` для repo-side `Tier 1`.

2. **A4 installability drift narrowed further** [DONE]:
  - Из `docker-compose.yml` удалено obsolete поле `version`.
  - `pnpm docker:up` больше не пишет compose warning.
  - Дополнительно прогнан bootstrap-pass от shell env, загруженного из `.env.example`:
    - `pnpm db:migrate`
    - `pnpm --filter api build`
    - `pnpm --filter web build`
  - Создан generated evidence:
    - `var/ops/phase-a4-env-example-bootstrap-2026-03-31.json`
  - Обновлён:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md`
  - Практический эффект:
    - root `.env` больше не выглядит обязательным скрытым знанием для install path;
    - residual `A4` сузился до blank-host rehearsal без root/app-local env residue и реального pilot handoff.

1. **A5 Tier 1 toolchain license decision recorded** [DONE]:
  - Создан:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md`
  - В документе зафиксировано formal manual решение для оставшегося `UNKNOWN` perimeter:
    - `@esbuild/*` companions = `ALLOW_TIER1_CONDITIONAL`
    - `turbo-*` companions = `ALLOW_TIER1_CONDITIONAL`
    - `fsevents` = `OUT_OF_SCOPE_TIER1_LINUX`
  - Решение жёстко ограничено только периметром:
    - `Tier 1 self-host / localized MVP pilot`
    - Linux runtime perimeter
    - procurement / due-diligence handoff без public cross-platform distribution
  - Синхронизированы:
    - `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md`
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
    - `OSS_LICENSE_AND_IP_REGISTER.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
  - Практический эффект:
    - `A5.1` больше не висит как незакрытый triage внутри `Tier 1`;
    - остаточный `A5` сместился к `ELP-20260328-09`, chain-of-title и wider distribution legal sign-off, а не к raw `UNKNOWN` inventory.

1. **A5 assembled notice bundle published as generated evidence** [DONE]:
  - Добавлен новый root command:
    - `pnpm security:notices`
  - Добавлен generator:
    - [scripts/generate-notice-bundle.cjs](/root/RAI_EP/scripts/generate-notice-bundle.cjs)
  - Новый generator использует `var/security/license-inventory.json` и выпускает:
    - `var/security/notice-bundle.json`
    - `var/security/notice-bundle.md`
  - Bundle уже включает representative license texts для:
    - `MIT`
    - `Apache-2.0`
    - `ISC`
    - `BSD-2-Clause`
    - `BSD-3-Clause`
    - `BlueOak-1.0.0`
  - Одновременно в generated output отдельно зафиксированы:
    - `esbuild` companions = `25`
    - `turbo` companions = `5`
    - `fsevents` = `1` как `linux Tier 1 out-of-scope`
    - first-party `UNLICENSED` perimeter как исключённый из third-party notice bundle
  - Опубликован новый canonical report:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md`
  - Синхронизированы:
    - `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`
    - `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`
    - `OSS_LICENSE_AND_IP_REGISTER.md`
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
  - Практический эффект:
    - `A5.2` больше не висит на одном только working packet;
    - у procurement/self-host handoff теперь есть воспроизводимый generated `NOTICE` baseline;
    - следующий шаг `A5` теперь уже не “собрать bundle”, а дать final legal classification и привязать assembled bundle к procurement/distribution decision.

1. **A5 first-party unknowns removed from license inventory** [DONE]:
  - В [package.json](/root/RAI_EP/package.json) добавлен `license: UNLICENSED`.
  - В [packages/eslint-plugin-tenant-security/package.json](/root/RAI_EP/packages/eslint-plugin-tenant-security/package.json) добавлены:
    - `license: UNLICENSED`
    - `private: true`
  - После этого локальный inventory изменился:
    - `total packages = 159`
    - `unknown licenses = 33 -> 31`
    - `UNLICENSED = 2`
  - Это убрало из `UNKNOWN` два first-party случая:
    - `rai-enterprise-platform`
    - `eslint-plugin-tenant-security`
  - `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md`, `OSS_LICENSE_AND_IP_REGISTER.md`, `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`, `PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md`, `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`, `PHASE_A_EXECUTION_BOARD.md` и `PHASE_A_EVIDENCE_MATRIX.md` синхронизированы с новым состоянием.
  - Практический эффект:
    - `A5` больше не путает наш собственный first-party perimeter с third-party `UNKNOWN`;
    - remaining OSS-risk сузился до optional/toolchain хвоста `esbuild / turbo / fsevents`, что делает следующий triage гораздо точнее.

2. **A4 execution evidence and installability remediation** [DONE]:
  - Для `A4` выполнен реальный dry-run install path:
    - `pnpm install --frozen-lockfile`
    - `pnpm --filter api build`
    - `pnpm --filter web build`
  - В процессе dry-run найден и устранён repo-side operational drift:
    - root `docker:up/down` больше не используют `docker-compose`, а переведены на `docker compose`
    - root `pnpm db:migrate` больше не зависит от неявного turbo/env поведения и теперь идёт через `scripts/prisma-migrate-safe.cjs`
  - Реально подтверждено:
    - `pnpm docker:up` -> PASS
    - `pnpm db:migrate` -> PASS
    - `pnpm --filter api build` -> PASS
    - `pnpm --filter web build` -> PASS
  - Созданы и наполнены machine-readable артефакты:
    - `var/ops/phase-a4-install-dry-run-2026-03-31.json`
    - `var/schema/prisma-migrate-safe.json`
    - `var/ops/phase-a4-backup-restore-execution-2026-03-31.json`
  - Созданы canonical reports:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md`
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md`
  - Практический эффект:
    - `A4` перестал опираться только на templates и packet;
    - install path теперь подтверждён фактическим прохождением на локальной self-host среде;
    - recovery path подтверждён реальным restore rehearsal, а не наличием runbook.

3. **A3 runtime drill evidence and ops-script remediation** [DONE]:
  - Найден и устранён repo-side drift в advisory ops scripts:
    - `advisory-oncall-drill.mjs`
    - `advisory-stage-progression.mjs`
    - `advisory-dr-rollback-rehearsal.mjs`
    теперь автоматически добавляют `Idempotency-Key` для mutating advisory endpoints.
  - После исправления реально пройдены:
    - `advisory-oncall-drill` -> PASS
    - `advisory-stage-progression` -> PASS
    - `advisory-dr-rollback-rehearsal` -> PASS
  - Результаты сохранены в:
    - `var/ops/phase-a4-advisory-oncall-drill-2026-03-31.json`
    - `var/ops/phase-a3-stage-progression-2026-03-31.json`
    - `var/ops/phase-a4-advisory-dr-rehearsal-2026-03-31.json`
  - Создан canonical report:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md`
  - Практический эффект:
    - `A3.4` теперь опирается не только на skeleton eval-suite, но и на первый фактический runtime-drill baseline;
    - advisory runtime и rollback/perimeter paths подтверждены живым исполнением, хотя unified evaluator gate ещё не собран.

1. **Phase A execution board and evidence matrix** [DONE]:
  - В `docs/07_EXECUTION/ONE_BIG_PHASE/` добавлены:
    - `PHASE_A_EXECUTION_BOARD.md`
    - `PHASE_A_EVIDENCE_MATRIX.md`
  - `PHASE_A_EXECUTION_BOARD` раскладывает каждый пункт `Phase A` в формат:
    - blocker
    - owner
    - статус
    - evidence
    - next action
  - `PHASE_A_EVIDENCE_MATRIX` фиксирует, какое доказательство реально считается достаточным для закрытия legal/security/AI/installability/IP риска.
  - `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы под новые документы.
  - Практический эффект:
    - `Phase A` перестала быть только планом и получила рабочий board управления;
    - теперь можно отдельно видеть движение задач и отдельно различать “есть заметка” против “есть реальное доказательство закрытия”.

2. **Phase A implementation plan** [DONE]:
  - В `docs/07_EXECUTION/ONE_BIG_PHASE/` добавлен `PHASE_A_IMPLEMENTATION_PLAN.md`.
  - Новый документ перевёл `Phase A` в decision-complete схему исполнения по шести трекам:
    - `A0` triage
    - `A1` legal
    - `A2` security
    - `A3` AI governance
    - `A4` installability/recovery
    - `A5` IP/OSS
  - `PHASE_A_EXECUTION_BOARD.md` обновлён и теперь явно показывает track-level структуру.
  - `PHASE_A_EVIDENCE_MATRIX.md` тоже увязан с треками `A1–A5`.
  - `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - `Phase A` теперь можно исполнять как операционный пакет, а не как один общий список;
    - board, evidence и implementation-plan смотрят на одну и ту же структуру `A0–A5`.

3. **A1 legal closeout packet inside Phase A** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md`.
  - Новый документ связал `Phase A` с уже существующим legal lifecycle tooling и фактическим состоянием:
    - `current_verdict = NO-GO`
    - `accepted = 0 / 11`
    - приоритетная восьмёрка blockers до `CONDITIONAL GO`
  - Внутри зафиксированы:
    - точный порядок `ELP-01 -> 03 -> 04 -> 06 -> 02 -> 05 -> 08 -> 09`
    - owner map
    - draft paths
    - команды `intake / reviewed / accepted`
    - правила обновления board после каждого шага
  - Практический эффект:
    - `A1` перестал быть абстрактным legal-треком и стал прямой очередью действий;
    - дальнейшая работа по legal closeout может идти прямо из `ONE_BIG_PHASE`, без прыжков между execution, ops и `var/compliance`.

4. **A2 security closeout packet inside Phase A** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md`.
  - Новый документ связал `A2` с реальными baseline-командами и policy-контуром:
    - `pnpm security:audit:ci`
    - `pnpm gate:secrets`
    - `pnpm gate:invariants`
    - `SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY`
  - Внутри зафиксированы:
    - dependency-risk closeout
    - secret hygiene
    - unsafe-path governance
    - внешний access-governance follow-up
  - Практический эффект:
    - `A2` перестал быть общей security-строкой и стал отдельным execution-треком;
    - теперь legal и security внутри `Phase A` имеют одинаково конкретную форму исполнения.

5. **A3 AI governance closeout packet inside Phase A** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`.
  - Новый документ связал `A3` с текущими policy и audit-фактами:
    - advisory-first model already fixed
    - release criteria требуют `tool matrix`, `HITL matrix`, formal `eval-suite`
    - audit указывает на отсутствие unified release-gated AI safety contour
  - Внутри зафиксированы четыре обязательных артефакта closeout:
    - `tool-permission matrix`
    - `HITL matrix`
    - `advisory-only` perimeter
    - formal `eval-suite`
  - Практический эффект:
    - `A3` перестал быть общей AI-policy темой и стал конкретным execution-треком;
    - теперь `Phase A` уже имеет отдельные рабочие пакеты для legal, security и AI governance.

6. **A4 installability and recovery packet inside Phase A** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md`.
  - Новый документ связал `A4` с текущими ops и release-фактами:
    - `self-host / localized first` остаётся каноническим маршрутом
    - release criteria требуют installability и fresh recovery evidence
    - due diligence прямо фиксирует отсутствие install/upgrade packet и backup/restore execution report
  - Внутри зафиксированы четыре обязательных артефакта closeout:
    - install/upgrade packet
    - dry-run install report
    - backup/restore execution report
    - support boundary packet
  - Практический эффект:
    - `A4` перестал быть общей ops-рекомендацией и стал конкретным execution-треком;
    - теперь `Phase A` уже имеет отдельные рабочие пакеты для legal, security, AI governance и installability/recovery.

7. **A5 IP and OSS closeout packet inside Phase A** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`.
  - Новый документ связал `A5` с текущими legal/IP фактами:
    - `pnpm security:licenses` уже строит inventory
    - `OSS_LICENSE_AND_IP_REGISTER` фиксирует `33 unknown licenses`
    - `RF_COMPLIANCE_REVIEW` и legal verdict считают `chain-of-title` незакрытым stop-blocker
  - Внутри зафиксированы четыре обязательных артефакта closeout:
    - `unknown-license triage`
    - `notice/obligations packet`
    - accepted `ELP-20260328-09`
    - first-party licensing strategy
  - Практический эффект:
    - `A5` перестал быть хвостовой общей темой и стал конкретным execution-треком;
    - теперь `Phase A` уже имеет отдельные рабочие пакеты для legal, security, AI governance, installability/recovery и IP/OSS.

8. **A1 first-wave execution checklist** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`.
  - Новый документ перевёл первую legal-волну `ELP-01 / 03 / 04 / 06` в owner-уровневый практический чеклист:
    - какой именно внешний файл нужен
    - кто должен дать данные
    - что обязательно вписать
    - какую команду `intake` запускать
    - какая строка board и какой legal-effect должны измениться
  - `PHASE_A1_LEGAL_CLOSEOUT_PLAN.md`, `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - `A1` перестал упираться только в общий priority-board;
    - теперь первую критическую волну можно вести как прямой чеклист для owner-а без переключения между несколькими legal-файлами.

9. **ELP-01 operator memo micro-checklist** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md`.
  - Новый документ перевёл первый фактический legal-step в один конкретный owner-чеклист:
    - какая форма файла допустима
    - какие поля обязательны
    - какая команда выполняет `intake`
    - что проверять до `reviewed`
    - что должно измениться после `accepted`
  - `PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`, `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - запуск `A1` теперь можно начинать буквально с одного документа;
    - исчезает двусмысленность, что именно считается достаточным `operator memo`.

10. **ELP-03 hosting/residency micro-checklist** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md`.
  - Новый документ перевёл второй критический legal-step в один конкретный owner-чеклист:
    - какая форма файла допустима
    - какие поля обязательны по средам `prod / pilot / staging`
    - какая команда выполняет `intake`
    - что проверять до `reviewed`
    - что должно измениться после `accepted`
  - `PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`, `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - второй шаг первой legal-волны теперь тоже исполним как один конкретный документ;
    - исчезает двусмысленность, что именно считается достаточным residency evidence.

11. **Полное разложение Phase A до первого рабочего слоя** [DONE]:
  - Добавлены:
    - `PHASE_A0_TRIAGE_EXECUTION_RULES.md`
    - `PHASE_A1_ELP_04_PROCESSOR_DPA_CHECKLIST.md`
    - `PHASE_A1_ELP_06_LAWFUL_BASIS_CHECKLIST.md`
    - `PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md`
    - `PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md`
    - `PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md`
    - `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`
  - Для `A2` в execution-layer зафиксирован живой baseline:
    - `pnpm security:audit:ci` -> `critical=2`, `high=37`
    - `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
    - `pnpm gate:invariants` -> `violations=0`
    - `pnpm security:licenses` -> `unknown_licenses=33`
  - `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md`, `PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md`, `PHASE_A2_SECURITY_CLOSEOUT_PLAN.md`, `PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`, `PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md`, `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - `Phase A` больше не держится только на больших планах и двух micro-docs;
    - теперь каждый трек `A0–A5` имеет конкретный стартовый execution-layer, который можно реально брать в работу сверху вниз.

12. **A1 fully decomposed across both legal waves** [DONE]:
  - Добавлены:
    - `PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md`
    - `PHASE_A1_ELP_02_RKN_CHECKLIST.md`
    - `PHASE_A1_ELP_05_TRANSBORDER_CHECKLIST.md`
    - `PHASE_A1_ELP_08_RETENTION_CHECKLIST.md`
    - `PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md`
  - `PHASE_A1_LEGAL_CLOSEOUT_PLAN.md`, `ONE_BIG_PHASE/INDEX.md`, `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - вся приоритетная legal-восьмёрка теперь разложена в каноне до конкретных owner-checklists;
    - legal-track `A1` внутри репозитория доведён до максимальной исполнимости без подделки внешних evidence.

13. **A3 tool permission matrix published** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md`.
  - Новый execution-артефакт собран по текущему runtime-коду, а не по общим policy-формулировкам:
    - `DEFAULT_TOOL_BINDINGS`
    - `TOOL_RISK_MAP`
    - `resolveToolAccess`
    - `RiskPolicyEngineService`
    - `RaiToolsRegistry`
  - Матрица фиксирует default governed tool-perimeter для `Tier 1` по ролям:
    - `agronomist`
    - `economist`
    - `knowledge`
    - `monitoring`
    - `crm_agent`
    - `front_office_agent`
    - `contracts_agent`
    - `chief_agronomist`
    - `data_scientist`
  - `ONE_BIG_PHASE/INDEX.md`, `PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`, `PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md`, `PHASE_A_EXECUTION_BOARD.md`, `PHASE_A_EVIDENCE_MATRIX.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
    - `A3.1` больше не висит как пустой policy-пункт;
    - `HITL matrix`, `advisory-only` perimeter и `eval-suite` теперь можно строить поверх опубликованного runtime-derived baseline, а не с нуля.

14. **A3 HITL matrix published** [DONE]:
  - Добавлен `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md`.
  - Новый execution-артефакт собран по текущему runtime-контракту:
    - `RiskPolicyEngineService`
    - `PendingActionService`
    - `PendingActionsController`
    - `RaiToolsRegistry`
    - `AutonomyPolicyService`
  - Матрица фиксирует:
    - где `READ` path идёт без человека
    - где создаётся `PendingAction`
    - где нужен `approveFirst`
    - где нужен privileged `approveFinal`
    - где `QUARANTINE` полностью режет execute-path
  - `ONE_BIG_PHASE/INDEX.md`, `PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`, `PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md`, `PHASE_A_EXECUTION_BOARD.md`, `PHASE_A_EVIDENCE_MATRIX.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - Практический эффект:
  - `A3.2` больше не висит как общая фраза “нужен human-in-the-loop”;
  - следующий шаг по `advisory-only` perimeter и `eval-suite` теперь строится поверх уже опубликованной approval ladder, а не по догадкам.

15. **Repo-side scaffold for `A3/A4/A5` completed to execution-ready depth** [DONE]:
  - Добавлены:
    - `PHASE_A3_ADVISORY_ONLY_REGISTER.md`
    - `PHASE_A3_RELEASE_EVAL_SUITE.md`
    - `PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md`
    - `PHASE_A4_INSTALL_DRY_RUN_REPORT_TEMPLATE.md`
    - `PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_TEMPLATE.md`
    - `PHASE_A4_SUPPORT_BOUNDARY_PACKET.md`
    - `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md`
    - `PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md`
    - `PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md`
  - `ONE_BIG_PHASE/INDEX.md`, `PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md`, `PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md`, `PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md`, `PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md`, `PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md`, `PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md`, `PHASE_A_EXECUTION_BOARD.md`, `PHASE_A_EVIDENCE_MATRIX.md` и `docs/DOCS_MATRIX.md` синхронизированы.
  - `PHASE_A_EXECUTION_BOARD.md` теперь отражает реальное продвижение:
    - `A-2.4.3`, `A-2.4.4`, `A-2.5.1`, `A-2.5.2`, `A-2.5.3`, `A-2.6.1`, `A-2.6.4` переведены в рабочие execution-state;
    - `A4` и `A5` перестали висеть как почти пустые хвосты относительно `A1/A2`.
  - `PHASE_A_EVIDENCE_MATRIX.md` теперь отдельно различает advisory-only perimeter, evals, installability, recovery, support boundary, unknown-license triage, notice obligations и first-party licensing strategy.
  - Практический эффект:
    - repo-side подготовка `Phase A` доведена почти до предела исполнимости;
    - дальнейший прогресс уже упирается в реальные external evidence и actual execution reports, а не в отсутствие структуры docs.

## 2026-03-30

1. **Owner-friendly MVP execution checklist** [DONE]:
  - Создан новый execution-док `docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md`.
  - Документ переводит synthesis и audit-пакет в простой owner-уровневый чеклист:
    - что делать сначала
    - что делать потом
    - что не считать прогрессом
    - как понимать, что команда движется правильно
  - Новый документ зарегистрирован в `docs/DOCS_MATRIX.md`.
  - Навигация обновлена в `docs/README.md` и `docs/INDEX.md`.
  - Практический эффект:
    - появился официальный простой вход в execution-контур для пользователя без опыта больших проектов;
    - следующий ход проекта теперь можно читать не только через жёсткий synthesis-отчёт, но и через понятный пошаговый чеклист.

2. **ONE_BIG_PHASE execution packet** [DONE]:
  - Создан новый execution-пакет `docs/07_EXECUTION/ONE_BIG_PHASE/`.
  - В пакет вошли:
    - `INDEX.md`
    - `01_PHASE_A_STOP_BLOCKERS_AND_GATES.md`
    - `02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md`
    - `03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md`
    - `04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md`
  - Новый пакет разложил общий `MVP execution checklist` на практические подфазы с детальными чеклистами и выходными критериями.
  - Обновлены `docs/README.md`, `docs/INDEX.md`, `docs/DOCS_MATRIX.md`.
  - Практический эффект:
    - у текущего большого хода проекта появилась не только общая логика, но и рабочая структура исполнения;
    - следующую работу можно вести по конкретным подфазам, а не по одному крупному master-документу.

3. **Уточнение роли `front-office / CRM` в execution-приоритетах** [DONE]:
  - Исправлены двусмысленные формулировки в:
    - `docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md`
    - `docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md`
    - `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`
  - Теперь канон явно различает:
    - существующие важные `front-office / CRM`-агенты как часть текущего agent-perimeter;
    - преждевременное масштабирование этих контуров в ширину и добавление новых ролей сверх текущего состава.
  - Практический эффект:
    - execution-план перестал звучать так, будто существующие `front-office / CRM` контуры считаются лишними;
    - приоритеты теперь режут именно лишнюю ширину, а не важное уже существующее ядро.

## 2026-03-28

1. **Enterprise audit closeout: security/compliance/ops packet** [DONE]:
  - Добавлен воспроизводимый security baseline через `pnpm security:audit:ci`, `pnpm gate:secrets`, `pnpm gate:db:schema-validate`, `pnpm security:licenses`, `pnpm security:sbom`.
  - В репозитории появились новые scripts:
    - `security-audit-ci.cjs`
    - `scan-secrets.cjs`
    - `prisma-validate-safe.cjs`
    - `generate-license-inventory.cjs`
    - `generate-sbom.cjs`
  - Усилен CI:
    - `security-audit.yml` теперь гоняет security baseline и грузит артефакты
    - добавлены `codeql-analysis.yml` и `dependency-review.yml`
  - `CODEOWNERS` расширен на workflows, scripts и критичные runtime paths.
  - Из Git-индекса удалены tracked env-файлы с секретами:
    - `mg-core/backend/.env`
    - `mg-core/backend/src/mg-chat/.env`
  - Новый secret hygiene baseline:
    - `tracked_findings=0`
    - workspace-only secrets остаются локальным риском и больше не считаются repo-tracked leakage
  - Создан active ops/compliance packet в `docs/05_OPERATIONS`.
  - Audit-пакет синхронизирован:
    - security и deployment baseline усилены
    - `Legal / Compliance` остался `NO-GO` из-за отсутствия внешнего operator/legal evidence

2. **External legal evidence closeout packet** [DONE]:
  - Создан `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md`.
  - Остаточный legal/compliance gap переведён в явный owner-driven packet:
    - operator identity and role memo
    - РКН notification / exemption evidence
    - hosting/residency attestation
    - processor/subprocessor + DPA pack
    - transborder decision log
    - lawful basis / privacy notice pack
    - subject-rights operating evidence
    - retention/deletion approval
    - chain-of-title pack
    - OSS unknown-license triage
    - crypto applicability memo
  - Обновлены `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW`, `ENTERPRISE_DUE_DILIGENCE`, `ENTERPRISE_EVIDENCE_MATRIX`, `DELTA_VS_BASELINE`, `docs/README.md`, `docs/INDEX.md`, `docs/DOCS_MATRIX.md`.
  - Практический эффект:
    - `Legal / Compliance = NO-GO` остаётся честным, но теперь имеет точный closeout path;
    - enterprise due diligence можно обновлять по фактам внешних артефактов, а не по расплывчатому backlog.

3. **External legal metadata tracking and restricted store bootstrap** [DONE]:
  - Создан `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`.
  - В регистре seeded `11` external evidence items со статусом `requested`, `reference_id`, review dates и linked docs.
  - Вне Git создан локальный restricted scaffold:
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata`
  - В restricted scaffold заведены `INDEX.md` и 11 metadata-карточек `ELP-20260328-01 .. ELP-20260328-11`.
  - Audit-слой синхронизирован:
    - `RF_COMPLIANCE_REVIEW`
    - `ENTERPRISE_DUE_DILIGENCE`
    - `ENTERPRISE_EVIDENCE_MATRIX`
    - `DELTA_VS_BASELINE`
  - Практический эффект:
    - legal closeout теперь имеет рабочую очередь приёмки, а не только policy-level список;
    - можно двигать статусы `requested -> received -> reviewed -> accepted` без хранения самих sensitive docs в Git.

4. **External legal acceptance workflow and owner routing** [DONE]:
  - Создан `docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md`.
  - В `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER` добавлен alias owner map и named owners по всем `ELP-20260328-01 .. 11`.
  - Для legal/privacy closeout docs усилен review guard в `.github/CODEOWNERS`:
    - `@chief_legal_officer`
    - `@dpo`
    - `@board_of_directors`
    - совместно с `@techlead` и `@backend-lead`
  - Audit-пакет синхронизирован:
    - `RF_COMPLIANCE_REVIEW`
    - `ENTERPRISE_DUE_DILIGENCE`
    - `ENTERPRISE_EVIDENCE_MATRIX`
    - `DELTA_VS_BASELINE`
  - Практический эффект:
    - локально закрыт весь исполнимый кусок legal closeout;
    - дальше blocker только один: фактическое появление внешних документов для перевода карточек из `requested` в `received`.

5. **Reproducible legal evidence status gate** [DONE]:
  - Добавлен `scripts/legal-evidence-status.cjs`.
  - В `package.json` добавлены:
    - `pnpm legal:evidence:status`
    - `pnpm gate:legal:evidence`
  - Скрипт сверяет:
    - `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata/*.md`
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata/INDEX.md`
  - Скрипт пишет отчёты:
    - `var/compliance/external-legal-evidence-status.json`
    - `var/compliance/external-legal-evidence-status.md`
  - Практический эффект:
    - legal evidence lifecycle теперь проверяется кодом, а не только глазами;
    - после появления внешних документов команда сможет быстро ловить status drift и overdue items.

6. **Legal evidence intake automation** [DONE]:
  - Добавлен `scripts/legal-evidence-intake.cjs`.
  - В `package.json` добавлена команда:
    - `pnpm legal:evidence:intake -- --reference=ELP-... --source=/abs/path/file`
  - Скрипт выполняет один детерминированный intake-проход:
    - копирует внешний файл в restricted `artifacts/<reference_id>/`
    - обновляет restricted metadata card
    - обновляет restricted `INDEX.md`
    - обновляет repo-side `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md` со статусом `received`
  - Практический эффект:
    - появление реального внешнего документа больше не требует ручной правки нескольких файлов;
    - legal closeout можно двигать серийно и без ручного status drift.

7. **Legal evidence lifecycle transition automation** [DONE]:
  - Добавлен `scripts/legal-evidence-transition.cjs`.
  - В `package.json` добавлена команда:
    - `pnpm legal:evidence:transition -- --reference=ELP-... --status=reviewed|accepted|expired`
  - `scripts/legal-evidence-status.cjs` усилен:
    - для `received` требует `received_at` и `artifact_path`
    - для `reviewed` требует `received_at`, `artifact_path`, `reviewed_at`
    - для `accepted` требует `received_at`, `artifact_path`, `reviewed_at`, `accepted_at`
    - проверяет существование `artifact_path` у non-requested карточек
  - Практический эффект:
    - полный lifecycle `requested -> received -> reviewed -> accepted` теперь закрывается кодом;
    - gate ловит уже не только status drift, но и неполные evidence-карточки.

8. **Legal evidence template generation** [DONE]:
  - Добавлен `scripts/legal-evidence-template.cjs`.
  - В `package.json` добавлена команда:
    - `pnpm legal:evidence:template -- --reference=ELP-...`
  - Генератор собирает шаблон по `reference_id` и пишет его в restricted `templates/<reference_id>/`.
  - Для `ELP-20260328-01`, `03`, `04`, `06` включены специализированные секции:
    - operator memo
    - hosting/residency matrix
    - processor/DPA register
    - lawful basis matrix
  - Практический эффект:
    - legal owners не начинают evidence-документы с пустого листа;
    - приоритетные артефакты можно собирать быстрее и без формального drift по структуре.

9. **Machine-readable legal verdict automation** [DONE]:
  - Добавлен `scripts/legal-evidence-verdict.cjs`.
  - В `package.json` добавлены команды:
    - `pnpm legal:evidence:verdict`
    - `pnpm gate:legal:evidence:verdict`
  - Verdict-скрипт опирается на:
    - `var/compliance/external-legal-evidence-status.json`
    - `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`
    - decision rules из request packet и acceptance runbook
  - Скрипт пишет отчёты:
    - `var/compliance/external-legal-evidence-verdict.json`
    - `var/compliance/external-legal-evidence-verdict.md`
  - Практический эффект:
    - `Legal / Compliance` больше не пересчитывается вручную по таблицам;
    - команда мгновенно видит текущий verdict и точный список blockers до `CONDITIONAL GO` и `GO`.

10. **Repo-derived legal prefill drafts** [DONE]:
  - Добавлен `scripts/legal-evidence-prefill.cjs`.
  - В `package.json` добавлена команда:
    - `pnpm legal:evidence:prefill -- --reference=ELP-...`
    - `pnpm legal:evidence:prefill -- --priority=critical`
  - Команда создаёт рабочие draft-файлы в restricted store из уже подтверждённых repo-facts.
  - Принципиальное ограничение зафиксировано в workflow:
    - prefill не является внешним evidence;
    - prefill не переводит карточки в `received`.
  - Практический эффект:
    - владельцы получают не пустой шаблон, а почти готовый черновик с текущими repo-фактами и перечнем внешних пробелов;
    - критичные legal blockers можно закрывать быстрее без фальшивого изменения статусов.
  - Дополнительно generator расширен до полного покрытия:
    - `ELP-20260328-07`
    - `ELP-20260328-10`
    - `ELP-20260328-11`

11. **Owner-oriented legal handoff queue** [DONE]:
  - Добавлен `scripts/legal-evidence-handoff.cjs`.
  - В `package.json` добавлены команды:
    - `pnpm legal:evidence:handoff`
    - `pnpm gate:legal:evidence:handoff`
  - Handoff-отчёт использует:
    - `external-legal-evidence-status.json`
    - `external-legal-evidence-verdict.json`
    - restricted `drafts/INDEX.md`
  - Практический эффект:
    - blockers перестали быть просто списком `ELP-*`;
    - у каждого owner теперь есть своя очередь с draft-путями и готовыми intake-командами.

12. **Owner-specific legal packets** [DONE]:
  - Добавлен `scripts/legal-evidence-owner-packets.cjs`.
  - В `package.json` добавлены команды:
    - `pnpm legal:evidence:owner-packets`
    - `pnpm gate:legal:evidence:owner-packets`
  - Генератор использует machine-readable handoff report и выпускает restricted bundle:
    - `owner-packets/INDEX.md`
    - `owner-packets/<owner>/HANDOFF.md`
  - Практический эффект:
    - owner handoff больше не требует ручной сборки файлов или команд;
    - каждый named owner получает готовый packet по своим blockers, что ускоряет intake реальных внешних документов.

13. **Machine priority board for legal closeout** [DONE]:
  - Добавлен `scripts/legal-evidence-priority-board.cjs`.
  - В `package.json` добавлены команды:
    - `pnpm legal:evidence:priority-board`
    - `pnpm gate:legal:evidence:priority-board`
  - Generator использует machine-readable verdict и handoff reports и выпускает:
    - `var/compliance/external-legal-evidence-priority-board.json`
    - `var/compliance/external-legal-evidence-priority-board.md`
  - Практический эффект:
    - legal intake больше не стартует с ручного выбора порядка;
    - команда получает единый machine-sorted порядок закрытия blockers до `CONDITIONAL GO`.

14. **Audit executive brief and reading path** [DONE]:
  - Создан `docs/_audit/AUDIT_EXECUTIVE_BRIEF_2026-03-28.md`.
  - Обновлены `docs/README.md` и `docs/INDEX.md`, чтобы brief стал самым быстрым входом в enterprise-audit пакет.
  - Практический эффект:
    - итоговый аудит стало проще читать как законченный deliverable;
    - пользователь может быстро увидеть verdict, blockers и recommended reading order без прохода по всему пакету сразу.

15. **Подъём `NEW_reglament_docs` в активный canon** [DONE]:
  - Пакет `docs/06_ARCHIVE/NEW_reglament_docs/` сопоставлен с текущим due diligence, runtime map и source-of-truth policy.
  - Выявлено, что документы не противоречат текущему замыслу и лучше работают как claim-managed canon, а не как archive-only drop.
  - Созданы новые канонические документы в:
    - `docs/00_CORE/`
    - `docs/00_STRATEGY/`
    - `docs/01_ARCHITECTURE/`
    - `docs/02_DOMAINS/`
    - `docs/04_AI_SYSTEM/`
    - `docs/05_OPERATIONS/`
  - `DOCS_MATRIX`, `README` и `INDEX` обновлены.
  - Archive-копии из `NEW_reglament_docs` удалены, чтобы не оставлять параллельные competing sources of truth.

1. **Ledger schema recovery и economy stress-suite stabilization** [DONE]:
  - `packages/prisma-client/fix_schema.ts` расширен до полного recovery-прохода по hardened ledger-контуру, а не только до ремонта `create_ledger_entry_v1`.
  - Скрипт теперь восстанавливает `dblink`, `account_balances`, `check_tenant_state_hardened_v6`, `update_account_balance_v1`, `no_negative_cash`, trigger wiring и сам `create_ledger_entry_v1`.
  - Подтверждено, что локальная БД находилась в schema drift состоянии: запись о миграции присутствовала, но runtime-объекты ledger-контура были неполными.
  - После прогона recovery-скрипта `src/modules/finance-economy/economy/application/economy.concurrency.spec.ts` проходит полностью.

2. **Audit/consulting/smoke remediation batch** [DONE]:
  - `apps/api/src/shared/audit/audit.module.ts` получил явные импорты `CryptoModule` и `AnchorModule`, чтобы `AuditNotarizationService` не зависел от случайного окружающего модуля.
  - `src/modules/consulting/domain-rules/consulting.domain-rules.spec.ts` стабилизирован: reject-ассерты переведены на single-promise pattern, что убрало ложный `План уборки не найден`.
  - `test/a_rai-live-api-smoke.spec.ts` приведён к текущему runtime-контракту:
    - добавлен `EventEmitterModule.forRoot()`
    - `ConfigService` перестал глушить `process.env`
    - `Prisma` proxy получил `$transaction`, raw-methods и safe raw wrappers
    - `Redis` mock дополнен `isReady`
    - `IdempotencyInterceptor` overridden как no-op, чтобы smoke проверял HTTP/runtime контракты, а не отдельный идемпотентный perimeter
  - Targeted прогон `test/a_rai-live-api-smoke.spec.ts` + `src/modules/consulting/domain-rules/consulting.domain-rules.spec.ts` теперь зелёный.

3. **Новый полный backend baseline** [DONE]:
  - Выполнен полный прогон `pnpm --filter api test -- --runInBand`.
  - Итог:
    - `Test Suites: 252 passed, 252 total`
    - `Tests: 1313 passed, 1 skipped, 1314 total`
  - Зафиксировано улучшение относительно предыдущего baseline:
    - было `7 failed, 245 passed, 252 total`
    - затем было `2 failed, 5 passed, 7 targeted`
    - теперь backend `api` полностью зелёный в детерминированном `runInBand`-режиме.

## 2026-03-27

1. **Запуск дев-сервера Gripil Web** [DONE]:
  - Поднят `next dev` для `apps/gripil-web` на порту `3005`.
  - Верифицирован статус `200 OK` через `curl`.

2. **Production-билд Gripil Web** [DONE]:
  - Запущена и успешно завершена сборка `pnpm build` для `apps/gripil-web`.
  - Артефакты сборки готовы к развертыванию.

## 2026-03-26

1. **Стабилизация Gripil Web (Emergency Revert)** [DONE]:
  - Выполнен полный откат кодовой базы лендинга `apps/gripil-web` до стабильного коммита `f608995` ("bee") после неудачной попытки внедрения fluid-типографики.
  - Исправлены критические ошибки типизации Framer Motion (`as any` для ease-функций), блокировавшие production-сборку в Next.js 16/Turbopack.
  - Проведен успешный production-билд (`npm run build`) и проверка работоспособности.
  - Код запушен в удаленный репозиторий.
  - Сайт развернут и доступен через Cloudflare Tunnel на порту 3012.

## 2026-03-24

1. **Обновление корневого `README.md`** [DONE]:
  - Актуализирована дата состояния репозитория: `2026-03-24`.
  - Добавлен раздел «AI, Агентная платформа и governance» с описанием Stage 2: референсные агенты `AgronomAgent`, `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`.
  - Расширена структура `docs/` до полного набора из 13 слоёв, включая `00_STRATEGY`, `02_DOMAINS`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS`.
  - Таблица команд разбита на три раздела: основные, база данных, гейты и линтеры. Добавлены все критические `gate:db:*`, `gate:architecture`, `gate:rollout`.
  - Добавлена ссылка на `docs/00_STRATEGY/ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md` v2.0 и `docs/11_INSTRUCTIONS/`.
  - Рефакторинг раздела «Документация»: явно обозначены три группы слоёв (verified operational canon / active design & planning / historical).
  - `pnpm lint:docs` — PASS (0 ошибок).

2. **Синхронизация репозитория (Push)** [DONE]:
  - Выполнен коммит и пуш текущих локальных изменений в удалённый репозиторий.

3. **Бизнес-стратегия и архитектура (Обогащение маркетингового документа)** [DONE]:
  - Документ `docs/00_STRATEGY/BUSINESS/RAI_BUSINESS_STRATEGY_PRESENTATION.md` радикально усилен фактологией из `ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM.md`.
  - В документ интегрированы реальные технические активы, доказывающие инвесторам, что стратегия строится на уже существующем фундаменте: 6 контуров управления, Stage 2 Agent Platform (`AgronomAgent`, `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`), `IntegrityGate`, транзакционный `Ledger` и `FSM`.
  - Масштабирование теперь привязано к текущему состоянию внедрения (интерфейсы скрывают уже работающую под капотом мощь).
  - Версия документа поднята до `1.1.0`.

## 2026-03-25

1. **Agent module org structure** [DONE]:
  - Добавлен новый execution-doc `docs/07_EXECUTION/AGENT_MODULE_ORG_STRUCTURE.md`.
  - Документ фиксирует оргструктуру агентского модуля как систему уровней ответственности, а не как простой список агентов.
  - В документе зафиксированы:
    - `Ingress Layer`
    - `Orchestration Layer`
    - `Owner Agents Layer`
    - `Expert / Escalation Layer`
    - `Trust / Governance Layer`
    - `Execution Layer`
  - Дополнительно зафиксированы:
    - owner map по уровням
    - правила эскалации
    - запреты на смешение ролей
    - правило применения оргструктуры к новым агентам и новым сценариям
    - добавлены две визуальные `Mermaid`-схемы:
      - вертикальная схема уровней
      - схема отношений между ingress, orchestration, owner agents, expert-layer, trust/governance и execution
    - добавлена простая русскоязычная ASCII-схема для быстрого чтения без терминологической нагрузки
    - уточнено, что `front_office_agent` относится только к front-office коммуникационному ingress, а бизнес-семантический вход `rai-chat` остаётся отдельным back-office маршрутом через semantic ingress и orchestration
    - добавлена простая таблица маршрутов, которая явно разводит коммуникационный вход и доменные бизнес-запросы
    - уточнено, что `front_office_agent` не является общим коммуникатором для `rai-chat`; back-office business path идёт через `rai-chat -> semantic ingress -> SupervisorAgent -> owner-agent`
  - Новый claim `CLAIM-EXE-AGENT-MODULE-ORG-STRUCTURE-20260325` зарегистрирован в `docs/DOCS_MATRIX.md`.
  - Эффект изменения: у команды появилась каноническая схема агентского модуля, по которой можно выравнивать runtime, новые agent profiles и дальнейшую архитектуру multi-agent взаимодействия.

2. **Agent module RACI and reporting lines** [DONE]:
  - Добавлен новый execution-doc `docs/07_EXECUTION/AGENT_MODULE_RACI_AND_REPORTING_LINES.md`.
  - Документ переводит оргструктуру агентского модуля в рабочую матрицу ответственности.
  - В документе зафиксированы:
    - роли `R / A / C / I / E / T`
    - reporting lines для `front_office_agent`, `semantic ingress`, `SupervisorAgent` и owner-agents
    - RACI-матрицы для коммуникационного ingress, primary owner domains, supporting branches, multi-source и composite scenarios
    - правило выбора `lead owner-agent`
    - отдельные границы для `front_office_agent`, `SupervisorAgent`, `TruthfulnessEngine` и `Branch Trust Gate`
    - минимальная матрица, обязательная для нового routing case
  - Новый claim `CLAIM-EXE-AGENT-MODULE-RACI-AND-REPORTING-LINES-20260325` зарегистрирован в `docs/DOCS_MATRIX.md`.
  - Эффект изменения: оргструктура перестала быть только схемой уровней и стала пригодной для прямого применения в routing, agent profiles, governance и implementation backlog.
  - Сопутствующее исправление docs-root policy:
    - схема `docs/Логика движения запросов.drawio` перенесена в `docs/07_EXECUTION/LOGIC_OF_REQUEST_FLOW.drawio`
    - эффект: корень `docs/` снова соответствует policy, и общий docs-линт больше не падает на root junk

3. **Instruction-layer sync with agent org structure** [DONE]:
  - Обновлён `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md`.
  - Обновлён `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_FRONT_OFFICE_AGENT_ENABLEMENT.md`.
  - В instruction-layer зафиксированы:
    - жёсткое разделение `front-office communication ingress` и `back-office rai-chat business ingress`
    - правило, что `front_office_agent` не является общим коммуникатором платформы и не может быть owner для `rai-chat` business scenarios
    - уточнённый orchestration path через `semantic ingress -> SupervisorAgent -> owner-agent`
    - дополнительный routing/RACI-контекст для `lead owner-agent`, supporting branches и trust-layer
    - тестовые и production-ready критерии против захвата `rai-chat` маршрутов `front_office_agent`-ом
  - Эффект изменения: instruction-layer синхронизирован с execution-документами по границам `front_office_agent`, `SupervisorAgent`, `lead owner-agent` и `rai-chat` business path.

## 2026-03-22

1. **TECH_MAP_GOVERNED_WORKFLOW инженерная спецификация** [DONE]:
  - Добавлен новый документ `docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md`.
  - Документ фиксирует Техкарту как governed composite workflow первого класса, а не как “сложный ответ агента”.
  - В документе зафиксированы:
    - бизнес-смысл Техкарты
    - причины, почему workflow должен быть governed
    - tech-map specialization для `semantic ingress`
    - required context model и slot matrix
    - readiness levels `S0_UNSCOPED -> S5_PUBLISHABLE`
    - missing-context / clarify model
    - assumption policy
    - owner-agent и participating agents
    - workflow phases
    - branch architecture
    - typed workflow/branch/composition contracts
    - truth / trust / evidence model
    - deterministic vs `LLM` responsibility split
    - governance / approvals / publication rules
    - explainability bundle
    - audit / forensics model
    - failure modes / anti-hallucination safeguards
    - 5 обязательных sequence-сценариев
    - MVP slice и первая implementation-декомпозиция
  - Следующим уточнением этот же spec расширен explicit expert-review слоем:
    - `chief_agronomist` зафиксирован как conditional expert-review слой, а не как owner сборки Техкарты
    - добавлена отдельная фаза `EXPERT_REVIEW`
    - введён typed contract `TechMapExpertReviewResult`
    - введена trigger-policy для вызова `chief_agronomist`
    - зафиксирован честный bypass path в human review, если expert-tier execution path недоступен
    - обновлены review/publication sequence, explainability и audit artifacts
  - Следующим усилительным проходом spec доведён до более канонического implementation-ready уровня:
    - добавлен раздел `Canonical Tech Map Domain Model` с `TechMapCanonicalDraft`, variant/object graph и persisted invariants
    - введена жёсткая state taxonomy и разведены `workflow state`, `review/approval state`, `publication state` и `persistence state`
    - `clarify` оформлен как operational subprocess с batch grouping, `ONE_SHOT / MULTI_STEP`, `resume_token`, `TTL` и expiration semantics
    - зафиксирована `Conflict Resolution And Source Authority Policy` с authority ranking, recency/specificity rules и классами разрешения конфликтов
    - усилены finance/compliance publishability-контракты: budget ceiling, unit economics thresholds, prohibited inputs, contract-linked constraints, regulatory locks, sign-off obligations
    - явно описаны write boundaries по фазам, immutable snapshots и versioning rules
    - sequence-раздел дополнен `Mermaid` diagrams: 5 сценариев, state diagram, branch dependency graph, approval swimlane
  - Следующим execution/code пакетом сделано:
    - добавлен shared governed contract-layer в `apps/api/src/shared/tech-map/` для `artifact/state/conflict/clarify`
    - добавлен helper-слой persisted status mapping/editability/transitions
    - `TechMapStateMachine` и `TechMapService.updateDraft(...)` перестали держать status/editability rules только локально и начали использовать shared source
    - добавлены execution-доки:
      - `docs/07_EXECUTION/TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md`
      - `docs/07_EXECUTION/TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md`
    - новые execution claims зарегистрированы в `docs/DOCS_MATRIX.md`
  - Следующим hardening-пакетом сделано:
    - основной spec усилен canonical `Slot Registry` contract, formal workflow verdict aggregation matrix и approval trigger/invalidation rules
    - жёстче закреплены invariants против role inflation для `chief_agronomist`
    - добавлены execution-доки:
      - `docs/07_EXECUTION/TECH_MAP_TMW-1_SLOT_REGISTRY_IMPLEMENTATION_PLAN.md`
      - `docs/07_EXECUTION/TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md`
    - в `apps/api/src/shared/tech-map/` добавлены:
      - `tech-map-slot-registry.ts`
      - `tech-map-governed-branch.types.ts`
      - `tech-map-governed-verdict.helpers.ts`
      - `tech-map-conflict-authority.helpers.ts`
    - unit-tests добавлены для slot registry, verdict aggregation и authority precedence
  - Следующим runtime adoption-срезом сделано:
    - добавлен helper `tech-map-governed-draft.helpers.ts`, который детерминированно считает `readiness`, `clarify`, `gaps`, `publicationState` и `workflowVerdict`
    - `TechMapService.createDraftStub(...)` теперь собирает governed intake по реальным данным `season / plan / cropZone / soilProfile / techMap history / harvest history / input catalog`
    - `GenerateTechMapDraftResult` расширен governed-полями `readiness / nextReadinessTarget / workflowVerdict / publicationState / clarifyItems / gaps / tasks`
    - `ResponseComposer` перестал отвечать по `generate_tech_map_draft` как по безусловно готовому draft и начал показывать governed boundary через readiness/verdict/clarify count
    - `methodology_profile_id` в текущем runtime временно выводится из deterministic blueprint metadata, что даёт честный machine-readable methodology basis вместо пустого заглушечного поля
    - добавлен unit-spec `tech-map-governed-draft.helpers.spec.ts`
  - Для управления всей программой сверху добавлен master execution-checklist:
    - `docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md`
    - он фиксирует полный маршрут `TMW-0..TMW-9`
    - он показывает, какие пакеты уже сделаны, какие в работе и какие ещё не стартовали
    - он фиксирует зависимости, текущий active slice и запрет на выход из очередности
  - Документный контур Техкарты добран до полного набора execution-пакетов:
    - добавлены `TMW-3 Clarify Loop Engine`
    - добавлены `TMW-4 Semantic Frame Extension`
    - добавлены `TMW-5 Workflow Orchestrator`
    - добавлены `TMW-7 Trust + Composition`
    - добавлены `TMW-9 Expert Review Gate`
    - master-checklist и `DOCS_MATRIX` синхронизированы с полным набором `TMW`
  - Важное синхронизированное решение:
    - текущий код остаётся source of truth для raw branch verdict enum `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`
    - на workflow-слое Техкарты введён агрегирующий verdict `BLOCKED`, чтобы не ломать текущий runtime канон и одновременно получить user/business-ориентированную governed-модель блокировки
  - Новый claim `CLAIM-ENG-TECH-MAP-GOVERNED-WORKFLOW-20260322` зарегистрирован в `docs/DOCS_MATRIX.md`.
  - Эффект изменения: у команды появился плотный инженерный источник для дальнейшего разрезания governed workflow Техкарты на backend/runtime/policy/schema/FSM implementation-пакеты, включая expert-review gate, source-authority policy и persistence/versioning boundaries.
  - Дополнительно зафиксирован текущий статус исполнения master-checklist:
  - `TMW-1` помечен как завершённый runtime slice
  - `TMW-4` помечен как завершённый runtime slice
  - `TMW-2` помечен как завершённый runtime slice
  - `TMW-3` помечен как завершённый runtime slice
  - `TMW-5` помечен как completed runtime slice с orchestrator service, live trust feed и final composition wiring
  - `TMW-7` помечен как completed runtime slice с trust specialization, branch-gated composition и variant comparison report
  - `TMW-8` помечен как completed runtime slice с persistence boundary read-model, head-draft write-guard, snapshot storage tables и versioning route
  - `TMW-9` зафиксирован как completed runtime slice с policy trigger helper, review packet contract, full audit/explainability trail и publication path
  - `TMW-3` завершён как runtime slice с clarify batch/resume metadata, explicit resume endpoint, audit trail и supervisor intake wiring
  - `TMW-4` закрыт кодом:
    - semantic ingress specialization frame для техкарты
    - typed `workflow intent / stage / policy / required actions`
    - compare / review / publication edge-cases
    - boundary-aware variant-count extraction
  - следующий управляемый шаг теперь продолжать по master-checklist с ближайшего незакрытого узла, без перескакивания через чеклист
  - `TMW-1` закрыт в коде:
    - shared slot registry
    - query helpers
    - first runtime-consumer in governed draft scoring
    - clarify/readiness/publication consumers
    - master-checklist сдвинут так, чтобы следующий активный шаг шёл по ближайшему незакрытому узлу
  - `TMW-2` закрыт в коде:
    - добавлен canonical mapper `Prisma TechMap -> TechMapCanonicalDraft`
    - добавлены invariant checks для root/variant/header clusters
    - добавлен runtime consumer `TechMapService.getCanonicalDraft(...)`
    - добавлен governed draft read-model route в `TechMapController`
    - master-checklist сдвинут так, чтобы следующий активный шаг шёл по ближайшему незакрытому узлу
  - `TMW-3` закрыт в коде:
    - добавлен clarify batch builder
    - добавлен workflow resume state builder
    - добавлен explicit clarify resume endpoint
    - добавлен clarify audit trail
    - добавлен clarify intake wiring в supervisor
    - `createDraftStub(...)` emits clarify lifecycle metadata
    - `ResponseComposer` показывает batch/resume lifecycle в summary
  - `TMW-4` закрыт в коде:
    - добавлен semantic ingress specialization frame для техкарты
    - добавлены typed `workflow intent / stage / policy / required actions`
    - закрыты compare / review / publication edge-cases и variant-count extraction
    - `SupervisorAgent` начал использовать frame как runtime metadata
  - `TMW-5` закрыт в коде:
    - добавлен first-class `TechMapWorkflowOrchestrator`
    - phase engine `INTAKE -> TRIAGE -> BRANCHING -> TRUST -> COMPOSITION` подключён
    - `TechMapService` эмитит `workflowOrchestration`
    - `getRuntimeAdoptionSnapshot(...)` подаёт live branch trust feed в workflow trace
    - runtime adoption snapshot теперь собирает branch-aware final composition
    - `ResponseComposer` показывает workflow spine в summary
    - runtime trust/composition path передан в `TMW-7`
  - `TMW-7` закрыт в коде:
    - добавлен tech-map-specific trust specialization поверх platform `Branch Trust Gate`
    - final composition contract теперь фильтрует branch payloads по разрешённому trust path
    - honest disclosure по `PARTIAL / UNVERIFIED / BLOCKED` показан в runtime summary
    - variant comparison report wired into runtime adoption snapshot и response composer
    - следующий шаг теперь `TMW-8`
  - `TMW-8` завершён в коде:
    - добавлен shared persistence boundary helper
    - `updateDraft(...)` защищён head-draft guard и больше не патчит immutable REVIEW/APPROVED/ACTIVE snapshots
    - добавлен read endpoint для persistence boundary snapshot
    - добавлен `createNextVersion(...)` route для controlled revision creation
    - добавлены immutable snapshot tables и migration-backed write-path
  - `TMW-9` завершён в коде:
    - добавлен policy-trigger helper для `chief_agronomist`
    - добавлен structured expert review packet contract
    - `TechMapWorkflowOrchestrator` и runtime adoption snapshot теперь поднимают expert review в summary
    - `ResponseComposer` показывает expert review verdict в runtime summary
    - expert review packet теперь несёт full audit/explainability trail и publication path
  - `TMW-6 PR D` закрыт в коде:
    - добавлен runtime adoption snapshot с branch results, trust assessments и authority resolutions
    - authority helper подключён в conflict resolution stage
    - добавлен runtime consumer `TechMapService.getRuntimeAdoptionSnapshot(...)`
    - master-checklist сдвинут так, чтобы следующим активным шагом стал `TMW-5`, затем `TMW-7`
  - `TMW-6` документно синхронизирован:
    - master-checklist чекбоксы для branch contracts, verdict aggregation и authority helper переведены в `DONE`
    - execution-plan `TMW-6` обновлён по evidence_refs и timestamps

## 2026-03-21

1. **Communication Proposal Rule added to `AGENTS.md`** [DONE]:
  - В корневой `AGENTS.md` добавлено новое обязательное правило формулировки предложений развития работы.
  - Теперь запрещены размытые конструкции вида `если хочешь/если хотите/могу`, когда они подменяют конкретный следующий шаг.
  - Любое предложение следующего действия теперь обязано содержать:
    - конкретное действие к выполнению
    - ожидаемый эффект
    - объяснение, зачем это действие делается и что оно улучшает для пользователя, продукта или кода
  - Эффект изменения: коммуникация должна стать более предметной, решения быстрее переходят в действие, а полезность каждого предлагаемого шага становится явной.

2. **Semantic ingress -> governed handoff execution plan** [DONE]:
  - Добавлен новый execution-план `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md`.
  - План фиксирует целевую миграцию от текущего `trigger/contract-first` routing к целевой модели `свободный ingress -> semantic intent -> owner-agent -> governed handoff`.
  - В документе зафиксированы:
    - целевое состояние
    - текущие архитектурные разрывы
    - фазовая программа рефакторинга
    - file-level backlog
    - критерии готовности
    - первый proof-slice `crm.register_counterparty`
    - правило для сложносочленённых `multi-agent` запросов: `sub-intent graph`, `lead owner-agent`, `parallel / sequential / blocking`
    - отдельное различение `multi-action request` и `multi-source analytical question`
    - `JSON-first` contract для branch-results между агентами и оркестратором
    - аналитический proof-slice `agro execution fact -> finance cost aggregation`
    - `Branch Trust Gate` как обязательный слой между branch-results и финальной композицией ответа
    - branch verdicts `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`
    - правило, что валидный `JSON` не равен доказанному факту, а trust строится через `evidence / provenance / deterministic recompute / cross-branch consistency`
    - latency budget для anti-hallucination verification: `happy path`, `multi-source read`, `cross-check triggered`
  - Новый claim `CLAIM-EXE-SEMANTIC-INGRESS-GOVERNED-HANDOFF-20260321` зарегистрирован в `docs/DOCS_MATRIX.md`.
  - Эффект изменения: у команды появился единый канонический execution-маршрут, который переводит спор о свободном чате и доверии к agent-данным из уровня обсуждения в проверяемую программу изменений.
  - Дополнительно план разложен в file-level backlog для `Branch Trust Gate`:
    - shared contracts и branch trust types
    - orchestration gate в `SupervisorAgent`
    - reusable branch-level inputs в `TruthfulnessEngine`
    - composer rules для `VERIFIED / PARTIAL / CONFLICTED / REJECTED`
    - telemetry/governance слой для trust-path
    - unit/integration/eval пакет для multi-source analytical questions
  - Эффект декомпозиции: архитектурный блок `Branch Trust Gate` стал исполнимым пакетом работ по файлам, тестам и порядку внедрения.

3. **Branch Trust Gate implementation sprint document** [DONE]:
  - Добавлен отдельный execution-doc `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md`.
  - Документ переводит `Branch Trust Gate` из уровня архитектурной идеи в отдельный спринтовый пакет.
  - В документе зафиксированы:
    - цель спринта
    - границы спринта
    - демонстрационный сценарий `agro execution fact -> finance cost aggregation`
    - PR-срезы `A/B/C/D/E`
    - file-level scope по модулям
    - checklist и acceptance criteria для каждого PR
    - unit/integration/eval пакет
    - порядок внедрения
    - sprint DoD
  - Новый claim `CLAIM-EXE-BRANCH-TRUST-GATE-IMPLEMENTATION-SPRINT-20260321` зарегистрирован в `docs/DOCS_MATRIX.md`.
  - Эффект изменения: команда получила отдельный рабочий документ, по которому можно вести реализацию `Branch Trust Gate` пакетами `A/B/C/D/E`, без повторного перевода phase-plan в инженерные задачи вручную.

3. **Business Formula E2E Dry-Run Runbook (agent + API path)** [DONE]:
  - Добавлен операционный runbook `docs/05_OPERATIONS/WORKFLOWS/BUSINESS_FORMULA_E2E_DRY_RUN_RUNBOOK.md` для сквозного ручного прогона бизнес-формулы: `Регистрация контрагента -> Контекст хозяйства -> План Урожая -> Эталон (Техкарта) -> Контроль исполнения -> Управление отклонениями -> Фактический результат -> Δ -> Монетизация`.
  - Runbook опирается на фактические runtime entrypoints кода: `rai/chat`, `crm`, `registry/fields`, `seasons`, `consulting/plans`, `consulting/execution`, `field-observation`, `consulting/yield`, `consulting/kpi`, `ofs/finance/dashboard`.
  - В документ включены минимальный тестовый датасет, примеры JSON для каждого шага, критерии успешного завершения и ограничения текущего MVP (включая `stub`-инструменты в finance/risk).
  - Новый claim `CLAIM-OPS-BUSINESS-FORMULA-E2E-DRY-RUN-20260321` зарегистрирован в `docs/DOCS_MATRIX.md`.
4. **Свободные CRM-фразы: поддержка разговорных write-сигналов (`зарегим/зарепим`)** [DONE]:
  - Усилен распознаватель write-intent в `agent-interaction-contracts`: `hasWriteActionSignal(...)` теперь учитывает разговорные формы `заре[гп]*`, что позволяет строить auto-tool-call для `register_counterparty` без "командного" стиля.
  - В `semantic-router` обновлены guardrails для CRM (`isCrmInnLookupQuery`, `isCrmWorkspaceReviewQuery`): разговорные write-фразы больше не ошибочно попадают в read-only lookup/workspace ветки.
  - В `execution-adapter-heuristics` расширены `CREATE_ACTION_SIGNAL` и CRM intent detection для разговорных форм регистрации контрагента.
  - Добавлены и зафиксированы тесты на фразы вида `Давай зарегим/зарепим контрагента, ИНН ...` в:
    - `agent-interaction-contracts.spec.ts`
    - `execution-adapter-heuristics.spec.ts`
    - `semantic-router.service.spec.ts`
  - Верификация: targeted `jest` (3 suite) и `tsc --noEmit` в `apps/api` — PASS.
  - Closeout-статус: срез подтверждён как отдельный bounded CRM-routing fix и больше не считается "висящей" незавершённой веткой рядом с `Branch Trust Gate`.
5. **Archive Recovery Rule for historical logic** [DONE]:
  - Исправлен governance-дефект документации: `docs/06_ARCHIVE` больше не трактуется как "не читать", а явно зафиксирован как обязательный search-space для recovery исторической логики, intent-map и проектной мотивации.
  - В `AGENTS.md`, `docs/CONTRIBUTING_DOCS.md`, `docs/README.md`, `docs/INDEX.md` и `docs/06_ARCHIVE/README.md` закреплено единое правило: архив читается как `historical context`, но не может подаваться как `verified operational truth` без revalidation по `code/tests/gates`.
  - Для быстрых recovery-сценариев индексированы ключевые legacy-зоны: `06_ARCHIVE/LEGACY_TREE_2026-03-20/00_STRATEGY/BUSINESS`, `CONSULTING`, `FRONT_OFFICE`, `STAGE 2`.
6. **Instructions layer restored from archive** [DONE]:
  - Подтверждён structural bug в docs reset: `11_INSTRUCTIONS` был ошибочно заархивирован, хотя матрица слоёв и линтер изначально поддерживали `Instructions` как активный first-class layer.
  - Папка восстановлена в active tree как `docs/11_INSTRUCTIONS/`.
  - В `AGENTS.md`, `docs/CONTRIBUTING_DOCS.md`, `docs/README.md`, `docs/INDEX.md` и `docs/06_ARCHIVE/README.md` закреплено правило: действующие исполняемые инструкции живут в `docs/11_INSTRUCTIONS`, а не в архиве.
7. **Documentation topology redecision and active layer restore** [DONE]:
  - Выполнен повторный semantic-scan всех docs-кластеров и отменена ошибочная сжатая модель, которая приравнивала planning/strategy/domains к legacy.
  - В active tree восстановлены `docs/00_STRATEGY`, `docs/02_DOMAINS`, `docs/06_METRICS`, `docs/07_EXECUTION`, `docs/08_TESTING`, `docs/10_FRONTEND_MENU_IMPLEMENTATION`.
  - В governance-доках закреплено разделение между `verified operational canon` и `active intent/design/planning`.
  - Добавлен аудитный артефакт `docs/_audit/DOCUMENTATION_TOPOLOGY_REDECISION_2026-03-21.md`.
  - В `docs/11_INSTRUCTIONS` починены cross-links на `docs/00_STRATEGY/STAGE 2/*`, чтобы agent docs снова использовали живой стратегический контур.

8. **Branch Trust Gate — PR A shared contracts** [DONE]:
  - Добавлен новый shared contract-file `apps/api/src/shared/rai-chat/branch-trust.types.ts`.
  - В canonical contract-layer введены типы:
    - `BranchResultContract`
    - `BranchTrustAssessment`
    - `BranchVerdict`
    - `UserFacingBranchCompositionPayload`
  - В контракте закреплены обязательные поля trust-ветки:
    - `scope`
    - `derived_from`
    - `evidence_refs`
    - `assumptions`
    - `data_gaps`
    - `freshness`
    - `confidence`
  - `AgentExecutionResult` расширен типизированными branch-артефактами:
    - `branchResults`
    - `branchTrustAssessments`
    - `branchCompositions`
  - `RaiChatResponseDto` и shared `rai-chat.dto` подготовлены под тот же контрактный слой без удаления и без ломки текущего `structuredOutput`.
  - Текущий `SupervisorAgent` trust-path теперь уже собирает typed branch artifacts для primary branch и `knowledge` cross-check branch, сохраняя совместимость с существующим `trustScore`/`structuredOutputs` поведением.
  - Execution-доки синхронизированы:
    - в `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` добавлен и отмечен checklist пакета A
    - в `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR A` переведён в completed
  - Верификация:
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts` — PASS
  - Эффект изменения: trust-layer получил единый типизированный язык данных, а следующий шаг `PR B` теперь может расширять `TruthfulnessEngine` без повторного изобретения branch-схемы.

9. **Branch Trust Gate — PR B reusable `TruthfulnessEngine` inputs** [DONE]:
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts` перестроен из post-trace-only utility в reusable input-layer для branch trust.
  - В сервисе выделены публичные методы:
    - `classifyBranchEvidence(...)`
    - `buildBranchTrustInputs(...)`
    - `resolveEvidenceStatus(...)`
  - Добавлен новый reusable контракт `BranchTrustInputs`, который собирает:
    - `classifiedEvidence`
    - `accounting`
    - `weightedEvidence`
    - `bsScorePct`
    - `evidenceCoveragePct`
    - `invalidClaimsPct`
    - `recommendedVerdict`
    - `requiresCrossCheck`
    - `reasons`
  - Trace-level метод `calculateTraceTruthfulness(...)` переведён на эти же helper-методы, поэтому branch-level и trace-level теперь используют один evidence-канон вместо двух независимых классификаторов.
  - `truthfulness-engine.service.spec.ts` расширен отдельными unit-тестами на:
    - reusable classification
    - branch-level trust inputs без full trace summary
    - pending-path без evidence
  - Execution-доки синхронизированы:
    - в `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` добавлен и отмечен checklist пакета `TruthfulnessEngine`
    - в `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR B` переведён в completed
  - Верификация:
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/truthfulness-engine.service.spec.ts` — PASS
  - Эффект изменения: inline trust gate получил готовый reusable evidence/input слой, а следующий шаг `PR C` теперь может встраивать orchestration-stage поверх уже общего truthfulness-канона, не плодя новую trust-логику.

10. **Branch Trust Gate — PR C `SupervisorAgent` orchestration trust stage** [DONE]:
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` переведён на явную стадию `branch_trust_assessment` между execution и composer.
  - Текущий trust-path больше не опирается только на локальную confidence-эвристику:
    - `SupervisorAgent` теперь использует `TruthfulnessEngine.buildBranchTrustInputs(...)`
    - selective cross-check запускается по branch trust signal, а не только по `structuredOutput.crossCheckRequired`
  - В orchestration-result прокидываются branch-level trust метрики:
    - `branchVerdict`
    - `trustScore`
    - `trustEvidenceCoveragePct`
    - `trustInvalidClaimsPct`
    - `trustBsScorePct`
  - Реализовано правило happy path:
    - verified branch не получает обязательный second-pass
    - `knowledge` cross-check branch сам не триггерит рекурсивный second-pass
  - `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts` расширен:
    - `AiAuditEntry.metadata` теперь получает `branchResults`
    - `AiAuditEntry.metadata` теперь получает `branchTrustAssessments`
    - `AiAuditEntry.metadata` теперь получает `branchCompositions`
  - В forensic phases появился отдельный этап `branch_trust_assessment`, поэтому trust-stage теперь виден в telemetry как самостоятельный orchestration hop.
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` расширен новыми регрессионными кейсами:
    - selective cross-check по verdict `UNVERIFIED` даже без explicit флага
    - happy path без second-pass
    - branch verdict и trust stage попадают в audit metadata
  - Execution-доки синхронизированы:
    - в `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` отмечен checklist пакета `SupervisorAgent`
    - в `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR C` переведён в completed
  - Верификация:
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts` — PASS
  - Эффект изменения: `SupervisorAgent` стал first-class trust orchestrator, а следующий шаг `PR D` теперь может переводить user-facing composition на branch verdict rules без повторного встраивания trust-stage в runtime spine.

11. **Branch Trust Gate — PR D honest composition rules in `ResponseComposer`** [DONE]:
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` переведён на trust-aware synthesis поверх:
    - `branchResults`
    - `branchTrustAssessments`
    - `branchCompositions`
  - Добавлен отдельный слой branch verdict composition:
    - `VERIFIED` -> confirmed fact
    - `PARTIAL` -> partial fact with mandatory limitations disclosure
    - `CONFLICTED` -> explicit conflict disclosure
    - `UNVERIFIED / REJECTED` -> insufficient evidence disclosure
  - Composer больше не использует неподтверждённые или конфликтующие branch-ветки как подтверждённый факт в user-facing тексте.
  - Для trust-aware ответов включён более жёсткий режим:
    - conflict / insufficient evidence path заменяет базовый smooth-text
    - verified / partial path добавляет разрешённый synthesis поверх base answer
  - `RaiChatResponseDto` теперь реально возвращает branch trust артефакты из composer-path, а не только переносит их в типах.
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` расширен кейсами:
    - honest conflict disclosure
    - partial disclosure with limitations
    - confirmed fact only from allowed branches
  - Execution-доки синхронизированы:
    - в `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` отмечен checklist пакета `ResponseComposer`
    - в `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR D` переведён в completed
  - Верификация:
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` — PASS
  - Эффект изменения: пользовательский ответ теперь строится по branch verdict rules, поэтому trust-layer перестал заканчиваться внутри оркестратора и стал реально влиять на честность финального ответа.

12. **Branch Trust Gate — PR E telemetry, governance и eval closure** [DONE]:
  - `TraceSummary` расширен persisted trust telemetry и latency accounting:
    - `verifiedBranchCount`
    - `partialBranchCount`
    - `unverifiedBranchCount`
    - `conflictedBranchCount`
    - `rejectedBranchCount`
    - `trustGateLatencyMs`
    - `trustLatencyProfile`
    - `trustLatencyBudgetMs`
    - `trustLatencyWithinBudget`
  - Для `ai_trace_summaries` добавлен schema-срез:
    - `packages/prisma-client/schema.prisma`
    - migration `packages/prisma-client/migrations/20260321153000_branch_trust_trace_summary_metrics/migration.sql`
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts` теперь агрегирует branch verdict counts и пишет trust latency telemetry вместе с trace quality.
  - `apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts` и `runtime-governance-policy.types.ts` получили first-class trust budget policy:
    - `happy path <= 300 ms`
    - `multi-source read <= 800 ms`
    - `cross-check triggered <= 1500 ms`
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` теперь вычисляет trust latency profile/budget и прокидывает их в `traceSummary.updateQuality(...)`.
  - Explainability/read-model подготовлен к branch trust visibility:
    - `TraceForensicsSummaryDto` расширен trust summary-полями
    - `ExplainabilityPanelService.getTraceForensics(...)` отдаёт `branchTrust`
    - `TraceSummaryDtoSchema` валидирует новые trust telemetry поля
  - Добавлен integration/eval контур:
    - `runtime-spine.integration.spec.ts` подтверждает persisted cross-check trust telemetry
    - `branch-trust.eval.spec.ts` фиксирует eval corpus для `conflict disclosure` и `selective cross-check`
  - Исправлен source-of-truth drift в execution-docs:
    - telemetry теперь учитывает verdict `UNVERIFIED`, потому что он уже канонически существует в `BranchVerdict`
  - Execution-доки синхронизированы:
    - в `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` добавлен и отмечен checklist пакета `E`
    - в `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR E` переведён в completed
  - Верификация:
    - `pnpm --filter @rai/prisma-client build` — PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/trace-summary.service.spec.ts src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/explainability/explainability-panel.service.spec.ts src/modules/explainability/dto/trace-summary.dto.spec.ts src/modules/rai-chat/eval/branch-trust.eval.spec.ts` — PASS
  - Эффект изменения: trust-path стал не только честным в orchestration/composition, но и измеримым на persisted trace-уровне, поэтому sprint `A-E` закрыт до telemetry/eval ready состояния.

13. **Semantic Ingress Frame — proof-slice foundation for `crm.register_counterparty`** [DONE]:
  - Добавлен новый shared contract `apps/api/src/shared/rai-chat/semantic-ingress.types.ts` с типом `SemanticIngressFrame`.
  - Добавлен builder `apps/api/src/modules/rai-chat/semantic-ingress.service.ts`, который собирает frame из `legacy classification`, `requestedToolCalls` и `semantic routing` сигналов.
  - `SupervisorAgent.planExecution()` теперь строит `semanticIngressFrame`, прокидывает его в `AgentExecutionRequest` и пишет в `AiAuditEntry.metadata`.
  - Для proof-slice `crm.register_counterparty` `AgentExecutionAdapterService` теперь сначала смотрит в `semanticIngressFrame.requestedOperation`, а уже потом падает в локальный CRM heuristic fallback.
  - Explainability/read-model расширен: `TraceForensicsResponseDto` и `Control Tower trace page` показывают `Semantic Ingress Frame` как отдельный forensics surface.
  - Верификация:
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-ingress.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/explainability/explainability-panel.service.spec.ts src/modules/rai-chat/eval/branch-trust.eval.spec.ts` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter web exec jest --runInBand __tests__/control-tower-trace-page.spec.tsx __tests__/control-tower-page.spec.tsx __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
  - Дополнительный сигнал: `src/modules/rai-chat/rai-chat.service.spec.ts` сейчас красный на старом widget/fail-open expectation drift; этот пакет его не менял и не закрывал.

14. **Semantic Ingress Frame — governed write-boundary и eval closure для `crm.register_counterparty`** [DONE]:
  - `SemanticIngressFrame` расширен полем `operationAuthority`, чтобы proof-slice различал `direct_user_command`, `workflow_resume` и `delegated_or_autonomous`.
  - `SupervisorAgent` теперь прокидывает authority в `RaiToolActorContext.userIntentSource` и выставляет `userConfirmed` только для прямой пользовательской команды, а не для любого живого запроса.
  - `RaiToolsRegistry` разрешает прямой CRM write bypass только при `userIntentSource = direct_user_command`; delegated/autonomous path возвращается в governed `PendingAction`.
  - `agent-interaction-contracts` усилен разговорной формой `заведи ... контрагента`, чтобы свободные register-перефразы не выпадали из proof-slice.
  - Добавлен отдельный eval corpus/gate:
    - `apps/api/src/modules/rai-chat/eval/fixtures/crm-register-semantic-ingress-eval-corpus.json`
    - `apps/api/src/modules/rai-chat/eval/semantic-ingress.eval.spec.ts`
  - Explainability/UI синхронизированы:
    - `apps/web/lib/api.ts` типизирует `operationAuthority`
    - `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx` показывает источник действия в `Semantic Ingress Frame`
  - Верификация:
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-ingress.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/tools/rai-tools.registry.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/explainability/explainability-panel.service.spec.ts src/modules/rai-chat/eval/semantic-ingress.eval.spec.ts src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts` — PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter web exec jest --runInBand __tests__/control-tower-trace-page.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: первый proof-slice закрыт уже не только на уровне typed ingress-object, но и на уровне реального governed write-boundary и самостоятельного regression gate.

13. **Branch Trust Gate — пост-спринтовое замыкание UI/read-model слоя** [DONE]:
  - `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts` и `ExplainabilityPanelService.getTruthfulnessDashboard(...)` теперь отдают отдельный агрегированный блок `branchTrust`:
    - `known/pending` coverage по trace
    - verdict counts `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`
    - `cross-check` trace count
    - budget compliance и latency aggregates
  - `apps/web/lib/api.ts` синхронизирован с расширенным explainability contract:
    - `TruthfulnessDashboardDto`
    - `TraceForensicsResponseDto`
    - типизированные branch trust DTO для trace page
  - `apps/web/app/(app)/control-tower/page.tsx` теперь показывает trust counts, budget compliance и latency aggregates прямо в quality surface `Control Tower`.
  - `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx` теперь показывает:
    - trust summary по trace
    - budget verdict и trust profile
    - branch verdict cards с причинами, evidence count, freshness и data gaps
  - Web-регрессия обновлена:
    - `apps/web/__tests__/control-tower-page.spec.tsx`
    - `apps/web/__tests__/control-tower-trace-page.spec.tsx`
  - Execution-доки синхронизированы:
    - в `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` добавлен и отмечен post-sprint consumption checklist
    - в `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` добавлен и отмечен `3.6 Post-sprint consumption closure`
  - Верификация:
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter api exec jest --runInBand src/modules/explainability/explainability-panel.service.spec.ts` — PASS
    - `pnpm --filter web exec jest --runInBand __tests__/control-tower-trace-page.spec.tsx __tests__/control-tower-page.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — BLOCKED, pre-existing errors в `__tests__/ai-chat-store.spec.ts` и `lib/stores/ai-chat-store.ts` вокруг `AiWorkWindowPayload` / `PendingClarificationState`
  - Эффект изменения: trust-path теперь реально потребляется в explainability/UI, поэтому оператор получает branch-quality и budget-вердикт без чтения raw forensic metadata.

14. **Branch Trust Gate — tenant-facing trust surface в `AI chat / work windows`** [DONE]:
  - `apps/web/lib/stores/ai-chat-store.ts` переведён на единый типобезопасный post-processing path для `/api/rai/chat`; дублирование веток `appendAssistantMessage` убрано.
  - Закрыт прежний `web tsc` drift в `ai-chat-store`:
    - `PendingClarificationState` теперь собирается через нормализацию с literal `autoResume: true`
    - старый неполный fixture `AiWorkWindowPayload` в `ai-chat-store.spec.ts` приведён к актуальному контракту
  - Из уже существующих `branchResults / branchTrustAssessments / branchCompositions` теперь собираются:
    - `trustSummary` в assistant message
    - trust-aware `structured_result` окно
    - trust-aware `related_signals` окно
    - tenant-facing сигналы в `AiSignalsStrip`
  - `apps/web/components/ai-chat/AiChatPanel.tsx` теперь показывает verdict/disclosure прямо в bubble assistant-ответа, поэтому подтверждённость ответа видна без ухода в `Control Tower`.
  - `apps/web/components/ai-chat/ai-work-window-types.ts` расширен intent `branch_trust_summary`, чтобы новый trust window слой не маскировался под доменный intent.
  - Execution-доки и `memory-bank` синхронизированы по новому tenant-facing consumption-layer.
  - Верификация:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: trust-path замкнулся до tenant-facing рабочего диалога, а branch verdict/disclosure больше не теряются между backend composer и frontend chat UX.

15. **Branch Trust Gate — canonical backend trust windows в `ResponseComposer`** [DONE]:
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` теперь строит canonical `branch_trust_summary` окна и trust signals прямо в chat response, а не оставляет рождение trust windows только на стороне `web`.
  - `apps/api/src/shared/rai-chat/rai-chat.dto.ts` расширен intent `branch_trust_summary` для `RaiWorkWindowDto.payload.intentId`, поэтому trust work windows теперь каноничны и на DTO-уровне.
  - Trust windows собираются поверх уже существующих `branchResults / branchTrustAssessments / branchCompositions`:
    - summary window `Статус подтверждения ответа`
    - signals window `Сигналы подтверждения`
    - active window сохраняет приоритет доменного rich-output, если он уже есть
  - `apps/web/lib/stores/ai-chat-store.ts` переведён в fallback-only режим:
    - если backend уже прислал `branch_trust_summary`, store не дублирует окна
    - если payload старый, локальная derivation по branch trust артефактам остаётся как backward-compatible fallback
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` расширен проверкой canonical trust windows, а `apps/web/__tests__/ai-chat-store.spec.ts` закрепляет отсутствие дубликатов при backend-generated окнах.
  - Верификация:
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` — PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: trust surface стал first-class backend payload для всех клиентов, а frontend перестал быть единственным местом сборки trust windows.

16. **Branch Trust Gate — first-class backend `trustSummary` contract** [DONE]:
  - В `apps/api/src/shared/rai-chat/branch-trust.types.ts` добавлены user-facing типы:
    - `UserFacingTrustTone`
    - `UserFacingTrustSummaryBranch`
    - `UserFacingTrustSummary`
  - `apps/api/src/shared/rai-chat/rai-chat.dto.ts` расширен first-class полем `trustSummary`, поэтому `RaiChatResponseDto` теперь несёт не только branch artifacts и work windows, но и канонический summary-контракт для клиентов.
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` теперь строит canonical backend `trustSummary` поверх уже существующих `branchResults / branchTrustAssessments / branchCompositions`, включая:
    - итоговый verdict
    - user-facing label и disclosure summary
    - `crossCheckUsed`
    - per-branch summary с evidence/gaps/conflict state
  - `apps/web/lib/stores/ai-chat-store.ts` переведён на приоритет backend `trustSummary`:
    - если backend прислал `trustSummary`, bubble и trust windows используют его как основной источник
    - локальная агрегация branch verdict остаётся только как backward-compatible fallback для старого payload
  - `apps/web/__tests__/ai-chat-store.spec.ts` закрепляет приоритет backend summary, а `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` подтверждает реальную выдачу `trustSummary` из composer-path.
  - Execution-доки и `memory-bank` синхронизированы по новому summary-контракту.
  - Верификация:
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` — PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: `assistant bubble`, `work windows` и будущие клиенты получают один backend summary-контракт, поэтому trust verdict/disclosure перестают рождаться отдельно на каждом consumer-слое.

17. **Branch Trust Gate — typed web client contract for `trustSummary`** [DONE]:
  - В `apps/web/lib/api.ts` добавлены typed client DTO:
    - `UserFacingTrustSummaryDto`
    - `UserFacingTrustSummaryBranchDto`
    - `RaiChatResponseDto`
    - `RaiChatPendingClarificationDto`
  - `apps/web/lib/stores/ai-chat-store.ts` больше не держит chat response как локальный ad-hoc контракт для trust-path:
    - `RaiChatResponsePayload` теперь алиасится на `RaiChatResponseDto`
    - `ChatTrustSummary` и `ChatTrustBranch` алиассятся на DTO из `apps/web/lib/api.ts`
    - `normalizeTrustSummary(...)` принимает typed `RaiChatResponseDto['trustSummary']`, а не `unknown`
  - Этим же срезом compile-time контракт между `/api/rai/chat` consumer-layer и `ai-chat-store` выровнен без ломки backward-compatible runtime guards.
  - Execution-доки и `memory-bank` синхронизированы по typed client-contract closure.
  - Верификация:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: `web` больше не скрывает форму trust payload за `unknown`, поэтому новые trust consumer-слои получают compile-time защиту и меньше рискуют словить незаметный drift между API и UI.

18. **Branch Trust Gate — chat transport consolidation in `apps/web/lib/api.ts`** [DONE]:
  - В `apps/web/lib/api.ts` добавлен общий typed helper `submitRaiChatRequest(...)` для `/api/rai/chat`.
  - В helper перенесены:
    - формирование `Idempotency-Key`
    - `fetch('/api/rai/chat')`
    - HTTP error normalization для chat path
  - `apps/web/lib/stores/ai-chat-store.ts` больше не держит собственный transport для chat request:
    - локальный `fetch/json/idempotency` path удалён
    - store теперь вызывает общий helper из `apps/web/lib/api.ts`
    - UI-обработка runtime/network ошибок сохранена в store без ломки abort flow
  - Request contract остался совместимым по observable surface:
    - URL `/api/rai/chat`
    - `POST`
    - `Idempotency-Key`
    - прежний body `threadId/message/workspaceContext/clarificationResume`
  - Execution-доки и `memory-bank` синхронизированы по transport consolidation.
  - Верификация:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: transport и DTO для chat path теперь живут в одном client-layer, поэтому `ai-chat-store` перестал быть скрытым HTTP-клиентом и стал ближе к чистому state/orchestration слою.

19. **Branch Trust Gate — shared chat response adapter extraction** [DONE]:
  - Добавлен новый shared adapter `apps/web/lib/rai-chat-response-adapter.ts` рядом с `apps/web/lib/api.ts`.
  - В adapter вынесены response-specific helper-слои, которые раньше жили прямо в `ai-chat-store`:
    - legacy widget migration
    - trust summary normalization
    - trust window derivation
    - pending clarification hydration
  - `apps/web/lib/stores/ai-chat-store.ts` переведён на два общих шва:
    - `submitRaiChatRequest(...)` из `apps/web/lib/api.ts`
    - `adaptRaiChatResponseForStore(...)` / `hydratePendingClarificationState(...)` из нового adapter
  - Внутри `submitRequest(...)` store теперь в основном делает state merge, а не держит собственный пакет response-логики.
  - Execution-доки и `memory-bank` синхронизированы по response-adapter extraction.
  - Верификация:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: адаптация chat response перестала быть “скрытой бизнес-логикой внутри store”, поэтому следующие client surfaces и unit-тесты смогут использовать тот же shared path без копирования zustand-кода.

20. **Branch Trust Gate — shared chat response state reducer extraction** [DONE]:
  - Добавлен новый shared state-layer `apps/web/lib/rai-chat-response-state.ts`.
  - В reducer/helper слой вынесены:
    - `resolveResponseWorkWindows(...)`
    - `resolveResponseActiveWindowId(...)`
    - `resolveResponseCollapsedWindowIds(...)`
    - `pickPreferredWorkWindow(...)`
    - signal derivation для response application path
  - `apps/web/lib/stores/ai-chat-store.ts` теперь использует `resolveRaiChatResponseState(...)` в `submitRequest(...)`, а manual window path переиспользует те же shared helper’ы.
  - Extraction отдельно уменьшил объём imperative-логики в `submitRequest(...)` и отделил response state transitions от transport/adapter слоя.
  - Execution-доки и `memory-bank` синхронизированы по reducer extraction.
  - Верификация:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` — PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - Эффект изменения: response window/application semantics перестали быть скрытой частью zustand-store, поэтому следующий evolution шаг можно делать через shared reducer вместо ручной сборки state transitions в UI-store.

21. **CRM composite flow: register_counterparty -> create_account -> open_workspace** [DONE]:
  - В `Semantic Ingress Frame` добавлен `compositePlan` для CRM follow-up flow.
  - `SupervisorAgent` исполняет staged composite workflow последовательно: `register_counterparty -> create_crm_account -> review_account_workspace`.
  - `ResponseComposer` отдаёт отдельный `crm_composite_flow` work window с owner/strategy/stage status и related signals.
  - Trace forensics и `Control Tower` показывают `Composite workflow` block как first-class ingress artifact.
  - `apps/web/lib/api.ts`, `apps/web/components/ai-chat/ai-work-window-types.ts` и trace page синхронизированы по `crm_composite_flow`.
  - Тесты на `semantic-ingress`, `supervisor-agent`, `response-composer` и `Control Tower` зелёные.
  - Эффект изменения: платформа уже умеет проводить короткий governed CRM composite сценарий как один lead-owner workflow, а не как цепочку несвязанных write/read переходов.

22. **Agro execution fact -> finance cost aggregation + branch trust eval coverage** [DONE]:
  - `Semantic Ingress Frame` теперь нормализует `agro execution fact -> finance cost aggregation` в аналитический composite workflow.
  - `SupervisorAgent` исполняет staged analytical workflow как `agronomist -> economist`.
  - `ResponseComposer` отдаёт отдельный `multi_source_aggregation` work window для аналитического composite-flow.
  - `branch-trust.eval.spec.ts` получил verified multi-source regression case для agro/finance composite payload.
  - Тесты на `semantic-ingress`, `supervisor-agent`, `response-composer` и `branch-trust.eval` зелёные.
  - Эффект изменения: multi-source analytical question теперь проходит через one-owner staged execution и branch-level trust verification без потери честности фактов.

23. **front_office_agent ingress fallback for no-route process messages** [IN PROGRESS]:
  - `classifyByAgentContracts(...)` теперь переводит no-route process-like сообщения в `front_office_agent` с intent `classify_dialog_thread` и auto tool call `ClassifyDialogThread`.
  - Safe greetings/free-chat no-route path сохранён на legacy fallback, чтобы не ломать `rai-chat.service.spec` fail-open путь.
  - `agent-interaction-contracts.spec.ts` зелёный; `pnpm --filter api exec tsc --noEmit --pretty false` также зелёный.
  - `ResponseComposerService` отдельно вернул greeting acknowledge `Принял: <message>` для простых приветствий, чтобы текущий chat fail-open path не деградировал в generic fallback.
  - Старый widget-drift в `rai-chat.service.spec.ts` переведён на текущий контракт: legacy `widgets[]` больше не ожидаются в agentExecution path, а current truth закреплена через `workWindows`/agent response behavior.
  - Следующий шаг: аккуратно расширить этот ingress path на безопасный free-chat слой без изменения текущего chat fallback.

24. **front_office_agent ingress closure for safe free-chat no-route messages** [DONE]:
  - `classifyByAgentContracts(...)` теперь переводит no-route free-chat сообщения в `front_office_agent` с intent `classify_dialog_thread`.
  - `FrontOfficeAgent` для `free_chat` классификации возвращает greeting acknowledge `Принял: <message>`, чтобы fail-open chat path сохранился.
  - `AgentRuntimeConfigService` больше не блокирует `front_office_agent` tool surface как governed-by-default without owner config.
  - `rai-chat.service.spec.ts`, `agent-runtime-config.service.spec.ts`, `agent-contracts.spec.ts` и `front-office-agent.service.spec.ts` зелёные.

25. **Semantic-first owner selection in SupervisorAgent** [DONE]:
  - `SupervisorAgent` теперь резолвит runtime owner role из `SemanticIngressFrame.requestedOperation.ownerRole` раньше legacy classification fallback.
  - semantic frame остаётся canonical для migrated slices, а legacy classification сохранён как compatibility path.
  - regression coverage добавлен в `supervisor-agent.service.spec.ts`.
  - эффект: semantic ingress теперь участвует в actual orchestration role selection, а не только в audit metadata.

26. **Semantic-first intent resolution in AgentExecutionAdapter** [DONE]:
  - `AgentExecutionAdapterService` теперь резолвит intent из `SemanticIngressFrame.requestedOperation.intent` первым для migrated roles.
  - CRM / contracts / front-office execution paths используют semantic ingress как primary source, а legacy text heuristics остаются fallback-слоем.
  - regression coverage добавлен в `runtime/agent-execution-adapter.service.spec.ts`.
  - эффект: execution path перестаёт повторно угадывать intent после semantic ingress и становится предсказуемее.

27. **Semantic-primary text heuristics gated in AgentExecutionAdapter** [DONE]:
  - для primary semantic routing text heuristics больше не используются как second guess в agronomist path
  - chief_agronomist и data_scientist также переведены на semantic-primary intent default, а text fallback оставлен только для compatibility path
  - compatibility fallback остаётся только для немигрированных/heuristic-only requests
  - эффект: migrated execution path теперь действительно следует semantic plan, а не пересобирает intent по фразе после routing

28. **Typed writePolicy added to SemanticIngressFrame** [DONE]:
  - `SemanticIngressFrame` теперь несёт typed `writePolicy` с decision `execute/confirm/clarify/block`
  - policy decision отделён от lexical signal и используется как отдельный runtime gate
  - `SupervisorAgent` теперь опирается на `writePolicy` для user-confirmed gating
  - regression coverage добавлен в `semantic-ingress.service.spec.ts`

29. **Trace forensics surfaces writePolicy** [DONE]:
  - `writePolicy` добавлен в trace forensics response как отдельное поле
  - policy decision теперь видим в observability API без чтения полного `semanticIngressFrame`
  - regression coverage добавлен в `explainability-panel.service.spec.ts`

30. **Tool registry direct-write gating uses typed writePolicy** [DONE]:
  - `RaiToolActorContext` получил typed `writePolicy` после semantic ingress normalization
  - `RaiToolsRegistry` теперь использует `writePolicy.decision === "execute"` для CRM direct-write bypass вместо одного `userIntentSource`
  - regression coverage добавлен в `tools/rai-tools.registry.spec.ts`
  - Эффект изменения: write-governance стал зависеть от canonical semantic policy, а не от косвенного string-источника intent.

31. **PendingAction workflow execution carries typed writePolicy** [DONE]:
  - `PendingActionsController` передаёт typed `writePolicy` в approved action execution
  - строковый `workflow_resume` intent больше не используется в approved action execution как source of truth
  - `approvedPendingActionId` остался отдельным bypass-маркером, не смешанным с intent source
  - Эффект изменения: approved workflow resume path теперь несёт тот же canonical policy shape, что и остальной governed write path.

32. **PendingActionsController spec locks approved write policy contract** [DONE]:
  - unit-spec проверяет, что approved pending-action execution передаёт typed `writePolicy`
  - unit-spec подтверждает отсутствие `workflow_resume` как source of truth в actor context
  - Эффект изменения: approved execution contract теперь защищён регрессией, а не только кодовым соглашением.

33. **Primary CRM/contracts routing uses safe read defaults** [DONE]:
  - CRM primary routing больше не угадывает intent по message fallback, а выбирает safe read default `review_account_workspace`
  - contracts primary routing больше не угадывает intent по message fallback, а выбирает safe read default `review_commerce_contract`
  - regression coverage добавлен в `runtime/agent-execution-adapter.service.spec.ts`
  - Эффект изменения: adapter перестал принимать текст за источник истины для primary CRM/contracts routing и теперь ведёт себя как semantic-first gate с безопасным read default.

34. **Front-office primary routing uses classify_dialog_thread default** [DONE]:
  - `front_office_agent` primary routing больше не угадывает intent по message fallback, а выбирает `classify_dialog_thread` как safe default
  - regression coverage добавлен в `runtime/agent-execution-adapter.service.spec.ts`
  - Эффект изменения: front-office primary path тоже перестал зависеть от text-based intent guessing и теперь следует semantic-first default.

35. **Agronomist primary routing uses generate_tech_map_draft default** [DONE]:
  - `agronomist` primary routing больше не пересобирает intent по phrase fallback и выбирает `generate_tech_map_draft` как safe default
  - read-only techmap registry path остаётся отдельной heuristic веткой для browsing-сценариев
  - regression coverage добавлен в `runtime/agent-execution-adapter.service.spec.ts`
  - Эффект изменения: agronomist primary path тоже стал semantic-first default, а draft-вызов больше не зависит от phrase guessing в adapter layer.

36. **Route downgraded from hard gate to contextual prior** [DONE]:
  - `semantic-router.service.ts` больше не требует `route` / `workspaceContext` как обязательный gate для key owner-intents
  - `crm`, `contracts`, `finance` и `deviation` slice detection теперь могут опираться на semantic query без route-first ветвления
  - regression coverage добавлен в `semantic-router.service.spec.ts`
  - Эффект изменения: route-space перестал быть скрытым production gate и стал именно prior для disambiguation, как и требовал phase plan.

37. **Branch Trust Gate macro-sprint final verification** [DONE]:
  - `pnpm lint:docs` — PASS
  - `pnpm lint:docs:matrix:strict` — PASS
  - `pnpm --filter api exec tsc --noEmit --pretty false` — PASS
  - `pnpm --filter web exec tsc --noEmit --pretty false` — PASS
  - targeted api jest suites — PASS
  - targeted web jest suites — PASS
  - Эффект изменения: macro-sprint закрыт не только в коде, но и в финальной runtime/docs верификации.

## 2026-03-20

1. **Routing Learning Layer — Foundation + Techmaps Cutover** [DONE]:
  - Введён canonical routing слой: `SemanticIntent`, `RouteDecision`, `RoutingTelemetryEvent`, `SemanticRoutingContext`.
  - Реализованы `routing-versioning.ts` и `routing-telemetry-redaction.ts`; persisted routing events теперь получают `routerVersion`, `promptVersion`, `toolsetVersion`, `workspaceStateDigest`.
  - `SemanticRouterService` встроен в `SupervisorAgent` как `shadow-first` слой; для slice `agro.techmaps.list-open-create` включён `semantic_router_primary`.
  - В `AgentRuntimeService` добавлен coarse capability gating по `semanticRouting.routeDecision.eligibleTools`.
  - `SupervisorForensicsService` теперь пишет sanitized `routingTelemetry` в `AiAuditEntry.metadata`.
  - В explainability добавлен divergence read-model и endpoint `GET /api/rai/explainability/routing/divergence`.
  - В `apps/web/app/(app)/control-tower/page.tsx` добавлена панель расхождений legacy vs semantic routing.
  - Собран fixture-driven eval corpus `techmaps-routing-eval-corpus.json`; добавлен spec `semantic-router.eval.spec.ts` с кейсами `navigate/execute/clarify/abstain`.
  - Добавлен отдельный gate `pnpm gate:routing:techmaps`; он заведён в `.github/workflows/invariant-gates.yml` как hard-fail шаг.
  - `routing/divergence` расширен до agent-level drilldown: backend теперь отдаёт `agentBreakdown`, а `Control Tower` показывает самый шумный `targetRole`, его divergence rate, decision breakdown и top mismatch kinds.
  - `routing/divergence` дополнительно расширен `failureClusters`: read-model группирует `targetRole + decisionType + mismatchKinds`, считает `semanticPrimaryCount`, `lastSeenAt` и `caseMemoryReadiness`.
  - В `Control Tower` добавлен triage-блок повторяющихся кластеров с ready-state `наблюдение / нужно больше сигналов / готово к памяти кейсов`.
  - `routing/divergence` дополнительно расширен `caseMemoryCandidates`: read-model теперь режет кандидатов по версиям `routerVersion / promptVersion / toolsetVersion`, считает `traceCount`, `firstSeenAt`, `lastSeenAt`, `ttlExpiresAt`.
  - В `Control Tower` добавлен блок `Кандидаты в память кейсов`, чтобы оператор видел version-aware кандидатов без отдельной БД и ручной сборки.
  - Подтверждены дополнительные проверки: `explainability-panel.service.spec.ts`, `explainability-panel.controller.spec.ts`, `control-tower-page.spec.tsx`.
  - Подтверждены новые проверки: `pnpm gate:routing:techmaps`, `semantic-router.eval.spec.ts`, `semantic-router.service.spec.ts`.
  - Подтверждены targeted проверки: `pnpm --filter api exec tsc --noEmit --pretty false`, `semantic-router.service.spec.ts`, `supervisor-agent.service.spec.ts`, `explainability-panel.service.spec.ts`, `control-tower-page.spec.tsx`.
  - `pnpm --filter web exec tsc --noEmit --pretty false` остаётся красным из-за уже существующих ошибок в `ai-chat-store` и `lib/stores/ai-chat-store.ts`, не связанных с текущим routing-пакетом.
2. **Routing Case Memory Capture Path** [DONE]:
  - В `apps/api/src/modules/explainability/dto/routing-divergence.dto.ts` добавлены capture-контракты: `CaptureRoutingCaseMemoryCandidateDtoSchema` и `RoutingCaseMemoryCandidateCaptureResponseDto`.
  - `ExplainabilityPanelService` теперь умеет фиксировать `ready_for_case_memory` кандидата через `AuditLog` action `ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED` и возвращает `captureStatus / capturedAt / captureAuditLogId` в divergence read-model.
  - Добавлен guarded endpoint `POST /api/rai/explainability/routing/case-memory-candidates/capture`; `apps/web/lib/api.ts` получил клиентский метод с `Idempotency-Key`.
  - `Control Tower` показывает capture-status по кандидату и даёт операторскую кнопку `зафиксировать` для готовых кейсов.
  - Подтверждены targeted проверки: `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/explainability/explainability-panel.service.spec.ts src/modules/explainability/explainability-panel.controller.spec.ts`, `pnpm --filter web exec jest --runInBand __tests__/control-tower-page.spec.tsx`.
3. **Routing Case Memory Retrieval & Lifecycle** [DONE]:
  - Добавлен `apps/api/src/modules/rai-chat/semantic-router/routing-case-memory.service.ts`: сервис читает captured cases из `AuditLog`, фильтрует по `TTL`, считает relevance-score и переводит кейс в lifecycle `active` через action `ROUTING_CASE_MEMORY_CASE_ACTIVATED`.
  - `SemanticRouterService` теперь принимает `companyId`, подтягивает `retrievedCaseMemory[]` и использует их как bounded retrieval слой до `LLM refine`.
  - Введён safe override только для low-risk routing: если deterministic path ушёл в `abstain`, а active case memory уверенно указывает на `safe_read navigate/clarify`, роутер может восстановить правильный read-only маршрут без write escalation.
  - Explainability read-model теперь различает `not_captured / captured / active`, а `caseMemoryCandidates` несут `semanticIntent`, `routeDecision`, `activatedAt`, `activationAuditLogId`.
  - `Control Tower` показывает lifecycle кандидата (`не зафиксирован / зафиксирован / активен в маршрутизации`) и timestamps захвата/активации.
  - Подтверждены targeted проверки: `pnpm --filter api exec tsc --noEmit --pretty false`, `routing-case-memory.service.spec.ts`, `semantic-router.service.spec.ts`, `semantic-router.eval.spec.ts`, `explainability-panel.service.spec.ts`, `explainability-panel.controller.spec.ts`, `control-tower-page.spec.tsx`.
4. **Routing Case Memory Gate Hardening** [DONE]:
  - `apps/api/package.json` script `test:routing:techmaps` расширен: теперь он прогоняет не только `semantic-router.eval.spec.ts`, но и `semantic-router.service.spec.ts` + `routing-case-memory.service.spec.ts`.
  - В `semantic-router.service.spec.ts` добавлен negative guard: case memory не имеет права поднимать `write`-маршрут из `abstain` даже при высоком similarity.
  - `.github/workflows/invariant-gates.yml` обновлён: hard-fail шаг теперь честно проверяет `Routing techmaps + case memory gate`.
  - Подтверждены `pnpm gate:routing:techmaps` и `pnpm --filter api exec tsc --noEmit --pretty false`.
5. **Routing Learning Layer — Second Slice `agro.deviations.review`** [DONE]:
  - В `SemanticRouterService` введён отдельный `sliceId` `agro.deviations.review`; primary promotion разрешается только внутри `deviations`-контура и больше не перехватывается `techmaps` через общий `field`-сигнал.
  - `collectToolIdentifiers()` теперь учитывает `ComputeDeviations`, а `RoutingCaseMemoryService.inferSliceId()` понимает `/consulting/deviations`, поэтому versioning и retrieval не смешивают `techmaps` и `deviations`.
  - `AgentExecutionAdapterService` исправлен: при `request.semanticRouting.source === primary` agronomist-путь больше не затирает `executionPath` в `tool_call_primary`; теперь для `compute_deviations` честно возвращается `semantic_router_primary`.
  - Fixture-driven eval corpus расширен файлом `deviations-routing-eval-corpus.json` с позитивными primary-кейсами и негативным кейсом вне bounded slice.
  - Введён канонический gate `pnpm gate:routing:agro-slices`; старый `pnpm gate:routing:techmaps` сохранён как compatibility alias. CI-шаг в `.github/workflows/invariant-gates.yml` переведён на новый gate.
  - Подтверждены `pnpm gate:routing:agro-slices` и `pnpm --filter api exec tsc --noEmit --pretty false`.
6. **Routing Learning Layer — Third Slice `finance.plan-fact.read`** [DONE]:
  - `RoutingEntity` расширен значением `plan_fact`, а `SemanticRouterService` получил отдельный bounded slice `finance.plan-fact.read`.
  - Primary promotion для `compute_plan_fact` ограничен `workspaceRoute` вида `/consulting/yield` и `/finance`; вне этого контура запросы остаются только в `shadow`.
  - В `yield`-контуре `selectedRowSummary.kind = yield` теперь маппится в `planId`, поэтому `compute_plan_fact` может идти в `execute` без искусственного добора контекста.
  - Если нет ни `planId`, ни `seasonId`, semantic-router честно отдаёт `clarify` и `requiredContextMissing = [seasonId]` вместо silent fallback.
  - Fixture-driven eval corpus расширен файлом `plan-fact-routing-eval-corpus.json`; общий gate переименован в `pnpm gate:routing:primary-slices`, а старые `pnpm gate:routing:agro-slices` и `pnpm gate:routing:techmaps` сохранены как алиасы.
  - Подтверждены `pnpm gate:routing:primary-slices`, `pnpm gate:routing:techmaps` и `pnpm --filter api exec tsc --noEmit --pretty false`.
7. **Routing Learning Layer — Fourth Slice `finance.scenario.analysis` + `finance.risk.analysis`** [DONE]:
  - `RoutingEntity` расширен значениями `scenario` и `risk_assessment`; `SemanticRouterService` теперь различает `simulate_scenario`, `compute_risk_assessment` и `compute_plan_fact` как разные finance-сущности.
  - В `SemanticRouterService` добавлены отдельные bounded slice `finance.scenario.analysis` и `finance.risk.analysis`: primary promotion разрешён только в `yield/finance`-контуре, а вне него сохранён `shadow` по явным finance-сигналам.
  - `RoutingCaseMemoryService.inferSliceId()` теперь понимает `scenario/risk` сигналы на `yield/finance`-маршрутах, поэтому retrieval не смешивает новые finance-slice с `plan-fact`.
  - `AgentExecutionAdapterService` получил явный `resolveEconomistIntent()`: primary semantic-routing больше не затирается в `compute_plan_fact`, если выбран `simulate_scenario` или `compute_risk_assessment`.
  - Fixture-driven eval corpus расширен файлами `scenario-routing-eval-corpus.json` и `risk-routing-eval-corpus.json`; `semantic-router.service.spec.ts` и `agent-execution-adapter.service.spec.ts` усилены primary-кейсами для обоих новых slice.
  - Подтверждены `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` и `pnpm gate:routing:primary-slices`.
8. **Routing Learning Layer — CRM Slice `crm.account.workspace-review`** [DONE]:
  - `RoutingEntity` расширен значением `account`; `SemanticRouterService` получил новый bounded read-only slice `crm.account.workspace-review`.
  - Slice активируется как `primary` только на `route-space` `/parties | /consulting/crm | /crm`, но при явном сильном CRM-сигнале остаётся `shadow` и вне bounded route-space.
  - В `semantic-router` реализован честный контракт `accountId/query -> execute`, а при пустом таргете `review_account_workspace` уходит в `clarify`, а не в silent fallback.
  - Закрыт runtime-gap: `CrmAgentInput` получил `query`, `CrmAgent` перестал требовать только `accountId` для `review_account_workspace`, а `AgentExecutionAdapterService` начал извлекать и прокидывать `query` через `extractCrmWorkspaceQuery(...)`.
  - `RoutingCaseMemoryService.inferSliceId()` теперь различает CRM workspace slice на `route-space` `/parties | /consulting/crm | /crm` и не смешивает его с finance/agro memory retrieval.
  - Fixture-driven eval corpus расширен файлом `crm-workspace-routing-eval-corpus.json`; `semantic-router.service.spec.ts`, `agent-execution-adapter.service.spec.ts` и `crm-agent.service.spec.ts` усилены кейсами `selected account`, `director question`, `clarify`.
  - Подтверждены `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/agents/crm-agent.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` и `pnpm gate:routing:primary-slices`.
9. **Routing Learning Layer — Contracts Slice `contracts.registry-review`** [DONE]:
  - В `SemanticRouterService` добавлен новый bounded read-only slice `contracts.registry-review`; primary promotion ограничен route-space `/commerce/contracts`.
  - Внутри slice semantic-router теперь различает `list_commerce_contracts` и `review_commerce_contract`, а generic singular-запрос без таргета честно уходит в `clarify`.
  - `ContractsAgentInput` расширен полем `query`; read-only контур `GetCommerceContract` и его Joi-schema теперь принимают `contractId` или `query`.
  - `ContractsToolsRegistry` получил safe lookup по `contractId / number / quoted query / party name`, не затрагивая write-path и не вводя новый store.
  - `AgentExecutionAdapterService` теперь берет contracts-intent сначала из primary semantic-routing и реально прокидывает `query` для review-запросов по номеру договора.
  - Исправлена эвристическая коллизия: `detectContractsIntent()` больше не валит фразы вида `покажи договор DOG-001` в `list_commerce_contracts`.
  - Закрыт междоменный конфликт `CRM vs Contracts`: `isCrmWorkspaceReviewQuery()` больше не активируется на generic `карточка договора` вне CRM-route, поэтому `contracts`-slice не перехватывается CRM read-only веткой.
  - Fixture-driven eval corpus расширен файлом `contracts-routing-eval-corpus.json`; общий `pnpm gate:routing:primary-slices` теперь подтверждает уже семь bounded slice.
  - Подтверждены `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/shared/rai-chat/execution-adapter-heuristics.spec.ts src/modules/rai-chat/agents/contracts-agent.service.spec.ts`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` и `pnpm gate:routing:primary-slices`.
10. **Routing Learning Layer — Knowledge Slice `knowledge.base.query`** [DONE]:
  - В `SemanticRouterService` добавлен новый bounded read-only slice `knowledge.base.query`; primary promotion разрешён только внутри route-space `/knowledge*`.
  - В knowledge-контуре semantic-router трактует пользовательскую реплику как безопасный `query_knowledge`, не создавая отдельный write-path и не расширяя tool-surface beyond `QueryKnowledge`.
  - Route-priority закреплён выше phrase-bound эвристик: внутри `/knowledge/base` запрос `как составить техкарту по рапсу` уходит в `query_knowledge`, а не в `tech_map_draft`.
  - Вне `/knowledge*` semantic-router не перехватывает knowledge-запросы в `primary`; сохраняется безопасный `shadow`, что не даёт knowledge-срезу расползтись в междоменный шум.
  - `collectToolIdentifiers()`, `buildDialogState()`, `resolveIntentFromCaseMemory()` и `resolveCaseMemoryCandidateLabel()` расширены knowledge-семантикой; `RoutingCaseMemoryService.inferSliceId()` теперь различает `/knowledge`.
  - Fixture-driven eval corpus расширен файлом `knowledge-routing-eval-corpus.json`; `semantic-router.service.spec.ts` и `agent-execution-adapter.service.spec.ts` усилены primary-кейсами для `query_knowledge`.
  - Подтверждены `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` и `pnpm gate:routing:primary-slices`.
11. **Routing Learning Layer — CRM INN Lookup Slice `crm.counterparty.lookup`** [DONE]:
  - Добавлен новый bounded read-only slice `crm.counterparty.lookup` для интента `lookup_counterparty_by_inn` с primary promotion только в CRM route-space (`/parties | /consulting/crm | /crm`).
  - `SemanticRouterService` теперь различает два CRM read-only контура: `crm.account.workspace-review` и `crm.counterparty.lookup`, включая deterministic `clarify` при фразе `по ИНН` без номера.
  - `execution-adapter-heuristics.ts` расширен mapping-логикой: `LookupCounterpartyByInn -> lookup_counterparty_by_inn`, fallback-извлечение ИНН и tool mapping на `RaiToolName.LookupCounterpartyByInn`.
  - `AgentExecutionAdapterService` получил приоритетный `resolveCrmIntent()` с порядком `explicit tool call -> semantic eligible tools -> semantic slice -> fallback`, а также fallback-добор `inn` из текста запроса.
  - `CrmAgent` расширен новым intent `lookup_counterparty_by_inn` с обязательным `inn`, вызовом registry tool `lookup_counterparty_by_inn` и отдельным explain/evidence path.
  - `RoutingCaseMemoryService.inferSliceId()` умеет выделять `crm.counterparty.lookup`, не смешивая его с `crm.account.workspace-review`.
  - Fixture-driven eval corpus расширен файлом `crm-inn-lookup-routing-eval-corpus.json`; добавлены/обновлены unit-tests в `semantic-router.service.spec.ts`, `agent-execution-adapter.service.spec.ts`, `crm-agent.service.spec.ts`, `execution-adapter-heuristics.spec.ts`.
  - Подтверждены `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/shared/rai-chat/execution-adapter-heuristics.spec.ts src/modules/rai-chat/agents/crm-agent.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.eval.spec.ts` и `pnpm gate:routing:primary-slices`.
12. **Routing Learning Layer — Contracts AR Slice `contracts.ar-balance.review`** [DONE]:
  - Добавлен новый bounded read-only slice `contracts.ar-balance.review` для интента `review_ar_balance` с primary promotion только в contracts route-space (`/commerce/contracts`).
  - `SemanticRouterService` теперь разделяет контуры `contracts.registry-review` и `contracts.ar-balance.review`, чтобы запросы по дебиторке не смешивались с реестром/карточкой договора.
  - Для `review_ar_balance` введён deterministic контракт: `execute` при наличии `invoiceId`, `clarify` с `requiredContextMissing = [invoiceId]` при его отсутствии.
  - Добавлен `invoiceId` resolver для workspace/context path (`selectedRowSummary`, `activeEntityRefs`, `filters`) и bounded message-parse (`INV/INVOICE` шаблон) без write-эскалации.
  - `RoutingCaseMemoryService.inferSliceId()` расширен новым slice, чтобы case-memory retrieval не смешивал AR-кейсы с `contracts.registry-review`.
  - `AgentExecutionAdapterService.resolveContractsIntent()` теперь приоритетно учитывает `semanticRouting.routeDecision.eligibleTools` и `sliceId` для `GetArBalance -> review_ar_balance`.
  - Fixture-driven eval corpus расширен файлом `contracts-ar-balance-routing-eval-corpus.json`; обновлены unit-tests в `semantic-router.service.spec.ts` и `agent-execution-adapter.service.spec.ts`.
  - Подтверждены `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.eval.spec.ts` и `pnpm gate:routing:primary-slices`.

## 2026-03-16

1. **A-RAI Director Answer Window UX** [DONE]:
  - `review_account_workspace` для вопроса `Как зовут директора <контрагент>?` переведён на отдельный compact-presenter: в structured result больше не выводится `ИНН`, вместо этого показываются `ФИО`, `телефон`, `email`.
  - `StructuredResultWindow` получил адаптивный compact shell для коротких факт-ответов: ширина больше не раздувается до full-screen, а высота ограничена с внутренним scroll только при длинном контенте.
  - Таргетированные проверки: `apps/api response-composer.service.spec.ts` PASS, `apps/web structured-result-window.spec.tsx` PASS.
  - `rai-api` и `rai-web` перезапущены, чтобы новый UX сразу пошёл в live runtime.
2. **Party/Account Projection Spine** [DONE]:
  - Закрыт системный drift между `Party` и CRM `Account` без ввода hard Prisma relation: в `accounts` добавлен soft-link `partyId` и индекс `[companyId, partyId]`.
  - `PartyService` теперь автоматически проецирует `Party -> Account` и `Party -> CRM Contact` при создании/обновлении контрагента; директор из `registrationData.meta.managerName` попадает в CRM как `DECISION_MAKER`.
  - `CrmService` переведён на прямой `partyId`-резолвинг в workspace/create-flow, а `updateAccountProfile` пишет master-поля обратно в `Party` (`shortName/inn/jurisdiction`).
  - `FrontOfficeAuthService.resolveAccount()` теперь сначала ищет аккаунт по `partyId`, а не по эвристике имени/ИНН.
  - Применён manual migration `packages/prisma-client/migrations/20260316100000_account_party_projection_soft_link/migration.sql`, затем выполнен backfill `scripts/db/backfill-account-party-projection.ts` с итогом `parties=5 / createdAccounts=1 / updatedAccounts=4 / syncedContacts=2`.
  - Live smoke через `POST /api/rai/chat` подтверждает новое поведение: `Как зовут директора Сысои?` -> `Директор ООО "СЫСОИ" — Евдокушин Петр Михайлович.`
3. **Git Push / Manual Repo Sync** [DONE]:
  - Успешно выполнена синхронизация с удаленным репозиторием (`git push origin main`).
  - Запушены изменения по Front Office, Agent Runtime UI и планам интеграции (PWA, Telegram).
4. **DB Refactor Program — FrontOffice Wave Closeout Packet** [DONE]:
  - Подготовлен финальный closeout-док `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_WAVE_CLOSEOUT.md`.
  - В документ заранее открыты 5 обязательных секций: `final observation verdict`, `incidents / regressions summary`, `rollback usage summary`, `lessons learned`, `reusable pattern for next wave`.
  - `DB_PHASE_7_STATUS.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md`, `DB_FRONT_OFFICE_OBSERVATION_24H.md` и memory-bank синхронизированы на статус: `Phase 7 Wave 1: end-to-end packet complete, awaiting formal closeout after 24h live observation.`
5. **DB Refactor Program — FrontOffice 24H Observation Packet** [DONE]:
  - Выпущен отсутствовавший канонический cutover runbook `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER.md`; теперь Phase 7 пакет на диске консистентен со status-файлами.
  - Добавлен отдельный live-window артефакт `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_OBSERVATION_24H.md`.
  - В observation-doc зафиксированы: точное время старта окна, состояние флагов, API restart marker, журнал ошибок/исключений по front-office маршрутам, mismatch/drift counters, rollback triggers и финальный статусный слот `PASS | PASS WITH NOTES | FAIL`.
  - `DB_PHASE_7_STATUS.md`, `DB_FRONT_OFFICE_TENANT_WAVE_1.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md` и memory-bank синхронизированы на статус: `FrontOfficeThread wave: cutover and rollback proven; pending final 24h live observation confirmation.`
6. **DB Refactor Program — Phase 7 FrontOfficeThread Cutover Packet** [DONE]:
  - Выпущен cutover runbook `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER.md` с `prechecks`, `freeze conditions`, `flag strategy`, `shadow-read compare rules`, `mismatch thresholds`, `rollback trigger` и `post-cutover observation window`.
  - Добавлен `TenantIdentityResolverService`: auth boundary теперь резолвит реальный `tenantId` через `TenantCompanyBinding/TenantState`, а не слепо тащит `companyId` как surrogate tenant key.
  - `PrismaService` получил selective read cutover cohort через `TENANT_DUAL_KEY_ENFORCE_MODELS`, что позволяет переводить в enforce не все dual-key модели сразу, а только `FrontOfficeThread` family.
  - Добавлен compare-script `scripts/db/front-office-shadow-read-compare.cjs`; `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_SHADOW_COMPARE.md` подтверждает parity `threads/messages/handoffs/participant_states` между legacy и dual-key path (`0` mismatch).
  - Добавлен runtime smoke drill `scripts/db/front-office-cutover-drill.ts`; `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_CUTOVER_DRILL.md` подтверждает `cutover snapshot parity = PASS` и `rollback verification status = VERIFIED`.
  - Таргетированные проверки: `pnpm --dir apps/api exec jest --runInBand --silent src/shared/prisma/prisma-tenant-middleware.spec.ts src/shared/tenant-context/tenant-identity-resolver.service.spec.ts` PASS; `pnpm --dir apps/api exec tsc --noEmit --pretty false` PASS.
7. **Git Pull / Manual Repo Sync** [DONE]:
  - Успешно выполнена синхронизация с удаленным репозиторием (`git pull origin main`).
  - Локальная копия обновлена, конфликтов не обнаружено.
8. **RAI_EP SWOT Analysis via Market Research** [DONE]:
  - Проведен конкурентный SWOT-анализ системы RAI_EP на основе свежих исследований рынка РФ/СНГ.
  - Сформирован файл `RAI_EP_SWOT_ANALYSIS.md` в папке активных исследований.
  - Выявлены стратегические окна: Decision Support для ТОПов и интеграционный хаб поверх 1С/телематики.

## 2026-03-14

1. **Docs Consolidation — `ALL_DOCS` Creation** [DONE]:
  - Создана директория `/root/RAI_EP/ALL_DOCS` для плоского хранения всех документов проекта.
  - Все файлы из `/root/RAI_EP/docs` и её поддиректорий скопированы в `/root/RAI_EP/ALL_DOCS`.
  - Использована стратегия `--backup=numbered` для предотвращения потери данных при совпадении имен файлов (создано 628 файлов, из них 24 с суффиксами бэкапа).
  - Структура папок в `ALL_DOCS` отсутствует, все файлы лежат в корне директории.
2. **DB Refactor Program — Phase 7 FrontOfficeThread Wave Bootstrap** [DONE]:
  - Для `default-rai-company` отсутствовал весь platform boundary слой (`tenants`, `tenant_company_bindings`, `tenant_states` были пустыми), из-за чего wave-1 оставалась schema-ready, но не backfilled.
  - Добавлен повторяемый bootstrap/backfill script `scripts/db/bootstrap-front-office-tenant-wave.cjs` и команда `pnpm db:front-office-wave:bootstrap`; скрипт создает `Tenant`, primary `TenantCompanyBinding`, `TenantState` и повторно backfill-ит `FrontOfficeThread` family.
  - После bootstrap null-backlog схлопнут `1/6/1/1 -> 0/0/0/0` для `threads/messages/handoffs/participant_states`.
  - Повторный shadow-validation сформировал `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION.md` с `0` mismatch и `0` null rows.
  - Синхронизированы `DB_PHASE_7_STATUS.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_CONTRACTS.md`, `DB_FRONT_OFFICE_TENANT_WAVE_1.md`, checklist и memory-bank.
3. **DB Refactor Program — Migration Deploy + EXPLAIN Evidence Run** [DONE]:
  - Выполнен `prisma migrate deploy` на БД из `.env`; обнаруженный migration-defect в `20260313214500_phase5_budget_category_literal_fix` (таблица `budget_items`) исправлен на `consulting_budget_items`.
  - Выполнено recovery без разрушения history: `prisma migrate resolve --rolled-back 20260313214500_phase5_budget_category_literal_fix` + повторный `migrate deploy` (успешно).
  - Добавлен автоматизированный evidence-script `scripts/db/explain-hot-paths.cjs` и команда `pnpm db:explain:hot`.
  - Сформирован отчет `docs/01_ARCHITECTURE/DATABASE/DB_EXPLAIN_ANALYZE_2026-03-13.md` с `EXPLAIN ANALYZE` для hot-path `Season/Task/HarvestPlan/Party`.
  - Синхронизированы зависимые артефакты: `DB_PHASE_6_STATUS.md`, `DB_INDEX_AUDIT.md`, memory-bank.
4. **DB Refactor Program — Index Observation Window + Growth KPI Automation** [DONE]:
  - Запущен `14-day` observation window для removal-candidate индексов, сформирован snapshot `docs/01_ARCHITECTURE/DATABASE/DB_INDEX_OBSERVATION_WINDOW_2026-03-13.md` на основе `pg_stat_user_indexes`/`pg_stat_user_tables`.
  - `DB_INDEX_EVIDENCE_REGISTER.md` обновлен фактическими candidate-индексами и стартовыми usage-метриками (`idx_scan` snapshot).
  - Внедрен growth KPI контур: `scripts/db/init-model-growth-baseline.cjs`, `scripts/db/measure-model-growth-kpi.cjs`, baseline `DB_MODEL_GROWTH_BASELINE.json`, отчет `DB_MODEL_GROWTH_KPI.md`.
  - Добавлены команды: `pnpm db:index:observe`, `pnpm db:kpi:growth:baseline`, `pnpm db:kpi:growth`, `pnpm gate:db:growth-kpi:enforce`.
  - CI workflow обновлен шагом `DB growth KPI gate (hard fail)`; локальные прогоны новых команд и gate — PASS.
5. **DB Refactor Program — Continuous Phase 2-8 Execution (Wave 2)** [DONE]:
  - Phase 2 de-root wave-1 выполнен в `packages/prisma-client/schema.prisma`: удалены direct `Company` relations из control-plane/runtime/memory набора (`SystemIncident`, `IncidentRunbookExecution`, `RuntimeGovernanceEvent`, `PerformanceMetric`, `PendingAction`, `AgentConfiguration`, `AgentCapabilityBinding`, `AgentToolBinding`, `AgentConnectorBinding`, `AgentConfigChangeRequest`, `EvalRun`, `KnowledgeNode`, `KnowledgeEdge`) при сохранении совместимого `companyId` scalar path.
  - Метрика `Company` direct relations снижена `140 -> 87`; выпущен staged deprecation и compatibility plan `docs/01_ARCHITECTURE/DATABASE/DB_COMPANY_DEROOT_DEPRECATION_PLAN.md`.
  - Governance residual закрыт: `ADR_DB_001..005` переведены в `accepted`, добавлен owner-review guard `.github/CODEOWNERS`, `READ_MODEL_POLICY.md` и `DB_SUCCESS_METRICS.md` помечены как approved.
  - Execution artifacts дополнены: `DB_INCLUDE_DEPTH_METRICS.md` (+ скрипт `scripts/measure-prisma-include-depth.cjs`), `DB_ENUM_OVERLAP_MATRIX.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_CONTRACTS.md`, `DB_MG_CORE_DECISION_NOTE.md`.
  - Чеклист/phase-status/memory-bank синхронизированы; `DB_REFACTOR_CHECKLIST` закрыт полностью, KPI window по growth-safety переведен в active measurement mode.
6. **DB Refactor Program — Autonomous Phase 2-8 Execution Wave** [DONE]:
  - Phase 2: зафиксированы baseline/target и core-map для `Company de-rooting`; фактический relation reduction остается residual и вынесен в `DB_PHASE_2_STATUS.md`.
  - Phase 3: добавлен schema fragmentation toolchain (`split/compose/check`), созданы `00..10` fragment-файлы в `packages/prisma-client/schema-fragments`, добавлен CI gate `gate:db:phase3:enforce` и workflow wiring.
  - Phase 4: создан `DB_PROJECTION_REGISTER.md`, READ_MODEL policy дополнен `staleness_tolerance` и `deletion_reconciliation_semantics`, добавлен gate `gate:db:projections:enforce`.
  - Phase 5: `ENUM_DECISION_REGISTER.md` синхронизирован на полный инвентарь `149` enum, добавлен gate `gate:db:enum-register:enforce`.
  - Phase 6: выполнен workload index wave `20260313113000_phase6_workload_index_tuning` + schema updates + `DB_INDEX_EVIDENCE_REGISTER.md`, добавлен gate `gate:db:index-evidence:enforce`.
  - Phase 7: зафиксирован operational migration policy `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md` с hard guard «одна core family за волну».
  - Phase 8: выпущен decision record `DB_PHYSICAL_SPLIT_DECISION.md` (single physical DB retained, split only on proven bottleneck).
  - Сформирован status-packet `DB_PHASE_2_STATUS.md ... DB_PHASE_8_STATUS.md`; checklist/roadmap/metrics/memory-bank синхронизированы.
7. **DB Refactor Program — Checklist Hardening to Execution Packet** [DONE]:
  - `DB_REFACTOR_CHECKLIST` усилен по governance: добавлена каноническая precedence-цепочка при конфликте (`manifest/policy > phase status > checklist > roadmap`) и merge-правило синхронизации lower-priority документов.
  - В `Phase 2` зафиксирован измеримый baseline/target для `Company` de-rooting (`direct relations: 140 -> <=95`) и явный допустимый business/legal core.
  - `Phase 3` расширен rule-set для shared primitives (`ids/timestamps`, technical enums, audit primitives, relation conventions), чтобы `00_base.prisma` не стал mini-god-fragment.
  - `Phase 4` metadata contract дополнен `staleness tolerance` и `deletion/reconciliation semantics`.
  - `Phase 5` добавлен обязательный deliverable `ENUM_DECISION_REGISTER.md`; реестр создан в `docs/01_ARCHITECTURE/DATABASE/ENUM_DECISION_REGISTER.md`.
  - `Phase 6` формализован через обязательный index evidence contract и обязательное production observation window перед удалением индексов.
  - `Phase 7` добавлен жесткий wave-limit: `Season/HarvestPlan/TechMap/Task` нельзя мигрировать параллельно более одной aggregate family за волну.
  - Program-level metrics переведены в числовой вид в checklist и `DB_SUCCESS_METRICS.md` (baseline/target для company relations, scope ambiguity backlog, enum taxonomy, hot query index debt, include depth, growth safety KPI).
8. **DB Refactor Program — Phase 1 Additive Tenancy Closure** [DONE]:
  - Закрыт Phase 1 execution slice: в `packages/prisma-client/schema.prisma` добавлены `Tenant` и `TenantCompanyBinding`, а в control-plane/runtime модели добавлены additive `tenantId` поля без destructive изменений core business aggregates.
  - Добавлен migration wave `packages/prisma-client/migrations/20260313103000_phase1_additive_tenant_boundary/migration.sql` (new tenant tables + additive tenant columns/indexes для Phase 1 model set).
  - Runtime dual-key policy внедрен в `apps/api/src/shared/prisma/prisma.service.ts`: legacy `companyId` guard сохранен, включены `tenantId` shadow-write/shadow-read drift detection, feature-flag fallback (`TENANT_DUAL_KEY_COMPANY_FALLBACK`) и optional enforce mode (`TENANT_DUAL_KEY_MODE=enforce`).
  - Auth/context contract обновлен: `TenantScope` несет `tenantId + companyId + isSystem`, `TenantContextService` получил `getTenantId()`, JWT strategy возвращает `tenantId`, auth token payload включает compatibility `tenantId`.
  - Добавлены governance artifacts `docs/01_ARCHITECTURE/DATABASE/DB_DUAL_KEY_POLICY.md` и `DB_TENANCY_TRANSITION_RUNTIME_POLICY.md`; manifests/checklists/status синхронизированы, `MODEL_SCOPE_MANIFEST` обновлен до `195/195`.
9. **DB Refactor Program — Phase 0 Closure Discipline** [DONE]:
  - Зафиксирована обязательная операционная дисциплина: после каждого логически завершенного блока синхронизируются `DB_REFACTOR_CHECKLIST`, phase-status файл, зависимые ADR/manifest/policy/CI артефакты и оба memory-bank файла.
  - `Phase 0` доведен до engineering-finish: `gate:db:phase0:enforce` проходит, `MODEL_SCOPE_MANIFEST` покрывает `195/195` моделей, конфликт `EventConsumption` в tenant/system policy устранен.
  - Остаток `Phase 0` — только formal sign-off владельцев доменов по ADR/policy пакету; технические phase-gates закрыты.
10. **AI Copilot Closeout — Telemetry + Go/No-Go Packet** [DONE]:
  - Закрыт rollout telemetry block: в invariant metrics добавлены `ai_memory_hint_shown_total`, `expert_review_requested_total`, `expert_review_completed_total`, `strategy_forecast_run_total`, `strategy_forecast_degraded_total`, `strategy_forecast_latency_ms`, `memory_lane_populated_total`.
  - Instrumentation добавлен в runtime path: `ResponseComposerService` (memory hints), `ExpertReviewService` (request/outcome), `DecisionIntelligenceService` (run/degraded/latency), `SupervisorForensicsService` (memory lane population).
  - Расширены/добавлены targeted tests: `invariant-metrics.controller.spec.ts`, `decision-intelligence.service.spec.ts`, `response-composer.service.spec.ts`, `expert-review.service.spec.ts`, новый `supervisor-forensics.service.spec.ts`.
  - Сформирован release packet `docs/07_EXECUTION/AI_COPILOT_RELEASE_GO_NO_GO_2026-03-13.md`; execution plan синхронизирован ссылкой на packet.
  - Верификация: `pnpm -C apps/api exec tsc --noEmit --pretty false` PASS; targeted jest suites PASS.
11. **Architecture Simplification — RaiChat File-Count Closure** [DONE]:
  - Выполнен deep-slice `rai-chat file-count`: удалены module-bridge файлы `agent-contracts/agent-interaction-contracts.ts`, `tools/front-office-routing.policy.ts`, `widgets/rai-chat-widgets.types.ts`.
  - Типовой и error-layer вынесен в `apps/api/src/shared/rai-chat/`*: `intent-router.types.ts`, `runtime-governance-policy.types.ts`, `explainable-result.types.ts`, `security/{agent-config-blocked,budget-exceeded,risk-policy-blocked,security-violation}.error.ts`.
  - Runtime/tools/explainability импорты переведены на shared-path; зависимость shared-layer от `agent-registry.service` устранена (локальный `CanonicalAgentRuntimeRole` и `AgentRuntimeRole` теперь типизированы в shared types).
  - По `architecture-budget-gate` `rai-chat` снижен до `28260 lines / 134 files` (было `28472 / 144`), file-count warning снят.
  - Верификация: `pnpm -C apps/api build` PASS; targeted suites PASS (`agent-interaction-contracts.spec.ts`, `tool-call.planner.spec.ts`, `front-office-routing.policy.spec.ts`, `risk-tools.registry.spec.ts`, `rai-tools.registry.spec.ts`, `work-window.factory.spec.ts`, `legacy-widget-window.mapper.spec.ts`); `pnpm gate:architecture` PASS.
12. **Decision Intelligence Bridge — `data_scientist` Runtime Consumption** [DONE]:
  - Выполнен следующий wave-5 slice: `DataScientistAgent` получил intent `strategy_forecast` и теперь вызывает deterministic `DecisionIntelligenceService.runStrategyForecast(...)` вместо генерации чисел в chat-layer.
  - В `apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts` обновлён intent routing: стратегические запросы (`прогноз/сценарий/маржа/cash flow/стратегия`) направляются в `strategy_forecast`; `what_if` и доменные intents сохранены.
  - В `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts` расширен payload mapping для `scopeLevel/horizonDays/domains/farmId/fieldId/crop/seasonId/scenario`.
  - В `apps/api/src/modules/rai-chat/rai-chat.module.ts` подключён `OfsModule` для DI-контракта `DecisionIntelligenceService` в runtime-контуре `rai-chat`.
  - Добавлен targeted suite `apps/api/src/modules/rai-chat/agents/data-scientist-agent.service.spec.ts` (validation + deterministic defaults + scope guards).
  - Верификация: `pnpm -C apps/api exec tsc --noEmit --pretty false` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agents/data-scientist-agent.service.spec.ts src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS.
13. **Architecture Simplification — Consulting/Finance/Commerce File-Count Closure** [DONE]:
  - Выполнен deep-slice `consulting file-count`: DTO `complete-operation/create-harvest-plan/save-harvest-result/transition-plan-status/update-draft-plan` вынесены из `apps/api/src/modules/consulting/dto` в `apps/api/src/shared/consulting/dto`.
  - Выполнен deep-slice `commerce file-count`: DTO `create-party/create-jurisdiction/create-regulatory-profile` вынесены из `apps/api/src/modules/commerce/dto` в `apps/api/src/shared/commerce/dto` с переводом импортов controller/service/helper слоя на shared-path.
  - Выполнен deep-slice `finance-economy file-count`: `contracts/finance-ingest.contract.ts` и `finance/config/{finance-config.module,finance-config.service}.ts` вынесены в `apps/api/src/shared/finance-economy/`*; bridge `integrations/domain/finance-ingest.contract.ts` удалён.
  - По `architecture-budget-gate` сняты file-count warnings: `consulting=4613 lines / 35 files` (было `4763 / 40`), `finance-economy=4303 lines / 37 files` (было `4417 / 41`), `commerce=3324 lines / 31 files` (было `3599 / 34`).
  - Верификация: `pnpm gate:architecture` PASS; `pnpm gate:architecture:enforce` PASS; `pnpm -C apps/api build` PASS; targeted suites PASS (`finance-ingest.contract.spec.ts`, `economy.service.spec.ts`, `commerce.e2e.spec.ts`, `consulting-access.guard.spec.ts`).
  - Отдельно: legacy suite `consulting-flow.spec.ts` и `yield.orchestrator.spec.ts` по-прежнему фейлятся из-за ранее существующего mock/DI drift (`harvestPlan.findFirst` и missing `ConsultingDomainRules` provider), не связанного с этим boundary-срезом.
14. **Architecture Simplification — TechMap File-Count Closure** [DONE]:
  - Выполнен точечный deep-slice `tech-map dto`: `approval.dto.ts` и `crop-zone.dto.ts` вынесены из `apps/api/src/modules/tech-map/dto` в `apps/api/src/shared/tech-map/dto`.
  - Спеки `approval.dto.spec.ts` и `crop-zone.dto.spec.ts` переведены на shared-path без изменения контрактов схем.
  - По `architecture-budget-gate` `tech-map` вышел ниже file-warn: `5888 lines / 59 files` (было `5941 / 61`).
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/tech-map/dto/approval.dto.spec.ts src/modules/tech-map/dto/crop-zone.dto.spec.ts` PASS; `pnpm gate:architecture` PASS.
15. **Architecture Simplification — Explainability/Generative File-Count Closure** [DONE]:
  - Выполнен deep-slice `explainability`: `agent-config.dto` и `autonomy-status.dto` вынесены из `apps/api/src/modules/explainability/dto` в `apps/api/src/shared/explainability` (`agent-config.dto` + `dto/autonomy-status.dto`) с переводом runtime-imports на shared-path и удалением module-bridge.
  - Выполнен deep-slice `generative-engine`: удалены module-bridge файлы `contradiction/counterfactual-engine.ts` и `contradiction/conflict-explainability-builder.ts`; `risk-metric-calculator.ts` и `yield/input-data-snapshot.ts` вынесены в `apps/api/src/shared/generative-engine/`*.
  - По `architecture-budget-gate` сняты file-count warnings для обоих hotspot-модулей: `explainability=8089 lines / 41 files` (было `8136 / 43`), `generative-engine=6743 lines / 69 files` (было `6869 / 73`).
  - Верификация: targeted suite по `explainability + generative-engine` PASS; `pnpm gate:architecture` PASS (`mode=warn`). `pnpm -C apps/api build` сейчас блокируется уже существующей несвязанной ошибкой `TS2322` в `src/shared/memory/memory-facade.service.ts` (readonly `OR` для `EngramWhereInput`).
16. **Architecture Simplification — Commerce Party/Asset Helper Boundaries** [DONE]:
  - Выполнен deep-slice `commerce`: relation/rules helper-слой вынесен из `apps/api/src/modules/commerce/services/party.service.ts` в `apps/api/src/shared/commerce/party.helpers.ts`.
  - Выполнен deep-slice `commerce`: asset-role mapping/overlap/type-detection helper-слой вынесен из `apps/api/src/modules/commerce/services/asset-role.service.ts` в `apps/api/src/shared/commerce/asset-role.helpers.ts`.
  - По `architecture-budget-gate` размер `commerce` снижен с `3726` до `3599` строк (line-warn снят); остаётся file-count debt (`34` файла).
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
17. **Architecture Simplification — Finance-Economy Ingest/Types Shared Boundary** [DONE]:
  - Выполнен deep-slice `economy ingest`: DTO и replay/integrity helper-слой вынесены из `apps/api/src/modules/finance-economy/economy/application/economy.service.ts` в `apps/api/src/shared/finance-economy/economy-ingest.helpers.ts`.
  - Выполнен deep-slice `decision-intelligence types`: run/scenario/history типы вынесены из `apps/api/src/modules/finance-economy/ofs/application/decision-intelligence.service.ts` в `apps/api/src/shared/finance-economy/decision-intelligence.types.ts` с type re-export из service-файла для совместимости импортов.
  - По `architecture-budget-gate` размер `finance-economy` снижен до `4417` строк (line-warn снят); остаётся file-count debt (`41` файл).
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/finance-economy/economy/application/economy.service.spec.ts` PASS; `pnpm gate:architecture` PASS.
18. **Architecture Simplification — Tranche Sync (`... + commerce`)** [DONE]:
  - Текущий tranche по строковым budget-warning расширен и закрыт для `rai-chat + tech-map + consulting + finance-economy + commerce`.
  - Актуальный snapshot: `rai-chat=28122`, `tech-map=5941`, `consulting=4763`, `finance-economy=4417`, `commerce=3599`.
  - Остаточный риск: file-count pressure (`rai-chat/tech-map/consulting/finance-economy/commerce`) и крупные hotspots `explainability/generative-engine`.
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/finance-economy/ofs/application/strategy-forecasts.controller.spec.ts src/modules/commerce/services/commerce.e2e.spec.ts` PASS.
19. **Architecture Simplification — Tranche Closure (`rai-chat + tech-map + consulting + finance-economy`)** [DONE]:
  - Текущий tranche блока `Module complexity` логически закрыт по строковым budget-warning для приоритетных модулей: `rai-chat=28122`, `tech-map=5941`, `consulting=4763`, `finance-economy=4404`.
  - Статусные документы синхронизированы: `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md` и `memory-bank/activeContext.md` отражают 14 выполненных deep-slice и явный факт логического закрытия tranche.
  - Открытым остался структурный долг следующей волны: file-count pressure (`tech-map/consulting/finance-economy`) и крупные hotspots (`explainability/generative-engine/commerce`).
  - Верификация: `pnpm gate:architecture` PASS (`mode=warn`).
20. **Architecture Simplification — Finance-Economy OFS Decision Intelligence Helper Slice** [DONE]:
  - Выполнен deep-slice в `apps/api/src/modules/finance-economy/ofs/application/decision-intelligence.service.ts`: validation/driver composition/reason mapping/lever normalization/scenario mapping вынесены в `apps/api/src/shared/finance-economy/decision-intelligence.helpers.ts`.
  - Сервис оставлен orchestration-oriented, helper-слой переиспользуем и изолирован в shared boundary.
  - По `architecture-budget-gate` размер `finance-economy` снижен с `4557` до `4404` строк (warn-порог по строкам снят).
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/finance-economy/ofs/application/decision-intelligence.service.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
21. **Architecture Simplification — Consulting Controller Context Slice** [DONE]:
  - Выполнен deep-slice в `apps/api/src/modules/consulting/consulting.controller.ts`: повторяющаяся сборка `UserContext` и execution context сведена к helper-методам `toUserContext()` и `toExecutionContext()`.
  - Контроллер сокращён с `467` до `367` строк без изменения публичного поведения endpoint-ов.
  - По `architecture-budget-gate` размер `consulting` снижен с `4863` до `4763` строк (warn-порог по строкам снят).
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
22. **Architecture Simplification — TechMap Prisma Include Boundary Slice** [DONE]:
  - Выполнен второй deep-slice `tech-map`: повторяющиеся Prisma include-деревья вынесены из `apps/api/src/modules/tech-map/tech-map.service.ts` в `apps/api/src/shared/tech-map/tech-map-prisma-includes.ts`.
  - `TechMapService` теперь использует общий include-layer для `findAll/findOne/findBySeason/transitionStatus/validateTechMap/validateDAG/activate/createNextVersion` без дублирования nested include-структур.
  - По `architecture-budget-gate` размер `tech-map` дополнительно снижен с `6020` до `5941` строк при `61` файле (warn по строкам для `tech-map` снят).
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/tech-map/tech-map.concurrency.spec.ts src/shared/tech-map/tech-map-mapping.helpers.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
23. **Architecture Simplification — TechMap Mapping/Snapshot Boundary Slice** [DONE]:
  - Выполнен первый deep-slice `tech-map`: mapping/snapshot слой вынесен из `apps/api/src/modules/tech-map/tech-map.service.ts` в `apps/api/src/shared/tech-map/tech-map-mapping.helpers.ts`.
  - В shared helper вынесены: сборка `ValidationInput` для `TechMapValidationEngine`, DAG nodes для `DAGValidationService`, activation snapshots `operationsSnapshot/resourceNormsSnapshot`.
  - Добавлен targeted spec `apps/api/src/shared/tech-map/tech-map-mapping.helpers.spec.ts`; `tech-map.concurrency` контур остаётся зелёным.
  - По `architecture-budget-gate` размер `tech-map` снижен с `6087` до `6020` строк при `61` файле; `rai-chat` удержан на `28122` строках.
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/tech-map/tech-map.concurrency.spec.ts src/shared/tech-map/tech-map-mapping.helpers.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
24. **Architecture Simplification — RAI Chat Tool Orchestration Slice (`rai-tools.registry`)** [DONE]:
  - Выполнен следующий deep-slice orchestration-слоя: built-in tool schemas/handlers (`echo_message`, `workspace_snapshot`) вынесены из `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` в `apps/api/src/shared/rai-chat/rai-tools-builtins.ts`.
  - Сериализация payload и форматирование tool-call log вынесены из `rai-tools.registry.ts` в `apps/api/src/shared/rai-chat/rai-tools-log-helpers.ts`; orchestration-класс оставлен на policy/runtime flow + registry dispatch.
  - По `architecture-budget-gate` размер `rai-chat` дополнительно снижен с `28123` до `28122` строк при `143` файлах.
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
25. **Architecture Simplification — RAI Chat Tool Registries Boundary Slice (Contracts)** [DONE]:
  - Выполнен следующий deep-slice `tool registries`: из `apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts` вынесены payload schemas в `apps/api/src/shared/rai-chat/contracts-tool-schemas.ts`.
  - Mapping/helper слой `mapCreatedContract`, `mapContractSummary`, `normalizeJsonObject` вынесен в `apps/api/src/shared/rai-chat/contracts-tool-helpers.ts`, а `contracts-tools.registry.ts` оставлен orchestration-oriented.
  - По `architecture-budget-gate` размер `rai-chat` дополнительно снижен с `28286` до `28123` строк при сохранении `143` файлов.
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/contracts-tools.registry.spec.ts src/modules/rai-chat/tools/front-office-tools.registry.spec.ts src/modules/rai-chat/tools/crm-tools.registry.spec.ts src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
26. **Architecture Simplification — RAI Chat Tool Registries Boundary Slice (CRM + Front-Office)** [DONE]:
  - Выполнен следующий deep-slice `tool registries`: из `apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts` вынесены payload schemas и helper-логика в `apps/api/src/shared/rai-chat/crm-tool-schemas.ts` и `apps/api/src/shared/rai-chat/crm-tool-helpers.ts`.
  - Выполнен следующий deep-slice `tool registries`: из `apps/api/src/modules/rai-chat/tools/front-office-tools.registry.ts` вынесены payload schemas и routing/classification helper-слой в `apps/api/src/shared/rai-chat/front-office-tool-schemas.ts` и `apps/api/src/shared/rai-chat/front-office-tool-helpers.ts`.
  - Routing policy вынесен в `apps/api/src/shared/rai-chat/front-office-routing.policy.ts`, а в `apps/api/src/modules/rai-chat/tools/front-office-routing.policy.ts` оставлен re-export bridge для безопасной совместимости.
  - По `architecture-budget-gate` размер `rai-chat` дополнительно снижен с `28630` до `28286` строк при сохранении `143` файлов.
  - Верификация: `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/front-office-routing.policy.spec.ts src/modules/rai-chat/tools/front-office-tools.registry.spec.ts src/modules/rai-chat/tools/crm-tools.registry.spec.ts src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
27. **Architecture Simplification — Supervisor Forensics/Audit Post-Processing Slice** [DONE]:
  - Выполнен следующий deep-slice `supervisor orchestration`: post-processing слой (`AiAuditEntry` запись, forensic phases append, memory lane build) вынесен из `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` в `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts`.
  - `SupervisorAgent` очищен до orchestration-контуров router/runtime/external/composer + truthfulness pipeline coordination.
  - `RaiChatModule` и spec-контуры `runtime-spine`, `supervisor-agent`, `rai-chat.service` переведены на новый provider `SupervisorForensicsService`.
  - Обновлены устаревшие assertions в `supervisor-agent.service.spec.ts` и `rai-chat.service.spec.ts` под текущее canonical поведение memory-profile/context в ответе.
  - `architecture-budget-gate` после среза: `rai-chat=28777 lines / 143 files`.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts` PASS.
28. **Architecture Simplification — RAI Chat Runtime Governance Control Slice** [DONE]:
  - Выполнен следующий deep-slice `runtime-governance event/control`: из `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` вынесен governance control-layer в `apps/api/src/modules/rai-chat/runtime/runtime-governance-control.service.ts`.
  - В новый слой вынесены: `buildGovernanceMeta`, `recordGovernanceEvent`, `recordToolFailure`, `resolveConcurrencyEnvelope`, `resolveRuntimeGovernanceFromResults` и budget degrade `filterAllowedToolCalls`.
  - `AgentRuntimeService` сокращён с `659` до `498` строк (`-161`) и оставлен как runtime orchestration/service glue.
  - `RaiChatModule` и runtime-specs (`agent-runtime`, `runtime-spine`) переведены на новый provider `RuntimeGovernanceControlService`; runtime DI-контур остаётся стабильным.
  - `architecture-budget-gate` после среза: `rai-chat=28764 lines / 142 files` (исторический минимум на предыдущем шаге остаётся `28410`, но текущий snapshot вырос из-за нового control-layer и расширенного test DI-контура).
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/rai-chat/composer/work-window.factory.spec.ts src/modules/rai-chat/composer/legacy-widget-window.mapper.spec.ts src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts` PASS.
29. **Architecture Simplification — RAI Chat Execution Adapter Heuristics Extraction** [DONE]:
  - Выполнен пятый практический boundary-refactor в `rai-chat`: execution heuristics/mapping слой вынесен из `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts` в `apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts`.
  - В shared вынесены `detect*Intent`, `detect*Tool`, `firstPayload`, `resolve*Id`, `extract`* и `isKnowledgeNoHit`/`isKnownFulfillmentEventType`; `AgentExecutionAdapterService` оставлен как orchestration + output validation.
  - `agent-execution-adapter.service.ts` уменьшен с `1152` до `785` строк (`-367`), при сохранении поведения execution path.
  - По `architecture-budget-gate` размер `rai-chat` дополнительно снижен с `28777` до `28410` строк (исторический минимум после extraction-среза); на этапе стабилизации runtime test-контура фиксировался snapshot `28482` строк при `139` файлах.
  - Верификация: `pnpm -C apps/api build` PASS; `node scripts/architecture-budget-gate.cjs` PASS; targeted suite `src/modules/explainability/agent-management.service.spec.ts`, `src/modules/rai-chat/composer/work-window.factory.spec.ts`, `src/modules/rai-chat/composer/legacy-widget-window.mapper.spec.ts`, `src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts` PASS; runtime-suite `src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` и `src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS (DI-долг тестового контура закрыт).
30. **Architecture Simplification — RAI Chat Response Composer Presenter Extraction** [DONE]:
  - Выполнен четвёртый практический boundary-refactor в `rai-chat`: CRM/Commerce presenter-layer вынесен из `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` в `apps/api/src/shared/rai-chat/response-composer-presenters.ts`.
  - Вынесены отображающие функции `buildToolDisplayName`, `buildCrm`*, `buildContracts*`; `ResponseComposerService` оставлен как orchestration path без heavy presenter-веток.
  - `response-composer` переведён на shared presenter imports, функциональное поведение сохранено.
  - По `architecture-budget-gate` размер `rai-chat` дополнительно снижен с `29605` до `28777` строк при сохранении `139` файлов.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts src/modules/explainability/agent-config-guard.service.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/explainability/agent-prompt-governance.service.spec.ts src/modules/front-office-draft/front-office-draft.service.spec.ts src/modules/rai-chat/composer/work-window.factory.spec.ts src/modules/rai-chat/composer/legacy-widget-window.mapper.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.
31. **Architecture Simplification — RAI Chat DTO/Tools/Widgets Contract Extraction** [DONE]:
  - Выполнен третий практический boundary-refactor в `rai-chat`: `dto/rai-chat.dto.ts`, `tools/rai-tools.types.ts` и `widgets/rai-chat-widgets.types.ts` вынесены из `apps/api/src/modules/rai-chat` в `apps/api/src/shared/rai-chat`.
  - В старых путях оставлены тонкие re-export bridge файлы: `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`, `apps/api/src/modules/rai-chat/widgets/rai-chat-widgets.types.ts`.
  - Canonical imports переведены на shared-path для `agent-interaction-contracts`, `front-office-client-response.orchestrator`, `agent-management`, `agent-config-guard.spec`, `agent-prompt-governance.spec`, `agent-management.spec`, `agent-config.dto`.
  - По `architecture-budget-gate` размер `rai-chat` дополнительно снижен с `31316` до `29605` строк при сохранении `139` файлов.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts src/modules/explainability/agent-config-guard.service.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/explainability/agent-prompt-governance.service.spec.ts src/modules/front-office-draft/front-office-draft.service.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.

## 2026-03-12

1. **Architecture Simplification — RAI Chat Contract Layer Extraction** [DONE]:
  - Выполнен второй практический boundary-refactor после `front-office`: `agent-interaction-contracts` вынесен из `apps/api/src/modules/rai-chat/agent-contracts` в `apps/api/src/shared/rai-chat/agent-interaction-contracts.ts`.
  - В `modules/rai-chat/agent-contracts/agent-interaction-contracts.ts` оставлен тонкий re-export bridge для совместимости и безопасного перехода.
  - Переподключены прямые импортирующие контуры `rai-chat` и `explainability` на shared-path: `supervisor`, `intent-router`, `response-composer`, `agent-config-guard`, `agent-management`.
  - По `architecture-budget-gate` размер `rai-chat` снижен с `34256` до `31316` строк при сохранении `139` файлов.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts src/modules/explainability/agent-config-guard.service.spec.ts src/modules/explainability/agent-management.service.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.
2. **Architecture Simplification — Front-Office Shared Boundary Extraction** [DONE]:
  - Выполнен первый практический boundary-refactor после ввода growth-governance: из `apps/api/src/modules/front-office-draft` вынесены thread/transport/binding компоненты в `apps/api/src/shared/front-office`.
  - Введены `FrontOfficeSharedModule`, `FrontOfficeThreadingService`, `FrontOfficeCommunicationRepository`, `FrontOfficeOutboundService`; `FrontOfficeDraftService` сокращён до domain orchestration (intake/decision/commit/handoff).
  - Модуль `front-office-draft` уменьшен с `10` до `8` файлов; по `architecture-budget-gate` размер снизился с `5684` до `4246` строк.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/front-office-draft/front-office-draft.service.spec.ts src/modules/front-office/front-office.e2e.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.
3. **Architecture Growth Governance** [DONE]:
  - Введён `scripts/architecture-budget-gate.cjs` как отдельный control-layer для роста архитектурной сложности.
  - Бюджеты зафиксированы в `scripts/architecture-budgets.json`: отдельно контролируются `schema.prisma`, количество top-level модулей и watch-list тяжёлых hotspots (`rai-chat`, `explainability`, `generative-engine`, `tech-map`, `front-office-draft`, `consulting`, `finance-economy`, `commerce`).
  - В корневой `package.json` добавлены команды `pnpm gate:architecture` и `pnpm gate:architecture:enforce`.
  - Добавлен guideline `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/ARCHITECTURE_GROWTH_GUARDRAILS.md`; `delta audit` синхронизирован: блок module complexity переведён из “просто актуально” в “частично закрыто / growth-governance введён”.
  - Верификация: `pnpm gate:architecture` PASS; `pnpm gate:architecture:enforce` PASS; текущий отчёт фиксирует `schema.prisma=6107`, `top-level modules=38` и основные hotspots.
4. **Foundation Remediation — Compliance-Grade WORM S3 Rollout** [DONE]:
  - `WormStorageService` переведён в fail-closed режим для `s3_compatible|dual`: на старте теперь проверяются `Versioning=Enabled`, `Object Lock=Enabled` и default retention `COMPLIANCE / Years / 7`, а `filesystem` в `production` запрещён без явного override.
  - `WORM` upload path усилен до фактической retention verification: объект пишется в `S3-compatible` storage, затем retention читается и подтверждается; если контур не подтвердился, запись считается неуспешной.
  - `scripts/setup-minio.ts` теперь поднимает `rai-audit-worm` bucket с `Object Lock` и default retention, а в корневой `package.json` добавлен запуск `pnpm storage:minio:setup`.
  - `delta audit` и новый runbook `docs/05_OPERATIONS/WORKFLOWS/WORM_S3_COMPLIANCE_ROLLOUT.md` синхронизированы: WORM-блок переведён из “остался production rollout” в логически закрытый runtime/bootstrap слой.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/level-f/worm/worm-storage.service.spec.ts src/shared/audit/audit-notarization.service.spec.ts src/shared/audit/audit.service.spec.ts` PASS; `pnpm exec tsx scripts/setup-minio.ts` PASS; live self-test `WormStorageService` подтвердил `provider=s3_compatible`, `objectLock=enabled`, `versioning=enabled`, `defaultRetention=COMPLIANCE:Years:7`, `accessible=true`.
5. **Foundation Remediation — Event-Stream-Native Outbox Evolution** [DONE]:
  - `OutboxRelay` перестал быть cron-only контуром: введён `Redis Pub/Sub` wakeup через `OutboxWakeupService`, а scheduler теперь играет роль safety fallback, а не единственного production-механизма движения очереди.
  - Producer-path централизован через `OutboxService.persistEvent()` / `persistPreparedEvents()`: `task`, `consulting`, `economy`, `reconciliation` теперь после записи outbox публикуют wakeup hint без разрозненного прямого `outboxMessage.create/createMany`.
  - `redis_streams` transport усилен до broker-native topology: `OutboxBrokerPublisher` теперь не только пишет в stream, но и поднимает configured consumer groups через `OUTBOX_BROKER_REDIS_CONSUMER_GROUPS`; relay логирует broker receipt и продолжает drain немедленно при полном batch.
  - `delta audit` синхронизирован: outbox-блок переведён в логически закрытый как event-stream-native relay; если позже понадобится Debezium/Kafka-class внешний CDC, это уже следующий infra-layer, а не незакрытый foundation-gap.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/outbox/outbox.service.spec.ts src/shared/outbox/outbox-wakeup.service.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts src/shared/outbox/outbox.relay.spec.ts` PASS; live self-test с `OUTBOX_RELAY_SCHEDULE_ENABLED=false` и `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED=false` перевёл outbox-сообщение в `PROCESSED` только через wakeup-контур.
6. **Foundation Remediation — Audit Log Notarization / WORM** [DONE]:
  - `AuditService` переведён на create-only путь через `AuditNotarizationService`: каждая audit-запись теперь получает `entryHash`, company-scoped `chainHash`, HSM-подпись и отдельную proof-запись в `audit_notarization_records`.
  - Введён `WormStorageService` / `WormModule` с внешним immutable storage вне основной БД: поддерживаются `filesystem`, `s3_compatible` и `dual`, а default path больше не зависит от `cwd` процесса и стабильно разрешается от корня workspace.
  - Добавлены `GET /api/audit/logs/:id/proof` и `health`-readiness по `audit_notarization`; readiness теперь проверяет не только БД-запись proof, но и доступность последнего WORM object.
  - `delta audit` синхронизирован: блок `Audit log notarization / WORM` переведён в логически закрытый по коду. Остаток теперь инфраструктурный: для production-retention уровня compliance нужно включить `AUDIT_WORM_PROVIDER=s3_compatible|dual` и object-lock bucket.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/audit/audit.service.spec.ts src/shared/audit/audit-notarization.service.spec.ts src/level-f/worm/worm-storage.service.spec.ts src/level-f/crypto/hsm.service.spec.ts` PASS; `curl -s http://127.0.0.1:4000/api/health` -> `audit_notarization.status=up`; живой self-test создал внешний WORM object `/root/RAI_EP/var/audit-worm/audit-logs/default-rai-company/2026-03-12/2026-03-12T20:08:58.992Z_337c2c81-2627-4a77-aaaf-88595e20d83e_903f72c49b9f2f8d.json`.
7. **Foundation Remediation — External Front-Office Route-Space Separation** [DONE]:
  - Введён отдельный viewer-only API namespace `portal/front-office` через `src/modules/front-office/front-office-external.controller.ts`; внешний контур больше не живёт только внутри общего `front-office.controller.ts`.
  - Canonical web portal вынесен в `/portal/front-office` и `/portal/front-office/threads/[threadKey]`, а onboarding/success redirects и activation links переведены на новый route-space.
  - Старые `/front-office/login|activate` переведены в redirect-only alias, а внутренний `/api/front-office/`* больше не обслуживает `FRONT_OFFICE_USER`.
  - Обновлены baseline audit, delta audit, stabilization checklist и memory-bank: блок `External front-office auth boundary` переведён из `частично закрыто` в `закрыто`.
  - Верификация: `pnpm --filter api exec jest --runInBand src/modules/front-office/front-office-external.controller.spec.ts src/shared/auth/front-office-auth.service.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS; `pnpm --filter web exec tsc --noEmit --pretty false` PASS.
8. **Foundation Remediation — Broader Secrets Centralization** [DONE]:
  - Введён глобальный `SecretsService` / `SecretsModule` как единый provider-layer поверх `resolveSecretValue()` и `*_FILE` secret mounts.
  - На централизованный secret-read переведены `JWT`, `MinIO`, `INTERNAL_API_KEY`, `CORE_API_KEY`, `OUTBOX_BROKER_AUTH_TOKEN`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`, а также `AuditService` и `HsmService`.
  - `JwtModule`, `JwtStrategy`, `S3Service`, `InternalApiKeyGuard`, `CustomThrottlerGuard`, `OutboxBrokerPublisher`, `TelegramAuthService`, `FrontOfficeAuthService`, `ProgressService`, `TelegramNotificationService`, `NvidiaGatewayService` и `OpenRouterGatewayService` больше не читают runtime-secrets напрямую из разрозненного `process.env`.
  - `delta audit` синхронизирован: блок `Broader secrets centralization` переведён в логически закрытый, а остаток теперь трактуется как обычный config/env debt, а не как открытый audit-gap.
  - Верификация: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/config/secrets.service.spec.ts src/shared/auth/internal-api-key.guard.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts src/shared/audit/audit.service.spec.ts src/level-f/crypto/hsm.service.spec.ts src/shared/auth/front-office-auth.service.spec.ts` PASS; `curl -s http://127.0.0.1:4000/api/health` -> `status=ok`; `curl -s http://127.0.0.1:4000/api/invariants/metrics` -> валидный `JSON`.
9. **Foundation Remediation — Broker-Native Outbox Transport** [DONE]:
  - `OutboxBrokerPublisher` переведён на transport abstraction `http | redis_streams` вместо единственного generic HTTP webhook path.
  - Введён broker-native Redis Streams publish path через `XADD`, safety env-configs `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING` и rudimentary tenant partitioning по stream key.
  - `OutboxRelay` теперь transport-aware по broker config hint; legacy HTTP path сохранён как backward-compatible fallback.
  - Обновлены baseline audit, delta audit, stabilization checklist, outbox replay runbook и memory-bank: тезис про "generic HTTP-only broker publisher" переведён в устаревший.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS.
10. **Foundation Remediation — Production-Grade Operational Control for Memory Lifecycle** [DONE]:
  - `MemoryMaintenanceService` доведён до production-grade control-plane: playbook catalog, tenant-scoped recommendations, audit-backed recent runs и `GET /api/memory/maintenance/control-plane`.
  - Введён `MemoryAutoRemediationService` с scheduled automatic corrective action, cooldown policy, auto-eligible playbooks only и safety caps `MEMORY_AUTO_REMEDIATION_`*.
  - `InvariantMetricsController` и Prometheus export расширены deeper lifecycle signals и automation counters: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`.
  - `EngramFormationWorker` переведён на тот же candidate contour, что и observability/control-plane: уже помеченные `generationMetadata.memoryLifecycle.engramFormed=true` техкарты исключаются из formation path.
  - Обновлены baseline audit, delta audit, stabilization checklist, alert runbook, maturity dashboard, SLO policy и memory-bank: блок `production-grade operational control for memory lifecycle` переведён в closed.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/memory-maintenance.service.spec.ts src/shared/memory/memory.controller.spec.ts src/shared/memory/memory-lifecycle-observability.service.spec.ts src/shared/memory/memory-auto-remediation.service.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS.
11. **Foundation Remediation — Special Internal Boundaries + Consulting Policy Guard** [DONE]:
  - Специальные внутренние boundary формализованы через явные decorators/metadata: `RequireMtls`, `RequireInternalApiKey`, `PublicHealthBoundary`.
  - `InternalApiKeyGuard` переведён в fail-closed режим по boundary metadata и использует timing-safe compare; `adaptive-learning` и `telegram-auth-internal` переведены на единый decorator вместо разрозненного `UseGuards`.
  - Ручные `ensureStrategicAccess()` / `ensureManagementAccess()` удалены из `ConsultingController` и заменены на `ConsultingAccessGuard` как централизованный policy-layer для strategic/management действий.
  - `delta audit` и runtime-проверка синхронизированы: локальный `start:prod` успешен, `/api/health` отвечает `ok`.
  - Верификация: `pnpm --filter api test -- --runInBand --silent src/shared/auth/auth-boundary.decorator.spec.ts src/shared/auth/internal-api-key.guard.spec.ts src/modules/consulting/consulting-access.guard.spec.ts` PASS, `pnpm -C apps/api build` PASS.
12. **Foundation Remediation — Tenant-Scoped Memory Manual Control Plane** [DONE]:
  - Введён guarded endpoint `POST /api/memory/maintenance/run` и отдельный `MemoryMaintenanceService` для controlled corrective action по `consolidation`, `pruning`, `engram formation`, `engram pruning`.
  - Manual path сделан tenant-safe: `ConsolidationWorker`, `EngramFormationWorker` и `EngramService.pruneEngrams()` теперь поддерживают company-scoped runs без изменения глобального scheduler/bootstrap contour.
  - Добавлен audit trail `MEMORY_MAINTENANCE_RUN_COMPLETED` / `MEMORY_MAINTENANCE_RUN_FAILED`, а runbook/checklist/audit delta синхронизированы с новым operator control-plane.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/memory-maintenance.service.spec.ts src/shared/memory/memory.controller.spec.ts src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/memory/engram.service.spec.ts` PASS. `pnpm --filter api exec tsc --noEmit` остаётся заблокирован уже существующей несвязанной ошибкой в `src/modules/health/health.controller.ts`.
13. **Foundation Remediation — Memory Lifecycle Multi-Window Burn-Rate Escalation** [DONE]:
  - В Prometheus alert-rules добавлены `RAIMemoryEngramFormationBurnRateMultiWindow` и `RAIMemoryEngramPruningBurnRateMultiWindow` как sustained degradation contour по `6h/24h` окнам.
  - Runbook и SLO policy расширены: теперь есть явное разделение между `burn-high`, `multi-window burn-rate` и `hard breach`.
  - Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard и memory-bank, чтобы новый escalation layer был отражён как текущий remediation-state.
  - Верификация: `python3` + `PyYAML` load для `infra/monitoring/prometheus/invariant-alert-rules.yml` PASS, `node scripts/invariant-gate.cjs --mode=warn` PASS.
14. **Foundation Remediation — Memory Lifecycle Error Budget View** [DONE]:
  - В `InvariantMetricsController` добавлены derived gauges `memory_engram_formation_budget_usage_ratio` и `memory_engram_pruning_budget_usage_ratio` поверх текущих L4 thresholds.
  - В Prometheus alert-rules добавлены ранние burn-high сигналы `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramPruningBudgetBurnHigh`, а runbook/SLO/dashboard расширены под early-warning contour.
  - Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы error-budget view был отражён как текущий remediation-state, а не оставался открытым пунктом.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
15. **Foundation Remediation — Memory Lifecycle Operator Pause Windows** [DONE]:
  - В `ConsolidationWorker` и `EngramFormationWorker` добавлены time-boxed operator pause windows `*_PAUSE_UNTIL` / `*_PAUSE_REASON` для scheduler/bootstrap path.
  - Manual maintenance path сохранён доступным, а `/api/invariants/metrics` и Prometheus export расширены pause flags и remaining-seconds gauges для всех четырёх lifecycle paths.
  - Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy, alert runbook и memory-bank, чтобы operator control был отражён как текущий remediation-state.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
16. **Foundation Remediation — Engram Lifecycle Throughput Visibility** [DONE]:
  - В `InvariantMetrics` и `EngramService` добавлены L4 throughput counters `memory_engram_formations_total` и `memory_engram_pruned_total`.
  - Prometheus export расширен метриками `invariant_memory_engram_formations_total` и `invariant_memory_engram_pruned_total`, а в alert-rules добавлен `RAIMemoryEngramPruningStalled`.
  - Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы throughput visibility был отражён как текущий remediation-state.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts src/shared/memory/engram.service.spec.ts` PASS.
17. **Foundation Remediation — Controlled Memory Backfill Policy** [DONE]:
  - В `ConsolidationWorker` и `EngramFormationWorker` добавлены bounded bootstrap catch-up loops для controlled recovery после простоя.
  - Введены env-config caps `MEMORY_CONSOLIDATION_BOOTSTRAP_MAX_RUNS`, `MEMORY_PRUNING_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS`.
  - Targeted specs расширены на stop-on-drain и respect-max-runs поведение.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts` PASS.
18. **Foundation Remediation — Engram Lifecycle Observability** [DONE]:
  - `InvariantMetricsController` расширен L4 metrics/alerts для `latestEngramFormationAgeSeconds` и `prunableActiveEngramCount`.
  - Добавлены Prometheus alerts `RAIMemoryEngramFormationStale` и `RAIMemoryPrunableActiveEngramsHigh`, а также runbook-процедуры для их triage.
  - Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы engram lifecycle observability был отражён как текущий remediation-state.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
19. **Foundation Remediation — Broader Engram Lifecycle Scheduling** [DONE]:
  - `EngramFormationWorker` переведён в background lifecycle worker с bootstrap/scheduler wiring для L4 engram formation и pruning.
  - Добавлены env-config flags `MEMORY_ENGRAM_FORMATION_`*, `MEMORY_ENGRAM_PRUNING_*`, а также pruning thresholds `MEMORY_ENGRAM_PRUNING_MIN_WEIGHT` и `MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS`.
  - Добавлен targeted spec `apps/api/src/shared/memory/engram-formation.worker.spec.ts` на bootstrap/scheduler contract и pruning thresholds.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/engram-formation.worker.spec.ts` PASS.
20. **Foundation Remediation — Raw SQL Hardening Phase 2 (Memory Path)** [DONE]:
  - `PrismaService.safeQueryRaw()/safeExecuteRaw()` расширены executor-aware режимом для transaction client.
  - `ConsolidationWorker` и `DefaultMemoryAdapter` переведены с прямого raw SQL на safe wrappers.
  - `scripts/raw-sql-allowlist.json` сужен: memory path больше не требует отдельного approved raw SQL entry.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/memory-adapter.spec.ts` PASS, `node scripts/raw-sql-governance.cjs --mode=enforce` PASS.
21. **Foundation Remediation — Memory Hygiene Bootstrap Maintenance** [DONE]:
  - В `ConsolidationWorker` добавлены startup maintenance paths для consolidation/pruning через `MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED` и `MEMORY_PRUNING_BOOTSTRAP_ENABLED`.
  - S-tier memory hygiene теперь не зависит только от первого cron после рестарта: при старте приложения возможен controlled bootstrap drain.
  - Обновлены baseline audit, delta audit, stabilization checklist и memory-bank, чтобы bootstrap closeout был отражён как текущий статус remediation.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts` PASS.
22. **Foundation Remediation — Memory Hygiene Observability** [DONE]:
  - В `InvariantMetricsController` добавлен memory hygiene snapshot в `/api/invariants/metrics` и Prometheus gauges для backlog/freshness/active engrams.
  - Контур alerting/runbook отражён в `infra/monitoring/prometheus/invariant-alert-rules.yml` и `docs/INVARIANT_ALERT_RUNBOOK_RU.md`.
  - Обновлены baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy и memory-bank, чтобы observability closeout был виден как текущий статус, а не скрывался в коде.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
23. **Foundation Remediation — Memory Hygiene Scheduling** [DONE]:
  - В `ConsolidationWorker` включены cron-based scheduler paths для регулярной консолидации и prune S-tier memory.
  - Добавлены feature flags `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`, а также cron overrides для безопасного rollout.
  - Добавлен targeted spec `apps/api/src/shared/memory/consolidation.worker.spec.ts` на scheduler contract.
  - Baseline audit, delta audit, stabilization checklist и memory-bank синхронизированы с новым статусом partial closeout по memory hygiene.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts` PASS.
24. **Foundation Remediation — Outbox Productionization (Scheduler Wiring)** [DONE]:
  - В `OutboxRelay` включены bootstrap drain и cron-based scheduler wiring через `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_SCHEDULE_ENABLED`, `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED`.
  - Manual `processOutbox()` path сохранён, но теперь relay больше не зависит от неявного внешнего вызова для базового фонового запуска.
  - Добавлены targeted tests на bootstrap/scheduler contract в `apps/api/src/shared/outbox/outbox.relay.spec.ts`.
  - Baseline audit, delta audit, stabilization checklist и memory-bank синхронизированы с новым статусом partial closeout по outbox productionization.
  - Верификация: `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts` PASS.
25. **Foundation Remediation — Raw SQL Governance Phase 1** [DONE]:
  - Добавлены `scripts/raw-sql-governance.cjs` и `scripts/raw-sql-allowlist.json` для inventory/allowlist approved raw SQL paths.
  - `scripts/invariant-gate.cjs` теперь включает raw SQL governance section и умеет работать в `warn/enforce` режиме без декоративного bypass.
  - Удалены `Prisma.$queryRawUnsafe/$executeRawUnsafe` из `scripts/backfill-outbox-companyid.cjs` и `scripts/verify-task-fsm-db.cjs`.
  - Baseline audit, delta audit, stabilization checklist и memory-bank синхронизированы с новым статусом remediation.
  - Верификация: `node scripts/raw-sql-governance.cjs --mode=enforce` PASS, `node scripts/invariant-gate.cjs --mode=warn` PASS.
26. **Foundation Remediation — Audit Log Immutability** [DONE]:
  - Введён DB-level append-only enforcement для `audit_logs` через миграцию `20260312170000_audit_log_append_only_enforcement`.
  - Триггер `trg_audit_logs_append_only` жёстко блокирует `UPDATE/DELETE`, переводя audit trail из "tamper-evident only" в "tamper-evident + append-only at DB layer".
  - Добавлен `apps/api/src/shared/audit/audit.service.spec.ts`, который фиксирует create-only path и наличие `_tamperEvident` metadata.
  - Обновлены текущие статусные документы: `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md`, `docs/FOUNDATION_STABILIZATION_CHECKLIST_RU.md`, `memory-bank/activeContext.md`, `memory-bank/TRACELOG.md`.
  - Верификация: targeted jest для `AuditService`.

## 2026-03-07

1. **A_RAI S23 — Live API Smoke** [APPROVED]:
  - Добавлен live HTTP smoke suite `apps/api/test/a_rai-live-api-smoke.spec.ts`, который поднимает реальный feature-module graph `RaiChatModule + ExplainabilityPanelModule` и ходит в него через `supertest`.
  - Покрыт канонический Stage 2 API slice: `GET /api/rai/explainability/queue-pressure`, `GET /api/rai/incidents/feed`, `GET /api/rai/agents/config`, `POST /api/rai/agents/config/change-requests`, плюс negative case `POST /api/rai/agents/config -> 404`.
  - Smoke вскрыл и помог закрыть реальные wiring gaps: `RaiChatModule -> MemoryModule`, `MemoryModule -> AuditModule`, export `AutonomyPolicyService`.
  - Пункт readiness `Есть smoke tests на живые API маршруты` переведён в `[x]`.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles test/a_rai-live-api-smoke.spec.ts` PASS.
2. **A_RAI S22 — Queue & Backpressure Visibility** [APPROVED]:
  - `AgentRuntimeService` теперь пишет per-instance live queue snapshots в `QueueMetricsService`, а `QueueMetricsService` агрегирует tenant-wide latest state по `queueName + instanceId` из persisted `PerformanceMetric`.
  - Добавлен live API `GET /rai/explainability/queue-pressure`; `Control Tower` показывает runtime pressure, backlog depth, freshness и queue contour без synthetic fallback.
  - Добавлен producer-side proof на multi-instance semantics: backlog не схлопывается до последнего snapshot одной ноды.
  - Пункт readiness `Есть queue/backpressure visibility` переведён в `[x]`.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted API jest PASS, targeted web jest PASS.
3. **A_RAI S21 — Runtime Spine Integration Proof** [APPROVED]:
  - Добавлен integration suite `runtime-spine.integration.spec.ts`, который гоняет реальный путь `Supervisor -> Runtime -> Registry/Governance/Budget/Policy -> Audit/Trace`.
  - Доказаны три сценария: happy path, `budget deny` с persisted incident/audit/trace, и governed registry block path через effective runtime state.
  - Пункт readiness `Есть integration tests на runtime spine` переведён в `[x]`.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS.
4. **A_RAI S20 — Agent Configurator Closeout** [APPROVED]:
  - `control-tower/agents` больше не строится вокруг `global/tenantOverrides + toggle`, а читает runtime-aware `agents[]` read model с `runtime.source`, `bindingsSource`, `tenantAccess`, `capabilities`, `tools` и `isActive`.
  - Client contract больше не экспортирует configurator `toggle`, а legacy backend route `PATCH /rai/agents/config/toggle` удалён.
  - Configurator surface оставляет только governed `createChangeRequest`; HTTP proof подтверждает effective registry-aware read model и `404` для старого toggle path.
  - Claim `Agent Configurator существует как UI + API настройки агентов` переведён в `CONFIRMED`.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.
5. **A_RAI S19 — Quality Governance Loop** [APPROVED]:
  - `ExplainabilityPanelService` теперь считает `Correction Rate` по decision-scoped persisted advisory feedback с дедупликацией по `traceId`, а не по декоративной или потенциально раздуваемой модели.
  - `AutonomyPolicyService` форсирует `QUALITY_ALERT -> QUARANTINE` при активном `BS_DRIFT`, а runtime enforcement по-прежнему идёт через `RaiToolsRegistry`, без обхода через UI/config path.
  - `IncidentOpsService` отдаёт lifecycle-aware governance counters/feed с breakdown по quality/autonomy/policy incidents.
  - Claims `Quality & Evals Panel`, `Автономность регулируется по BS% и quality alerts`, `Governance counters и incidents feed реально живые` переведены в `CONFIRMED`.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.
6. **A_RAI S18 — Budget Controller Runtime** [APPROVED]:
  - `BudgetControllerService` перестал быть боковым сервисом и теперь читает persisted `agentRegistry.maxTokens`, возвращая реальные runtime outcomes `ALLOW / DEGRADE / DENY`.
  - `AgentRuntimeService` применяет budget decision до fan-out: `DEGRADE` режет execution set, `DENY` останавливает выполнение до вызова tools.
  - `ResponseComposerService` и `SupervisorAgent` довозят `runtimeBudget` до response и `AiAuditEntry.metadata`.
  - На degraded/denied path через `IncidentOpsService` пишутся budget incidents.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
7. **A_RAI S17 — Control Tower Honesty** [APPROVED]:
  - Persisted evidence trail доведён до честного контура `evidence -> audit -> forensics/dashboard`.
  - `TruthfulnessEngineService` больше не рисует synthetic fallback для `BS%` и возвращает честные nullable/pending quality-метрики.
  - `ExplainabilityPanelService` и `/control-tower` показывают `Acceptance Rate`, `BS%`, `Evidence Coverage`, `qualityKnown/pending` counters и `criticalPath`.
  - `Correction Rate` честно оставлен как `null/N/A`, потому что отдельный live source ещё не инструментирован.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.
8. **A_RAI S16 — Eval Productionization** [APPROVED]:
  - Добавлен persisted `EvalRun` и живая связь с `AgentConfigChangeRequest` через реальные Prisma relations и DB-level foreign keys.
  - `GoldenTestRunnerService` усилен до run-level evidence: `corpusSummary`, `caseResults`, `verdictBasis`, явные verdicts `APPROVED / REVIEW_REQUIRED / ROLLBACK`.
  - `AgentConfigGuardService` и `AgentPromptGovernanceService` теперь пишут и используют candidate-specific eval evidence как gate.
  - Golden corpus расширен для канонических агентов.
  - Верификация: `pnpm --filter @rai/prisma-client run db:generate` PASS, `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
9. **A_RAI S15 — Registry Persisted Bindings** [APPROVED]:
  - Введены persisted Prisma-модели `AgentCapabilityBinding` и `AgentToolBinding`, а `AgentRegistryService` теперь строит effective runtime bindings из БД.
  - `AgentRuntimeConfigService` переведён на deny-by-default для governed tools без owner/binding; primary authority больше не идёт через `TOOL_RUNTIME_MAP`.
  - `UpsertAgentConfigDto` получил explicit `tools`, а governed sync перестал автогенерировать tool bindings только из дефолтов роли.
  - Persisted `agent -> tools/capabilities` mapping стал реальной authority-моделью для runtime и management path.
  - Верификация: `pnpm --filter @rai/prisma-client run db:generate` PASS, `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
10. **A_RAI S14 — Prompt Governance Closeout** [APPROVED]:
  - Canonical control-plane contract переведён на `POST /rai/agents/config/change-requests` и `.../change-requests/:id/...`.
  - Legacy direct-write path `POST /rai/agents/config` убран; controller-level HTTP proof подтверждает, что старый write path отсутствует.
  - Добавлены controller-level проверки на create change request, degraded canary rollback outcome и tenant-bypass denial.
  - Client contract `apps/web/lib/api.ts` и control-plane surface `control-tower/agents` переведены на governed semantics вместо direct CRUD-иллюзии.
  - Claim `PromptChange RFC` переведён из `PARTIAL` в `CONFIRMED`.
  - Верификация: `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
11. **A_RAI S13 — Autonomy/Policy Incidents & Runbooks** [APPROVED]:
  - `SystemIncident` расширен explicit lifecycle `status`; добавлены live autonomy/policy incident types.
  - Добавлена persisted модель `IncidentRunbookExecution`.
  - `RaiToolsRegistry` теперь пишет live incidents для `QUARANTINE`, `TOOL_FIRST` и `RiskPolicy` blocked critical actions.
  - `AgentPromptGovernanceService` пишет live `PROMPT_CHANGE_ROLLBACK` incident.
  - Реализован endpoint `POST /rai/incidents/:id/runbook` с исполняемыми actions `REQUIRE_HUMAN_REVIEW` и `ROLLBACK_CHANGE_REQUEST`.
  - Governance feed/counters теперь учитывают autonomy/policy incidents отдельно и возвращают explicit incident status.
  - Верификация: `pnpm prisma:generate` PASS, `pnpm prisma:build-client` PASS, `pnpm --dir apps/api exec tsc --noEmit` PASS, targeted jest PASS.
12. **A_RAI R12 — Prompt Governance Reality** [READY_FOR_REVIEW]:
  - Добавлен persisted workflow `AgentConfigChangeRequest` для agent prompt/model/config changes.
  - Реализован `AgentPromptGovernanceService` с обязательным путём `create change -> eval -> canary start -> canary review -> promote/rollback`.
  - `POST /rai/agents/config` больше не пишет production config напрямую; production activation выполняется только через `promoteApprovedChange()`.
  - Прямой bypass через `toggle(true)` заблокирован; enable требует governed workflow.
  - `GoldenTestRunnerService` расширен до agent-aware режима: добавлены golden sets для `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`, eval привязан к реальному change candidate (`promptVersion`, `modelName`).
  - В `CanaryService` добавлена rejection-rate evaluation для prompt/config canary path; degraded canary уводит workflow в rollback и quarantine outcome.
  - Верификация: `pnpm prisma:generate` PASS, `pnpm prisma:build-client` PASS, `pnpm --dir apps/api exec tsc --noEmit` PASS, targeted jest PASS.

## 2026-03-07

1. **A_RAI R10 — Registry Domain Model** [APPROVED]:
  - Добавлен `AgentRegistryService` как first-class доменный слой authority для агентов `agronomist`, `economist`, `knowledge`, `monitoring`.
  - Registry теперь явно собирает `AgentDefinition`, effective runtime policy и `AgentTenantAccess` (`INHERITED` / `OVERRIDE` / `DENIED`).
  - `AgentRuntimeConfigService` больше не читает `AgentConfiguration` напрямую; runtime решения идут через registry-domain layer.
  - `AgentConfiguration` переведён в роль legacy storage / projection, а management API (`AgentManagementService`) теперь отдаёт доменную read model `agents`.
  - Исправлены замечания техлида: убрано `catalog` auto-enable без persisted authority; `role` замкнут на канонический домен `agronomist|economist|knowledge|monitoring`.
  - Верификация: `pnpm --dir apps/api exec tsc --noEmit` PASS; targeted jest PASS (26 tests); execution path подтверждает `agent_disabled` и `capability_denied`.
2. **A_RAI R12 — Prompt Governance Reality** [APPROVED]:
  - Введён persisted safe-evolution workflow: `AgentConfigChangeRequest` + `AgentPromptGovernanceService` со state machine `change request -> eval -> canary -> promote/rollback`.
  - Прямой production write через `POST /rai/agents/config` убран; `toggle(true)` и service-level bypass на запись production config заблокированы.
  - `GoldenTestRunnerService` усилен до agent/candidate-aware eval logic: verdict теперь зависит от role, activation, prompt/model metadata, budget и capability/tool bindings, а не от одного `IntentRouter`.
  - Верификация: `pnpm --dir apps/api exec tsc --noEmit` PASS; targeted jest PASS (15 tests).

## 2026-03-10

1. **Service Startup Verification (API/WEB/TG)** [DONE]:
  - API (порт 4000), Web (порт 3000) и Telegram (порт 4002) подтверждены как запущенные.
  - Процессы висят, порты слушаются, `pnpm dev` не требуется, так как всё уже и так пиздато работает.
2. **Chief Agronomist (Мега-Агроном) — Expert-Tier Agent Design** [DONE]:
  - Спроектирован и документирован новый класс агента — expert-tier `chief_agronomist` (Цифровой Мега-Агроном).
  - Создан полный профильный паспорт: `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md` (v1.1.0).
  - Архитектурное решение: Мега-Агроном находится **вне** стандартного orchestration spine, работает на PRO/Heavy моделях ИИ по запросу (on-demand).
  - Введён новый класс ролей — expert-tier — отличный от канонических runtime-агентов и обычных template roles.
  - Отношение к `agronomist`: иерархически выше, но архитектурно независим. `agronomist` — исполнитель рутины, `chief_agronomist` — стратегический эксперт.
  - Связи: `marketer` (информационный feed) → `chief_agronomist` (экспертиза) → `knowledge` (прецедентная база) → `consulting` (кейсы партнёров).
  - Определены 10 целевых intent-ов, 10 expert-tier tools, модельная стратегия и cost control.
  - Обновлены: `INDEX.md`, `INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md` (матрица ответственности + матрица связей).
  - **[v1.1]** Dual Operation Mode: Lightweight (фоновый, дешёвый, engram curator) + Full PRO (on-demand, тяжёлый).
  - **[v1.1]** Энграмный контур: Мега-Агроном = главный потребитель И производитель агро-энграмм (Formation→Strengthening→Recall→Feedback).
  - **[v1.1]** Проактивность: monitoring → alert → chief_agronomist Lightweight → мини-тип → человек → Full PRO (если нужно).
  - **[v1.1]** Этический guardrail COMMERCIAL_TRANSPARENCY (модель D+E): ТОП-3 альтернативы, тег [ПАРТНЁР], наука > коммерция, performance-based commission.
  - **[v1.1]** Кросс-партнёрские энграмы (сетевой эффект) + Engram-Backed Trust Score (для банков/страховых).
3. **Memory System: Cognitive Memory Architecture v2** [DONE — ALL PHASES 1-5.4]:
  - Спроектирована и полностью реализована 6-уровневая когнитивная система памяти.
  - **Implementation**: L1 Working Memory, L2 Episodic, L4 Engrams (Vector HNSW), L6 Network Effect / Trust Score.
  - **Background Workers**: ConsolidationWorker, EngramFormationWorker.
  - **Seasonal Loop**: SeasonalLoopService (batch processing, cross-partner knowledge share).
  - **Expert Integration**: MemoryCoordinatorService + MemoryFacade + AgentMemoryContext.
  - **TypeScript 0 ошибок.** Архитектура готова к работе с PRO-моделями.
4. **Expert-Tier Agents: Chief Agronomist & Data Scientist** [DONE — Phase 3-5 IMPLEMENTED]:
  - Реализованы сервисы и агенты: `ChiefAgronomistAgent` & `DataScientistAgent`.
  - **Chief Agronomist**: ExpertInvocationEngine (PRO-mode, cost control), Expert Opinion, Alert Tips, Ethical Guardrail.
  - **Data Scientist**: Core Analytics, Feature Store, Model Registry (ML Pipeline), Yield Prediction, Disease Risk Model, Cost Optimization, A/B Testing.
  - **Integration**: Полная интеграция в `AgentRegistryService` и `AgentExecutionAdapterService`.
  - **Memory Integration**: Агенты используют все уровни памяти (L1-L6) для экспертных выводов.
  - **Status**: Вшиты в рантайм, компилируются без ошибок.
5. **GIT PUSH Stage 2 & Front Office & Runtime Governance** [DONE]:
  - Все локальные изменения по Stage 2 Interaction Blueprint, Front Office Agent и Runtime Governance (миграции Prisma, сервисы, контроллеры) запушены в мастер.
  - Репозиторий синхронизирован.
  - Добавлены новые гайдлайны по эволюции агентов и GAP-анализ по Control Tower.
6. **Front Office Threads & Handoffs Implementation** [DONE]:
  - Реализована модель `FrontOfficeThread` и `FrontOfficeHandoff` в Prisma.
  - Добавлен `FrontOfficeCommunicationRepository` и `FrontOfficeHandoffOrchestratorService`.
  - Поддерживается перевод чата из режима "Agent Only" в "Manager Assisted".
  - Верификация: tsc PASS, prisma migrations PASS.
7. **Agent Lifecycle Runtime Control** [DONE]:
  - Реализован `AgentLifecycleControlService` для форсирования состояний FROZEN и RETIRED.
  - Добавлена поддержка `agentLifecycleOverride` в runtime governance.
  - Обновлен канон `RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md`.
  - Верификация: unit tests PASS.
8. **Telegram Hybrid Manager Workspace** [DONE]:
  - Добавлена поддержка Telegram WebApp для управления воркспейсом менеджера.
  - Реализован `TelegramPollingConflictGuard` для безопасной работы бота в гибридном режиме.
  - Внедрена авторизация `telegram-webapp` в `apps/web`.
9. **Application Services Startup** [DONE]:
  - Подняты API (порт 4000) и Web (порт 3000) серверы через `pnpm dev`.
  - Prisma client перегенерирован для обеспечения актуальности типов.
10. **Git Pull & Encoding Fix (P1.5)** [DONE]:
  - Сделан `git pull origin main`. В мастере оказался лютый пиздец с кодировкой (mojibake).
  - Локальные изменения были заначены (`git stash`).
  - Конфликты разрешены в пользу сташа, кодировка восстановлена до человеческой.
  - Все файлы из `docs/` и `apps/` приведены в порядок.
  - Верификация: `grep` по "Р˜РќРЎРў" ничего не находит, русский текст читается.

## Status: Refactoring Tenant Isolation & Fixing Type Resolution

### Completed:

1. **Schema Refactoring**:
  - Renamed `tenantId` to `companyId` in `AgroEventDraft` and `AgroEventCommitted` for 10/10 tenant isolation compliance.
  - Updated models to include relations to the `Company` model.
2. **Prisma Client Regeneration**:
  - Regenerated Prisma Client after schema changes.
  - Confirmed `agroEventCommitted` exists in `generated-client/index.d.ts`.
3. **PrismaService Modernization**:
  - Implemented a **Transparent Proxy** in `PrismaService` constructor to automatically route all model delegates through the isolated `tenantClient`.
  - Removed 70+ manual model getters.
  - Updated `tenantScopedModels` to include Agro Event models.
4. **Automation & Contracts**:
  - Added `db:client` and `postinstall` scripts to root `package.json`.
  - Created `docs/01_ARCHITECTURE/PRISMA_CLIENT_CONTRACT.md`.
5. **IDE Fixes**:
  - Created root `tsconfig.json` to resolve `@nestjs/common` and package paths for files in `docs/` and other non-app directories.
  - Added path mapping for `@nestjs/`* to `apps/api/node_modules`.
6. **RAI Chat Integration (P0.1)** ✅:
  - Реализован эндпоинт `POST /api/rai/chat` в API с изоляцией тенентов.
  - Веб-чат переключен на бэкенд, моки в Next.js заменены прокси.
  - Unit-тесты пройдены (4/4).
7. **Agro Draft→Commit (P0.3)** ✅:
  - Добавлен боевой модуль `apps/api/src/modules/agro-events/`* с операциями draft/fix/link/confirm/commit.
  - Tenant isolation: `companyId` берётся из security context, не из payload.
  - Проверка MUST-gate: `apps/api/jest.agro-events.config.js` → PASS (4/4).
8. **Telegram Bot → Agro API (P0.4)** ✅:
  - Бот подключён к `/api/agro-events/`*: intake text/photo/voice → draft, кнопки ✅✏️🔗, callback `ag:<action>:<draftId>`, вызовы fix/link/confirm.
  - Unit + smoke-скрипт пройдены. Ревью APPROVED. Живой e2e не прогнан — приёмка с риском.
9. **AgroEscalation + controller loop (P0.5)** ✅:
  - `AgroEscalationLoopService` подключён после commit в `agro-events`; пороги S3 (delayDays≥4), S4 (delayDays≥7); идемпотентность по eventId+metricKey.
  - Unit 7/7, tenant из committed. Ревью APPROVED. Живой интеграционный прогон не прогнан.
10. **Typed tools registry (P1.1)** ✅:
  - `RaiToolsRegistry` (joi, register/execute), 2 инструмента (echo_message, workspace_snapshot), типизированные DTO (toolCalls, suggestedActions, widgets[].payload Record<string, unknown>).
  - Unit 4/4 (jest direct; pnpm test 137). Ревью APPROVED.
11. **WorkspaceContext (P0.2)** ✅:
  - Канонический контракт `workspace-context.ts` (Zod) + store + паблишеры (FarmDetailsPage, TechMap active). AiChatStore передаёт context в POST /api/rai/chat; API- ## 2026-03-03 (Session Start)

- Чтение текущего состояния проекта (INDEX.md, Checklist)
- Ревью готовых отчетов (S4.1) [APPROVED]
- Финализация S4.1 (INDEX, Report, MB) [DONE]
- Ревью и финализация S5.1 (Memory Adapter) [DONE]
- Определение следующего шага по Stage 2 Plan [PENDING]
[x] Подготовить план создания промта `implementation_plan.md`
- Создать файл промта `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md`
- Обновить `interagency/INDEX.md`
- Реализация и отчет S4.1 [ ]
- Уведомить пользователя
ская типизированная схема `widgets[]` v1.0 (API/Web). `RaiChatService` возвращает `DeviationList` и `TaskBacklog` виджеты. Ревью APPROVED (2026-03-02).

1. **Interagency Synchronization** ✅:
  - Изучены и приняты к исполнению `ORCHESTRATOR PROMPT` и `STARTER PROMPT`.
  - Установлен жесткий приоритет `interagency/` ворклоу.
2. **Agent Chat Memory (P1.3)** ✅:
  - Решение AG-CHAT-MEMORY-001 ПРИНЯТО.
  - Реализованы retrieve + append в RAI Chat; лимиты/timeout/fail-open, denylist секретов.
  - Unit-тесты пройдены (5/5), изоляция проверена.
3. **Status Truth Sync (P1.4)** ✅:
  - Решение AG-STATUS-TRUTH-001 ПРИНЯТО.
  - Truth-sync для PROJECT_EXECUTION_CHECKLIST, FULL_PROJECT_WBS, TECHNICAL_DEVELOPMENT_PLAN.
  - Evidence/команды проверки для P0/P1; полный проход docs/07_EXECUTION/* — backlog.
  - Ревью APPROVED (2026-03-02).
4. **WorkspaceContext Expand (P2.1)** ✅:
  - Решение AG-WORKSPACE-CONTEXT-EXPAND-001 ПРИНЯТО.
  - Commerce contracts + consulting/execution/manager публикуют contract/operation refs, summaries, filters.
  - Web-spec PASS; tenant isolation сохранён. Ревью APPROVED (2026-03-02).
5. **External Signals Advisory (P2.2)** ✅:
  - Решение AG-EXTERNAL-SIGNALS-001 ПРИНЯТО.
  - Реализован тонкий срез `signals -> advisory -> feedback -> memory append` в RAI Chat; explainability, feedback, episodic memory.
  - Unit 8/8 PASS; tenant isolation сохранён. Ревью APPROVED (2026-03-02).
6. **AppShell (S1.1)** ✅:
  - Решение AG-APP-SHELL-001 ПРИНЯТО.
  - AppShell + LeftRaiChatDock, чат не размонтируется при навигации; история и Dock/Focus сохраняются.
  - tsc + unit PASS; manual smoke не выполнен. Ревью APPROVED (2026-03-02).
7. **TopNav Navigation (S1.2)** ✅:
  - Решение AG-S1-2-TOPNAV-001 ПРИНЯТО.
  - Внедрена горизонтальная навигация (TopNav), удален Sidebar.
  - Реализована доменная группировка меню (Урожай, CRM, Финансы, Коммерция, Настройки).
  - Интегрирован визуальный отклик в RAI Output (авто-скролл и подсветка виджетов из мини-инбокса).
  - Тесты Кодекса PASS (189/189). Ревью APPROVED (2026-03-03).
8. **TopNav / Role Switch Hotfix (S1.3)** ✅:
  - Внеплановые UI-правки проведены через отдельный canonical hotfix-контур.
  - `TopNav`: иконки вынесены в головное меню, убран дублирующий заголовок в dropdown, длинные названия нормализованы под двухстрочный перенос.
  - `GovernanceBar`: роль оставлена только в верхней control panel, dropdown ролей переведён на устойчивое open-state без hover-gap.
  - Верификация: `apps/web` tsc PASS, manual check PASS. Ревью APPROVED (2026-03-03).
  - Верификация: web-spec PASS (5 suites / 11 tests), `apps/web` tsc PASS, `apps/api` controller spec PASS. Ревью APPROVED (2026-03-03).
9. **WorkspaceContext Load Rule (S2.2)** ✅:
  - Внедрен "gatekeeper" слой в `useWorkspaceContextStore`.
  - Реализована автоматическая обрезка (truncate) строк: title (160), subtitle (240), lastUserAction (200).
  - Введен лимит на 10 `activeEntityRefs`, избыток отсекается.
  - `filters` защищены от вложенных объектов (fail-safe + console.warn в dev).
  - Верификация: юнит-тесты PASS (3/3), `apps/web` tsc PASS. Ревью APPROVED (2026-03-03).
10. **Software Factory Reinforcement** ✅:
  - Ре-верифицированы и приняты `STARTER PROMPT` (DOC-ARH-GEN-175) и `REVIEW & FINALIZE PROMPT` (DOC-ARH-GEN-176).
  - TECHLEAD готов к работе по канону.

### Pending / Current Issues:

- IDE still showing red files in the screenshot despite TS Server restart.
  - Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
  - Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
  - Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

1. **Chat API v1 Protocol (S3.1)** ✅:
  - Формализован контракт `POST /api/rai/chat` (V1).
  - `RaiChatResponseDto` расширен полями `toolCalls` (типизированный список выполненных инструментов) и `openUiToken`.
  - Реализован возврат фактически исполненных инструментов из `RaiChatService`.
  - Верификация: сервисные тесты PASS (проверка контракта, traceId, threadId), `apps/api` tsc PASS. Ревью APPROVED (2026-03-03).
2. **Typed Tool Calls / Forensic (S3.2)** ✅:
  - Усилен «Закон типизированных вызовов» (LAW).
  - Внедрено принудительное Forensic-логирование пэйлоадов всех инструментов в `RaiToolsRegistry`.
  - Гарантировано использование `execute()` как единственного шлюза к домену.
  - Верификация: юнит-тесты PASS (проверка логов при успехе/валидации/ошибке), `apps/api` tsc PASS. Ревью APPROVED (2026-03-03).
3. **Chat Widget Logic / Domain Bridge (S4.1)** [x]:
  - План принят (ACCEPTED). Предстоит разделение логики- [x] S4.1 Реализация динамической логики виджетов

- Ревью и финализация S4.1
.

### Pending / Current Issues:

- IDE still showing red files in the screenshot despite TS Server restart.
- Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
- Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
- Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

### Next Steps:

1. Полный truth-sync проход по docs/07_EXECUTION/* (backlog).

145: 2.  Перейти к **3.2 Typed Tool Calls only (LAW)** — инспекция и типизация всех инструментов.
146: 
147: 26. **Software Factory Adoption Reinforcement (2026-03-03)** ✅:
148:     *   Повторно принят `ORCHESTRATOR PROMPT` (DOC-ARH-GEN-173).
149:     *   Подтверждено следование `interagency/` воркфлоу.
150:     *   Активирована языковая политика «Русский + мат».
27. **Memory Adapter Contract (S5.1)** ✅:
    *   Внедрен `MemoryAdapter` в `shared/memory`.
    *   Рефакторинг `RaiChatService` и `ExternalSignalsService` на использование адаптера.
    *   Верифицировано 10/10 тестов, изоляция тенантов сохранена.

1. **Memory Storage Canon (S5.2)** ✅:
  - Сформирован канон хранения долговременной памяти `MEMORY_CANON.md` (AG-MEMORY-CANON-001).
  - Определены 3 уровня (S-Tier, M-Tier, L-Tier) и принцип "Carcass + Flex".
  - Изоляция `companyId` формально закреплена во всех слоях.
2. **Memory Schema Implementation (S5.3)** ✅:
  - Добавлены модели `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` в Prisma.
  - Сохранена старая модель `MemoryEntry` для обратной совместимости.
  - Созданы DTO типы в `memory.types.ts` и соблюдена изоляция.
3. **CI/CD Stability (pnpm fix)** ✅:
  - Устранён конфликт версий pnpm в GitHub Actions (`Multiple versions of pnpm specified`).
  - Ворклоу переведены на авто-детект версии из `package.json`.
  - Обновлён `pnpm/action-setup@v4`.
4. **Memory Adapter Bugfixes (S5.4)** ✅:
  - `DefaultMemoryAdapter.appendInteraction` переведен на новую таблицу `MemoryInteraction`.
  - `userId` прокинут из JWT через `RaiChatController` / `RaiChatService` / `ExternalSignalsService` в carcass памяти.
  - Внедрена recursive JSON sanitization для `attrs.metadata` и `attrs.toolCalls` без обнуления всего payload.
  - `embedding` пишется транзакционно через `create + raw vector update`; невалидные векторы отсекаются.
  - Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.
5. **SupervisorAgent API Integration (Phase B closeout)** ✅:
  - Создан `SupervisorAgent` как отдельный orchestration layer для `rai-chat`.
  - `RaiChatService` превращен в thin facade над `SupervisorAgent`.
  - Сохранены typed tools, widgets, memory, advisory и append-flow без ломки API-контракта.
  - Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.
6. **Episodes/Profile Runtime Integration (S5.5)** ✅:
  - `DefaultMemoryAdapter.getProfile/updateProfile` больше не заглушки и работают с `MemoryProfile`.
  - `appendInteraction` теперь пишет компактный `MemoryEpisode` рядом с raw interaction.
  - `SupervisorAgent` использует profile context в ответе и обновляет профиль после interaction.
  - Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.
7. **Memory Observability Debug Panel (S5.6)** ✅:
  - В `RaiChatResponseDto` добавлено поле `memoryUsed`.
  - `SupervisorAgent` возвращает безопасный summary по episode/profile context.
  - В web chat добавлена debug-плашка `Memory Used` для привилегированного режима.
  - Верификация: `apps/api` tsc PASS, `apps/api` targeted jest PASS, `apps/web` store test PASS.

## [2026-03-15 08:40Z] Git Pull / Manual Repo Sync

- Запуск `git pull` для синхронизации локальной копии с `origin/main`.

[2026-03-15 09:15Z] RAI_EP SWOT Analysis

- Проведен SWOT-анализ системы RAI_EP на основе рыночного исследования (РФ/СНГ).
- Создан документ `RAI_EP_SWOT_ANALYSIS.md`.
- Зафиксированы ключевые преимущества (мультиагентность, детерминизм) и рыночные ниши (CFO-layer).

1. **Agent-First Sprint 1 P1 — Tools Registry Domain Bridge (2026-03-03)** ✅:
  - `RaiToolsRegistry` расширен 4 боевыми инструментами: `compute_deviations`, `compute_plan_fact`, `emit_alerts`, `generate_tech_map_draft`.
  - Typed payload/result контракты добавлены в `rai-tools.types.ts`; `companyId` только из `RaiToolActorContext`, никогда из payload.
  - `generate_tech_map_draft` замкнут на `TechMapService.createDraftStub()` — создаёт DRAFT с правильным tenant-scope (TODO: полная генерация — Sprint TechMap Intake).
  - В `SupervisorAgent` добавлен `detectIntent()` — keyword routing по 4 паттернам (отклонения, kpi/план-факт, алерты, техкарта).
  - DI: `DeviationService`, `ConsultingService`, `AgroEscalationLoopService`, `TechMapService` подключены в `RaiChatModule`.
  - `axios` добавлен в `apps/api/package.json` (runtime-блокер `HttpResilienceModule` устранён).
  - Верификация: `apps/api` tsc PASS, unit 14/14 PASS, smoke curl PASS. Ревью APPROVED.
2. **Agent-First Sprint 1 P2 — Tests, E2E Smoke & Telegram Linking (2026-03-03)** ✅:
  - Прогнаны unit-тесты на все 4 tool-маршрута и `detectIntent` — 14/14 PASS.
  - Выполнены 4 live smoke-проверки через `POST /api/rai/chat`: все 4 тула подтверждены.
  - `generate_tech_map_draft` создал реальную запись `TechMap` в БД (`status=DRAFT`, `companyId=default-rai-company`, `crop=rapeseed`).
  - Telegram linking cascade проверен: `telegram.update.ts` поддерживает link-patch для `AgroEventDraft`, но Telegram→`/api/rai/chat` маршрута нет — зафиксировано в backlog.
  - `PROJECT_EXECUTION_CHECKLIST.md` обновлён с truth-sync по Sprint 1.
  - Верификация: unit 14/14 PASS, smoke 4/4 PASS, TechMap DRAFT в БД подтверждён. Ревью APPROVED.
3. **Techmap Prompt Synthesis (2026-03-03)** ✅:
  - Синтезирован мета-промт для создания Техкарты на основе 6 AI-отчетов.
  - Объединены требования из `Промт_Гранд_Синтез.md` и `Промт_синтез.md`.
  - Добавлены строгие критерии экстракции (Блоки A-H) из оригинального `Промт для исследования`, чтобы исключить "воду" и саммари.
4. **TechMap Grand Synthesis — Полный Синтез 6 AI-исследований (2026-03-03)** ✅:
  - Прочитаны все 6 источников: ChatGPT, ChatGPT#2, CLUADE, COMET, GEMINI, GROK.
  - Создан `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` — 770 строк, 8 частей:
5. **TM POST-A: TechMapService Consolidation + Docs (2026-03-04)** ✅:
  - После `ACCEPTED` исполнен план `interagency/plans/2026-03-04_tm-post-a_consolidation.md`.
  - Методы `activate` и `createNextVersion` перенесены в доменный `apps/api/src/modules/tech-map/tech-map.service.ts` без изменения сигнатур.
  - `ConsultingModule` переведён на `TechMapModule`; локальный `apps/api/src/modules/consulting/tech-map.service.ts` удалён.
  - В `TechMapModule` добавлены `TechMapValidator` и `UnitNormalizationService` (providers/exports) для единого сервиса.
  - Документация TM-POST.5 обновлена: `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` + `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-services-api.tm4-tm5.md`.
    - Часть 1: Executive Summary (7 фундаментальных аксиом, консенсус всех источников)
    - Часть 2: Модель данных (15+ сущностей с JSON-схемами, enum-словари, Provenance/Confidence)
    - Часть 3: Методология расчётов (нормы высева, окна GDD, дозы удобрений, ЭПВ, AdaptiveRules, валидация)
    - Часть 4: Юридическая и операционная модель (Contract Core + Execution Layer, ChangeOrder, Evidence, DAG, матрица делегирования ИИ↔Человек)
    - Часть 5: Регионализация (3 профиля) + Экономика (бюджет, KPI, правила перерасхода)
    - Часть 6: Карта противоречий (7 конфликтов с архитектурными вердиктами)
    - Часть 7: 10 инженерных слепых зон (мульти-полевая оптимизация, склад, офлайн-режим и др.)
    - Часть 8: Мини-пример (10 операций для озимого рапса MARITIME_HUMID)
  - Документ готов как технический базис для имплементации модуля TechMap в RAI EP.
6. **TechMap Implementation Master Checklist (2026-03-03)** ✅:
  - Проведён полный аудит кодовой базы: найдены существующие `TechMap`, `MapStage`, `MapOperation`, `MapResource`, `ExecutionRecord`, `Field`, `Season`, `Rapeseed`, `AgronomicStrategy`, `GenerationRecord`, `DivergenceRecord`.
  - Gap-анализ: ~60% сущностей из GRAND_SYNTHESIS покрыты, недостаёт `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone`, `Evidence`, `ChangeOrder`, `AdaptiveRule`.
  - Создан `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` — мастер-чеклист на 5 спринтов (TM-1..TM-5) + пост-консолидация.
  - Создана директория `docs/00_STRATEGY/TECHMAP/SPRINTS/` для промтов кодеру.
7. **TechMap Sprint TM-1 — Data Foundation CLOSED (2026-03-03)** ✅:
  - Добавлены 4 новые Prisma-модели: `SoilProfile` (L1639), `RegionProfile` (L1666), `InputCatalog` (L1691), `CropZone` (L1712).
  - Добавлены 5 Prisma enums: `SoilGranulometricType`, `ClimateType`, `InputType`, `OperationType`, `ApplicationMethod`.
  - Расширены существующие модели nullable-полями: `Field` (+slope/drainage/protectedZones), `TechMap` (+budgetCap/hash/cropZoneId), `MapOperation` (+BBCH-окна/dependencies/evidenceRequired), `MapResource` (+inputCatalogId/rates/applicationMethod).
  - Созданы Zod DTO: `apps/api/src/modules/tech-map/dto/` (4 файла + 4 spec).
  - Верификация: `prisma validate` ✅, `db push` ✅, `tsc --noEmit` ✅, 8/8 DTO-тестов ✅.
  - Ревью Orchestrator: APPROVED. Pre-existing failures в 8 модулях (NestJS DI) подтверждены как не scope TM-1.
  - Decision-ID: `AG-TM-DATA-001` (DECISIONS.log).
  - TM-2 промт создан: `interagency/prompts/2026-03-03_tm-2_dag-validation.md`.
8. **TechMap Sprint TM-2 — DAG + Validation CLOSED (2026-03-03)**:
  - Реализованы `DAGValidationService` (DFS + CPM критический путь), `TechMapValidationEngine` (7 классов ошибок: HARD_STOP/WARNING), `TankMixCompatibilityService`.
  - Реализованы 3 pure-function калькулятора: `SeedingRateCalculator`, `FertilizerDoseCalculator`, `GDDWindowCalculator`.
  - Добавлены в `TechMapService`: `validateTechMap()`, `validateDAG()`, `getCalculationContext()`.
  - Тесты: validation/ 15/15 PASS, calculators/ 9/9 PASS, tech-map/ 56/56 PASS. tsc PASS.
  - Decision-ID: `AG-TM-DAG-002`.
9. **TechMap Sprint TM-3 — Evidence + ChangeOrder CLOSED (2026-03-03)** ✅:
  - Добавлены Prisma-модели: `Evidence`, `ChangeOrder`, `Approval` + 5 enums.
  - Расширены `Company`, `TechMap`, `MapOperation` relation-полями. `PrismaService` обновлён tenant-列表ом.
  - Реализованы: `EvidenceService` (attachEvidence, validateOperationCompletion, getByOperation) и `ChangeOrderService` (5 методов с routing по ролям + $transaction).
  - Zod DTO: evidence, change-order, approval + 6 spec.
  - Тесты: 5 suites / 16/16 PASS. prisma validate/db push/tsc PASS.
  - Ревью Orchestrator: APPROVED. `calculateContingency` с nullable-дефолтом, append-only через транзакции, FSM не переписан.
  - Decision-ID: `AG-TM-EV-003`.
  - TM-3 промт: `interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md`.
10. **TechMap Sprint TM-4 — Adaptive Rules + Regionalization CLOSED (2026-03-04)** ✅:
  - Модели: `AdaptiveRule` (triggerType, condition/changeTemplate Json, isActive, lastEvaluatedAt), `HybridPhenologyModel` (gddToStage Json, baseTemp, companyId optional).
  - Enums: `TriggerType` (WEATHER/NDVI/OBSERVATION/PHENOLOGY/PRICE), `TriggerOperator` (GT/GTE/LT/LTE/EQ/NOT_EQ).
  - Сервисы: `TriggerEvaluationService` (pure `evaluateCondition` + `evaluateTriggers` + `applyTriggeredRule` → ChangeOrderService), `RegionProfileService` (3 climate profile sowing windows, suggestOperationTypes: CONTINENTAL_COLD→DESICCATION mandatory, MARITIME_HUMID→2×FUNGICIDE), `HybridPhenologyService` (GDD→BBCH prediction, tenant→global lookup).
  - DTO: adaptive-rule, hybrid-phenology.
  - Тесты: 17/17 адресных PASS (5 suites). Регрессия tech-map/: 22 suites / 75 tests PASS.
  - Fix: опечатка `tecmhMap` в `tech-map.concurrency.spec.ts` исправлена.
  - Decision-ID: `AG-TM-AR-004`.
11. **TechMap Sprint TM-5 — Economics + Contract Core CLOSED (2026-03-04)** ✅:
  - Модель: `BudgetLine` (TechMap-scoped: techMapId, category, plannedCost, actualCost, tolerancePct). Enum: `BudgetCategory` (9 категорий).
  - Сервисы: `TechMapBudgetService` (calculateBudget с byCategory ledger/withinCap/overCap; checkOverspend: SEEDS 5%, остальные 10% tolerance → ChangeOrderService), `TechMapKPIService` (pure `computeKPIs`: C_ha, C_t, marginPerHa, marginPct, riskAdjustedMarginPerHa, variancePct), `ContractCoreService` (generateContractCore, inline recursive `stableStringify` → SHA-256 → `TechMap.basePlanHash`, verifyIntegrity), `RecalculationEngine` (event-driven: CHANGE_ORDER_APPLIED/ACTUAL_YIELD_UPDATED/PRICE_CHANGED/TRIGGER_FIRED).
  - DTO: budget-line, tech-map-kpi.
  - Тесты: 20/20 адресных PASS (6 suites). Регрессия: 28 suites / 95 tests PASS.
  - Ревью: APPROVED. `computeKPIs` pure fn, `stableStringify` recursive без внешних dep, `basePlanHash` не дублировался.
  - Decision-ID: `AG-TM-EC-005`.

## 2026-03-04 — Оркестратор: POST-B и POST-C промты

**Действие**: Создание промтов для пост-спринтов B и C

### POST-B: Season → CropZone + Rapeseed → CropVariety

- Файл: `interagency/prompts/2026-03-04_tm-post-b_season-cropzone-cropvariety.md`
- Decision-ID: AG-TM-POST-B-006
- Статус: READY_FOR_PLAN (🔴 Высокий риск — миграция данных, обязателен pg_dump)
- Ключевые ограничения: Season.fieldId → nullable, CropZone.cropZoneId → NOT NULL для TechMap, Rapeseed модель НЕ удаляется (deprecated)

### POST-C: UI TechMap Workbench v2

- Файл: `interagency/prompts/2026-03-04_tm-post-c_ui-workbench-v2.md`
- Decision-ID: AG-TM-POST-C-007
- Статус: DONE (Завершена конфигурация UI компонентов для техкарты)

1. **TM-POST-C: UI TechMap Workbench v2 CLOSED (2026-03-04)** ✅:
  - Отчет утвержден (APPROVED).
    - Реализована DAG-визуализация без внешних библиотек (на SVG).
    - Создана EvidencePanel (UI загрузки) и ChangeOrderPanel (запросы на изменения).
    - isFrozen режим жестко отключает интерфейс по Transition-политикам.
    - TypeScript (`tsc --noEmit`), Jest (`testPathPatterns=TechMapWorkbench`) PASS.
2. **TM-POST-B: Season → CropZone + Rapeseed → CropVariety CLOSED (2026-03-04)** ✅:
  - Модели: `Season` (fieldId nullable), `CropZone` (primary link), `CropVariety`, `CropVarietyHistory`, `CropType` enum внедрены.
  - `TechMapService` переключен на `CropZone` как основной источник связи.
  - Data-migration: `Rapeseed` -> `CropVariety` и `Season` -> `CropZone` выполнены (idempotent скрипты).
  - Backup: `backups/rai_platform_20260304T114020Z.dump` создан перед DDL.
  - Верификация: tsc PASS, prisma validate PASS, tests (34 + 95) PASS. Ревью APPROVED.
3. **AI Multi-Agent Architecture Design (2026-03-04)** ✅:
  - Проведено глубокое исследование (Phase 1) 35+ модулей и Prisma-схемы.
  - Создан `docs/RAI_AI_SYSTEM_RESEARCH.md` (12 секций).
  - Создан `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` (14 секций) — мульти-агентная система с 5 специализированными агентами.
  - Спроектированы: Tool Registry (14 тулов), 3-слойная память, 4 тира моделей, HITL-матрица, Roadmap на 3 стадии.
  - Обновлен `memory-bank/activeContext.md`.
  - Ревью: DONE. Готов к имплементации Stage 1.
4. **A_RAI Фаза 1 — Старт декомпозиции SupervisorAgent (2026-03-04)** [IN_PROGRESS]:
  - Принят к исполнению `CURSOR SOFTWARE FACTORY — STARTER PROMPT.md`.
  - Прочитаны все обязательные документы: `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`, `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `PROJECT_EXECUTION_CHECKLIST.md`.
  - Состояние: все задачи Фаза 1-3 A_RAI открыты; все Sprint S-серии и TM-серии DONE.
  - Определён первый шаг: IntentRouter + AgroToolsRegistry + TraceId Binding.
  - Создан промт: `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md`.
  - Зарегистрированы Decision-ID: AG-ARAI-F1-001, AG-ARAI-F1-002, AG-ARAI-F1-003, AG-ARAI-F1-004, AG-ARAI-F2-001, AG-ARAI-F2-002, AG-ARAI-F2-003, AG-ARAI-F3-001, AG-ARAI-F3-002, AG-ARAI-F3-003 в `DECISIONS.log`.
  - Обновлены: `A_RAI_IMPLEMENTATION_CHECKLIST.md` (пп. 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3 → `[/]`), `interagency/INDEX.md`, `memory-bank/task.md`.
  - Промт F1-3: `interagency/prompts/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md`.
  - Промт F1-4 (Декомпозиция SupervisorAgent: MemoryCoordinator, AgentRuntime, ResponseComposer): `interagency/prompts/2026-03-04_a_rai-f1-4_supervisor-decomposition.md`.
  - Промт F2-1 (Parallel Fan-Out + ToolCall Planner): `interagency/prompts/2026-03-04_a_rai-f2-1_parallel-fan-out.md`.
  - Промт F2-2 (EconomistAgent + KnowledgeAgent): `interagency/prompts/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md`.
  - Промт F2-3 (Eval & Quality: AgentScoreCard, GoldenTestSet): `interagency/prompts/2026-03-04_a_rai-f2-3_eval-quality.md`.
  - Промт F3-1 (Мониторинг и автономность: MonitoringAgent, AutonomousExecutionContext): `interagency/prompts/2026-03-05_a_rai-f3-1_monitoring-agent.md`.
  - Промт F3-2 (Политики рисков: RiskPolicyEngine, Two-Person Rule): `interagency/prompts/2026-03-05_a_rai-f3-2_risk-policy.md`.
  - Промт F3-3 (Конфиденциальность: SensitiveDataFilter, Red-Team Suite): `interagency/prompts/2026-03-05_a_rai-f3-3_privacy-red-team.md`.
  - Промт F4-1 (Explainability Panel): `interagency/prompts/2026-03-05_a_rai-f4-1_explainability-panel.md` [APPROVED].
  - Промт F4-2 (TraceSummary Data Contract v1): `interagency/prompts/2026-03-05_a_rai-f4-2_tracesummary-contract.md` [APPROVED].
  - Промт F4-3 (Evidence Tagging MVP): `interagency/prompts/2026-03-05_a_rai-f4-3_evidence-tagging.md` [APPROVED].
  - Промт F4-4 (Truthfulness Engine BS%): `interagency/prompts/2026-03-05_a_rai-f4-4_truthfulness-engine.md` [APPROVED].
  - Промт F4-5 (Truthfulness Panel API): `interagency/prompts/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` [APPROVED].
  - Промт F4-6 (Drift Alerts): `interagency/prompts/2026-03-05_a_rai-f4-6_drift-alerts.md` [APPROVED].
  - Промт F4-7 (Autonomy Policies): `interagency/prompts/2026-03-05_a_rai-f4-7_autonomy-policies.md` [APPROVED].
  - Промт F4-8 (Agent Points): `interagency/prompts/2026-03-05_a_rai-f4-8_agent-points.md` [APPROVED].
  - Промт F4-9 (Feedback Credibility): `interagency/prompts/2026-03-05_a_rai-f4-9_feedback-credibility.md` [APPROVED].
  - Промт F4-10 (Explainability Explorer): `interagency/prompts/2026-03-05_a_rai-f4-10_explainability-explorer.md` [APPROVED].
  - Промт F4-11 (Incident Ops): `interagency/prompts/2026-03-05_a_rai-f4-11_incident-ops.md` [ACTIVE].
  - Промт F4-12 (Performance Metrics): `interagency/prompts/2026-03-05_a_rai-f4-12_performance-metrics.md` (добавлено в индекс).

- [2026-03-05 18:16:48] Проверен отчёт 2026-03-05_a_rai-f4-11_incident-ops.md по IncidentOps. Заебись.
- [2026-03-05 18:34:33] Проверен отчёт 2026-03-05_a_rai-f4-12_performance-metrics.md. Performance Metrics & SLO DONE.
- [2026-03-05 18:48:28] Проверен отчёт 2026-03-05_a_rai-f4-13_cost-workload-hotspots.md. Cost Decomposition DONE.
- [2026-03-05 18:57:10] Проверен отчёт 2026-03-05_a_rai-f4-14_connection-map-critical-path.md. Agent Connection Map DONE.
- [2026-03-05 19:17:34] Проверен отчёт 2026-03-05_a_rai-f4-15_safe-replay-trace.md. Safe Replay Trace DONE.
- [2026-03-05 19:24:27] Проверен отчёт 2026-03-05_a_rai-f4-16_agent-configurator.md. Agent Configurator API DONE.
- [2026-03-05 19:43:27] Проверен отчет 2026-03-05_a_rai-f4-17_control-tower-ui.md. Control Tower UI DONE.
- [2026-03-05 19:51:12] Запущены API (port 4000) и Web (port 3000) серверы.
- [2026-03-05 20:35:00] Исправлен баг в `TopNav.tsx`: добавлен таймаут 150мс на закрытие меню. Сука, зазор в 8 пикселей больше не ломает навигацию.

## 2026-03-05 — R2 TraceSummary Live Metrics (READY_FOR_REVIEW)

- `TraceSummaryService.updateQuality(traceId, companyId, bsScorePct, evidenceCoveragePct, invalidClaimsPct)` — новый метод для патча quality-полей
- `TruthfulnessEngineService.calculateTraceTruthfulness()` — сигнатура изменена с `Promise<void>` на `Promise<number>` (bsScorePct); убран внутренний `updateTraceSummary`
- `SupervisorAgent`: 2-шаговая запись TraceSummary — initial record (exe metadata) + updateQuality (quality после TruthfulnessEngine)
- Live поля: `toolsVersion` = список выполненных tools, `policyId` = classification.method, `bsScorePct` + `evidenceCoveragePct` из runtime
- tsc PASS | trace-summary.spec 4/4 | truthfulness-engine.spec 5/5 | supervisor-agent.spec 6/6

## [2026-03-15 08:40Z] Git Pull / Manual Repo Sync

- Запуск `git pull` для синхронизации локальной копии с `origin/main`.

## 2026-03-05 — R3 Truthfulness Runtime Trigger (READY_FOR_REVIEW)

- Гонка устранена: `writeAiAuditEntry` дожидается выполнения перед `calculateTraceTruthfulness`.
- `replayMode` корректно блокирует вычет truthfulness.
- Убран фальшивый fallback `bsScorePct ?? 0` — движок теперь честно отдает 100 для пустых трейсов.
- Добавлено 5 тестов `Truthfulness runtime pipeline`.
- tsc PASS, targeted jest PASS.

## 2026-03-06 — R4 Claim Accounting and Coverage (DONE)

- Внедрена каноническая модель Claim Accounting: `total / evidenced / verified / invalid`.
- Формулы `evidenceCoveragePct` и `invalidClaimsPct` переведены на прозрачные знаменатели.
- `TruthfulnessEngineService` теперь возвращает `TruthfulnessResult` вместо `number`.
- `TraceSummary` теперь честно сохраняет `invalidClaimsPct`.
- Регрессия тестов (3 сюиты, 20 тестов) — PASS.
- Decision AG-RAI-R4-001 зафиксирован.

## 2026-03-06 — R5 Forensics Timeline Depth (STARTED)

- Взят промт `2026-03-06_a_rai-r5_trace-forensics-depth.md`.
- Цель: Восстановление полной причинной цепочки (`router -> summary -> audit -> truthfulness -> quality -> composer`).
- Анализ `TraceTopologyService` и `ExplainabilityPanelService` выявил расхождения в логике восстановления фаз.

## 2026-03-06 — Git Sync (DONE)

- Выполнен `git pull` для синхронизации с удаленным репозиторием.
- Обновлены файлы в `docs/09_ARCHIVE/`.
- Конфликтов нет, всё чики-пуки.

## 2026-03-06 — Сбор данных по рапсу (IN PROGRESS)

- Форматирование `CEMINI#1.md` (ручная правка структуры и таблиц)
- [/] Реформатирование `GEMINI#2.md` (83KB). Применены Python-скрипты для первичной разбивки на секции.
- Окончательная очистка и фикс таблиц в `GEMINI#2.md`.
- Создан финальный промт Гранд-Синтеза: `Promt_Grand_Sintez_FINAL.md` — объединяет роль/правила из шаблона с полной 11-секционной структурой + 6 приложений + 7 правил триангуляции + критерии качества.

## 2026-03-07 — Анализ готовности мультиагентов

- Изучены чеклисты `STAGE 2` (Implementation, Readiness, Truth Sync).
- Сопоставлен код с claims: обнаружено, что Agent Registry пока существует лишь как CRUD-иллюзия `AgentConfiguration` в Prisma.
- Сформирован дальнейший roadmap: реализация `R10. Registry Domain Model`.

## 2026-03-07 — Stage 2 Interaction Blueprint Finalized ✅

- Закрыт `clarification / overlay / auto-resume / result windows` как production-like path.
- Unified window protocol подтверждён на reference families:
  - `agronomist`
  - `economist`
  - `knowledge`
  - `monitoring`
- Введён backend contract-layer `Focus / Intent / Required Context / UI Action`.
- `IntentRouter`, `Supervisor`, `ResponseComposer` переведены на общий interaction contract source.
- `AI Dock` приведён к IDE-подобной композиции: header, history toggle, new chat, conversation, composer.
- Legacy `widgets[]` переведены в compatibility path через `workWindows[]`.
- Window layer поддерживает `context_`*, `structured_result`, `related_signals`, `comparison`.
- Документация и handoff синхронизированы до состояния `DONE / implemented canon`.
- Memory-bank синхронизирован перед публикацией в git.

## 2026-03-11 — CI/CD & Запуск

- Запущены API/Web сервисы (через `pnpm dev` в фоне).
- Создан файл полного системного аудита `RAI_EP_SYSTEM_AUDIT.md`.
- Все локальные изменения закоммичены и отправлены в ремоут.
2026-03-12: Интеграция Nvidia Qwen LLM адаптера для Expert-tier агентов в режиме full_pro.
2026-03-13: Закоммитил и пушнул изменения по базе данных, ёпта, всё на месте.
2026-03-28: Начат remediation-пакет после enterprise-аудита: `invariant-gate` научен распознавать `RequireInternalApiKey`, `semantic-router` снова отделяет bounded primary-slice от shadow classification, `infra/gateway/certs` очищен от versioned private key и переведён на externalized secret policy.
2026-03-28: Добит `raw SQL governance`: четыре db-скрипта переведены с `queryRawUnsafe/executeRawUnsafe` на `Prisma.sql` и allowlisted как approved tooling SQL; `node scripts/raw-sql-governance.cjs --enforce` и `pnpm gate:invariants` завершились с `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0`.
2026-03-28: Стабилизирован крупный backend test-contract batch: 15 targeted suite прошли `--runInBand`, `api build` зелёный, а `agent-interaction-contracts` больше не создаёт front-office escalation write-call без route/thread context для red-team tenant-escape payload.
2026-03-28: Audit-пакет синхронизирован до версии `1.1.0` под post-remediation baseline: `routing` PASS (`4/4`, `86/86`), `web build` PASS, `web test` PASS (`42/42`, `482/482`), `api test -- --runInBand` PASS (`252/252`, `1313 passed`, `1 skipped`); verdict поднят до `Security/Deployment/Product = CONDITIONAL GO`, `Legal = NO-GO`.
2026-03-28: Повторная audit-верификация уточнила residual-risk: `pnpm gate:invariants` сейчас WARN с `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=2`, а `infra/gateway/certs/ca.key` уже удалён из дерева, но ещё требует commit-level cleanup и key-rotation review.
2026-03-28: Закрыт residual security slice: `apps/api/test/a_rai-live-api-smoke.spec.ts` переведён на bracket-key mocks для unsafe Prisma методов, `node scripts/raw-sql-governance.cjs --enforce` снова PASS с `raw_sql_unsafe=0`, а `pnpm gate:invariants` завершился с `violations=0`.
2026-03-28: `git rm --cached --force infra/gateway/certs/ca.key` убрал `ca.key` из текущего индекса; открытым остался уже не tracked-file risk, а history cleanup / rotation evidence debt.
2026-03-28: Audit-пакет обновлён до версии `1.2.0`: evidence matrix и delta теперь фиксируют fully green invariant baseline и historical, а не active, характер `ca.key` incident.
2026-03-28: Закрыт DB governance drift: `MODEL_SCOPE_MANIFEST.md` дополнен `TechMapReviewSnapshot`, `TechMapApprovalSnapshot`, `TechMapPublicationLock`, после чего `pnpm gate:db:scope` снова PASS.
2026-03-28: Audit-пакет обновлён до версии `1.3.0`: deployment/schema sections больше не считают `gate:db:scope` активным blocker, а фокус remediation смещён в legal/compliance, supply-chain и schema validate stabilization.
2026-03-30: Создан `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md` как новый мастер-документ следующего хода: он переводит strategy + audit + evidence + RF/legal/privacy/AI/ops артефакты в жёсткий порядок действий для `Agent Core + Minimal Web Surface`, поднимает decision rubric, release tiers, exit-condition rule и anti-roadmap в активный execution canon.
2026-03-30: Собран внешний двуязычный handoff-пакет в `var/handoff/external-dev-bilingual-packet/` с парными `RU/EN` briefing-файлами по product context, architecture/runtime, readiness/status и stage-based roadmap; пакет зафиксирован как non-canonical external artifact для передачи зарубежному разработчику.
2026-03-31: Выполнена первая фактическая remediation-волна `A2`: `minio` поднят до `8.0.7`, добавлены `pnpm.overrides` для `axios 1.14.0` и `handlebars 4.7.9`, после чего `pnpm security:audit:ci` улучшился с `critical=2, high=37` до `critical=0, high=30`, а `pnpm --filter api build` и `pnpm --filter web build` прошли на новом dependency baseline.
2026-03-31: Выполнена вторая фактическая remediation-волна `A2`: в `package.json` и `pnpm-lock.yaml` добавлены targeted overrides для `effect`, `flatted`, `rollup`, `undici`, `multer`, `serialize-javascript`, `glob`, `minimatch` и `picomatch`; `pnpm security:audit:ci` улучшился с `critical=0, high=30` до `critical=0, high=5`, а оставшийся хвост сузился до dev-toolchain (`@typescript-eslint/typescript-estree -> minimatch@9.0.3`, `@angular-devkit/core -> picomatch@4.0.1/4.0.2`) при сохранении зелёных `pnpm gate:secrets`, `pnpm gate:invariants`, `pnpm --filter api build` и `pnpm --filter web build`.
2026-03-31: Для `A2` принято отдельное release-решение: residual `high=5` признан допустимым для `Tier 1 self-host / localized MVP pilot` как `non-runtime toolchain debt`; `A-2.3.1` переведён в `done`, а остаточный security-фокус смещён на historical key/rotation debt и внешний access-governance evidence.
2026-03-31: Остаточные security-хвосты `A2` переведены в отдельные рабочие чеклисты: создан `PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md` для history/rotation debt и `PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md` для GitHub UI/access perimeter; `PHASE_A_EXECUTION_BOARD.md` дополнен явной строкой `A-2.3.5`, а `PHASE_A_EVIDENCE_MATRIX.md` теперь отдельно требует внешний restricted artifact по access-governance.
2026-03-31: `A2` доведена до micro-step уровня: добавлены `PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md`, `PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md`, `PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md`, а вне Git создан restricted scaffolding `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/` с metadata cards и templates под каждый остаточный security-evidence artifact.
2026-03-31: Для `A2-S-01` подготовлен первый `repo-derived draft` в `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-01/`; в нём уже зафиксированы подтверждённые факты по старому `infra/gateway/certs/ca.key`, коммиту удаления `233cf5e61eb246f03d4a115cdff43706d92a812b` и чистому tracked secret baseline, но статус metadata оставлен `requested`, потому что revocation/reissue ещё не подтверждены внешним artifact.
2026-03-31: Для `A2-S-02` подготовлен второй `repo-derived draft` в `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-02/`; в нём зафиксированы подтверждённые факты по историческим Telegram token в `mg-core/backend/.env` и `mg-core/backend/src/mg-chat/.env`, коммиту удаления `de2ac2c1b8c3117f9d2b076c0a142c68636f7a09` и чистому `tracked_findings=0`, но статус metadata оставлен `requested`, потому что rotation/invalidation ещё не подтверждены внешним artifact.
2026-03-31: Для `A2-S-03` подготовлен третий `repo-derived draft` в `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-03/`; в нём зафиксированы подтверждённые repo-факты по `CODEOWNERS`, критичным security/invariant workflows и policy-требованию quarterly GitHub UI review outside repo, но статус metadata оставлен `requested`, потому что branch protection, required checks, admin bypass, deploy keys и environments требуют внешнего GitHub evidence.
2026-03-31: Для residual `A2` security-evidence добавлен machine-readable gate: создан `scripts/security-evidence-status.cjs`, доступны `pnpm security:evidence:status` и `pnpm gate:security:evidence`, а в `docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md` зафиксирован единый порядок closeout для `A2-S-01/02/03` с привязкой к `PHASE_A_EXECUTION_BOARD` и `PHASE_A_EVIDENCE_MATRIX`.
2026-03-31: Для `A2` добавлен полный lifecycle automation по security evidence: созданы `scripts/security-evidence-intake.cjs` и `scripts/security-evidence-transition.cjs`, в `package.json` зарегистрированы `pnpm security:evidence:intake` и `pnpm security:evidence:transition`, micro-checklists `A2-S-01/02/03` теперь содержат точные команды intake/review/accept, а на временной копии restricted metadata подтверждён рабочий цикл `requested -> received -> reviewed -> accepted`.
