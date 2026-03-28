---
id: DOC-OPS-HOSTING-TRANSBORDER-DEPLOYMENT-MATRIX-20260328
layer: Operations
type: Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-HOSTING-TRANSBORDER-DEPLOYMENT-MATRIX-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: .env.example;docker-compose.yml;ecosystem.config.cjs;apps/api/src/modules/rai-chat/agent-platform/openrouter-gateway.service.ts;apps/api/src/modules/commerce/services/providers/dadata.provider.ts;apps/telegram-bot/src/app.module.ts
---
# HOSTING TRANSBORDER AND DEPLOYMENT MATRIX

## CLAIM
id: CLAIM-OPS-HOSTING-TRANSBORDER-DEPLOYMENT-MATRIX-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение
Документ связывает deployment target matrix, provider inventory и transborder review в один operational baseline.

## Confirmed Provider Inventory

| Провайдер / контур | Подтверждение | Какие данные могут проходить | Residency / transfer статус |
|---|---|---|---|
| PostgreSQL | `.env.example`, `packages/prisma-client/schema.prisma`, `docker-compose.yml` | tenant data, auth, finance, audit metadata | локальный/self-host path подтверждён; production geography не подтверждена |
| Redis | `.env.example`, `apps/telegram-bot/src/shared/redis/redis.service.ts` | кэш, runtime state, возможно auth/session-adjacent данные | локальный/self-host path подтверждён; production geography не подтверждена |
| MinIO / WORM S3-compatible | `.env.example`, `apps/api/src/level-f/worm/worm-storage.service.ts` | audit/retention artifacts, immutable receipts | self-host / S3-compatible path подтверждён; production provider и country не подтверждены |
| DaData | `apps/api/src/modules/commerce/services/providers/dadata.provider.ts` | ИНН, БИК, организация/банк lookup | внешний provider подтверждён кодом; country/legal basis требует отдельной валидации |
| OpenRouter | `apps/api/src/modules/rai-chat/agent-platform/openrouter-gateway.service.ts` | LLM prompts, tool context, possibly PII-adjacent text при ошибочной маршрутизации | внешний provider подтверждён кодом; transborder review обязателен |
| Telegram platform | `apps/telegram-bot/src/app.module.ts`, `apps/api/src/modules/telegram/telegram-notification.service.ts` | Telegram IDs, уведомления, auth links | внешний provider подтверждён кодом; transborder/legal basis требует отдельной валидации |

## Deployment Target Matrix

| Модель | Текущий статус | Что подтверждено | Блокеры |
|---|---|---|---|
| `SaaS` | `partial` | monorepo build/test/gates зелёные; local Docker/PM2/bootstrap path существует | нет подтверждённого cloud residency, branch protection evidence, legal packet |
| `Managed deployment` | `partial` | есть runbooks, advisory DR scripts, config-driven providers | нет install/upgrade packet и подтверждённого support boundary |
| `On-prem / self-hosted` | `partial` | local `.env.example`, `docker-compose.yml`, MinIO/Postgres/Redis path и schema validate wrapper воспроизводимы | нет formal installer, secrets bootstrap guide, backup/restore acceptance packet |
| `Hybrid` | `not evidenced` | код допускает смешанный provider/runtime contour | нет отдельной topology, data-boundary map и support model |

## Transborder Decision Status

| Контур | Статус | Решение на 2026-03-28 |
|---|---|---|
| Local Postgres / Redis / MinIO | `локальный/self-host path есть` | можно использовать как preferred baseline для RU-sensitive pilot |
| DaData | `внешний provider` | не считать автоматически безопасным без processor/legal review |
| OpenRouter | `внешний AI provider` | запрещать для контуров с ПДн/чувствительными данными до отдельного decision log |
| Telegram | `внешняя платформа` | рассматривать как отдельный legal/transborder контур, не смешивать с self-host assumptions |

## Практическое правило
Пока не зафиксированы actual hosting geography, processor contracts и transborder decisions:
- `SaaS` и enterprise external launch не считать legal-ready;
- внутренний или design-partner pilot строить только на self-host/localized path;
- AI/telegram внешние контуры относить к повышенному legal-risk perimeter.
