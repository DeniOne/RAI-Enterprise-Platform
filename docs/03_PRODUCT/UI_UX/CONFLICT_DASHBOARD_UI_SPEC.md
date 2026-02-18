---
id: DOC-PROD-UI-LC-001
type: Product Specification
layer: UI/UX
status: Draft
version: 1.3.0
owners: [@product, @techlead]
last_updated: 2026-02-18
---

# CONFLICT DASHBOARD — UI SPECIFICATION
## Интерфейс визуализации конфликтов Level C (Hardened)

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Привязка:** Conflict Engine API (v1.3.0), Level C Architecture  
**UI Canon:** Обязательное соблюдение UI_DESIGN_CANON.md

---

## 1. Назначение

**Conflict Dashboard** — интерфейс для:
1. Просмотра ΔRisk в разрезе 3-х компонент (Yield, Financial, Compliance)
2. Управления процессом Human Override (FSM states)
3. Обеспечения аудита через simulationHash и Trace IDs

---

## 2. Компоненты интерфейса

### 2.1. Override Warning Panel (Isomorphic)

**Триггер:** Ответ от `/api/v1/conflict/override`

**Содержимое:**
```
┌──────────────────────────────────────────────────┐
│ [LEVEL: CRITICAL] ⚠ КРИТИЧЕСКИЙ РИСК             │
├──────────────────────────────────────────────────┤
│ AI рекомендует: Азот 100 кг/га                  │
│ Вы выбрали:     Азот 120 кг/га                  │
│                                                  │
│ Структура ΔRisk:                                │
│   • Риск урожая:      +8.2%                     │
│   • Финансовый риск:  +4.1%                     │
│   • Регуляторный:     +2.7%                     │
│ → Итоговый риск:     +15.0%                     │
├──────────────────────────────────────────────────┤
│ Simulation ID: sha256:v1:... (expandable)       │
│                                                  │
│ [Показать Radar Chart]   [Перейти к подтверждению]│
└──────────────────────────────────────────────────┘
```

**UI Canon:**
- Цвет фона при `isCritical`: `bg-red-50` с `border-red-500`, текст заголовка `text-red-700`.
- Шрифт: Geist Mono для хешей и системных ID.
- При `riskLevel == HIGH`: `bg-orange-50` с `border-orange-500`.

### 2.2. Conflict Vector (Radar Chart Isomorphism)

**Оси Radar Chart (Strict API Alignment):**
1.  **Yield Stability** (на базе `yieldRisk`)
2.  **Financial Resilience** (на базе `financialRisk`)
3.  **Regulatory Compliance** (на базе `complianceRisk`)
4.  **Total Risk Impact** (на базе `totalRisk`)
5.  **Conflict Divergence** (на базе `divergenceScore`)

**UI Canon:**
- AI линия: `stroke-blue-500`
- Human линия: `stroke-orange-500` (при конфликте)
- Mobile: Не скрывать, а сворачивать в Accordion. При `isCritical` авто-разворачивание.

### 2.3. Audit Transparency Section

**Поля (скрыты под "Подробности аудита"):**
- `Override ID`: UUID
- `Trace ID`: X-Correlation-ID
- `Simulation Hash`: Полный SHA-256
- `Hash Mismatch Info` (при 412):
    - `Expected`: sha256:v1:abc...
    - `Received`: sha256:v1:xyz...
- `Hash Algorithm`: 'sha256:v1'
- `Timestamp`: Server monotonic UTC

---

## 3. Interaction Flow (FSM Consistent)

### Стандартный флоу:
1. `OVERRIDE_ANALYSIS` (User меняет параметр)
2. `PENDING_CONFIRMATION` (Блокировка ввода, показ Warning Panel)
    - **425 / 202 (Idempotency)**: Показ Loader, текст "Проверка хешей...", кнопка Confirm деактивирована.
3. `RE_VERIFICATION_REQUIRED` (Если получен **412 Simulation Drift**)
    - Показ Error Alert: "Состояние данных изменилось. Требуется пересчет."
    - Кнопка: [Обновить и пересчитать]. Возврат на шаг 1.
4. `ESC_REQUIRED` (Если `isCritical == true`)
    - Показать `justification` textarea.
    - Кнопка "Подтвердить" залочена до ввода текста (I33).
5. `APPROVED` (После `/confirm` ИЛИ при получении `status: AUTO_APPROVED`)
    - При `AUTO_APPROVED`: Скип этапа PENDING и ESCALATION.
    - Показ Toast: "Переопределение автоматически подтверждено".

---

## 4. Divergence History (Audit View)

**График:**
- Точки маркируются цветом `riskLevel` (Yellow: Medium, Orange: High, Red: Critical).
- При клике на точку:
    - Показ `justification` руководителя
    - Ссылка на `Divergence ID`

---

## 5. Связанные документы

- [CONFLICT_API_SPEC.md](file:///f:/RAI_EP/docs/04_ENGINEERING/LEVEL_C/CONFLICT_API_SPEC.md)
- [LEVEL_C_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_ARCHITECTURE.md)

---

[Changelog]
- v1.0.0: Базовый набросок UI.
- v1.1.0: Hardened Audit Sync. Изоморфность ΔRisk, маппинг riskLevel, полная прозрачность хешей и Trace IDs.
- v1.2.0: Expert UI Polish. Isomorphic Radar axes, Red-Critical semantics, 412/425 error handling flows.
- v1.3.0: Final Fine-Grain Polish. AUTO_APPROVED flow implementation, Hash Mismatch transparency (Expected/Received), and Radar signal separation. (Formal-Grade)
