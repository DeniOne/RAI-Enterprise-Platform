# RAI_EP External Developer Briefing Packet

## Что это

Это внешний двуязычный handoff-пакет для зарубежного разработчика. Он собран как отдельный non-canonical артефакт передачи и не заменяет внутренний source of truth проекта.

Снимок пакета: `30 марта 2026`.

Главное правило чтения:

`code/tests/gates > generated manifests > docs > этот внешний пакет`

## Для кого пакет

- Для внешнего senior tech lead или сильного full-stack разработчика, которому нужно быстро понять проект до первого созвона или технического погружения.
- Для оценки того, где у системы уже есть живая инженерная база, а где остаются критические gaps.
- Для входа в `AI-first delivery model`, где ИИ делает основной объём bounded implementation work, а человек управляет архитектурой, policy, acceptance и release decisions.

## Порядок чтения

1. `01_PRODUCT_AND_BUSINESS_CONTEXT_*`
2. `02_ARCHITECTURE_AND_RUNTIME_*`
3. `03_READINESS_AND_EXECUTION_STATUS_*`
4. `04_STAGE_BASED_ROADMAP_AND_AI_DELIVERY_MODEL_*`

## Пять ключевых тезисов

- `RAI_EP` не является просто `chat with agents`; это governed operating system для управления агросезоном.
- Центральный артефакт системы это `TechMap`: он связывает агрономию, сезонное исполнение, экономику, deviations, evidence и approval.
- AI в проекте работает как governed advisory/orchestration layer, а не как автономный центр принятия high-impact решений.
- Инженерный baseline уже достаточно силён для controlled development и ограниченного pilot-контурa.
- Внешний production сейчас блокируется не отсутствием идей, а незакрытыми `Legal / Compliance`, AppSec и ops-hardening задачами.

## Что подтверждено сейчас

- Репозиторий является активным `pnpm`/`Turborepo` monorepo с рабочими контурами `apps/api`, `apps/web`, `apps/telegram-bot`, `packages/*`, `infra/*`.
- В проекте уже есть governed AI/runtime foundation, доменные модули сезона и `TechMap`, а также docs-as-code и набор reproducible gates/scripts.
- По состоянию audit-evidence на `2026-03-28` и execution-synthesis на `2026-03-30` система находится примерно на уровне `6.5/10` program/runtime maturity.
- Controlled development и ограниченный `self-host / localized` pilot рассматриваются как реалистичный путь; внешний production пока не считается честно готовым.

## Целевое состояние

- `RAI_EP` должен работать как installable governed enterprise platform вокруг `TechMap`, season execution, finance/economy, explainability, auditability и controlled AI.
- В целевом виде система должна поддерживать прозрачный цикл `plan -> TechMap -> execution -> deviations -> recommendations -> approval -> result`.
- AI должен ускорять analysis, routing, explainability и draft-assembly, но не обходить `HITL`, policy и evidence requirements.
- Масштабирование UI, ролей, новых агентов и интеграций должно идти только после закрытия core governance и release discipline.

## Что важно не перепутать

- Этот пакет даёт быстрый управленческий и технический контекст, но не заменяет чтение кода.
- Strategy и roadmap внутри проекта описывают target state; их нельзя автоматически трактовать как уже полностью реализованный runtime.
- Если тезис из пакета противоречит коду, тестам или gates, верить нужно коду, тестам и gates.

## Основные внутренние источники

- `README.md`
- `docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
- `docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
- `docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
- `docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
- `docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md`
- `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`
