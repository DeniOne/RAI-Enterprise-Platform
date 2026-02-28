# PROMPT 1 — FOUNDATION (TASK A + TASK D + TASK H)
# RAI_EP_UI_REFACTOR__P1_FOUNDATION.md

## ROLE
Ты — UI Refactor Executor (Senior FE). Ты ВНОСИШЬ ПРАВКИ В КОД.
Запрещено: аудит, альтернативы, новые требования, правка backend/API/DTO/бизнес-логики/роутинга.

## GOAL
Сделать базовый institutional слой:
- Шапка карточки (H1/quick-scan/группы статусов)
- Визуальная система через ГЛОБАЛЬНУЮ ТЕМУ (не инлайн-масс-рефакторинг классов)
- Production cleanup (debug/placeholder/битые символы/пустые значения)

---

## HARD RULES (НЕ ОБСУЖДАЕТСЯ)
- [x] НЕ правь backend и контракты API.
- [x] НЕ меняй смысл данных.
- [x] Любой placeholder/DEV текст в UI: удалить или спрятать за Dev-toggle.
- [x] Пустые значения: отображать `—`.
- [x] Никаких массовых правок rounded/shadow по всем файлам вручную. ДЕЛАЙ через глобальную тему.

---

## TASK A — HEADER FIX (CRITICAL)

### A1 — H1
- [x] H1 содержит ТОЛЬКО краткое имя (например `ООО «ЧЕРЕМШАНАГРО»`).
- [x] Полное юр. наименование расположено ниже H1 (secondary text).

### A1.1 — Реестры и списки (Registry List)
- [x] В списках выводить `shortName` вместо `legalName`.
- [x] Fallback на `legalName` если короткое пустое.
- [x] Добавить `title` аттрибут с полным именем для всех элементов списка.

- [x] Удалить дубли H1 (ровно 1 на странице).
- [x] Запретить “обрезку как баг”:
  - [x] применить max 2 строки + tooltip на hover (обязательный tooltip)
  - [x] НЕ использовать просто ellipsis без tooltip

### A2 — Quick-scan row (под H1, 1–2 строки)
- [x] Показать ИНН/УНП (по юрисдикции)
- [x] Юрисдикция
- [x] Тип субъекта
- [x] Статус
- [x] Compliance (СБ/этап)

### A3 — Визуальное разделение статус-слоёв
- [x] Разделить на группы (visual grouping):
  - [x] Identity
  - [x] Governance
  - [x] Compliance
  - [x] Process

### A4 — Acceptance
- [x] ИНН и статус видны без скролла.
- [x] Нет повторов H1.
- [x] Tooltip на полное имя работает.

---

## TASK D — VISUAL SYSTEM HARDENING (через глобальную тему)

### D0 — Обязательное правило реализации
- [x] Внеси правки через глобальный конфиг темы:
  - [x] tailwind.config.(js/ts) tokens ИЛИ
  - [ ] Ant Design ConfigProvider theme tokens
- [x] Запрещено: “пройтись по всем компонентам и заменить rounded-xl на rounded-md руками”.

### D1 — Radius / Shadow / Borders
- [x] Глобально установить radius <= 12px (card/input/tab).
- [x] Глобально унифицировать тени (либо убрать, либо одна мягкая).
- [x] Глобально задать border 1px единым neutral цветом.

### D2 — Typography rules
- [x] Убрать ALL CAPS заголовки секций (Sentence case).
- [x] Labels:
  - [x] color: #6B7280 или темнее
  - [x] size: >= 13px
  - [x] weight: >= 500
- [x] Запретить label в CAPS.

### D3 — Tabs active state
- [x] Применить единый паттерн active state (выбран: underline).
- [x] Активный таб НЕ сливается с контентом ниже.

### D4 — Alerts
- [x] Превратить “цветные теги” в системные алерты:
  - [x] иконка слева
  - [x] читаемый контрастный текст
  - [x] единый контейнер

---

## TASK H — PRODUCTION CLEANUP (CRITICAL)

- [x] Удалить debug-тексты (SYSTEM CANONICAL, simulate roles, etc) или спрятать за Dev-toggle.
- [x] Удалить placeholders “COMING SOON”.
- [x] Заменить “graph coming soon” на корректный Empty State (иконка + текст + CTA).
- [x] Исправить артефакты вывода: запрет `.`
- [x] Везде, где значение отсутствует: `—`

---

## OUTPUT (MANDATORY)
- [x] CHANGED FILES: список путей
- [x] CHANGELOG: пункты A/D/H
- [x] ACCEPTANCE: A DONE/NOT DONE, D DONE/NOT DONE, H DONE/NOT DONE
- [ ] BLOCKED: если требуется backend — описать строго что именно

# END