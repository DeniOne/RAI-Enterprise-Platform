# LEVEL E: Спецификация Регенеративной Модели Данных

## 1. Введение
Формальная спецификация схемы данных для Level E (Optimization & Governance).
**Status**: Canonical (Aligned with SCE & Test Matrix).

## 2. Core Entities (Prisma Schema Extension)

### 2.1. SoilMetric (Показатели Почвы)
Хранит исторические и текущие данные о здоровье почвы.
```prisma
model SoilMetric {
  id        String   @id @default(uuid())
  fieldId   String
  companyId String
  timestamp DateTime @default(now())
  
  // Physical-Chemical
  sri       Float    // Soil Regeneration Index [0.0 - 1.0] (Strict Range)
  om        Float    // Organic Matter %
  ph        Float    // pH Level
   compacted Boolean  // Soil Compaction Flag
  
  // Provenance (I38)
  source    DataSourceType // SATELLITE, LAB, SENSOR
  signature String   // Crypto-signature of the lab/device
  
  field     Field    @relation(fields: [fieldId], references: [id])
  
  @@index([fieldId, timestamp])
}
```

### 2.2. SustainabilityBaseline (Базовая Линия - I37)
Неизменяемая точка отсчета для расчета деградации.
```prisma
model SustainabilityBaseline {
  id          String   @id @default(uuid())
  fieldId     String   @unique // One baseline per field
  establishedAt DateTime @default(now())
  
  baselineSRI Float    // Initial SRI
  targetSRI   Float    // 5-Year Goal
  
  genesisHash String   // Link to Immutable Ledger (Anchor)
  locked      Boolean  @default(true) // Immutable
}
```

### 2.3. BiodiversityMetric (I36)
Метрики давления на экосистему.
```prisma
model BiodiversityMetric {
  id          String @id @default(uuid())
  seasonId    String @unique
  
  bps         Float  // Biodiversity Pressure Score [0.0 - 1.0]
  shannonIndex Float // Shannon Diversity Index
  monoPenalty Float  // Calculated Penalty for Monoculture
  
  season      Season @relation(fields: [seasonId], references: [id])
}
```

## 3. Simulation & Optimization Models

### 3.1. CounterfactualSimulation (SCE)
Результаты стохастического моделирования альтернативных сценариев.
```prisma
model CounterfactualSimulation {
  id              String   @id @default(uuid())
  fieldId         String
  createdAt       DateTime @default(now())
  
  // Inputs
  initialSoilState Json    // Snapshot of SoilMetric
  weatherScenario  String  // RCP_4.5, RCP_8.5
  
  // Outcomes
  breakEvenYear    Int?    // Liquidity Gap Closure Year
  riskProfile      Json    // { p05_loss: Float, p95_gain: Float }
  
  // Governance
  riskAcknowledged Boolean @default(false) // User signed the risk?
  rationaleHash    String? // Hash of the user's justification
  
  trajectories     Json    // Large JSON with yearly data
}
```

### 3.2. SustainabilityProfitTradeoff (Pareto)
Наборы оптимальных стратегий.
```prisma
model SustainabilityProfitTradeoff {
  id          String   @id @default(uuid())
  fieldId     String
  generatedAt DateTime @default(now())
  
  frontierHash String   // Unique Hash of the Pareto Frontier (I1)
  solutions    Json[]   // List of { yield: X, sri: Y, strategy_id: Z }
}
```

## 4. Governance & Overrides

### 4.1. GovernanceLock (Lockdown State)
Состояние блокировки поля при нарушении инвариантов.
```prisma
model GovernanceLock {
  id        String   @id @default(uuid())
  fieldId   String   @unique
  
  isActive  Boolean  @default(false)
  reason    String   // DEGRADATION_I34, BIO_PRESSURE_I36
  lockedAt  DateTime @default(now())
  
  // Exit Criteria
  recoverySeasons Int @default(0) // Must reach 2 to unlock
}
```

### 4.2. OverrideRequest (Escalation)
Запросы на ручное вмешательство.
```prisma
model OverrideRequest {
  id          String   @id @default(uuid())
  strategyId  String
  
  status      OverrideStatus // PENDING, APPROVED, REJECTED
  category    OverrideCategory // FINANCIAL_PRESSURE, MODEL_DISTRUST
  
  deltaSRI    Float    // Impact on Soil
  confidence  Float    // Model Confidence at time of override
  
  approverId  String?  // Who signed off?
  riskCommitteeVote Json? // If escalalted to Committee
}
```

## 5. Data Types & Enums
```typescript
enum DataSourceType {
  SATELLITE
  LAB
  SENSOR
  USER_INPUT
}

enum OverrideStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
}

enum OverrideCategory {
  FINANCIAL_PRESSURE // Liquidity Gap
  MODEL_DISTRUST     // Variance too high
  EXTREME_WEATHER    // Force Majeure
}
```
