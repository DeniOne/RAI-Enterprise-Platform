# System Patterns: RAI_EP

## Architectural Philosophy
RAI_EP следует философии **Canon-Driven Development**. Система строится как модульный монолит (или набор микросервисов в перспективе) вокруг универсального ядра.

## Key Patterns

### 1. Business Core Extraction (Class A, B, C)
- Разделение логики на универсальную (Ядро) и специфичную (Домен).
- Классификация по уровню универсальности согласно `BUSINESS_CORE_EXTRACTION_GUIDE.md`.

### 2. Registry-Driven Metadata
- Использование реестров для описания сущностей, ролей и прав.
- Динамическое построение интерфейсов и валидаций на основе метаданных из `BusinessCore`.

### 3. Reactive Event Model
- Взаимодействие компонентов через события.
- Аудит всех действий и изменений состояний.

### 4. FSM (Finite State Machine)
- Строгое управление жизненным циклом сущностей (задачи, заказы, состояния полей).
- Запрет на невалидные переходы между состояниями.

### 5. Multi-Interface Adapters
- Четкое разделение бизнес-логики и интерфейсов (Telegram, Web, API).
- Адаптерный слой обеспечивает трансляцию интентов в команды ядра.
### 6. Telegram 2FA Login Strategy
- Separation of concerns between Bot (notification/confirmation) and Backend (JWT generation).
- Asynchronous JWT registration (`registerAsync`) to ensure consistent secret loading.
- JWT payload standardization: `sub` (userId), `email`, `companyId`.
- Polling mechanism with session idempotency for mobile/web cross-device sync.

### 7. Consulting Control Plane (CMR)
- **Tripartite Liability**: Shared responsibility by default, shifting to `CLIENT_ONLY` upon SLA expiration (Silence as Event).
- **Immutable Decisions**: Strategic decisions are logged immutably with confidence scores.
- **Risk Segregation**: Risk events (`CmrRisk`) are distinct from deviations, allowing independent insurance logic.

### 8. Tech Map Orchestration
- **Service as Orchestrator**: `TechMapService` coordinates construction and validation (simulated "Controller" for business logic).
- **Domain Model over UI**: Tech Maps exist as structured domain entities (`MapStage`, `MapOperation`) rather than JSON blobs.
 
+### 9. Economy vs Finance Separation
+- **Economy (Truth)**: Immutable register of economic facts (`EconomicEvent`). Deterministic attribution via pure functions.
+- **Finance (Management)**: Tactical management of liquidity, budgets, and obligations. Uses Economy facts as a source of truth.
+- **Immutable Ledger Projection**: Ledger entries are derived, append-only facts. No direct mutation of financial history is allowed.
      
### 10. Global API Routing
- **Global Prefix**: All backend routes use `/api` prefix (configured in `main.ts`).
- **Frontend/Bot Alignment**: All clients (Web, Telegram Bot) must explicitly append `/api` to base URL.
- **Middleware**: Next.js middleware must respect the prefix when vetting protected routes.
### 11. Compliance Signaling (Legal AI)
- **Signal vs Block**: Правовой движок выдает сигналы (`COMPLIANT`, `AT_RISK`, `VIOLATED`), но не блокирует операционную деятельность напрямую. Блокировка — прерогатива Risk Engine.
- **Deep Legal Ontology**: Структурирование права через цепочку `Document -> Norm -> Requirement -> Obligation`. Это позволяет точечно связывать изменения в законах с конкретными бизнес-процессами.
- **Evidence-based Compliance**: Каждый статус комплаенса должен подкрепляться ссылкой на конкретное обязательство (`Obligation`) и его состояние.
+### 12. Front Canon (Beta)
+- **Front as Projection**: Фронт в фазе Beta — это только панель мониторинга "истины" (Read Model).
+- **Zero Command Power**: UI физически не имеет кнопок управления состояниями и не может обходить оркестраторы.
+- **Restricted Audience**: Фронт предназначен только для C-level и специалистов контроля (Risk/Legal/R&D).
+### 13. Canonical Consulting Navigation
- **Single Source of Truth**: Структура навигации определяется строго в `CONSULTING_NAVIGATION`.
- **Domain-Aware Hierarchy**: Группировка по доменам (Crop, Strategy, Economy, etc.) с рекурсивной вложенностью.
- **Visual Dominance**: Ядро системы ("Управление Урожаем") визуально доминирует над вспомогательными доменами.
- **Strict RBAC**: Пункты меню фильтруются по ролям. Пустые родительские категории скрываются автоматически.
+### 14. UX-Map Beta (Russian Interface)
+- **Signal-driven UX**: Навигация следует за аномалией (Constraint), а не за структурой данных.
+- **Russian Only**: Все названия интерфейса фронтенда Beta — строго на русском языке для исключения двусмысленности у ЛПР.
+- **Hierarchy of Awareness**: GSV (Обзор) -> Context (Погружение) -> Overlay (Детали). Максимальная глубина — 3 уровня.
### 15. Internal Secure Bridging (Bot Microservice)
- **Problem**: API Orchestrator needs to trigger notifications but shouldn't be coupled to a specific Telegraf instance or its process.
- **Solution**: Secure HTTP Bridge with `X-Internal-API-Key`.
- **Logic**: API calls a "Generic Internal Notify" endpoint on the bot microservice, keeping the API logic transport-agnostic.
