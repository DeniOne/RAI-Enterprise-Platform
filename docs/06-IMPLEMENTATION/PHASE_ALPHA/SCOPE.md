# Phase Alpha Scope: Конкретные задачи и сроки

## Timeline: 25.06 - 30.09 2024 (Revised/Active)

## Sprint 1 (25.06 - 08.07): Foundation
### Business Core: Identity Service
- [x] PostgreSQL схема: users, roles, permissions
- [x] API: POST /auth/register (регистрация компании)
- [x] API: POST /auth/login (JWT токен)
- [x] API: GET /users/me (профиль текущего пользователя)

### Инфраструктура:
- [x] Monorepo настройка (Turborepo)
- [x] Docker Compose: PostgreSQL, Redis, Identity Service
- [x] Unified Memory Infrastructure (PostGIS + pgvector + Redis)
- [x] CI/CD: GitHub Actions для тестов

## Sprint 2 (08.07 - 22.07): Registry + Field
### Business Core: Registry Service
- [x] Иерархия: Company → Farm → Field
- [x] API: POST /companies, POST /farms, POST /fields

### RAI Domain: Field Service
- [x] Модель Field с PostGIS геоданными
- [x] API: GET /fields (реестр полей с GeoJSON)
- [ ] Веб: Карта полей (Mapbox) — [Deferred: Out-of-Scope Phase Alpha]

## Sprint 3 (22.07 - 05.08): Tasks + Telegram
### Business Core: Task Engine
- [x] Состояния задачи: Orchestrator State Machine (16 Stages)
- [x] API: Orchestrator Integration (Service=IO, Orchestrator=Brain)
- [x] Logic: Dry-Run, Constraints & Semantic History (SeasonStageProgress)

### [x] Telegram Bot Integration
- [x] Initial handler implementation (`nestjs-telegraf`)
- [x] Auth flow via Telegram ID linking
- [x] Corrected handler return types (fixed TypeErrors)
- [x] `/start` and `/mytasks` commands verification

### [x] System Infrastructure Hardening
- [x] Database Unification (Docker Postgres on port 5432)
- [x] Single source of truth for DB across all apps
- [x] Activation of `postgis` & `pgvector` extensions
- [x] Creation of `run_bot.bat` for easy orchestration

## Sprint 4 (05.08 - 19.08): Веб-интерфейс ✅ COMPLETED
### Веб Frontend:
- [x] Next.js 14 App Router
- [x] Аутентификация (JWT через HttpOnly cookies)
- [x] Dashboard: Новый Dashboard с метриками (задачи, поля, сезоны)
- [x] Форма создания задачи (react-hook-form + zod)
- [x] UI Kit: Button, Card, Input (по UI Design Canon)
- [x] Build & Lint успешны (0 errors, 0 warnings)

## Sprint 5a (Architecture Debt): Мультитенентность и Репозиторий ✅ COMPLETED
- [x] **ARCH-DEBT-001:** Multi-tenancy (Изоляция по `companyId`)
- [x] **ARCH-DEBT-002:** Auth Repository Pattern (Абстракция БД)
- [x] **Build & Lint:** 32 ошибки линтинга устранены, полная сборка API

## Sprint 5-6 (19.08 - 30.09): Интеграция и тестирование
- [x] End-to-end тесты (Unit-tests for core packages complete)
- [ ] Документация API (Swagger)
- [ ] Пилот с 1-2 тестовыми хозяйствами
- [ ] Сбор обратной связи для Phase Beta