# PROMPT — R1 Evidence -> Audit Backbone (Truth Sync Recovery)
Дата: 2026-03-05  
Статус: active  
Приоритет: P0

## Цель
Сделать `evidence` частью канонического audit trail. Сейчас агенты уже умеют собирать `evidence`, а `ResponseComposer` умеет отдавать его в итоговом ответе, но `SupervisorAgent` не довозит это в `AiAuditEntry.metadata`. Из-за этого `Evidence Tagging`, `BS%`, `Trace Forensics` и весь truthfulness-контур висят на пустоте. После этой задачи любой trace, в котором агент вернул `evidence`, обязан сохранять его в audit-следе в машиночитаемом виде.

## Контекст
- Почему это важно сейчас:
  - В `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` claim `Evidence Tagging` имеет статус `PARTIAL`.
  - Главный структурный разрыв STAGE 2 сейчас один: папка продаёт forensic-grade `truthfulness / BS% / evidence`, но код не довозит `evidence` до audit trail.
  - Пока это не исправлено, `TruthfulnessEngine`, `ExplainabilityPanel` и все производные quality-метрики опираются на неполный след.
- На какие документы опираемся:
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
  - `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`
  - `docs/00_STRATEGY/STAGE 2/ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md`
  - `docs/00_STRATEGY/STAGE 2/CURSOR SOFTWARE FACTORY — STARTER PROMPT.md`
- Ключевые текущие файлы:
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`
  - `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`
  - `apps/api/src/modules/explainability/explainability-panel.service.ts`

## Ограничения (жёстко)
- `companyId` только из trusted context. Никаких `companyId` из payload.
- Не делать UI-полировку, новые страницы, косметику `Control Tower` и `Governance`.
- Не расползаться в `TraceSummary`, `BS%` и `Agent Registry` глубже, чем это нужно для протяжки `evidence` в audit trail. Это будут отдельные промты.
- Предпочтительно не делать Prisma migration, если можно использовать уже существующее `AiAuditEntry.metadata` как каноническое место хранения.
- Backward compatibility обязательна:
  - если агент не вернул `evidence`, система не падает;
  - старые записи `AiAuditEntry` без `metadata.evidence` продолжают читаться корректно.
- Service = IO / Orchestrator = Brain. Не смешивать persistence-логику с доменной композицией без необходимости.

## Задачи (что сделать)
- [ ] Зафиксировать канонический контракт `AiAuditEntry.metadata` для этого этапа. Минимум:
  - `replayInput`
  - `evidence`
  - короткий execution context, если он уже доступен без расползания scope
- [ ] Обновить `SupervisorAgent`, чтобы при записи `AiAuditEntry` он сохранял `evidence`, уже собранный в финальном ответе или доступный из execution path.
- [ ] Сохранение `evidence` сделать безопасным:
  - без падения на `undefined`
  - без потери существующего `replayInput`
  - без сериализационных сюрпризов Prisma JSON
- [ ] Обновить чтение/использование audit metadata там, где это уже ожидается:
  - `TruthfulnessEngine`
  - explainability / forensics слой
- [ ] Проверить, что для путей `KnowledgeAgent` и `EconomistAgent`, где `evidence` уже генерируется, это evidence реально доезжает до audit trail.
- [ ] Написать/обновить unit/spec тесты на новый контракт metadata.

## Что не делать
- [ ] Не трогать `Agent Registry`, `AgentConfiguration`, tenant access matrix.
- [ ] Не строить новый dashboard или новые карточки UI.
- [ ] Не делать рефактор всей trace-модели ради красоты.
- [ ] Не добавлять лишние поля “на вырост”, если они не нужны для текущего DoD.

## Definition of Done (DoD)
- [ ] `AiAuditEntry.metadata` для нового trace может содержать `replayInput` и `evidence` одновременно.
- [ ] Для trace, где агент вернул `evidence`, запись в audit trail реально содержит непустой `metadata.evidence`.
- [ ] Для trace без `evidence` поведение остаётся корректным и backward-compatible.
- [ ] `TruthfulnessEngine` и/или explainability readers читают новый контракт metadata без падений.
- [ ] Тесты подтверждают сохранение и чтение `evidence` через audit trail.
- [ ] `tsc` PASS.
- [ ] Целевые `jest` PASS.

## Тест-план (минимум)
- [ ] Unit/spec: `SupervisorAgent` пишет `AiAuditEntry.metadata` с `replayInput + evidence`.
- [ ] Unit/spec: путь без `evidence` не ломает запись audit entry.
- [ ] Unit/spec: `TruthfulnessEngine` читает `metadata.evidence` в ожидаемом формате.
- [ ] Unit/spec: explainability/forensics слой корректно переваривает новый metadata contract.
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` для затронутого пакета.
- [ ] Целевые `jest` по затронутым файлам/модулям.

## Что вернуть на ревью
- Изменённые файлы (список).
- Краткое описание выбранного metadata contract для `AiAuditEntry`.
- Результаты `tsc`.
- Результаты `jest` по целевым тестам.
- Короткое доказательство, что `evidence` реально доезжает до audit trail:
  - или через тестовый expectation,
  - или через лог/снимок ответа мокнутого prisma create.

## Критерий приёмки техлидом
Задача считается принятой только если после твоей доработки можно честно сказать: `evidence` перестал быть одноразовым полем ответа и стал частью системного следа, на который уже можно опирать `BS%` и `forensics`.
