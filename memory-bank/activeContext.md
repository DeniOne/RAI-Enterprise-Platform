# Active Context: RAI_EP (2026-01-31)

## Current Project State
- **[2026-02-04] Telegram Auth Stability & UI Fix**: Исправлена инвалидность JWT токена (payload mismatch). Бот выделен в микросервис. UI страницы входа приведен к канону (светлая тема, стандартные компоненты).
- [2026-02-03] Database Unification Complete: Вся инфраструктура переведена на единый Docker Postgres (порт 5432).
- **[2026-02-03] Telegram Bot Integration Complete**: Реализована авторизация по ID и команды `/start`, `/mytasks`. Бот успешно работает с унифицированной базой данных.
- [2026-02-03] Sprint 4 Web Interface Complete: Реализован Next.js 14 веб-интерфейс с JWT аутентификацией, Dashboard, формой создания задач. E2E flow проверен и работает. Создан Auth Module в NestJS API.
- **[2026-02-03] Sprint 5a Architecture Debt Complete**: Внедрена мультитенентность (изоляция по `companyId`), реализован паттерн Repository для Auth, вычищено 33 ошибки линтинга в API.
- [2026-02-03] Enterprise Identity Layer Complete: Реализованы реестры холдингов и профилей сотрудников (Блок 3).

- **[2026-01-31] BusinessCore Neutralization**: Ядро очищено от брендинга RAI_EP.

## Active Decisions
- **Standardization**: Используем структуру документов с префиксами (00, 10, 20...) для строгого порядка.
- **Language**: Весь контент и коммуникация ведутся на русском языке с использованием (по желанию пользователя) экспрессивной лексики.
- **Memory**: Отказались от внешних MCP-навыков в пользу классического Memory Bank.
