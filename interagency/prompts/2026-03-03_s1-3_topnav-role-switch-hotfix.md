# PROMPT — S1.3 TopNav / Role Switch Hotfix
Дата: 2026-03-03  
Статус: active  
Приоритет: P1  

## Цель
Канонически оформить и довести до review внеплановые UI-правки навигации: вернуть логичную структуру верхнего меню с иконками в головной полосе, dropdown/flyout-поведение подменю и исправить переключатель ролей в верхней control panel так, чтобы меню не схлопывалось при наведении.

## Контекст
- Правки уже внесены вне отдельного prompt-cycle в:
  - `apps/web/components/navigation/TopNav.tsx`
  - `apps/web/shared/components/GovernanceBar.tsx`
- Основание: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, блок AppShell / TopNav.
- Требование пользователя: сохранить канонический визуальный язык с иконками, но поменять структуру меню и вынести индикацию разделов в верхний ряд; переключатель роли должен жить в верхней control panel и работать без hover-gap.

## Ограничения (жёстко)
- Не менять доменные маршруты и содержимое `navigation-policy.ts` без крайней необходимости.
- Не ломать существующий AppShell / GovernanceBar layout.
- Не менять `workspaceContext`, `companyId` flow и agent/chat-контракты.
- Не вводить новый визуальный стиль; сохранить established visual language.

## Задачи (что сделать)
- [ ] Оформить текущие правки `TopNav.tsx` и `GovernanceBar.tsx` как отдельный hotfix task.
- [ ] Проверить, что верхнее меню:
  - использует иконки в головном меню,
  - поддерживает dropdown + боковые submenu,
  - не содержит нелогичного дублирования иконок/заголовков.
- [ ] Проверить, что role switch:
  - отображается только в верхней control panel,
  - не закрывается при переводе курсора на dropdown,
  - корректно меняет роль.
- [ ] Собрать review packet по канону с фактическими файлами и прогоном `tsc`.

## Definition of Done (DoD)
- [ ] Для внеконтурных правок создан отдельный canonical prompt/plan/report.
- [ ] `TopNav.tsx` и `GovernanceBar.tsx` покрыты отдельным review packet.
- [ ] `apps/web` проходит `tsc`.

## Тест-план (минимум)
- [ ] `pnpm --dir /root/RAI_EP/apps/web exec tsc -p tsconfig.json --noEmit`
- [ ] Manual smoke:
  - открытие dropdown верхнего меню,
  - наведение на submenu,
  - переключение роли из control panel dropdown.

## Что вернуть на ревью
- Изменённые файлы: `TopNav.tsx`, `GovernanceBar.tsx`
- Краткое описание фактических UI-правок
- Лог `tsc`
- Manual check: PASS/FAIL + что проверено
