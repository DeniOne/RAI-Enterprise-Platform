# MatrixGin Architecture (AS-IS)

> [!NOTE]
> Documented Status as of 2026-01-30.
> Reference: `backend/src` structure and `schema.prisma`.

## 1. C4 Context & Container Diagram

```mermaid
C4Context
    title MatrixGin System Context

    Person(user, "User", "Employee, Manager, or Admin")
    Person(telegram_user, "Telegram User", "Mobile interactions")

    System_Boundary(matrixgin, "MatrixGin Core") {
        Container(webapp, "Web Application", "React/Vite", "Main UI for dashboard and management")
        Container(bot, "Telegram Bot", "Telegraf/Node.js", "Mobile interface for daily tasks and notifications")
        Container(backend, "Backend API", "Node.js/Express", "Core business logic, REST API")
        ContainerDb(db, "Database", "PostgreSQL", "Main relational data store")
        ContainerDb(redis, "Redis", "Redis Cache", "Session and caching")
    }

    System_Ext(s3, "File Storage", "Local/S3", "Content and documents")

    Rel(user, webapp, "Uses", "HTTPS")
    Rel(telegram_user, bot, "Chats with", "Telegram Protocol")
    Rel(webapp, backend, "API Calls", "JSON/HTTPS")
    Rel(bot, backend, "Internal Calls", "Service Layer")
    Rel(backend, db, "Reads/Writes", "Prisma/SQL")
    Rel(backend, redis, "Caches", "TCP")
    Rel(backend, s3, "Stores files", "FS/S3 API")
```

## 2. Backend Modular Architecture

This diagram reflects the directory structure and logical separation in `backend/src`.

```mermaid
graph TD
    subgraph "Interface Layer"
        API[REST API (Controllers)]
        Bot[Telegram Bot Service]
    end

    subgraph "Core Domain Modules"
        Auth[01. Auth & IAM]
        Emp[02. Employee Management]
        Tasks[03. Task Engine]
        OFS[04. OFS (Org Structure)]
        PSEE[05. PSEE (Production)]
        Univ[06. Corporate University]
        Eco[08. Economy & MatrixCoin]
        Game[09. Gamification & Ranks]
        Reg[Registry Core]
    end

    subgraph "Infrastructure"
        Prisma[Prisma ORM]
        Redis[Redis Client]
        Audit[Audit Logger]
        Events[Event Dispatcher]
    end

    API --> Auth
    API --> Emp
    API --> Tasks
    API --> OFS
    API --> PSEE
    API --> Univ
    API --> Eco
    API --> Reg

    Bot --> Auth
    Bot --> Emp
    Bot --> Tasks
    Bot --> Univ
    
    Auth --> Prisma
    Emp --> Prisma
    Tasks --> Prisma
    
    PSEE --> Events
    Univ --> Events
    
    Events --> Eco : "Triggers Reward"
    Events --> Game : "Triggers XP/Rank"
```

## 3. Event Flow Diagram (Event-Driven Core)

Focuses on how actions flow through the system, specifically towards Economy and Analytics.

```mermaid
sequenceDiagram
    participant User
    participant Service as Domain Service (MES/LMS)
    participant EventStore as Event Dispatcher
    participant Economy as Economy Engine
    participant MatrixCoin as MatrixCoin Wallet
    participant Analytics

    User->>Service: Perform Action (e.g. Complete Shift / Finish Course)
    Service->>Service: Validate Logic
    Service->>EventStore: Emit Event (SHIFT_COMPLETED)
    
    par Async Processing
        EventStore->>Economy: Process Reward Rules
        Economy->>MatrixCoin: Credit MC/GMC
        Economy->>User: Notify (Reward Received)
    and Analytics Ingestion
        EventStore->>Analytics: Index for Dashboard
    end
```

## 4. Logical Constraints (AS-IS)

1. **Registry is King**: Logic validation relies on `RegistryEntity` state where applicable.
2. **Canonical Economy**: All writes to `Wallet` MUST go through `EconomyService` -> `Transaction` log. Direct DB edits are forbidden.
3. **Audit Trail**: All critical mutations trigger an `AuditLog` entry.
