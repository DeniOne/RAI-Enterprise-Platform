# PARTY MANAGEMENT UX FLOW & ARCHITECTURE

## ВВЕДЕНИЕ
Настоящий документ описывает связь между архитектурным контрактом `Party Management` (разработанным по принципу Jurisdiction-Aware Institutional Core) и пользовательским интерфейсом модуля "Хозяйства и Контрагенты" в CEO Space. 

Схема визуализирует, как элементы UI проецируются на строгую графовую и реляционную структуру данных.

---

## ВИЗУАЛИЗАЦИЯ СВЯЗИ UI <-> БАЗА ДАННЫХ

```mermaid
graph TD
    %% -- Стилизация --
    classDef uiLayer fill:#eef2f5,stroke:#94a3b8,stroke-width:2px,color:#1e293b
    classDef dbLayer fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc
    classDef action fill:#dbeafe,stroke:#3b82f6,stroke-width:1px,color:#1e3a8a
    
    %% -- БЛОК UI: МЕНЮ --
    subgraph UI_MENU ["UI МЕНЮ (CEO SPACE)"]
        UI_A["[КНОПКА] Хозяйства и Контрагенты"]:::uiLayer
    end

    %% -- БЛОК UI: ЭКРАНЫ --
    subgraph UI_SCREENS ["UI ЭКРАНЫ (АРМ КОНТРАГЕНТОВ)"]
        UI_B["[ГРИД] Реестр юр.лиц (Плоский список)"]:::uiLayer
        UI_C["[ФОРМА] Создать/Редактировать Party"]:::uiLayer
        UI_D["[ВКЛАДКА] Реквизиты (Динамические)"]:::uiLayer
        UI_E["[ВКЛАДКА] Структура Холдинга (Дерево)"]:::uiLayer
        UI_F["[ВКЛАДКА] Активы (Хозяйства)"]:::uiLayer
        UI_G["[МОДАЛКА] Добавить связь (Relation)"]:::uiLayer
        UI_H["[МОДАЛКА] Добавить актив (Asset Role)"]:::uiLayer
    end

    %% -- БЛОК БАЗЫ ДАННЫХ --
    subgraph DB_CORE ["INSTITUTIONAL CORE (POSTGRESQL + RLS)"]
        DB_Party[("Таблица: Party<br/>(id, name, jurisdictionId)")]:::dbLayer
        DB_PartyIdentifier[("Таблица: PartyIdentifier<br/>(partyId, type: INN/UNP, value)")]:::dbLayer
        DB_PartyRelation[("Таблица: PartyRelation<br/>(sourceId, targetId, relationDomain, basis)")]:::dbLayer
        DB_Asset[("Таблица: Asset<br/>(id, type: FARM/FIELD)")]:::dbLayer
        DB_AssetPartyRole[("Таблица: AssetPartyRole<br/>(assetId, partyId, role: OWNER/OPERATOR)")]:::dbLayer
        DB_JurisdictionContext[("Profiles: Jurisdiction<br/>(JSON-схема реквизитов)")]:::dbLayer
    end

    %% -- СВЯЗИ MENU -> SCREENS --
    UI_A -->|"Клик открывает"| UI_B

    %% -- СВЯЗИ SCREENS -> DB (ЧЕК ВАЛИДАЦИИ) --
    UI_B -->|"SELECT * FROM Party"| DB_Party
    
    UI_B -.->|"Кнопка 'Добавить'"| UI_C
    UI_C -->|"INSERT INTO Party"| DB_Party
    
    UI_C -->|"Выбор 'РФ'/'РБ'"| DB_JurisdictionContext
    DB_JurisdictionContext -.->|"Отдает схему"| UI_D
    UI_D -->|"INSERT INTO PartyIdentifier"| DB_PartyIdentifier

    UI_B -.->|"Клик по строке"| UI_E
    UI_E -->|"Клик 'Связать'"| UI_G
    UI_G -->|"INSERT INTO PartyRelation<br/>(A -> B, Domain: OWNERSHIP)"| DB_PartyRelation
    DB_PartyRelation -.->|"SELECT ... asOf=Date"| UI_E

    UI_B -.->|"Вкладка 'Хозяйства'"| UI_F
    UI_F -->|"Клик 'Привязать поле'"| UI_H
    UI_H -->|"INSERT INTO AssetPartyRole<br/>(Field1 -> PartyA, Role: LESSEE)"| DB_AssetPartyRole
    DB_AssetPartyRole -.->|"JOIN Asset"| DB_Asset
```

---

## ДЕТАЛИЗАЦИЯ UX-СЦЕНАРИЕВ

Ниже описано, как именно пользовательский интерфейс проецирует действия в утвержденный нами контракт.

### 1. Добавление нового юрлица (Party)
*   **UX Действие:** Пользователь нажимает «Добавить контрагента».
*   **UX Шаг 1:** Появляется выпадающий список `Юрисдикция` (обязательный шаг). Пользователь выбирает «РФ».
*   **Под капотом:** Бэкенд отдает схему, и UX динамически отрисовывает инпуты: `ИНН`, `КПП`, `ОГРН`. Если бы выбрал «РБ», появился бы только `УНП`.
*   **Связь с БД:** Создается запись в таблице `Party` и несколько записей в таблице `PartyIdentifier`.

### 2. Выстраивание холдинга (Relation)
*   **UX Действие:** Пользователь открывает карточку «АгроХолдинг Звезда». Переходит на вкладку `Структура`.
*   **UX Шаг 1:** Нажимает «Добавить дочернюю компанию». Выбирает из справочника «Колхоз Рассвет».
*   **UX Шаг 2:** Система просит указать роль (Домен) и долю. Пользователь выбирает «Собственность (OWNERSHIP)» и указывает «51%».
*   **UX Шаг 3:** Система (опционально) просит `basisDocumentId` — скан решения учредителей.
*   **Связь с БД:** Идет запись в `PartyRelation`. Проверяется инвариант на отсутствие циклов (чтобы "Рассвет" случайно не владел "Звездой").

### 3. Привязка хозяйства (Asset)
*   **UX Действие:** В карточке «Колхоз Рассвет» (Party) пользователь открывает вкладку `Активы/Хозяйства`.
*   **UX Шаг 1:** Нажимает «Привязать хозяйство». Выбирает из реестра хозяйств «Поле №15».
*   **UX Шаг 2:** Выбирает роль отношения: `Арендатор (LESSEE)`.
*   **UX Шаг 3:** Указывает срок действия аренды (`validFrom` ... `validTo`).
*   **Связь с БД:** Создается запись в `AssetPartyRole`. Никакого `operatinPartyId` в самой таблице `Farm` не перезаписывается. Аренда юридически зафиксирована во времени.

---

## КАК ЭТО ЛОЖИТСЯ НА БОКОВОЕ МЕНЮ 

Твое левое меню остается абсолютно таким же:
1.  **Обзор** (Дашборд).
2.  **Хозяйства и Контрагенты** — Это точка входа в Реестр `Party` и Реестр `Asset`.
3.  **Планы Урожая / Техкарты Урожая** — Создание документов. При выборе контрагента в этих документах, бэкенд будет подтягивать только тех, кто имеет нужную юрисдикцию или роль по графу `PartyRelation`.
4.  **Исполнение Техкарт** — Выставленные инвойсы будут закидываться в Ledger, строго опираясь на правила из профиля юрисдикции `Party` на дату `asOf`.
