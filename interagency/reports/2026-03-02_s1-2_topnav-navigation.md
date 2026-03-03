# REPORT — S1.2 Shell: TopNav
Дата: 2026-03-03  
Статус: final  

## Что было целью
- Заменить `Sidebar` на `TopNav` в `apps/web`, сохранив навигацию из канонического `navigation-policy`.
- Не сломать persistent `RAI Chat` из S1.1 и не сломать shell/layout.
- Довести `RAI вывод` и мини-инбокс до рабочего состояния для review: открытие, сворачивание, сигналы, подсветка связанной карточки.

## Что сделано (факты)
- Добавлен новый shell-компонент [AppShell.tsx](/root/RAI_EP/apps/web/components/layouts/AppShell.tsx) как единая точка сборки `GovernanceBar + TopNav + WorkSurface + LeftRaiChatDock + workspace`.
- Создан [TopNav.tsx](/root/RAI_EP/apps/web/components/navigation/TopNav.tsx) и удалён legacy `Sidebar.tsx`.
- `TopNav` строится от `getVisibleNavigation(...)` и рендерит корневые разделы и вложенные flyout/dropdown на базе единого источника структуры.
- Левый пилон чата вынесен в [LeftRaiChatDock.tsx](/root/RAI_EP/apps/web/components/ai-chat/LeftRaiChatDock.tsx): постоянный shell-чат, resize по ширине, мини-инбокс сигналов.
- `RAI вывод` реализован как верхняя overlay-панель над workspace в [RaiOutputOverlay.tsx](/root/RAI_EP/apps/web/components/ai-chat/RaiOutputOverlay.tsx), а не как отдельная страница или отдельный layout.
- Мини-инбокс получил действия `Открыть / Перейти / Пометить`; `Открыть` раскрывает `RAI вывод` и подсвечивает связанную карточку.
- В [ai-chat-store.ts](/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts) добавлены состояния `chatWidth`, `readSignalIds`, `selectedSignalTarget`, явное `setWidgetsOpen`, сохранение shell-состояния между переходами.
- Убрано дублирование shell в route layouts под `(app)` и частично нормализован layout-слой: дочерние layout внутри `(app)` больше не вкладывают повторный `AuthenticatedLayout`.
- Устранены риски, найденные на внутреннем ревью:
  - исправлен conditional-hooks дефект в `RaiOutputOverlay`
  - действие `Перейти` больше не зависит от парсинга текста ответа агента
  - добавлены unit-тесты на store-поток сигналов

## Изменённые файлы
- `apps/web/components/navigation/TopNav.tsx`
- `apps/web/components/layouts/AppShell.tsx`
- `apps/web/components/ai-chat/LeftRaiChatDock.tsx`
- `apps/web/components/ai-chat/RaiOutputOverlay.tsx`
- `apps/web/components/ai-chat/AiChatPanel.tsx`
- `apps/web/lib/stores/ai-chat-store.ts`
- `apps/web/components/layouts/AuthenticatedLayout.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/(app)/layout.tsx`
- `apps/web/app/consulting/layout.tsx`
- `apps/web/app/(app)/economy/layout.tsx`
- `apps/web/app/(app)/finance/layout.tsx`
- `apps/web/app/(app)/front-office/layout.tsx`
- `apps/web/app/(app)/gr/layout.tsx`
- `apps/web/app/(app)/hr/layout.tsx`
- `apps/web/app/(app)/ofs/layout.tsx`
- `apps/web/app/(app)/production/layout.tsx`
- `apps/web/__tests__/ai-chat-store.spec.ts`
- `apps/web/components/navigation/Sidebar.tsx` (удалён)

## Проверки/прогоны
- `cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit` — PASS
- `cd apps/web && pnpm test -- --runTestsByPath __tests__/ai-chat-store.spec.ts` — PASS
- `curl -I http://127.0.0.1:3000/consulting/dashboard` — `200 OK`
- `curl -I http://127.0.0.1:3000/economy` — `200 OK`

## Что сломалось / что не получилось
- Реализация `TopNav` проходила через несколько итераций UX-правок по живым скриншотам; поэтому дифф крупнее, чем исходный scope “просто заменить Sidebar”.
- В рабочем дереве есть посторонние изменения вне review packet (`apps/api/*`, docs, memory-bank, `DECISIONS.log`). Они не входят в этот пакет и не должны трактоваться как часть `S1.2`.
- Полный manual smoke по всем пунктам menu и по ролям `ADMIN` / `AGRONOMIST` не завершён в рамках этого пакета.

## Следующий шаг
- Передать пакет на внешнее ревью Cursor-агенту.
- После ревью отдельно решить: нужна ли дополнительная полировка `TopNav`/`RAI вывод` или можно переходить к финализации.

## Технические артефакты

### git status
```text
 M apps/web/__tests__/ai-chat-store.spec.ts
 M apps/web/app/(app)/economy/layout.tsx
 M apps/web/app/(app)/finance/layout.tsx
 M apps/web/app/(app)/front-office/layout.tsx
 M apps/web/app/(app)/gr/layout.tsx
 M apps/web/app/(app)/hr/layout.tsx
 M apps/web/app/(app)/layout.tsx
 M apps/web/app/(app)/ofs/layout.tsx
 M apps/web/app/(app)/production/layout.tsx
 M apps/web/app/consulting/layout.tsx
 M apps/web/app/layout.tsx
 M apps/web/components/ai-chat/AiChatPanel.tsx
 M apps/web/components/layouts/AuthenticatedLayout.tsx
 M apps/web/lib/stores/ai-chat-store.ts
?? apps/web/components/ai-chat/LeftRaiChatDock.tsx
?? apps/web/components/ai-chat/RaiOutputOverlay.tsx
?? apps/web/components/layouts/AppShell.tsx
?? apps/web/components/navigation/TopNav.tsx
```

### git diff (ключевые фрагменты)
```diff
+ <AppShell>{children}</AppShell>
- <Sidebar role={currentRole} />
```

```diff
+ export function TopNav({ role }: TopNavProps) {
+   const rootItems = useMemo(() => getVisibleNavigation(role as UserRole), [role]);
+   ...
+ }
```

```diff
+ setWidgetsOpen: (open) => set({ widgetsOpen: open }),
+ setSelectedSignalTarget: (target) => set({ selectedSignalTarget: target }),
+ markSignalRead: (signalId) => ...
```

```diff
+ <button onClick={() => {
+   setWidgetsOpen(true);
+   setSelectedSignalTarget(signal.target ?? null);
+   markSignalRead(signal.id);
+ }}>
+   Открыть
+ </button>
```

### Логи прогонов
```text
$ cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit
PASS
```

```text
$ cd apps/web && pnpm test -- --runTestsByPath __tests__/ai-chat-store.spec.ts
PASS __tests__/ai-chat-store.spec.ts
  AiChatStore UX modes
    ✓ toggles panel mode between dock and focus
    ✓ toggles widgets visibility
    ✓ opens widgets explicitly without toggle side effects
    ✓ stores selected signal target for highlight flow
    ✓ marks signals as read idempotently
    ✓ preserves panel mode and widgets on route change
```

### Manual check
```text
Manual check: PASS (user-driven smoke по localhost со скриншотами: TopNav, overlay RAI output, сигналы мини-инбокса, route /consulting/dashboard и /economy проверялись интерактивно); FAIL/PENDING для полного прохода всех меню и проверки разных ролей.
```
