# Active Context: RAI_EP (2026-01-31)

## Current Project State
Проект находится на этапе **Развертывания APL (Milestone 9)**.
- **[2026-02-03] APL Foundation Complete**: Реализован пакет `@rai/agro-orchestrator`. Оркестратор поддерживает Dry-Run, Rule Engine на базе `json-logic-js` верифицирует ограничения. Стадии зафиксированы через CanonicalStage interface.
- **[2026-02-01] Rapeseed Refactoring Complete**: Модуль Crop заменен на Rapeseed.
- **[2026-01-31] BusinessCore Neutralization**: Ядро очищено от брендинга RAI_EP.

## Active Decisions
- **Standardization**: Используем структуру документов с префиксами (00, 10, 20...) для строгого порядка.
- **Language**: Весь контент и коммуникация ведутся на русском языке с использованием (по желанию пользователя) экспрессивной лексики.
- **Memory**: Отказались от внешних MCP-навыков в пользу классического Memory Bank.
