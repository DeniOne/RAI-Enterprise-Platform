# REPORT — P0.4 Telegram Bot Draft→Commit
Дата: 2026-03-01  
Статус: final  

## Что было целью
- Подключить `apps/telegram-bot` к каноническому Agro Draft→Commit API в `apps/api` без второго телеграм-контура.
- Сделать intake в боте для `text` / `photo` / `voice` с обязательным созданием draft и кнопками `✅✏️🔗`.
- Сохранить tenant isolation: не принимать `companyId` из callback/body и работать только через доверенный `accessToken`.

## Что сделано (факты)
- В `ApiClientService` добавлены методы для `POST /api/agro-events/drafts|fix|link|confirm` и тип ответа `AgroDraftResponseDto`.
- В `SessionService` добавлено состояние `pendingAgroAction` для двухшаговых сценариев `fix` и `link`.
- В `telegram.update.ts` старый поток `createObservation` для `text/photo/voice` заменён на канонический agro-flow:
  - `text` создаёт draft;
  - `photo` создаёт draft с `evidence.type=photo` и caption/coordinates в payload;
  - `voice` создаёт draft с `evidence.type=audio`.
- Добавлены inline-кнопки `✅✏️🔗` с коротким callback-форматом `ag:<action>:<draftId>` и защитой по лимиту Telegram `<= 64`.
- `confirm` вызывает `agro-events/confirm`; `fix` и `link` переводят бота в ожидающий режим и завершаются следующим сообщением пользователя.
- Для `link` реализован минимальный parser формата `farm=... field=... task=...`.
- Добавлен unit-spec `telegram.update.spec.ts` на ключевые ветки `text -> draft`, `photo -> draft`, `text refs -> link`, `confirm`.
- Добавлен smoke-скрипт `apps/telegram-bot/scripts/agro-draft-commit-smoke.ts` для сценарного прогона `photo -> draft -> link -> confirm -> committed` с логами.

## Изменённые файлы
- `apps/telegram-bot/src/shared/api-client/api-client.service.ts`
- `apps/telegram-bot/src/shared/session/session.service.ts`
- `apps/telegram-bot/src/telegram/telegram.update.ts`
- `apps/telegram-bot/src/telegram/telegram.update.spec.ts`
- `apps/telegram-bot/scripts/agro-draft-commit-smoke.ts`

## Проверки/прогоны
- Команда:
  - `node ./node_modules/jest/bin/jest.js --runInBand src/telegram/telegram.update.spec.ts`
- Результат:
  - `PASS src/telegram/telegram.update.spec.ts`
  - `Tests: 5 passed, 5 total`
- Команда:
  - `npx tsc --noEmit -p /root/RAI_EP/apps/telegram-bot/tsconfig.json`
- Результат:
  - завершилась без вывода и без ошибок.
- Команда:
  - `node -r ts-node/register/transpile-only ./scripts/agro-draft-commit-smoke.ts`
- Результат:
  - сценарный smoke-прогон `photo -> draft -> link -> confirm -> committed` завершён успешно, логи приложены ниже.

## Что сломалось / что не получилось
- Живой e2e против Telegram/API-стенда не прогонялся в этой задаче; сценарный прогон выполнен на mocked transport/API через `ts-node`.
- В `telegram.update.ts` остаются старые участки с историческими строками/кодировкой вне scope P0.4; они не рефакторились намеренно.

## Следующий шаг
- Внешнее ревью пакета P0.4.
- После `APPROVED` синхронизировать статус в проектных чеклистах и продолжить следующий этап roadmap.

## Технические артефакты

### git status
```text
 M apps/telegram-bot/src/shared/api-client/api-client.service.ts
 M apps/telegram-bot/src/shared/session/session.service.ts
 M apps/telegram-bot/src/telegram/telegram.update.ts
 M interagency/plans/2026-03-01_p0-4_telegram-bot-draft-commit.md
?? apps/telegram-bot/scripts/
?? apps/telegram-bot/src/telegram/telegram.update.spec.ts
```

### git diff
Ключевой tracked diff:
```diff
diff --git a/apps/telegram-bot/src/shared/api-client/api-client.service.ts b/apps/telegram-bot/src/shared/api-client/api-client.service.ts
+export interface AgroDraftResponseDto { ... }
+async createAgroEventDraft(...)
+async fixAgroEventDraft(...)
+async linkAgroEventDraft(...)
+async confirmAgroEventDraft(...)
```

```diff
diff --git a/apps/telegram-bot/src/telegram/telegram.update.ts b/apps/telegram-bot/src/telegram/telegram.update.ts
+const AGRO_CALLBACK_PREFIX = "ag";
+const AGRO_CALLBACK_MAX_LENGTH = 64;
+@Action(/ag:([cfl]):([A-Za-z0-9-]+)/)
+private parseLinkPatch(message: string)
+private createAgroDraftFromText(...)
+private createAgroDraftFromPhoto(...)
+private createAgroDraftFromVoice(...)
- await this.apiClient.createObservation(...)
+ await this.apiClient.createAgroEventDraft(...)
+ await this.apiClient.linkAgroEventDraft(...)
+ await this.apiClient.fixAgroEventDraft(...)
+ await this.apiClient.confirmAgroEventDraft(...)
```

Ключевой untracked diff:
```diff
diff --git a/apps/telegram-bot/src/telegram/telegram.update.spec.ts b/apps/telegram-bot/src/telegram/telegram.update.spec.ts
new file mode 100644
+describe("TelegramUpdate agro flow", () => {
+  it("создаёт draft на обычный text-вход", ...)
+  it("создаёт draft на photo-вход", ...)
+  it("выполняет link по text refs для pending action", ...)
+  it("по confirm-кнопке вызывает confirm API", ...)
+})
```

```diff
diff --git a/apps/telegram-bot/scripts/agro-draft-commit-smoke.ts b/apps/telegram-bot/scripts/agro-draft-commit-smoke.ts
new file mode 100644
+const update = new TelegramUpdate(...)
+await update.onPhoto(...)
+await update.onAgroAction(... link ...)
+await update.onText(... refs ...)
+await update.onAgroAction(... confirm ...)
```

### Логи прогонов
```text
$ node ./node_modules/jest/bin/jest.js --runInBand src/telegram/telegram.update.spec.ts
PASS src/telegram/telegram.update.spec.ts
  TelegramUpdate agro flow
    ✓ создаёт draft на обычный text-вход
    ✓ не вызывает link без распознанных refs
    ✓ создаёт draft на photo-вход
    ✓ выполняет link по text refs для pending action
    ✓ по confirm-кнопке вызывает confirm API

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

```text
$ npx tsc --noEmit -p /root/RAI_EP/apps/telegram-bot/tsconfig.json
[no output]
```

```text
$ node -r ts-node/register/transpile-only ./scripts/agro-draft-commit-smoke.ts
smoke: telegram agro draft->link->confirm
draft:create eventType=TELEGRAM_PHOTO
reply:photo Draft создан | draft: <code>draft-smoke-1</code> | status: <b>DRAFT</b> | Нужно заполнить: fieldRef
callback:link Жду refs
reply:link Отправьте refs для draft <code>draft-smoke-1</code> в формате farm=... field=... task=...
draft:link draftId=draft-smoke-1 farmRef=farm-1 fieldRef=field-2 taskRef=task-1
reply:text Draft обновлён | draft: <code>draft-smoke-1</code> | status: <b>READY_FOR_CONFIRM</b> | MUST закрыты.
draft:confirm draftId=draft-smoke-1
callback:confirm Confirm отправлен
reply:confirm Событие успешно закоммичено | draft: <code>draft-smoke-1</code> | status: <b>COMMITTED</b> | MUST закрыты. | commit: <code>commit-smoke-1</code>
```

### Manual check
- Manual check: FAIL
- Проверено:
  - живой ручной прогон через реальный Telegram/API-стенд в этой задаче не выполнялся;
  - вместо него выполнен воспроизводимый scripted smoke-run с логами на mocked transport/API.

---
## Ревью (Cursor TECHLEAD)
- **Вердикт:** APPROVED
- **Проверки:** CANON/FORBIDDEN/SECURITY_CANON — ок; дифф — секретов нет, `companyId` только из доверенного контекста (session), не из payload/callback; тест-план выполнен (jest 5/5, tsc, smoke-скрипт).
- **Ограничение:** живой e2e против Telegram/API не прогнан; приёмка с принятием риска. Рекомендуется допрогнать на стенде при возможности.
