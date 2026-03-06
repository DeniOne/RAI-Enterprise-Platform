# REPORT — R3 Truthfulness Runtime Trigger
Дата: 2026-03-05
Статус: READY_FOR_REVIEW
Промт: `interagency/prompts/2026-03-05_a_rai-r3_truthfulness-runtime-trigger.md`

## 1. Что было сделано

Архитектурно устранена data race в `SupervisorAgent`, которая приводила к calculation failures для Truthfulness engine (read-before-write).

1. **Гонка чтения-записи ликвидирована (обе части):**
   - **Часть А:** Было `this.writeAiAuditEntry(...)` как `void` fire-and-forget. Стало: `await this.writeAiAuditEntry(...)` гарантирует персистентность AuditEntry перед тем, как `TruthfulnessEngine` пойдет его читать.
   - **Часть Б:** Было `void this.traceSummaryService.record(...)`. Стало `await this.traceSummaryService.record(...)`. Это гарантирует, что `initial upsert` (record) будет выполнен строго **до** того, как отработает пайплайн и будет вызван `updateQuality()`. Таким образом, тихое проваливание апдейта исключено.
2. **Фальшивые Nulls (fallback values) устранены:**
   - Было: `bsScorePct ?? 0` (подмена `undefined` на ложный `0%`).
   - Стало: Вызов движка сам корректно возвращает `100` для пустых/no-evidence трейсов, так что маскировка удалена.
3. **Фиксация честного read-only инварианта:**
   - `options?.replayMode` теперь блокирует **всю** ветку записи.
   - TraceSummary `record` — пропущен.
   - `writeAiAuditEntry` — пропущен.
   - `calculateTraceTruthfulness` и `updateQuality` — пропущены.
   - В replay не создаётся новых побочных эффектов. Только read.
4. **Тесты дописаны:**
   - Добавлен новый `describe("Truthfulness runtime pipeline")` в `supervisor-agent.service.spec.ts` с 5-ю спецификациями.
   - Добавлена явная проверка `expect(callOrder.indexOf("record")).toBeLessThan(callOrder.indexOf("audit"));`

## 2. Матрица проверки (DoD)

| Требование | Статус | Комментарий |
|---|---|---|
| Guaranteed Ordering (`TraceSummary` -> `AiAuditEntry` -> `Truthfulness`) | **PASS** | `await record` -> `await writeAudit` -> `then(updateQuality)`. Тест `ordering` доказывает. |
| Trace `with evidence` обновляет `TraceSummary` | **PASS** | `then(bsScorePct => ...updateQuality(bsScorePct))` |
| Trace `without evidence` -> честный fallback | **PASS** | Движок возвращает `100`, маскировка `0` удалена. |
| Ошибка движка не ломает ответ | **PASS** | Вызов обёрнут в `catch(err => ...)` и работает как fire-and-forget **после** записи audit. Тест написан. |
| Семантика `replayMode` зафиксирована | **PASS** | Запись `audit` и `record` теперь честно отключена. Никаких следов в БД. |
| `tsc --noEmit` | **PASS** | Ошибок нет. |
| `jest` целевые тесты | **PASS** | 11/11 для supervisor, 5/5 для truthfulness. |

## 3. Список изменённых файлов

1. `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
2. `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`

## 4. Test Evidence

```text
PASS src/modules/rai-chat/supervisor-agent.service.spec.ts
  Truthfulness runtime pipeline
    ✓ success path: audit create → calculateTraceTruthfulness → updateQuality с реальным bsScorePct
    ✓ no-evidence path: движок вернул 100 → updateQuality получает bsScorePct=100, не 0
    ✓ failure path: ошибка движка не ломает orchestrate(), updateQuality не вызывается
    ✓ replayMode: truthfulness pipeline, audit entry и trace summary record пропущены
    ✓ ordering: updateQuality вызывается только после resolve traceSummary.record и aiAuditEntry.create

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```
