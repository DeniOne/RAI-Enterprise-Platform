# Блок 4: Unified Memory Infrastructure (Implementation)

- [x] **Section 4.1: Infrastructure & Schema**
    - [x] Create custom PostgreSQL Dockerfile (PostGIS/pgvector)
    - [x] Update `docker-compose.yml` with build context
    - [x] Add `MemoryEntry` to Prisma Schema
    - [x] Create manual SQL migration for vector constraints
- [x] **Section 4.2: Core Packages**
    - [x] Initialize `@rai/vector-store` package
    - [x] Implement `PgVectorStore` with raw SQL
- [x] **Section 4.3: Business Core Integration**
    - [x] Implement `ContextService` (Redis integration)
    - [x] Define `MemoryPolicy` strategy
    - [x] Implement `MemoryManager` orchestrator
- [x] **Section 4.4: Documentation & Security**
    - [x] Create `infra/SECURITY.md`
    - [x] Audit `SCOPE.md`

- [x] **Milestone 11: Telegram Microservice & Auth Stability**
    - [x] Выделение бота в микросервис `apps/telegram-bot`
    - [x] Исправление JWT инвалидности (sub payload, registerAsync)
    - [x] Рефакторинг UI страницы входа по канону дизайна
    - [x] Обновление документации и Memory Bank

> [!NOTE]
> **Status**: Completed. Infrastructure is ready for hybrid memory operations.
