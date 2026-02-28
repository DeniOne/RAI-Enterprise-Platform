# Observation Catalog (MVP) — RAI_EP
Старт: RU/BY/KZ • Культуры: Рапс, Подсолнечник
Назначение: стандартизировать полевая речь/медиа → EventDraft.payload

## Общие поля EventDraft (всегда)
- fieldRef (MUST)
- timestamp (MUST)
- evidence[] (MUST: text OR photo OR video OR voice transcript)
- confidence (0..1)

## 1) PHENOLOGY_STAGE
Описание: стадия развития культуры (BBCH)
MUST payload:
- crop: RAPeseed | SUNflower
- bbch: number
OPTIONAL:
- note
Связь с метриками:
- phenology_vs_calendar

## 2) WEED_PRESSURE
MUST:
- weedPressure: LOW|MEDIUM|HIGH
OPTIONAL:
- dominantWeeds: string[]
- areaSharePct?: number
Связь:
- yieldRiskIndex (later), alerts

## 3) PEST_PRESSURE
MUST:
- pestPressure: LOW|MEDIUM|HIGH
OPTIONAL:
- pestName?: string
- damageSharePct?: number
Связь:
- risk, рекомендованные действия агронома

## 4) DISEASE_SIGNAL
MUST:
- diseaseSignal: LOW|MEDIUM|HIGH
OPTIONAL:
- suspectedDisease?: string
- leafSharePct?: number

## 5) SOIL_MOISTURE_ESTIMATE
MUST:
- moisture: DRY|OK|WET
OPTIONAL:
- method?: VISUAL|SENSOR|OTHER

## 6) N_DEFICIENCY_SIGNAL (Nitrogen)
MUST:
- nDefSignal: NONE|SUSPECTED|CONFIRMED
OPTIONAL:
- severity: LOW|MEDIUM|HIGH

## 7) PLANT_DENSITY
MUST:
- plantsPerM2: number
OPTIONAL:
- sampleCount?: number

## 8) EMERGENCE_RATE
MUST:
- emergencePct: number (0..100)

## 9) LODGING_RISK
MUST:
- lodgingRisk: LOW|MEDIUM|HIGH

## 10) HARVEST_READINESS
MUST:
- readiness: NOT_READY|NEAR|READY
OPTIONAL:
- moisturePct?: number