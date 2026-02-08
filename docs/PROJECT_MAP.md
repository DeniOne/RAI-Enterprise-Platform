---
id: index-project-map
type: concept
status: approved
owners: [architects]
aligned_with: [principle-vision]
---

# Project Map — RAI Enterprise Platform 🗺️

# 🗺️ Карта проекта RAI Enterprise Platform

Навигация по всей документации проекта. Используйте CTRL+F для быстрого поиска.

---

## 📌 КРИТИЧЕСКИ ВАЖНЫЕ ДОКУМЕНТЫ (начать отсюда)

### 1. Для понимания проекта
| Документ | Назначение | Статус | Приоритет |
|----------|------------|--------|-----------|
| **[Генеральное описание](00-STRATEGY/GENERAL_DESCRIPTION.md)** | Исходное видение, миссия, цели | ✅ Канон | 🔴 Высокий |
| **[Vision & Scope](00-STRATEGY/VISION_SCOPE.md)** | Цели, границы, KPI, персонажи | ✅ Канон | 🔴 Высокий |
| **[Roadmap](00-STRATEGY/ROADMAP_PHASES.md)** | План развития по фазам (Alpha -> Delta) | ✅ Канон | 🔴 Высокий |
| **[Phase Alpha Scope](06-IMPLEMENTATION/PHASE_ALPHA/SCOPE.md)** | Что делаем в ближайшие 2-3 месяца | ✅ Актуально | 🔴 Критичный |

### 2. Архитектура и дизайн
| Документ | Назначение | Статус | Приоритет |
|----------|------------|--------|-----------|
| **[Контейнеры C4 L2](01-ARCHITECTURE/HLD/CONTAINERS_C4_L2.md)** | Схема всех сервисов и их взаимодействий | ✅ Канон | 🔴 Критичный |
| **[Архитектурные принципы](01-ARCHITECTURE/PRINCIPLES/)** | Аксиомы, запреты, каноны | ✅ Есть | 🟡 Средний |
| **[Business Core концепция](01-ARCHITECTURE/CORE/CORE_CONCEPT.md)** | Философия разделения Ядра и Домена | ✅ Канон | 🔴 Высокий |
| **[ADR Index](01-ARCHITECTURE/DECISIONS/index.md)** | Список всех архитектурных решений | ✅ Канон | 🟡 Средний |

---

## 📚 ПОЛНАЯ СТРУКТУРА

### 🎯 00-STRATEGY (СТРАТЕГИЯ)
**Ответ на вопрос "ЗАЧЕМ?"**
00-STRATEGY/
├── GENERAL_DESCRIPTION.md # Главное описание системы (исходник)
├── VISION_SCOPE.md # Видение и границы проекта
├── BUSINESS_MODEL.md # Как зарабатываем ← СОЗДАТЬ
├── ROADMAP_PHASES.md # Детальный план по фазам
└── SUCCESS_METRICS.md # KPI и метрики успеха

text

### 🏗️ 01-ARCHITECTURE (АРХИТЕКТУРА)
**Ответ на вопрос "КАК УСТРОЕНО?"**
01-ARCHITECTURE/
├── PRINCIPLES/ # Неизменяемые принципы
│ ├── ARCHITECTURAL_AXIOMS.md # Аксиомы
│ ├── BOUNDARIES_OF_RESPONSIBILITY.md # Границы ответственности
│ ├── FORBIDDEN.md # Категорические запреты
│ └── CANON.md # Общий архитектурный канон
│
├── HLD/ # High-Level Design
│ ├── CONTAINERS_C4_L2.md # Контейнеры/сервисы
│ ├── AI_ORCHESTRATION_HUB.md # ИИ-Оркестратор (Beta/Gamma)
│ ├── ENGRAM_MEMORY_SYSTEM.md # Когнитивная память (Phase Gamma)
│ └── EVENT_DRIVEN_ARCH.md # Событийная архитектура
│ └── INTEGRATION_MATRIX.md # Матрица интеграций ← СОЗДАТЬ
│
├── CORE/ # Business Core
│ ├── CORE_CONCEPT.md # Концепция ядра
│ ├── CORE_SUBSYSTEMS/ # Подсистемы ядра
│ │ ├── IDENTITY_ACCESS.md # IAM и Multi-tenancy
│ │ ├── TASK_WORKFLOW.md # Движок задач
│ │ ├── ECONOMY_TRANSACTION.md ← СОЗДАТЬ
│ │ ├── STRUCTURE_REGISTRY.md # Реестр и иерархия
│ │ ├── ROLE_MODEL.md # Роли и доступы
│ │ └── AUDIT_EVENTS.md # Подсистема аудита
│ ├── CORE_API.md # Public API ядра ← СОЗДАТЬ
│ └── ADMISSION_POLICY.md # Правила допуска
│
└── DECISIONS/ # Архитектурные решения (ADR)
    ├── index.md # Индекс всех ADR
    ├── ADR_TEMPLATE.md # Шаблон ← СОЗДАТЬ
    ├── ADR_001_MICROSERVICES_VS_MONOLITH.md ← СОЗДАТЬ
    ├── ADR_002_EVENT_STORING_STRATEGY.md ← СОЗДАТЬ
    └── ADR_001...ADR_005

### 🌾 02-DOMAINS (ДОМЕНЫ)
**Ответ на вопрос "ЧТО ДЕЛАЕМ?"**
02-DOMAINS/
├── RAI_DOMAIN/ # Агро-домен (основной)
│ ├── DOMAIN_OVERVIEW.md # Обзор миссии домена
│ ├── GLOSSARY.md # Глоссарий терминов ← СОЗДАТЬ
│ ├── ENTITIES/ # Сущности
│ │ ├── FIELD.md # Поля и геометрия
│ │ ├── SEASON.md # Сезоны и севооборот
│ │ ├── CROP.md # Культуры (Рапс)
│ │ └── OPERATION.md ← СОЗДАТЬ
│ ├── PROCESSES/ # Процессы
│ │ ├── SEASON_PLANNING.md # Планирование сезона
│ │ ├── FIELD_MONITORING.md ← СОЗДАТЬ
│ │ └── TASK_EXECUTION.md # Исполнение работ
│ ├── FSM/ # Машины состояний
│ │ ├── FIELD_LIFECYCLE.md ← СОЗДАТЬ
│ │ └── TASK_LIFECYCLE.md ← СОЗДАТЬ
│ ├── POLICIES/ # Бизнес-правила
│ │ ├── AI_ADVISORY_POLICY.md # Правила ИИ-советника
│ │ └── DECISION_MAKING_FLOW.md ← СОЗДАТЬ
│ └── SERVICES/ # Сервисы домена
│ ├── AGRO_INTELLIGENCE_SERVICE.md ← СОЗДАТЬ
│ ├── SATELLITE_MONITORING_SERVICE.md ← СОЗДАТЬ
│ └── ECONOMIC_ENGINE_SERVICE.md ← СОЗДАТЬ
│
└── SUPPORT_DOMAINS/ # Вспомогательные домены (Planned)
├── CRM_DOMAIN/ ← СОЗДАТЬ позже
├── HR_DOMAIN/ ← СОЗДАТЬ позже
└── FINANCE_DOMAIN/ ← СОЗДАТЬ позже

text

### 🛠️ 05-PROCESSES (ПРОЦЕССЫ)
05-PROCESSES/
??? WORKFLOWS/
? ??? GAMMA_INCIDENT_RUNBOOK.md # Runbook ?????????? Gamma
??? DEVELOPMENT_GUIDELINES/
  ??? AI_MODEL_GOVERNANCE.md # Governance ???????
└── DEVELOPMENT_GUIDELINES/
    ├── BUSINESS_CORE_CANON.md # Как расширять ядро
    ├── RAI_CANON.md # Как писать агро-логику
    └── KNOWLEDGE_FABRIC_UI.md # Спецификация UI знаний

*[Продолжение для 03-07 опускаю для краткости, но в реальном файле будет полная структура]*

---

## 🚀 ПЛАН НАПОЛНЕНИЯ (ПРИОРИТЕТЫ)

### Фаза 1: КРИТИЧНО ДЛЯ СТАРТА РАЗРАБОТКИ (неделя 1)
1. **VISION_SCOPE.md** - детализация целей и границ
2. **CONTAINERS_C4_L2.md** - схема сервисов
3. **Phase Alpha SCOPE.md** - конкретные задачи
4. **API спецификации** - контракты для разработки

### Фаза 2: ФУНДАМЕНТ (неделя 2)
1. **Business Core документы** - как работает ядро
2. **RAI Domain документы** - агро-логика
3. **Телеграм бот спецификации** - интерфейсы

3. **UI/UX спецификации**
4. **[Knowledge Fabric UI](03-DESIGN/KNOWLEDGE_FABRIC_UI.md)** - Graph & Logic UI

---

## 🔄 СТАТУС ДОКУМЕНТОВ

| Статус | Значение | Цвет |
|--------|----------|------|
| ✅ | Существует и актуален | Зеленый |
| 🚧 | В процессе создания/обновления | Желтый |
| ⚠️ | Нужно создать | Оранжевый |
| 🔴 | Критически важно создать | Красный |
| 💤 | Запланировано на будущее | Синий |

---

## 📞 КОМУ ПОКАЗАТЬ

- **Инвестору/Руководству:** `00-STRATEGY/GENERAL_DESCRIPTION.md`
- **Техническому директору:** `01-ARCHITECTURE/HLD/CONTAINERS_C4_L2.md`
- **Разработчику бэкенда:** `04-ENGINEERING/API/` + `01-ARCHITECTURE/CORE/`
- **Фронтенд-разработчику:** `03-DESIGN/UI_UX/` + `04-ENGINEERING/API/`
- **Тестировщику:** `05-PROCESSES/QUALITY/`

---

│ └── memory-bank/             # Memory Bank проекта
├── packages/                  # Shared packages (Lerna/Turborepo)
│ ├── agro-orchestrator/       # Движок бизнес-процессов
│ ├── prisma-client/           # Shared Prisma client
│ └── vector-store/            # Работа с векторной памятью
├── apps/
│ └── api/                     # Backend API (NestJS)
└── infra/                     # Infrastructure configuration (Docker, etc)
*Последнее обновление: 2026.02.02*