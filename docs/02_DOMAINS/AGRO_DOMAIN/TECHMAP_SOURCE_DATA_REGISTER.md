---
id: DOC-DOM-AGRO-TECHMAP-SOURCE-DATA-REGISTER-20260402
layer: Domain
type: Domain Spec
status: approved
version: 1.0.0
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

## Назначение

Документ фиксирует полный перечень данных, которые используются при разработке техкарты, её генерации, валидации, исполнении и последующем контроле.

Документ нужен для трёх целей:
- понимать, какие данные обязательны до разработки техкарты;
- понимать, какие данные влияют только на адаптацию, экономику или runtime;
- не смешивать региональные, полевые, сезонные и фактические данные.

## Принцип уровней данных

Техкарта строится не на одном наборе данных, а на нескольких уровнях:

1. Хозяйство и организационный контекст.
2. Сезон и производственный план.
3. Поле и история поля.
4. Региональный агроклиматический слой.
5. Почвенно-полевой слой.
6. Сортовой и целевой производственный слой.
7. Ресурсно-логистический слой.
8. Экономический слой.
9. Runtime-данные исполнения, наблюдений и `Evidence`.

## Правило критичности

| Критичность | Смысл |
|---|---|
| `P0` | Без данных нельзя корректно допустить поле или построить техкарту. |
| `P1` | Техкарту можно построить, но качество адаптации, контроля или экономики будет снижено. |
| `P2` | Данные полезны для качества и explainability, но не обязаны блокировать разработку. |

## 1. Общий организационный и производственный контекст

| Блок | Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|---|
| Хозяйство | компания / хозяйство | Company / Account | до генерации | `P1` | tenant, ownership, маршрутизация согласований |
| Контакты | агроном, исполнитель, экономист | оргконтекст | до генерации | `P2` | коммуникация, handoff, approval |
| Сезон | сезон / год | Season | до генерации | `P0` | привязка техкарты ко времени |
| Производственный план | `harvestPlanId`, план культуры | HarvestPlan / CropPlan | до генерации | `P0` | источник цели, культуры, поля и сценария |

## 2. Идентификация поля и производственного объекта

| Блок | Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|---|
| Поле | `fieldId` | Field / CropZone | до генерации | `P0` | адресация техкарты |
| Поле | площадь | Field | до генерации | `P0` | нормы, бюджет, ресурсный расчёт |
| Поле | геометрия / границы | Field | до генерации и в сезоне | `P1` | геопривязка, execution, мониторинг |
| Поле | внутренний код поля | Field | до генерации | `P2` | операционный учёт и навигация |

## 3. Данные плана культуры

| Блок | Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|---|
| Культура | `CropType` | CropPlan / CropZone | до генерации | `P0` | broad identity культуры |
| Форма культуры | `CropForm` | CropPlan | до генерации | `P0` | выбор ветки `winter/spring` |
| Целевая урожайность | `target_yield` | CropPlan | до генерации | `P0` | нормы, экономика, адаптация |
| Сорт / гибрид | `variety_id` / hybrid ref | CropPlan | до генерации | `P0` | timing, phenology, risk profile |
| Лет без рапса | `rotation_years_since_rapeseed` | CropPlan / field history | до генерации | `P0` | admission rule по севообороту |

## 4. Региональный агроклиматический слой

Эти данные относятся только к `RegionProfile` и не должны смешиваться с почвенными показателями.

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| `agroclimatic_zone` | RegionProfile | до генерации | `P0` | выбор branch и зональная адаптация |
| `SAT_avg` | RegionProfile | до генерации | `P0` | объяснимый выбор `winter/spring`, zone-fit |
| тип зимы | RegionProfile | до генерации | `P1` | риск перезимовки |
| риск заморозков | RegionProfile | до генерации и в сезоне | `P1` | runtime monitoring и риск-профиль |
| риск засухи | RegionProfile | до генерации и в сезоне | `P1` | timing и защитные решения |
| паттерн осадков | RegionProfile | до генерации и в сезоне | `P1` | сроки операций и monitoring signals |
| региональные риски вредителей | RegionProfile | до генерации и в сезоне | `P2` | preventive monitoring |

## 5. Почвенно-полевой слой

Эти данные относятся только к `SoilProfile` и `FieldConditionProfile`.

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| `soil_texture` | SoilProfile | до генерации | `P0` | структура обработки и риски влаги |
| `pH` | SoilProfile | до генерации | `P0` | admission blocker и коррекция |
| `P_available` | SoilProfile | до генерации | `P0` | питание и базовая схема удобрений |
| `K_available` | SoilProfile | до генерации | `P0` | питание и устойчивость |
| `S_available` | SoilProfile | до генерации | `P0` | обязательность серы для рапса |
| `B_available` | SoilProfile | до генерации | `P0` | обязательность бора и адаптация |
| гумус | SoilProfile | до генерации | `P1` | качество адаптации и интерпретация почвы |
| `compaction` | SoilProfile | до генерации | `P0` | deep loosening и admission requirements |
| drainage / переувлажнение | SoilProfile / FieldCondition | до генерации | `P1` | timing, риск выпревания, мониторинг |
| свежесть анализа | SoilProfile metadata | до генерации | `P1` | доверие к данным, explainability |

## 6. История поля и фитосанитарный слой

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| предшественник | field history | до генерации | `P0` | admission rule и адаптация |
| история культур 3–5 лет | field history | до генерации | `P1` | ротация, риски, агрономическая интерпретация |
| наличие крестоцветных в истории | field history | до генерации | `P0` | rule `R-ADM-004` |
| `clubroot_history` | field history | до генерации | `P0` | absolute blocker / risk gate |
| история болезней | field history | до генерации | `P1` | preventive blocks и monitoring |
| история вредителей | field history | до генерации | `P1` | monitoring signals и thresholds |
| история проблем перезимовки | field history | до генерации | `P1` | ветка риска и контрольные точки |

## 7. Данные по сорту, гибриду и целевому сценарию

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| название сорта / гибрида | CropPlan / variety ref | до генерации | `P0` | спецификация техкарты |
| тип: сорт или гибрид | CropPlan / variety ref | до генерации | `P1` | агрономическая интерпретация |
| зимостойкость | variety ref | до генерации | `P1` | риск-профиль |
| склонность к полеганию | variety ref | до генерации | `P1` | регулирование роста и защита |
| устойчивость к болезням | variety ref | до генерации | `P1` | фунгицидная стратегия |
| плановая густота / норма высева | CropPlan / calculators | до генерации | `P1` | materialization операций |

## 8. Ресурсно-логистический слой

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| доступные удобрения | InputCatalog | до генерации | `P1` | materialization ресурсов |
| доступные СЗР | InputCatalog | до генерации | `P1` | материализация защитных операций |
| доступность техники | Machinery / ops context | до генерации | `P1` | исполнимость окон операций |
| наличие рапсовой жатки / стола | ops context | до генерации | `P1` | mandatory block `harvest_with_rapeseed_header` |
| кадровые ограничения | ops context | до генерации | `P2` | реалистичность плана |
| окна выполнения операций | ops context | до генерации | `P1` | календарь и длительности |

## 9. Экономический слой

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| бюджет на 1 га | Budget context | до генерации | `P1` | выбор альтернатив и приоритетов |
| общий лимит по карте | Budget context | до генерации | `P1` | проверка исполнимости |
| целевая маржа / рентабельность | KPI / economics | до генерации | `P2` | оптимизация сценария |
| приоритет хозяйства | business context | до генерации | `P2` | выбор между yield-first и cost-first |

## 10. Данные, обязательные для генерации рапсовой техкарты

Ниже перечислен минимальный рапсовый набор из канонической схемы.

| Параметр | Обязателен до генерации | Критичность | Используется в |
|---|---|---|---|
| `crop_form` | да | `P0` | branch selection |
| `agroclimatic_zone` | да | `P0` | admission и branch selection |
| `SAT_avg` | да | `P0` | branch selection |
| `soil_texture` | да | `P0` | static adaptation |
| `pH` | да | `P0` | admission |
| `P_available` | да | `P0` | nutrition design |
| `K_available` | да | `P0` | nutrition design |
| `S_available` | да | `P0` | sulfur requirement |
| `B_available` | да | `P0` | boron requirement |
| `predecessor` | да | `P0` | admission и adaptation |
| `rotation_years_since_rapeseed` | да | `P0` | admission |
| `clubroot_history` | да | `P0` | admission |
| `compaction` | да | `P0` | adaptation и mandatory blocks |

## 11. Данные, которые начинают работать во время сезона

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| `bbch_stage` | scouting / model | runtime | `P1` | control points, thresholds, signals |
| `plant_density` | scouting / drone | runtime | `P1` | пересчёт риска и рекомендаций |
| фактическая дата операции | execution | runtime | `P1` | сравнение плана и факта |
| фактический расход ресурса | execution | runtime | `P1` | budget и deviation |
| полевое наблюдение | FieldObservation | runtime | `P1` | recommendation и gate |
| `Evidence` | EvidenceService | runtime | `P1` | audit trail, definition of done |
| мониторинговый сигнал | MonitoringSignal | runtime | `P1` | trigger evaluation |

## 12. Данные explainability и governance

| Параметр | Где живёт | Этап использования | Критичность | Для чего нужен |
|---|---|---|---|---|
| `generationStrategy` | generation metadata | generation/read-path | `P1` | воспроизводимость |
| `schemaVersion` | generation metadata | generation/read-path | `P1` | version pinning |
| `ruleRegistryVersion` | generation metadata | generation/read-path | `P1` | auditability |
| `ontologyVersion` | generation metadata | generation/read-path | `P1` | semantic trace |
| `generationTraceId` | generation metadata | generation/read-path | `P1` | explainability |
| `FieldAdmissionResult` | explainability trace | generation/read-path | `P1` | объяснение допуска |
| `GenerationExplanationTrace` | explainability trace | generation/read-path | `P1` | объяснение branch и stage sequence |
| `RuleEvaluationTrace` | runtime trace | runtime | `P1` | почему сработало правило |
| `DecisionGate` | governance | runtime | `P1` | управляемое решение |
| `Recommendation` | runtime/governance | runtime | `P1` | explainable advisory |

## 13. Чего нельзя делать при сборе данных

- нельзя смешивать `SAT_avg` и `S_available` в одном «региональном профиле»;
- нельзя подставлять вымышленные значения вместо отсутствующих лабораторных данных;
- нельзя подменять форму культуры общим `CropType.RAPESEED`;
- нельзя считать historical notes достаточной заменой свежему анализу почвы;
- нельзя строить production-ready техкарту на данных без источника и даты.

## 14. Минимальные статусы полноты данных

| Статус | Смысл |
|---|---|
| `READY_FOR_GENERATION` | Есть весь обязательный набор `P0`. |
| `PASS_WITH_REQUIREMENTS` | Генерация допустима, но есть дефициты `P1`, которые должны быть видны в explainability. |
| `BLOCKED` | Не хватает хотя бы одного критического входа `P0` или правило admission блокирует посев. |

## 15. Практический вывод

Техкарта разрабатывается не только на агрохимии и плане сева.

Полноценная техкарта опирается одновременно на:
- данные хозяйства;
- данные поля;
- данные региона;
- историю поля;
- сортовой и целевой производственный контекст;
- ресурсы и бюджет;
- сезонные наблюдения;
- governance и explainability metadata.

Именно эта совокупность данных делает техкарту не шаблоном операций, а рабочим цифровым сценарием сезона.
