---
id: DOC-DOM-GEN-068
type: Domain Spec
layer: Domain
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

---
id: component-rai-entity-map
type: component
status: review
owners: [domain-experts]
aligned_with: [principle-vision]
---

# RAI: СУЩНОСТИ

## 1. Field (Поле)
- **ID**: UUID (Core.Registry.Object.id)
- **Name**: Название (например, «Поле №12 / Южное»)
- **Area**: Площадь в гектарах (float)
- **CadastralNumber**: Кадастровый номер (string)
- **Geometry**: JSON (Polygon coordinates)
- **SoilType**: Тип почвы (enum: CHERNOZEM, SOD_PODZOLIC, etc.)

## 2. Rapeseed (Рапс)
- **ID**: UUID
- **CommonName**: Название
- **Variety**: Сорт (например, «Шредингер»)
- **Reproduction**: Репродукция (Элита, РС1, РС2)
- **OilContent**: Масличность (%)
- **ErucicAcid**: Эруковая кислота (%)
- **Glucosinolates**: Глюкозинолаты (мкмоль/г)

## 3. Season (Сезон)
- **ID**: UUID (Core.Flow.id)
- **FieldID**: FK -> Field
- **RapeseedID**: FK -> Rapeseed
- **Year**: Календарный год
- **Status**: enum (PLANNING, ACTIVE, COMPLETED)
- **YieldTarget**: Плановая урожайность (т/га)
- **YieldFact**: Фактическая урожайность (т/га)
- **OilYieldFact**: Фактический выход масла (т) - расчетное поле

## 4. Operation (Агрооперация)
- **ID**: UUID (Core.Task.id)
- **Type**: Тип (Сев, Пахота, Уборка, Внесение удобрений)
- **SeasonID**: FK -> Season
- **ScheduledDate**: Дата начала
- **Status**: (из Core.Task)
- **Payload**:
    - `fuel_norm`: Норма расхода ГСМ
    - `seed_norm`: Норма высева (для Сева)
    - `fertilizer_type`: Тип удобрения (для Внесения)
    - `depth`: Глубина обработки
