---
id: DOC-ARV-RAI-EP-EXTERNAL-SERVICES-DUE-DILIGENCE-7KCA
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# RAI_EP: продуктово-интеграционный due diligence внешних цифровых сервисов

Дата: 2026-03-15

Основа анализа:
- `Gemini.md`
- `ChatGPT.md`
- `Цифровые сервисы для агрохозяйств  глобальный, ЕАЭС СНГ и рынок РФ.md`
- официальные сайты, product pages, help center и developer/API материалы сервисов и data providers, проверенные на дату анализа

## Метод и правила чтения

- `Подтверждено`: есть официальный продуктовый, help или developer-контур, из которого видно, что сервис реально существует и имеет интеграционные признаки.
- `Вывод`: прикладная интерпретация для RAI_EP на основе подтвержденных функций.
- `Гипотеза`: у сервиса нет прозрачного публичного API-контура или региональная доступность неочевидна; тогда рекомендация дается с оговоркой.
- Важный принцип: RAI_EP выгоднее строить не как еще один изолированный FMS/карточку NDVI, а как `system of intelligence + integration layer + executive control tower` над ERP, телематикой, спутниками, госданными и полевой операционкой.

## Часть 1. Executive Summary

### Жесткий вывод

Наиболее сильное усиление для `RAI_EP` дают не "еще одни агросервисы целиком", а пять внешних слоев:

1. `System of record` по экономике и факту: `1С:ERP АПК 2`.
2. `Полевой operational layer` по операциям, технике, скаутингу и факту работ: `AgroSignal`, `ГеоМир / История поля`, `Wialon`, `Omnicomm`.
3. `Remote sensing + agri-climate enrichment`: `EOSDA API`, `Copernicus Data Space`, `Open-Meteo`, `NASA POWER`, точечно `ExactFarming`, `OneSoil`.
4. `Гос- и земельный data layer`: `ЕФИС ЗСН`, `ФГИС Зерно`, `НСПД / Росреестр`.
5. `OEM / open platform data`: `John Deere Operations Center`, `Cropwise Open Platform`, `Climate FieldView` там, где это реально доступно клиенту.

### Что интегрировать приоритетно

- `1С:ERP АПК 2` как основной источник фактических затрат, материалов, складов, норм, зарплаты, производственных транзакций и unit economics.
- `AgroSignal` или `ГеоМир / История поля` как ускоритель по операциям, технике, скаутингу, картам полей, факту работ и частично земельному банку.
- `EOSDA API + Copernicus + Open-Meteo/NASA POWER` как внешний data-enrichment слой для спутниковой, погодной и риск-аналитики.
- `Wialon` и/или `Omnicomm` как сырьевой поток телематики для контроля операций, реального выполнения и мониторинга техники.
- `ЕФИС ЗСН`, `ФГИС Зерно`, `НСПД` как обязательные госслои для РФ-контекста: границы, землепользование, регуляторика, зерновой контур, юридическая проверка земельного банка.

### Что брать через выгрузки / импорт, а не делать ставку на API-first

- `OneSoil`: полезен как быстрый слой карт, зон и VRA-логики, но в роли ядра интеграций для RAI_EP слабее, чем `EOSDA`.
- `Почвенные лаборатории`, агрохимия, локальные карты урожайности, справочники норм, закупочные прайсы, партнерские отчеты: регулярно грузить файлами, а не строить сложную real-time интеграцию.
- Часть госисточников РФ: практический путь часто не "открытый API", а кабинет, партнерская схема, формализованные выгрузки или организационный доступ.

### Что стратегически лучше писать внутри RAI_EP

- `Конструктор техкарт` и версия техкарты как управленческого объекта.
- `Field identity graph`: единая сущность поля, связывающая кадастр, внутренний идентификатор, фактические операции, историю культур, агрохимию и экономику.
- `Plan / fact / scenario economics` по полю, культуре, операции, сезону, холдингу.
- `Explainable insight layer`: не просто карта, а ответ "что произошло, почему, что делать, каков финансовый эффект".
- `Executive cockpit` для CEO / директора кластера / управляющей компании.
- `Front-office UX`: личный кабинет, таймлайн поля, алерты, сезонные сравнения, evidence-driven dashboards.

### Что интересно стратегически, но practically слабее

- `Cropwise`, `John Deere`, `Climate FieldView` полезны как OEM/open-platform источники и референсы, но как опора продукта в РФ несут географические, контрактные и доступностные риски.
- `Trimble Ag / NEXT Farming`, `xarvio`, `Farmonaut`, `Sencrop`, `Tomorrow.io`, `DTN` интересны точечно, но не должны определять архитектуру RAI_EP в РФ-контуре.

### Прямой ответ на финальный вопрос

Сильнее всего `RAI_EP` усилят:
- по техкартам: `ЕФИС ЗСН`, `НСПД`, `AgroSignal`, `ГеоМир`, `ExactFarming`, `EOSDA`, `Open-Meteo/NASA POWER`, `1С:ERP АПК 2`, `Wialon/Omnicomm`, импорты агрохимии и карт урожайности;
- по аналитике: `1С:ERP АПК 2`, `AgroSignal`, `Wialon/Omnicomm`, `EOSDA`, `Copernicus`, `ФГИС Зерно`, `ExactFarming`;
- по фронтофису: `EOSDA/OneSoil` для карт и health status, `Open-Meteo/DTN/Tomorrow.io` для окон работ и алертов, `AgroSignal/Wialon` для статусов операций, `НСПД/ЕФИС` для земельного банка, а UX и explainability надо строить внутри `RAI_EP`.

## Ключевые gaps RAI_EP, которые стоит закрывать внешними слоями

| Gap | В чем проблема | Чем закрывать | Лучший сервис / подход | Приоритет |
|---|---|---|---|---|
| Данные по полю | Поле не связано в одну сущность: границы, история, культуры, операции, затраты | Единый field master + импорты истории | `AgroSignal`, `ГеоМир`, `ExactFarming`, `ЕФИС ЗСН` | Очень высокий |
| Спутниковые / GIS данные | Нет стабильного слоя индексов, зон неоднородности, change detection | Внешний satellite stack + собственная аналитика | `EOSDA API`, `Copernicus`, точечно `OneSoil` | Очень высокий |
| Земельные / кадастровые данные | Нет надежного legal/map слоя по участкам, ограничениям, обременениям | Госданные + внутренний слой нормализации | `НСПД / Росреестр`, `ЕФИС ЗСН`, `ГеоМир` | Очень высокий |
| Погодные / климатические данные | Нет единого операционного и исторического weather stack | Open weather APIs + premium forecast where needed | `Open-Meteo`, `NASA POWER`, точечно `DTN`, `Tomorrow.io` | Очень высокий |
| Агрохимические данные | Нет стандартизированного плодородия, лабораторий, слоев по почве | Импорт лабораторий + собственная модель плодородия | CSV/XLSX/GeoJSON импорт, точечно `CropX` | Высокий |
| Данные по технике / операциям | Слабая доказательная база по фактическому выполнению работ | Телеематика + FMS + собственный контроль выполнения | `Wialon`, `Omnicomm`, `AgroSignal`, `John Deere` | Очень высокий |
| Справочники / нормативы | Нормы и технологические шаблоны разрознены | ERP/NSI + собственный конструктор техкарт | `1С:ERP АПК 2` + build in-house | Высокий |
| Economic / market / benchmarking data | Нет связки "операция -> деньги -> отклонение -> решение" | ERP факт + рыночные прайсы + собственная аналитика | `1С:ERP АПК 2`, supplier catalogs, marketplaces | Очень высокий |
| UX gaps фронтофиса | Пользователь видит мало ежедневной пользы и мало "живых" сигналов | Внешние data layers + свой UX | `EOSDA`, `Open-Meteo`, `AgroSignal`, `НСПД` + build | Очень высокий |
| Explainability / visualization | Карты без причинно-следственной интерпретации малоценны для руководителя | Собственный explainable layer поверх всех источников | Стратегически `build in-house` | Очень высокий |

## Часть 2. Реестр всех найденных сервисов, продуктов, платформ и data sources

### 2.1. Named services и платформы

| Сервис | Регион | Сегмент | Что дает | Интеграционный контур | Роль для RAI_EP | Итог |
|---|---|---|---|---|---|---|
| [AgroSignal](https://agrosignal.com) | РФ | FMS / monitoring / scouting / telematics | Карты полей, операции, агроскаутинг, техника, мониторинг, отчеты | Подтверждены интеграционные страницы, `1С`, госФГИС; публичный API не прозрачен | Полевой operational layer для РФ | Интегрировать приоритетно |
| [ExactFarming](https://exactfarming.com) | РФ / СНГ / global | Agri planning / monitoring / weather / VRA | Погода, карты, история, задания, агросигналы | Есть официальный `API` контур | Ускоритель техкарт и агрономического enrichment | Интегрировать приоритетно |
| [ГеоМир / История поля](https://www.geomir.ru/catalog/programmy-dlya-selskogo-khozyaystva/istoriya-polya/) | РФ | История полей / land bank / agri GIS | Поля, история, техника, агрономия, 1С и телематика | Подтверждены `1С` и телематические интеграции; публичный API неочевиден | Земельный и полевой реестр для РФ | Интегрировать приоритетно |
| [1С:ERP АПК 2](https://solutions.1c.ru/catalog/erpapk) | РФ | ERP / accounting / production economics | Производство, материалы, склады, финансы, зарплата, растениеводство | Сильный интеграционный контур `1С`, API/обмены зависят от проекта | Главный источник факта и экономики | Интегрировать приоритетно |
| [EOSDA Crop Monitoring / API](https://eos.com/products/crop-monitoring/) | Global | Remote sensing / weather / VRA | Индексы, погода, зонирование, мониторинг полей | Подтвержден `API`, white-label, developer contour | Data-enrichment слой высокого качества | Интегрировать приоритетно |
| [OneSoil](https://onesoil.ai) | Global | Satellite analytics / VRA | Индексы, продуктивные зоны, карты внесения | Экспортные сценарии и продуктовый контур видны; публичный API ограниченно прозрачен | UX и agronomy enrichment | Интегрировать точечно |
| [Cropwise](https://www.cropwise.com) | Global | Digital agronomy / operations / open platform | Операции, полевые данные, агрономия, аналитика | Подтвержден `Open Platform / API` | Сильный стратегический референс и точечный data source | Интегрировать точечно |
| [John Deere Operations Center](https://www.deere.com/en/technology-products/precision-ag-technology/operations-center/) | US / global | OEM machinery data | Операции, телематика, карты урожайности, техника | Подтвержден developer portal | OEM data source там, где клиент уже в экосистеме | Интегрировать точечно |
| [Climate FieldView](https://climatefieldview.com) | US / global | Digital agronomy / machine data | Карты, операции, анализ посевов и урожайности | Есть developer / integration contour | Источник OEM/field data, но слабее по РФ | Интегрировать точечно |
| [Wialon](https://wialon.com) + [Hecterra](https://hecterra.io) | СНГ / global | Telematics / agri operations | GPS-треки, события, контроль работ, геозоны, агрологика | Подтвержден API и агронадстройка | Сырьевой слой мониторинга операций | Интегрировать приоритетно |
| [Omnicomm](https://omnicomm.ru) | РФ / СНГ | Fleet / fuel / telematics | Топливо, техника, перемещения, телеметрия | Подтвержден `REST API` и интеграционная документация | Сырьевой слой факта по технике | Интегрировать приоритетно |
| [ГЛОНАССсофт](https://www.glonasssoft.ru) | РФ | Telematics | GPS/ГЛОНАСС мониторинг, техника, датчики | Интеграционный контур есть, публичный API менее прозрачен | Альтернативный телематический источник | Использовать как источник данных |
| [Sky GloNASS](https://www.skyglonass.ru) | РФ | Telematics | Мониторинг техники, треки, датчики, отчеты | Интеграции вероятны, публичный developer контур слабый | Локальный телематический источник | Использовать как источник данных |
| [CropX](https://cropx.com) | Global | Soil sensing / irrigation / agronomy | Почвенные датчики, влага, irrigation, агрориски | API/partnership-контур зависит от тарифа и проекта | Нишевой агрохимико-почвенный слой | Интегрировать точечно |
| [GeoPard](https://geopard.tech) | EU / global | Field zoning / agronomy data | Полевая неоднородность, VRA, geo-analytics | Интеграционный контур есть, но не критичен для РФ | Узкий enrichment / benchmark | Использовать как референс / benchmark |
| [Trimble Ag / NEXT Farming](https://agriculture.trimble.com) | US / EU | FMS / machinery / farm ops | Планирование, техника, field records | Интеграции есть, но РФ fit низкий | Референс и точечный OEM source | Использовать как референс / benchmark |
| [Qoldau](https://qoldau.kz) | Казахстан | Agri gov / subsidy / digital platform | Госуслуги, субсидии, цифровой контур агро | Не универсальный API-source для RAI_EP | Региональный референс для ЕАЭС | Использовать как референс / benchmark |
| [Своё Фермерство](https://svoefermerstvo.ru) | РФ | Marketplace / agri ecosystem | Каталоги, сервисы, маркетплейс, финсервисы | API контур не основной фокус | Источник каталогов и партнерств | Интегрировать точечно |
| [Pole.rf](https://pole.rf) | РФ | Agri services ecosystem | Услуги, закупки, сервисный контур | Партнерский / marketplace сценарий | Точечный источник прайсов и сервисов | Использовать как источник данных |
| [JerInSpectr](https://jerinspectr.kz) | Казахстан | Agri digital / advisory | Локальные цифровые сервисы для хозяйств | Публичный developer contour ограничен | ЕАЭС-референс, не ядро | Нецелесообразно как базовый слой |
| [VERUM Agro](https://verum.kz) | Казахстан | Agri digital | Агроуправление / мониторинг | Ограниченно прозрачно | Региональный референс | Использовать как референс / benchmark |
| [Agro24](https://agro24.ru) | РФ | Marketplace / trading | Каталоги и закупочная среда | API не основной сценарий | Источник прайсов и поставщиков | Использовать как источник данных |
| [e-Agri-Trade](https://e-agri-trade.kz) | Казахстан | Marketplace / agri trade | Торговый и рыночный контур | Ограниченно прозрачно | Рыночный benchmark | Использовать как источник данных |
| [Росагролизинг](https://www.rosagroleasing.ru) | РФ | Equipment marketplace / finance | Техника, лизинг, каталоги | Интеграция не ключевая | Источник каталогов техники | Использовать как источник данных |
| [ФосАгро цифровые сервисы](https://www.phosagro.ru) | РФ | Inputs / advisory ecosystem | Удобрения, сервисы, сопровождение | Партнерская модель вероятнее API | Источник отраслевых рекомендаций и прайсов | Интегрировать точечно |
| [Soft.Farm / Digital Agro](https://soft.farm) | EU / global | FMS / data tools | Управление полями и данными | Ограниченно релевантно для РФ | Референс | Использовать как референс / benchmark |
| [Farmonaut](https://farmonaut.com) | India / global | Satellite / advisory | Мониторинг, алерты, агроконсалтинг | API / партнерский контур возможен | Дешевый альтернативный enrichment | Использовать как референс / benchmark |
| [xarvio](https://www.xarvio.com) | EU / global | Agronomy / decision support | Болезни, агрориски, рекомендации | Публичный API не основной сценарий | Референс по decision support | Использовать как референс / benchmark |
| [AgroScout](https://agroscout.ai) | Israel / global | AI scouting | Выявление проблем по полю и фото | Нишевое API/partnership | Нишевой слой для scouting | Интегрировать точечно |
| [SkyScout](https://www.skyscout.ai) | Global | Drone / imagery analytics | Аналитика снимков и мониторинг | Партнерский contour | Нишевый imaging-layer | Использовать как референс / benchmark |
| [DTN](https://www.dtn.com) | US / global | Weather / market intelligence | Погода, риски, market intelligence | Сильный B2B data-provider контур | Premium weather/risk слой | Интегрировать точечно |
| [Tomorrow.io](https://www.tomorrow.io) | US / global | Weather API | Прогнозы, weather intelligence | Подтвержден API | Premium weather layer | Интегрировать точечно |
| [Sencrop](https://sencrop.com) | EU | Weather stations / agri weather | Микропогода, станции, агрометео | Партнерская модель | Нишевый локальный weather layer | Интегрировать точечно |
| [weather.com](https://weather.com) | Global | Weather | Общая погода и прогнозы | Не лучший B2B архитектурный источник | Скорее UX/widget, чем ядро | Нецелесообразно как core source |
| [GalileoSky](https://galileosky.ru) | РФ | Telematics hardware | Терминалы, сенсоры, телематическое оборудование | Интеграции через партнеров и платформы | Инфраструктурный источник полевых событий | Использовать как источник данных |

### 2.2. Data providers, госисточники и инфраструктурные слои

| Источник | Регион | Что дает | Практический путь использования | Роль для RAI_EP | Итог |
|---|---|---|---|---|---|
| [ЕФИС ЗСН](https://efis.mcx.gov.ru) | РФ | Сведения о землях сельхозназначения, границы, usage-context | Через официальный контур, кабинет, институциональные интеграции | Обязательный госслой для полей и регуляторики | Использовать как источник данных |
| [ФГИС Зерно](https://fgiszerno.ru) | РФ | Контур зернового учета, партии, движения, регуляторные данные | Есть признаки API/кабинетного обмена | Важный compliance и traceability слой | Использовать как источник данных |
| [НСПД / Росреестр](https://nspd.gov.ru) | РФ | Кадастр, участки, ограничения, картографический legal слой | Публичные сервисы, доступы, выгрузки, организационный доступ | Критично для земельного банка | Использовать как источник данных |
| [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu) | EU / global | Sentinel imagery, EO data | Подтвержден API / official docs | Базовый спутниковый слой commodity-класса | Интегрировать приоритетно |
| [NASA POWER](https://power.larc.nasa.gov) | Global | Исторические агроклиматические и погодные ряды | Подтвержден API | Базовый климатический слой | Интегрировать приоритетно |
| [Open-Meteo](https://open-meteo.com) | Global | Forecast, archive, meteo APIs | Подтвержден API | Операционный погодный слой | Интегрировать приоритетно |
| Soil lab imports | Локально | Агрохимия, pH, гумус, NPK, микроэлементы | CSV/XLSX/GeoJSON/SHP загрузки | Критичный слой плодородия | Использовать как источник данных |
| Yield maps imports | Локально / OEM | Карты урожайности и производительности | OEM exports, SHP/ISOXML/CSV | Важны для VRA и экономики поля | Использовать как источник данных |
| Supplier catalogs / price feeds | РФ / СНГ | Цены, продукты, inputs, техника | CSV/XLSX/API/партнерство | Подпитка экономического слоя | Использовать как источник данных |

### 2.3. Классы решений из исследования

| Класс | Примеры | Какой вопрос RAI_EP закрывает |
|---|---|---|
| FMS / field operations | `AgroSignal`, `ГеоМир`, `Trimble`, `Cropwise` | Факт работ, операции, задания, история поля |
| ERP / accounting / production economics | `1С:ERP АПК 2` | Затраты, материалы, зарплата, unit economics |
| Remote sensing / GIS | `EOSDA`, `OneSoil`, `Copernicus`, `GeoPard` | Индексы, неоднородность, zoning, change detection |
| Telematics / fleet | `Wialon`, `Omnicomm`, `ГЛОНАССсофт`, `GalileoSky` | Контроль техники, треки, фактическое выполнение |
| OEM machine ecosystems | `John Deere`, `FieldView`, `Trimble` | Урожайность, машинные операции, закрытые экосистемы |
| Weather / climate | `Open-Meteo`, `NASA POWER`, `DTN`, `Tomorrow.io`, `Sencrop` | Окна работ, риски, климатические модели |
| Gov / compliance / land | `ЕФИС ЗСН`, `ФГИС Зерно`, `НСПД` | Правовой слой, traceability, регуляторика |
| Marketplace / supplier ecosystems | `Своё Фермерство`, `Pole.rf`, `Agro24`, `Росагролизинг` | Inputs, цены, партнерства, procurement signals |

### 2.4. Классификация сервисов по группам A-G

**A. Источники данных для техкарт**

`ЕФИС ЗСН`, `НСПД`, `AgroSignal`, `ГеоМир`, `ExactFarming`, `EOSDA`, `Copernicus`, `Open-Meteo`, `NASA POWER`, `1С:ERP АПК 2`, `Wialon`, `Omnicomm`, soil lab imports, yield map imports.

**B. Источники данных для аналитики**

`1С:ERP АПК 2`, `AgroSignal`, `Wialon`, `Omnicomm`, `EOSDA`, `ФГИС Зерно`, `ExactFarming`, `Open-Meteo`, `NASA POWER`, `John Deere`.

**C. Сервисы, усиливающие фронтофис**

`EOSDA`, `OneSoil`, `Open-Meteo`, `DTN`, `Tomorrow.io`, `AgroSignal`, `Wialon/Hecterra`, `НСПД`, `ExactFarming`.

**D. Интеграционные / инфраструктурные платформы**

`1С:ERP АПК 2`, `Wialon`, `Omnicomm`, `John Deere Operations Center`, `Cropwise Open Platform`, `Copernicus Data Space`, `Open-Meteo`, `NASA POWER`.

**E. Data-enrichment layer**

`EOSDA`, `ExactFarming`, `OneSoil`, `Open-Meteo`, `NASA POWER`, `DTN`, `Tomorrow.io`, `ФГИС Зерно`, supplier catalogs.

**F. Функции, которые целесообразно воспроизвести внутри RAI_EP**

Конструктор техкарт, сценарная экономика, explainability, executive dashboards, risk scoring, benchmarking, front-office experience, field timeline, alert prioritization, cross-source identity model.

**G. Сервисы, которые нецелесообразно использовать как ядро**

`weather.com` как core-source, `JerInSpectr`, `VERUM Agro`, `Soft.Farm`, часть зарубежных full-stack платформ без устойчивого РФ-контура. Их место: benchmark, reference или точечный партнерский слой.

## Часть 3. Таблица "Сервис -> ценность для RAI_EP"

| Сервис | Сегмент | Что дает | Какой gap закрывает | Модуль RAI_EP | Для кого | API / выгрузка / build | Приоритет | Итоговая рекомендация |
|---|---|---|---|---|---|---|---|---|
| `1С:ERP АПК 2` | ERP / economics | Факт затрат, материалы, нормы, производство, склады | Нет связки "операция -> деньги -> план-факт" | Экономика, техкарты, executive analytics | CFO, CEO, аналитик, внедренец | API/обмены `1С`, файлы, project integration | Очень высокий | Интегрировать приоритетно |
| `AgroSignal` | FMS / operations | Фактические операции, техника, scouting, карты, отчеты | Нет доказательного факта по работам и статусам | Операционный мониторинг, аналитика, фронтофис | Агроном, управляющий, CEO, фронтофис | API/партнерство/выгрузки | Очень высокий | Интегрировать приоритетно |
| `ГеоМир / История поля` | Land bank / field history | История полей, техника, 1С, телематика, геослой | Слабый field master и зембанк | Земельный банк, техкарты, история поля | Агроном, юрист, управляющий | Выгрузки, проектная интеграция, партнерство | Очень высокий | Интегрировать приоритетно |
| `ExactFarming` | Planning / weather / agri support | Погода, карты, история, агрориски, задания | Недостаток погодного и агрономического enrichment | Техкарты, риск-аналитика, фронтофис | Агроном, управляющий, клиент | `API`, файлы, гибрид | Высокий | Интегрировать приоритетно |
| `EOSDA API` | Satellite / weather API | EO data, indices, weather, VRA, white-label | Нет сильного GIS/enrichment слоя | GIS, аналитика, фронтофис, alerts | Аналитик, продукт, фронтофис | `API`, SDK/white-label | Очень высокий | Интегрировать приоритетно |
| `Copernicus Data Space` | EO data | Сырые снимки Sentinel | Нужен commodity satellite layer | GIS backend, historical analysis | Аналитик, data team | `API` | Высокий | Использовать как источник данных |
| `Open-Meteo` + `NASA POWER` | Weather / climate APIs | Forecast + archive + climate baseline | Нет единого weather stack | Техкарты, risk analytics, alerts | Агроном, аналитик, фронтофис | `API` | Очень высокий | Использовать как источник данных |
| `Wialon + Hecterra` | Telematics / agri ops | Треки, геозоны, события, контроль выполнения | Нет фактического контроля по операциям | Мониторинг работ, контроль техники | Операционный менеджер, диспетчер, CEO | `API`, webhooks, файлы | Очень высокий | Интегрировать приоритетно |
| `Omnicomm` | Fleet / fuel / telematics | Топливо, телеметрия, перемещения, техника | Нет надежного слоя факта по топливу и маршрутам | Контроль затрат, операций, антифрод | CFO, логист, служба эксплуатации | `REST API`, project integration | Очень высокий | Интегрировать приоритетно |
| `ЕФИС ЗСН` | Gov land data | Сведения о землях и usage-context | Нет официального слоя полей РФ | Земельный банк, техкарты, compliance | Юрист, внедренец, аналитик | Кабинет, институциональные интеграции, выгрузки | Очень высокий | Использовать как источник данных |
| `НСПД / Росреестр` | Cadastral / legal GIS | Участки, ограничения, картография | Нет legal layer земельного банка | Земельный банк, фронтофис, risk map | Юрист, CEO, управляющий | Публичные сервисы, выгрузки, организационный доступ | Очень высокий | Использовать как источник данных |
| `ФГИС Зерно` | Gov compliance | Traceability, партии, движения зерна | Нет зернового compliance и chain-of-custody | Compliance analytics, отчетность | Логистика, служба качества, CEO | API/кабинет/выгрузки | Высокий | Использовать как источник данных |
| `John Deere Operations Center` | OEM data | Machine ops, yield maps, machine telemetry | Нет OEM machine/yield layer | Аналитика урожайности, операции | Крупный клиент с Deere-парком | `API` | Средний | Интегрировать точечно |
| `Cropwise Open Platform` | Open platform | Полевые данные и интеграции | Нужен внешний open-platform data feed | OEM/partner integrations | Integration team, product | `API`, open platform | Средний | Интегрировать точечно |
| `OneSoil` | Satellite / VRA | Карты, зоны, prescriptions | Нужен быстрый front-office value layer | Фронтофис, agronomy UX | Клиент, агроном | Экспорт/импорт, вероятный partner access | Средний | Интегрировать точечно |
| `Climate FieldView` | OEM agronomy | Карты, операции, урожайность | OEM data gap | OEM connector, benchmark | Клиенты с доступом к экосистеме | `API` / partner | Низко-средний | Интегрировать точечно |
| `DTN` / `Tomorrow.io` | Premium weather | Risk/weather intelligence | Недостаток premium alerts | Фронтофис, risk engine | Клиент, agronomist, ops | `API` | Средний | Интегрировать точечно |
| `CropX` | Soil sensors | Влага, soil profile, irrigation | Нет живого почвенного слоя | Soil analytics, irrigation support | Агроном, R&D | API/partner/project | Низко-средний | Интегрировать точечно |

## Часть 4. Таблица "Build vs Integrate"

| Сервис / функция | Брать извне? | Почему | Способ подключения | Делать самим? | Что стратегически лучше | Комментарий |
|---|---|---|---|---|---|---|
| Сырые спутниковые данные | Да | Это commodity infrastructure, нет смысла поднимать собственные спутники | `Copernicus API`, `EOSDA API` | Нет | Интегрировать | Свой moat здесь не в сырье, а в аналитике и UX |
| Погодные и климатические ряды | Да | Быстрее и дешевле использовать готовые weather APIs | `Open-Meteo`, `NASA POWER`, точечно `DTN` | Нет | Интегрировать | Свой слой нужен только для нормализации и агрологики |
| Кадастрово-земельные данные | Да | Юридически и организационно это внешний master-data слой | `НСПД`, `Росреестр`, `ЕФИС ЗСН` | Нет | Интегрировать | Внутри нужен только land-bank intelligence слой |
| Телематика и raw machine events | Да | Это инфраструктурный data feed, не продуктовый moat RAI_EP | `Wialon`, `Omnicomm`, OEM APIs | Нет | Интегрировать | RAI_EP должен интерпретировать, а не заменять телематику |
| Фактическая экономика и учет | Да | У клиента уже есть ERP/1С, а не пустое поле | `1С:ERP АПК 2`, обмены, ETL | Нет | Интегрировать | RAI_EP должен стать уровнем анализа поверх учета |
| Field master и история поля | Гибрид | Частично берем извне, но сводный master должен жить в RAI_EP | `AgroSignal`, `ГеоМир`, `ExactFarming`, `ЕФИС` | Да, master-model | Гибрид | Самая правильная стратегия для long-term control |
| Техкарты и нормирование | Частично | Исходные нормы и справочники можно брать, но ядро продукта здесь | ERP imports + own model | Да | Реализовать самим | Это сильный кандидат на продуктовый moat |
| VRA / zoning logic | Гибрид | Индексы и baseline берем извне, зоны и рекомендации можно сделать самим | `EOSDA`, `OneSoil`, yield maps | Да | Гибрид | На старте брать внешние зоны, затем собственная логика |
| Executive analytics | Нет | Это не commodity, а как раз дифференциатор RAI_EP | Внутренний слой поверх всех источников | Да | Реализовать самим | Ключевая ценность для CEO и управляющей компании |
| Explainable insights | Нет | Внешние сервисы дают сигналы, не целостную управленческую интерпретацию | Внутренний reasoning + evidence layer | Да | Реализовать самим | Наиболее сильный differentiation-layer |
| Front-office личный кабинет | Гибрид | Данные берем извне, UX и narrative должны быть своими | External feeds + own UI | Да | Гибрид с доминированием build | Это влияет на retention и perceived value |
| Benchmark / scoring / сезонные сравнения | Гибрид | Нужны внешние и внутренние данные одновременно | Imports + own scoring engine | Да | Гибрид | Хороший premium-feature блок |

## Часть 5. Таблица "Источники данных для техкарт"

| Источник / сервис | Тип данных | Как использовать в техкартах | Способ получения | Применимость | Ограничения | Приоритет |
|---|---|---|---|---|---|---|
| `ЕФИС ЗСН` | Контуры и статус землепользования | Базовые границы, сопоставление полей и земконтуров | Институциональные интеграции, выгрузки | РФ-контур обязателен | Публичный API неочевиден | Очень высокий |
| `НСПД / Росреестр` | Кадастровые участки, ограничения, legal layer | Проверка полей, зембанка, обременений, пересечений | Публичные сервисы, выгрузки | Критично для юридической чистоты | Требует нормализации и правовой интерпретации | Очень высокий |
| `AgroSignal` | История операций, поля, техника | Подтягивать историю поля и фактические работы в техкарту | API/выгрузки/партнерство | Очень полезно | API не fully open | Очень высокий |
| `ГеоМир / История поля` | История поля, карты, техника, 1С | Обогащение tech-map master данными хозяйства | Проектная интеграция, выгрузки | Высокая полезность в РФ | Публичная developer-информация слабее | Очень высокий |
| `ExactFarming` | Погода, агрориски, field intelligence | Погодные окна, history, рекомендации, сроки операций | `API`, выгрузки | Высокая | Не заменяет ERP/telematics | Высокий |
| `EOSDA API` | EO indices, weather, zones | Индексы, неоднородность, VRA, stress signals | `API` | Очень высокая | Требует собственной интерпретации | Очень высокий |
| `Copernicus` | Сырые снимки Sentinel | Исторические ряды, change detection, собственные расчетные слои | `API` | Очень высокая | Нужно считать собственную аналитику | Высокий |
| `Open-Meteo` / `NASA POWER` | Forecast, archive, climate | Сроки работ, температура, осадки, ET, historical climate baseline | `API` | Очень высокая | Нужна агрологика и downscaling | Очень высокий |
| Soil lab imports | Агрохимия, pH, гумус, NPK | Нормы, дифференциация, ограничения по полю | CSV/XLSX/GeoJSON/SHP | Очень высокая | Сильная неоднородность форматов | Высокий |
| `Wialon` / `Omnicomm` | Факт операций и техники | Мощность, окна работ, реальное исполнение, нагрузка техники | `API`, webhooks | Очень высокая | Нужно маппить события в операции | Очень высокий |
| `1С:ERP АПК 2` | Нормы, материалы, economics | Ресурсные нормы, затраты, справочники, калькуляция техкарты | `1С` обмены, ETL | Очень высокая | Зависимость от зрелости внедрения у клиента | Очень высокий |
| Yield maps / OEM exports | Урожайность и производительность | Постфактум-корректировка tech-map economics и zoning | SHP/ISOXML/CSV/API | Высокая | Данные часто грязные и несопоставимые | Высокий |

## Часть 6. Таблица "Усиление аналитики"

| Сервис | Какие данные / сигналы дает | Для какой аналитики | Польза для руководителя / агронома / аналитика | Интеграционный способ | Приоритет |
|---|---|---|---|---|---|
| `1С:ERP АПК 2` | Факт затрат, материалы, зарплата, списания, финансы | Plan-fact, unit economics, margin analytics | CEO и CFO видят деньги не абстрактно, а по полю и культуре | ETL / API / file exchange | Очень высокий |
| `AgroSignal` | Статус работ, техника, scouting, фактические операции | Operations analytics, deviation analytics | Управляющий видит, что реально сделано и где отставание | API/выгрузки | Очень высокий |
| `Wialon` / `Omnicomm` | Треки, события, топливо, телеметрия | Контроль операций, антифрод, utilization analytics | Дает доказательную базу и контроль затрат | API/webhooks | Очень высокий |
| `EOSDA API` | Индексы, stress signals, weather, zoning | Agronomy analytics, risk analytics, anomaly detection | Агроном и аналитик видят проблему до факта потери урожая | API | Очень высокий |
| `Copernicus` | Исторические EO ряды | Retrospective analytics, season-over-season | Аналитик строит собственные модели без vendor lock-in | API | Высокий |
| `ExactFarming` | Погода, агросигналы, history | Agronomy analytics, work windows, decision support | Ускоряет интерпретацию для агронома | API/выгрузки | Высокий |
| `ФГИС Зерно` | Движение партий, traceability | Compliance, logistics, shipment analytics | Руководитель получает прозрачность по зерновому контуру | API/кабинет/выгрузки | Высокий |
| `НСПД` | Кадастр и legal-map | Land-bank risk analytics | CEO и юрист видят юридические риски зембанка | Выгрузки / сервисный доступ | Высокий |
| `Open-Meteo` / `NASA POWER` | Прогноз и историческая погода | Work windows, climate risk, scenario models | Дает основу для сезонных и сценарных расчетов | API | Очень высокий |
| `John Deere Operations Center` | OEM operations, yield maps | Yield analytics, machine performance | Полезно крупным клиентам с Deere-парком | API | Средний |

## Часть 7. Таблица "Фронтофис"

| Сервис / data layer / feature | Что увидит пользователь | Какую ценность получит | Build / integrate | Тип | Приоритет | Эффект на продукт |
|---|---|---|---|---|---|---|
| `EOSDA / OneSoil field health` | Карты NDVI/NDRE/stress по полям | Быстрое понимание, где есть проблема и где смотреть первым | Гибрид | Must-have | Очень высокий | Делает продукт "живым" и визуально убедительным |
| `Open-Meteo / DTN weather windows` | Погода, окна работ, осадки, риски | Помогает планировать выезды и операции | Интегрировать + свой UX | Must-have | Очень высокий | Повышает ежедневную полезность |
| `AgroSignal / Wialon operation status` | Что уже выполнено, что сорвано, где техника | Снижает неопределенность и ручные созвоны | Гибрид | Must-have | Очень высокий | Формирует ежедневную привычку заходить в систему |
| `НСПД / ЕФИС land bank map` | Поля, участки, риски, пересечения, ограничения | Ценность для собственника и управляющего, не только для агронома | Гибрид | Premium | Высокий | Усиливает perceived value и продажи |
| `1С + RAI_EP unit economics` | Доходность по полю, культуре, отклонения к плану | Руководитель видит деньги, а не только карты | Build on top of external data | Must-have | Очень высокий | Самый сильный слой для CEO/CFO |
| `Explainable insights` | "Почему риск", "что делать", "какой эффект" | Превращает сигналы в действие | Строить внутри | Differentiator | Очень высокий | Сильный retention и продуктовый moat |
| `Season compare` | Сравнение сезонов и полей | Помогает понимать динамику и учиться на сезоне | Build with external data | Premium | Высокий | Хорошо работает в демо и ревью сезона |
| `Recommendation status` | Какие рекомендации выполнены и что просрочено | Создает управляемость и accountability | Build with ops feed | Must-have | Высокий | Повышает операционную дисциплину |
| `Document / report center` | PDF/XLSX/карты/документы по полю и сезону | Удобство для собственника, банка, аудитора, управляющей компании | Build | Must-have | Высокий | Повышает enterprise-ценность |
| `Benchmark / scoring dashboard` | Скоринг хозяйства, полей, сезонов, кластеров | Дает собственнику простую и понятную метрику | Build + external feeds | Premium / demo-feature | Средний-высокий | Сильный sales-asset |

### Low-hanging fruits для фронтофиса

- Карта health status поля.
- Окна работ и погодные алерты.
- Статус выполненных операций.
- Таймлайн сезона по каждому полю.
- PDF/XLSX-отчеты по сезону и по полю.

### Premium features

- Unit economics по полю и культуре.
- Season compare и benchmark.
- Land-bank risk map.
- Explainable risk cards.

### Differentiators

- "Поле -> операция -> отклонение -> деньги -> рекомендация".
- Explainable insights для CEO и chief agronomist.
- Executive cockpit по кластеру / группе хозяйств.

### Функции, которые особенно хорошо смотрятся на демо

- Живая карта полей с health status.
- Доходность/убыточность по полям поверх карты.
- Алерт "работы сорваны из-за погодного окна / техника не вышла / поле отстает".
- Visual land-bank layer с ограничениями и рисками.

## Часть 8. Приоритетный roadmap

### Wave 1 — самое быстрое и ценное

- Интеграция `1С:ERP АПК 2` для плана-факта и справочников.
- Коннектор `AgroSignal` или `ГеоМир` для полей, операций и факта работ.
- Weather stack: `Open-Meteo` + `NASA POWER`.
- Remote sensing stack: `EOSDA API` или `Copernicus + собственная интерпретация`.
- Коннектор `Wialon` и/или `Omnicomm`.
- Базовый front-office: карта полей, weather, health status, статус операций, PDF/XLSX отчеты.

### Wave 2 — стратегически сильные интеграции

- `ЕФИС ЗСН`, `НСПД`, `ФГИС Зерно`.
- `ExactFarming` для ускорения агрономического enrichment и weather/agro-risk слоя.
- OEM-коннекторы: `John Deere`, точечно `Cropwise`, `FieldView`.
- Импорты агрохимии, карт урожайности, прайсов и inputs catalogs.
- Benchmarking и season compare поверх объединенного data model.

### Wave 3 — что есть смысл строить самим как moat

- Конструктор техкарт с версионированием и traceability.
- Field identity graph и единый агро-объектный слой.
- Explainable insight engine.
- Executive cockpit и управляющая аналитика.
- Scoring / benchmarking / risk-prioritization engine.
- Гибридный AI-слой: внешний data feed + собственная логика рекомендаций и экономической интерпретации.

## Оценочная модель по ключевым сервисам

Шкала: `1-10`, где `10` = максимально сильное влияние на RAI_EP.

| Сервис | Техкарты | Аналитика | Фронтофис | Интеграц. пригодность | Стратегич. важность | Уникальность данных | Скорость эффекта | Пригодность для РФ | Долгосрочная полезность | Сумма |
|---|---|---|---|---|---|---|---|---|---|---|
| `1С:ERP АПК 2` | 8 | 9 | 5 | 7 | 10 | 8 | 7 | 10 | 10 | 74 |
| `AgroSignal` | 9 | 8 | 7 | 7 | 9 | 7 | 8 | 10 | 9 | 74 |
| `EOSDA API` | 8 | 8 | 8 | 9 | 8 | 8 | 8 | 7 | 9 | 73 |
| `ExactFarming` | 8 | 7 | 7 | 8 | 8 | 7 | 9 | 9 | 8 | 71 |
| `ГеоМир / История поля` | 9 | 8 | 7 | 6 | 8 | 7 | 7 | 10 | 8 | 70 |
| `Copernicus Data Space` | 8 | 7 | 5 | 9 | 8 | 8 | 8 | 8 | 9 | 70 |
| `Wialon + Hecterra` | 7 | 7 | 6 | 9 | 7 | 6 | 8 | 9 | 8 | 67 |
| `Cropwise Open Platform` | 8 | 8 | 7 | 9 | 8 | 7 | 7 | 4 | 8 | 66 |
| `Omnicomm` | 6 | 7 | 5 | 8 | 7 | 6 | 8 | 10 | 8 | 65 |
| `John Deere Operations Center` | 7 | 8 | 6 | 9 | 8 | 8 | 6 | 3 | 7 | 62 |
| `OneSoil` | 6 | 6 | 8 | 5 | 6 | 5 | 9 | 7 | 6 | 58 |
| `Climate FieldView` | 6 | 7 | 6 | 8 | 7 | 7 | 6 | 3 | 6 | 56 |

## Top-10 сервисов для интеграции

1. `1С:ERP АПК 2`
2. `AgroSignal`
3. `EOSDA API`
4. `ExactFarming`
5. `ГеоМир / История поля`
6. `Wialon + Hecterra`
7. `Omnicomm`
8. `ЕФИС ЗСН`
9. `НСПД / Росреестр`
10. `ФГИС Зерно`

## Top-10 data layers для RAI_EP

1. Единый реестр полей и зембанка.
2. Кадастровый и legal-map слой.
3. История культур и операций по полю.
4. EO indices и satellite anomaly layer.
5. Weather forecast + weather archive + climate baseline.
6. Фактические операции и телематические события.
7. ERP-факт затрат и материалов.
8. Агрохимия и плодородие.
9. Карты урожайности и производительности.
10. Compliance / traceability данные (`ФГИС Зерно`, госслои).

## Top-10 функций, которые выгоднее строить внутри RAI_EP

1. Конструктор техкарт и версия техкарты.
2. Field identity graph.
3. Plan-fact-scenario economics.
4. Explainable insights.
5. Executive cockpit для CEO / управляющей компании.
6. Risk-prioritization engine.
7. Benchmark / scoring / season compare.
8. Front-office UX и narrative dashboards.
9. Alert orchestration и recommendation status.
10. Cross-source evidence timeline по полю и сезону.

## Вывод по significant services в логике build vs integrate

- `Интегрировать`: `1С:ERP АПК 2`, `Wialon`, `Omnicomm`, `EOSDA API`, `Open-Meteo`, `NASA POWER`, `Copernicus`, `ФГИС Зерно`.
- `Использовать выгрузки / импорт`: soil labs, yield maps, local partner systems, часть госисточников, supplier catalogs, часть локальных FMS без нормального developer contour.
- `Реализовать самим`: executive analytics, tech-map intelligence, explainability, front-office UX, scoring, season compare.
- `Гибрид`: `AgroSignal`, `ГеоМир`, `ExactFarming`, `OneSoil`, land-bank layer, VRA logic.

## Короткий итог для архитектуры продукта

Оптимальная архитектура для `RAI_EP`:

- снизу: внешние `systems of record` и `raw data feeds`;
- в середине: собственный `canonical agrarian data model` и интеграционный слой;
- сверху: `tech-map intelligence`, `executive analytics`, `front-office`, `explainable insights`.

Проигрышная стратегия: пытаться заменить разом ERP, телематику, госданные и все FMS-решения.

Выигрышная стратегия: стать нейтральным мозгом и управленческим операционным слоем, который объединяет:

- `ERP + machine data + field ops + GIS + weather + gov/compliance + economics`

в единый продуктовый объект:

- `поле -> операция -> отклонение -> риск -> деньги -> рекомендация -> отчет -> действие`.

## Выборочно подтвержденные официальные источники

- `AgroSignal`: официальный сайт и интеграционные материалы по `1С` и госконтуру.
- `ExactFarming`: официальный сайт и публичный `API` контур.
- `ГеоМир / История поля`: официальный продуктовый сайт с указанием интеграций с `1С` и телематикой.
- `1С:ERP АПК 2`: официальный каталог решений `1С`.
- `EOSDA`: официальный продуктовый сайт и `API Connect`.
- `Cropwise`: официальный сайт и `Open Platform`.
- `John Deere`: официальный `Operations Center` и developer portal.
- `Omnicomm`: официальный `REST API` и интеграционные материалы.
- `Wialon`: официальный API/help-контур.
- `Copernicus Data Space`: официальный EO/API контур.
- `Open-Meteo`, `NASA POWER`: официальные API.
- `НСПД`, `ЕФИС ЗСН`, `ФГИС Зерно`: официальные госресурсы; публичность и удобство интеграции различаются, поэтому практическую реализацию надо считать как `institutional integration`, а не как гарантированный open API-first путь.
