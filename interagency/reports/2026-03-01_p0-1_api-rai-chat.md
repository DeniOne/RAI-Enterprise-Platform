# REPORT — P0.1 Реальный чат endpoint в `apps/api`
Дата: 2026-03-01  
Статус: done  

## Результат (какой артефакт получим)
- Реализован канонический endpoint `POST /api/rai/chat` в `apps/api`.
- UI в `apps/web` переключен на использование нового эндпоинта.
- Убрана мок-логика из веба.
- Юнит-тесты контроллера проходят успешно.

## Что сделано (факты)
1. **[API]** Создан модуль `RaiChatModule` в `apps/api/src/modules/rai-chat/`.
2. **[API]** Реализован `RaiChatController` с детерминированным ответом и обязательной проверкой `companyId` из `TenantContextService`.
3. **[API]** Подключен `RaiChatModule` в `AppModule`.
4. **[WEB]** В `ai-chat-store.ts` изменен URL запроса на `/api/rai/chat`.
5. **[WEB]** В `apps/web/app/api/ai-chat/route.ts` (legacy) мок-логика заменена на тонкий прокси к бэкенду.
6. **[TEST]** Добавлены и успешно пройдены юнит-тесты: `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts`.

## Изменённые файлы
- `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
- `apps/api/src/modules/rai-chat/rai-chat.controller.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/app.module.ts`
- `apps/web/lib/stores/ai-chat-store.ts`
- `apps/web/app/api/ai-chat/route.ts`
- `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts`

## Проверки/прогоны
- `npx jest test/modules/rai-chat/rai-chat.controller.spec.ts` — **PASS** (4/4 tests).
- Проверка структуры файлов и импортов — **OK**.

## Что сломалось/не получилось
- Изначально тест был создан внутри `src/modules`, перенесен в `test/modules` согласно канону API.

## Следующий шаг
- Интеграция реальной логики поиска (Advisory/Exploration) в `RaiChatController`.
