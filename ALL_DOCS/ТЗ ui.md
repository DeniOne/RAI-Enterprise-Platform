---
id: DOC-STR-CONSULTING-UI-7G63
layer: Strategy
type: Vision
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
🧭 TASK: UI Structural Reflection Sprint (Consulting Core v2)
🎯 Цель

Сделать UI отражением доменной архитектуры.
Не добавлять новую бизнес-логику.
Сделать существующую архитектуру видимой и управляемой через интерфейс.

1️⃣ Обновление структуры меню
Текущая проблема

Меню выглядит функциональным, но не отражает:

Production Gate

Budget Gate

Advisory Layer

FSM статусы

Domain зависимость

Новая структура (обязательная)
🟦 УПРАВЛЕНИЕ УРОЖАЕМ (Core Contour)
УПРАВЛЕНИЕ УРОЖАЕМ
 ├── Обзор (Dashboard)
 ├── Планы урожая
 ├── Техкарты
 ├── Бюджеты
 ├── Исполнение (заглушка под Execution Layer)
 ├── Отклонения
 ├── Решения (CmrDecision журнал)
 └── Advisory


⚠️ Убрать объединение "Отклонения и Решения" — это разные сущности.

🟪 СТРАТЕГИЯ (Read Model Layer)
СТРАТЕГИЯ
 ├── Стратегический обзор
 ├── Портфель планов
 ├── Карта рисков
 ├── Журнал стратегических решений

🟩 ЭКОНОМИКА (Financial Analytics Layer)
ЭКОНОМИКА
 ├── Экономика урожая
 ├── Юнит-экономика
 ├── Safety Net контроль
 ├── Прогноз экономики

🟨 ФИНАНСЫ (Operational Financial Layer)
ФИНАНСЫ
 ├── Бюджеты (дублируется как быстрый доступ)
 ├── Денежные потоки
 ├── Счета и расчёты
 ├── Финансовая отчётность
2️⃣ Экран: Планы урожая
List View

Таблица:

Название	Сезон	Статус	Production	Budget	Critical Dev	Advisory	Действия
Production

❌ Нет ACTIVE TechMap

✅ ACTIVE TechMap

Budget

❌ Нет LOCKED бюджета

✅ LOCKED

Advisory

🟢 OK

🟡 Warning

🔴 Critical

Detail View (Центральный хаб)

Страница плана = центр всей архитектуры.

Блок 1 — Статус

FSM статус

Кнопки transition

Disabled с tooltip (причина из DomainRules)

Блок 2 — Production Gate

Active TechMap

Статус

Кнопка "Перейти к техкарте"

Блок 3 — Budget Gate

LOCKED?

% исполнения

Финансовые отклонения

Блок 4 — Deviations

Кол-во CRITICAL

Среднее время закрытия

Ссылка на список

Блок 5 — Advisory Summary

Краткое резюме

3 последних предупреждения

Кнопка "Полный анализ"

3️⃣ Экран: Техкарты
List View

| Поле | Культура | Сезон | Статус | Операций | ACTIVE | Действия |

Показывать бейдж ACTIVE.

Detail View
Блок 1 — FSM

Transition кнопки.

Блок 2 — Операции

Список операций:

дата

тип

норма

ресурсы

Блок 3 — Связанный план

Ссылка на HarvestPlan

4️⃣ Экран: Бюджеты
List View

| План | Сезон | Статус | Total | Actual | Deviation | Действия |

Detail View
Блок 1 — FSM

DRAFT / APPROVED / LOCKED / EXECUTING / CLOSED

Блок 2 — Budget Items

Таблица:

| Категория | План | Факт | Отклонение |

Красная подсветка если actual > planned.

5️⃣ Экран: Отклонения

| Тип | Severity | План | Дата | Статус | Решение |

Фильтр:

PRODUCTION

FINANCIAL

CRITICAL

6️⃣ Экран: Решения (CmrDecision)

Read-only журнал:

| План | Тип | Описание | Автор | Дата |

Immutable. Без edit.

7️⃣ Экран: Advisory
Plan Advisory

Частота критических

Среднее время закрытия

Повторяющиеся паттерны

Company Advisory

Агрегация

Heat risk score

8️⃣ Обязательные UX правила
1. DomainRules → UI

Если нельзя:

disabled button

tooltip с точной причиной

2. FSM всегда виден

Каждая сущность:

статус

возможные переходы

3. Цветовая семантика

Зеленый — OK

Желтый — Warning

Красный — Critical

Серый — Заблокировано

9️⃣ Что НЕ делать

Не добавлять новые фичи

Не усложнять дизайн

Не строить графики пока

Не трогать Execution Layer

10️⃣ Definition of Done

✔ Меню отражает архитектуру
✔ HarvestPlan — центральный хаб
✔ Все FSM визуализированы
✔ Domain ограничения видны
✔ Advisory отображается
✔ Нет "невидимой логики"

Почему это стратегически правильно

Вы:

перестаёте работать вслепую

начинаете видеть архитектуру как продукт

фиксируете системную целостность

готовите основу под Execution Layer
