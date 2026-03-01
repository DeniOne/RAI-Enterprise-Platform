# RAI_EP — Чеклист доведения “недоделок” до дееспособного состояния (приоритетный)
Дата: 2026-03-01  
Назначение: превратить “LAW/планы/моки” в работающий тонкий срез Agent OS + Agro runtime.

## Как пользоваться этим чеклистом (важно)
- **Правило 1:** сначала закрываем P0 так, чтобы оно реально работало end-to-end.  
- **Правило 2:** “готово” = есть **доказательство**: endpoint/модуль + тест/прогон + отсутствие хардкода `companyId` из payload.  
- **Правило 3:** запрещено делать UI-полировку, пока агентный backend и Agro Draft→Commit не боевые.

## P0 — Блокирующие (без этого “система как задумано” не существует)

### P0.1 Убрать мок веб-чата и завести канонический chat endpoint в `apps/api`
- [x] **Цель:** web-чат перестаёт быть игрушкой Next-роута и становится шлюзом к агентам.
- [x] **DoD:** в `apps/api` есть endpoint (канонический) принимающий `message + workspaceContext` и возвращающий `text + widgets[] (+ toolCalls/debug)`. В `apps/web` запросы идут туда, а `apps/web/app/api/ai-chat/route.ts` не является источником истины.
- [ ] **Мини-порядок работ:**
  - [x] определить канонический путь (по спеке): `POST /api/rai/chat`
  - [x] сделать минимальную реализацию “эхо + 1 виджет” (без LLM) в `apps/api`
  - [x] переключить web-чат на этот endpoint
  - [x] добавить минимальный контрактный тест на форму ответа (схема/типизация)

### P0.2 Канонический `WorkspaceContext` (не только route)
- [x] **Цель:** агент реально “видит” рабочую область, а не угадывает по URL.
- [x] **DoD:** есть единый тип/схема `WorkspaceContext`; ключевые страницы (минимум: CRM, TechMap) публикуют `activeEntityRefs` и краткие summary; в чат уходит **только refs + summaries**, без тяжёлых данных.
- [x] **Мини-порядок работ:**
  - [x] зафиксировать минимальный контракт (`route`, `activeEntityRefs`, `filters`, `selectedRowSummary`, `lastUserAction`)
  - [x] внедрить store/паблишер на страницах CRM/TechMap
  - [x] включить передачу контекста в каждый запрос чата

### P0.3 Реальный Agro Telegram Draft→Fix/Link→Confirm→Commit в `apps/api` (не “код-спека в docs”)
- [x] **Цель:** Telegram становится “терминалом поля” по закону Draft→Commit.
- [x] **DoD:** в `apps/api` существует боевой модуль, который:
  - создаёт `AgroEventDraft` (TTL, missingMust),
  - поддерживает `fix/link/confirm`,
  - коммитит `AgroEventCommitted` с `provenanceHash`,
  - не принимает `companyId` из payload (только из контекста),
  - имеет unit-тесты на MUST-gate.
- [x] **Мини-порядок работ:**
  - [x] перенести реализацию из `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` в реальный модуль `apps/api/src/modules/agro-events/*` (или иной канонический доменный модуль)
  - [x] подключить модуль в `AppModule`
  - [x] покрыть тестами: confirm без MUST → блок; link → READY; confirm → committed

### P0.4 Подключить `apps/telegram-bot` к Draft→Commit (и прекратить раздвоение телеграм-контуров)
- [x] **Цель:** один канонический телеграм-поток, который всегда пишет Draft и требует ✅.
- [x] **DoD:** бот создаёт draft при входе (text/voice/photo), возвращает пользователю короткий ответ + кнопки ✅✏️🔗 с `draftId`, и вызывает `fix/link/confirm` по нажатию.
- [x] **Мини-порядок работ:**
  - [x] выбрать канонический телеграм-контур: `apps/telegram-bot` (транспорт) + API домена в `apps/api`
  - [x] оформить payload кнопок (callback data) так, чтобы всегда нести `draftId`
  - [x] добавить тест/прогон сценария: “фото+текст → draft → link → confirm → committed”

### P0.5 Верифицировать (или реально подключить) `AgroEscalation` + controller loop
- [ ] **Цель:** “план/факт → severity → эскалация” не на бумаге, а в БД.
- [ ] **DoD:** есть сервис, который при коммите событий создаёт `AgroEscalation` при пороге S3/S4, и это покрыто тестом.
- [ ] **Мини-порядок работ:**
  - [ ] найти текущую реализацию в `apps/api` (если есть) и связать с `AgroEventCommitted`
  - [ ] если нет — реализовать минимально: metricKey=`operationDelayDays` → запись в `agro_escalations`
  - [ ] тест: delay=4 → S3 → escalation создана

## P1 — Усилители (делают Agent OS полезным, но не заменяют P0)

### P1.1 Typed tools registry (реестр инструментов) + строгие схемы вызовов
- [ ] **Цель:** “typed tool calls only” становится реальностью, а не лозунгом.
- [ ] **DoD:** tool-call payload’ы валидируются схемами; все вызовы логируются; запрещены “any[]” в критичном контуре.

### P1.2 Виджеты справа: канонический `widgets[]` schema + renderer
- [ ] **Цель:** агент выдаёт структурный UI-вывод (не только текст).
- [ ] **DoD:** `widgets[]` версионируемы; минимум 2 виджета работают end-to-end (например: DeviationList, TaskBacklog) из ответа `/api/rai/chat`.

### P1.3 Память в агентном чате (retrieve + append)
- [ ] **Цель:** память перестаёт быть “инфрой без потребителя”.
- [ ] **DoD:** при запросе чата выполняется recall (scoped по `companyId`), после ответа — append/store по политике; есть метрики/лимиты (top-K, minSimilarity).

### P1.4 “Правда о статусе” (синхронизация чеклистов/доков)
- [ ] **Цель:** прекратить самообман “COMPLETE ✅” без кода.
- [ ] **DoD:** документы в `docs/07_EXECUTION/*` отражают реальную картину; где SPEC-ONLY — так и написано.

## P2 — Полировка и расширение (после P0/P1)

### P2.1 Расширение WorkspaceContext на остальные страницы
- [ ] **DoD:** CRM/TechMap/Operations/Commerce дают корректные refs и summaries.

### P2.2 Интеграция NDVI/погоды/внешних сигналов в controller/advisory
- [ ] **DoD:** signals → advisory → объяснение → user feedback → episodic memory formation.

### P2.3 UX шлифовка (Dock/Focus, клавиши, стабильность)
- [ ] **DoD:** без регрессий; минимальный UX-долг; нет “тяжёлых” анимаций, влияющих на работу.

## Рекомендуемый “тонкий срез”, который доказывает, что система ожила
Сценарий: **Telegram фото+текст → Draft (missingMust) → 🔗 Link field → ✅ Confirm → CommittedEvent → Controller severity → (если S3) AgroEscalation → web-чат показывает виджет DeviationList**.

