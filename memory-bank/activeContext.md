# Active Context: RAI_EP (2026-02-04)

## Current Project State
- **[2026-02-05] Sprint B2 (HR Ecosystem & Strategic Alignment) Complete**: Реализована 3-контурная HR-модель (Foundation, Incentive, Development). Внедрена стратегическая интеграция с CMR через деаккумулированные снепшоты человеческого капитала.
- **[2026-02-04] Sprint B1 (Consulting Control Plane) Complete**: Реализованы Tech Map, CMR, Risk & Insurance, SLA Logic.
- **[2026-02-04] Sprint B0 (Tech Debt & Resilience) Complete**: Внедрен единый FSM, Redis сессии для бота и полная изоляция бота от БД. Усилена надежность API-клиента.
- **[2026-02-04] Telegram Auth Stability & UI Fix**: Исправлена инвалидность JWT токена. Бот выделен в микросервис.
- [2026-02-03] Database Unification Complete: Вся инфраструктура переведена на единый Docker Postgres (порт 5432).
- **[2026-02-03] Telegram Bot Integration Complete**: Реализована авторизация по ID и команды `/start`, `/mytasks`. Бот успешно работает с унифицированной базой данных.
- [2026-02-03] Sprint 4 Web Interface Complete: Реализован Next.js 14 веб-интерфейс с JWT аутентификацией, Dashboard, формой создания задач. E2E flow проверен и работает. Создан Auth Module в NestJS API.
- **[2026-02-03] Sprint 5a Architecture Debt Complete**: Внедрена мультитенентность (изоляция по `companyId`), реализован паттерн Repository для Auth, вычищено 33 ошибки линтинга в API.
- [2026-02-03] Enterprise Identity Layer Complete: Реализованы реестры холдингов и профилей сотрудников (Блок 3).

## Tech Debt & Future Roadmap
- **Sprint B3**:
  - [ ] **Refactor TechMap**: Вынести валидацию (`TechMapValidator`) в чистый доменный сервис. `TechMapService` оставить как оркестратор.
  - [ ] **SLA Scaling**: Оптимизировать CRON для больших объемов (batch processing или `nextActionAt`).

## Active Decisions
- **Standardization**: Используем структуру документов с префиксами (00, 10, 20...) для строгого порядка.
- **Language**: Весь контент и коммуникация ведутся на русском языке с использованием (по желанию пользователя) экспрессивной лексики.
- **Memory**: Отказались от внешних MCP-навыков в пользу классического Memory Bank.
