---
id: DOC-DOM-AGRO-TECHMAP-SOURCE-DATA-REGISTER-20260402
layer: Domain
type: Domain Spec
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-04-02
claim_id: CLAIM-DOM-AGRO-TECHMAP-SOURCE-DATA-REGISTER-20260402
claim_status: asserted
verified_by: manual
last_verified: 2026-04-02
evidence_refs: docs/01_ARCHITECTURE/RAPESEED_ENGINE_INTEGRATION_MAP.md;docs/01_ARCHITECTURE/RAPESEED_TECHMAP_GENERATION_MIGRATION_PLAN.md;docs/00_STRATEGY/TECHMAP/rapeseed_techcard.schema.yaml;docs/00_STRATEGY/TECHMAP/RAPESEED_CANONICAL_RULE_REGISTRY.md;docs/00_STRATEGY/TECHMAP/RAPESEED_DOMAIN_ONTOLOGY.md;apps/api/src/modules/tech-map
---
# Полный перечень данных, на которых разрабатывается техкарта

## CLAIM
id: CLAIM-DOM-AGRO-TECHMAP-SOURCE-DATA-REGISTER-20260402
status: asserted
verified_by: manual
last_verified: 2026-04-02

## Таблица критичности

| Код | Значение |
|---|---|
| `P0` | без фактора генерация или допуск поля некорректны |
| `P1` | фактор нужен для качественной адаптации, экономики, контроля и explainability |
| `P2` | фактор желателен для уточнения сценария и повышения точности |

## 1. Реестр факторов для разработки техкарты

| Код | Слой | Фактор | Ед. | Тип значения | Примеры / допустимые значения | Обязательность | Используется в |
|---|---|---|---|---|---|---|---|
| T-001 | Хозяйство | компания / хозяйство |  | текст | название юрлица / группы | `P1` | tenant, ownership |
| T-002 | Сезон | сезон |  | `YYYY` | `2026` | `P0` | lifecycle карты |
| T-003 | Поле | `fieldId` |  | UUID / код | внутренний ID поля | `P0` | адресация карты |
| T-004 | Поле | площадь поля | га | число | `85.4` | `P0` | нормы, бюджет |
| T-005 | Поле | геометрия поля |  | polygon / карта | GIS-контур | `P1` | execution, monitoring |
| T-006 | План | `CropType` |  | enum | `RAPESEED` | `P0` | broad identity |
| T-007 | План | `CropForm` |  | enum | `RAPESEED_WINTER`, `RAPESEED_SPRING` | `P0` | branch selection |
| T-008 | План | целевая урожайность | т/га | число | `2.8`, `3.5`, `4.2` | `P0` | нормы, экономика |
| T-009 | План | сорт / гибрид |  | текст / ref | название гибрида | `P0` | phenology, risk profile |
| T-010 | Регион | `agroclimatic_zone` |  | код / текст | зона хозяйства | `P0` | branch selection |
| T-011 | Регион | `SAT_avg` | °C | число | `2400`, `2800`, `3200` | `P0` | branch selection |
| T-012 | Регион | тип зимы |  | enum | мягкая / средняя / жёсткая | `P1` | risk model |
| T-013 | Регион | риск заморозков |  | enum | низкий / средний / высокий | `P1` | monitoring |
| T-014 | Регион | риск засухи |  | enum | низкий / средний / высокий | `P1` | adaptation |
| T-015 | Почва | `soil_texture` |  | enum | `clay`, `medium_loam`, `sandy_loam` | `P0` | adaptation |
| T-016 | Почва | `pH` | pH | число | `5.2`, `5.8`, `6.4` | `P0` | admission |
| T-017 | Почва | гумус | % | число | `2.5`, `4.8` | `P1` | interpretation |
| T-018 | Почва | `P_available` | мг/кг | число | `18`, `35`, `60` | `P0` | nutrition |
| T-019 | Почва | `K_available` | мг/кг | число | `80`, `120`, `180` | `P0` | nutrition |
| T-020 | Почва | `S_available` | мг/кг | число | `5`, `10`, `20` | `P0` | sulfur planning |
| T-021 | Почва | `B_available` | мг/кг | число | `0.2`, `0.5`, `1.0` | `P0` | boron planning |
| T-022 | Почва | `compaction` |  | bool | да / нет | `P0` | tillage adaptation |
| T-023 | Почва | глубина уплотнения | см | число | `20`, `28`, `35` | `P1` | tillage depth |
| T-024 | Почва | drainage / переувлажнение |  | enum | нет / слабое / среднее / сильное | `P1` | risk and timing |
| T-025 | История поля | предшественник |  | enum / текст | пшеница, ячмень, горох | `P0` | admission |
| T-026 | История поля | лет без рапса | лет | integer | `1`, `2`, `4`, `6` | `P0` | rotation rule |
| T-027 | История поля | `clubroot_history` |  | bool | да / нет | `P0` | admission blocker |
| T-028 | История поля | история болезней |  | текст / список | склеротиниоз, альтернариоз | `P1` | protection |
| T-029 | История поля | история вредителей |  | текст / список | блошки, цветоед, скрытнохоботник | `P1` | monitoring |
| T-030 | История поля | история проблем перезимовки |  | текст / bool | да / нет / описание | `P1` | winter risk |
| T-031 | Ресурсы | доступные удобрения |  | список | аммиачная селитра, КАС, сульфат аммония | `P1` | materialization |
| T-032 | Ресурсы | доступные СЗР |  | список | гербициды, фунгициды, инсектициды | `P1` | materialization |
| T-033 | Техника | сеялка доступна |  | bool | да / нет | `P1` | executability |
| T-034 | Техника | производительность сева | га/сутки | число | `120`, `250` | `P2` | timing |
| T-035 | Техника | опрыскиватель доступен |  | bool | да / нет | `P1` | executability |
| T-036 | Техника | производительность опрыскивания | га/сутки | число | `300`, `800` | `P2` | timing |
| T-037 | Техника | рапсовый стол / жатка |  | bool | да / нет | `P1` | harvest block |
| T-038 | Экономика | бюджет на 1 га | руб/га | число | `25000`, `40000`, `65000` | `P1` | scenario selection |
| T-039 | Экономика | общий лимит | руб | число | `5000000` | `P2` | budget control |
| T-040 | Runtime | `bbch_stage` | BBCH | integer | `12`, `31`, `61` | `P1` | control points |
| T-041 | Runtime | `plant_density` | шт/м² | число | `25`, `40`, `55` | `P1` | adaptation, deviations |
| T-042 | Runtime | фактическая дата операции | дата | `YYYY-MM-DD` |  | `P1` | plan-fact |
| T-043 | Runtime | фактический расход ресурса | кг/га, л/га | число |  | `P1` | budget, deviations |
| T-044 | Runtime | `Evidence` |  | file / URL / media | фото, видео, акт, лаборатория | `P1` | governance |
| T-045 | Explainability | `generationStrategy` |  | enum | `canonical_schema`, `legacy_blueprint` | `P1` | auditability |
| T-046 | Explainability | `schemaVersion` |  | semver | `1.0.0` | `P1` | reproducibility |
| T-047 | Explainability | `ruleRegistryVersion` |  | semver | `1.0.0` | `P1` | auditability |
| T-048 | Explainability | `ontologyVersion` |  | semver | `1.0.0` | `P1` | semantic trace |
| T-049 | Explainability | `generationTraceId` |  | UUID | trace id | `P1` | explainability |
| T-050 | Governance | `FieldAdmissionResult` |  | enum | `PASS`, `PASS_WITH_REQUIREMENTS`, `BLOCKED` | `P1` | admission explanation |

## 2. Жёсткий набор факторов `P0` для рапсовой техкарты

| Код | Фактор | Минимум для заполнения | Если отсутствует |
|---|---|---|---|
| P0-001 | `CropForm` | озимый или яровой | нельзя выбрать ветку |
| P0-002 | Поле и сезон | однозначно определены | нельзя создать карту |
| P0-003 | `agroclimatic_zone` | задана | нельзя выбрать branch |
| P0-004 | `SAT_avg` | задана | ветка winter/spring не объяснима |
| P0-005 | `soil_texture` | задан | adaptation неполон |
| P0-006 | `pH` | задан | admission невозможен |
| P0-007 | `P_available` | задан | nutrition design неполон |
| P0-008 | `K_available` | задан | nutrition design неполон |
| P0-009 | `S_available` | задан | sulfur planning невозможен |
| P0-010 | `B_available` | задан | boron planning невозможен |
| P0-011 | Предшественник | задан | rotation gate невозможен |
| P0-012 | Лет без рапса | задано | rotation gate невозможен |
| P0-013 | `clubroot_history` | определено | admission риск неуправляем |
| P0-014 | `compaction` | определено | tillage adaptation неполон |
| P0-015 | Сорт / гибрид | определён | phenology и risk profile неполны |
| P0-016 | Целевая урожайность | задана | нельзя рассчитать нормы |

## 3. Семантическая граница источников

| Профиль | Факторы |
|---|---|
| `RegionProfile` | `agroclimatic_zone`, `SAT_avg`, тип зимы, риски заморозков и засухи |
| `SoilProfile` | `pH`, `P_available`, `K_available`, `S_available`, `B_available`, `compaction`, drainage |
| `CropPlan` | `CropType`, `CropForm`, сорт / гибрид, целевая урожайность |
| `Execution` | фактические даты, нормы, `Evidence`, наблюдения, отклонения |
