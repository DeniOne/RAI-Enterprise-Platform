---
id: DOC-EXE-ONE-BIG-PHASE-C-MINIMAL-WEB-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-C-MINIMAL-WEB-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/07_EXECUTION/WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md;apps/web/app;apps/web/components/ai-chat;apps/web/app/api/ai-chat/route.ts
---
# Phase C — Minimal Web And Access

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-C-MINIMAL-WEB-20260330
status: asserted
verified_by: manual
last_verified: 2026-04-01

Это подфаза, где `web` перестаёт быть широкой витриной и становится простым рабочим входом в ядро продукта.

Для конкретного implementation-пакета использовать также [PHASE_C_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_IMPLEMENTATION_PLAN.md).

Для статусов строк и exit-критериев использовать также [PHASE_C_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_EXECUTION_BOARD.md).

## 1. Цель подфазы

Сделать минимальную `web`-поверхность, через которую реально можно пользоваться системой:

- зайти;
- открыть тред;
- работать с агентом;
- видеть governed work windows;
- видеть explainability и evidence;
- управлять минимальным набором агентных действий.

## 2. Чеклист

### 2.1. Сузить `web`-объём

- [ ] Явно зафиксировать, что ближайший `web`-объём — это `chat + work windows + minimal control`.
- [ ] Не считать полное меню целью текущей фазы.
- [ ] Не брать в работу вторичные экраны раньше, чем стабилизирован основной путь.

### 2.2. Довести путь входа и сессии

- [ ] Проверить и стабилизировать путь `login -> session -> thread`.
- [ ] Убедиться, что пользователь может предсказуемо открыть и продолжить рабочий контур.
- [ ] Не оставлять критичный путь зависящим от случайного локального состояния.

### 2.3. Довести путь общения с агентом

- [ ] Стабилизировать путь `thread -> message -> response -> evidence`.
- [ ] Проверить, что диалог не существует отдельно от governed runtime.
- [ ] Убедиться, что `web` остаётся рабочим входом, а не только альтернативным интерфейсом.

### 2.4. Довести work windows и explainability

- [ ] Показать пользователю, с чем сейчас работает агент.
- [ ] Показать, почему система отвечает именно так.
- [ ] Не скрывать логику за красивой оболочкой.

### 2.5. Закрепить минимальные роли и доступ

- [ ] Удержать минимальный понятный набор ролей.
- [ ] Не плодить административную сложность.
- [ ] Зафиксировать, кто видит что и кто что может подтверждать.

## 3. Что должно измениться по итогам подфазы

- `web` становится практическим входом в MVP;
- пользователь может пройти минимальный рабочий путь без обходных манёвров;
- интерфейс показывает ядро, а не отвлекает от него;
- границы доступа остаются понятными и управляемыми.

## 4. Подфаза считается завершённой, когда

- минимальный путь через `web` стабилен;
- диалог, work windows и explainability работают как связанный контур;
- широкий menu perimeter больше не считается мерилом готовности;
- роли и доступ не создают хаос.

## 5. Что запрещено до завершения подфазы

- дорисовывать вторичные экраны ради ощущения “готового продукта”;
- расширять `settings/admin` вместо стабилизации ядра;
- превращать `web` в широкий shell раньше, чем он стал надёжным рабочим входом.
