---
id: DOC-EXE-PWA-FRONT-OFFICE-COMMUNICATOR-PWA-FRONT-OF-1U4E
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@product, @backend, @frontend, @qa]
last_updated: 2026-03-17
---
# PWA Front-Office Communicator — Execution Control Board

## 1. Правило документа

Этот документ является каноническим operational source of truth по исполнению delivery.

- `Implementation Plan` отвечает за target state и архитектурную логику.
- `Checklist` отвечает за полноту обязательных работ.
- `Control Board` отвечает за текущее исполнение, ownership, зависимости, блокеры и evidence.

## 2. Статусы

- `not_started`
- `in_progress`
- `blocked`
- `in_review`
- `done`

## 3. Приоритеты

- `P0` — блокирует MVP или pilot.
- `P1` — не блокирует базовый loop, но блокирует rollout quality.
- `P2` — polish / stage 2 / optimization.

## 4. Workstreams

| Workstream | Item | Owner | Priority | Dependency | Status | Acceptance evidence | Notes |
|---|---|---|---|---|---|---|---|
| Architecture | Finalize communicator namespace ADR | Product + Backend | P0 | none | not_started | approved ADR | primary route + legacy alias policy |
| Architecture | Approve canonical state model | Product + Backend + QA | P0 | none | not_started | signed state model | message/thread/read semantics |
| Backend | Harden `web_chat` inbound/outbound | Backend | P0 | namespace ADR | not_started | integration tests green | no Telegram-only assumptions |
| Backend | Implement idempotency + dedup | Backend | P0 | web_chat hardening | not_started | duplicate submit tests green | inbound and retry safe |
| Backend | Polling API hardening | Backend | P0 | web_chat hardening | not_started | performance evidence | last-message marker / paging |
| Backend | Attachment upload path | Backend | P1 | client PWA MVP | not_started | upload E2E pass | stage 2 acceptable |
| Frontend | Client PWA shell | Frontend | P0 | none | not_started | installable build | manifest + icons + standalone |
| Frontend | Client chat MVP | Frontend | P0 | backend web_chat hardening | not_started | send/receive E2E | message timeline + composer |
| Frontend | Client onboarding UX | Frontend | P0 | client PWA shell | not_started | invite/activate/login evidence | add-to-home-screen CTA |
| Frontend | Session persistence + re-entry | Frontend + Backend | P0 | client onboarding UX | not_started | standalone reopen pass | no ghost sessions |
| Frontend | Manager unified workspace route | Frontend | P0 | namespace ADR | not_started | neutral route working | no primary Telegram naming |
| Frontend | `Клиенты / A-RAI` switch hardening | Frontend | P0 | manager workspace route | not_started | E2E switch/back | context preserved |
| Frontend | Manager thread context panel | Frontend | P1 | manager workspace route | not_started | UI evidence | field/season/task/handoff |
| QA | Canonical E2E loop | QA | P0 | client + manager MVP | not_started | evidence attached | invite -> send -> reply |
| QA | Race condition coverage | QA | P0 | backend state model | not_started | automated tests | polling vs reply / reopen |
| Security | Threat model + tenant boundary validation | Security + Backend | P0 | backend hardening | not_started | review signed off | no cross-tenant leak |
| Product/Ops | Pilot baseline metrics | Product + Ops | P0 | metrics instrumentation | not_started | baseline snapshot | before pilot |
| Product/Ops | Freeze / rollback protocol | Product + QA | P0 | pilot planning | not_started | approved protocol | stop conditions fixed |
| Rollout | Pilot launch | Product + QA | P0 | canonical E2E loop green | not_started | pilot brief approved | limited cohort |
| Rollout | Expansion decision | Product | P0 | pilot report | not_started | go/no-go memo | based on freeze criteria |
| Stage 2 | SSE design | Backend | P1 | MVP stable | not_started | design doc | no rush before MVP |
| Stage 2 | Web push strategy | Product + Frontend | P2 | MVP stable | not_started | channel decision | browser support caveats |

## 5. Critical path

- `CP-1` Namespace ADR.
- `CP-2` Canonical state model.
- `CP-3` `web_chat` hardening.
- `CP-4` Client PWA shell + onboarding.
- `CP-5` Session persistence.
- `CP-6` Manager unified workspace.
- `CP-7` Canonical E2E loop.
- `CP-8` Pilot with freeze criteria.

Правило:

- пока `CP-1..CP-8` не закрыты, команда не уходит в широкий polish, secondary features и избыточные integrations.

## 6. Blockers

| Date | Blocker | Owner | Impact | Resolution path | Status |
|---|---|---|---|---|---|
| 2026-03-17 | Neutral route not finalized | Product + Frontend | blocks manager workspace canonicalization | approve ADR and implement redirects | open |
| 2026-03-17 | Canonical state semantics not formalized in code/tests | Backend + QA | creates mismatch risk between UI and backend | lock lifecycle and add tests | open |
| 2026-03-17 | Session persistence policy not validated in standalone mode | Frontend + Backend | blocks reliable client adoption | run device matrix and harden auth/session | open |

## 7. Acceptance evidence index

| Item | Evidence type | Link / artifact | Status |
|---|---|---|---|
| Namespace ADR | markdown doc | `ADR_COMMUNICATOR_NAMESPACE.md` | planned |
| State model | markdown doc + tests | `STATE_MODEL_WEB_CHAT.md` / test suite | planned |
| Client onboarding | video / screenshots / E2E logs | `evidence/client_onboarding/` | planned |
| Manager workspace | screenshots / E2E logs | `evidence/manager_workspace/` | planned |
| Canonical E2E loop | test report | `evidence/e2e_canonical_loop/` | planned |
| Pilot baseline | metrics snapshot | `pilot/baseline_metrics.md` | planned |
| Freeze protocol | markdown doc | `pilot/freeze_rollback_protocol.md` | planned |

## 8. Pilot freeze / rollback protocol summary

### Freeze conditions

- tenant boundary breach;
- message duplication/loss above tolerated threshold;
- session-loss on meaningful share of pilot devices;
- manager forced back to Telegram for basic reply loop;
- install/open loop broken on key device segment;
- state mismatch between timeline and unread/read counters.

### Rollback action

- freeze cohort expansion;
- keep Telegram as primary fallback;
- revert affected users to legacy path;
- log incident and corrective actions;
- re-open rollout only after `P0/P1` closure.

## 9. Go/No-Go summary

| Dimension | Current status | Notes |
|---|---|---|
| Architecture | unknown | namespace ADR pending |
| Backend transport | unknown | `web_chat` hardening pending |
| Frontend client | unknown | PWA shell pending |
| Frontend manager | unknown | neutral route pending |
| Auth/session | unknown | standalone re-entry pending |
| Security | unknown | tenant validation pending |
| E2E | unknown | canonical loop not yet evidenced |
| Pilot readiness | unknown | baseline + freeze protocol pending |

## 10. Update discipline

- Документ обновляется после каждого значимого delivery-сдвига.
- `blocked` статус не может висеть без owner и resolution path.
- `done` статус нельзя ставить без `acceptance evidence`.
- Любой pilot decision обязан отражаться одновременно:
  - в control board;
  - в pilot report;
  - в go/no-go summary.
