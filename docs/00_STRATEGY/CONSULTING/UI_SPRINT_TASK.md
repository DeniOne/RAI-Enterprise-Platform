---
id: DOC-STR-CONSULTING-UI-SPRINT-TASK-15K6
layer: Strategy
type: Vision
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# 🧭 UI_SPRINT_TASK.md
## RAI Enterprise — UI Structural Reflection Sprint
### Consulting Core v2 Visualization

---

# 🎯 Цель спринта

Сделать UI прямым отражением текущей доменной архитектуры:

HarvestPlan ↔ TechMap ↔ BudgetPlan ↔ Deviation ↔ CmrDecision ↔ Advisory

❗ Не добавлять новую бизнес-логику  
❗ Не расширять доменную модель  
✅ Визуализировать существующие FSM, DomainRules и зависимости

---

# 🏗 1. Обновление структуры меню

## 🔷 УПРАВЛЕНИЕ УРОЖАЕМ (Core Domain)

Утвердить структуру:

- Обзор
- Планы урожая
- Техкарты
- Бюджеты
- Исполнение (заглушка под Execution Layer)
- Отклонения
- Решения
- Advisory

### Требования:
- Разделить "Отклонения и Решения" на два независимых пункта
- Порядок должен отражать доменную зависимость

---

# 📦 2. Планы урожая

## 2.1 List View

Таблица:

| Название | Сезон | Статус | Production | Budget | Critical Dev | Advisory | Действия |

### Поля:

- **Статус** — FSM HarvestPlan
- **Production** — есть ли ACTIVE TechMap
- **Budget** — есть ли LOCKED BudgetPlan
- **Critical Dev** — количество CRITICAL отклонений
- **Advisory** — OK / Warning / Critical

---

## 2.2 Detail View (Центральный хаб)

Страница плана = центр всей архитектуры.

### Блок 1 — FSM

- Текущий статус
- Кнопки transition
- Disabled + tooltip с причиной (из DomainRules)

---

### Блок 2 — Production Gate

- Active TechMap?
- Статус техкарты
- Ссылка на техкарту

---

### Блок 3 — Budget Gate

- LOCKED?
- Общий бюджет
- % исполнения
- Финансовые отклонения

---

### Блок 4 — Deviations Summary

- Кол-во CRITICAL
- Среднее время закрытия
- Ссылка на полный список

---

### Блок 5 — Advisory Summary

- Краткое резюме
- 3 последних предупреждения
- Ссылка на полный анализ

---

# 🌾 3. Техкарты

## 3.1 List View

| Поле | Культура | Сезон | Статус | Операций | ACTIVE | Действия |

ACTIVE должен отображаться как badge.

---

## 3.2 Detail View

### Блок 1 — FSM
Transition кнопки.

### Блок 2 — Операции
Список операций:
- дата
- тип
- нормы
- ресурсы

### Блок 3 — Связанный HarvestPlan

---

# 💰 4. Бюджеты

## 4.1 List View

| План | Сезон | Статус | Total | Actual | Deviation | Действия |

---

## 4.2 Detail View

### Блок 1 — FSM
DRAFT → APPROVED → LOCKED → EXECUTING → CLOSED

### Блок 2 — Budget Items

| Категория | План | Факт | Отклонение |

Если actual > planned → подсветка красным.

---

# ⚠ 5. Отклонения

Таблица:

| Тип | Severity | План | Дата | Статус | Решение |

Фильтры:
- PRODUCTION
- FINANCIAL
- CRITICAL

---

# 📜 6. Решения (CmrDecision)

Read-only журнал:

| План | Тип | Описание | Автор | Дата |

❗ Immutable. Без редактирования.

---

# 🧠 7. Advisory

## Plan Advisory
- Частота CRITICAL
- Среднее время закрытия
- Повторяющиеся решения

## Company Advisory
- Агрегация по сезонам
- Risk score

---

# 🎨 UX Правила

## 1. DomainRules → UI

Если действие запрещено:
- disabled кнопка
- tooltip с точной причиной

---

## 2. FSM всегда виден

Каждая сущность должна показывать:
- текущий статус
- возможные переходы

---

## 3. Цветовая семантика

- Зеленый — OK
- Желтый — Warning
- Красный — Critical
- Серый — Заблокировано

---

# 🚫 Не входит в спринт

- Execution Layer
- Графическая аналитика
- Новые бизнес-фичи
- Refactoring backend

---

# ✅ Definition of Done

- Меню отражает архитектуру
- HarvestPlan стал центральным хабом
- Все FSM визуализированы
- Domain ограничения видны пользователю
- Advisory отображается в UI
- Нет "невидимой" логики

---

# 📌 Результат

После спринта система должна:

- быть понятной визуально
- позволять "потрогать" доменную модель
- отражать все архитектурные ограничения
- подготовить основу для Execution Layer
