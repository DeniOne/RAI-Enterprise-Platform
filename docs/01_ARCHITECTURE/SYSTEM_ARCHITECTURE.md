---
id: DOC-ARC-GEN-056
type: HLD
layer: Architecture
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# Технологическая схема и архитектура системы RAI Enterprise Platform

> **Версия:** 2.0 (Enterprise Scope) | **Обновлено:** 2026.02.03

## 1. Обзор архитектуры (C4 Container Diagram)

Система разделена на **Два Контура**:
1.  **Back-Office (Enterprise):** Управление бизнесом (Стратегия, Кадры, Финансы).
2.  **Front-Office (Field):** Управление производством (Агрономия, Техника, Поле).

```mermaid
graph TD
    %% Пользователи
    UserCEO["🤵 CEO / CFO"]
    UserHR["👩‍💼 HR Director"]
    UserFarmer["👨‍🌾 Агроном / Механизатор"]
    UserPartner["🤝 Клиент / Партнер"]

    %% Клиентский слой
    subgraph Clients ["Client Interfaces"]
        WebAdmin["🏢 Enterprise ERP Web<br/>(React, AntDesign)"]
        WebField["🚜 Field Dashboard<br/>(React, Mapbox)"]
        TgBot["🤖 Agro Bot<br/>(Telegram Mini App)"]
    end

    %% API Gateway
    ApiGateway["🔌 API Gateway<br/>(NestJS / GraphQL)"]

    %% AI Orchestration Hub
    subgraph AILayer ["🤖 AI Orchestration Hub"]
        AiRouter["🚦 Intent Router"]
        AiSolvers["🧠 Specialized Solvers<br/>(Agro, Legal, HR, Finance)"]
    end

    %% CONTOUR 1: Back-Office (Enterprise)
    subgraph BackOffice ["🏢 Contour 1: Enterprise Management"]
        CrmModule["CRM & Scoring"]
        HrModule["HR & Talent"]
        FinModule["Finance & Treasury"]
        GrModule["GR & Reporting"]
        LegalModule["Legal & Compliance"]
    end

    %% CONTOUR 2: Front-Office (Field Management)
    subgraph FrontOffice ["🚜 Contour 2: Field Management"]
        subgraph ProcessLayer ["🎼 Agro Process Layer (APL)"]
            Orchestrator["Process Orchestrator"]
            RuleEngine["Hard Rules Engine"]
        end
        
        subgraph DomainLayer ["🌾 Domain Services"]
            FieldSvc["Field & Crop"]
            MachinerySvc["Machinery & Fleet"]
            SupplySvc["Warehouse & Supply"]
        end
    end

    %% Unified Memory Architecture
    subgraph MemoryLayer ["🧠 Unified Memory Architecture"]
        WorkingMem["🔥 Redis (Context)"]
        SemanticMem["🕸️ Knowledge Graph"]
        EpisodicMem["⚡ Vectors (Experience)"]
    end

    %% Основные потоки
    UserCEO --> WebAdmin
    UserHR --> WebAdmin
    UserFarmer --> TgBot & WebField

    WebAdmin --> ApiGateway
    WebField --> ApiGateway
    TgBot --> ApiGateway

    ApiGateway --> AiRouter
    AiRouter --> AiSolvers
    
    %% AI взаимодействие
    AiSolvers --> BackOffice
    AiSolvers --> FrontOffice
    AiSolvers --> MemoryLayer

    %% Связи контуров
    BackOffice -.->|Budget & Plan| FrontOffice
    FrontOffice -.->|Fact & Costs| BackOffice
    
    %% Стилизация
    style BackOffice fill:#e3f2fd,stroke:#1565c0
    style FrontOffice fill:#e8f5e9,stroke:#2e7d32
    style MemoryLayer fill:#f3e5f5,stroke:#7b1fa2
    style AILayer fill:#fff3e0,stroke:#ef6c00
```

---

## 2. Модули системы (Детализация)

### 🏢 Contour 1: Enterprise Management (Back-Office)
*"Мозг бизнеса"*
1.  **CRM & Scoring:**
    *   Скоринг потенциала хозяйств (LTV Prediction).
    *   Smart-контракты (мониторинг KPI в реальном времени).
2.  **HR Ecosystem:**
    *   **Talent:** Рекрутинг узких специалистов.
    *   **Pulse:** Эмоциональная аналитика и предотвращение выгорания.
    *   **OKR:** Мотивация за результат.
3.  **Finance & Economy:**
    *   **What-if Simulation:** Просчет ROI до старта работ.
    *   **Treasury:** Управление ликвидностью и бюджетом.
4.  **GR (Gov Relations):**
    *   Авто-отчетность (Налоги, Субсидии, Статистика).
5.  **Legal Tech:**
    *   Генерация договоров, проверка контрагентов (API GigaLegal/Sber).

### 🚜 Contour 2: Field Management (Front-Office)
*"Руки бизнеса"*
1.  **Agro Process Layer (APL):**
    *   16 этапов выращивания (Canonical Graph).
    *   Hard Constraints (Блокировка ошибок).
2.  **Digital Agronomist:**
    *   AI-ассистент (Vision AI, Voice Input).
    *   Geo/Photo Validation задач.
3.  **Operations:**
    *   Склад (Just-in-Time supply).
    *   Техника (Fleet management).
4.  **Satellites:**
    *   NDVI/NDRE мониторинг.

### 🧠 Unified Memory (Cognitive Core)
*   **Semantic:** Граф знаний (Агрономия + Бизнес-правила).
*   **Episodic:** Векторная база ("Успешные и провальные кейсы").
*   **Procedural:** Скрипты и регламенты.

---

## 3. Технологический Стек

*   **Backend:** NestJS (Node.js), Microservices (gRPC/NATS).
*   **AI:** OpenAI (GPT-4), Local LLM (Fine-tuned), CV Models.
*   **Database:** PostgreSQL (Core), ClickHouse (Analytics), Redis (Cache).
*   **Memory:** pgvector (Vectors), Neo4j/Memgraph (Graph).
*   **Frontend:** React, Next.js, AntDesign (Enterprise UI).
*   **Mobile:** Telegram Mini Apps (Field usage).
*   **External API:** GigaChat/Legal, Sentinels (Satellites), Meteteo.
