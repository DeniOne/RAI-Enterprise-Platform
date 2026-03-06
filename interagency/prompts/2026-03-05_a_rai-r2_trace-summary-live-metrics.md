# PROMPT — R2 TraceSummary Live Metrics (Truth Sync Recovery)
Дата: 2026-03-05  
Статус: active  
Приоритет: P0

## Цель
Перестать писать фейковый `TraceSummary` с нулевыми метриками и сделать его живым источником observability. Сейчас `SupervisorAgent` создаёт `TraceSummary`, но кладёт туда дефолтные значения по quality-части и токенам, из-за чего `Control Tower`, `Governance`, `Autonomy` и quality-аналитика питаются полумёртвыми данными. После этой задачи `TraceSummary` должен отражать реальные доступные метрики трейса, а не заглушки.

## Контекст
- Почему это важно сейчас:
  - В `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` claim `BS%` и truthfulness-контур имеет статус `PARTIAL`.
  - В текущем `SupervisorAgent` запись `TraceSummary` делается с нулевыми quality-полями, а не из фактического execution context.
  - Если не починить `TraceSummary`, любые дашборды, алерты и политики автономности будут смотреть на хуйню, а не на реальное состояние системы.
- На какие документы опираемся:
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
  - `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md`
  - `docs/00_STRATEGY/STAGE 2/CURSOR SOFTWARE FACTORY — STARTER PROMPT.md`
- Ключевые текущие файлы:
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts`
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`
  - `apps/api/src/modules/explainability/explainability-panel.service.ts`
  - `apps/web/app/(app)/control-tower/page.tsx`

## Ограничения (жёстко)
- `companyId` только из trusted context. Никаких tenant-данных из payload.
- Не лезть в полноценный `Agent Registry`, `Prompt RFC`, UI-полировку и новые страницы.
- Не делать “идеальную телеметрию на будущее”, если для неё нет живых источников данных прямо сейчас.
- Не подменять реальные метрики красивыми эвристиками, если они не выводятся из текущего trace.
- Предпочтительно не менять схему Prisma без жёсткой необходимости. Сначала выжать максимум из уже существующего `TraceSummary`.
- Backward compatibility обязательна:
  - старые `TraceSummary` с нулями не должны ломать чтение;
  - отсутствие части live-данных допустимо, но должно быть явным и честным.

## Задачи (что сделать)
- [ ] Разобрать текущую запись `TraceSummary` в `SupervisorAgent` и убрать бездумную запись нулей там, где уже можно посчитать или честно прокинуть реальные значения.
- [ ] Зафиксировать минимальный канонический набор live-метрик, которые реально доступны уже сейчас без выдумок. Минимум:
  - `durationMs`
  - `modelId`
  - `promptVersion`
  - `toolsVersion`
  - `policyId`
  - quality-derived поля, если они уже доступны на момент записи
- [ ] Определить корректный момент записи/обновления `TraceSummary`:
  - либо запись в 2 шага (`initial record` -> `quality update`),
  - либо одна запись после того, как данные уже собраны.
- [ ] Привести контракт `TraceSummaryService.record(...)` к честному использованию:
  - не писать дефолтные нули как будто это реальные измерения;
  - не терять уже записанные поля при последующем обновлении.
- [ ] Убедиться, что explainability/dashboard слой читает новые значения без регрессий.
- [ ] Если часть quality-полей на этом этапе ещё не может быть честно посчитана, оформить это явно и не маскировать дефолтом под “готовую метрику”.

## Что не делать
- [ ] Не пытаться в этом промте полностью завершить `BS%` pipeline. Это следующий шаг.
- [ ] Не делать новый dashboard UI.
- [ ] Не расползаться в cross-model validation, eval runs и prompt governance.
- [ ] Не подменять источники данных ручными константами “для красоты”.

## Definition of Done (DoD)
- [ ] `TraceSummary` для новых трейсов больше не выглядит как запись-заглушка с бессмысленными нулями там, где уже доступны реальные значения.
- [ ] `TraceSummaryService` используется как честный writer live-метрик, а не как помойка дефолтов.
- [ ] Explainability / Control Tower читают новый контракт без падений.
- [ ] Есть тесты на запись и/или обновление `TraceSummary` с живыми значениями.
- [ ] `tsc` PASS.
- [ ] Целевые `jest` PASS.

## Тест-план (минимум)
- [ ] Unit/spec: `SupervisorAgent` пишет/обновляет `TraceSummary` реальными полями вместо глухих нулей.
- [ ] Unit/spec: `TraceSummaryService.record(...)` корректно работает при повторной записи того же trace.
- [ ] Unit/spec: explainability/dashboard не ломаются на новых/старых `TraceSummary`.
- [ ] Unit/spec: tenant isolation сохраняется, чужие `TraceSummary` не смешиваются.
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` для затронутого пакета.
- [ ] Целевые `jest` по затронутым файлам/модулям.

## Что вернуть на ревью
- Изменённые файлы (список).
- Краткое описание, какие поля `TraceSummary` теперь считаются “живыми” и откуда они берутся.
- Результаты `tsc`.
- Результаты `jest`.
- Короткое доказательство, что новый trace сохраняет не заглушечный `TraceSummary`:
  - через тестовые expectations,
  - или через зафиксированный вызов `traceSummary.upsert`.

## Критерий приёмки техлидом
Задача считается принятой только если после доработки можно честно сказать: `TraceSummary` перестал быть декоративной таблицей и стал рабочим источником данных для explainability/quality-слоя.
