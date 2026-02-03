# Active Context: RAI_EP (2026-01-31)

## Current Project State
Проект находится на этапе **Развертывания APL (Milestone 9)**.
- [2026-02-03] Enterprise Identity Layer Complete: Реализованы реестры холдингов и профилей сотрудников (Блок 3). Установлены архитектурные границы между орг-структурой и авторизацией.
- [2026-02-03] Memory Infrastructure Complete: Реализована гибридная память (Redis + pgvector). Создан пакет `@rai/vector-store`. Инфраструктура развернута через кастомный Dockerfile (PostgreSQL 16).
- **[2026-02-03] APL Lifecycle Integration Complete**: Реализованы 16 стадий жизни рапса. Интегрирован `AgroOrchestrator`. База данных поддерживает семантическую историю через `SeasonStageProgress`.
- **[2026-02-03] Field Service API Complete**: Реализован `FieldRegistryModule` с валидацией GeoJSON и строгой изоляцией тенянтов.
- **[2026-02-03] Database Environment Fixed**: Исправлен Dockerfile, пересобран образ `rai-postgres` с расширением `pgvector`. База синхронизирована (Prisma reset).

- **[2026-01-31] BusinessCore Neutralization**: Ядро очищено от брендинга RAI_EP.

## Active Decisions
- **Standardization**: Используем структуру документов с префиксами (00, 10, 20...) для строгого порядка.
- **Language**: Весь контент и коммуникация ведутся на русском языке с использованием (по желанию пользователя) экспрессивной лексики.
- **Memory**: Отказались от внешних MCP-навыков в пользу классического Memory Bank.
