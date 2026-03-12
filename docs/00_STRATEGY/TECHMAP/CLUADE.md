---
id: DOC-ARV-TECHMAP-CLUADE-7HHR
layer: Archive
type: Legacy
status: archived
version: 0.1.0
---
Ниже — инженерная архитектура техкарты рапса как единого артефакта (проект урожая + контракт + операционная модель + гипотеза), с триажем входных данных и блоками A–H.

***

## Карта неизвестного (триаж входных данных)

### 1. Обязательные входные данные (без них техкарту строить нельзя)

| Группа | Поле (пример имени) | Уровень | Комментарий / зачем |
|-------|----------------------|---------|----------------------|
| Юрлица/договора | legalEntityId, contractId, сторона_А/Б, модель_ответственности | LegalEntity/Contract | Чтобы техкарта имела носителя рисков и сторон договора |
| Хозяйство | farmId, регионПрофиляId, система земледелия (no-till/традиц.), структура севооборота | Farm | Привязка к региональному профилю, базовые ограничения |
| Поле | fieldId, площадь_га, контур (GeoJSON), уклон, гидрология, эрозионный риск | Field | Расчёт норм на га, логистика, риски подтопления/эрозии |
| История поля | предшественник, 2–3 предыдущих культуры, история СЗР с ограничениями по регламентам | FieldHistory | Совместимость СЗР, болезни, волонтёры рапса |
| Почва | метод отбора, глубина, pH, гумус, P₂O₅, K₂O, S, минимальный набор по микроэлементам, механический состав | SoilAnalysis | Базовый расчёт питания, риски по структуре |
| Сезон/культура | seasonId, год, тип рапса (озимый/яровой), сорт/гибрид, группа спелости | Season/CropPlan | Окна операций, фенофазы, зимостойкость |
| Цели | целевая урожайность_т_га, целевое масло/протеин/класс, допустимый риск (консервативный/умеренный/агрессивный) | CropPlan | Задаёт «урожай как гипотезу» и экономику |
| Техника | список агрегатов (трактор/опрыскиватель/сеялка/почвообработка), их ширина/производительность/ограничения | Machinery | Возможность реализации операций в окна времени |
| Люди | роли (главный агроном, механизатор, инженер, директор), доступность по сезонам | Labor | Кто утверждает/исполняет/контролирует |
| Ограничения договора | лимит бюджета по статье (семена/СЗР/удобрения/работы), штрафы, SLA по урожайности/качеству | Contract | Правила перерасхода и change orders |
| Цифровая инфраструктура | наличие GPS на технике, трекинг, фото/дроны, интеграции с метео/спутниками | Evidence/Observation | Возможность доказательной базы |

### 2. Желательные (сильно улучшают качество, но техкарту можно собрать с повышенной неопределённостью)

- Детальная карта почвы (зоны плодородия, вариативность pH, EC, рельеф).
- История урожайности по полю (5+ лет, т/га, влажность, качество).
- История погоды по полю (локальная метеостанция, переувлажнение/засуха, минимумы зимой).
- Подробный парк СЗР/удобрений, предпочтения брендов, регламенты корпорации.
- Локальные вредители/болезни по частоте и ущербу.
- Доступные сервисы: локальная лаборатория, дроны/NDVI, сервисы прогноза погоды.

### 3. Допускающие оценку/импутацию (ИИ может предложить, человек — подтвердить/скорректировать)

- Окна сева/оптимальные фенофазы для операций по региональному профилю.
- Ориентировочная сумма температур, вероятность критических заморозков.
- Эталонные/целевые диапазоны обеспеченности элементами питания для рапса.
- Типовые риски (снежная плесень, выпревание, засуха в цветении и т.д.).
- Бенчмарки по себестоимости и урожайности для региона.

***

## A — Каноническая структура техкарты (Table of Contents)

### A.1. Оглавление 1–3 уровня

1. Паспорт техкарты (обязательный)
   1.1. Общие сведения (юрлицо, хозяйство, сезон, редакция)
   1.2. Подписанты и роли
   1.3. Область действия (поля, культура, период)
2. Контрактная часть (обязательный)
   2.1. Цели урожайности и качества
   2.2. Распределение ответственности и рисков
   2.3. Финансовые условия и бюджетные лимиты
   2.4. Порядок изменений (Change Orders)
3. Агрономический контекст (обязательный)
   3.1. Характеристика хозяйства и системы земледелия  
   3.2. Характеристика полей (по каждому полю/зоне)
   3.3. Почвенно-агрохимический анализ
   3.4. История поля и севооборот
4. Региональный профиль (условно-обязательный, зависит от региона)
   4.1. Климатическая зона и ключевые параметры
   4.2. Основные риски (перезимовка, засуха, болезни)
   4.3. Рекомендуемые агроокна (без «истинных» дат)
5. Урожай как гипотеза (обязательный)
   5.1. Целевая урожайность и качество
   5.2. Ключевые допущения
   5.3. Ограничения (техника, бюджет, регламенты)
6. План агротехники (обязательный)
   6.1. Структура операций по фазам развития  
   6.2. Подготовка почвы / предшественник  
   6.3. Посев  
   6.4. Питание (основное и подкормки)  
   6.5. Защита (сорняки, вредители, болезни)  
   6.6. Регуляторы роста и специальные обработки  
   6.7. Уборка и послеуборочная обработка
7. Операционная модель (обязательный)
   7.1. Календарь/граф работ  
   7.2. Ресурсы и загрузка техники  
   7.3. SLA по срокам и качеству исполнения
8. Модель адаптации (обязательный)
   8.1. Набор триггеров (погода, NDVI, осмотры, фенофаза)  
   8.2. Правила пересмотра операций  
   8.3. Каталог типовых сценариев (засуха, вымокание, перезимовка и т.д.)
9. Экономика и бюджет (обязательный)
   9.1. Бюджет по статьям  
   9.2. План/факт и допуски  
   9.3. Маржинальность и риск-коррекция
10. Наблюдения и доказательства (обязательный)
    10.1. План мониторинга (осмотры, спутник, метео)  
    10.2. Типы доказательств  
    10.3. Требования к хранению и аудиту
11. Журнал изменений (обязательный)
    11.1. Реестр Change Orders  
    11.2. Причины, триггеры, ссылка на наблюдения
12. Приложения (опциональный)
    12.1. Карты (почвы, NDVI, зональное деление)  
    12.2. Протоколы лабораторных анализов  
    12.3. Внутренние регламенты компании

### A.2. Обязательность разделов (сводно)

| Раздел | Статус | Зависимости (регион/тип) |
|--------|--------|---------------------------|
| Паспорт техкарты | Обязателен | Всегда |
| Контрактная часть | Обязателен | Всегда |
| Агрономический контекст | Обязателен | Всегда |
| Региональный профиль | Обязателен | Содержимое зависит от зоны |
| Урожай как гипотеза | Обязателен | Всегда |
| План агротехники | Обязателен | Состав операций зависит от типа рапса |
| Операционная модель | Обязателен | Всегда |
| Модель адаптации | Обязателен | Всегда |
| Экономика и бюджет | Обязателен | Всегда |
| Наблюдения и доказательства | Обязателен | Всегда |
| Журнал изменений | Обязателен | Всегда |
| Приложения | Опционален | По зрелости цифровизации |

### A.3. Матрица «раздел → владелец → источник → контроль → доказательство»

Пример для ключевых разделов:

| Раздел | Владелец данных | Источник | Контроль | Доказательство |
|--------|-----------------|----------|----------|----------------|
| Паспорт | Юрист/директор | ЕРИЮЛ, устав, договор | Юрист, комплаенс | Подписанный PDF/ЭП, уставные документы |
| Региональный профиль | Методолог RAI | Внешние БД погоды, климатические карты | Центральный агроцентр | Версионированный профиль в системе |
| Агрономический контекст | Главный агроном хозяйства | Описания полей, карты, прошлые техкарты | Агроконсультант RAI | Фото/карты, прошлые отчёты |
| Урожай как гипотеза | Агроконсультант RAI | Аналитика по регионам, договорные цели | Директор хозяйства | Протокол согласования, подписи |
| План агротехники | Агроконсультант RAI | Методология, базы СЗР/удобрений, регион | Методолог RAI | Версия методики, чек по ошибкам |
| Экономика/бюджет | Экономист/директор | Прайсы, прошлые затраты | Финслужба | Загруженные прайсы, сметы |
| Наблюдения/доказательства | Исполнитель/агроном | Мобильное приложение, телеметрия | RAI + директор | Фото, треки, акты, лабораторные |

### A.4. Definition of Done для структуры техкарты

Структура техкарты «готова к внедрению», если:

- Все обязательные разделы описаны, имеют формальные схемы данных и правила валидации.
- Для каждого раздела определён владелец данных, источник, контроль и тип доказательств.
- Схема связей между LegalEntity/Farm/Field/Season/TechMap формализована (см. Блок B).
- Описаны допустимые диапазоны и единицы измерения для всех количественных полей.
- Определены словари/enum’ы (фазы развития, типы операций, материалы, уровни доказательств).
- Определена модель провенанса и confidence для критических полей.
- Прописан протокол Change Orders и ведение журнала изменений.
- Есть формальное разделение «подписываемой части» и «операционной части».

***

## B — Модель данных (Data Schema)

### B.1. Основные сущности и связи (логический уровень)

- LegalEntity 1–N Farm  
- Farm 1–N Field  
- Field 1–N SeasonFieldBinding (одно поле в нескольких сезонах)  
- Season 1–N CropPlan  
- CropPlan 1–1 TechMap  
- TechMap 1–N Operation  
- Operation 1–N Application (конкретные внесения/обработки)  
- Operation N–N Machinery (через OperationMachinery)  
- Operation N–N Labor (через OperationLabor)  
- TechMap 1–N Risk  
- TechMap 1–N KPI  
- TechMap 1–N ObservationPlan (план) и 1–N Observation (факт)  
- Observation 1–N Evidence  
- TechMap 1–N Approval  
- TechMap 1–N ChangeOrder  

### B.2. JSON-подобные схемы (фрагменты)

#### LegalEntity

```json
LegalEntity {
  id: string;                        // обязательное
  name: string;                      // обязательное
  inn: string | null;                // опционально (для РФ, BY и т.п.)
  country: string;                   // ISO код
  contacts: {
    directorName: string;
    email: string;
    phone: string;
  };
  riskProfile: "conservative" | "moderate" | "aggressive";
  createdAt: string;                 // ISO datetime
  updatedAt: string;
}
```

#### Farm

```json
Farm {
  id: string;
  legalEntityId: string;
  name: string;
  regionProfileId: string;           // ссылка на региональный профиль
  farmingSystem: "no_till" | "min_till" | "conventional";
  avgFieldSizeHa: number;           // 1–500
  createdAt: string;
  updatedAt: string;
}
```

#### Field

```json
Field {
  id: string;
  farmId: string;
  name: string;
  areaHa: number;                    // 0.1–3000
  geometry: GeoJSON;                 // обязательное для контроля
  slopePercent: number | null;       // 0–30
  erosionRisk: "low"|"medium"|"high";
  drainageType: "none"|"open_ditches"|"tile_drainage"|"other";
  predecessorHistory: [
    {
      year: number;
      crop: string;
      notes?: string;
    }
  ];
}
```

#### Season

```json
Season {
  id: string;
  year: number;                      // 2000–2100
  name: string;                      // "2026/27 озимый"
  startDate: string;
  endDate: string;
}
```

#### CropPlan (для рапса)

```json
CropPlan {
  id: string;
  fieldId: string;
  seasonId: string;
  crop: "rapeseed";
  type: "winter" | "spring";
  variety: string;
  maturityGroup: string;             // условные группы
  targetYieldTPerHa: number;         // 0.5–7.0 т/га
  targetOilPercent: number | null;   // 35–55
  targetProteinPercent: number | null;
  riskTolerance: "conservative"|"moderate"|"aggressive";
  constraints: {
    maxTotalN_kg_ha?: number;        // региональный/договорной лимит
    maxPesticideAI_kg_ha?: number;
    machineryConstraints?: string[];
  };
}
```

#### TechMap

```json
TechMap {
  id: string;
  cropPlanId: string;
  version: number;                   // 1..N
  status: "draft"|"under_review"|"approved"|"executing"|"closed";
  createdByUserId: string;
  approvedByUserId?: string;
  approvedAt?: string;
  hypothesis: {
    yieldTPerHa: number;
    qualityClass: string;           // словарь
    keyAssumptions: string[];       // текстовые формулировки
    keyConstraints: string[];
  };
  operations: Operation[];           // см. ниже
  riskRegister: Risk[];
  kpis: KPI[];
}
```

#### Operation

```json
Operation {
  id: string;
  techMapId: string;
  type: OperationTypeEnum;
  name: string;
  description?: string;
  cropStage: GrowthStageBBCH;       // см. enum
  timingWindow: {
    startStage: GrowthStageBBCH;
    endStage: GrowthStageBBCH;
    relToCalendar?: {
      earliestDate?: string;
      latestDate?: string;
    };
  };
  dependencies: string[];           // id других операций
  preChecks: string[];              // чеклист
  postChecks: string[];
  qualityCriteria: string[];
  applications: Application[];
  adaptiveRules: AdaptiveRule[];
  isCritical: boolean;
}
```

#### Application (внесение материала/операция обработки)

```json
Application {
  id: string;
  operationId: string;
  inputId: string;                   // ссылка на Input
  materialType: MaterialTypeEnum;
  nominalRatePerHa: number | null;   // единицы зависят от материала
  rateUnit: RateUnitEnum;            // "kg/ha","l/ha","seeds/m2",...
  rateRangePerHa?: {
    min: number;
    max: number;
  };
  requiresRegionalCoefficient: boolean;
  method: ApplicationMethodEnum;
  tankMixGroupId?: string;           // для смесей
}
```

#### Input (материал)

```json
Input {
  id: string;
  name: string;
  manufacturer?: string;
  materialType: MaterialTypeEnum;
  formulation?: string;
  concentration?: string;
  legalRestrictions?: string[];
}
```

#### Machinery

```json
Machinery {
  id: string;
  farmId: string;
  type: MachineryTypeEnum;          // трактор, опрыскиватель и т.п.
  model: string;
  workingWidthM: number;            // 1–36
  capacityHaPerHour: number;        // 0.5–50
  hasGPS: boolean;
  constraints?: string[];
}
```

#### Labor

```json
Labor {
  id: string;
  role: "chief_agronomist"|"operator"|"engineer"|"director";
  name: string;
  qualifications: string[];
}
```

#### Risk

```json
Risk {
  id: string;
  techMapId: string;
  category: "weather"|"disease"|"pest"|"nutrient"|"logistics"|"legal"|"other";
  description: string;
  likelihood: 1|2|3|4|5;
  impact: 1|2|3|4|5;
  mitigationPlan: string;
  linkedOperations: string[];
}
```

#### KPI

```json
KPI {
  id: string;
  techMapId: string;
  name: string;                      // "Себестоимость/га", "Урожайность"
  targetValue: number;
  unit: string;
  tolerancePercent: number;          // ± %
  calcFormula: string;               // DSL/описание
}
```

#### Observation и Evidence

```json
Observation {
  id: string;
  techMapId: string;
  fieldId: string;
  date: string;
  observerId: string;
  type: "field_walk"|"drone"|"satellite"|"lab"|"weather";
  cropStage: GrowthStageBBCH | null;
  dataSummary: string;
  evidenceIds: string[];
}
```

```json
Evidence {
  id: string;
  observationId: string;
  type: EvidenceTypeEnum;
  storageUrl: string;
  createdAt: string;
  geoPoint?: {
    lat: number;
    lon: number;
  };
  meta?: object;
}
```

#### Approval

```json
Approval {
  id: string;
  techMapId: string;
  role: "chief_agronomist"|"director"|"legal"|"farmer_rep";
  approverId: string;
  approvedAt: string;
  status: "approved"|"rejected";
  comments?: string;
}
```

#### ChangeOrder

```json
ChangeOrder {
  id: string;
  techMapId: string;
  createdAt: string;
  createdByUserId: string;
  reason: string;
  triggerType: "weather"|"observation"|"price_change"|"failure"|"other";
  linkedObservationId?: string;
  changeDescription: string;
  impactOnYieldHypothesis?: string;
  impactOnBudget?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  status: "draft"|"pending_approval"|"approved"|"rejected";
}
```

### B.3. Enum’ы и словари

- GrowthStageBBCH — коды BBCH для рапса/канолы: 0–9 главных стадий (0 — прорастание, 1 — лист, 2 — боковые побеги, 3 — стебель, 5 — бутонизация, 6 — цветение, 7 — формирование стручков, 8 — созревание, 9 — сенесценция).[1][2][3]
- OperationTypeEnum — `"tillage"`, `"sowing"`, `"fertilization"`, `"herbicide"`, `"fungicide"`, `"insecticide"`, `"growth_regulator"`, `"desiccation"`, `"harvest"`, `"other"`.
- MaterialTypeEnum — `"seed"`, `"fertilizer"`, `"herbicide"`, `"fungicide"`, `"insecticide"`, `"plant_growth_regulator"`, `"adjuvant"`, `"fuel"`, `"other"`.
- ApplicationMethodEnum — `"soil_incorporated"`, `"surface_broadcast"`, `"band"`, `"foliar_spray"`, `"seed_treatment"`, `"fertigation"`, `"other"`.
- RateUnitEnum — `"kg/ha"`, `"l/ha"`, `"seeds/m2"`, `"t/ha"`, `"piece/ha"`.
- MachineryTypeEnum — `"tractor"`, `"sprayer"`, `"seeder"`, `"cultivator"`, `"combine"`, `"spreader"`, `"roller"`, `"other"`.
- EvidenceTypeEnum — `"photo"`, `"video"`, `"gps_track"`, `"lab_report"`, `"invoice"`, `"act"`, `"weather_report"`, `"other"`.
- EvidenceLevelEnum — `"self_reported"`, `"operator_confirmed"`, `"agronomist_verified"`, `"third_party_lab"`, `"automated_sensor"`.

### B.4. Провенанс и confidence

Шаблон для критических полей (например, targetYieldTPerHa, нормы внесения, cropStage):

```json
FieldWithProvenance<T> {
  value: T;
  provenance: {
    sourceType: "manual"|"imported"|"model";
    sourceSystem?: string;         // "1C", "LabX", "MeteoAPI"
    actorId?: string;              // кто ввёл/подтвердил
    method: "expert_estimate"|"measurement"|"satellite"|"historical_stats";
    timestamp: string;
    evidenceIds?: string[];
    confidenceScore: number;       // 0.0–1.0
  };
}
```

Для критических полей схема расширяется:  
например, `targetYield: FieldWithProvenance<number>`.

***

## C — Методология расчёта и «урожай как гипотеза»

### C.1. Фиксация гипотезы урожайности

Гипотеза включает:

- Цель: `yieldTPerHa`, `qualityClass`, `oil%`, `proteins%`.
- Допущения:
  - «Региональный профиль X (например, степной/засушливый)»;
  - «Суммарное питание по элементам в допустимом диапазоне для заданного уровня урожайности»;
  - «Уровень давления болезней/вредителей не выше Y».
- Ограничения:
  - Бюджет по элементам и СЗР;
  - Лимиты по нормам (экологические/регуляторные);
  - Ограничения техники (ширина, скорость, доступность окон).

Формально гипотеза — это набор параметров в `TechMap.hypothesis` + производных KPI, рассчитываемых по методологии.

### C.2. Вычисляемые элементы и правила

Все агрономические числа задаются как функции от входов:

- Нормы внесения:
  - `N_total_kg_ha = f(targetYieldTPerHa, soilN_supply, previousCropCoeff, regionCoeffN)`;
  - Аналогично по P, K, S, B и др., причём `regionCoeff*` и `varietyCoeff*` — параметры из профильных таблиц, а не «истина».
- Сроки и окна операций:
  - Сев: интервал `sowingWindow = f(regionProfile, type(winter/spring), soilTempThreshold, soilMoistureRange)`;
  - Подкормки/СЗР: в пространстве фенофаз BBCH и условий (влага, температура воздуха/почвы, ветер).
- Зависимости:
  - Посев невозможен до выполнения критической обработки почвы или удаления растительных остатков;
  - Определённые СЗР несовместимы с фазой (запрет до/после определённого BBCH).
- Критические пороги:
  - `soilMoisturePct` диапазоны (например, слишком сухо/слишком сыро) — берутся из регион/почва-справочника;
  - `airTempRange` для обработки и вегетации;
  - `nutrientStatus` зон: недостаточно/оптимально/избыток.

### C.3. Двухконтурность: базовый план + адаптивные правила

- Контур 1 — базовый план:
  - Список операций, их фенофазные окна и ресурсное обеспечение, рассчитанные на «нормальный год» по региональному профилю.
- Контур 2 — адаптация:
  - Набор `AdaptiveRule` с триггерами и действиями.

Пример структуры правила:

```json
AdaptiveRule {
  id: string;
  trigger: {
    source: "weather"|"ndvi"|"observation"|"phenology_model";
    condition: string; // DSL: e.g. "rainLast7Days_mm < X AND bbchStage BETWEEN 50 AND 59"
  };
  action: {
    type: "modify_operation"|"skip_operation"|"add_operation"|"shift_timing";
    targetOperationId: string;
    parameters: object; // например, смещение окна или корректировка нормы как %.
  };
  requiresApprovalRole: "chief_agronomist"|"director"|null;
}
```

### C.4. Что считается ошибкой (валидационные правила)

- Агротехнические ошибки:
  - Несовместимость смесей (запрещённые баковые смеси или pH/физхимическая несовместимость);
  - Выход за пределы регистрационных/рекомендованных норм (с учётом региональных лимитов);
  - Пропуск критической операции (отмеченной `isCritical=true`) без Change Order.
- Ошибки по фазе:
  - Окно по BBCH для операции не пересекается с модельной/фактической фенофазой;
  - Запрещённая обработка в определённую стадию (например, риск фитотоксичности).
- Логические/юридические ошибки:
  - Использование препарата, не разрешённого для культуры/страны/юридического лица;
  - Нарушение бюджета/лимитов без одобренного Change Order;
  - Несогласованная корректировка гипотезы урожайности.

***

## D — Юридическая оболочка (Contract + Evidence)

### D.1. Что делает документ юридически значимым

- Уникальный идентификатор техкарты и договора.
- Версионирование и статус (Draft/Approved/Executed/Closed).
- Реквизиты сторон (юрлица, представители, основания полномочий).
- Подписываемая часть:
  - Цели по урожайности/качеству;
  - Объём работ/консалтинга;
  - Обязанности сторон;
  - Порядок предоставления данных и допуска к полям;
  - Порядок изменений (Change Orders), сроки и формат уведомления;
  - Ответственность (штрафы, форс-мажор).
- Электронные подписи (КЭП) или бумажные подписи с привязкой к цифровой версии.

### D.2. Структура «подписываемой» и «операционной» части

- Подписываемая часть (статическая):
  - Разделы 1–2, верхний уровень разделов 5, 9.
  - Не меняются без Change Order.
- Операционная часть (динамическая):
  - Детальный список операций, адаптивные правила, наблюдения.
  - Могут изменяться по протоколу:
    - Меньшие изменения — по уведомлению и подтверждению агрономом;
    - Существенные — через формальный Change Order с перевыпуском версии.

### D.3. Требования к доказательствам исполнения

- Виды доказательств:
  - Акты выполненных работ (подписанные сторонами).
  - Фото/видео с геометками до/во время/после операций.
  - GPS-треки техники с привязкой ко времени и операциям.
  - Накладные и счета-фактуры на материалы.
  - Лабораторные анализы (почва, лист, урожай).
  - Погодные данные (официальные/метеостанция/сервисы).
- Для каждой операции: минимальный набор EvidenceTypeEnum и уровень EvidenceLevelEnum.

### D.4. Аудитный след

- Каждый значимый объект (TechMap, Operation, Application, Budget, KPI) имеет:
  - `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Журнал изменений:
  - Кто изменил, что, когда, почему (привязка к Observation/ChangeOrder).
  - Старая и новая версия объекта (diff).
- Возможность восстановить состояние техкарты на любую дату в сезоне.

***

## E — Операционная модель исполнения (Ops)

### E.1. Развёртывание в календарь/граф работ

На основе TechMap:

- Формируется список задач (Operations) c привязкой:
  - к окнам по фенофазе BBCH;
  - к ориентировочным календарным промежуткам через региональный профиль.
- Строится граф:
  - Зависимости: предшествующие операции (почва до посева, посев до гербицида и т.п.).
  - Ресурсы: техника, люди, материалы.
- SLA:
  - Максимальное отклонение по сроку (например, ±X дней или ±ΔBBCH);
  - Критерии завершения: выполнены pre/post-checks, собраны доказательства.

### E.2. Структура операции с точки зрения исполнения

Для каждой Operation:

- Входные данные:
  - Статус предыдущих операций, фактическая фенофаза, состояние почвы, наличие материалов и техники.
- Pre-checks:
  - Чеклист условий допуска: погода в допуске, техника исправна, операторы обучены, препарат/норма разрешены и т.д.
- Допуски:
  - Диапазон условий (температура, влажность, BBCH, скорость ветра) — из словарей/регламентов.
- Контроль качества:
  - Набор наблюдаемых параметров в процессе (скорость движения, глубина, равномерность).
- Post-checks:
  - Фото/видео, визуальная оценка, отметка об остатках препарата, мытьё техники и т.п.
- Критерии завершения:
  - Все чеклисты выполнены, данные зафиксированы, KPI по операции не нарушены.

### E.3. Протокол «ИИ → человек»

Матрица решений:

| Тип решения | Пример | Уровень автоматизации | Кто подтверждает |
|-------------|--------|-----------------------|------------------|
| Информационное уведомление | «Приближается окно внесения фунгицида» | Полностью авто | Не требуется |
| Оперативная оптимизация | «Сместить операцию на +2 дня по погоде» | Авто-предложение | Главный агроном |
| Коррекция нормы в рамках допустимого диапазона | ±X% в ответ на прогноз погоды | Авто-предложение с лимитом | Главный агроном/методолог |
| Существенное изменение схемы питания/защиты | Замена препарата, изменение числа обработок | Только вручную по предложению ИИ | Агрокомитет/директор |
| Изменение целевой урожайности/бюджета | Пересмотр гипотезы | Только вручную | Директор + RAI |

***

## F — Регионализация (Калининград–Кавказ–Сибирь)

### F.1. Механизм региональных профилей

Сущность `RegionProfile`:

```json
RegionProfile {
  id: string;
  name: string### Карта неизвестного (триаж входных данных)

Грубо делим входы на три класса: **обязательные (без них техкарта не строится), желательные (сильно повышают качество), импутируемые (можно оценить по справочникам/моделям, помечая как гипотезу).**

#### 1. Матрица входов по уровням

| Уровень контекста | Пример полей | Обязат. | Импутация | Комментарий |
|-------------------|--------------|---------|-----------|-------------|
| Юрлицо            | реквизиты, система налогообложения, владение землёй/аренда, страхование | Обязат. | Частично (справочники) | Влияет на юр.оболочку, ответственность, допустимые схемы работы |
| Хозяйство         | структура земель, севооборот, парк техники, ИТ-системы | Обязат. | Частично | Без понимания техники/ресурсов нельзя спланировать операционную модель |
| Поле              | площадь, контур, рельеф, дренаж, история культур 3–5 лет | Обязат. | Нельзя | Это «единица планирования» техкарты |
| Почва             | тип, грансостав, pH, гумус, обеспеченность NPKS, микроэлементы, плотность | Обязат. (минимум pH+гумус+P,K) | НРД/карты почв, но с низким довер. | Без базовой почвенной информации цели по урожайности — фикция |
| Регион/климат     | климатическая зона, сумма температур, риск засухи/подпора, снег, оттепели | Обязат. (зона) | Да (региональные профили) | Используем как профиль, а не набор «жёстких дат» |
| Предшественник    | культура, остатки, способ обработки, СЗР в прошлом сезоне | Обязат. | Нельзя | Влияет на риск болезней, падалицы, доступный N, технологию основной обработки |
| Семена            | культура, тип (озимый/яровой), гибрид/сорт, нормы высева, требования производителя | Обязат. | Частично по каталогу | Строго разделяем данные от производителя и от хозяйства |
| Техника           | доступные агрегаты, захват, производительность, ограничения по влажности/рельефу | Желат. | Частично (типовые справочники) | Без техники сроки будут теоретическими |
| Люди              | сменность, квалификация, доступность «окон» работ | Желат. | Нельзя | Влияет на реалистичность графика |
| Логистика         | удалённость от складов/портов, доступ к сушке, хранению, подрядчикам | Желат. | Частично | Важна для реальности окон уборки/подвоза ресурсов |
| Риски/ограничения | регуляторные (СЗР, экозоны), внутренние лимиты по затратам, риск-аппетит | Обязат. | Нельзя | Вшивается в юридическую и экономическую оболочку |
| Исторические данные | фактические урожаи, факты по операциям, NDVI, болезни | Желат. | Можно оценить (ср. по региону) | Нужны для калибровки целевой урожайности как гипотезы |
| Погодные источники | доступные метеоданные, прогнозы, спутники | Желат. | Да (стандартные API) | Определяет «второй контур» адаптации |

**Правило:** всё, что связано с **юр.ответственностью, безопасностью и физически возможной агротехникой**, должно запрашиваться явно и не импутироваться (только временно — с низким confidence и запретом на подписание).

---

## A — Каноническая структура Техкарты (TOC)

### A.1 Структура разделов (уровень 1–3)

Используем пометки: `[M]` — обязательно, `[O]` — опционально, `[R]` — зависит от региона/типа рапса (озимый/яровой).

1. [M] Паспорт техкарты и договора  
   1.1 [M] Идентификация (юрлицо, поле, сезон)  
   1.2 [M] Стороны и роли (агроном, консультант, директор, ИИ-система)  
   1.3 [M] Цели урожая и качества (гипотеза)  
   1.4 [M] Версия, статус, даты, подписи  
2. [M] Контекст поля и хозяйства  
   2.1 [M] Юрлицо и хозяйство (короткий профиль)  
   2.2 [M] Поле: геометрия, почва, рельеф, дренаж  
   2.3 [M] История поля (предшественники, операции, урожай 3–5 лет)  
   2.4 [O] Ограничения по природоохранным зонам, водоохранным полосам  
3. [M] Региональный и климатический профиль  
   3.1 [M] Климатическая зона, суммарные температуры, осадки  
   3.2 [R] Риски перезимовки (для озимого рапса)  
   3.3 [R] Риски весенних/осенних заморозков, засухи, выпревания  
4. [M] Культура и семена  
   4.1 [M] Вид (рапс озимый/яровой), гибрид/сорт, группа спелости  
   4.2 [M] Требования производителя (минимальная/максимальная густота, глубина, сроки)  
   4.3 [O] Толерантности (болезни, гербициды, засуха/мороз)  
5. [M] План агротехники  
   5.1 [M] Обработка почвы (основная, предпосевная)  
   5.2 [M] Посев (норма, глубина, способ)  
   5.3 [M] Удобрения (по видам, фазам, методам внесения)  
   5.4 [M] СЗР (гербициды, фунгициды, инсектициды, регуляторы)  
   5.5 [M] Уборка и послеуборочная обработка  
   5.6 [O] Междурядная обработка, прикатывание, иные операции  
6. [M] Операционная модель (календарь)  
   6.1 [M] Сетевой график операций (Gantt/CPM)  
   6.2 [M] Ресурсная модель (техника, люди, смены)  
   6.3 [M] Окна по фенологическим фазам и погоде  
7. [M] Экономика и бюджет  
   7.1 [M] Бюджет входов (семена, удобрения, СЗР, топливо и работы, логистика и услуги, анализы)  
   7.2 [M] Доходная часть (целевой выход т/га, цена, сценарии)  
   7.3 [M] KPI и лимиты (себестоимость, маржа, допуски по перерасходу)  
8. [M] Риски и адаптивные правила  
   8.1 [M] Карта рисков (погода, болезни, техника, люди, рынок)  
   8.2 [M] Триггеры изменений техкарты (погода, NDVI, осмотры, цены)  
   8.3 [M] Алгоритм Change Order (что можно/нельзя менять, кто утверждает)  
9. [M] Наблюдения и доказательства  
   9.1 [M] План осмотров и мониторинга (поля, БПЛА, спутник)  
   9.2 [M] Требования к фиксации операций (акты, треки, фото, лаборатория)  
   9.3 [M] Отчётность и аудитный след  
10. [O] Приложения  
   10.1 [O] Протоколы лабораторий  
   10.2 [O] Карты почв, картограммы обеспеченности  
   10.3 [O] Исторические отчёты по урожайности и фактическим операциям  

### A.2 Матрица «раздел → владелец → источник → использование»

| Раздел (ур.1–2) | Цель | Кто заполняет | Источник данных | Как используется в исполнении |
|-----------------|------|---------------|-----------------|-------------------------------|
| Паспорт техкарты | Юр.значимость, привязка к сезону/полю | Консультант + юрист юрлица | Договор, ЕГРЮЛ, внутренние регламенты | Определяет ответственность, порядок изменений, применяется в спорах |
| Контекст поля   | Зафиксировать физические условия | Агроном хозяйства | Осмотры, карты, история из 1С/CRM | Ограничивает допустимые операции и техники |
| Региональный профиль | Задать рамки по погоде/рискам | ИИ + агроном | Климатические базы, региональные справочники | Рассчёт окон операций, рисков перезимовки |
| Культура и семена | Связать гипотезу урожая с генетикой | Агроном + консультант | Каталог производителя, договор поставки | Ограничения по нормам высева, СЗР, срокам сева |
| План агротехники | Описать «как» получить гипотезу | Консультант RAI + агроном | Методология, опыт, история хозяйства | Входит в операционный план, контроль исполнения |
| Операционная модель | Превратить план в график | ИИ + менеджер по производству | План агротехники, техника, люди | Диспетчеризация, приоритизация операций |
| Экономика и бюджет | Зафиксировать финансовую гипотезу | Экономист + директор | Цены, бюджеты, рынок | Контроль затрат, маржинальность, санкции |
| Риски и адаптация | Описать, когда и как менять план | Консультант + директор | История, риск-политика | Запуск Change Orders, управление отклонениями |
| Наблюдения и доказательства | Сделать техкарту проверяемой | Агроном, механизаторы | Моб.приложения, телематика, лаборатории | Проверка исполнения, база для бонусов/штрафов |

### A.3 Definition of Done (структура техкарты)

**Структура техкарты считается «готовой к внедрению», если:**

1. Все разделы с пометкой `[M]` формально описаны и имеют определённые владельцы и источники данных.  
2. Для каждой операции в плане агротехники есть: входы, окно по фазе и погоде, допустимые нормы и проверки ошибок (несовместимость, превышения, пропуски).  
3. Операционная модель содержит связный сетевой график без «висящих» или конфликтующих операций, с привязкой к технике и людям.  
4. Бюджет закрывает все операции, а сумма затрат связана с целевой урожайностью и сценариями цен.  
5. Юридическая часть содержит: стороны, подписи, порядок изменений, ответственность, ссылку на цифровую операционную часть.  
6. Региональный профиль выбран, параметры связаны с расчётами окон и рисков.  
7. Определены форматы и каналы фиксации доказательств исполнения для всех критичных операций.  
8. В системе не осталось «обязательных полей без значения» (или они помечены как блокирующие публикацию техкарты в исполнение).

---

## B — Модель данных (Data Schema)

### B.1 Основные сущности и связи (ER-уровень)

- `LegalEntity` 1—N `Farm`  
- `Farm` 1—N `Field`  
- `Season` N—N `Field` через `CropPlan`  
- `CropPlan` 1—1 `TechMap`  
- `TechMap` 1—N `Operation`  
- `Operation` N—N `Input` через `Application`  
- `Operation` 1—N `MachineryAssignment` (агрегат+экипаж)  
- `Operation` 1—N `Observation` (до/во время/после)  
- `Observation` 0—N `Evidence`  
- `TechMap` 1—N `Approval`  
- `TechMap` 0—N `ChangeOrder`  
- `ChangeOrder` 1—N `Approval`, 0—N `Evidence`  
- `TechMap` 1—N `KPI` (плановые и фактические)  
- `Risk` связан с `TechMap` и/или отдельными `Operation`

### B.2 JSON-подобная схема (фрагменты)

Типизация:  
- `string`, `number`, `boolean`, `date`, `datetime`, `enum<X>`, `array<T>`, `object`.  
- Диапазоны и единицы — в комментариях.

```json
LegalEntity {
  id: string,
  name: string,
  tax_id: string,                 // ИНН/УНП
  registration_country: string,
  address: string,
  contact_person: string,
  risk_policy: enum<RiskPolicy>,  // CONSERVATIVE / BALANCED / AGGRESSIVE
  created_at: datetime,
  updated_at: datetime
}

Farm {
  id: string,
  legal_entity_id: string,
  name: string,
  region_profile_id: string,
  total_area_ha: number,          // ha, >0, <= 500000
  machinery_fleet_summary: string,
  labor_profile_summary: string,
  created_at: datetime,
  updated_at: datetime
}

Field {
  id: string,
  farm_id: string,
  name: string,
  cadastral_id: string,
  area_ha: number,                // ha, >0, <= 1000
  geometry_wkt: string,           // WKT/MultiPolygon
  slope_percent: number,          // %, 0–30
  drainage_class: enum<DrainageClass>,
  soil_profile_id: string,
  protected_zone_flags: array<enum<ProtectedZoneType>>,
  created_at: datetime,
  updated_at: datetime
}

Season {
  id: string,
  name: string,                   // "2026", "2026/27"
  start_date: date,
  end_date: date,
  is_winter: boolean
}

SoilProfile {
  id: string,
  field_id: string,
  sample_date: date,
  ph: number,                     // 3.5–9.0
  humus_percent: number,          // 0–15%
  p2o5_mg_kg: number,             // 0–1000
  k2o_mg_kg: number,              // 0–1000
  s_mg_kg: number,                // 0–500
  b_mg_kg: number,                // 0–10
  other_elements: object,
  bulk_density_g_cm3: number,     // 0.8–1.7
  provenance: Provenance,
  confidence: number              // 0–1
}

CropPlan {
  id: string,
  field_id: string,
  season_id: string,
  crop_type: enum<CropType>,      // RAPE_WINTER / RAPE_SPRING / …
  variety_hybrid: string,
  seed_supplier: string,
  target_yield_t_ha: number,      // т/га, >0, разумный верхний порог, напр. 0–10
  target_quality_class: string,
  assumptions: array<string>,
  constraints: array<string>,
  created_by_user_id: string,
  provenance: Provenance,
  confidence: number
}

TechMap {
  id: string,
  crop_plan_id: string,
  version: integer,
  status: enum<TechMapStatus>,    // DRAFT / UNDER_REVIEW / APPROVED / IN_EXECUTION / CLOSED
  created_by_user_id: string,
  approved_at: datetime | null,
  approved_by_user_id: string | null,
  legal_contract_ref: string,     // ссылка на подписываемую часть
  base_plan_hash: string,         // хэш неизменяемого ядра
  adaptive_rules: array<AdaptiveRule>,
  created_at: datetime,
  updated_at: datetime
}

Operation {
  id: string,
  tech_map_id: string,
  name: string,                    // "Основная обработка", "Посев"
  operation_type: enum<OperationType>,
  phase_window_from: enum<GrowthStageBBCH> | null,
  phase_window_to: enum<GrowthStageBBCH> | null,
  date_window_start: date | null,  // может вычисляться из регионального профиля
  date_window_end: date | null,
  weather_constraints: WeatherConstraints,
  dependencies: array<string>,     // id других Operation
  target_area_ha: number,
  machinery_requirement: MachineryRequirement,
  labor_requirement: LaborRequirement,
  planned_duration_hours: number,
  quality_criteria: array<string>,
  is_critical: boolean,
  error_conditions: array<string>, // правила, что считается ошибкой
  created_at: datetime,
  updated_at: datetime
}

Input {
  id: string,
  name: string,
  input_type: enum<InputType>,     // SEED / FERTILIZER / PESTICIDE / FUEL / SERVICE
  formulation: string,
  active_substances: array<string>,
  registration_number: string,
  supplier: string,
  legal_restrictions: array<string>
}

Application {
  id: string,
  operation_id: string,
  input_id: string,
  planned_rate_per_ha: number,     // кг/га, л/га, ед./га — с указанием units
  planned_rate_unit: enum<Unit>,   // KG_HA / L_HA / SEEDS_M2 и т.п.
  min_rate_per_ha: number | null,
  max_rate_per_ha: number | null,
  tank_mix_group_id: string | null,
  method: enum<ApplicationMethod>,
  stage_restriction_from: enum<GrowthStageBBCH> | null,
  stage_restriction_to: enum<GrowthStageBBCH> | null,
  safety_notes: string,
  provenance: Provenance,
  confidence: number
}

MachineryAssignment {
  id: string,
  operation_id: string,
  machinery_id: string,
  expected_capacity_ha_hour: number,
  fuel_rate_l_ha: number,
  crew_size: integer
}

Labor {
  id: string,
  role: enum<LaborRole>,           // TractorDriver, Agronomist, Scout
  name: string,
  qualification: string
}

Risk {
  id: string,
  tech_map_id: string,
  related_operation_id: string | null,
  risk_type: enum<RiskType>,
  probability: enum<RiskProbability>,
  impact: enum<RiskImpact>,
  mitigation: string,
  trigger_events: array<TriggerEvent>
}

KPI {
  id: string,
  tech_map_id: string,
  kpi_type: enum<KpiType>,         // COST_PER_HA / YIELD_T_HA / MARGIN_PER_HA / …
  planned_value: number,
  actual_value: number | null,
  unit: enum<Unit>,
  variance_abs: number | null,
  variance_pct: number | null
}

Observation {
  id: string,
  field_id: string,
  tech_map_id: string | null,
  operation_id: string | null,
  observation_type: enum<ObservationType>, // FIELD_SCOUT / SATELLITE / WEATHER / LAB
  datetime: datetime,
  growth_stage: enum<GrowthStageBBCH> | null,
  ndvi: number | null,             // 0–1
  pests_notes: string | null,
  weeds_notes: string | null,
  diseases_notes: string | null,
  soil_moisture_percent: number | null,
  attached_evidence_ids: array<string>,
  provenance: Provenance,
  confidence: number
}

Evidence {
  id: string,
  observation_id: string | null,
  operation_id: string | null,
  type: enum<EvidenceType>,        // PHOTO / GEO_TRACK / LAB_REPORT / INVOICE / WEATHER_API
  file_url: string,
  geo_point: string | null,        // WKT POINT
  captured_at: datetime,
  captured_by_user_id: string,
  checksum: string
}

Approval {
  id: string,
  entity_type: enum<ApprovedEntity>, // TECH_MAP / CHANGE_ORDER
  entity_id: string,
  approver_role: enum<ApproverRole>, // DIRECTOR / AGRONOMIST / LEGAL
  approver_user_id: string,
  decision: enum<ApprovalDecision>,  // APPROVED / REJECTED
  comment: string,
  decided_at: datetime
}

ChangeOrder {
  id: string,
  tech_map_id: string,
  version_from: integer,
  version_to: integer,
  reason: string,
  triggered_by_observation_id: string | null,
  change_type: enum<ChangeType>,     // SHIFT_DATE / CHANGE_INPUT / CHANGE_RATE / CANCEL_OPERATION / ADD_OPERATION
  diff_payload: object,              // машинночитаемый diff
  status: enum<ChangeStatus>,
  created_by_user_id: string,
  created_at: datetime,
  closed_at: datetime | null
}
```

### B.3 Enum’ы и словари

- `GrowthStageBBCH` — коды BBCH для рапса/канолы (0–9, с подстадиями), используем стандартную шкалу как внешний справочник.[web:1][web:2][web:6]  
- `OperationType` — SOIL_TILLAGE, SOWING, FERTILIZATION, PESTICIDE_APP, IRRIGATION, ROLLING, HARVEST, TRANSPORT, SCOUTING и др.  
- `InputType` — SEED, FERTILIZER_SOLID, FERTILIZER_LIQUID, PESTICIDE_HERBICIDE, PESTICIDE_FUNGICIDE, PESTICIDE_INSECTICIDE, GROWTH_REGULATOR, FUEL, SERVICE.  
- `ApplicationMethod` — BROADCAST, IN_FURROW, BAND, FOLIAR_SPRAY, SOIL_INJECTION, SEED_TREATMENT.  
- `RiskType` — WEATHER_FROST, WEATHER_DROUGHT, WEATHER_WATERLOGGING, PEST_INSECTS, PEST_DISEASES, PEST_WEEDS, MACHINERY_BREAKDOWN, LABOR_SHORTAGE, MARKET_PRICE_DROP и др.  
- `EvidenceType` — PHOTO, VIDEO, GEO_TRACK, LAB_REPORT, INVOICE, CONTRACT, WEATHER_API_SNAPSHOT, SATELLITE_IMAGE.  
- `Unit` — KG_HA, L_HA, T_HA, RUB_HA, RUB_T, PCT, SEEDS_M2 и др.  

### B.4 Провенанс и confidence

Универсальный объект:

```json
Provenance {
  source_type: enum<ProvenanceSource>,   // USER_INPUT / LAB / SATELLITE / TELEMATICS / MODEL / REGISTRY
  source_system: string,                 // "RAI-App", "AgroLab-XYZ"
  source_user_id: string | null,
  document_ref: string | null,           // № акта, протокола, файла
  collected_at: datetime,
  comment: string | null
}
```

**Правило:**  
- Все критические поля (почва, нормы внесения, фазовые окна, бюджет, KPI, юридические реквизиты) имеют `provenance` + `confidence`.  
- `confidence` интерпретируется одинаково во всех сущностях: 0–0.3 (грубо оценено/импутировано), 0.3–0.7 (экспертная оценка), 0.7–1.0 (подтверждено документами/измерениями).  
- В UI техкарты явное визуальное различие полей с низким и высоким confidence.

---

## C — Методология расчёта и «урожай как гипотеза»

### C.1 Гипотеза урожая

Гипотеза — это связка объектов:

- `CropPlan.target_yield_t_ha` и `target_quality_class`  
- список `assumptions` (например: «среднегодовые осадки в пределах региональной нормы», «нет экстремальных весенних заморозков»)  
- `constraints` (лимиты бюджета, доступность техники, нормы по регуляторике)  
- план по питанию/защите/агротехнике в виде набора `Operation` + `Application`.

**Логика:**  
1. На основе истории хозяйства и региональных эталонов задаётся реалистичный диапазон урожайности для конкретного поля (например, P10–P90).  
2. Целевая урожайность выбирается как точка в этом диапазоне, согласованная с риск-профилем юрлица.  
3. Все операции и бюджеты рассчитываются «от цели назад» (backward planning): чего нужно достичь по густоте, площади листьев, обеспеченности элементами, чтобы гипотезу реализовать.

### C.2 Вычисляемые элементы

Для каждой операции и входа:

- Норма (`planned_rate_per_ha`) → функция от:  
  - почвы (обеспеченность элементами, pH, гумус),  
  - целевой урожайности,  
  - рекомендаций производителя,  
  - региональных коэффициентов (климат, тип рапса, риск вымывания).  
- Сроки и окна:  
  - базовые календарные окна берутся из регионального профиля,  
  - уточняются по сумме температур/GDD и фенофазам по BBCH,  
  - учитывают доступность техники и людей.[web:3]  
- Зависимости:  
  - тип `FS` (finish-start), `SS` (start-start), `FF` (finish-finish) между операциями,  
  - минимальные и максимальные лаги в днях.  
- Критические пороги:  
  - влажность почвы для обработки (процент ПВК),  
  - температура воздуха/почвы для посева, внесения СЗР,  
  - диапазоны обеспеченности N/S/B и др. по анализам,  
  - пороги по вредителям/болезням/сорнякам для запуска защитных операций (ЭПВ — экономические пороги вредоносности, задаются как параметр, а не «истина»).

Все числовые границы задаются как **конфигурируемые**: в техкарте фиксируется значение + диапозон допустимых корректировок и ссылка на источник (этикетка, методички, внутренняя политика).

### C.3 Двухконтурность: базовый план + адаптивные правила

- **Базовый план**: `TechMap` с фиксированным набором операций, норм и окон (в фазах и календарных диапазонах).  
- **Адаптивный контур**: набор `AdaptiveRule` (часть `TechMap`), который описывает:

```json
AdaptiveRule {
  id: string,
  trigger_type: enum<TriggerType>,      // WEATHER, NDVI, OBSERVATION, PRICE
  condition: object,                    // выражение над полями Observation/Weather/KPI
  affected_operations: array<string>,   // изменяемые Operation.id
  change_template: object,              // что менять (сдвинуть окно, уменьшить/увеличить норму, добавить/отменить операцию)
  requires_approval_role: enum<ApproverRole> | null
}
```

Примеры триггеров (структурно):

- WEATHER: «если сумма осадков за последние 10 дней > X мм и прогноз ещё Y мм → перенести внесение N на ≤ 3 дня, либо уменьшить норму на Z%».  
- NDVI: «если NDVI на участке ниже порога в фазе BBCH 30–39 → вставить дополнительный осмотр или корректировку питания».  
- OBSERVATION: «если обнаружено более N личинок вредителя на m² → автоматически сгенерировать ChangeOrder на инсектицидную обработку».

### C.4 Что считается ошибкой (валидационные правила)

Класс ошибок:

1. **Несовместимые смеси**  
   - В одной `Application.tank_mix_group_id` присутствуют Inputs, помеченные как несовместимые (по справочнику смесей).  
2. **Превышение норм**  
   - `planned_rate_per_ha` выходит за пределы [min, max] из регистрационных ограничений и этикетки.  
3. **Пропуск критической операции**  
   - Операции с `is_critical = true` не имеют факта выполнения к концу окна фазы/даты.  
4. **Нарушение окна по фазе**  
   - Фактическая дата выполнения не соответствует допустимым фенофазам по BBCH, зафиксированным в `stage_restriction_from/to` и подтверждённым Observations.  
5. **Операции вне регуляторных ограничений**  
   - Операция внутри водоохранной зоны/буферной полосы с запрещённым СЗР.  
6. **Конфликт по ресурсам**  
   - Суммарная потребность в технике/людях в один интервал времени превышает доступные мощности.

Ошибки фиксируются как объекты `ValidationError` (могут быть частью техкарты/отчёта).

---

## D — Юридическая оболочка (Contract + Evidence)

### D.1 Что делает документ юридически значимым

Ключевые атрибуты:

- Идентификатор и версия `TechMap` (и связанного договора).  
- Стороны: юрлицо (заказчик), консультант/RAI (исполнитель/советник), возможные подрядчики.  
- Подписи (КЭП/электронные подписи) и даты утверждения `approved_at`.  
- Описание ответственности:  
  - за соблюдение технологической дисциплины,  
  - за принятие решений по Change Orders,  
  - за достоверность предоставленных данных.  
- Порядок изменений:  
  - что можно менять в рамках ChangeOrder без переподписания подписываемой части,  
  - что требует нового договора/допсоглашения.  

### D.2 Структура «подписываемой части» и «операционной части»

- **Подписываемая часть (Contract Core)** — неизменяемый (по hash) набор:  
  - идентификация сторон и поля,  
  - цель по урожайности и качеству,  
  - допустимые диапазоны затрат (бюджетные лимиты),  
  - перечень критических операций (обязательных к исполнению),  
  - правила ответственности и распределения рисков,  
  - порядок фиксации исполнения и разрешения споров,  
  - порядок и пределы изменений (ChangeOrder governance).  

- **Операционная часть (Execution Layer)** — изменяемая по протоколу:  
  - полный список операций и их календари,  
  - конкретные нормы внесения (внутри подписанных диапазонов),  
  - выбор конкретных продуктов (в рамках допустимых активных веществ),  
  - адаптивные правила, триггеры и сценарии,  
  - технические детали по технике и людям.  

Юридически: Contract Core подписывается КЭП, Execution Layer хранится в системе как версионируемый JSON, привязанный к hash, прописанному в Contract Core.

### D.3 Требования к доказательствам исполнения

Для операций с `is_critical = true` и/или влияющих на юр.ответственность:

- **Акты**: электронные акты выполненных работ с идентификаторами операций и агрегатов.  
- **Фото/геометки**: минимум X фото/видео с координатами и временем в пределах поля/контура операции.  
- **Треки техники**: GPS-треки агрегатов, связанные с Operation.id и временем.  
- **Накладные/счета**: документы, подтверждающие закупку и списание входов (Input).  
- **Лабораторные анализы**: протоколы по почве, растению, урожаю (качество/остатки СЗР).  
- **Погодные данные**: слепки состояния погодных API во время критических операций.

Все доказательства — сущность `Evidence`, связанная с `Operation`/`Observation`/`ChangeOrder`.

### D.4 Аудитный след

Для каждой изменяемой сущности (TechMap, Operation, Application, Budget, KPI, AdaptiveRule):

- фиксируется `created_at`, `updated_at`, `created_by`, `updated_by`;  
- каждая значимая правка формирует `ChangeOrder` или «микро-ревизию» (внутреннюю историю);  
- в `ChangeOrder` хранится:  
  - кто инициировал и когда,  
  - какая `Observation` или внешний фактор послужил основанием,  
  - как изменился объект (diff),  
  - кто одобрил/отклонил.

---

## E — Операционная модель исполнения (Ops)

### E.1 Разворачивание техкарты в календарь

На основе `Operation` и связей:

- строится сетевой график (узлы — операции, дуги — зависимости, веса — длительность/окна),  
- рассчитываются критический путь, буферы, ресурсные конфликты,  
- для каждого дня/недели формируется список задач с приоритизацией (по критичности и близости закрытия окон).

Структурно — объект `ScheduleEntry`:

```json
ScheduleEntry {
  date: date,
  operation_id: string,
  field_id: string,
  priority: enum<Priority>,        // HIGH / MEDIUM / LOW
  planned_start: datetime,
  planned_end: datetime,
  resource_allocation: {
    machinery_ids: array<string>,
    labor_ids: array<string>
  },
  sla_hours: number,               // целевой срок исполнения
  time_tolerance_hours: number     // допуск по смещению
}
```

### E.2 Шаблон операции в исполнении

Для каждой `Operation` описываем:

- **Входные данные (inputs)**:  
  - список `Application` (входы, нормы, методы),  
  - техника/экипаж, доступные окна по погоде и фазам.  
- **Pre-checks (до выезда/начала):**  
  - погодные условия в допустимом коридоре,  
  - техника исправна (TO сделано),  
  - есть подтверждённые остатки материалов на складе,  
  - нет несовместимых смесей в планируемом баке.  
- **Допуски:**  
  - по дате/времени (окно +/− Х часов/дней),  
  - по скорости, давлению, норме внесения (диапазон),  
  - по отклонению от запланированной площади.  
- **Контроль качества (во время):**  
  - контрольная калибровка нормы,  
  - периодические фото/видео,  
  - выборочные осмотры поля.  
- **Post-checks (после):**  
  - сверка фактических норм по данным телематики/счетчиков,  
  - фиксация выполненной площади и времени,  
  - закрытие операции и генерация `Evidence`.  

Структурно дополняем `Operation` объектом:

```json
OperationExecutionProtocol {
  pre_checks: array<string>,
  in_process_checks: array<string>,
  post_checks: array<string>,
  completion_criteria: array<string>
}
```

### E.3 Протокол «ИИ → человек»

- Автоматизируются:  
  - расчёт окон операций, критического пути, базовых норм (на основе моделей и справочников),  
  - генерация списка недостающих данных,  
  - детекция ошибок (валидация) и предложение Change Orders,  
  - уведомления и напоминания по приближению окон.  
- Только с подтверждением агронома/директора:  
  - любые изменения в критических операциях и бюджетах,  
  - смена продуктов (СЗР, удобрения, семена),  
  - изменение целевой урожайности/качества,  
  - отмена операций или сокращение норм ниже безопасного минимума.  
- Полностью ручные решения (с подсказкой ИИ):  
  - споры о причинах недостижения урожайности,  
  - юридические разногласия,  
  - нестандартные риски (форс-мажор, санкции, регуляторные изменения).

---

## F — Регионализация (Калининград–Кавказ–Сибирь)

### F.1 Механизм региональных профилей

Вводим сущность `RegionProfile`:

```json
RegionProfile {
  id: string,
  name: string,
  climate_type: enum<ClimateType>,     // MARITIME_HUMID / STEPPE_DRY / CONTINENTAL_COLD / …
  gdd_base_temp_c: number,             // 0–10
  avg_gdd_season: number,              // сумма эффективных температур за вегетацию
  precipitation_index: number,         // 0–1, относительная влажность региона
  frost_risk_index: number,            // 0–1
  drought_risk_index: number,          // 0–1
  waterlogging_risk_index: number,     // 0–1
  typical_sowing_windows: object,      // структуру делаем параметрической, без конкретных дат
  overwintering_risk_profile: object,  // только для озимых
  major_diseases: array<string>,
  major_pests: array<string>,
  update_source: string,
  updated_at: datetime
}
```

Региональный профиль хранится отдельно от полей; поле ссылается на `region_profile_id`. Расчёты окон/рисков используют его параметры плюс фактическую погоду.

### F.2 Какие параметры влияют на расчёт

- `climate_type`, `avg_gdd_season`, `gdd_base_temp_c` → скорость прохождения фаз (BBCH) и длительность вегетации.  
- `precipitation_index`, `drought_risk_index`, `waterlogging_risk_index` → стратегия питания и защиты (формат и окна удобрений, приоритеты по болезням/корневым гнилям).  
- `frost_risk_index`, `overwintering_risk_profile` → сроки сева/уборки, выбор типов рапса, глубина и стратегия посева озимого.  
- `major_diseases`/`major_pests` → базовый набор профилактических/защитных операций.  

Обновление: из внешних баз (гидромет, агрометеорология), внутренних данных (фактические погоды/урожаи клиентов) и ручной калибровки экспертов.

### F.3 Примеры 3 профилей (с параметрами без дат)

1. **«Морской/влажный» (условно для западных прибрежных регионов)**  
   - `climate_type`: MARITIME_HUMID  
   - `avg_gdd_season`: средний, равномерно распределён  
   - `precipitation_index`: высокий  
   - `drought_risk_index`: низкий  
   - `waterlogging_risk_index`: средний–высокий  
   - `frost_risk_index`: низкий–средний (редкие экстремальные морозы)  
   - `overwintering_risk_profile`: риск выпревания, лёд на посевах, вымокание  
   - `major_diseases`: склеротиниоз, фомоз, альтернариоз  

2. **«Степной/засушливый» (условно для южных степей)**  
   - `climate_type`: STEPPE_DRY  
   - `avg_gdd_season`: высокий (быстрое накопление тепла)  
   - `precipitation_index`: низкий  
   - `drought_risk_index`: высокий  
   - `waterlogging_risk_index`: низкий  
   - `frost_risk_index`: низкий–средний (заморозки ограничены по времени)  
   - `overwintering_risk_profile`: вымерзание при малоснежных зимах и ветрах  
   - `major_diseases`: меньше «влажных» болезней, выше значение стресса от жары и вредителей-сосущих  

3. **«Континентальный/холодный» (условно для северных и восточных регионов)**  
   - `climate_type`: CONTINENTAL_COLD  
   - `avg_gdd_season`: ниже, короткая вегетация  
   - `precipitation_index`: средний  
   - `drought_risk_index`: средний  
   - `waterlogging_risk_index`: средний (талые воды, переувлажнение весной)  
   - `frost_risk_index`: высокий (зимние морозы, весенние/осенние заморозки)  
   - `overwintering_risk_profile`: высокий риск вымерзания, требуются зимостойкие гибриды и продуманная дата посева  
   - `major_diseases`: снежная плесень, корневые гнили, весенние инфекции при затяжной весне  

---

## G — Экономика, маржинальность и контроль бюджета

### G.1 Структура бюджета по техкарте

Вводим сущность `BudgetLine`:

```json
BudgetLine {
  id: string,
  tech_map_id: string,
  category: enum<BudgetCategory>,   // SEEDS / FERTILIZERS / PESTICIDES / FUEL / LABOR / RENT / LOGISTICS / ANALYSES / OTHER
  subcategory: string,
  planned_cost_rub: number,
  actual_cost_rub: number | null,
  unit_cost_rub: number | null,     // руб/кг, руб/л, руб/ч и т.п.
  quantity: number | null,
  unit: enum<Unit>,
  related_operation_id: string | null,
  variance_reason: string | null
}
```

Категории:

- Семена  
- Удобрения  
- СЗР  
- Топливо  
- Работы (собственные/подрядные)  
- Аренда земли и техники  
- Логистика и услуги (транспорт, сушка, хранение)  
- Анализы и сервис (лаборатории, консультирование, ИТ)

### G.2 KPI: план/факт, отклонения

Основные KPI на уровне `TechMap` и `Field`:

- Себестоимость на 1 га (руб/га) — `C_ha`.  
- Себестоимость на 1 т продукции (руб/т) — `C_t`.  
- Плановая и фактическая урожайность (т/га).  
- Плановый и фактический валовый доход (руб/га, руб/т).  
- Маржа (руб/га, руб/т) и маржинальность (%).  
- Отношение фактических затрат к бюджету по категориям — `actual/planned`.  

Каждый KPI хранит план и факт (см. сущность `KPI` выше).

### G.3 Правила перерасхода и Change Order

- **Перерасход по категории**:  
  - если `actual_cost_rub > planned_cost_rub * (1 + tolerance_pct)` → событие «перерасход», создаётся `ChangeOrder` или, если перерасход случился по факту (постфактум), — «incidence report».  
  - `tolerance_pct` задаётся в Contract Core по категориям.  
- **Что требует согласования заранее:**  
  - изменение норм СЗР/удобрений выше/ниже заданного коридора,  
  - смена продуктов на более дорогие,  
  - добавление новых операций.  
- **Оформление Change Order:**  
  - инициатор (агроном, директор, консультант, ИИ),  
  - обоснование (Observation,Weather,KPI),  
  - прогноз влияния на KPI (новые плановые `C_ha`, `Y_t_ha`, маржа),  
  - маршрут согласования по ролям,  
  - статус (черновик, на согласовании, утверждено/отклонено),  
  - привязка к версии техкарты.

---

## H — Мини-пример (на рапс)

### H.1 Входной контекст (пример)

- Юрлицо: ООО «АгроХ»  
- Хозяйство: АгроХ-Север, региональный профиль — CONTINENTAL_COLD  
- Поле: №12, площадь 85 га, легкосуглинистая почва, уклон до 3 %, без ирригации  
- Почва: pH 6.0, гумус 3.5 %, P и K на среднем уровне, S/B не измерялись (нужен анализ)  
- Предшественник: озимая пшеница, солома частично измельчена и распределена, предпосевная культивация  
- Культура: рапс озимый, гибрид средней зимостойкости  
- Техника: трактор 250 л.с., плуг, культиватор, сеялка зернотуковая, самоходный опрыскиватель, комбайн 6 м  
- Ограничения:  
  - лимит затрат на удобрения и СЗР — не более N руб/га (фиксируется числом),  
  - соседи — пчёловоды, ограничения по инсектицидам в цветение,  
  - высокие риски зимних морозов без устойчивого снежного покрова.

### H.2 Список запросов данных к агроному (Telegram-стиль)

- По полю №12:  
  - Актуальная карта границ? Есть ли проблемные зоны (засолённые, переувлажнённые)?  
  - Есть ли актуальный анализ почвы ≤ 2 лет? Если да — пришли фото/файл протокола.  
- По предшественнику:  
  - Какие СЗР применялись в прошлом сезоне (названия, нормы, сроки)?  
  - Были ли проблемы с падалицей рапса/сорняками, какими?  
- По гибриду рапса:  
  - Точный гибрид/сорт и производитель? Фото мешка/этикетки.  
  - Рекомендованная норма высева и глубина по рекомендации производителя?  
- По технике:  
  - Какая сеялка будет использоваться (марка, ширина, есть ли внесение удобрений)?  
  - Какая ширина захвата опрыскивателя и фактическая производительность в га/час?  
- По ограничениям:  
  - Есть ли водоохранные зоны/буферные полосы на поле?  
  - Лимит бюджета на удобрения и СЗР (руб/га) по внутреннему плану?  
- По людям:  
  - Сколько смен готово работать в пик посевной/обработок?  
  - Есть ли ночные смены или только дневные?  

(ИИ формирует этот список автоматически на основе недостающих полей в модели данных и выбранного регионального профиля.)

### H.3 Фрагмент техкарты: 10 операций (структурно)

Условный список `Operation` (поля упрощены, без конкретных чисел):

1. **Операция 1: Лущение стерни / обработка пожнивных остатков**  
   - `operation_type`: SOIL_TILLAGE  
   - `dependencies`: []  
   - `phase_window`: до посева (BBCH < 00)  
   - `inputs`: топливо, собственная техника  
   - `error_conditions`: превышение глубины обработки > допустимого, пропуск операции при наличии плотной соломы.  

2. **Операция 2: Почвенный анализ (если нет свежих данных)**  
   - `operation_type`: SAMPLING  
   - `dependencies`: Операция 1  
   - `inputs`: услуга лаборатории  
   - `is_critical`: true  
   - `evidence_required`: акт отбора проб, протокол анализа.  

3. **Операция 3: Основная обработка почвы под рапс**  
   - `operation_type`: SOIL_TILLAGE  
   - `dependencies`: 1 (и 2, если принято решение скорректировать агрофон)  
   - `weather_constraints`: допустимая влажность почвы, отсутствие переувлажнения  
   - `error_conditions`: выполнение на переувлажнённой почве, превышение скорости.  

4. **Операция 4: Внесение основного удобрения (до посева)**  
   - `operation_type`: FERTILIZATION  
   - `dependencies`: 3  
   - `Application`: NPK (конкретный продукт TBD, норма рассчитывается от цели и анализа почвы)  
   - `phase_window`: до посева  
   - `constraints`: норма в пределах законодательно допустимого и рекомендаций производителя.  

5. **Операция 5: Предпосевная обработка почвы**  
   - `operation_type`: SOIL_TILLAGE  
   - `dependencies`: 4  
   - `goal`: подготовить посевное ложе, выровнять, обеспечить заданную глубину заделки.  

6. **Операция 6: Посев озимого рапса**  
   - `operation_type`: SOWING  
   - `dependencies`: 5  
   - `phase_window`: до BBCH 09 (до появления всходов), календарное окно из регионального профиля  
   - `Application`: семена (норма высева рассчитывается от целей по густоте, риска перезимовки, качества выравнивания), возможное стартовое удобрение  
   - `weather_constraints`: температура почвы и влажность в допустимых пределах  
   - `is_critical`: true  
   - `error_conditions`: посев вне окна по температуре/влаге, выход за коридор густоты, неверная глубина.  

7. **Операция 7: Почвенный гербицид (при необходимости)**  
   - `operation_type`: PESTICIDE_APP  
   - `dependencies`: 6  
   - `phase_window`: до/во время ранних фаз BBCH 00–10 (в зависимости от продукта)  
   - `Application`: гербицид, норма и условия из этикетки  
   - `adaptive`: может быть включён/исключён по результатам истории сорняков и экономике.  

8. **Операция 8: Осенний инсектицид/фунгицид (по факту риска)**  
   - `operation_type`: PESTICIDE_APP  
   - `dependencies`: 6  
   - `phase_window`: BBCH 12–19  
   - `trigger`: появление вредителей/болезней по Observations и порогам  
   - `is_critical`: может быть критической при высоком риске региона.  

9. **Операция 9: Весенняя подкормка азотом**  
   - `operation_type`: FERTILIZATION  
   - `dependencies`: перезимовка (результаты весеннего осмотра)  
   - `phase_window`: BBCH 21–30  
   - `Application`: азотное удобрение, норма зависит от фактического состояния посевов (NDVI, густота, потери зимой).  

10. **Операция 10: Уборка рапса**  
    - `operation_type`: HARVEST  
    - `dependencies`: достижение фазы зрелости (BBCH 80–89) и погодные окна  
    - `inputs`: комбайн, топливо, транспорт  
    - `evidence_required`: треки комбайна, акты приёмки зерна, лабораторный анализ качества  
    - `error_conditions`: уборка при чрезмерной влажности, массовые потери от осыпания при запаздывании.

Каждая операция в полном объекте техкарты будет содержать: точные диапазоны норм/окон, ссылки на региональный профиль, указание источников норм (этикетки, методические рекомендации, внутренняя база RAI) и уровень confidence.

---

Эта архитектура позволяет техкарте одновременно быть: проектом урожая, цифровым контрактом, операционной моделью, юридически значимым документом и формализованной гипотезой достижения урожайности. Она опирается на стандартизированную фенологическую шкалу BBCH для кодирования фаз рапса и расчёта фазовых окон операций.[web:1][web:2][web:6]

Citations:
[1] [The growth stages of oilseed rape - AHDB](https://ahdb.org.uk/knowledge-library/the-growth-stages-of-oilseed-rape)  
[2] [[PDF] BBCH English - Masaf](https://www.masaf.gov.it/flex/AppData/WebLive/Agrometeo/MIEPFY800/BBCHengl2001.pdf)  
[3] [Canola growth stages | Canola Encyclopedia](https://www.canolacouncil.org/canola-encyclopedia/growth-stages/)  
[4] [[PDF] using bbch scale and growing degree days to identify the growth ...](https://js.ugd.edu.mk/index.php/YFA/article/download/5740/4882)  
[5] [[PDF] Crop Identification and BBCH Staging Manual: SMAP-12 Field ...](https://smapvex12.espaceweb.usherbrooke.ca/BBCH_STAGING_MANUAL_GENERAL_ALL_CROPS.pdf)  
[6] [Crop Protection Online > Crop growth stages (BBCH-scale)](https://plantevaernonline.dlbr.dk/cp/SeasonPlan/CropScale.asp?id=djf&language=en)  
[7] [[PDF] Growth Stages of Mono- and Dicotyledonous Plants-a.pdf](https://www.julius-kuehn.de/media/Veroeffentlichungen/bbch%20epaper%20en/page.pdf)  
[8] [Rapeseed - Soiltech](https://soiltech.nl/en/crop/rapeseed/)
