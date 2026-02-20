---
id: DOC-ARH-GEN-169
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# План фиксации архитектуры AS-IS и Core Freeze

> [!IMPORTANT]
> Данный план составлен на основе задачи: **AS-IS Documentation + Core Freeze + Adapter Layer Design**.
> Принцип: **ПРАВ В КОДЕ**. Документация обновляется на основе реального состояния кода.
> **СТАТУС: ВЫПОЛНЕНО (2026-01-30)**

## Целевая директория
Все материалы размещены в `F:\Matrix_Gin\АНАЛИЗ MG\`.

## Часть 1. Полная документация MG AS-IS

### 1.1. ERD диаграмма базы данных
- [x] Чтение `schema.prisma`.
- [x] Выявление таблиц, ключей, связей.
- [x] Группировка по доменам (Auth, Employees, Tasks, Economy, University, Gamification, PSEE, System).
- [x] Генерация Mermaid диаграммы и сохранение в `erd/MG_ERD_AS_IS.md`.

### 1.2. API спецификация (OpenAPI)
- [x] Сканирование `backend/src/controllers` и `routes`.
- [x] Фиксация эндпоинтов (Method, URL, Auth, DTOs).
- [x] Группировка по модулям.
- [x] Генерация `api/openapi-as-is.yaml`.

### 1.3. Архитектурные диаграммы
- [x] Анализ структуры бэкенда (`backend/src`).
- [x] Создание `architecture/MG_ARCHITECTURE_AS_IS.md`:
    - [x] C4 Context + Container (Mermaid).
    - [x] Backend Modular View (Mermaid).
    - [x] Event Flow Diagram (Mermaid).

## Часть 2. Фиксация ядра MG (Core Freeze)

### 2.1. Auth / IAM Core
- [x] Анализ сервисов авторизации и гардов.
- [x] Фиксация в `core/AUTH_CORE_CANON.md`.

### 2.2. OFS (Organizational & Functional Structure)
- [x] Анализ структуры OrgUnit и иерархии.
- [x] Фиксация в `core/OFS_CORE_CANON.md`.

### 2.3. Task Engine
- [x] Анализ Task сервисов (статусы, назначения, дедлайны).
- [x] Фиксация в `core/TASK_ENGINE_CANON.md`.

### 2.4. PSEE сервис (Event-driven Core)
- [x] Анализ Event Store и FSM.
- [x] Фиксация в `core/PSEE_CORE_CANON.md`.

### 2.5. Итоговый документ
- [x] Сборка `core/MG_CORE_FREEZE.md`.

## Часть 3. Проектирование адаптерного слоя

### 3.1 - 3.4. Adapter Layer Design
- [x] Разработка концепции и интерфейсов адаптеров.
- [x] Создание схемы архитектуры адаптерного слоя.
- [x] Фиксация ограничений.
- [x] Документ: `adapters/ADAPTER_LAYER_ARCHITECTURE.md`.

