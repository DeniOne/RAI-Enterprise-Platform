---
id: DOC-OPS-GOV-141
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# FINANCE INGEST COMPATIBILITY POLICY (RU)

Дата: 2026-02-16  
Область: `finance <-> consulting <-> integrations` ingest contract.

## Версия контракта
- Текущая версия: `1.0.0`
- Поддерживаемые версии runtime: `1.0.0`
- Envelope metadata: `source`, `sourceEventId`, `traceId`, `idempotencyKey`, `contractVersion`

## Границы совместимости

### Backward-compatible изменения
- Добавление новых optional полей в `metadata`.
- Расширение списка `source` при сохранении обратной совместимости существующих значений.
- Добавление новых downstream-consumers, не меняющих contract envelope.

### Breaking changes
- Изменение semantics или типа обязательных полей envelope.
- Удаление/переименование `contractVersion`, `idempotencyKey`, `sourceEventId`, `traceId`.
- Изменение формата idempotency key, ломающее replay/duplicate guarantees.

## Runtime enforcement
- `FINANCE_CONTRACT_COMPATIBILITY_MODE=warn|strict`
- `warn` (default): логирует несовместимую версию и продолжает обработку.
- `strict`: блокирует ingest (`BadRequestException`) и инкрементирует `financial_invariant_failures_total`.

## Upgrade policy
1. Introduce new version in producer.
2. Add version to supported list in finance ingest.
3. Roll out in `warn`.
4. Validate metrics/logs.
5. Switch to `strict`.
