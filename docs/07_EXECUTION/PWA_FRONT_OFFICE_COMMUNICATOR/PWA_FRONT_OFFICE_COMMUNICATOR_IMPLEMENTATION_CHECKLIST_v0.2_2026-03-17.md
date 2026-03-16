---
id: DOC-EXE-07-EXECUTION-PWA-FRONT-OFFICE-COMMUNICATOR-IMPLEMENTATION-CHECKLIST-2026-03-16
layer: Execution
type: Checklist
status: draft
version: 0.2.0
owners: [@codex]
last_updated: 2026-03-17
---
# PWA Front-Office Communicator: полный план-чеклист реализации

## 0. Scope и рамки

- [ ] Утвердить, что `PWA communicator` делается как основной web/fallback-канал.
- [ ] Утвердить, что `Telegram` на этапе внедрения не отключается.
- [ ] Зафиксировать целевые роли:
  - [ ] `Клиент (представитель хозяйства)`.
  - [ ] `Менеджер (бэкофис)`.
- [ ] Утвердить целевой UX менеджера: переключение `Клиенты / A-RAI`.
- [ ] Назначить владельцев блока:
  - [ ] Product owner.
  - [ ] Backend owner.
  - [ ] Frontend owner.
  - [ ] QA owner.

## 1. Архитектурные решения

- [ ] Утвердить нейтральный namespace вместо Telegram-only:
  - [ ] primary route: `/communicator/workspace`.
  - [ ] compatibility route policy: `/front-office/workspace`.
  - [ ] legacy alias policy: `/telegram/workspace`.
- [ ] Подтвердить, что `front-office-draft/thread/handoff` остается каноническим backend-контуром.
- [ ] Подтвердить transport-стратегию:
  - [ ] `web_chat` как равноправный канал.
  - [ ] `telegram` как параллельный канал/bridge.
- [ ] Утвердить realtime-стратегию:
  - [ ] MVP: polling.
  - [ ] Stage 2: SSE.
- [ ] Зафиксировать notification-стратегию:
  - [ ] email fallback.
  - [ ] Telegram bridge.
  - [ ] web push как следующий этап.
- [ ] Утвердить каноническую state model:
  - [ ] message lifecycle.
  - [ ] thread lifecycle.
  - [ ] read/unread policy.
  - [ ] idempotency/dedup policy.
  - [ ] source-of-truth policy.
- [ ] Зафиксировать ADR по namespace и naming:
  - [ ] канонический route.
  - [ ] legacy alias policy.
  - [ ] naming policy для UI/analytics/docs.

## 2. Product/UX спецификация

- [ ] Описать клиентский user flow:
  - [ ] `invite -> activate -> login -> open chat`.
  - [ ] prompt `Добавить на экран`.
- [ ] Описать менеджерский user flow:
  - [ ] вход в workspace.
  - [ ] выбор хозяйства.
  - [ ] выбор треда.
  - [ ] ответ клиенту.
  - [ ] переход в `A-RAI`.
- [ ] Зафиксировать IA клиентского интерфейса:
  - [ ] основной чат.
  - [ ] список диалогов.
  - [ ] профиль/доступ.
- [ ] Зафиксировать IA менеджерского интерфейса:
  - [ ] вкладка `Клиенты`.
  - [ ] вкладка `A-RAI`.
  - [ ] список хозяйств.
  - [ ] список тредов.
  - [ ] активный диалог.
- [ ] Определить визуальные состояния:
  - [ ] loading.
  - [ ] empty.
  - [ ] error.
  - [ ] offline.
  - [ ] unread/high-priority.
- [ ] Зафиксировать notification matrix:
  - [ ] новый inbound.
  - [ ] ответ менеджера.
  - [ ] handoff required.
  - [ ] offline client.
  - [ ] offline manager.

## 3. Дизайн и визуальная часть

- [ ] Подготовить wireframes клиентского PWA:
  - [ ] mobile chat screen.
  - [ ] chat list.
  - [ ] install prompt.
- [ ] Подготовить wireframes менеджерского workspace:
  - [ ] mobile layout.
  - [ ] desktop 3-column layout.
  - [ ] tab switch `Клиенты / A-RAI`.
- [ ] Утвердить UI tokens для communicator-режима:
  - [ ] цвета статусов.
  - [ ] типографика.
  - [ ] message bubble styles.
  - [ ] handoff/system cards.
- [ ] Утвердить icon set:
  - [ ] PWA app icon.
  - [ ] notification icon.
  - [ ] fallback icons.
- [ ] Проверить адаптив:
  - [ ] iPhone (small viewport).
  - [ ] Android mid-size.
  - [ ] desktop wide.

## 4. Backend: API и доменный контур

### 4.1. Базовая проверка текущего контура

- [ ] Проверить все ветки `web_chat` в front-office flow.
- [ ] Проверить, что `replyToThread` корректно работает для `web_chat`.
- [ ] Проверить, что thread/message хранилище не содержит Telegram-only допущений для web path.
- [ ] Проверить audit-логирование для `web_chat` сообщений.

### 4.2. Inbound web entry (новый диалог/сообщение)

- [ ] Реализовать (или включить) создание inbound сообщения из внешнего web-клиента через `intake/message`.
- [ ] Убедиться, что payload содержит:
  - [ ] `channel = "web_chat"`.
  - [ ] `direction = "inbound"`.
  - [ ] `threadExternalId` / `senderExternalId` при необходимости.
- [ ] Проверить создание draft + routing + handoff на web path.
- [ ] Добавить idempotency для web inbound операций.

### 4.3. Outbound web delivery

- [ ] Убедиться, что `web_chat` outbound не пытается отправлять transport в Telegram.
- [ ] Для web outbound сохранять сообщения в thread store как источник истины.
- [ ] Проверить корректные `deliveryStatus` и metadata для `web_chat`.
- [ ] Обновить сообщения об ошибках и fallback-поведение.

### 4.4. Media ingress

- [ ] Определить storage (`S3/MinIO/другое`) для вложений.
- [ ] Реализовать upload endpoint для изображений.
- [ ] Привязать image payload к draft/message.
- [ ] Реализовать ограничение размера/типа файлов.
- [ ] Добавить антивирус/валидацию по политике безопасности.
- [ ] Реализовать voice/file как этап 2.

### 4.5. Realtime/polling

- [ ] Для MVP утвердить polling interval.
- [ ] Добавить оптимизацию ответа (`lastMessage marker`, paging).
- [ ] Проверить поведение при высокой частоте запросов.
- [ ] Спроектировать `SSE endpoint` для следующей фазы.

### 4.6. State semantics

- [ ] Зафиксировать канонические состояния `message lifecycle`.
- [ ] Зафиксировать канонические состояния `thread lifecycle`.
- [ ] Зафиксировать `read/unread semantics` для клиента и менеджера.
- [ ] Проверить dedup для повторного inbound submit.
- [ ] Проверить race conditions:
  - [ ] manager reply vs client polling.
  - [ ] duplicate retry.
  - [ ] handoff update during active thread.
  - [ ] reconnect after offline.
- [ ] Подтвердить backend store как source of truth для state counters и timeline.

## 5. Frontend: клиентский PWA

### 5.1. PWA shell

- [ ] Добавить `manifest.json`.
- [ ] Добавить app icons (multiple sizes).
- [ ] Включить standalone mode.
- [ ] Реализовать install prompt.
- [ ] Добавить offline fallback screen.
- [ ] Проверить safe-area на iOS.

### 5.2. Клиентский chat UX

- [ ] Реализовать основной экран чата.
- [ ] Реализовать список диалогов.
- [ ] Реализовать composer:
  - [ ] text input.
  - [ ] send.
  - [ ] attachment button.
- [ ] Реализовать статусные карточки (`handoff/system`).
- [ ] Реализовать read marker UX.
- [ ] Реализовать retry при сетевой ошибке.

### 5.3. Auth/onboarding UX

- [ ] Проверить flow `invite -> activate -> login`.
- [ ] Добавить явный шаг `Добавить на экран`.
- [ ] Добавить экран успешной активации с CTA `Открыть чат`.
- [ ] Проверить повторный вход и refresh token/session поведение.
- [ ] Проверить session persistence в standalone/PWA mode.
- [ ] Проверить поведение после долгого неиспользования.
- [ ] Проверить повторный вход после logout.
- [ ] Проверить expired invite flow.
- [ ] Проверить device switch behavior.
- [ ] Проверить, что после re-entry клиент попадает в последний активный диалог.

## 6. Frontend: менеджерский workspace

### 6.1. Структура и роутинг

- [ ] Перенести/дублировать workspace в нейтральный namespace.
- [ ] Сохранить текущую функциональность `farms | ai`.
- [ ] Добавить явный tab switch `Клиенты / A-RAI` в UI.
- [ ] Проверить deep-link открытие конкретного thread.

### 6.2. Клиентские треды

- [ ] Реализовать сортировку по непрочитанным/последней активности.
- [ ] Добавить индикаторы приоритета / `needs human action`.
- [ ] Добавить быстрый ответ без потери контекста.
- [ ] Добавить контекстную панель (`поле/сезон/задача/handoff`).

### 6.3. Интеграция с A-RAI

- [ ] Передавать контекст выбранного хозяйства в AI tab.
- [ ] Обеспечить возврат из AI в тот же тред.
- [ ] Проверить, что `workspaceContext` передается корректно.

## 7. Security/Compliance

- [ ] Провести threat model для web-chat канала.
- [ ] Проверить auth boundary для external front-office.
- [ ] Проверить rate limiting для inbound/reply endpoints.
- [ ] Проверить `XSS/HTML sanitization` для message text.
- [ ] Проверить доступ к вложениям (`signed URLs`, TTL).
- [ ] Проверить tenant boundaries во всех `web_chat` запросах.
- [ ] Добавить аудит ключевых операций:
  - [ ] inbound message.
  - [ ] outbound reply.
  - [ ] upload.
  - [ ] handoff actions.

## 8. Тестирование

### 8.1. Unit/Service

- [ ] Покрыть `web_chat` ветки в front-office draft service.
- [ ] Покрыть `web_chat` outbound ветки.
- [ ] Покрыть idempotency поведение для web inbound/reply.

### 8.2. API/Integration

- [ ] Тест `external user replies in web thread`.
- [ ] Тест `new inbound web message creates draft`.
- [ ] Тест `manager reply appears in web thread`.
- [ ] Тест `handoff flow via web_chat`.
- [ ] Тест `attachments upload + retrieval`.
- [ ] Тест `duplicate web inbound does not create duplicate message`.
- [ ] Тест `manager reply and client polling do not create race inconsistency`.
- [ ] Тест `read state updates do not affect delivery state`.
- [ ] Тест `resolved thread reopen policy`.

### 8.3. E2E/UI

- [ ] E2E `invite -> activate -> login -> send -> receive`.
- [ ] E2E `manager switches Клиенты -> A-RAI -> back`.
- [ ] E2E mobile viewport smoke.
- [ ] E2E PWA install smoke.

### 8.4. Non-functional

- [ ] Проверка производительности polling under load.
- [ ] Проверка деградации при слабой сети.
- [ ] Проверка доступности (`A11y baseline`).

## 9. Migration и rollout

- [ ] Определить pilot tenant(s).
- [ ] Включить feature flag для `PWA communicator`.
- [ ] Включить shadow monitoring метрик.
- [ ] Провести pilot с ограниченной группой клиентов.
- [ ] Собрать обратную связь.
- [ ] Исправить `P0/P1 issues`.
- [ ] Расширить rollout на следующий сегмент.
- [ ] Зафиксировать, что `Telegram` остается доступным.
- [ ] Зафиксировать freeze criteria для pilot.
- [ ] Зафиксировать rollback path на Telegram-first сценарий.
- [ ] Назначить владельца решения о freeze/rollback.
- [ ] Определить pilot baseline метрики до запуска.
- [ ] Зафиксировать incident template для pilot.

## 10. Наблюдаемость и метрики

- [ ] Добавить продуктовые метрики:
  - [ ] `DAU PWA`.
  - [ ] share of `web_chat` messages.
  - [ ] median response time `manager -> client`.
  - [ ] conversion to `add-to-home-screen`.
- [ ] Добавить операционные метрики:
  - [ ] API latency.
  - [ ] error rate.
  - [ ] failed deliveries.
  - [ ] polling load.
- [ ] Добавить бизнес-метрики:
  - [ ] доля диалогов вне Telegram.
  - [ ] снижение пропусков коммуникации.
  - [ ] удовлетворенность менеджеров/клиентов.

## 11. Go/No-Go критерии MVP

- [ ] Клиент проходит `invite/activate/login` без ручных обходов.
- [ ] Клиент может открыть чат через иконку на смартфоне.
- [ ] Клиент может отправить сообщение и получить ответ.
- [ ] Менеджер может отвечать из workspace.
- [ ] Менеджер может переключаться `Клиенты / A-RAI`.
- [ ] Нет критических `tenant/security` дефектов.
- [ ] Нет блокирующих UX дефектов на `iOS/Android`.
- [ ] Нет системного `message duplication/loss` в pilot.
- [ ] Нет расхождения между `unread/read counters` и timeline state.
- [ ] Session persistence работает в standalone mode.
- [ ] Manager workflow не требует возврата в Telegram для базового ответа.
- [ ] Зафиксирован freeze/rollback protocol.
- [ ] `Telegram` канал продолжает функционировать параллельно.

## 12. Post-MVP (Stage 2+)

- [ ] Включить `SSE`.
- [ ] Включить `web push` (где доступно).
- [ ] Добавить `voice/file parity`.
- [ ] Улучшить offline/reconnect behavior.
- [ ] Перенести manager workspace полностью в нейтральный namespace.
- [ ] Перевести Telegram в `secondary/legacy role policy`.

## 13. Организация работ по спринтам

### Sprint 1 (Foundation + MVP start)

- [ ] Архитектурные решения и namespace.
- [ ] Каноническая state model.
- [ ] Клиентский PWA shell.
- [ ] `web_chat` inbound/reply hardening.
- [ ] Базовый мобильный чат.

### Sprint 2 (MVP completion)

- [ ] Менеджерский tab switch `Клиенты / A-RAI`.
- [ ] Polling + read states.
- [ ] Session/re-entry hardening.
- [ ] E2E ключевых сценариев.
- [ ] Pilot rollout.

### Sprint 3 (Stage 2 start)

- [ ] Image upload.
- [ ] `SSE design/implementation`.
- [ ] UX polish и notifications.

## 14. Контрольные артефакты

- [ ] Обновленный implementation plan.
- [ ] `Execution control board`.
- [ ] Актуальные API contracts.
- [ ] UI specs/wireframes.
- [ ] Test plan + test evidence.
- [ ] Pilot report.
- [ ] Go/No-Go решение.
