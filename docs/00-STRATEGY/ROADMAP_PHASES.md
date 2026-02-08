---
id: process-roadmap
type: process
status: approved
owners: [product-owner]
depends_on: [principle-vision, principle-axioms]
---

# Roadmap: Фазы развития RAI Enterprise Platform 🚀

> **Версия:** 1.1 (Architecture Update)

Наш путь от валидации идеи (Alpha) до глобальной экосистемы (Delta).

---

## 🏗️ Phase Alpha: Architecture Foundation (Текущая фаза)
**Цель:** Валидация архитектуры Core/Domain и фундамента для AI-оркестрации.

### Business Core & Domain
- [x] **Business Core**: Идентификация, иерархия (Компания-Поле), Task Engine.
- [x] **RAI Domain**: Оцифровка полей, управление культурами (Рапс как эталон).
- [x] **Interfaces**: Telegram-бот v1 (команды, уведомления), Web-дашборд.

### Architecture & Intelligence
- [x] **C4 Architecture**: Проектирование контейнеров и связей.
- [x] **Agro Process Layer (Design)**: Спроектирован Оркестратор и Граф Процессов (16 стадий).
- [x] **Unified Memory (Design)**: Спроектирована onion-архитектура памяти (Redis -> Graph -> Vectors).
- [ ] **APL Foundation**: Реализация базового Оркестратора и State Machine (без сложных правил).
- [ ] **Data**: Интеграция с PostGIS для точной геометрии.

---

## 💎 Phase Beta: Process Discipline (Scale)
**Цель:** Внедрение "Жесткой технологии" и полная оцифровка цикла.

### Agro Process Layer
- **Canonical Process Graph**: Полная реализация 16 стадий рапса.
- **Rule Engine**: Внедрение Hard Constraints (запрет операций при нарушении условий).
- **Control**: Чек-листы агронома с фото-фиксацией (глубина сева, фаза).

### Operations
- **Input & Supply**: Учет семян, СЗР и удобрений (связь склада с полем).
- **Machinery**: Учет техники и агрегатов.
- **Finance (Basic)**: Расчет прямых затрат на гектар.

---

## 🧠 Phase Gamma: Cognitive Intelligence (Vision)
**Цель:** Превращение накопленных данных в Знания и Опыт.

### Unified Memory Architecture
- **Semantic Memory**: Построение Графа Знаний (связи "Поле-Гибрид-Погода-Урожай").
- **Episodic Memory**: Векторный поиск похожих инцидентов ("Где еще мы так ошибались?").
- **Procedural Memory**: Автоматическая адаптация техкарт под условия.

### AI Solvers
- **Vision AI**: Распознавание болезней и вредителей по фото (блошка, цветоед).
- **Satellite Monitoring**: Интеграция NDVI/NDRE для зонирования полей.
- **Active Advisory**: AI сам предлагает решения, а не просто отвечает на вопросы.

---

## 🌐 Phase Delta: Ecosystem (Future)
**Цель:** Создание открытого рынка агроуслуг и данных.

- **Marketplace**: Интеграция поставщиков семян и техники.
- **Financial Services**: Агрострахование и кредитование на основе AI-скоринга рисков.
- **Global Expansion**: Мультиязычность и адаптация под законодательства других стран.
- **Open API**: Публичный доступ для сторонних разработчиков.

---

> [!NOTE]
> Фокус Alpha — не "Фичи", а "Правильная Архитектура". Без APL и Memory мы не построим Gamma.
