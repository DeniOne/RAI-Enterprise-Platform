---
id: DOC-ARC-PRINCIPLES-FRONT-CANON-BETA-1VUB
layer: Architecture
type: Standards
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# Front Canon (Beta) 🔒 Normative / Binding

**Область:** Front-end Phase Beta  
**Назначение:** Зафиксировать, какой фронт допустим, а какой запрещён в Beta

---

## 1. Философия Front (ключевая)
**Базовый принцип:**  
> **Front = Projection of System Truth, not a Control Surface**

### Фронт в Beta:
❌ **не управляет**  
❌ **не интерпретирует**  
❌ **не исправляет**  
❌ **не «помогает обойти»**

### Фронт:
✅ **отображает**  
✅ **объясняет**  
✅ **сигнализирует**  
✅ **фиксирует контекст принятия решений**

---

## 2. Целевая аудитория (жёстко ограничена)
### Разрешённые роли (Beta)
- CEO / Founder
- Chief Architect / CTO
- Head of Legal / Compliance
- Head of R&D
- (опционально) Strategy / Risk Officer

### Запрещённые роли
❌ **рядовые сотрудники**  
❌ **исполнители**  
❌ **агрономы / операторы**  
❌ **консультанты**  
❌ **внешние пользователи**

👉 **Фронт Beta — не продукт, а панель управления истиной.**

---

## 3. Scope фронта (что МОЖНО показывать)

### 3.1 Global State View (обязательный)
Показывает текущие состояния ключевых контуров:
- Operations (B1)
- R&D (B5)
- Legal / Compliance (B4)
- Risk (агрегировано)

**Формат:** read-only, state badges, объяснение причин (WHY, не HOW).

### 3.2 R&D View (обязательный)
Показывает:
- список экспериментов
- текущий FSM state
- активный протокол (версия, статус)
- индикаторы: `protocol approved`, `measurements locked`, `legal constraints applied`.

**Запрещено:** редактировать протокол, менять state, вводить данные.

### 3.3 Legal / Compliance View (обязательный)
Показывает:
- LegalRequirements
- ComplianceStatus
- активные Obligations
- применимые Sanctions (потенциальные)

**Ключевое требование:** Каждый статус обязан иметь объяснение, а не просто цвет.

### 3.4 Risk Awareness View (обязательный, даже без Risk Engine)
Показывает:
- агрегированный risk level (LOW / MEDIUM / HIGH)
- источники риска: Legal, R&D, Operations
- направление риска (escalating / stable)

⚠️ **Без расчётов, только индикация — расчёты будут в B6.**

---

## 4. Scope фронта (что ЗАПРЕЩЕНО)
### ❌ Абсолютные запреты (Non-Negotiable)
Фронт Beta **НЕ МОЖЕТ**:
1. Менять FSM state напрямую.
2. Обходить Orchestrator.
3. Создавать или редактировать: `Protocol`, `Measurement`, `ComplianceCheck`.
4. Иметь “override”, “force”, “admin edit”.
5. Делать массовые операции.
6. Служить источником данных.

---

## 5. Архитектурные правила фронта
### 5.1 Read Model Only
Фронт работает только с read-API. Никаких write эндпоинтов в UI.

### 5.2 Zero Business Logic
Никакой логики принятия решений. Максимум: форматирование, агрегация для отображения, explanation mapping.

### 5.3 Explicit Constraints Visualization
Если что-то запрещено, UI **обязан** показать почему со ссылкой на `LegalRequirement`, `Experiment state` или `Risk source`.

---

## 6. UX-принципы (Beta)
- **Стиль:** холодный, минималистичный, без геймификации, без “успехов” и “подсказок”.
- **Тон:** не мотивирующий, не обучающий, информирующий и предупреждающий.

---

## 7. Взаимодействие с операционкой (важно)
Front Beta **НИКОГДА** не общается напрямую с B1 (Operations). Только через агрегированные состояния, сигналы блокировок или risk / compliance flags.

---

## 8. Security & Governance
- Role-based access (hard-coded).
- No public routes.
- No shareable links.
- Audit logging (view access).

---

## 9. Чёткие границы Beta Front
### Что считается успехом Beta Front:
- Руководство понимает, что происходит.
- Появляется осознанность ограничений.
- Нет ни одного инцидента обхода логики.

### Что НЕ является целью:
- удобство
- массовость
- скорость операций
- пользовательская любовь

---

## 10. Итоговая фиксация (Canon Statement)

> **Front Canon (Beta):**  
> Фронт — это проекция зафиксированной истины системы для ограниченного круга ответственных лиц, не обладающая властью изменять эту истину.
