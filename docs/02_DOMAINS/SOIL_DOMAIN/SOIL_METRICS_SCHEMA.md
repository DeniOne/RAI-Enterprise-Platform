# Domain Expansion: Soil Metrics & Sustainability Layer

## 1. Data Entities (Prisma Proposals)

### 1.1. SoilMetric (Atomic Measurement)
```prisma
model SoilMetric {
  id          String   @id @default(uuid())
  fieldId     String   
  companyId   String
  timestamp   DateTime @default(now())
  
  // Physical/Chemical
  organicMatter     Float? // %
  nitrogenLevel     Float? // kg/ha
  phosphorusLevel   Float? // kg/ha
  potassiumLevel    Float? // kg/ha
  phLevel           Float?
  
  // Advanced Indices
  microbialActivity Float?
  compactionScore   Float?
  
  sourceType        DataSourceType @default(SATELLITE)
  sourceId          String?
  signature         String?        // Crypto-signed telemetry
}
```

### 1.2. SoilRegenerationIndex (Analytic Projection)
```prisma
model SoilRegenerationIndex {
  id          String   @id @default(uuid())
  fieldId     String   @unique
  companyId   String
  currentValue Float    // [0.0 - 1.0]
  lastUpdated DateTime @updatedAt
  
  historicalData Json? // [Timestamp, Value] snapshots
}
```

## 2. Decision Attributes
Drafts for Level E must include:
- `predictedSoilImpact`: Enum (REGENERATIVE, NEUTRAL, DEGRADATIVE)
- `regenerationProbability`: Float (0-1)
- `carbonSequestrationTotal`: Float (kg CO2-eq)

## 3. Soil Health Calibration
| Metric | Threshold (Min) | Threshold (Optimal) | Action if Below |
|--------|-----------------|---------------------|-----------------|
| Organic Matter | 2.5% | 4.5% | Forced Crop Rotation |
| pH Level | 5.5 | 6.5 | Mandatory Liming Operations |
| Biodiversity | 0.4 | 0.8 | Restriction on specific pesticides |
