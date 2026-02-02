RAI_ENTERPRISE_PLATFORM/
│
├── 📘 00-STRATEGY/                          # Стратегия и видение (Why?)
│   │
│   ├── VISION_SCOPE.md                      # Декомпозиция вашего Генерального описания
│   ├── BUSINESS_MODEL.md                    # Как зарабатываем (LTV, монетизация)
│   ├── ROADMAP_PHASES.md                    # Детализация Alpha, Beta, Gamma, Delta
│   └── SUCCESS_METRICS.md                   # KPI для каждого этапа и модуля
│
├── 🏗️ 01-ARCHITECTURE/                      # АРХИТЕКТУРА (How? - высокий уровень)
│   │
│   ├── PRINCIPLES/                          # Принципы (у вас уже есть, переносим)
│   │   ├── ARCHITECTURAL_AXIOMS.md          # Аксиомы (из FOUNDATION)
│   │   ├── BOUNDARIES_OF_RESPONSIBILITY.md  # Границы (из FOUNDATION)
│   │   ├── FORBIDDEN.md                     # Запреты (из FOUNDATION)
│   │   └── CANON.md                         # Общий канон (из FOUNDATION)
│   │
│   ├── HLD/                                 # High-Level Design
│   │   ├── SYSTEM_CONTEXT_C4_L1.md          # C4 Уровень 1: Система в контексте
│   │   ├── CONTAINERS_C4_L2.md              # C4 Уровень 2: Контейнеры (схема модулей!)
│   │   ├── COMPONENTS_C4_L3.md              # C4 Уровень 3: Компоненты
│   │   ├── DATA_FLOW_GLOBAL.md              # Общая схема потоков данных
│   │   ├── EVENT_DRIVEN_ARCH.md             # Событийная модель (из техники)
│   │   └── INTEGRATION_MATRIX.md            # Матрица интеграций (кто с кем общается)
│   │
│   ├── CORE/                                # Business Core (10-ядро)
│   │   ├── CORE_CONCEPT.md                  # Назначение и философия
│   │   ├── CORE_SUBSYSTEMS/                 # Подсистемы Ядра
│   │   │   ├── IDENTITY_ACCESS.md
│   │   │   ├── TASK_WORKFLOW.md
│   │   │   ├── ECONOMY_TRANSACTION.md
│   │   │   ├── STRUCTURE_REGISTRY.md
│   │   │   └── AUDIT_EVENTS.md
│   │   ├── CORE_API.md                      # Public API Ядра
│   │   └── CORE_INTEGRATION_RULES.md        # Как домены используют Ядро
│   │
│   └── DECISIONS/                           # Архитектурные решения
│       ├── ADR_TEMPLATE.md
│       ├── ADR_001_MICROSERVICES_VS_MONOLITH.md
│       ├── ADR_002_EVENT_STORING_STRATEGY.md
│       └── ADR_*.md                         # По одному на каждое ключевое решение
│
├── 🌾 02-DOMAINS/                           # ПРИКЛАДНАЯ ЛОГИКА (What? - бизнес-домены)
│   │
│   ├── RAI_DOMAIN/                          # Агро-домен (20-домены → здесь)
│   │   ├── DOMAIN_OVERVIEW.md               # Обзор домена
│   │   ├── GLOSSARY.md                      # Единый глоссарий терминов
│   │   ├── ENTITIES/                        # Сущности (из RAI_СУЩНОСТИ.md)
│   │   │   ├── FIELD.md
│   │   │   ├── SEASON.md
│   │   │   ├── CROP.md
│   │   │   └── OPERATION.md
│   │   ├── PROCESSES/                       # Бизнес-процессы (из RAI_ПРОЦЕССЫ.md)
│   │   │   ├── SEASON_PLANNING.md
│   │   │   ├── FIELD_MONITORING.md
│   │   │   └── TASK_EXECUTION.md
│   │   ├── FSM/                             # Машины состояний
│   │   │   ├── FIELD_LIFECYCLE.md
│   │   │   └── TASK_LIFECYCLE.md
│   │   ├── POLICIES/                        # Бизнес-правила
│   │   │   ├── AI_ADVISORY_POLICY.md        # Политика ИИ (из RAI_ПОЛИТИКА_ИИ.md)
│   │   │   └── DECISION_MAKING_FLOW.md
│   │   └── SERVICES/                        # Сервисы домена
│   │       ├── AGRO_INTELLIGENCE_SERVICE.md
│   │       ├── SATELLITE_MONITORING_SERVICE.md
│   │       └── ECONOMIC_ENGINE_SERVICE.md
│   │
│   └── SUPPORT_DOMAINS/                     # Вспомогательные домены
│       ├── CRM_DOMAIN/                      # Клиенты, контракты, KPI
│       ├── HR_DOMAIN/                       # Кадры, компетенции, мотивация
│       └── FINANCE_DOMAIN/                  # Финансы, отчётность
│
├── 🎨 03-DESIGN/                            # ДИЗАЙН И ИНТЕРФЕЙСЫ
│   │
│   ├── UI_UX/                               # (UI_DESIGN_CANON.md → здесь)
│   │   ├── DESIGN_SYSTEM.md                 # Geist, стек, компоненты
│   │   ├── BRAND_BOOK.md                    # (Brand Canon RAI.md → здесь)
│   │   ├── GLASSMORPHISM_GUIDE.md
│   │   ├── ACCESSIBILITY.md
│   │   └── COMPONENT_LIBRARY/               # Спецификации компонентов
│   │       ├── FIELD_CARD.md
│   │       └── TASK_WIDGET.md
│   │
│   ├── TELEGRAM_BOT/                        # (30-интерфейсы/31-telegram → здесь)
│   │   ├── UX_CANON.md                      # (TELEGRAM_CANON.md)
│   │   ├── INTENT_MAP.md                    # (TELEGRAM_INTENT_MAP.md)
│   │   ├── SCENARIOS.md                     # (TELEGRAM_SCENАРИИ.md)
│   │   ├── LIMITATIONS.md                   # (TELEGRAM_ОГРАНИЧЕНИЯ.md)
│   │   └── FLOWS/                           # Диаграммы ключевых сценариев
│   │       ├── TASK_CREATION_FLOW.md
│   │       └── ALERT_FLOW.md
│   │
│   └── WEB_MOBILE/                          # Веб и мобильные интерфейсы
│       ├── INFORMATION_ARCHITECTURE.md      # Структура веб-приложения
│       ├── KEY_SCREENS.md                   // Скриншоты
│       └── NAVIGATION_FLOW.md
│
├── ⚙️ 04-ENGINEERING/                       # ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ (40-техника)
│   │
│   ├── API/                                 // API-контракты
│   │   ├── OPENAPI_SPEC/                    // OpenAPI 3.0 спецификации
│   │   │   ├── core-api.yaml
│   │   │   ├── rai-api.yaml
│   │   │   └── shared-schemas.yaml
│   │   └── API_GUIDELINES.md                // Стандарты разработки API
│   │
│   ├── DATABASE/                            // Модель данных
│   │   ├── ER_DIAGRAM.md                    // Полная ER-диаграмма
│   │   ├── SCHEMA_DOCUMENTATION/            // Документация по таблицам
│   │   │   ├── tables/
│   │   │   │   ├── fields.md
│   │   │   │   └── tasks.md
│   │   │   └── migrations/
│   │   └── DATA_MIGRATION_PLAN.md
│   │
│   ├── MICROSERVICES/                       // Детальное описание каждого сервиса
│   │   ├── SERVICE_TEMPLATE.md              // Шаблон
│   │   ├── identity-service/
│   │   ├── task-service/
│   │   └── agro-intelligence-service/
│   │
│   ├── ADAPTERS/                            // (АДАПТЕРНЫЙ_СЛОЙ.md → здесь)
│   │   ├── ADAPTER_PATTERN.md               // Шаблон адаптера
│   │   ├── EXTERNAL_SERVICES/               // Описания внешних интеграций
│   │   │   ├── SENTINEL_API_ADAPTER.md
│   │   │   ├── WEATHER_API_ADAPTER.md
│   │   │   └── BANK_API_ADAPTER.md
│   │   └── ADAPTER_DEVELOPMENT_GUIDE.md
│   │
│   └── INFRASTRUCTURE/                      // (45-инфраструктура → здесь)
│       ├── DEPLOYMENT_ARCH.md               // Схема развёртывания
│       ├── DOCKER_COMPOSE_SETUP.md
│       ├── KUBERNETES_SETUP/                // Для этапов Gamma/Delta
│       ├── MONITORING_LOGGING.md            // Prometheus, Grafana, ELK
│       └── BACKUP_DISASTER_RECOVERY.md
│
├── 📋 05-PROCESSES/                         // ПРОЦЕССЫ РАЗРАБОТКИ
│   │
│   ├── DEVELOPMENT_GUIDELINES/              // Стандарты кода
│   │   ├── BACKEND_CANON.md                 // (BUSINESS_CORE_CANON.md, RAI_CANON.md → здесь)
│   │   ├── FRONTEND_CANON.md
│   │   ├── AI_PROMPT_STANDARDS.md           // Стандарты для работы с ИИ-ассистентами
│   │   └── CODE_REVIEW_CHECKLIST.md
│   │
│   ├── WORKFLOWS/                           // Бизнес-процессы команды
│   │   ├── TICKET_LIFECYCLE.md              // Жизненный цикл задачи
│   │   ├── SPRINT_PLANNING_PROCESS.md
│   │   ├── ARCHITECTURE_REVIEW_PROCESS.md
│   │   └── DEPLOYMENT_PROCESS.md
│   │
│   ├── QUALITY/                             // Качество
│   │   ├── TEST_STRATEGY.md                 // Стратегия тестирования
│   │   ├── TEST_PLANS/                      // Планы тестирования по модулям
│   │   └── ACCEPTANCE_CRITERIA_TEMPLATE.md
│   │
│   └── DOCUMENTATION/                       // О документации
│       ├── DOC_STANDARDS.md                 // Как писать документы
│       ├── LIVING_DOCUMENTATION.md          // Как поддерживать актуальность
│       └── KNOWLEDGE_TRANSFER.md            // Как обучать новых членов команды
│
├── 🚀 06-IMPLEMENTATION/                    // ИМПЛЕМЕНТАЦИЯ ПО ЭТАПАМ
│   │
│   ├── PHASE_ALPHA/                         // ФУНДАМЕНТ
│   │   ├── SCOPE.md                         // Что входит в Alpha
│   │   ├── DELIVERABLES.md                  // Конкретные артефакты
│   │   ├── TECHNICAL_TASKS.md               // Детальные технические задачи
│   │   └── ACCEPTANCE_TESTS.md              // Критерии приёмки
│   │
│   ├── PHASE_BETA/                          // ПРОИЗВОДСТВЕННЫЙ ЦИКЛ
│   │   ├── SCOPE.md
│   │   └── DELIVERABLES.md
│   │
│   ├── PHASE_GAMMA/                         // ИНТЕЛЛЕКТ И МОНИТОРИНГ
│   │   ├── SCOPE.md
│   │   └── AI_ML_IMPLEMENTATION_PLAN.md     // Особый план для ИИ-модулей
│   │
│   └── PHASE_DELTA/                         // МАСШТАБИРОВАНИЕ
│       ├── SCALING_PLAN.md
│       └── PRODUCTION_READINESS_CHECKLIST.md
│
├── 🔬 07-RESEARCH_ARCHIVE/                  // ИССЛЕДОВАНИЯ И АРХИВ (90-исследования)
│   │
│   ├── IDEAS_BACKLOG.md                     // (IDEA.md → здесь)
│   ├── ACTIVE_RESEARCH/                     // Текущие исследования
│   │   ├── SATELLITE_DATA_PROCESSING.md
│   │   └── VOICE_INTERFACE_FEASIBILITY.md
│   └── ARCHIVE/                             // Устаревшие концепты
│       ├── DEPRECATED_DESIGNS/
│       └── HISTORICAL_DECISIONS/
│
└── 📄 README.md                             // Главная точка входа
    └── PROJECT_MAP.md                       // Карта проекта (что где искать)