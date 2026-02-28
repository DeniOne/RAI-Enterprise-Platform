# PROMPT 2 — INTERACTION CORE (TASK B + TASK E + TASK F)
# RAI_EP_UI_REFACTOR__P2_EDITMODE.md

## ROLE
Ты — UI Refactor Executor. Ты ВНОСИШЬ ПРАВКИ В КОД.
Запрещено: аудит, альтернативы, изменения backend/API/бизнес-логики/роутинга.

## GOAL
Внедрить масштабируемую архитектуру View/Edit режима без говнокода:
- Toggle Edit
- Компонентные обёртки (EditableField / ViewField)
- CTA иерархия
- Hit areas + focus ring + hover states

---

## HARD RULES
- [x] НЕ делай `isEdit ? <Input/> : <Text/>` прямо в каждом поле.
- [x] Вынеси логику в переиспользуемые компоненты:
  - [x] `EditableField` (в DataField.tsx)
  - [x] `ViewField` (в DataField.tsx)
  - [x] `EditModeProvider` (в DataField.tsx)
- [x] ViewMode не должен рендерить скрытые формы (не перегружать DOM).

---

## TASK B — VIEW / EDIT MODE (CRITICAL)

### B1 — Toggle и состояние
- [x] Добавить переключатель `Редактировать` (pencil).
- [x] Default: ViewMode.
- [x] EditMode включает редактирование только UI-слоя.

### B2 — ViewMode rules
- [x] Все поля = Label + Value, без рамок, без input-стилей.
- [x] Нет интерактивных селектов/дат.
- [x] Пустые значения = `—`.

### B3 — EditMode rules
- [x] Появляются inputs/selects.
- [x] Кнопки:
  - [x] `Сохранить` = Primary
  - [x] `Отмена` = Secondary
- [x] Cancel = UI rollback без API.
- [x] Валидация:
  - [x] error под полем
  - [x] layout не прыгает (min-height).

### B4 — Read-only поля
- [x] Read-only поля выглядят disabled/read-only.

### B5 — Acceptance B
- [x] В ViewMode нет input-рамок нигде.
- [x] EditMode явно отличается.
- [x] Нельзя изменить данные в ViewMode.

---

## TASK E — CTA HIERARCHY (High)

- [x] На странице ровно 1 Primary (глобальный Save/Apply).
- [x] Все Add-кнопки = Secondary/Outline.
- [x] Minor actions = Ghost/Text.
- [x] Нет конкурирующих чёрных/primary кнопок внутри табов.

---

## TASK F — INTERACTION (Medium)

### F1 — Табличные строки
- [x] hover background
- [x] cursor pointer
- [x] chevron справа (если строка ведёт внутрь)

### F2 — Hit-area
- [x] Минимальная hit-area 44×44:
  - [x] breadcrumb back
  - [x] icon buttons
  - [x] date-picker (иконка внутри input)

### F3 — Focus ring
- [x] Везде видимый focus ring.

### F4 — Branding & Identity
- [x] Вывод `shortName` (сокращенное название) в breadcrumbs и заголовок.

---

## TASK J — PROFILE COMPLETENESS (New)

- [x] Расчет полноты профиля (SCORE/TOTAL).
- [x] Индикатор прогресса в реестре (PartiesPage).
- [x] Красный список пропущенных полей в заголовке (PartyHubHeader).
- [x] Обязательные поля помечены `*` в режиме редактирования.
- [x] Строгая валидация в Zod (min(1) для обязательных полей).

---

## OUTPUT (MANDATORY)
- [x] CHANGED FILES: DataField.tsx, page.tsx, PartyHubHeader.tsx, PartyProfileTab.tsx, PartyBankAccountsTab.tsx, PartyContactsTab.tsx, PartyStructureTab.tsx, party-schemas.ts, party-completeness.ts, PartiesPage.tsx
- [x] CHANGELOG: B/E/F/J — Полная реализация View/Edit режима, CTA иерархии, интерактивности и системы полноты профиля.
- [x] ACCEPTANCE: B DONE, E DONE, F DONE, J DONE
- [ ] BLOCKED: если требуется backend — указать

# END