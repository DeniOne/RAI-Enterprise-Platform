# Interagency Index
Актуальные документы (обновлять по мере работы).

## Активные промты (в работе)
- `interagency/prompts/2026-03-01_p0-1_api-rai-chat.md` [DONE]
  - План: `interagency/plans/2026-03-01_p0-1_api-rai-chat.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-1_api-rai-chat.md`

- `interagency/prompts/2026-03-01_p0-2_workspace-context.md` [DONE]
  - Результат: канонический WorkspaceContext (contract + store + publishers CRM/TechMap), API DTO без companyId из payload, передача в POST /api/rai/chat.
  - Отчёт: `interagency/reports/2026-03-01_p0-2_workspace-context-report.md`

- `interagency/prompts/2026-03-01_p0-3_agro-telegram-draft-commit.md` [DONE]
  - Результат: боевой `AgroEventsModule` (`/api/agro-events/*`) + MUST-gate unit-test (изолированный jest config)
  - План: `interagency/plans/2026-03-01_p0-3_agro-telegram-draft-commit.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-3_agro-telegram-draft-commit.md`

- `interagency/prompts/2026-03-01_p0-4_telegram-bot-draft-commit.md` [DONE]
  - Результат: бот создаёт draft (text/photo/voice), кнопки ✅✏️🔗, вызовы fix/link/confirm к API; callback `ag:<action>:<draftId>`; unit + smoke-прогон.
  - План: `interagency/plans/2026-03-01_p0-4_telegram-bot-draft-commit.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-4_telegram-bot-draft-commit.md`

- `interagency/prompts/2026-03-01_p0-5_agro-escalation-controller-loop.md` [DONE]
  - Результат: AgroEscalationLoopService после commit; пороги S3/S4; unit 7/7; tenant из committed, не из payload.
  - План: `interagency/plans/2026-03-01_p0-5_agro-escalation-controller-loop.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-5_agro-escalation-controller-loop.md`

- `interagency/prompts/2026-03-01_p1-1_typed-tools-registry.md` [DONE]
  - Результат: RaiToolsRegistry (joi, register/execute), 2 инструмента (echo_message, workspace_snapshot), типизированные DTO, unit 4/4 (jest direct).
  - План: `interagency/plans/2026-03-01_p1-1_typed-tools-registry.md`
  - Отчёт: `interagency/reports/2026-03-01_p1-1_typed-tools-registry.md`

- `interagency/prompts/2026-03-01_p1-2_widgets-schema-renderer.md` [DONE]
  - План: `interagency/plans/2026-03-01_p1-2_widgets-schema-renderer.md`
  - Отчёт: `interagency/reports/2026-03-01_p1-2_widgets-schema-renderer.md`
  - Результат: Каноническая схема `widgets[]` и renderer (2 виджета) в web-чате.

## Шаблоны
- `interagency/templates/PROMPT_TEMPLATE.md`
- `interagency/templates/PLAN_TEMPLATE.md`
- `interagency/templates/REPORT_TEMPLATE.md`
