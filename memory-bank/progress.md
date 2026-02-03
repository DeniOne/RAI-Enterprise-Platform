# Progress: RAI_EP

## Milestone 1: Foundational Canon & Context (In Progress)
- [x] Анализ текущего состояния проекта.
- [x] Реструктуризация дерева `docs/`.
- [x] Создание `BUSINESS_CORE_EXTRACTION_GUIDE.md`.
- [x] Настройка Memory Bank (projectbrief, productContext, activeContext, systemPatterns, techContext).
- [x] Окончательная верификация структуры юзером.

## Milestone 2: Business Core Extraction (Class A/B) - DONE
- [x] Анализ существующих модулей в `mg-core`.
- [x] Выделение кандидатов для экстракции (Class A/B).
- [x] Создание планов экстракции по компонентам.
- [x] Физическая изоляция (src/core-new).
- [x] Восстановление компиляции (npm run build PASS).

## Milestone 3: Neutralization & Migration - DONE
- [x] Глобальная замена MatrixCoin -> BusinessCoin.
- [x] Глобальная замена MatrixGin -> BusinessCore (внутри ядра).
- [x] Глобальная замена MatrixGin -> RAI_EP (на уровне инфраструктуры).
- [x] Перенос `src/core-new` -> `src/core`.
- [x] Чистка `src/index.ts` и `package.json`.
- [x] **Step 5.1 FIX**: Полное удаление доменного имени RAI_EP из ядра.

## Milestone 4: RAI Domain Construction
- [x] Создание RAI_CANON.md.
- [x] Рефакторинг модуля `Crop` -> `Rapeseed` (технический домен).
- [x] Обновление Prisma Schema (OilContent, ErucicAcid, Glucosinolates).
- [x] Техническая верификация: Docker (rai-postgres), TSC, Prisma Generate.
- [ ] Регистрация первых агро-сущностей в Registry.
- [/] Реализация доменного слоя RAI (Season Module).
## Milestone 5: Unified Memory Infrastructure - DONE
- [x] Dockerization: Custom PostgreSQL with PostGIS + pgvector.
- [x] Schema: `MemoryEntry` model with vector dimension check (1536).
- [x] Package: `@rai/vector-store` for associative retrieval.
- [x] Integration: `MemoryManager` and `ContextService` (Redis) in Business Core.
- [x] Security: Digest pinning requirements and `infra/SECURITY.md`.

## Milestone 6: Enterprise Identity & Structure Layer - DONE
- [x] Registry: Company & Holding management.
- [x] Identity Registry: Employee Profiles & Org Roles.
- [x] Multi-tenant isolation at Registry level.


## Milestone 7: Field Service API - DONE
- [x] Prisma: Explicit `companyId` in `Field` model for isolation.
- [x] API: `FieldRegistryModule` (POST/GET) with GeoJSON validation (Polygon/MultiPolygon).
- [x] Verification: Unit tests (4/4 passed).
- [x] Infrastructure: Container with `pgvector` fixed & verified.

## Milestone 8: APL Lifecycle Integration (16 Stages) — DONE
- [x] Schema: `SeasonStageProgress` and `currentStageId` in `Season`.
- [x] Logic: Service = IO / Orchestrator = Brain implementation.
- [x] Integration: GraphQL `transitionSeasonStage` mutation.
- [x] Verification: 3/3 unit tests for stage transitions passed.
- [x] Audit: Semantic history tracking enabled.
