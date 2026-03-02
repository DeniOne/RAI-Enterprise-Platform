# REPORT — P2.2 Внешние сигналы в advisory контуре
Дата: 2026-03-02  
Статус: final  

## Ревью: APPROVED
Проверено по CANON/FORBIDDEN/SECURITY_CANON; tenant isolation соблюдён, side effects нет, e2e сервисный срез покрыт unit-тестами. Ограничения (нет HTTP/manual smoke, tsc падает вне scope) зафиксированы в отчёте.

---

## Что было целью
- Реализовать тонкий срез `signals -> advisory -> explainability -> feedback -> memory append` без автодействий.
- Сохранить tenant isolation: `companyId` только из доверенного контекста `POST /rai/chat`.
- Переиспользовать существующие примитивы `satellite`, `memory`, `audit`, не создавая тяжёлую новую платформу ingestion.

## Что сделано (факты)
- Подтверждён `Decision-ID` `AG-EXTERNAL-SIGNALS-001` со статусом `ACCEPTED` в `DECISIONS.log`.
- Контракт `RAI Chat` расширен новыми DTO:
  - `externalSignals[]`
  - `advisoryFeedback`
  - `advisory` в ответе
  в `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`.
- Добавлен новый сервис `apps/api/src/modules/rai-chat/external-signals.service.ts`, который:
  - принимает tenant-safe вход из `RaiChatService`;
  - отправляет `NDVI`-сигналы в существующий `SatelliteIngestionService`;
  - пишет погодные сигналы в `AuditService` и `MemoryManager`;
  - строит advisory с explainability, sources, confidence и `traceId`;
  - сохраняет feedback (`accept/reject + reason`) в audit и episodic memory.
- `RaiChatService` интегрирован с новым контуром:
  - вызывает `ExternalSignalsService.process(...)`;
  - добавляет advisory в ответ;
  - отражает advisory/feedback в тексте ответа;
  - не принимает `companyId` из payload.
- `RaiChatModule` подключён к `SatelliteModule`, чтобы переиспользовать уже существующий tenant-safe ingestion для `NDVI`.
- Добавлены unit-тесты:
  - на построение advisory из `NDVI + weather`
  - на запись feedback в audit + episodic memory
  - на e2e-путь `signal -> advisory -> feedback -> memory append` на уровне `RaiChatService`

## Изменённые файлы
- `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
- `apps/api/src/modules/rai-chat/external-signals.service.ts`
- `apps/api/src/modules/rai-chat/external-signals.service.spec.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`
- `interagency/INDEX.md`
- `interagency/reports/2026-03-02_p2-2_external-signals-advisory.md`

## Проверки/прогоны
- `pnpm --dir /root/RAI_EP/apps/api test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts src/modules/rai-chat/external-signals.service.spec.ts` -> **PASS**
- Результат: `2` test suites, `8` tests, всё `PASS`.
- Security/manual check: **PASS**
  - `companyId` берётся только вторым аргументом `handleChat(...)` из доверенного контекста контроллера.
  - В `externalSignals` и `advisoryFeedback` отсутствует поле `companyId`.
  - Feedback сохраняется как advisory-only след, без side effects.

## Что сломалось / что не получилось
- Полный `pnpm exec tsc -p tsconfig.json --noEmit` по `apps/api` не зелёный, но падает на уже существующих ошибках вне scope:
  - `src/modules/commerce/services/*`
  - `../../docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/api/event-actions.service.spec.ts`
- Отдельный HTTP/manual smoke через реальный `POST /rai/chat` не запускался; доказательство собрано через unit-тесты, module wiring и логический smoke на уровне сервиса.
- Тонкий срез реализован внутри `RAI Chat`, а не отдельным публичным контроллером ingestion. Это осознанное ограничение scope, чтобы не раздувать transport layer до внешнего ревью.

## Следующий шаг
- Внешнее ревью пакета `P2.2`.
- После `APPROVED`: финализация статусов в `interagency/INDEX.md`, обновление чеклистов и `memory-bank`, затем commit.

## Технические артефакты

### git status
```text
 M apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts
 M apps/api/src/modules/rai-chat/rai-chat.module.ts
 M apps/api/src/modules/rai-chat/rai-chat.service.spec.ts
 M apps/api/src/modules/rai-chat/rai-chat.service.ts
?? apps/api/src/modules/rai-chat/external-signals.service.spec.ts
?? apps/api/src/modules/rai-chat/external-signals.service.ts
?? interagency/plans/2026-03-02_p2-2_external-signals-advisory.md
?? interagency/reports/2026-03-02_p2-2_external-signals-advisory.md
```

### git diff (ключевые фрагменты)
```diff
diff --git a/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts b/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts
+export class ExternalSignalDto { ... }
+export class ExternalAdvisoryFeedbackDto { ... }
+export interface ExternalAdvisoryDto { ... }
+externalSignals?: ExternalSignalDto[];
+advisoryFeedback?: ExternalAdvisoryFeedbackDto;
+advisory?: ExternalAdvisoryDto;

diff --git a/apps/api/src/modules/rai-chat/external-signals.service.ts b/apps/api/src/modules/rai-chat/external-signals.service.ts
+await this.satelliteIngestionService.ingest(...)
+await this.auditService.log({ action: "EXTERNAL_SIGNAL_INGESTED", ... })
+await this.memoryManager.store(... source: "external-signal" ...)
+await this.auditService.log({ action: "EXTERNAL_ADVISORY_FEEDBACK_RECORDED", ... })
+await this.memoryManager.store(... source: "external-advisory-feedback" ...)

diff --git a/apps/api/src/modules/rai-chat/rai-chat.service.ts b/apps/api/src/modules/rai-chat/rai-chat.service.ts
+const externalSignalResult = await this.externalSignalsService.process(...)
+advisory: externalSignalResult.advisory
+text += `\nAdvisory: ...`
```

### Логи прогонов
```text
$ pnpm --dir /root/RAI_EP/apps/api test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts src/modules/rai-chat/external-signals.service.spec.ts
PASS src/modules/rai-chat/rai-chat.service.spec.ts (13.243 s)
PASS src/modules/rai-chat/external-signals.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        14.197 s
```

### Пример advisory объекта
```json
{
  "traceId": "trace-ext-1",
  "recommendation": "REVIEW",
  "confidence": 0.81,
  "summary": "Нужна ручная проверка",
  "explainability": {
    "traceId": "trace-ext-1",
    "why": "score=-0.4000; NDVI указывает на просадку; погода добавляет риск",
    "factors": [
      {
        "name": "ndvi",
        "value": 0.31,
        "direction": "NEGATIVE"
      }
    ],
    "sources": [
      {
        "kind": "ndvi",
        "source": "sentinel2",
        "observedAt": "2026-03-02T10:00:00.000Z",
        "entityRef": "field-1",
        "provenance": "sentinel-pass"
      }
    ]
  }
}
```

### Smoke-сценарий уровня сервиса
```text
1. Вызвать RaiChatService.handleChat(...) с:
   - trusted companyId
   - message
   - externalSignals[NDVI]
   - advisoryFeedback
2. Убедиться, что ExternalSignalsService.process(...) вызван с trusted companyId
3. Убедиться, что в response есть advisory
4. Убедиться, что text содержит:
   - "Advisory: REVIEW"
   - "Feedback по advisory записан в память."
```
