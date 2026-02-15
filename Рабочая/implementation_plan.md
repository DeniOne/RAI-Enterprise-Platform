План реструктуризации документации RAI_EP (v2 - Enterprise Ready)
Цель
Трансформация документации из "хаотичного хранилища" в "Enterprise Documentation Framework" с жёсткой типологией и правилами зависимостей.

🏗 Новая архитектурная структура (PHASE 3)
text
docs/
├── 00_STRATEGY/          # (Why?)
│   ├── VISION/           # Миссия и долгосрочные цели
│   ├── ROADMAP/          # Фазы развития
│   └── ECONOMICS/        # Юнит-экономика и бизнес-модели
├── 01_ARCHITECTURE/      # (How? High-Level)
│   ├── PRINCIPLES/       # Аксиомы и Каноны
│   ├── HLD/              # Контейнеры, C4
│   ├── ADR/              # Решения (Architectural Decision Records)
│   └── TOPOLOGY/         # [NEW] Типология и правила документации
├── 02_DOMAINS/           # (What? Business Context)
│   ├── RAI_DOMAIN/       # Агро-логика
│   ├── CONSULTING_DOMAIN/# Логика консалтинга
│   ├── ENTERPRISE_DOMAIN/# Оргструктура, Холдинги
│   └── SHARED_KERNEL/    # Общие доменные сущности
├── 03_PRODUCT/           # (User Experience)
│   ├── UI/               # Паспорта экранов
│   ├── UX/               # Сценарии и флоу
│   └── BOT/              # Телеграм-специфичные доки
├── 04_ENGINEERING/       # (How? Implementation)
│   ├── CONTRACTS/        # API, OpenAPI, Events
│   ├── SERVICES/         # Описание микросервисов
│   ├── DATABASE/         # Schema, Migrations
│   ├── OBSERVABILITY/    # Метрики и логирование
│   └── INFRA/            # K8s, CI/CD, Docker
├── 05_OPERATIONS/        # (Runtime & Maintenance)
│   ├── RUNBOOKS/         # Инструкции по восстановлению
│   ├── INCIDENTS/        # Постмортемы
│   ├── REPORTS/          # Фактические отчеты (ADVISORY_*)
│   └── MONITORING/       # Dashboards & Alerts
├── 06_METRICS/           # (Analytics)
│   ├── BUSINESS/         # KPI продукта
│   └── TECHNICAL/        # Perf, Error rates
├── 07_EXECUTION/         # (Process Control)
│   ├── PHASES/           # Детальный Scope фаз
│   ├── WBS/              # Декомпозиция работ
│   └── SPRINTS/          # Спринт-логи
└── 08_ARCHIVE/           # Идеи и Legacy
📜 Documentation Governance (PHASE 2)
1. Doc Typology
Type	Layer	Allowed References (Depends On)
Vision	Strategy	Nothing below
Roadmap	Strategy	Architecture
ADR	Architecture	Architecture
HLD	Architecture	Domain
Domain Spec	Domain	Architecture
API Contract	Engineering	Domain
Runbook	Operations	Engineering
Report	Operations	Nothing (isolated)
Phase Plan	Execution	Architecture
Research	Archive	Nothing
2. Creation Policy (Mandatory Headers)
Каждый файл 
.md
 обязан начинаться с YAML фронтматера:

yaml
---
type: [Typology Type]
layer: [Strategy|Architecture|Domain|Engineering|Operations|Execution|Archive]
status: [Draft|Review|Approved|Legacy]
depends_on: [Path to parent doc]
allowed_refs: [Sub-layers or sibling layers]
---
3. Dependency Matrix (Layer Rules)
Запрещено нарушать поток зависимостей: Strategy → Architecture → Domains → Engineering → Operations

Execution: может ссылаться на любые слои выше (Strategy/Arch).
Archive: изолирован.
🚨 Проблемы к решению перед MOVE
Semantic Lint: Скрипт-валидатор, проверяющий allowed_refs и layer соответствие.
GOVERNANCE.md: Создание мастер-документа с правилами (в 01_ARCHITECTURE/TOPOLOGY/).
INDEX.md: Единая точка навигации, заменяющая хаос README.
План верификации (Усиленный)
Structure Validation: Проверка на отсутствие файлов вне канонических папок.
Layer Constraint Check: Парсинг всех ссылок и сопоставление их с layer в заголовке файла.
Typology Check: Каждый файл должен иметь корректный type из списка.