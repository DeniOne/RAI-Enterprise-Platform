# PROMPT — A_RAI S23 Live API Smoke
Дата: 2026-03-07
Статус: active
Приоритет: P1

## Цель
Закрыть readiness-gap `Есть smoke tests на живые API маршруты` и подтвердить, что ключевые control-plane и observability endpoint'ы работают не только на unit/controller harness, но и через поднятое приложение с реальным HTTP-вызовом.

## Контекст
- После `S22` structural runtime/governance/observability контур уже подтверждён кодом и integration tests.
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` всё ещё остаётся неполностью закрытый testing gap:
  - `Есть smoke tests на живые API маршруты`
- Сейчас у нас много controller-level proof и integration harness, но мало именно live-route подтверждения через HTTP surface поднятого API.

## Ограничения (жёстко)
- Не подменять smoke tests controller-unit тестами.
- Не писать декоративный smoke только на health endpoint.
- Не ломать tenant isolation, auth semantics и governed control-plane contract.
- Не расползаться в full e2e suite на весь продукт; нужен минимальный, но честный live-route smoke slice.

## Задачи (что сделать)
- [ ] Поднять минимальный live API smoke harness для `apps/api`.
- [ ] Выбрать канонический набор маршрутов, который действительно покрывает core Stage 2 surface:
  - explainability / observability;
  - governance / incidents;
  - governed agent config change-request path;
  - control-plane read model.
- [ ] Подтвердить через реальные HTTP-вызовы, что endpoint'ы отвечают с ожидаемой tenant-scoped semantics.
- [ ] Явно проверить хотя бы один legacy-bypass negative case.
- [ ] Обновить readiness checklist, если пункт про smoke tests можно честно поднять в `[x]`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW`.

## Definition of Done (DoD)
- [ ] Есть live smoke suite на поднятом API.
- [ ] Покрыты не менее 3-4 канонических Stage 2 маршрутов.
- [ ] Smoke suite подтверждает tenant-scoped и governed semantics, а не только `200 OK`.
- [ ] Readiness-пункт про live API smoke можно честно закрыть либо остаточный gap локализован без самообмана.

## Тест-план (минимум)
- [ ] Smoke: `GET` на explainability/observability endpoint.
- [ ] Smoke: governance/incidents endpoint.
- [ ] Smoke: governed config endpoint (`change-request` path или effective read path).
- [ ] Smoke: negative case на legacy/bypass route или tenant mismatch.

## Что вернуть на ревью
- Изменённые файлы.
- Какие именно live API маршруты выбраны и почему.
- Как организован smoke harness.
- Какие негативные кейсы проверены.
- Результаты `tsc` и целевых smoke tests.
- Можно ли теперь честно поднять readiness-пункт про live API smoke в `[x]`.
