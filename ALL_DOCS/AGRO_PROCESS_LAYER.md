---
id: DOC-ARC-HLD-AGRO-PROCESS-LAYER-1SOG
layer: Architecture
type: HLD
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# HLD: Agro Process Layer (APL)

> **Статус:** Draft | **Слой:** Architecture | **Тип:** Technical Spec

---

## 1. Назначение слоя

**Agro Process Layer (APL)** — это оркестрационный слой, управляющий **процессами** агротехнологии.

Это **НЕ** микросервис монолитного типа ("AgroService") и **НЕ** база данных ("AgroDB").
Это движок, который превращает хаос агрономических операций в строгий, управляемый поток.

### 1.1 Фундаментальные принципы
1.  **Separation of Concerns:**
    *   **Domain Services (Field, Crop, Machinery):** Хранят факты (Что? Где? Чем?).
    *   **APL:** Хранит логику последовательности (Когда? Зачем? Что дальше?).
    *   **Business Core:** Исполняет задачи (Task Engine).
2.  **Canonical Process Graph:**
    *   16 этапов управления урожаем (из Research) — это **Reference Workflow**.
    *   APL позволяет настраивать этот граф (пропускать этапы, ветвить), но следует канонической логике "от почвы до амбара".
3.  **Stateless Orchestration:**
    *   Сам слой не хранит состояние полей (это дело Domain).
    *   Он хранит состояние **процесса** (на каком мы этапе, какие условия выполнены).

---

## 2. Архитектура Агро-Процессного Слоя

```mermaid
graph TD
    %% Входящие
    Input[📅 Trigger / Scheduler / User] --> Orchestrator

    %% APL Internals
    subgraph APL [Agro Process Layer]
        Orchestrator[🎼 AgroProcess Orchestrator]
        StageEngine[🎬 Stage Engine]
        RuleEngine[⚖️ AgroRule Engine]
    end

    %% Внешние связи
    Orchestrator -->|Get Context| DomainLayer[🚜 Domain Services]
    Orchestrator -->|Create Task| TaskEngine[✅ Task Engine (Core)]
    Orchestrator -->|Validate| RuleEngine
    StageEngine -->|Check Preconditions| DomainLayer
    
    %% AI Integration
    AI[🤖 AI Orchestration Hub] -.->|Advisory Interface| Orchestrator
    
    %% Memory
    Audit[📜 Audit Service] -->|Log Decision| Engram[🧠 Engram System]
```

### 2.1 Компоненты APL

#### 🎼 AgroProcess Orchestrator
Центральный диспетчер.
*   **Функция:** Принимает сигналы (от пользователя, таймера, IoT) и решает, какой процесс запустить.
*   **Пример:** Пришла дата сева -> Оркестратор проверяет погоду -> Создает задачу на осмотр поля.

#### 🎬 Stage Engine (Движок Этапов)
Отвечает за жизненный цикл конкретного этапа (например, "Этап 4. Сев").
*   **Logic:** Знает Preconditions (что должно быть готово) и Postconditions (что считать успехом).
*   **Mapping:** Превращает абстрактный "Этап Сев" в набор конкретных задач Task Engine.

#### ⚖️ AgroRule Engine (Движок Правил)
Хранитель ограничений.
*   **Hard Constraints:** "Нельзя сеять в грязь" (Блокировка).
*   **Soft Constraints:** "Лучше сеять ночью" (Warning).
*   **Интеграция с AI:** AI может предлагать обход правил, но Rule Engine фиксирует нарушение.

---

## 3. Reference Workflow: 16 Stages

Мы реализуем 16 этапов не как жесткий код, а как **Canonical Graph**.

| Stage ID | Название этапа | Ключевые Домены (Reads) | Результат (Events) |
| :--- | :--- | :--- | :--- |
| **01** | Предшественник и анализ | `Field`, `History` | `analysis.completed` |
| **02** | Основная обработка | `Machinery`, `Soil` | `tillage.executed` |
| **03** | Предпосевная подготовка | `Machinery`, `Soil` | `seedbed.ready` |
| **04** | Сев | `Inputs`, `Machinery` | `sowing.completed` |
| **05** | Стартовая защита | `Inputs` (Insecticides) | `protection.applied` |
| **...** | ... | ... | ... |
| **16** | Закрытие сезона | `Finance`, `Audit` | `season.closed` |

> **Гибкость:** Для кукурузы граф может быть изменен (другие этапы), но движок (StageEngine) остается тем же.

---

## 4. Контракт с Business Core

APL — это "мозг", а Business Core — "руки и ноги".

### 4.1 Task Engine (Workflow)
APL не имеет своего планировщика задач.
*   Когда APL решает "Надо сеять", он делает `POST /tasks` в `Task Service`.
*   APL подписывается на события `task.completed`.

### 4.2 Audit Service (Evidence)
Каждое решение APL (смена этапа, блокировка) пишется в Аудит.
*   Это кормовая база для **Engram System**.

### 4.3 Event Bus (State Change)
APL работает реактивно.
*   Слушает: `sensor.moisture.critical`, `user.command.start_harvest`.
*   Публикует: `stage.suboptimal`, `risk.detected`.

---

## 5. Сценарий выполнения (Flow)

**Задача:** Переход к "Этапу 4. Сев".

1.  **Trigger:** Агроном нажимает "Начать сев" в UI.
2.  **Orchestrator:** Получает запрос.
3.  **Stage Engine:**
    *   Проверяет Preconditions: "Этап 3 завершен?", "Семена на складе?".
    *   Читает **Domain Services** (Stock, Field Status).
4.  **Rule Engine:**
    *   Проверяет: "Влажность почвы > 15%?" (Данные от IoT/Domain).
    *   Если < 12% -> **Blocker**.
5.  **Decision:**
    *   Если OK -> Оркестратор создает задачи в **Task Engine**: "Выезд сеялки", "Загрузка семян".
    *   Если Blocker -> Возвращает ошибку + Алерт.
6.  **AI Advisory (Optional):**
    *   Если Blocker, AI может предложить: "Можно сеять глубже, риск 20%".
    *   Orchestrator ждет подтверждения человека (Override).

---

## 6. Резюме

*   **APL** = Logic Keeper.
*   **Domain** = Data Keeper.
*   **Core** = Execution.
*   **AI** = Advisor.

Эта архитектура позволяет масштабировать агротехнологию (добавлять новые культуры, менять правила) без переписывания бэкенда.
