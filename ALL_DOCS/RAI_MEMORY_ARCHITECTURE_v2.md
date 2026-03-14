---
id: DOC-EXE-MEMORY-SYSTEM-RAI-MEMORY-ARCHITECTURE-V2-1XQV
layer: Execution
type: Phase Plan
status: draft
version: 2.0.0
owners: [@techlead]
last_updated: 2026-03-10
supersedes: MEMORY_CANON.md (S5.2)
aligned_with: [principle-canon, principle-security-canon, MEMORY_CANON]
tags: [architecture, memory, engrams, cognitive, strategic, mandatory]
---
# 🧠 RAI MEMORY ARCHITECTURE v2 — Когнитивная Система Памяти

> **«РАИ — консалтинговая компания, которая помнит каждое посеянное зерно,
> каждый урожай, каждую ошибку и каждый успех своих клиентов —
> не конкурирует. Она ДОМИНИРУЕТ.»**
>
> — Стратегическое обоснование архитектуры

---

## 0. Проблема и мотивация

### Почему текущая память недостаточна

Текущая реализация памяти RAI_EP представляет собой **базовый трёхуровневый хранилище** (S/M/L Tiers), которое:

| Есть | Нет |
|---|---|
| Сохраняет сырые взаимодействия (S-Tier) | Не формирует эпизоды из опыта |
| Vector search по эмбеддингам (M-Tier) | Не имеет весов, ассоциаций, контекстных связей |
| Profile K/V store (L-Tier) | Не анализирует тренды и паттерны |
| Примитивная разметка POSITIVE/NEGATIVE | Не формирует knowledge из данных |
| Redis для session context | Не имеет реактивного кеша для горячих данных |
| Изоляция по companyId | Не делает кросс-клиентское обучение |

**Критическая проблема**: система пишет данные, но **не учится**. Это как библиотека без библиотекаря — книги стоят на полках, но никто не знает, где что искать и что из прочитанного работает.

### Стратегическая ценность памяти для RAI

```
УРОВЕНЬ 0: AI без памяти = ChatGPT wrapper
    ↓ (мы сейчас ≈ тут)
УРОВЕНЬ 1: AI с хранилищем = может вспомнить чат
    ↓
УРОВЕНЬ 2: AI с эпизодической памятью = помнит кейсы
    ↓
УРОВЕНЬ 3: AI с когнитивной памятью = учится на опыте
    ↓
УРОВЕНЬ 4: AI с институциональной памятью = формирует знания
    ↓
УРОВЕНЬ 5: AI с сетевой памятью = умнеет от каждого клиента
    ↓ (целевой)
УРОВЕНЬ 6: AI как когнитивный оператор = генерирует trust score
```

---

## 1. Философия: 6 слоёв когнитивной памяти

Архитектура памяти RAI вдохновлена когнитивной наукой и modern AI agent memory systems (MemGPT/Letta, Mem0, CrewAI), но адаптирована под специфику сельскохозяйственного enterprise с его сезонностью, пространственной привязкой и мульти-тенантной структурой.

```text
┌──────────────────────────────────────────────────────────────┐
│                    RAI COGNITIVE MEMORY                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ L6: NETWORK MEMORY (Hive Mind)                         │  │
│  │     Кросс-партнёрские анонимизированные инсайты        │  │
│  │     Сетевой эффект, Trust Score для банков              │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ L5: INSTITUTIONAL MEMORY (Knowledge Factory)           │  │
│  │     Институциональные знания, обобщённые принципы      │  │
│  │     Агрономические правила, лучшие практики            │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ L4: PROCEDURAL MEMORY (Engrams)                        │  │
│  │     Pattern→Action→Outcome, самоусиление               │  │
│  │     Synaptic Network, когнитивная абстракция            │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ L3: SEMANTIC MEMORY (Knowledge Graph)                  │  │
│  │     Факты, отношения, онтология домена                 │  │
│  │     культура↔болезнь↔препарат↔дозировка                │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ L2: EPISODIC MEMORY (Consolidated Episodes)            │  │
│  │     Сжатые кейсы: «Поле X, сезон Y, результат Z»      │  │
│  │     Vector search + metadata filtering                 │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ L1: REACTIVE MEMORY (Hot Cache + Working Memory)       │  │
│  │     Redis: session, context, active alerts             │  │
│  │     Sub-ms latency, volatile, TTL-driven               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ CROSS-CUTTING: Provenance · Audit · Tenant Isolation   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. L1: Reactive Memory (Hot Cache + Working Memory)

**Аналог**: рабочая память человека — то, что «в голове прямо сейчас».

### Назначение
- Мгновенный доступ к контексту текущей сессии.
- Хранение активных алертов и состояний FSM.
- Кеш горячих энграмм (часто используемых).
- Working memory агента (текущая задача, tool results).

### Технический стек
- **Хранилище**: Redis (уже есть через `ContextService`).
- **Latency**: < 1ms.
- **TTL**: 1 час (session) / 15 мин (tool context) / 5 мин (alert cache).
- **Capacity**: ~100 KB на сессию.

### Структура данных

```typescript
// Расширение ContextService для Working Memory
interface WorkingMemorySlot {
  sessionId: string;
  agentRole: string;         // какой агент активен
  currentTask: string;       // что делаем прямо сейчас
  activeContext: {
    fieldId?: string;        // текущее поле
    cropZoneId?: string;     // зона посева
    techMapId?: string;      // техкарта
    bbchStage?: string;      // фаза развития
  };
  recentToolResults: Array<{
    toolName: string;
    result: unknown;
    timestamp: Date;
  }>;
  activeAlerts: Array<{
    id: string;
    severity: string;
    enrichment?: string;     // мини-тип от chief_agronomist
  }>;
  hotEngrams: string[];      // IDs часто используемых энграмм
  ttl: number;
}

// Кеш горячих энграмм (L4 → L1 promotion)
interface HotEngramCache {
  engramId: string;
  compositeScore: number;
  pattern: EngramPattern;
  activationCount: number;
  lastActivatedAt: Date;
  ttl: number;               // авто-expire если не используется
}
```

### Расширение текущего `ContextService`

| Текущее | Расширение |
|---|---|
| `setContext / getContext` (generic K/V) | `setWorkingMemory / getWorkingMemory` (typed) |
| Нет alert cache | `setActiveAlerts / getActiveAlerts` |
| Нет hot engram cache | `promoteEngram / getHotEngrams` |
| Нет multi-key scan | `scanSessionKeys` по паттерну |

### Реактивный контур

```text
Событие (alert / user message / tool result)
    │
    ▼
Redis Working Memory обновляется (< 1ms)
    │
    ├── Если alert → check hot engrams → enrich
    ├── Если user message → load session context → inject
    └── Если tool result → update working memory → continue
```

---

## 3. L2: Episodic Memory (Episodes)

**Аналог**: автобиографическая память — «я помню, что было».

### Назначение
- Хранение консолидированных эпизодов из S-Tier.
- Семантический поиск прошлых решений и кейсов.
- Контекстная продолжительность через сессии.
- Персонализация взаимодействий.

### Текущее состояние
- `MemoryEpisode` (Prisma) — есть, работает.
- `EpisodicRetrievalService` — есть, vector search.
- Проблема: **нет консолидации** (S→M автоперелив отсутствует).
- Проблема: **нет структурированных кейсов** (просто текст).

### Расширение: Structured Episode Schema

```typescript
// Расширение attrs для MemoryEpisode
interface EpisodeAttrs {
  schemaKey: 'memory.episode.v2';
  provenance: 'user-chat' | 'agent-action' | 'system-event' | 'external-signal';
  confidence: number;
  
  // Структурированный кейс
  episodeType: 'CONVERSATION' | 'DECISION' | 'DEVIATION' | 'HARVEST' | 'ALERT_RESPONSE';
  
  // Агрономический контекст (если применимо)
  agroContext?: {
    fieldId?: string;
    cropType?: string;
    season?: string;
    bbchStage?: string;
    soilType?: string;
    region?: string;
  };
  
  // Результат
  outcome?: {
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'UNKNOWN';
    metrics?: Record<string, number>;  // yield, cost, time
    description?: string;
  };
  
  // Связи
  relatedEpisodeIds?: string[];
  relatedEngramIds?: string[];
  
  // Temporal
  seasonId?: string;
  weekOfYear?: number;
}
```

### Consolidation Pipeline (S→M)

```text
MemoryInteraction (S-Tier, сырые логи)
    │
    │  [ConsolidationWorker — background cron, каждые 6 часов]
    │
    ├── Группировка по sessionId + time window
    ├── Суммаризация (LLM или rule-based)
    ├── Извлечение key facts и decisions
    ├── Классификация episodeType
    ├── Enrichment: agroContext из metadata
    │
    ▼
MemoryEpisode (M-Tier, структурированный)
    │
    │  [S-Tier Pruning — ежедневно]
    │
    └── Удаление S-Tier записей старше N дней (retention policy)
```

---

## 4. L3: Semantic Memory (Knowledge Graph)

**Аналог**: энциклопедическая память — «я знаю, что рапс поражается склеротиниозом при влажности >75%».

### Назначение
- Структурированные факты и отношения домена.
- Онтология: культура↔болезнь↔препарат↔дозировка↔эффективность.
- Grounding для LLM (снижение галлюцинаций).
- Shared knowledge base для всех агентов.

### Архитектурное решение

**Не торопимся с Graph DB**. На текущем этапе — JSON-LD semantic triples в PostgreSQL JSONB, с индексацией через GIN-индексы. Graph DB (Memgraph/Neo4j) — опциональный апгрейд при росте графа > 100K узлов.

```typescript
// Prisma model (будущая)
model SemanticFact {
  id         String   @id @default(uuid())
  companyId  String?  // null = глобальный факт
  
  // Semantic triple: Subject → Predicate → Object
  subject    String   // "Прозаро"
  predicate  String   // "effective_against"
  object     String   // "склеротиниоз"
  
  // Метаданные
  domain     String   // "phytopathology", "nutrition", "agronomy"
  confidence Float    // 0.0 - 1.0
  source     String   // "research", "engram", "expert", "marketing-feed"
  
  // Контекст
  conditions Json?    // { "bbch": "30-32", "humidity": ">75%" }
  validFrom  DateTime?
  validUntil DateTime?
  
  // Embedding для hybrid search
  embedding  Unsupported("vector(1536)")?
  
  attrs      Json     @default("{}")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Примеры семантических фактов

```json
[
  {
    "subject": "Прозаро",
    "predicate": "contains_active",
    "object": "тебуконазол + протиоконазол",
    "domain": "chemistry",
    "confidence": 1.0,
    "source": "registration"
  },
  {
    "subject": "склеротиниоз",
    "predicate": "develops_at",
    "object": "влажность > 75%",
    "domain": "phytopathology",
    "confidence": 0.92,
    "source": "research"
  },
  {
    "subject": "озимый_рапс_BBCH_31",
    "predicate": "critical_window_for",
    "object": "фунгицидная_обработка_против_склеротиниоза",
    "domain": "agronomy",
    "confidence": 0.88,
    "source": "engram_aggregate"
  }
]
```

### Semantic Query Engine

```text
Запрос: "Чем обработать рапс от склеротиниоза на BBCH-31?"
    │
    ├── Vector search по эмбеддингу запроса
    ├── Graph traversal: рапс → болезни → склеротиниоз → препараты
    ├── Filter: conditions.bbch includes "31"
    ├── Rank: by confidence + source reliability
    │
    ▼
Результат:
    Прозаро (confidence: 0.94, source: 47 engrams)
    Фоликур (confidence: 0.82, source: 23 engrams)
    Колосаль ПРО (confidence: 0.87, source: 12 engrams)
```

---

## 5. L4: Procedural Memory (Engrams)

**Аналог**: мышечная память — «я знаю, КАК это делать, потому что делал 47 раз».

### Назначение
- Хранение паттернов: Trigger → Action → Outcome.
- Самоусиление при повторном подтверждении (правило Хебба).
- Синаптические связи между энграммами.
- Когнитивная абстракция (от конкретного случая к принципу).

### Prisma Model

```typescript
model Engram {
  id               String   @id @default(uuid())
  companyId        String?  // null = глобальная энграмма (network memory)
  
  // Классификация
  type             String   // AGRO | BUSINESS | CLIENT | SYSTEM
  category         String   // DISEASE_TREATMENT | NUTRITION | SOWING | ...
  
  // Ядро: Pattern → Action → Outcome
  triggerConditions Json     // { crop, stage, disease, weather, soil }
  actionTemplate   Json     // { type, steps, parameters, dosage }
  expectedOutcome  Json     // { metrics, thresholds, validation_period }
  
  // Когнитивные метрики
  synapticWeight   Float    @default(0.5)   // сила (0-1)
  activationCount  Int      @default(1)     // сколько раз активирована
  successRate      Float    @default(0.5)   // доля успешных
  successCount     Int      @default(0)
  failureCount     Int      @default(0)
  
  // Когнитивный уровень
  cognitiveLevel   Int      @default(1)     // 1=конкретный, 5=принцип
  generalizability Float    @default(0.3)   // насколько обобщается
  volatility       Float    @default(0.5)   // как быстро устаревает
  
  // Синаптические связи
  associations     Json     @default("[]")  // [{engramId, strength, type}]
  
  // Ключевые инсайты (compressed)
  keyInsights      String[] @default([])
  
  // Embedding для vector search
  embedding        Unsupported("vector(1536)")?
  
  // Temporal
  isActive         Boolean  @default(true)
  lastActivatedAt  DateTime?
  firstFormedAt    DateTime @default(now())
  
  // Связи
  fieldId          String?
  cropZoneId       String?
  
  attrs            Json     @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@index([companyId, type])
  @@index([companyId, category])
  @@index([type, category, isActive])
}
```

### Engram Lifecycle API

```typescript
interface EngramService {
  // Formation: создание новой энграммы из кейса
  formEngram(caseStudy: EngramCaseStudy): Promise<Engram>;
  
  // Strengthening: усиление при повторном подтверждении (Хебб)
  strengthenEngram(id: string, evidence: Evidence): Promise<void>;
  
  // Weakening: ослабление при неудаче
  weakenEngram(id: string, failureEvidence: Evidence): Promise<void>;
  
  // Recall: поиск релевантных энграмм по контексту
  recallEngrams(context: EngramRecallContext): Promise<RankedEngram[]>;
  
  // Association: создание связи между энграммами
  associateEngrams(sourceId: string, targetId: string, type: AssociationType): Promise<void>;
  
  // Abstraction: повышение когнитивного уровня
  abstractEngram(id: string): Promise<void>;
  
  // Pruning: деактивация слабых/устаревших
  pruneEngrams(threshold: PruneThreshold): Promise<number>;
}

// Composite Score для ранжирования
function calculateCompositeScore(engram: Engram, similarity: number): number {
  return (
    engram.synapticWeight * 0.4 +
    engram.successRate * 0.3 +
    similarity * 0.3
  );
}

// Правило Хебба: усиление
function hebbianStrengthening(currentWeight: number): number {
  return currentWeight + 0.1 * (1 - currentWeight);
  // 0.5 → 0.55 → 0.595 → 0.636 → ... → 1.0 (асимптотически)
}

// Ослабление при неудаче
function weakenWeight(currentWeight: number): number {
  const newWeight = currentWeight * 0.7;
  return newWeight < 0.1 ? 0 : newWeight;  // деактивация при score < 0.1
}
```

### Категории агро-энграмм

| Category | Trigger | Action | Outcome |
|---|---|---|---|
| `DISEASE_TREATMENT` | culture + stage + disease + severity | fungicide + dose + timing | disease stopped, yield preserved |
| `PEST_CONTROL` | culture + stage + pest + threshold | insecticide + dose + method | pest below threshold |
| `NUTRITION` | culture + stage + soil test | fertilizer + dose + timing | target nutrient level |
| `SOWING` | culture + soil + date + weather | seed rate + depth + speed | target stand density |
| `HARVEST` | culture + moisture + maturity | combine settings + timing | minimal losses |
| `WEATHER_RESPONSE` | frost/drought/flood + stage | emergency action | damage minimized |
| `DEVIATION_OUTCOME` | planned vs actual + days delay | corrective action | actual vs expected result |

---

## 6. L5: Institutional Memory (Knowledge Factory)

**Аналог**: корпоративная мудрость — «в компании так принято, потому что это работает».

### Назначение
- Обобщённые принципы, извлечённые из множества энграмм.
- Лучшие практики (best practices) по региону/культуре.
- Клиентские профили и предпочтения (L-Tier расширенный).
- Правила и политики (business rules).
- Accumulated wisdom: «за 3 сезона, 47 000 га мы узнали, что...»

### Хранение

Расширение текущего `MemoryProfile`:

```typescript
// Расширение L-Tier: от простого K/V к Knowledge Factory
interface InstitutionalKnowledge {
  // Client Profile (расширенный)
  clientProfile: {
    preferences: Record<string, unknown>;
    communicationStyle: string;
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
    decisionSpeed: 'FAST' | 'DELIBERATE';
    historyOfInteractions: number;
  };
  
  // Regional Best Practices
  regionalPractices: Array<{
    region: string;
    culture: string;
    practice: string;
    confidence: number;
    basedOnEngrams: number;
    lastVerified: Date;
  }>;
  
  // Generalized Principles (из абстрагированных энграмм)
  principles: Array<{
    principle: string;
    domain: string;
    confidence: number;
    exceptions: string[];
    derivedFrom: string[];  // engram IDs
  }>;
  
  // Business Rules
  businessRules: Array<{
    rule: string;
    priority: number;
    scope: string;
    createdAt: Date;
  }>;
}
```

### Генерация институциональных знаний

```text
Энграммы (L4) с cognitiveLevel >= 4 и successRate > 0.9
    │
    │  [InstitutionalKnowledgeWorker — еженедельный batch]
    │
    ├── Кластеризация по category + region + culture
    ├── Извлечение общих паттернов (generalization)
    ├── Формулировка принципов на естественном языке
    ├── Валидация: не противоречит ли существующим принципам
    │
    ▼
Institutional Knowledge:
    "В ЦФО на суглинистых почвах превентивная фунгицидная
     обработка озимого рапса на BBCH-30-32 при влажности >70%
     сохраняет >95% урожая. (Основано на 147 энграммах за 3 сезона,
     confidence: 0.93)"
```

---

## 7. L6: Network Memory (Hive Mind)

**Аналог**: коллективный разум — «мы все учимся друг у друга».

### Назначение
- Кросс-партнёрские анонимизированные инсайты.
- Сетевой эффект: больше партнёров → умнее система.
- Engram-Backed Trust Score для банков и страховых.
- Benchmark-данные: «ваша урожайность vs средняя по сети RAI».

### Правила анонимизации

```text
Энграмма партнёра #123:
    companyId: "company_123"
    field: "Поле Южное"
    yield: 42 ц/га
    
        │
        │  [NetworkAnonymizer]
        │
        ▼
        
Сетевая энграмма:
    companyId: null (глобальная)
    region: "ЦФО"          (обобщение)
    soilType: "суглинок"   (обобщение)
    yieldRange: "40-45"    (диапазон, не точное значение)
    engramCount: 1         (increment)
```

### Trust Score API

```typescript
interface TrustScore {
  techMapId: string;
  
  // Сколько энграмм подкрепляют техкарту
  totalEngrams: number;
  positiveEngrams: number;
  
  // Агрегированные метрики
  aggregateScore: number;           // 0-1
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  
  // Доказательная база
  evidenceBase: {
    seasons: number;
    partners: number;
    totalHectares: number;
  };
  
  // Сравнение с benchmark
  benchmarkComparison: {
    networkAvgYield: number;
    techMapExpectedYield: number;
    percentile: number;            // в каком перцентиле эта техкарта
  };
}
```

---

## 8. Cross-Cutting Concerns

### 8.1 Provenance (Происхождение)

Каждая единица памяти имеет трассируемое происхождение:

```typescript
interface MemoryProvenance {
  source: 'user-chat' | 'agent-action' | 'system-event' | 'external-signal' | 'marketing-feed' | 'engram-formation' | 'consolidation';
  createdBy: string;     // agentId или userId
  traceId: string;       // для аудита
  confidence: number;    // 0-1
  evidenceChain: string[];  // цепочка доказательств
}
```

### 8.2 Tenant Isolation

- **L1-L5**: строгая изоляция по `companyId` (без изменений).
- **L6**: анонимизированные данные с `companyId = null`.
- Правило: **НИКАКАЯ** операция чтения не может вернуть данные чужого тенанта.
- Исключение: `L6 Network Memory` с `companyId = null` доступна всем.
- Audit trail для ВСЕХ cross-tenant aggregations.

### 8.3 Memory Lifecycle Management

```text
ФОРМИРОВАНИЕ → КОНСОЛИДАЦИЯ → АБСТРАКЦИЯ → УСТАРЕВАНИЕ → АРХИВ/УДАЛЕНИЕ

Сроки жизни:
    L1 (Reactive):    минуты — часы (TTL)
    L2 (Episodic):    бессрочно (но могут инвалидироваться)
    L3 (Semantic):    бессрочно (обновляются)
    L4 (Engrams):     бессрочно (деактивируются при score < 0.1)
    L5 (Institutional): бессрочно (ревизия ежесезонно)
    L6 (Network):     бессрочно (анонимизированы)
```

### 8.4 Memory Observability

| Метрика | Описание | Target |
|---|---|---|
| `memory.recall.latency_ms` | Время recall (L2 vector search) | < 200ms |
| `memory.l1.hit_rate` | Попадание в горячий кеш | > 80% |
| `memory.engram.total_active` | Количество активных энграмм | monitoring |
| `memory.engram.avg_weight` | Средний synaptic weight | > 0.5 |
| `memory.consolidation.throughput` | Эпизодов/час при консолидации | monitoring |
| `memory.network.partners_contributing` | Партнёров, дающих данные в L6 | monitoring |
| `memory.trust_score.avg` | Средний Trust Score техкарт | > 0.7 |

### 8.5 Adaptive Forgetting

Система НЕ хранит всё вечно. Политики забывания:

- **L1**: автоматический TTL expire.
- **L2**: S-Tier (сырые логи) удаляются после консолидации + buffer (7 дней).
- **L4**: энграммы с `synapticWeight < 0.1` деактивируются (не удаляются — soft delete).
- **L4**: энграммы без активации > 2 сезонов помечаются как `STALE`.
- **L3**: факты с `validUntil < now()` переходят в статус `EXPIRED`.

---

## 9. Потоки данных: как слои взаимодействуют

### 9.1 Write Path (что куда пишется)

```text
User message → L1 (Working Memory, Redis, <1ms)
             → L2 (MemoryInteraction, S-Tier, Postgres)
             
Agent response → L1 (Working Memory update)
               → L2 (MemoryInteraction, S-Tier)
               → L5 (Profile update, if relevant)

Tool result → L1 (Working Memory, tool context)

Alert from monitoring → L1 (Active Alerts cache)
                      → L4 (если есть matching engram → update activation)

TechMap completed → L4 (Engram Formation from result)
                  → L2 (Episode creation)
                  → L3 (Semantic facts update)

Marketing feed → L3 (new Semantic Facts)
              → L4 (engram enrichment)
              → L5 (regional practices update)
```

### 9.2 Read Path (что откуда читается)

```text
Agent нужен контекст:
    1. L1 (Working Memory) → мгновенный сессионный контекст
    2. L2 (Episodic Recall) → "мы это обсуждали"
    3. L4 (Engram Recall)   → "47 успешных применений"
    4. L3 (Semantic Query)  → "рапс поражается склеротиниозом при..."
    5. L5 (Profile)         → "этот клиент предпочитает..."

chief_agronomist Lightweight:
    1. L1 (Active Alerts)
    2. L4 (Engram Recall для обогащения)
    3. L3 (Knowledge для grounding)
    
chief_agronomist Full PRO:
    ALL layers + Marketing feed + External research
```

### 9.3 Consolidation Paths (как данные перетекают между слоями)

```text
L1 → (ничего, volatile)

L2 S-Tier → L2 M-Tier (ConsolidationWorker, каждые 6ч)
          → L5 (Profile extraction, при накоплении)

L2 M-Tier → L4 (EngramFormation, при accumulated evidence)
          → L3 (Semantic extraction, при clear facts)

L4 → L5 (Institutional Knowledge, при cognitiveLevel >= 4)
   → L6 (Network anonymization, при isActive && successRate > 0.8)
   → L3 (Semantic facts, при generalization)

L3 → L5 (если pattern covers multiple engrams)
```

---

## 10. Архитектура сервисов

### 10.1 Service Map

```text
                    ┌──────────────────────────────┐
                    │      MemoryFacade            │
                    │   (единая точка входа)        │
                    └──────┬───────────────────────┘
                           │
        ┌──────────────────┼─────────────────────┐
        │                  │                     │
   ┌────▼────┐    ┌───────▼──────┐    ┌─────────▼──────┐
   │ Reactive │    │   Episodic   │    │    Engram      │
   │ Memory   │    │   Memory     │    │    Service     │
   │ Service  │    │   Service    │    │                │
   └────┬────┘    └───────┬──────┘    └─────────┬──────┘
        │                  │                     │
   Redis (L1)      Postgres (L2)          Postgres (L4)
                          │                     │
                   ┌──────▼──────┐    ┌─────────▼──────┐
                   │  Semantic   │    │  Institutional │
                   │  Memory     │    │  Knowledge     │
                   │  Service    │    │  Service       │
                   └──────┬──────┘    └─────────┬──────┘
                          │                     │
                   Postgres (L3)          Postgres (L5)
                          │
                   ┌──────▼──────┐
                   │   Network   │
                   │   Memory    │
                   │   Service   │
                   └──────┬──────┘
                          │
                   Postgres (L6)

     ┌─────────────────────────────────────────────┐
     │         Background Workers                   │
     │  ┌───────────┐ ┌───────────┐ ┌──────────┐   │
     │  │Consolida- │ │ Engram    │ │ Network  │   │
     │  │tion Worker│ │ Formation │ │ Anonym-  │   │
     │  │ (S→M)     │ │ Worker    │ │ izer     │   │
     │  └───────────┘ └───────────┘ └──────────┘   │
     └─────────────────────────────────────────────┘
```

### 10.2 MemoryFacade Interface

```typescript
interface MemoryFacade {
  // === L1: Reactive ===
  setWorkingMemory(sessionId: string, slot: WorkingMemorySlot): Promise<void>;
  getWorkingMemory(sessionId: string): Promise<WorkingMemorySlot | null>;
  
  // === L2: Episodic ===
  appendInteraction(ctx: MemoryContext, interaction: MemoryInteraction): Promise<void>;
  recallEpisodes(ctx: MemoryContext, embedding: number[], options: RecallOptions): Promise<Episode[]>;
  
  // === L3: Semantic ===
  queryFacts(query: SemanticQuery): Promise<SemanticFact[]>;
  addFact(fact: SemanticFactInput): Promise<SemanticFact>;
  
  // === L4: Engrams ===
  formEngram(caseStudy: EngramCaseStudy): Promise<Engram>;
  recallEngrams(context: EngramRecallContext): Promise<RankedEngram[]>;
  strengthenEngram(id: string, evidence: Evidence): Promise<void>;
  weakenEngram(id: string, evidence: Evidence): Promise<void>;
  
  // === L5: Institutional ===
  getProfile(ctx: MemoryContext): Promise<InstitutionalKnowledge>;
  updateProfile(ctx: MemoryContext, patch: Partial<InstitutionalKnowledge>): Promise<void>;
  
  // === L6: Network ===
  getTrustScore(techMapId: string): Promise<TrustScore>;
  getNetworkBenchmark(culture: string, region: string): Promise<Benchmark>;
  
  // === Cross-cutting ===
  getMemoryHealth(): Promise<MemoryHealthReport>;
}
```

---

## 11. Roadmap реализации

### Phase 1: Foundation (Недели 1-2)

| # | Задача | Приоритет | Зависимость |
|---|---|---|---|
| 1.1 | Prisma: `Engram` model + migration | 🔴 | — |
| 1.2 | `EngramService`: form, strengthen, weaken, recall | 🔴 | 1.1 |
| 1.3 | Расширение `ContextService`: Working Memory API | 🔴 | — |
| 1.4 | `EpisodeAttrs` v2 schema (structured episodes) | 🟡 | — |
| 1.5 | `EngramRecallService` (composite score, weighted) | 🔴 | 1.1, 1.2 |

### Phase 2: Consolidation & Formation (Недели 3-4)

| # | Задача | Приоритет | Зависимость |
|---|---|---|---|
| 2.1 | `ConsolidationWorker` (S→M, background cron) | 🟡 | 1.4 |
| 2.2 | `EngramFormationWorker` (TechMap+Harvest → Engram) | 🔴 | 1.2 |
| 2.3 | Agro-Engram formation rules (категории, шаблоны) | 🔴 | 2.2 |
| 2.4 | Hot Engram Cache (L4→L1 promotion) | 🟡 | 1.3, 1.5 |

### Phase 3: Agent Integration (Недели 5-6)

| # | Задача | Приоритет | Зависимость |
|---|---|---|---|
| 3.1 | `MemoryFacade` — единый фасад для всех слоёв | 🔴 | 1.x, 2.x |
| 3.2 | `agronomist` ← Engram Recall integration | 🔴 | 3.1 |
| 3.3 | `monitoring` ← Negative Engram alerts | 🟡 | 3.1 |
| 3.4 | `MemoryCoordinatorService` расширение | 🟡 | 3.1 |

### Phase 4: Semantic & Institutional (Недели 7-8)

| # | Задача | Приоритет | Зависимость |
|---|---|---|---|
| 4.1 | Prisma: `SemanticFact` model + migration | 🟡 | — |
| 4.2 | `SemanticMemoryService`: addFact, queryFacts | 🟡 | 4.1 |
| 4.3 | `InstitutionalKnowledgeService`: principles extraction | 🟢 | 1.x, 4.1 |
| 4.4 | Engram abstraction (cognitiveLevel promotion) | 🟢 | 1.2 |

### Phase 5: Network & Trust (Недели 9-10)

| # | Задача | Приоритет | Зависимость |
|---|---|---|---|
| 5.1 | `NetworkAnonymizer`: cross-partner aggregation | 🟢 | 1.x |
| 5.2 | `TrustScoreService`: engram-backed trust | 🟢 | 5.1 |
| 5.3 | Benchmark API | 🟢 | 5.1 |
| 5.4 | Memory Health dashboard | 🟢 | all |

---

## 12. Совместимость с существующим кодом

### Что НЕ ломается

- `MemoryAdapter` interface — расширяется, не меняется.
- `DefaultMemoryAdapter` — остаётся как L2 write/read path.
- `EpisodicRetrievalService` — становится частью `EpisodicMemoryService`.
- `ContextService` — расширяется методами Working Memory.
- `MemoryModule` — дополняется новыми providers.
- `engram-rules.ts` — интегрируется в `EngramService`.
- `MemoryCoordinatorService` — расширяется, не заменяется.

### Что добавляется

- `EngramService` (новый) → L4.
- `SemanticMemoryService` (новый) → L3.
- `InstitutionalKnowledgeService` (новый) → L5.
- `NetworkMemoryService` (новый) → L6.
- `MemoryFacade` (новый) → единая точка входа.
- `ConsolidationWorker` (новый) → background job.
- `EngramFormationWorker` (новый) → background job.
- Prisma models: `Engram`, `SemanticFact`.

### Migration Path

```text
Этап 1: Добавить Prisma models (non-breaking, additive migration)
Этап 2: Создать сервисы рядом с существующими
Этап 3: MemoryFacade как wrapper → постепенная маршрутизация
Этап 4: Рефакторинг MemoryCoordinatorService → MemoryFacade
```

---

## 13. Связь с MEMORY_CANON (S5.2)

Данный документ **расширяет, но не заменяет** MEMORY_CANON:

| MEMORY_CANON | RAI Memory Architecture v2 |
|---|---|
| S-Tier (Raw Logs) | L1 (Reactive) + L2 S-Tier |
| M-Tier (Episodes) | L2 (Episodes) + L4 (Engrams) |
| L-Tier (Profile) | L5 (Institutional) |
| Carcass+Flex (JSONB) | Сохраняется для всех моделей |
| Tenant Isolation | Расширен на L6 с правилами анонимизации |
| Consolidation rules | Формализованы в ConsolidationWorker |
| — | L3 (Semantic Memory) — НОВЫЙ |
| — | L4 (Procedural/Engrams) — НОВЫЙ |
| — | L6 (Network Memory) — НОВЫЙ |

MEMORY_CANON остаётся как базовый стандарт. Данная архитектура — надстройка.
