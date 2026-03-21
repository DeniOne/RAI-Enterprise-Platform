---
id: DOC-STR-STAGE-2-CHECKLIST-EVIDENCE-LEDGER-1NTT
layer: Strategy
type: Roadmap
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-STR-STAGE2-EVIDENCE-LEDGER
claim_status: asserted
verified_by: manual
last_verified: 2026-03-21
evidence_refs: docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md;apps/api/src/modules/rai-chat;docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md
---
# Checklist Evidence Ledger

## CLAIM
id: CLAIM-STR-STAGE2-EVIDENCE-LEDGER
status: asserted
verified_by: manual
last_verified: 2026-03-21

Этот документ является действующим журналом доказательств для truth-reset и readiness-checklist по агентной платформе. Его задача — связывать item-уровень с кодом, проверкой и артефактом, а не выступать самостоятельной заменой этих источников.


Дата фиксации: 2026-03-18
Правило done: только `код + проверка + артефакт`.

| item_id | status_before | code_ref | test_ref | artifact_ref | status_after | reason |
|---|---|---|---|---|---|---|
| S3-F2-TALKTO-POOL | [x] | `apps/api/src/modules/rai-chat/tools/delegation-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts`; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agent-runtime-config.service.spec.ts` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | Пул `TalkTo*` доведён до полного набора (9 инструментов), включён deny-by-default ownership и role-scope матрица делегации. |
| S3-F2-SUBAGENT-ADAPTER | [x] | `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/tools/delegation-tools.registry.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/agent-runtime.service.spec.ts`; `pnpm -C apps/api exec tsc -p tsconfig.json --noEmit` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | Включён delegation chain (`traceId/spanId/parentSpanId`) и агрегированный token accounting по hop-цепочке в runtime post-processing. |
| S3-F2-RBAC-TALKTO | [ ] | `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts`; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agent-runtime-config.service.spec.ts` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | Делегирование `TalkTo*` ограничено матрицей ролей и persisted-governance; unknown governed tools блокируются policy. |
| S3-F3-JSON-ONLY | [x] | `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/agent-platform/agent-prompt-assembly.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/agent-runtime.service.spec.ts`; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agent-platform/agent-prompt-assembly.service.spec.ts` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | Закрыт prompt+runtime JSON-only контур: строгий system prompt для data-workers + runtime schema enforcement с retry/fallback. |
| S3-F1-PRESENTER-PROFILES | [ ] | `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md`, `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md` | `rg -n \"Генерировать развернутый текстовый ответ|Генерировать креативный и объемный текстовый контент\" docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md` | `docs/00_STRATEGY/STAGE 2/STAGE_3_AGENT_DELEGATION_IMPLEMENTATION_PLAN.md` | [x] | Для Legal/Marketer явно зафиксирован presenter-mode: разрешена развернутая текстогенерация, в отличие от JSON-only Data Workers. |
| S3-F3-RESPONSE-COMPOSER | [ ] | `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` | `docs/00_STRATEGY/STAGE 2/STAGE_3_AGENT_DELEGATION_IMPLEMENTATION_PLAN.md` | [x] | Composer теперь синтезирует `structuredOutputs[]` в финальный ответ (`Синтез делегированной цепочки`) и даёт user-facing суммаризацию multi-agent результата. |
| S3-F3-TRUST-SCORE | [ ] | `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts` | `docs/00_STRATEGY/STAGE 2/STAGE_3_AGENT_DELEGATION_IMPLEMENTATION_PLAN.md` | [x] | Добавлен trust-assessment и автокросс-чек в `knowledge` path при low-trust сигнале (`crossCheckRequired`/низкий score), с merge результата в structured outputs/evidence/toolCalls. |
| S3-F4-E2E | [x] | `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`, `apps/web/__tests__/ai-chat-store.spec.ts`, `apps/web/lib/stores/ai-chat-store.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts`; `pnpm -C apps/web test -- __tests__/ai-chat-store.spec.ts` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | Кросс-доменный Stage 3 стенд внедрён: backend контракт запроса стабилен, UI показывает промежуточную цепочку делегации через `intermediateSteps` окно. |
| S3-F4-TOKEN-METRICS | [x] | `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`, `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts -t \"фиксирует before/after token-cost метрики\"`; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts`; `pnpm -C apps/api exec tsc -p tsconfig.json --noEmit` | `docs/00_STRATEGY/STAGE 2/STAGE_3_TOKEN_METRICS_BEFORE_AFTER_2026-03-18.md` | [x] | Выпущен воспроизводимый before/after отчёт: `legacyTokens=2800` vs `stage3Tokens=1400`, cost-оценка снижена с `0.005604` до `0.002804` USD при одинаковой latency в benchmark run. |
| S3-F4-UI-DELEGATION-STEPS | [x] | `apps/web/lib/stores/ai-chat-store.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`, `apps/web/components/ai-chat/StructuredResultWindow.tsx` | `pnpm -C apps/web test -- __tests__/ai-chat-store.spec.ts` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | `intermediateSteps` теперь конвертируются в user-facing `structured_result` окно «Цепочка делегации» и отображаются в UI. |
| FE-P0-P2-STRICT-RESET | [x] (массово) | `docs/frontend-audit-2026-03-16/GENERAL_REMEDIATION_EXECUTION_CHECKLIST.md` | n/a | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [ ] | Статусы сняты массово по strict policy: в чеклисте отсутствуют стабильные code/test ссылки на каждый пункт и подтверждающие артефакты уровня release gate. |
| FE-MICROCHECKLIST-RESET | [x] (массово) | `docs/frontend-audit-2026-03-16/GENERAL_REMEDIATION_EXECUTION_CHECKLIST.md` | n/a | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [ ] | Сквозные micro-checklist пункты не были привязаны к регулярному evidence pipeline в CI. |
| FE-RELEASE-GATE-RESET | [x] (массово) | `docs/frontend-audit-2026-03-16/GENERAL_REMEDIATION_EXECUTION_CHECKLIST.md` | n/a | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [ ] | Release gate reopened до автоматической верификации обязательных блокеров через CI job + стабильные артефакты. |
| S3-RAI-CHAT-TEST-CONTOUR | [ ] | `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts` | `pnpm -C apps/api test -- --runInBand src/modules/rai-chat`; `pnpm -C apps/api exec tsc -p tsconfig.json --noEmit` | `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md` | [x] | Закрыт честный baseline по изменённому Stage 3 контуру: полный монолитный прогон `src/modules/rai-chat` зелёный (`57/57` test suites, `311/311` tests) и типизация проходит. |

## Gap Links

- Активных Stage 3 gaps по этому ledger нет: reopened пункты закрыты по правилу `код + проверка + артефакт`.
