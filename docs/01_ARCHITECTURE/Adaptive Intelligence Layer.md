---
id: DOC-ARC-01-ARCHITECTURE-ADAPTIVE-INTELLIGENCE-LAYE-1KI4
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
Adaptive Intelligence Layer (AIL)

Он живёт параллельно Execution Layer.

Execution Layer  →  Делает
Adaptive Layer   →  Переосмысливает
🧠 1️⃣ Объект системы

Не “вопрос”. Не “идея”.

Exploration Case (EC)

Это универсальная сущность:

рыночная возможность

клиентская боль

R&D гипотеза

регуляторная проблема

продуктовая трансформация

технологический эксперимент

🔄 2️⃣ Поток внутри RAI_EP
Шаг 1 — Intake

Любой может создать EC.

Минимальные поля:

Контекст

Почему это важно

Предполагаемый эффект

Тип (idea / problem / research / regulatory / opportunity)

Шаг 2 — Human + AI Triage

Назначается Responsible Triage Officer (может быть советом).

ИИ:

кластеризует

проверяет дубли

оценивает импакт

делает quick systemic scan

Человек:

присваивает уровень

маршрутизирует

Шаг 3 — Routing
Решение	Куда идёт
Операционное	Backlog
Продуктовое	Product Stream
Исследование	Virtual Lab
Критическое	War Room
🔬 3️⃣ Virtual Lab FSM

Важно: отдельная state-machine.

Proposed
→ Accepted
→ Researching
→ Structuring Solution
→ Decision
    → Implement
    → Experiment
    → Archive

Никакой бесконечной дискуссии.

Timebox обязателен.

🧱 4️⃣ Ограничитель бюрократии

Три принципа:

1️⃣ Lab Capacity

Одновременно максимум N активных кейсов.

2️⃣ Mandatory Outcome

Каждый кейс обязан завершиться:

внедрением

экспериментом

отказом с обоснованием

3️⃣ Execution Isolation

Пока не принято решение — Execution контур не затрагивается.

💰 5️⃣ Культура и мотивация

Добавляем:

Innovation Attribution Protocol

Если EC:

дошёл до внедрения

дал measurable impact

Автор получает:

признание

бонус

стратегический статус

Это создаёт Ownership Culture.

🧭 6️⃣ Где это жить в интерфейсе RAI_EP

В меню:

Strategy
  └ Adaptive Intelligence
        ├ Raw Stream
        ├ Triage Board
        ├ Virtual Lab
        ├ War Room
        └ Implemented Innovations

Это не таск-менеджер.
Это стратегический модуль.

🛑 7️⃣ Что НЕ делаем

Не делаем обязательным для каждой задачи

Не пускаем всё в Lab

Не даём EC жить вечно

Не даём CEO читать 200 идей вручную

🎯 8️⃣ На текущем этапе внедрения

Тебе нужно:

Создать модель данных EC

Сделать простой UI для Intake

Реализовать ручной Triage Board

Реализовать Lab FSM

Внедрить timebox + статусную дисциплину

Без автоматической сложной аналитики.
Она придёт позже.
