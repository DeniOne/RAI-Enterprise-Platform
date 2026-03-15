# RAI_EP: внешние цифровые сервисы и источники данных для усиления платформы

Версия: `2.0`  
Дата: `2026-03-15`

## Основа анализа

### Локальные документы

- `Gemini.md`
- `ChatGPT.md`
- `Цифровые сервисы для агрохозяйств  глобальный, ЕАЭС СНГ и рынок РФ.md`

### Код и архитектура RAI_EP

- `README.md`
- `apps/api/src/app.module.ts`
- `packages/prisma-client/schema.prisma`
- `apps/api/src/modules/field-registry/field-registry.service.ts`
- `apps/api/src/modules/tech-map/*`
- `apps/api/src/modules/satellite/*`
- `apps/api/src/modules/front-office/*`
- `apps/api/src/modules/generative-engine/yield/yield-forecast.service.ts`
- `apps/api/src/modules/rai-chat/tools/risk-tools.registry.ts`
- `apps/api/src/modules/finance-economy/integrations/application/integration.service.ts`
- `apps/api/src/modules/commerce/services/providers/dadata.provider.ts`
- `apps/web/app/(app)/front-office/*`
- `apps/web/package.json`
- `ingestion/README.md`

### Web-валидация

Проверены официальные product pages, docs, developer portals и help pages сервисов на дату анализа:

- `eos.com`
- `efdocs.exactfarming.com`
- `help.wialon.com`
- `doc.omnicomm.ru`
- `open-platform.cropwise.com`
- `developer.deere.com`
- `open-meteo.com`
- `power.larc.nasa.gov`
- `documentation.dataspace.copernicus.eu`
- `agrosignal.com`
- `geomir.ru`
- `solutions.1c.ru`
- `v8.1c.ru`
- `specagro.ru`
- `nspd.gov.ru`
- `rosreestr.gov.ru`
- `onesoil.ai`

## Как читать документ

- `Факт` — подтверждено кодом RAI_EP или официальным внешним источником.
- `Вывод` — прикладная интерпретация для RAI_EP.
- `Гипотеза` — вероятный вариант, но без достаточного подтверждения в публичной документации.
- `Repo-aware` — рекомендация дана не “в вакууме”, а с учетом текущих модулей, сущностей и ограничений RAI_EP.

---

## Часть 1. Executive Summary

### Жесткий вывод

`RAI_EP` уже выглядит как сильное цифровое ядро уровня `planning + execution + economics + evidence + front-office orchestration`, но пока не как полностью укомплектованная data platform для агробизнеса.

Самые заметные дефициты по коду:

- нет зрелого weather stack;
- нет готового land-bank / cadastre layer;
- нет production-grade ERP-коннектора;
- нет реального telematics layer;
- satellite есть как каркас ingestion/query, но не как законченный provider-backed data service;
- front-office уже зрелый как коммуникационный и evidence-слой, но еще не как GIS/value-rich клиентский кабинет.

### Какие внешние сервисы сильнее всего усилят RAI_EP

Приоритетный набор, если смотреть через призму текущего кода и time-to-value:

1. `1С:ERP АПК 2` как `system of record` для затрат, складов, НСИ, зарплаты, материалов, первички и факта.
2. `AgroSignal` как самый практичный российский operational layer по технике, факту работ, скаутингу, отклонениям и частично земельному банку.
3. `ГеоМир / История поля` как сильный российский field-history / land-bank / production layer для крупных холдингов.
4. `EOSDA API` как самый удобный внешний agri-data enrichment layer: индексы, imagery, weather, historical stats, VRA, white-label.
5. `ExactFarming Public API` как практичный API-first источник полевых, погодных и спутниковых сигналов для РФ/СНГ.
6. `Wialon` как наиболее прозрачный и зрелый telematics API layer.
7. `Omnicomm` как точный слой топлива, техники и эксплуатационного контроля, особенно для cost/fraud control.
8. `Open-Meteo + NASA POWER` как быстрый и дешевый weather/climate baseline.
9. `ЕФИС ЗСН + НСПД` как обязательный land/legal/compliance layer в российском контуре.
10. `Copernicus Data Space` как commodity EO infrastructure layer, особенно если RAI_EP захочет больше собственного контроля над remote sensing.

### Что интегрировать приоритетно

- `1С:ERP АПК 2`
- `AgroSignal`
- `EOSDA`
- `Wialon`
- `Open-Meteo`
- `ЕФИС ЗСН`
- `НСПД`

### Что подключать точечно

- `ГеоМир / История поля`
- `ExactFarming`
- `Omnicomm`
- `Copernicus Data Space`
- `Cropwise Open Platform`
- `John Deere Operations Center`
- `OneSoil`

### Что стратегически лучше строить внутри RAI_EP

- единый `Field Identity Graph`;
- `TechMap Intelligence` поверх внешних данных;
- `plan/fact/scenario economics`;
- `executive layer`;
- `front-office narrative UX`;
- `explainable alerts and recommendations`;
- единый слой нормализации внешних данных;
- cross-source audit/versioning и trust-scoring по данным.

### Прямой ответ на финальный вопрос

Сильнее всего `RAI_EP` усилят сервисы, которые не пытаются заменить RAI_EP целиком, а закрывают его внешние data gaps:

- по техкартам: `ЕФИС ЗСН`, `НСПД`, `AgroSignal`, `ГеоМир`, `EOSDA`, `ExactFarming`, `Open-Meteo`, `NASA POWER`, `1С`, `Wialon`, `Omnicomm`;
- по аналитике: `1С`, `AgroSignal`, `EOSDA`, `Wialon`, `Omnicomm`, `Copernicus`, `ФГИС Зерно`, `ExactFarming`;
- по фронтофису: `EOSDA`, `OneSoil`, `Open-Meteo`, `AgroSignal`, `НСПД`, `Cropwise`, точечно `John Deere`.

Главный принцип: `RAI_EP` не должен становиться еще одной FMS или еще одним NDVI-сервисом. Он должен стать `system of intelligence`, который связывает ERP, полевые операции, госслои, спутники, погоду, evidence и управленческий слой в одну объяснимую систему.

---

## Часть 2. Reverse Engineering текущего состояния RAI_EP

## 2.1. Что уже есть в архитектуре

### Факт

По `README.md`, `docker-compose.yml`, `package.json` и `apps/api/src/app.module.ts` проект уже построен как:

- `NestJS API`
- `Next.js 14 web`
- `PostgreSQL/PostGIS/pgvector`
- `Redis`
- `MinIO`
- `BullMQ / scheduler`
- multi-tenant контур
- event-driven связность через `Outbox`

### Факт

В `apps/api/src/app.module.ts` уже подключены доменные модули:

- `FieldRegistry`
- `Season`
- `TechMap`
- `FinanceEconomy`
- `Risk`
- `Satellite`
- `FieldObservation`
- `FrontOffice`
- `Consulting`
- `KnowledgeGraph`
- `Vision`
- `RaiChat`

### Вывод

Архитектура RAI_EP уже готова к внешним интеграциям. Проблема не в каркасе, а в отсутствии реальных агро-коннекторов и насыщенных data layers.

## 2.2. Какие сущности уже есть в модели данных

### Факт

В `packages/prisma-client/schema.prisma` уже есть ключевые сущности:

- `Field` (`model Field`, около строки `583`)
- `Season` (`729`)
- `TechMap` / `MapStage` / `MapOperation` (`2308`, `2372`, `2392`)
- `SoilProfile` (`2459`)
- `CropZone` (`2556`)
- `ExecutionRecord` (`2790`)
- `FieldObservation` (`3097`)
- `SatelliteObservation` (`4138`)
- `RiskSignal` / `RiskAssessment` (`4175`, `4194`)
- `HarvestResult` (`4469`)
- `FrontOfficeThread` (`5936`) и связанные front-office сущности

### Вывод

RAI_EP уже содержит почти все доменные якоря, в которые можно вставлять внешние данные. Внешние сервисы не требуют переписывать всю domain model, но требуют:

- новые таблицы связи с внешними системами;
- raw + normalized + derived слои;
- sync cursors;
- audit/versioning;
- identity mapping между внешними и внутренними полями/техникой/операциями.

## 2.3. Что подтверждается кодом как уже готовые integration points

| Observation | Evidence | Почему это важно |
|---|---|---|
| Есть global HTTP client с retry | `apps/api/src/shared/http/http-resilience.module.ts` | Можно быстро писать provider-clients для API |
| Есть `Outbox` | `apps/api/src/shared/outbox/*` | Подходит для webhook/event propagation и надежной доставки |
| Есть ingestion-воркер | `ingestion/README.md` | Есть задел под отдельный ingestion pipeline |
| Есть паттерн provider-adapter | `apps/api/src/modules/commerce/services/providers/dadata.provider.ts` | Можно тиражировать на agri-провайдеров |
| Есть event ingestion для satellite | `apps/api/src/modules/satellite/*` | Remote sensing уже встроен как доменная тема |
| Есть evidence-слой для полевых наблюдений | `apps/api/src/modules/field-observation/field-observation.service.ts` | Хорошая точка для скаутинга, телематики и фото/voice evidence |
| Есть front-office orchestration | `apps/api/src/modules/front-office/*` | Можно быстро превратить внешние сигналы в клиентскую ценность |
| Есть finance ingest contract | `apps/api/src/modules/finance-economy/integrations/application/integration.service.ts` | ERP/FMS/telematics можно заводить через event-contract подход |

## 2.4. Что код явно показывает как gap

| Gap | Evidence | Вывод |
|---|---|---|
| Поля пока почти не обогащаются внешними данными | `field-registry.service.ts:14-41` и `71-92` | Сейчас это CRUD + GeoJSON validation, не land intelligence |
| Yield / agronomic forecast питается моками | `yield-forecast.service.ts:27-28`, `44-57` | Нужны weather/soil/history providers |
| Weather в AI/risk слое пока stub | `risk-tools.registry.ts:82-93` | Нужен production weather integration |
| Front-office field page пока placeholder | `apps/web/app/(app)/front-office/fields/[id]/page.tsx:27-30` | Есть место для GIS, seasons, alerts, evidence, history |
| В web app нет зрелого map stack | `apps/web/package.json` | Нет признаков полноценного map/tiles front-end слоя |
| Ingestion worker пока без retries, DLQ и enrichment | `ingestion/README.md` | Для внешних интеграций нужна новая версия ingestion platform |
| TechMap generation пока blueprint-heavy | `tech-map.service.ts`, `tech-map-blueprint.ts` | Данных для real-world adaptive tech-map пока не хватает |

## 2.5. Итог reverse engineering

### Вывод

Текущее состояние `RAI_EP` можно описать так:

- `платформа готова интеграционно`;
- `домен уже богатый`;
- `многие сущности уже существуют`;
- `основной дефицит — внешние источники и integration infrastructure`;
- `front-office и executive layer имеют высокий потенциал, но пока не насыщены картой и живыми data feeds`.

---

## Часть 3. Ключевые gaps RAI_EP

| Категория gap | В чем дефицит | Как видно по коду/докам | Чем закрывать | Build / external | Приоритет |
|---|---|---|---|---|---|
| Поле и геоданные | Нет field master, который сводит кадастр, границы, историю, crop rotation и внешние IDs | `Field` есть, но вокруг него нет identity-linking layer | `ЕФИС ЗСН`, `НСПД`, `AgroSignal`, `ГеоМир`, `ExactFarming` | Гибрид | Очень высокий |
| Спутниковые данные | Есть только базовый ingestion/query каркас | `SatelliteObservation` есть, но нет внешнего provider pipeline | `EOSDA`, `Copernicus`, `Cropwise`, `ExactFarming` | Гибрид | Очень высокий |
| Земельный банк / кадастр | Нет зрелого legal/compliance слоя | `Field.cadastreNumber` есть, но без полноценного land-bank контекста | `НСПД`, `ЕФИС ЗСН`, точечно `ГеоМир` | Внешний + internal normalization | Очень высокий |
| Погода / климат / риски | Weather tool stub, forecast mock | кодовые заглушки в risk/yield | `Open-Meteo`, `NASA POWER`, точечно premium weather | Внешний | Очень высокий |
| Агрохимия / soil | `SoilProfile` есть, но нет стандартного pipeline импорта и нормализации | мало признаков реальных lab/polygon ingestion flows | lab CSV/XLSX/GeoJSON imports, `ExactFarming`, `CropX`, `ГеоМир` | Гибрид | Высокий |
| Техника / операции / телематика | Нет production connectors к telematics/FMS | есть `ExecutionRecord` и `FieldObservation.telemetryJson`, но нет feed | `Wialon`, `Omnicomm`, `AgroSignal`, OEM APIs | Внешний + internal normalization | Очень высокий |
| Техкарты | Есть ядро, но оно пока слабо data-driven | blueprint-heavy `tech-map` | внешние data layers + internal techmap intelligence | Гибрид | Очень высокий |
| Аналитика | Сильный фундамент, но мало живых внешних сигналов | есть economy/risk/front-office, но не хватает feeds | `1С`, `AgroSignal`, `EOSDA`, telematics, госслои | Гибрид | Очень высокий |
| Executive layer | Модули есть, но нужен richer management data fabric | сильная архитектура, но неполные входные данные | RAI_EP internal build поверх интеграций | Internal | Очень высокий |
| Фронтофис | Коммуникационный слой зрелый, визуальный data value layer слабый | field page placeholder, нет зрелого maps UI | `EOSDA`, `Open-Meteo`, `НСПД`, `AgroSignal` + internal UX | Гибрид | Очень высокий |
| Explainability / visualization | Нет unified layer “что происходит / почему / что делать” | отдельные сигналы есть, narrative layer нет | internal reasoning + evidence + dashboards | Internal | Очень высокий |
| Ingestion / integration infrastructure | Нет полноценного external integrations backbone | ingestion worker minimal | internal build | Internal | Очень высокий |

---

## Часть 4. Классификация внешних сервисов

### A. Data providers для техкарт

- `ЕФИС ЗСН`
- `НСПД / Росреестр`
- `AgroSignal`
- `ГеоМир / История поля`
- `ExactFarming`
- `EOSDA`
- `Open-Meteo`
- `NASA POWER`
- `Wialon`
- `Omnicomm`
- `OneSoil`
- `Cropwise Remote Sensing`

### B. Data providers для аналитики

- `1С:ERP АПК 2`
- `AgroSignal`
- `EOSDA`
- `ExactFarming`
- `Wialon`
- `Omnicomm`
- `ФГИС Зерно`
- `Copernicus Data Space`
- `John Deere Operations Center`

### C. UX/data layers для фронтофиса

- `EOSDA`
- `OneSoil`
- `Open-Meteo`
- `AgroSignal`
- `ExactFarming`
- `Cropwise`
- `НСПД`
- `John Deere`

### D. Infrastructure / integration enablers

- `1С platform` (`REST`, `HTTP-services`, `OData`, `Web-services`)
- `Wialon Remote API`
- `Omnicomm REST API`
- `Cropwise Open Platform`
- `Copernicus Data Space`
- `Open-Meteo`
- `NASA POWER`

### E. Сервисы, которые разумно интегрировать напрямую

- `EOSDA`
- `ExactFarming`
- `Wialon`
- `Omnicomm`
- `Open-Meteo`
- `Cropwise Open Platform`
- `Copernicus`

### F. Сервисы, которые лучше подключать через выгрузки

- `1С:ERP АПК 2` в тех случаях, где клиент не готов к API/OData
- `AgroSignal`, если не выдан partner REST key
- `ГеоМир / История поля`
- `OneSoil`
- лаборатории, агрохимия, yield maps, контурные shapefile-архивы
- часть госсистем РФ

### G. Сервисы, которые лучше использовать как референс и реализовать самим

- `executive cockpit` логика из лучших FMS
- `season compare / field timeline` UX-паттерны
- `alert narratives`
- `benchmark/scoring`
- `tech-map explanation engine`

### H. Сервисы, которые малополезны или практично слабы

- `Climate FieldView` для широкого российского сценария
- `xarvio`
- `Farmonaut`
- `Sencrop`
- `Tomorrow.io`
- `DTN`

Причина: либо слабая пригодность для РФ, либо плохая practical fit с текущим рынком/юридическим контуром, либо они не дают данных, которые критичнее уже существующих приоритетов.

---

## Часть 5. Таблица 1. Реестр сервисов

Сокращения источников:

- `G` — глобальный/РФ обзор рынка
- `C` — `ChatGPT.md`
- `M` — `Gemini.md`

| Сервис | Сегмент | Что дает | Источник исследования | Официальный сайт | Есть ли API | Есть ли выгрузки | SDK / webhooks / OEM | РФ-совместимость | Итоговая полезность |
|---|---|---|---|---|---|---|---|---|---|
| `1С:ERP АПК 2` | ERP / accounting | факт затрат, НСИ, склады, документы, зарплата | G, C, M | `solutions.1c.ru`, `v8.1c.ru` | Частично, platform-level | Да | Web-services / HTTP / OData platform-level | Очень высокая | Очень высокая |
| `AgroSignal` | FMS / operations | техника, задания, скаутинг, спутники, отклонения | G, C, M | `https://agrosignal.com/` | Да, partner REST подтвержден | Да | Integrations, 1C, partner API | Очень высокая | Очень высокая |
| `ГеоМир / История поля` | FMS / field history | история поля, land bank, планирование, производственный учет | G, C, M | `https://www.geomir.ru/` | Не подтверждено публично | Да | Проектные интеграции | Очень высокая | Очень высокая |
| `ExactFarming` | digital agronomy | поля, спутники, погода, field intelligence | G, C, M | `https://exactfarming.com/`, `https://efdocs.exactfarming.com/` | Да | Да | Public API | Высокая | Очень высокая |
| `EOSDA API` | agri data API | imagery, indices, weather, soil moisture, VRA, white-label | G, C, M | `https://eos.com/agriculture-api/` | Да | Да | White-label / API Connect | Средняя для РФ, высокая technically | Очень высокая |
| `Copernicus Data Space` | EO infrastructure | сырые Sentinel data, STAC/OData/subscriptions | G, C, M | `https://documentation.dataspace.copernicus.eu/` | Да | Да | OData / STAC / subscriptions | Средняя | Высокая |
| `Open-Meteo` | weather API | forecast, archive, geocoding | G, C, M | `https://open-meteo.com/en/docs` | Да | CSV/XLSX/JSON formats | Commercial API tier | Высокая | Очень высокая |
| `NASA POWER` | climate API | historical climate, ag-climate baselines | G, C, M | `https://power.larc.nasa.gov/docs/services/api/` | Да | CSV/XLSX/JSON/NetCDF | GIS / AWS datastore | Высокая | Высокая |
| `Wialon` | telematics | machine telemetry, reports, geofences, events | G, C, M | `https://help.wialon.com/en/api/user-guide/api-reference` | Да | Да | Remote API, tokens | Высокая | Очень высокая |
| `Omnicomm` | telematics / fuel | fuel, routes, vehicle telemetry, ERP integration | G, C, M | `https://doc.omnicomm.ru/ru/omnicomm_online-integration/rest_api` | Да | Да | REST API, JWT | Очень высокая | Очень высокая |
| `ЕФИС ЗСН` | gov land | agricultural land data, field-related official context | G, C, M | `https://specagro.ru/` | Не подтверждено публично как open API | Да / кабинет / institutional | Demo and institutional contour | Очень высокая | Очень высокая |
| `НСПД / Росреестр` | cadastral / legal GIS | parcels, cadastral context, legal checks | G, C, M | `https://nspd.gov.ru/`, `https://rosreestr.gov.ru/` | Публичный open API не подтвержден | Да / service access | Госдоступ / portals | Очень высокая | Очень высокая |
| `ФГИС Зерно` | compliance | traceability, grain batches, compliance chain | G, C, M | `https://specagro.ru/topics/fgis-zerno` | API usage подтверждается, docs публично ограничены | Да | Cabinet / API by contour | Очень высокая | Высокая |
| `Cropwise Open Platform` | ag platform APIs | fields, OAuth, remote sensing, AgInsights, map tiles | G, C, M | `https://open-platform.cropwise.com/` | Да | Да | OAuth, bearer, tile APIs | Средняя | Высокая |
| `John Deere Operations Center` | OEM data | field boundaries, machine data, yield data | G, C, M | `https://developer.deere.com/` | Да | Да | Developer portal, keys, production agreement | Низко-средняя | Средняя |
| `OneSoil` | satellite / VRA UX | field boundaries, imports, VRA maps, history | G, C, M | `https://onesoil.ai/`, `https://help.onesoil.ai/` | Public API не подтвержден | Да | JD integration, import/export | Средняя | Средняя |
| `Climate FieldView` | OEM agronomy | operations, yield maps, agronomy UX | G, C, M | `https://climatefieldview.com/` | Partner/OEM | Да | Partner | Низкая | Низко-средняя |
| `DTN` | premium weather | ag weather intelligence | G, C, M | `https://www.dtn.com/` | Да | Да | Enterprise | Низкая для РФ | Средняя |
| `Tomorrow.io` | premium weather | alerting, weather intelligence | G, C, M | `https://www.tomorrow.io/weather-api/` | Да | Да | API | Низкая для РФ | Средняя |
| `CropX` | soil sensors | soil moisture and agronomy signals | G, C, M | `https://www.cropx.com/` | Да/partner | Да | Hardware + platform | Низко-средняя | Средняя |
| `xarvio` | agronomy assistant | recommendations / agronomy | G, C, M | `https://www.xarvio.com/` | Не главный путь | Ограниченно | Ecosystem | Низкая | Низкая |
| `Farmonaut` | satellite agronomy | remote monitoring | G, C, M | `https://farmonaut.com/` | Да | Да | API | Низкая | Низкая |
| `Sencrop` | field weather | station data | G, C, M | `https://sencrop.com/` | Да | Да | API | Низкая | Низкая |

---

## Часть 6. Таблица 2. Сервис → интеграция в RAI_EP

| Сервис | Какой gap закрывает | Для какого модуля RAI_EP | Какие данные дает | Способ подключения | Тип auth | Условия доступа | Ограничения | Архитектурная точка интеграции | Итоговая рекомендация |
|---|---|---|---|---|---|---|---|---|---|
| `1С:ERP АПК 2` | факт затрат, НСИ, документы, материалы | `finance-economy`, `tech-map`, `consulting`, `executive` | cost facts, materials, payroll, inventory, reference data | OData/HTTP/web-services или file exchange | Зависит от конфигурации 1С | Клиентская 1С + внедренец | нет единого public API продукта | `erp-sync` module + normalized finance contracts | `Интегрировать приоритетно` |
| `AgroSignal` | операции, техника, задания, deviations | `execution`, `field-observation`, `front-office`, `risk` | machinery, works, scouting, plan/fact signals | REST API или partner exchange | partner key | По запросу / лицензия | partner-type access | `ops-integration` + `field observation ingest` | `Интегрировать приоритетно` |
| `ГеоМир / История поля` | field history, land bank, operational history | `field-registry`, `season`, `tech-map`, `executive` | field history, operations, land, planning context | project integration / exports | Не подтверждено публично | Через проект | слабый публичный dev contour | `land-bank` + `field master` layer | `Подключать через выгрузки/обмен файлами` |
| `ExactFarming` | weather + satellite + field intelligence | `risk`, `satellite`, `front-office`, `tech-map` | fields, images, satellite hub, weather-related signals | Public API | `Authorization: Token token=...` | Аккаунт + токен | точные rate limits публично не ясны | `exactfarming-client` + field mapping | `Интегрировать приоритетно` |
| `EOSDA` | remote sensing enrichment | `satellite`, `risk`, `front-office`, `analytics` | 15+ indices, imagery, weather, moisture, VRA | REST API | personal access key | Demo/trial by request, paid plans | pay-per-request | `remote-sensing provider` layer | `Интегрировать приоритетно` |
| `Copernicus` | commodity EO infrastructure | `satellite` | raw EO scenes, STAC/OData/subscriptions | OData/STAC/subscriptions | OIDC tokens | free tier + quotas | quotas/concurrency | `raw-eo-ingestion` pipeline | `Подключать как data provider` |
| `Open-Meteo` | production weather baseline | `risk`, `yield`, `tech-map`, `front-office` | forecast, archive, geocoding | REST API | none or API key on customer tier | open/free + commercial tier | production SLA only on customer API | `weather-service` | `Интегрировать приоритетно` |
| `NASA POWER` | climate baseline / history | `risk`, `analytics`, `tech-map` | climate history, climatology | REST API | none | open | response/rate constraints | `weather-climate enrichment` | `Подключать как data provider` |
| `Wialon` | machine telemetry | `execution`, `front-office`, `economy`, `risk` | units, trips, geofences, reports, events | Remote API | token login / session | Wialon account/token | API limits, session handling | `telematics-ingest` | `Интегрировать приоритетно` |
| `Omnicomm` | fuel and vehicle control | `execution`, `economy`, `anti-fraud` | telemetry, fuel, vehicles, groups | REST API | JWT token | Omnicomm Online access | public exact limits not fully open | `telematics-ingest` | `Интегрировать приоритетно` |
| `ЕФИС ЗСН` | official field/land context | `field-registry`, `legal`, `tech-map`, `executive` | official land data, field-related records | кабинет / institutional integration / exports | ЕСИА / institutional | госдоступ | public API unclear | `land-data normalization` layer | `Подключать как data provider` |
| `НСПД / Росреестр` | cadastral and legal layer | `field-registry`, `legal`, `front-office` | cadastral map, parcel data, restrictions | portal/service/export | account / госдоступ | зависит от сценария доступа | open API unclear, IP/regional factors possible | `land-bank legal layer` | `Подключать как data provider` |
| `ФГИС Зерно` | grain compliance | `logistics`, `executive`, `reports` | grain batch traceability | кабинет / API contour | ЕСИА / official | обязательный регуляторный контур | not open API-first | `compliance-sync` | `Использовать как источник данных` |
| `Cropwise Open Platform` | advanced ag APIs | `satellite`, `front-office`, `ag-insights` | fields, OAuth, remote sensing, map tiles, agronomic insights | REST APIs | OAuth2 / Bearer | OAuth credentials from Syngenta | partner/credential gating | `cropwise-client` | `Интегрировать точечно` |
| `John Deere` | OEM field and machine data | `yield`, `operations`, `front-office` | field boundaries, machine and user-linked OEM data | developer portal API | keys + contractual gating | developer agreement + production agreement | legal/commercial restrictions | `oem-ingest` | `Только через enterprise/partner model` |
| `OneSoil` | quick UX and file import layer | `front-office`, `tech-map`, `imports` | boundaries, history import, machinery file import | import/export + JD link | user authorization | web account | public API not proven | `import-center` | `Интегрировать точечно` |

---

## Часть 7. Таблица 3. Build vs Integrate

| Функция / сервис | Интегрировать извне | Подключать через выгрузки | Делать самим | Гибридная стратегия | Почему | Что стратегически лучше |
|---|---|---|---|---|---|---|
| ERP-факты и первичка | Да | Да | Нет | Да | это уже есть у клиента, свой ERP не нужен | `Integrate` |
| Telematics raw feed | Да | Да | Нет | Да | не moat для RAI_EP | `Integrate` |
| Сырые спутниковые данные | Да | Нет | Нет | Да | commodity infra | `Integrate` |
| Weather/climate series | Да | Нет | Нет | Да | быстро и дешево брать готовое | `Integrate` |
| Land/cadastre/legal data | Да | Да | Нет | Да | государственный master-data слой | `Integrate` |
| Field identity graph | Нет | Нет | Да | Да | это собственная склейка внешних и внутренних сущностей | `Build` |
| TechMap intelligence | Частично | Да | Да | Да | внешние данные питают, но логика RAI_EP | `Hybrid with internal core` |
| Plan/fact economics | Частично | Да | Да | Да | ERP дает факты, но аналитика должна быть своей | `Hybrid with internal core` |
| Executive dashboards | Нет | Нет | Да | Нет | это дифференциатор RAI_EP | `Build` |
| Explainable alerts | Нет | Нет | Да | Да | внешние сигналы есть, объяснение должно быть своим | `Build` |
| Front-office UX | Частично | Да | Да | Да | данные извне, narrative/UX внутри | `Hybrid with internal dominance` |
| Benchmark / scoring | Частично | Да | Да | Да | нужен собственный scoring engine | `Hybrid` |
| Soil/lab imports | Нет | Да | Да | Да | API редки, файлы реалистичнее | `Hybrid` |
| Gov compliance connectors | Да | Да | Нет | Да | это внешний обязательный контур | `Integrate` |

---

## Часть 8. Таблица 4. Источники данных для техкарт

| Источник / сервис | Тип данных | Как именно использовать в техкартах | Формат получения | Частота обновления | Ограничения | Приоритет |
|---|---|---|---|---|---|---|
| `ЕФИС ЗСН` | official field/land context | валидация поля, правовой контекст, атрибуты поля | кабинет / выгрузки / institutional | сезонно и по мере изменений | доступ не fully API-first | Очень высокий |
| `НСПД / Росреестр` | кадастровые участки, ограничения | проверка кадастра, обременения, пересечения | portal/service/export | по запросу | open API unclear | Очень высокий |
| `AgroSignal` | фактические операции, техника | привязка шаблонов техкарт к реальным производственным циклам | API/exports | near-real-time | partner access | Очень высокий |
| `ГеоМир` | история поля и севооборот | enriched field history, crop rotation | exports/project | периодически | public API unclear | Высокий |
| `ExactFarming` | погодные/спутниковые сигналы | окна операций, неоднородность, предикаты рисков | API | регулярно | limits не fully clear | Высокий |
| `EOSDA` | indices, imagery, VRA, weather | zoning, crop health, risk windows, VRA inputs | API | регулярно | paid request model | Очень высокий |
| `Open-Meteo` | forecast/archive weather | GDD, rainfall, work windows | API JSON/CSV | hourly/daily | no dedicated SLA on free contour | Очень высокий |
| `NASA POWER` | climate history | baseline climate and long history | API | daily / on demand | latency depends on query size | Высокий |
| `Wialon` | machine movement and work evidence | plan/fact by operation, execution validation | API / reports | near-real-time | session/token handling | Очень высокий |
| `Omnicomm` | fuel and routes | norms, cost per op, anti-fraud, route realism | REST API | near-real-time | exact limits not open | Очень высокий |
| `OneSoil` | field boundaries/history imports | fast import of field history or external shapefiles | file import | ad hoc | no strong API contour | Средний |
| `Copernicus` | raw EO imagery | own NDVI/NDRE pipelines in RAI_EP | OData/STAC | batch/on demand | quotas | Средний |

---

## Часть 9. Таблица 5. Усиление аналитики

| Сервис | Какие сигналы/данные дает | Какую аналитику усиливает | Как интегрировать | Где хранить/обрабатывать | Приоритет |
|---|---|---|---|---|---|
| `1С:ERP АПК 2` | cost facts, payroll, inventory, docs | field economics, margin, plan/fact, executive analytics | OData/web-services/files | normalized finance tables + marts | Очень высокий |
| `AgroSignal` | works, machine status, downtimes, scouting | operational analytics, deviations, execution analytics | API / partner exchange | ops events + field observation store | Очень высокий |
| `EOSDA` | indices, imagery stats, weather, VRA | agronomic analytics, early warning, anomaly detection | API | satellite normalized store + derived marts | Очень высокий |
| `ExactFarming` | field intelligence, satellite and weather context | agronomic analytics, compare seasons, risk scoring | API | provider-specific raw + normalized layer | Высокий |
| `Wialon` | telemetry and reports | machine performance, SLA/control analytics | Remote API | telemetry store + event normalization | Очень высокий |
| `Omnicomm` | fuel, route, utilization | cost leakage, anti-fraud, machine economics | REST API | telemetry/fuel marts | Очень высокий |
| `Open-Meteo` | forecast/archive | weather risk, windows, alerting | REST API | weather time series store | Очень высокий |
| `NASA POWER` | long historical climate | baseline yield/risk/climate analytics | REST API | climate history tables | Высокий |
| `ФГИС Зерно` | traceability/compliance | compliance analytics, executive controls | кабинет/API contour | compliance marts | Средний |
| `Cropwise Open Platform` | fields, remote sensing, agronomic models | advanced agronomic analytics | OAuth API | provider raw + normalized | Средний |
| `Copernicus` | raw EO | own remote sensing analytics | OData/STAC | object storage + raster metadata | Средний |
| `John Deere` | OEM machine/yield data | harvest analytics, OEM usage insights | developer API | oem normalized layer | Средний |

---

## Часть 10. Таблица 6. Фронтофис

| Сервис / слой данных / feature | Что видит пользователь | Какую ценность получает | Источник данных | Build / integrate / hybrid | Приоритет | Влияние на retention / perceived value / demo value |
|---|---|---|---|---|---|---|
| `Field health map` | цветной health status по полям | быстрое понимание “где проблема” | `EOSDA` / `ExactFarming` / `Cropwise` | Hybrid | Очень высокий | Очень сильное |
| `Weather work windows` | можно/нельзя работать, риск дождя/ветра | ежедневная операционная полезность | `Open-Meteo` | Integrate | Очень высокий | Очень сильное |
| `Field timeline` | сезон, операции, фото, отклонения, комментарии | превращает систему в живой operational log | internal + `AgroSignal` + `Wialon` | Build/Hybrid | Очень высокий | Очень сильное |
| `Land-bank view` | поле, кадастр, ограничения, документы | юридическая прозрачность и trust | `НСПД` + `ЕФИС` | Hybrid | Высокий | Сильное |
| `Execution status` | что выполнено, что просрочено, где отклонения | контроль дисциплины и доверия | `AgroSignal` / `Wialon` / `Omnicomm` | Hybrid | Очень высокий | Очень сильное |
| `Explainable alert` | “заморозок риск на поле X, операция Y под угрозой” | объяснимые действия вместо “красной лампочки” | internal + weather/satellite feeds | Build | Очень высокий | Очень сильное |
| `Season compare` | сезон к сезону по полю/культуре | высокая управленческая полезность | internal + `1С` + agronomy feeds | Build | Высокий | Сильное |
| `Premium map layers` | рельеф, зоны, VRA, change maps | wow и экспертность продукта | `EOSDA`, `Cropwise`, `OneSoil` | Hybrid | Высокий | Очень сильное |
| `Owner dashboard` | 5-7 hard KPI и топ-риски | value for CEO / owner | internal + all feeds | Build | Очень высокий | Очень сильное |
| `Evidence card` | фото, voice, GPS, machine trace, related task | доверие к данным и консультациям | internal + `FieldObservation` | Build | Очень высокий | Сильное |

### Low-hanging fruits для фронтофиса

- `Open-Meteo` work windows
- `EOSDA` / `ExactFarming` field health cards
- status-feed из `AgroSignal`
- land parcel overlay через `НСПД`

### Premium features

- productivity zones
- season compare
- executive risk narrative
- explainable operation deviations

### Differentiators

- `Field timeline + economics + evidence + weather + satellite` в одном экране
- CEO-ready interpretation вместо сырых карт
- единый trust layer по данным

### Что лучше выглядит на демо и в продаже

- live field map
- risk cards
- work window recommendations
- plan/fact execution ribbons
- season compare with money impact

---

## Часть 11. Таблица 7. Technical integration details

| Сервис | Endpoint / docs / способ доступа | Auth mechanism | Форматы данных | Pull / push / webhook / files | Требуемый integration layer | Риски | Комментарий |
|---|---|---|---|---|---|---|---|
| `ExactFarming` | `efdocs.exactfarming.com`, host `api.exactfarming.com` | `Authorization: Token token=...` | JSON | Pull | `exactfarming-client` | limits/details partly opaque | public docs подтверждены |
| `EOSDA` | `eos.com/agriculture-api` | personal access key | JSON, tiles, imagery metadata | Pull | `eosda-client` | pay-per-request | strong enrichment layer |
| `Wialon` | `help.wialon.com` Remote API, `token/login` | token -> session | JSON via POST | Pull | `wialon-client` | session management, API limits | mature and practical |
| `Omnicomm` | `doc.omnicomm.ru/.../rest_api` | JWT in `Authorization` | JSON | Pull | `omnicomm-client` | enterprise/project coordination | strong fuel layer |
| `Cropwise` | `open-platform.cropwise.com` | OAuth2 / Bearer | JSON, tiles, GeoJSON, SHP exports in some APIs | Pull | `cropwise-client` | credential gating | most transparent open ag platform after Wialon/Exact |
| `Copernicus` | OData, STAC, Subscriptions | OIDC/OAuth token | JSON, raster products | Pull + push subscriptions | `copernicus-ingest` | quotas, concurrency | infra, not end-user UX |
| `Open-Meteo` | `/v1/forecast`, docs open | none or API key on customer tier | JSON, CSV, XLSX | Pull | `weather-client` | SLA on free tier limited | ideal first weather source |
| `NASA POWER` | POWER APIs | none | JSON, CSV, ASCII, XLSX, NetCDF | Pull | `climate-client` | 429 and long response times | perfect baseline climate layer |
| `1С platform` | OData / HTTP services / web-services | platform/user credentials | XML, JSON, OData, files | Pull/push/files | `erp-sync` | project-specific variability | integration depends on client setup |
| `AgroSignal` | official site confirms partner REST API | partner key | JSON + likely file exchange | Pull / possible exchange | `agrosignal-client` | access gating | very strong Russian fit |
| `ЕФИС ЗСН` | institutional contour / cabinet | ESIA / institutional | exports / forms / docs | files / manual / institutional | `gov-sync` | public API contour unclear | must not overpromise automation |
| `НСПД` | portal/service access | account / госдоступ | map layers, cadastral outputs | manual / file / service access | `land-legal adapter` | open API not confirmed | use as land verification layer |

---

## Часть 12. Приоритетные integration designs

## 12.1. `1С:ERP АПК 2`

### 1. Что дает

- фактические затраты;
- НСИ;
- материалы и остатки;
- payroll и labor cost;
- первичные документы;
- внутренняя нормативная информация предприятия.

### 2. Зачем нужен RAI_EP

Чтобы связать `tech-map -> execution -> economics -> management decision`.

Без ERP-факта RAI_EP останется умным planning/evidence слоем, но не станет полноценной системой управленческой аналитики.

### 3. Какой gap закрывает

- economics gap;
- plan/fact gap;
- cost traceability gap;
- executive dashboard gap.

### 4. В какой модуль RAI_EP встраивается

- `finance-economy`
- `tech-map`
- `consulting`
- `front-office` для клиентских cost/execution summaries

### 5. Как именно подключается

#### Подтвержденные факты

- платформа `1С:Предприятие` поддерживает `REST`, `HTTP-services`, `Web-services`, `OData` и механизмы обмена;
- для `1С:ERP АПК 2` в публичном контуре не подтвержден единый “готовый внешний API продукта”, но техническая интеграция через платформу 1С реалистична;
- в экосистеме 1С интеграции почти всегда проектно-зависимы.

#### Repo-aware design

1. Создать модуль `apps/api/src/modules/integrations/erp-sync`.
2. Добавить сущности:
   - `ExternalConnection`
   - `ExternalSyncCursor`
   - `ExternalDocumentLink`
   - `ExternalReferenceLink`
3. Реализовать два контура:
   - `API/OData sync`
   - `file exchange sync` (`CSV/XLSX/XML/JSON`)
4. Нормализовать ERP-данные в существующие слои:
   - `BudgetPlan`
   - `ExecutionRecord`
   - cost events в `finance-economy`
   - reference mappings для `MapResource`
5. Публиковать изменения через `Outbox`.
6. Повесить nightly sync + ad hoc resync.

### 6. Условия подключения

- нужен доступ к конкретной конфигурации клиента;
- почти всегда нужен интегратор 1С или IT-служба клиента;
- схема auth зависит от публикации 1С;
- тарифы и доступ определяются у клиента, не у RAI_EP.

### 7. Что придется сделать в коде RAI_EP

- `erp-sync module`
- mapping registry `1C item -> RAI_EP resource`
- document replay / deduplication
- immutable import audit
- reconciliation UI для расхождений

### 8. Рекомендация

`Интегрировать приоритетно`

Стратегия: `hybrid`, где факт и НСИ берем извне, а аналитику и интерпретацию строим внутри RAI_EP.

## 12.2. `AgroSignal`

### 1. Что дает

- online operations;
- техника и датчики;
- скаутинг;
- отклонения;
- спутниковый и погодный контур;
- интеграции с `1С`, `ЕФГИС ЗСН`, `ФГИС Зерно`.

### 2. Зачем нужен RAI_EP

Это самый практичный российский ускоритель для получения факта полевых работ и operational evidence.

### 3. Какой gap закрывает

- operations gap;
- telemetry gap;
- scouting gap;
- deviations gap.

### 4. В какой модуль RAI_EP встраивается

- `field-observation`
- `front-office`
- `consulting/execution`
- `risk`
- `finance-economy`

### 5. Как именно подключается

#### Подтвержденные факты

- на официальном сайте указаны интеграции с `1С`, `ЕФГИС ЗСН`, `ФГИС Зерно`;
- в официальной статье про интеграцию с 1С прямо сказано, что у `AgroSignal` есть `REST API партнёрского типа`;
- на monitoring-сайте указаны `Экспорт данных и API`.

#### Repo-aware design

1. Создать `agrosignal-client` в новом `integrations/ops` контуре.
2. Завести `ExternalConnection` типа `AGROSIGNAL`.
3. Синхронизировать:
   - поля и внешние field IDs;
   - операции;
   - задания;
   - факты выполнения;
   - observations/scouting.
4. Писать:
   - в `ExecutionRecord`;
   - в `FieldObservation`;
   - агрегаты отклонений в `RiskSignal`;
   - клиентские обновления в `FrontOfficeThread` / read models.
5. Запускать:
   - near-real-time pull;
   - daily reconciliation;
   - evidence backfill.

### 6. Условия подключения

- доступ partner-type;
- нужна договоренность/лицензия;
- публичные детали rate limits не раскрыты;
- рекомендуется закладывать асинхронный pull, а не tight coupling.

### 7. Что придется сделать в коде RAI_EP

- `agrosignal-client`
- mapping `external operation -> internal execution event`
- import journal и dedupe
- UI блок “операция подтверждена внешним контуром”

### 8. Рекомендация

`Интегрировать приоритетно`

Это лучший short-term operational accelerator для RAI_EP в РФ-контуре.

## 12.3. `ГеоМир / История поля`

### 1. Что дает

- история поля;
- производственный учет;
- land-bank контекст;
- крупный холдинговый сценарий;
- deep Russian farm operations fit.

### 2. Зачем нужен RAI_EP

Чтобы быстро закрыть историю поля, севооборот, земельный банк и часть planning контекста в крупных хозяйствах.

### 3. Какой gap закрывает

- field history gap;
- land bank gap;
- crop rotation gap.

### 4. В какой модуль RAI_EP встраивается

- `field-registry`
- `season`
- `tech-map`
- `executive`

### 5. Как именно подключается

#### Подтвержденные факты

- официальный контур подтверждает, что `История поля` — облачный сервис сбора и анализа производственных данных;
- публичный developer/API contour почти не виден.

#### Repo-aware design

1. Использовать `exports-first` стратегию.
2. Создать `geomir-import` pipeline.
3. Поддержать импорты:
   - границ полей;
   - истории культур;
   - полевых операций;
   - документов/правового контекста, если доступны.
4. Нормализовать в:
   - `Field`
   - `Season`
   - `CropZone`
   - `ExecutionRecord`
5. Построить `field lineage` слой в RAI_EP.

### 6. Условия подключения

- проектное внедрение;
- enterprise sales motion;
- публичный API не подтвержден.

### 7. Что придется сделать в коде RAI_EP

- `field-master` module
- CSV/XLSX/GeoJSON/SHP import center
- merge/reconciliation UI

### 8. Рекомендация

`Подключать через выгрузки/обмен файлами`

Стратегия: брать данные, но не делать `ГеоМир` зависимостью ядра.

## 12.4. `ExactFarming`

### 1. Что дает

- поля;
- спутниковые и image hubs;
- weather-related context;
- платформенный контур цифровой агрономии;
- публичный API.

### 2. Зачем нужен RAI_EP

Это быстрый API-first способ добавить полевые и агрономические сигналы без тяжелого enterprise onboarding.

### 3. Какой gap закрывает

- weather + satellite enrichment;
- field intelligence;
- partial front-office value.

### 4. В какой модуль RAI_EP встраивается

- `satellite`
- `risk`
- `front-office`
- `tech-map`

### 5. Как именно подключается

#### Подтвержденные факты

- есть официальный `Exactfarming Public API`;
- host: `https://api.exactfarming.com`;
- запросы требуют заголовок `Authorization: Token token=...`;
- есть `Base Service`, `Image Hub`, `Satellite Hub`.

#### Repo-aware design

1. Создать `exactfarming-client`.
2. Завести table `ExternalFieldLink`.
3. Pull-синхронизация:
   - список полей;
   - imagery/statistics;
   - relevant field signals.
4. Нормализовать:
   - imagery/statistics -> `SatelliteObservation`
   - погодно-агрономические сигналы -> `RiskSignal`
   - field metadata -> `Field` / `Season`
5. Отдавать summarized cards во `FrontOffice`.

### 6. Условия подключения

- нужен аккаунт ExactFarming;
- нужен auth token;
- публичные ограничения по лимитам видны не полностью;
- network requirements опубликованы.

### 7. Что придется сделать в коде RAI_EP

- `exactfarming-client`
- field ID mapping
- sync jobs
- provider health monitoring

### 8. Рекомендация

`Интегрировать приоритетно`

Особенно хорош как стартовый practical API в РФ/СНГ.

## 12.5. `EOSDA API`

### 1. Что дает

- 15+ vegetation indices;
- imagery;
- weather;
- soil moisture;
- historical stats;
- VRA maps;
- white-label contour.

### 2. Зачем нужен RAI_EP

Это самый сильный внешний `data-enrichment` слой для спутникового и climate-aware продукта без необходимости строить весь EO stack с нуля.

### 3. Какой gap закрывает

- satellite gap;
- front-office map layer gap;
- weather enrichment gap;
- zoning/VRA gap.

### 4. В какой модуль RAI_EP встраивается

- `satellite`
- `risk`
- `front-office`
- `tech-map`
- `advisory`

### 5. Как именно подключается

#### Подтвержденные факты

- официальный agriculture API page подтверждает REST-based API;
- quick start включает `create an account and obtain your personal access key`;
- trial/demo доступен по запросу;
- есть white-label контур.

#### Repo-aware design

1. Создать `eosda-client`.
2. Создать внутренние слои:
   - `raw_scene_metadata`
   - `field_stat_snapshot`
   - `derived_risk_signal`
3. Pull по полям и AOI.
4. Нормализовать:
   - statistics -> `SatelliteObservation`
   - risk candidates -> `RiskSignal`
   - VRA zones -> new table `ManagementZone`
5. Хранить raster/tile references в object storage или metadata tables.
6. Поднимать front-office tiles/cards поверх normalized data, а не рендерить в UI напрямую из провайдера.

### 6. Условия подключения

- access key;
- коммерческая модель “платите за запросы”;
- free trial/demo by request;
- для white-label нужен отдельный sales contour.

### 7. Что придется сделать в коде RAI_EP

- `remote-sensing provider abstraction`
- caching
- scene deduplication
- tile proxy / signed URL strategy
- risk generation rules

### 8. Рекомендация

`Интегрировать приоритетно`

Стратегия: внешний data layer, собственная аналитика и UX поверх него.

## 12.6. `Open-Meteo + NASA POWER`

### 1. Что дают

- `Open-Meteo`: оперативный прогноз и архив;
- `NASA POWER`: длинные климатические ряды и climatology baseline.

### 2. Зачем нужны RAI_EP

Чтобы быстро закрыть погодный gap без vendor lock-in и без долгого enterprise onboarding.

### 3. Какой gap закрывают

- weather stack gap;
- yield/risk input gap;
- work windows gap.

### 4. В какой модуль RAI_EP встраиваются

- `risk`
- `generative-engine/yield`
- `tech-map`
- `front-office`

### 5. Как именно подключаются

#### Подтвержденные факты

- `Open-Meteo` публикует `/v1/forecast`, multiple coordinate support, JSON/CSV/XLSX и указывает, что на free contour API key не нужен;
- `NASA POWER` публикует REST API, возвращает JSON/CSV/XLSX/ASCII/NetCDF, имеет `429` и service limits.

#### Repo-aware design

1. Создать `weather-service`.
2. Разделить два слоя:
   - `short-term operational weather` from `Open-Meteo`
   - `historical climate baseline` from `NASA POWER`
3. Хранить в новых tables:
   - `WeatherSeries`
   - `ClimateBaseline`
4. Расчитывать derived metrics:
   - GDD
   - rainfall accumulation
   - field work windows
   - freeze/heat risk
5. Кормить ими:
   - `YieldForecastService`
   - `RiskSignal`
   - `TechMap adaptive windows`
   - `FrontOffice weather cards`

### 6. Условия подключения

- `Open-Meteo`: no key on open tier, customer API + key for commercial reserved infrastructure;
- `NASA POWER`: open usage, but quotas/timeouts/rate constraints apply.

### 7. Что придется сделать в коде RAI_EP

- `weather-service`
- backfill jobs
- spatial cache by field centroid / grid
- weather quality scoring

### 8. Рекомендация

`Интегрировать приоритетно`

Это лучший первый production weather stack для RAI_EP.

## 12.7. `Wialon`

### 1. Что дает

- телематика;
- объекты/units;
- trips;
- reports;
- geofences;
- Remote API.

### 2. Зачем нужен RAI_EP

Чтобы наконец получить надежный machine/event feed для подтверждения фактического выполнения работ.

### 3. Какой gap закрывает

- telematics gap;
- execution verification gap;
- machinery evidence gap.

### 4. В какой модуль RAI_EP встраивается

- `consulting/execution`
- `field-observation`
- `front-office`
- `finance-economy`

### 5. Как именно подключается

#### Подтвержденные факты

- официальная документация описывает `Remote API`;
- для Wialon Hosting используется `https://hst-api.wialon.com/`;
- login под токеном делается через `token/login`;
- API работает POST + JSON params;
- FAQ подтверждает наличие ограничений и рекомендацию держать сессию, а не логиниться на каждый запрос.

#### Repo-aware design

1. Создать `wialon-client`.
2. Хранить:
   - `ExternalAssetLink` для техники;
   - `TelematicsEvent`;
   - `MachineTrip`;
   - `GeofenceCrossing`.
3. Маппить geofences на `Field`.
4. Из event feed строить:
   - evidence для `ExecutionRecord`
   - utilization metrics
   - deviations в `RiskSignal`
5. При важных событиях публиковать в `Outbox`.

### 6. Условия подключения

- нужен токен и доступ к инстансу;
- ограничения по интенсивности запросов существуют;
- production access зависит от клиента/интегратора.

### 7. Что придется сделать в коде RAI_EP

- `telematics-ingest` module
- session/token refresher
- geofence matcher
- trip-to-operation inference engine

### 8. Рекомендация

`Интегрировать приоритетно`

Лучший telematics-first кандидат.

## 12.8. `Omnicomm`

### 1. Что дает

- транспорт и спецтехника;
- топливо;
- маршруты;
- группы ТС;
- ERP integration contour;
- открытый REST API.

### 2. Зачем нужен RAI_EP

Для контроля ГСМ, anti-fraud, route realism и unit economics.

### 3. Какой gap закрывает

- fuel control gap;
- equipment cost gap;
- anti-fraud gap.

### 4. В какой модуль RAI_EP встраивается

- `finance-economy`
- `consulting/execution`
- `front-office`

### 5. Как именно подключается

#### Подтвержденные факты

- Omnicomm публикует integration docs и рекомендует `REST API`;
- для методов кроме авторизации в `Authorization` передается `JWT token`;
- официально указано наличие ограничений на интенсивность запросов;
- продуктовый контур явно продвигает интеграцию с ERP.

#### Repo-aware design

1. Создать `omnicomm-client`.
2. Pull:
   - vehicles
   - fuel events
   - route/position data
3. Нормализовать в:
   - `TelematicsEvent`
   - `FuelConsumptionFact`
   - агрегаты на `ExecutionRecord`
4. Использовать в:
   - cost leakage detection
   - фактическая себестоимость операций
   - anti-fraud alerts

### 6. Условия подключения

- нужен Omnicomm Online доступ;
- exact public sandbox contour неочевиден;
- лимиты и enterprise aspects зависят от проекта.

### 7. Что придется сделать в коде RAI_EP

- отдельный fuel analytics pipeline
- machine/fuel anomaly rules
- reconciliation with ERP and operation plans

### 8. Рекомендация

`Интегрировать приоритетно`

Особенно ценно, если RAI_EP хочет быть сильным в `field economics`.

## 12.9. `ЕФИС ЗСН`

### 1. Что дает

- официальный государственный слой по землям сельхозназначения;
- контур идентификации полей и учета в российском регуляторном поле.

### 2. Зачем нужен RAI_EP

Чтобы `Field` в RAI_EP был не просто пользовательским polygon, а объектом с официальным контекстом.

### 3. Какой gap закрывает

- official land context gap;
- compliance gap;
- field validation gap.

### 4. В какой модуль RAI_EP встраивается

- `field-registry`
- `legal`
- `tech-map`
- `executive`

### 5. Как именно подключается

#### Подтвержденные факты

- официальный контур `specagro` подтверждает работу и развитие `ЕФИС/ЕФГИС ЗСН`;
- официальный контент `AgroSignal` подтверждает практику интеграции;
- публичный developer contour как open API не просматривается достаточно прозрачно.

#### Repo-aware design

1. Делать `institutional/export-first integration`.
2. Создать `gov-land-sync`.
3. Поддержать:
   - imports официальных field/land identifiers;
   - linkage to `Field.cadastreNumber`;
   - legal status snapshots;
   - document references.
4. Создать `LandParcel` и `LandParcelFieldLink`.
5. Публиковать mismatches и legal risks в `FrontOffice` и `Legal`.

### 6. Условия подключения

- ЕСИА / institutional access;
- возможны организационные ограничения;
- не стоит обещать API-first сценарий без проекта доступа.

### 7. Что придется сделать в коде RAI_EP

- `gov-land-sync`
- legal status store
- field-to-parcel reconciliation UI

### 8. Рекомендация

`Подключать как data provider`

Это обязательный внешний official layer, но не место для tight runtime dependency.

## 12.10. `НСПД / Росреестр`

### 1. Что дает

- кадастровый и пространственный контекст;
- legal checking;
- публичную картографическую основу для parcel verification.

### 2. Зачем нужен RAI_EP

Чтобы делать land-bank layer, ownership/lease checks и пересечения с ограничениями.

### 3. Какой gap закрывает

- cadastral gap;
- legal risk gap;
- visualization gap.

### 4. В какой модуль RAI_EP встраивается

- `field-registry`
- `legal`
- `front-office`

### 5. Как именно подключается

#### Подтвержденные факты

- официальный адрес системы — `nspd.gov.ru`;
- публичный developer/API contour не подтвержден достаточно прозрачно;
- practical access в РФ часто строится через портал, сервисы, документы и организационные процедуры.

#### Repo-aware design

1. Закладывать `service/export/manual-assisted` pattern.
2. Создать `land-legal adapter`.
3. Поддержать:
   - import cadastral parcel extracts;
   - intersection checks with field geometry;
   - legal risk flags in `Field.protectedZoneFlags` и related models.
4. Для front-office рендерить normalized layers, а не жить напрямую на НСПД.

### 6. Условия подключения

- портал/учетная запись/госдоступ;
- возможны ограничения по сети и региону;
- open API нельзя считать подтвержденным.

### 7. Что придется сделать в коде RAI_EP

- `LandParcel`
- `RestrictionArea`
- spatial validation jobs
- doc references for legal evidence

### 8. Рекомендация

`Подключать как data provider`

## 12.11. `Copernicus Data Space`

### 1. Что дает

- OData/STAC/catalog access;
- subscriptions;
- Sentinel Hub auth contour;
- raw EO infrastructure.

### 2. Зачем нужен RAI_EP

Чтобы иметь независимый EO backbone и не зависеть только от прикладных agri-vendors.

### 3. Какой gap закрывает

- raw EO dependency gap;
- cost/control gap in satellite stack.

### 4. В какой модуль RAI_EP встраивается

- `satellite`
- `analytics`

### 5. Как именно подключается

#### Подтвержденные факты

- есть `Token Generation` docs;
- есть `OData`, `STAC`, `Subscriptions`;
- для catalogue download нужен access token;
- есть quotas and limitations;
- `Subscriptions` поддерживают `PUSH` и `PULL`.

#### Repo-aware design

1. Создать `copernicus-ingest`.
2. Поддержать:
   - catalogue search;
   - product fetch;
   - subscription notifications;
   - object storage staging.
3. Запускать внутренний raster processing и генерацию derived stats.
4. Записывать derived values в `SatelliteObservation`.

### 6. Условия подключения

- аккаунт CDSE;
- token auth;
- quotas and concurrency limits;
- потребуется больше собственной data engineering работы.

### 7. Что придется сделать в коде RAI_EP

- raw raster pipeline
- storage lifecycle
- processing workers
- scene dedup/versioning

### 8. Рекомендация

`Подключать как data provider`

Стратегически сильно, practically не first-wave, если нужен быстрый product effect.

## 12.12. `Cropwise Open Platform` и `John Deere` как стратегические точечные интеграции

### Факт

- `Cropwise Open Platform` публикует OAuth2 auth guide, `api.cropwise.com`, Core Services, Remote Sensing, map tile endpoints и GeoJSON/Shapefile oriented use cases;
- `John Deere` публикует developer portal и API agreement с `Developer Key`, `Access Key` и обязательным `Production Agreement` для выхода к третьим сторонам.

### Вывод

- `Cropwise` реально можно интегрировать технически, но это не первый источник данных для РФ-контекста;
- `John Deere` интересен как OEM connector для конкретных крупных клиентов, но плохо подходит как массовый фундамент платформы.

### Рекомендация

- `Cropwise Open Platform` — `Интегрировать точечно`
- `John Deere` — `Только через enterprise/partner model`

---

## Часть 13. Что RAI_EP нужно добавить в код

## 13.1. Обязательные новые внутренние модули

- `integrations/core`
- `integrations/weather`
- `integrations/remote-sensing`
- `integrations/erp-sync`
- `integrations/telematics`
- `integrations/gov-sync`
- `field-master`
- `import-center`

## 13.2. Обязательные новые сущности

- `ExternalConnection`
- `ExternalSyncCursor`
- `ExternalFieldLink`
- `ExternalAssetLink`
- `LandParcel`
- `RestrictionArea`
- `WeatherSeries`
- `ClimateBaseline`
- `TelematicsEvent`
- `FuelConsumptionFact`
- `ManagementZone`
- `ImportBatch`
- `ImportIssue`
- `DataTrustScore`

## 13.3. Обязательные внутренние платформенные возможности

- retry + DLQ + replay для ingestion;
- provider health monitoring;
- idempotency;
- schema versioning;
- raw/normalized/derived storage model;
- manual reconciliation UI;
- trust/audit trail на каждую запись;
- tenant-safe credentials management.

---

## Часть 14. Оценочная модель

Критерии:

- `TM` — ценность для техкарт
- `AN` — ценность для аналитики
- `FO` — ценность для фронтофиса
- `AR` — совместимость с архитектурой RAI_EP
- `IN` — интеграционная реализуемость
- `AC` — доступность подключения
- `UD` — уникальность данных
- `RU` — пригодность для РФ
- `TTV` — скорость получения эффекта
- `ST` — стратегическая полезность

| Сервис | TM | AN | FO | AR | IN | AC | UD | RU | TTV | ST |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `1С:ERP АПК 2` | 8 | 10 | 6 | 9 | 7 | 6 | 8 | 10 | 8 | 10 |
| `AgroSignal` | 9 | 9 | 8 | 9 | 8 | 7 | 8 | 10 | 9 | 9 |
| `ГеоМир / История поля` | 9 | 8 | 7 | 8 | 5 | 4 | 8 | 10 | 6 | 8 |
| `ExactFarming` | 8 | 8 | 8 | 8 | 8 | 8 | 7 | 9 | 8 | 8 |
| `EOSDA` | 9 | 9 | 9 | 8 | 8 | 7 | 9 | 6 | 8 | 9 |
| `Wialon` | 7 | 9 | 7 | 9 | 9 | 8 | 7 | 9 | 9 | 9 |
| `Omnicomm` | 7 | 9 | 6 | 8 | 8 | 7 | 8 | 10 | 8 | 9 |
| `Open-Meteo` | 8 | 8 | 8 | 10 | 10 | 10 | 5 | 9 | 10 | 8 |
| `NASA POWER` | 7 | 8 | 4 | 10 | 9 | 10 | 6 | 9 | 8 | 7 |
| `ЕФИС ЗСН` | 9 | 7 | 6 | 8 | 5 | 4 | 9 | 10 | 6 | 9 |
| `НСПД / Росреестр` | 9 | 7 | 7 | 8 | 4 | 4 | 9 | 10 | 5 | 9 |
| `Copernicus` | 8 | 8 | 4 | 8 | 7 | 7 | 8 | 6 | 5 | 8 |
| `Cropwise Open Platform` | 7 | 8 | 8 | 8 | 8 | 6 | 8 | 5 | 6 | 7 |
| `John Deere` | 6 | 7 | 6 | 7 | 5 | 3 | 8 | 3 | 4 | 6 |
| `OneSoil` | 6 | 6 | 8 | 7 | 5 | 7 | 6 | 6 | 7 | 5 |

### Top-10 сервисов для интеграции

1. `AgroSignal`
2. `1С:ERP АПК 2`
3. `EOSDA`
4. `Wialon`
5. `Open-Meteo`
6. `Omnicomm`
7. `ExactFarming`
8. `ЕФИС ЗСН`
9. `НСПД / Росреестр`
10. `Copernicus Data Space`

### Top-10 data providers

1. `1С:ERP АПК 2`
2. `AgroSignal`
3. `EOSDA`
4. `Wialon`
5. `Open-Meteo`
6. `Omnicomm`
7. `ExactFarming`
8. `ЕФИС ЗСН`
9. `НСПД / Росреестр`
10. `NASA POWER`

### Top-10 фронтофисных усилителей

1. `EOSDA`
2. `Open-Meteo`
3. `AgroSignal`
4. `ExactFarming`
5. `НСПД`
6. `OneSoil`
7. `Cropwise`
8. `Wialon`
9. `1С` через internal dashboards
10. `John Deere` для OEM-heavy клиентов

### Top-10 функций, которые лучше реализовать внутри RAI_EP

1. `Field Identity Graph`
2. `TechMap Intelligence`
3. `Plan / Fact / Scenario Economics`
4. `Executive Cockpit`
5. `Explainable Alerts`
6. `Field Timeline`
7. `Data Trust / Audit Layer`
8. `Cross-source Deviation Engine`
9. `Front-office narrative UX`
10. `Import/Reconciliation Center`

---

## Часть 15. Priority roadmap

### Wave 1 — самое быстрое и ценное

- `Open-Meteo + NASA POWER`
- `EOSDA`
- `1С` file/API sync
- `Wialon`
- `НСПД` как land verification input
- новый internal `integration core`

### Wave 2 — стратегически сильные интеграции

- `AgroSignal`
- `ЕФИС ЗСН`
- `Omnicomm`
- `ExactFarming`
- `ФГИС Зерно`
- `front-office GIS/value layer`

### Wave 3 — что строить как moat

- `Field Identity Graph`
- `TechMap Intelligence`
- `Executive layer`
- `Explainability engine`
- `Cross-source scoring / benchmark`
- `internal satellite analytics over Copernicus as fallback/expansion path`

---

## Часть 16. Итоговый ответ

### Факты

- `RAI_EP` уже имеет зрелый доменный каркас, multi-tenant storage, outbox, ingestion-like контур, front-office orchestration и подходящие сущности для интеграций.
- Самые явные code-level gaps: weather, land-bank, telematics, ERP sync, satellite provider layer, richer GIS/front-office UX.
- У ряда сервисов есть подтвержденные официальные способы подключения:
  - `ExactFarming` — public API с token auth;
  - `EOSDA` — REST API с access key;
  - `Wialon` — Remote API с token login;
  - `Omnicomm` — REST API с JWT;
  - `Cropwise` — OAuth2/Bearer;
  - `Open-Meteo` и `NASA POWER` — open APIs;
  - `Copernicus` — OData/STAC/subscriptions;
  - `AgroSignal` — partner REST API подтвержден в официальном материале.

### Выводы

- Наиболее сильное усиление RAI_EP дадут `1С`, `AgroSignal`, `EOSDA`, `Wialon`, `Open-Meteo`, `Omnicomm`, `ЕФИС ЗСН`, `НСПД`.
- Самые критичные gaps по данным закрываются не одним сервисом, а связкой:
  - `1С` для экономики,
  - `AgroSignal/Wialon/Omnicomm` для операций и факта,
  - `EOSDA/Open-Meteo/NASA POWER` для агрономического enrichment,
  - `ЕФИС/НСПД` для land/legal слоя.
- Лучше брать извне:
  - weather/climate,
  - raw telematics,
  - raw EO,
  - official land and compliance data,
  - ERP факты.
- Стратегически лучше строить внутри:
  - field master,
  - explainability,
  - executive analytics,
  - front-office narrative,
  - plan/fact/scenario intelligence.

### Финальный ответ в одной фразе

Если смотреть на реальные документы, реальный код RAI_EP и официально подтвержденные способы интеграции, то сильнее всего платформу усилит не одна “волшебная FMS”, а связка `1С + AgroSignal + EOSDA + Wialon + Open-Meteo + Omnicomm + ЕФИС/НСПД`, где внешние сервисы дают данные и инфраструктурные слои, а сам `RAI_EP` должен строить поверх них собственные `tech-map intelligence`, `field identity graph`, `executive analytics`, `front-office` и `explainable decision layer`.
