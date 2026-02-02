# Phase Alpha Scope: Конкретные задачи и сроки

## Timeline: 25.06 - 30.09 2024

## Sprint 1 (25.06 - 08.07): Foundation
### Business Core: Identity Service
- [ ] PostgreSQL схема: users, roles, permissions
- [ ] API: POST /auth/register (регистрация компании)
- [ ] API: POST /auth/login (JWT токен)
- [ ] API: GET /users/me (профиль текущего пользователя)

### Инфраструктура:
- [ ] Monorepo настройка (Turborepo)
- [ ] Docker Compose: PostgreSQL, Redis, Identity Service
- [ ] CI/CD: GitHub Actions для тестов

## Sprint 2 (08.07 - 22.07): Registry + Field
### Business Core: Registry Service
- [ ] Иерархия: Company → Farm → Field
- [ ] API: POST /companies, POST /farms, POST /fields

### RAI Domain: Field Service
- [ ] Модель Field с PostGIS геоданными
- [ ] API: GET /fields (список полей с геоданными)
- [ ] Веб: Карта полей (Mapbox)

## Sprint 3 (22.07 - 05.08): Tasks + Telegram
### Business Core: Task Engine
- [ ] Состояния задачи: created → assigned → completed
- [ ] API: POST /tasks, PATCH /tasks/{id}/status

### Telegram Bot:
- [ ] Команды: /start, /help, /mytasks
- [ ] Webhook обработка сообщений
- [ ] Интеграция с Task Engine

## Sprint 4 (05.08 - 19.08): Веб-интерфейс
### Веб Frontend:
- [ ] Next.js 14 App Router
- [ ] Аутентификация (JWT)
- [ ] Dashboard: карта полей + список задач
- [ ] Форма создания задачи

## Sprint 5-6 (19.08 - 30.09): Интеграция и тестирование
- [ ] End-to-end тесты
- [ ] Документация API (Swagger)
- [ ] Пилот с 1-2 тестовыми хозяйствами
- [ ] Сбор обратной связи для Phase Beta