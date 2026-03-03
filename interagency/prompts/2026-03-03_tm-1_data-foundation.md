# PROMPT — TechMap Sprint TM-1: Data Foundation
Дата: 2026-03-03
Статус: active
Приоритет: P1

## Цель
Привести Prisma-схему в соответствие с ER-моделью из `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §2. Добавить недостающие сущности (SoilProfile, RegionProfile, InputCatalog, CropZone), расширить существующие (Field, TechMap, MapOperation, MapResource), создать enums и Zod DTO.

## Контекст
- Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` (Sprint TM-1)
- Технический базис: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §2 (Ядро данных и модель данных)
- Текущая Prisma-схема: `packages/prisma-client/schema.prisma`
  - `Field` — line 599 (есть: area, coordinates, cadastreNumber, soilType enum)
  - `Season` — line 690 (привязан к Field + Rapeseed)
  - `TechMap` — line 1433 (есть: version, status FSM, MapStage→MapOperation→MapResource)
  - `MapOperation` — line 1507 (базовая: name, description, plannedStart/End)
  - `MapResource` — line 1533 (базовая: type, name, amount, unit, costPerUnit)

## Ограничения (жёстко)
- **Tenant isolation**: все новые модели ОБЯЗАНЫ иметь `companyId` + `@@index([companyId])` + `Company @relation`
- **Backward compatibility**: существующие поля НЕ УДАЛЯТЬ. Все новые поля — nullable (`?`). Существующие связи (TechMap→Season, TechMap→Field) — оставить, НЕ ломать
- **Не трогать**: UI (`apps/web`), TechMapService бизнес-логику, API endpoints, тесты — только schema + DTO
- **Не трогать**: модели за пределами TechMap домена (CRM, Memory, HR)
- **Enums**: только в Prisma schema (не строковые поля). Исключение: если enum > 20 значений — тогда String

## Задачи (что сделать)

### 1. Новая модель: `SoilProfile`
```prisma
model SoilProfile {
  id         String  @id @default(cuid())
  fieldId    String
  field      Field   @relation(fields: [fieldId], references: [id])
  sampleDate DateTime
  ph         Float?   // 3.5–9.0
  humusPercent Float? // 0–15
  p2o5MgKg   Float?  // 0–1000
  k2oMgKg    Float?  // 0–1000
  sMgKg      Float?  // 0–500
  bMgKg      Float?  // 0–10
  nMineralMgKg Float?
  bulkDensityGCm3 Float? // 0.8–1.7
  granulometricType SoilGranulometricType?
  otherElements Json?
  provenance  Json?  // { source_type, source_system, collected_at, ... }
  confidence  Float? // 0.0–1.0
  companyId   String
  company     Company @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([fieldId])
  @@index([companyId])
  @@map("soil_profiles")
}
```
- Добавить `soilProfiles SoilProfile[]` в модель `Field`
- Enum: `SoilGranulometricType` (CLAY, CLAY_LOAM, LOAM, SANDY_LOAM, LOAMY_SAND, SAND)

### 2. Новая модель: `RegionProfile`
```prisma
model RegionProfile {
  id             String       @id @default(cuid())
  name           String
  climateType    ClimateType
  gddBaseTempC   Float?       // 0–10
  avgGddSeason   Float?
  precipitationMm Float?
  frostRiskIndex  Float?      // 0–1
  droughtRiskIndex Float?     // 0–1
  waterloggingRiskIndex Float? // 0–1
  majorDiseases  Json?        // string[]
  majorPests     Json?        // string[]
  htcCoefficient Float?       // ГТК Селянинова
  typicalSowingWindows Json?
  overwinteringRiskProfile Json?
  updateSource   String?
  companyId      String?      // NULL = системный (глобальный)
  company        Company?     @relation(fields: [companyId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([companyId])
  @@map("region_profiles")
}
```
- Enum: `ClimateType` (MARITIME_HUMID, STEPPE_DRY, CONTINENTAL_COLD)

### 3. Новая модель: `InputCatalog`
```prisma
model InputCatalog {
  id                 String    @id @default(cuid())
  name               String
  inputType          InputType
  formulation        String?
  activeSubstances   Json?     // string[]
  registrationNumber String?
  supplier           String?
  legalRestrictions  Json?     // string[]
  incompatibleWith   Json?     // string[] (input IDs)
  companyId          String?   // NULL = системный
  company            Company?  @relation(fields: [companyId], references: [id])
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  @@index([companyId])
  @@index([inputType])
  @@map("input_catalog")
}
```
- Enum: `InputType` (SEED, FERTILIZER_SOLID, FERTILIZER_LIQUID, PESTICIDE_HERBICIDE, PESTICIDE_FUNGICIDE, PESTICIDE_INSECTICIDE, GROWTH_REGULATOR, FUEL, SERVICE)

### 4. Новая модель: `CropZone` (подготовительная)
```prisma
model CropZone {
  id               String   @id @default(cuid())
  fieldId          String
  field            Field    @relation(fields: [fieldId], references: [id])
  seasonId         String
  season           Season   @relation(fields: [seasonId], references: [id])
  cropType         String   // "RAPE_WINTER", "RAPE_SPRING", etc.
  varietyHybrid    String?
  predecessorCrop  String?
  targetYieldTHa   Float?
  targetQuality    Json?    // { oil_content_min_pct, moisture_max_pct, ... }
  assumptions      Json?    // string[]
  constraints      Json?    // string[]
  provenance       Json?
  confidence       Float?   // 0–1
  techMaps         TechMap[] @relation("CropZoneTechMaps")
  companyId        String
  company          Company  @relation(fields: [companyId], references: [id])
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  @@index([fieldId])
  @@index([seasonId])
  @@index([companyId])
  @@map("crop_zones")
}
```
- Добавить в TechMap: `cropZoneId String?`, `cropZone CropZone? @relation("CropZoneTechMaps", fields: [cropZoneId], references: [id])`
- НЕ убирать существующие `fieldId`, `seasonId` из TechMap!

### 5. Расширение `Field` (line 599)
Добавить nullable поля:
- `slopePercent Float?`
- `drainageClass String?`
- `protectedZoneFlags Json?` // string[]
- `soilProfiles SoilProfile[]` // relation
- `cropZones CropZone[]` // relation

### 6. Расширение `TechMap` (line 1433)
Добавить nullable поля:
- `budgetCapRubHa Float?`
- `contingencyFundPct Float?` // 5–10
- `basePlanHash String?` // SHA-256
- `changeOrderSlaHours Float?`
- `cropZoneId String?` + relation (см. задачу 4)

### 7. Расширение `MapOperation` (line 1507)
Добавить:
- `operationType OperationType?`
- `bbchWindowFrom String?`
- `bbchWindowTo String?`
- `dateWindowStart DateTime?`
- `dateWindowEnd DateTime?`
- `weatherConstraints Json?`
- `dependencies Json?` // [{opId, type: "FS"|"SS"|"FF", lagMin, lagMax}]
- `isCritical Boolean @default(false)`
- `executionProtocol Json?`
- `evidenceRequired Json?` // string[] of EvidenceType values
- Enum: `OperationType` (SOIL_TILLAGE, SOWING, FERTILIZATION, PESTICIDE_APP, IRRIGATION, ROLLING, HARVEST, TRANSPORT, SCOUTING, SAMPLING, DESICCATION)

### 8. Расширение `MapResource` (line 1533)
Добавить:
- `inputCatalogId String?` + optional relation к InputCatalog
- `plannedRateUnit String?` // "KG_HA", "L_HA", etc.
- `minRate Float?`
- `maxRate Float?`
- `applicationMethod ApplicationMethod?`
- `bbchRestrictionFrom String?`
- `bbchRestrictionTo String?`
- `tankMixGroupId String?`
- Enum: `ApplicationMethod` (BROADCAST, IN_FURROW, BAND, FOLIAR_SPRAY, SOIL_INJECTION, SEED_TREATMENT)

### 9. Zod DTO (в `apps/api/src/modules/tech-map/dto/`)
Создать:
- `soil-profile.dto.ts` — CreateDto, ResponseDto с диапазонами (pH 3.5–9.0, etc.)
- `region-profile.dto.ts` — CreateDto, ResponseDto
- `input-catalog.dto.ts` — CreateDto, ResponseDto
- `crop-zone.dto.ts` — CreateDto, ResponseDto

### 10. Обновить Company model
Добавить relation arrays для новых моделей:
- `soilProfiles SoilProfile[]`
- `regionProfiles RegionProfile[]`
- `inputCatalog InputCatalog[]`
- `cropZones CropZone[]`

## Definition of Done (DoD)
- [ ] `npx prisma validate` в `packages/prisma-client/` — PASS
- [ ] `npx prisma db push` — применено без ошибок
- [ ] `pnpm --filter api exec tsc --noEmit` — нет TS-ошибок
- [ ] Существующие тесты: `pnpm --filter api test` — PASS (или ≥ текущий уровень)
- [ ] Zod DTO созданы с корректными диапазонами для всех новых моделей
- [ ] Все новые модели имеют `companyId` + `@@index([companyId])`
- [ ] Все новые поля в существующих моделях — nullable (`?`)

## Тест-план (минимум)
- [ ] Prisma validate PASS
- [ ] DB push PASS (с существующими данными в БД)
- [ ] tsc PASS
- [ ] Существующие unit-тесты PASS (регрессия)
- [ ] Zod DTO тесты: по 1 тесту на каждый новый DTO (happy path + validation error) — минимум 8 тестов

## Что вернуть на ревью
- Изменённые файлы:
  - `packages/prisma-client/schema.prisma` (diff)
  - `apps/api/src/modules/tech-map/dto/*.dto.ts` (новые)
- Логи: `prisma validate`, `prisma db push`, `tsc --noEmit`, `pnpm test`
- Результаты Zod-тестов
