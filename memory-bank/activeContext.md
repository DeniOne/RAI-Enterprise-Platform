# Active Context: RAI_EP (2026-01-31)

## Current Project State
Проект находится на этапе **Развертывания APL (Milestone 9)**.
- [2026-02-03] Enterprise Identity Layer Complete: Реализованы реестры холдингов и профилей сотрудников (Блок 3). Установлены архитектурные границы между орг-структурой и авторизацией.
- [2026-02-03] Memory Infrastructure Complete: Реализована гибридная память (Redis + pgvector). Создан пакет `@rai/vector-store`. Инфраструктура развернута через кастомный Dockerfile (PostgreSQL 16).
- [2026-02-03] APL Foundation Complete: Реализован пакет `@rai/agro-orchestrator`.
- **[2026-02-02] Field Service API Scaffolding**: Начата реализация API для работы с полями.

- **[2026-01-31] BusinessCore Neutralization**: Ядро очищено от брендинга RAI_EP.

## Active Decisions
- **Standardization**: Используем структуру документов с префиксами (00, 10, 20...) для строгого порядка.
- **Language**: Весь контент и коммуникация ведутся на русском языке с использованием (по желанию пользователя) экспрессивной лексики.
- **Memory**: Отказались от внешних MCP-навыков в пользу классического Memory Bank.
