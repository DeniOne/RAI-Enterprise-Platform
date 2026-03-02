# REPORT — P2.3 UX шлифовка Dock/Focus, хоткеев и стабильности
Дата: 2026-03-02  
Статус: final  

## Ревью: APPROVED
Проверено по CANON/FORBIDDEN/SECURITY_CANON; UX-изменения ограничены `apps/web` вокруг чата/rail, tenant-модель не тронута, тяжёлых анимаций нет. Gap по web Draft→Commit честно зафиксирован.

---

## Что было целью
- Убрать UX-долг в текущем web-чате без редизайна ради редизайна.
- Ввести минимальные режимы `Dock/Focus`, рабочие хоткеи и управляемость rail виджетов.
- Не допустить регрессий core-flow `чат -> виджеты`, а также честно проверить, есть ли в `apps/web` реальный `Draft→Commit` сценарий для smoke.

## Что сделано (факты)
- Подтверждён `Decision-ID` `AG-UX-POLISH-001` со статусом `ACCEPTED` в `DECISIONS.log`.
- В `apps/web/lib/stores/ai-chat-store.ts` добавлены новые UX-состояния:
  - `panelMode: "dock" | "focus"`
  - `widgetsOpen: boolean`
  - экшены `togglePanelMode`, `toggleWidgets`
  - сброс режима/rail при `ROUTE_CHANGE`
- В `apps/web/components/ai-chat/AiChatPanel.tsx` реализованы:
  - режимы `Dock/Focus` с разной геометрией панели;
  - toolbar-кнопки для переключения режима и rail;
  - хоткеи:
    - `Ctrl/Cmd+K` — фокус в input;
    - `Ctrl+Shift+.` / `Cmd+Shift+.` — переключение `Dock/Focus`;
    - `Ctrl+/` / `Cmd+/` — сворачивание и разворачивание rail виджетов.
- В `apps/web/components/ai-chat/AiChatWidgetsRail.tsx` rail сделан сворачиваемым:
  - в закрытом состоянии занимает узкую колонку;
  - сохраняет toggle-control;
  - не теряет поддержку typed widgets и fallback для неизвестного типа.
- В `apps/web/components/ai-chat/SproutMorphAnimation.tsx` снижена тяжесть overlay:
  - короче transition;
  - мягче motion;
  - `focus`-режим центрирует панель;
  - `dock`-режим сохраняет привязку к нижнему правому углу.
- В `apps/web/components/ai-chat/AiChatFab.tsx` облегчён визуальный стиль FAB под light canon:
  - белая поверхность;
  - `border-black/10`;
  - без тяжёлого тёмного паттерна.
- В `apps/web/components/ai-chat/AiChatRoot.tsx` hotkey opening нормализован на `e.key.toLowerCase()`, чтобы `Ctrl/Cmd+K` работал стабильнее.

## Изменённые файлы
- `apps/web/lib/stores/ai-chat-store.ts`
- `apps/web/components/ai-chat/AiChatPanel.tsx`
- `apps/web/components/ai-chat/AiChatWidgetsRail.tsx`
- `apps/web/components/ai-chat/SproutMorphAnimation.tsx`
- `apps/web/components/ai-chat/AiChatFab.tsx`
- `apps/web/components/ai-chat/AiChatRoot.tsx`
- `apps/web/__tests__/ai-chat-store.spec.ts`
- `apps/web/__tests__/ai-chat-widgets-rail.spec.tsx`
- `interagency/INDEX.md`
- `interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md`

## Проверки/прогоны
- `pnpm --dir /root/RAI_EP/apps/web test -- --runInBand __tests__/ai-chat-widgets-rail.spec.tsx __tests__/ai-chat-store.spec.ts` -> **PASS**
- Результат: `2` suite, `6` tests, всё `PASS`
- `pnpm --dir /root/RAI_EP/apps/web exec tsc -p tsconfig.json --noEmit` -> **PASS**
- Manual/code check: **PASS**
  - rail сворачивается и не теряет toggle-кнопку;
  - `ROUTE_CHANGE` сбрасывает `focus`/`widgetsOpen` в безопасное дефолтное состояние;
  - хоткеи не требуют новых backend API.

## Что сломалось / что не получилось
- В `apps/web` не найден реальный живой UI-сценарий `agro Draft→Commit`; найден только backend/API-контур `apps/api/src/modules/agro-events/*` и несвязанный экран `apps/web/app/consulting/plans/drafts/page.tsx`, который не реализует commit этого потока.
- Поэтому обязательный smoke `Draft→Commit` на web не был выполнен как UI-сценарий; это зафиксированный scope-gap, а не пропуск “по лени”.
- Отдельный browser/manual smoke с реальным нажатием клавиш и визуальным осмотром overlay не выполнялся; текущий пакет подтверждён через unit-тесты, `tsc` и кодовую проверку.

## Следующий шаг
- Внешнее ревью пакета `P2.3`.
- После `APPROVED`: финализация статусов, truth-sync чеклистов и `memory-bank`, затем commit.

## Технические артефакты

### git status
```text
 M apps/web/__tests__/ai-chat-widgets-rail.spec.tsx
 M apps/web/components/ai-chat/AiChatFab.tsx
 M apps/web/components/ai-chat/AiChatPanel.tsx
 M apps/web/components/ai-chat/AiChatRoot.tsx
 M apps/web/components/ai-chat/AiChatWidgetsRail.tsx
 M apps/web/components/ai-chat/SproutMorphAnimation.tsx
 M apps/web/lib/stores/ai-chat-store.ts
?? apps/web/__tests__/ai-chat-store.spec.ts
?? interagency/plans/2026-03-02_p2-3_ux-polish-dock-focus.md
?? interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md
```

### git diff (ключевые фрагменты)
```diff
diff --git a/apps/web/lib/stores/ai-chat-store.ts b/apps/web/lib/stores/ai-chat-store.ts
+export type PanelMode = 'dock' | 'focus';
+panelMode: 'dock'
+widgetsOpen: true
+togglePanelMode: () => ...
+toggleWidgets: () => ...

diff --git a/apps/web/components/ai-chat/AiChatPanel.tsx b/apps/web/components/ai-chat/AiChatPanel.tsx
+Ctrl/Cmd+K -> focus input
+Ctrl+Shift+. -> toggle Dock/Focus
+Ctrl+/ -> toggle widgets
+panelWidthClass = { dock, focus }
+toolbar buttons for panel mode and widgets rail

diff --git a/apps/web/components/ai-chat/AiChatWidgetsRail.tsx b/apps/web/components/ai-chat/AiChatWidgetsRail.tsx
+isOpen: boolean
+onToggle: () => void
+collapsed rail state with persistent toggle button
```

### Логи прогонов
```text
$ pnpm --dir /root/RAI_EP/apps/web test -- --runInBand __tests__/ai-chat-widgets-rail.spec.tsx __tests__/ai-chat-store.spec.ts
PASS __tests__/ai-chat-store.spec.ts
PASS __tests__/ai-chat-widgets-rail.spec.tsx

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

```text
$ pnpm --dir /root/RAI_EP/apps/web exec tsc -p tsconfig.json --noEmit
PASS
```

### Smoke-чеклист (что нажать, что увидеть)
```text
1. Открыть чат через FAB или Ctrl/Cmd+K.
2. В открытом чате нажать Ctrl/Cmd+K -> курсор должен перейти в input.
3. Нажать Ctrl+Shift+. / Cmd+Shift+. -> панель должна переключиться между Dock и Focus.
4. Нажать Ctrl+/ / Cmd+/ -> rail виджетов должен свернуться/развернуться.
5. Отправить сообщение -> чат не должен падать, rail должен продолжать рендерить widgets/fallback.
```
