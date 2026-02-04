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
