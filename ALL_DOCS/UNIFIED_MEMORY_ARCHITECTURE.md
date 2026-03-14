---
id: DOC-ARC-HLD-UNIFIED-MEMORY-ARCHITECTURE-1YES
layer: Architecture
type: HLD
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# HLD: Unified Memory Architecture (The RAI Brain) 🧠

> **Статус:** Концепт | **Фаза:** Gamma/Delta | **Слой:** Архитектура / HLD

---

## 1. Философия: "Система, которая помнит всё"

Мы уходим от понятия простой "Базы Данных" к концепции **Когнитивной Памяти**. Система должна обладать свойствами человеческой памяти:
1.  **Многомерность**: Связи "многие-ко-многим" (Граф).
2.  **Ассоциативность**: Поиск не по ключевым словам, а по смыслу (Векторы).
3.  **Пластичность**: Способность запоминать новые типы сущностей без переписывания кода (Self-Expanding Schema).
4.  **Реактивность**: Мгновенное всплывание "опасных воспоминаний" (Энграммы).

---

## 2. Архитектура: "Memory Onion" (Слои Памяти)

Система памяти состоит из 5 слоев, от "горячей" (быстрой и короткой) до "холодной" (архивной и фундаментальной).

```mermaid
graph TD
    %% Входной запрос
    Input[🔍 Query / Context] --> Router{Memory Router}

    %% Слой 1: Working Memory (Горячая)
    Router -->|Context Window| WM[🔥 Working Memory<br/>(Redis/Session)]
    
    %% Слой 2: Semantic Memory (Граф)
    Router -->|Relationships/Facts| KG[🕸️ Semantic Memory<br/>(Knowledge Graph / Neo4j)]
    
    %% Слой 3: Episodic Memory (Энграммы)
    Router -->|Experience/Similarity| Engram[⚡ Episodic Memory<br/>(Engrams / pgvector)]
    
    %% Слой 4: External Memory (RAG)
    Router -->|Docs/Regulations| RAG[📚 External Memory<br/>(Document Store / Weaviate)]

    %% Слой 5: Procedural Memory (Навыки)
    Router -->|How-to/Tools| Skill[🛠️ Procedural Memory<br/>(Function Registry)]

    %% Синтез ответа
    WM & KG & Engram & RAG & Skill --> Synthesizer[🧠 Context Synthesizer]
    Synthesizer --> Output[💡 Intelligent Response]
```

---

## 3. Детализация Слоев

### 3.1 🔥 Working Memory (Рабочая Память)
**Аналог:** Оперативная память у человека.
*   **Что хранит:** Текущий диалог, незавершенные задачи, просматриваемый "прямо сейчас" контекст (карта поля).
*   **Технологии:** Redis, In-Memory Context Window.
*   **Срок жизни:** Сессия или Задача.

### 3.2 🕸️ Semantic Memory (Семантическая Память / Граф Знаний)
**Аналог:** Энциклопедические знания ("Пшеница — это культура", "Поле 5 принадлежит Хозяйству А").
*   **Цель:** Хранение связей "многие-ко-многим".
*   **Self-Expanding:** Если система встречает новую сущность (например, "Дрон-опрыскиватель"), она создает новый узел в графе и связи, не ломая старую схему.
*   **Технологии:** Neo4j (Graph DB) или PostgreSQL (Recursive Queries + JSONB).
*   **GraphRAG:** Использование связей графа для улучшения поиска. "Найди все поля, где росла пшеница после подсолнечника".

### 3.3 ⚡ Episodic Memory (Энграммы / Опыт)
**Аналог:** Личный опыт ("В прошлом году на этом поле сгорел урожай из-за засухи").
*   **Что хранит:** Positive (+) и Negative (-) кейсы, инциденты, решения.
*   **Технологии:** PostgreSQL + pgvector (Векторный поиск).
*   **Механизм:** Реактивный. Всплывает само как "предчувствие" или алерт.

### 3.4 📚 External Memory (RAG / Документы)
**Аналог:** Библиотека книг и инструкций.
*   **Что хранит:** PDF-инструкции к технике, законы, научные статьи, регламенты компании.
*   **Технологии:** Vector DB (Weaviate/Chroma/pgvector).
*   **Механизм:** Поиск чанков текста по смыслу и скармливание их LLM для генерации ответа.

### 3.5 🛠️ Procedural Memory (Процедурная Память)
**Аналог:** Мышечная память ("Как водить машину").
*   **Что хранит:** Сценарии (Workflows), доступные инструменты (Tools), скрипты Python.
*   **Технологии:** Function Registry, Code Interpreter scripts.

---

## 4. Пример "Вспышки Памяти" (Memory Flash)

**Запрос Пользователя:** *"Почему на поле 'Восход-2' желтеют листья?"*

1.  **Working Memory:** Понимает, что мы говорим про "Восход-2" в текущем сезоне 2026.
2.  **Semantic Memory (Graph):**
    *   Находит ноду `Field: "Восход-2"`.
    *   Видит связь `CurrentCrop: "Winter Wheat (Ермак)"`.
    *   Видит связь `LastOperation: "Herbicide Application (3 days ago)"`.
3.  **Episodic Memory (Engram):**
    *   Ищет векторы: "Wheat yellowing herbicide".
    *   **FLASH!** Находит инцидент 2024 года: "Ожог листа из-за смешивания препарата X и Y при t > 25°C".
4.  **External Memory (RAG):**
    *   Подтягивает инструкцию к гербициду: "Ограничение: не применять при температуре выше 25°C".
5.  **Синтез:**
    *   Система проверяет погоду (Context). Было +27°C.
    *   **Ответ:** "Есть высокая вероятность химического ожога. 3 дня назад вносили гербицид при +27°C, а инструкция запрещает работу выше +25°C. У нас был похожий случай в 2024 году (вероятность 89%)."

---

## 5. Self-Expanding Mechanism (Саморасширение)

Как хранить "неограниченное число типов"?

Используем гибридный подход **Graph + Document Store**:
1.  **Core Entities:** Жесткая схема в SQL (User, Field, Task) для скорости и надежности.
2.  **Flexible Knowledge:** Граф (Nodes & Edges) для всего остального.
    *   `Node(ID, Type="Drone", Properties={...})`
    *   `Edge(FromID, ToID, Relation="ASSIGNED_TO")`
3.  **Semantic Extractor:**
    *   Когда пользователь загружает PDF "Новый тип датчика влажности", AI-агент парсит его и сам создает:
        *   Новый тип Node `SensorType: HumidityBrandX`
        *   Новые связи с полями.
    *   Без участия программиста.

---

## 6. Технический Стек (Target Architecture)

| Компонент Памяти | Технология | Роль |
| :--- | :--- | :--- |
| **Hot Cache** | **Redis** | Сессии, контекст, кэш графа |
| **Vectors** | **pgvector / Qdrant** | Энграммы, RAG чанки |
| **Graph** | **Neo4j / Apache Age** | Сложные связи, онтология |
| **Relational** | **PostgreSQL** | Фундамент, транзакции, биллинг |
| **Blob Storage** | **S3 / MinIO** | Исходники файлов (PDF, IMG) |

### 🚀 Performance Strategy
Для "максимально быстрой выдачи":
1.  **Tiered Retrieval:** Сначала проверяем Redis (1ms) -> Потом Векторы (50ms) -> Потом Граф (100ms).
2.  **Async RAG:** Документы индексируются фоново.
3.  **Parallel Execution:** Поиск в Графе и Векторах идет параллельно (см. диаграмму).

---

## 7. Этапы внедрения

1.  **Phase Alpha (Сейчас):** `PostgreSQL` (Relational) + `Redis`.
2.  **Phase Beta:** Добавляем `pgvector` (RAG для доков + простые Энграммы).
3.  **Phase Gamma:** Внедряем `Graph DB` (Сложные связи) + Self-Expanding Schema.
