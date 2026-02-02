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
- [ ] API: GET /fields (список полей с геоданными)
- [ ] Веб: Карта полей (Mapbox)

## Sprint 3 (22.07 - 05.08): Tasks + Telegram
### Business Core: Task Engine
- [x] Состояния задачи: Orchestrator State Machine (16 Stages)
- [x] API: Orchestrator Scaffolding & Rule Engine
- [x] Logic: Dry-Run & Constraints

### Telegram Bot:
- [x] Команды: /start, /help, /mytasks
- [x] Webhook обработка сообщений
- [x] Интеграция с Task Engine

## Sprint 4 (05.08 - 19.08): Веб-интерфейс
### Веб Frontend:
- [ ] Next.js 14 App Router
- [ ] Аутентификация (JWT)
- [x] Dashboard: Обновление UI по Canon
- [ ] Форма создания задачи

## Sprint 5-6 (19.08 - 30.09): Интеграция и тестирование
- [x] End-to-end тесты (Unit-tests for core packages complete)
- [ ] Документация API (Swagger)
- [ ] Пилот с 1-2 тестовыми хозяйствами
- [ ] Сбор обратной связи для Phase Beta