---
id: DOC-EXE-ONE-BIG-PHASE-A4-SUPPORT-BOUNDARY-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-SUPPORT-BOUNDARY-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md
---
# PHASE A4 SUPPORT BOUNDARY PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-SUPPORT-BOUNDARY-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует минимальную support boundary для `Tier 1 self-host / localized MVP pilot`, чтобы не смешивать обязанности команды продукта и среды пилота.

## 1. Базовый принцип

`Tier 1 self-host / localized` не равен `managed service`.

Это означает:

- команда продукта отвечает за install packet, known limitations, migration path и recovery guidance;
- пилотная среда отвечает за фактическую инфраструктуру, доступы, секреты и эксплуатационную дисциплину;
- без этой границы `self-host` будет ошибочно восприниматься как fully managed perimeter.

## 2. Минимальное разделение ответственности

| Область | Ответственность команды продукта | Ответственность pilot / customer environment |
|---|---|---|
| Install packet | дать детерминированный packet и список prerequisites | реально подготовить host, Docker, network и storage |
| Secrets | описать какие secrets нужны и где они используются | выдать и хранить secrets вне Git |
| Data services | описать требования к PostgreSQL, Redis, MinIO | реально поднять и сопровождать сервисы |
| Upgrade / migration | дать migration path и stop criteria | выполнять rollout по packet и согласованному окну |
| Backup / restore | дать runbook и acceptance criteria | реально сделать backup, хранить его и выполнить drill |
| Access governance | описать минимальные требования | реально настроить branch/access/environment perimeter |

## 3. Что обязательно до pilot

- install packet существует
- dry-run report существует
- recovery report существует
- operator side понимает свою инфраструктурную ответственность

## 4. Что запрещено считать закрытым

Нельзя говорить, что `A4` закрыта, если:

- есть только runbook, но нет recovery execution evidence;
- есть только README local-start, но нет install packet;
- есть только “мы поможем руками”, но нет support boundary;
- `self-host` фактически зависит от памяти автора системы.

## 5. Практический handoff kit

Для первого реального `Tier 1` handoff теперь использовать:

- [PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md)
- [PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md)
- [PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md)

Это не закрывает `A4.4` автоматически, но переводит support boundary из общей guard-фразы в исполняемый handoff-пакет.
