# Level D — Alerting & SLA Policy

## Критичность: P1 (Блокирующий инцидент)
**SLA для реакции:** 15 минут.
**Каналы:** Call, SMS, Critical Slack.

- **`Lineage Corruption`**: Попытка вставки модели с невалидным `parentHash`.
- **`Production Rollback`**: Автоматический откат модели в Production из-за деградации метрик.
- **`Security Breach`**: Обнаружение атаки повторного воспроизведения (Replay Attack) или инвалидных подписей.

## Критичность: P2 (Предупреждение)
**SLA для реакции:** 4 часа.
**Каналы:** Slack (#alerts-ml).

- **`Critical Drift`**: `PSI > 0.2` или `MAE > 25%` от базовой линии.
- **`K8s Job Failure`**: Сбой контейнера обучения (OOM, Connectivity).
- **`Canary Failure`**: Откат Canary-версии (5% трафика).

## Критичность: P3 (Информационный)
**SLA для реакции:** 24 часа.
**Каналы:** Jira Ticket.

- **`Quota Exceeded`**: Попытка запуска Job сверх лимита.
- **`Cooldown Active`**: Блокировка ретрейна из-за недавнего сбоя/отката.
