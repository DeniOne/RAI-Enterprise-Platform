# PROMPT — S1.2 Shell: TopNav (горизонтальная навигация)
Дата: 2026-03-02  
Статус: active  
Приоритет: P1  

## Цель
Реализовать горизонтальную навигацию `TopNav` в `apps/web` согласно Agent-First Spec. Заменить текущий `Sidebar` на `TopNav` с выпадающими меню, сохранив всю логику доступов и навигации.

## Контекст
- Основание: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (раздел **1.2 TopNav**).
- Логика навигации (Single Source of Truth): `apps/web/lib/consulting/navigation-policy.ts`.
- Текущая реализация (для примера стилей и ролей): `apps/web/components/navigation/Sidebar.tsx`.
- Точка интеграции: `apps/web/components/layouts/AppShell.tsx`.

## Ограничения (жёстко)
- **Только русский язык**: Весь интерфейс строго на русском (`LANGUAGE_POLICY.md`).
- **UI Design Canon**: Шрифт Geist, веса 400/500, белый фон, `border-black/10`, `rounded-2xl` для выпадающих списков (`UI_DESIGN_CANON.md`).
- **Сохранение иерархии**: Использовать `CONSULTING_NAVIGATION` как единственный источник структуры.
- **Multi-tenancy**: Не нарушать проброс ролей и прав доступа.
- **Без регрессий**: Навигация не должна ломать AppShell и persistent RAI Chat (S1.1).

## Задачи (что сделать)
- [ ] Создать компонент `apps/web/components/navigation/TopNav.tsx`.
- [ ] Реализовать структуру групп согласно инварианту:
  - **Урожай** (id: crop_dashboard)
  - **CRM** (id: crm)
  - **Финансы** (id: finance + economy)
  - **Коммерция** (id: commerce)
  - **Настройки** (id: settings + gr + knowledge + exploration)
- [ ] Реализовать выпадающие списки (Dropdown) для каждой группы, отображая подпункты из `subItems`.
- [ ] Поддержать состояния `active` (текущий маршрут) и `disabled` (из контракта NavItem).
- [ ] Интегрировать логотип в левую часть `TopNav`.
- [ ] В `AppShell.tsx` удалить `Sidebar` и вставить `TopNav` над основным контентом.
- [ ] Скорректировать стили `AppShell`, чтобы рабочая область занимала всю ширину (убрать padding/margin от бывшего Sidebar).

## Definition of Done (DoD)
- [ ] `TopNav` полностью заменяет `Sidebar` без потери функциональности.
- [ ] Все пункты меню `CONSULTING_NAVIGATION` доступны согласно ролям.
- [ ] UI соответствует `UI_DESIGN_CANON.md`.
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` в `apps/web` проходит без ошибок.
- [ ] Чат в Shell (S1.1) продолжает работать корректно.

## Тест-план (минимум)
- [ ] Manual smoke: клик по каждой группе меню -> проверка выпадающих списков.
- [ ] Переход по ссылкам -> проверка корректности роутинга и `active` состояния.
- [ ] Проверка под разными ролями (ADMIN vs AGRONOMIST) — пункты меню фильтруются правильно.

## Что вернуть на ревью
- Изменённые файлы (список).
- Скриншот нового `TopNav` (если возможно описание словами).
- Вывод `tsc`.
