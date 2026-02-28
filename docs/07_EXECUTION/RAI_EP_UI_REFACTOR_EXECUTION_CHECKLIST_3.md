# PROMPT 3 — LIST TABS + GRAPH (TASK C + TASK G)
# RAI_EP_UI_REFACTOR__P3_TABLES.md

## ROLE
Ты — UI Refactor Executor. Ты ВНОСИШЬ ПРАВКИ В КОД.
Запрещено: аудит, альтернативы, изменения backend/API/бизнес-логики/роутинга.

## GOAL
Сделать табы списков масштабируемыми:
- Банковские счета (table)
- ЛОПР (table)
- Связанные активы (2 tables)
- Графический плейсхолдер структуры

---

## HARD RULES
- [x] Запрещено: форма “одной записи” вместо таблицы.
- [x] В ViewMode НЕ рендерить скрытые формы.
- [x] Для форм добавления использовать существующую форму-библиотеку проекта:
  - [x] Использование React Hook Form через useFormContext и SidePanelForm
- [x] Паттерн формы должен быть единым для всех табов:
  - [x] Использован Drawer (SidePanelForm).

---

## TASK C — TABULAR SCALABILITY (CRITICAL)

### C1 — Банковские счета
- [x] Отображать таблицу счетов.
- [x] Колонки: Банк, IBAN/Счёт, БИК, Валюта, Primary, Actions.
- [x] Кнопка `Добавить счёт` = Secondary/Outline.
- [x] Add открывает форму Drawer.
- [x] 10+ записей не ломают layout.

### C2 — Ключевые лица / ЛОПР
- [x] Таблица лиц.
- [x] Колонки: ФИО, Роль, Контакты, Valid from, Valid to, Actions.
- [x] Add = Secondary/Outline.
- [x] В EditMode доступно добавление/редактирование через Drawer.
- [x] Нет “карточки одного лица”.

### C3 — Связанные активы
- [x] Секция 1: Корпоративная структура (table).
- [x] Секция 2: Операционные активы (table).
- [x] Колонки: Объект (link), Тип связи, Роль, Valid from, Valid to, Actions.
- [x] Add = Secondary/Outline, форма Drawer.
- [x] Нет placeholder “COMING SOON”.
- [x] 20 связей не ломают UI.

### C4 — Empty states
- [x] Иконка + текст + CTA Add.

### C5 — Layout resilience
- [x] Табличная компактность и горизонтальный скролл.

### C6 — Graph engine
- [x] Замена Coming Soon на премиальный плейсхолдер с CTA.

---

## OUTPUT (MANDATORY)
- [x] CHANGED FILES: PartyBankAccountsTab.tsx, PartyContactsTab.tsx, PartyStructureTab.tsx, party-schemas.ts
- [x] CHANGELOG: C1-C6 — Полный рефакторинг списочных вкладок в табличный вид с использованием Drawer-форм. Добавлена поддержка новых полей и улучшена масштабируемость.
- [x] ACCEPTANCE: C1 DONE, C2 DONE, C3 DONE, C4 DONE, C5 DONE, C6 DONE
- [ ] BLOCKED: нет

# END