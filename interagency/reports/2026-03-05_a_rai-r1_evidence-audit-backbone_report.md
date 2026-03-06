# REPORT — R1 Evidence -> Audit Backbone
Дата: 2026-03-05
Статус: READY_FOR_REVIEW

## Изменённые файлы
- `/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`

## Что сделано
1. Обновлён `SupervisorAgent`: теперь при вызове `writeAiAuditEntry` передается поле `evidence` из `response` (результат `ResponseComposerService.buildResponse`).
2. В самом `writeAiAuditEntry` изменён контракт сохранения `metadata`:
   - Собирается `metadataObj` (Record<string, unknown>).
   - В него аккуратно складывается `replayInput` (как было).
   - Если `evidence` не пустой массив, он складывается в `metadataObj.evidence`.
   - Затем происходит JSON-сериализация для `Prisma.InputJsonValue`.
3. Backward compatibility сохранена: если `evidence` пуст или `replayInput` нет, они просто не попадают в JSON, структура не ломается, `undefined` не пишется.
4. `TruthfulnessEngine` и `ExplainabilityPanelService` уже читают `metadata.evidence` как массив `EvidenceReference`. Их код менять не потребовалось, так как они уже ожидали эту структуру, оставалось только довезти её с уровня `SupervisorAgent` до уровня БД.

## Результаты проверок
- `tsc --noEmit`: PASS
- `jest src/modules/rai-chat --runInBand`: PASS
- **Дополнительно:** добавлены 3 явных проверки (expectation) на `prismaServiceMock.aiAuditEntry.create` в `supervisor-agent.service.spec.ts`:
  1. Корректная запись `metadata.replayInput`.
  2. Корректная запись `metadata.evidence` для инструмента (например, `compute_deviations`).
  3. Отсутствие записи `metadata` при вызове с флагом `replayMode: true`.

## Доказательство
При выполнении трейса (например, с инструментом вызова плановых отклонений) `audit_entries` теперь содержат запись:
```json
{
  "metadata": {
    "replayInput": {
      "message": "найди отклонения",
      "workspaceContext": { ... }
    },
    "evidence": [
      {
        "claim": "Отклонений найдено: 2",
        "sourceType": "TOOL_RESULT",
        "sourceId": "compute_deviations",
        "confidenceScore": 0.95
      }
    ]
  }
}
```
Этот объект корректно парсится в `TruthfulnessEngineService` для пересчета `BS%`.

Ожидаю ревью.
