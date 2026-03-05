# PROMPT — BS% Calculator v1 & Truthfulness (Phase 4.4)
Дата: 2026-03-05
Статус: active
Приоритет: P0

## Цель
Реализовать калькулятор `BS%` (Bullshit Percent) — базовую метрику честности и галлюцинаций агентов. Нужно классифицировать утверждения из `evidenceRefs` по таксономии (Agro/Finance/General), присвоить им веса и статус (Verified/Unverified/Invalid), а затем посчитать итоговый BS% по всему `traceId`.

## Контекст
- **Почему это важно сейчас:** Мы начали собирать Evidence в Phase 4.3, теперь нужно превратить эти сырые ссылки в конкретную цифру `BS%`, которая будет влиять на уровень автономности агента и триггерить алерты.
- **Связанные документы:**
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` (Phase 4, пункт 4).

## Ограничения (жёстко)
- **Изоляция:** Расчёт BS% должен выполняться в фоне или асинхронно, чтобы не тормозить юзера в основном флоу чата.
- **Математика:** Веса: Agro=3, Finance=3, Legal/Safety=3, General=1.
  Формула BS%: `(Сумма весов Unverified + Сумма весов Invalid) / Сумма всех весов`.
- **Без сайд-эффектов на UI:** Возвращаем только структуру с расчётом, сохраняем в `TraceSummary`. Интерфейсы не трогаем.

## Задачи (что сделать)
- [ ] Определить `ClaimTaxonomyType` (AGRO, FINANCE, LEGAL, SAFETY, GENERAL) и Enum `ClaimStatus` (VERIFIED, UNVERIFIED, INVALID).
- [ ] Описать сервис `TruthfulnessEngineService` с методом `calculateTraceTruthfulness(traceId: string, companyId: string)`.
- [ ] Написать логику расчёта: парсинг `evidenceRefs` из `AiAuditEntry` (если они есть), проставление дефолтного статуса (например, всё, что без sourceId = `UNVERIFIED`) и расчёт формулы.
- [ ] Метод должен делать апдейт поля `bsScorePct` в `TraceSummary` (из Phase 4.2).
- [ ] Покрыть сервис математическими unit-тестами.

## Definition of Done (DoD)
- [ ] `TruthfulnessEngineService` реализован и экспортируется.
- [ ] Метод корректно читает трейс, считает веса и сохраняет % в Prisma.
- [ ] Тесты на математику и граничные случаи (нет evidence, все verified, все invalid) PASS.

## Тест-план (минимум)
- [ ] Unit: 100% verified evidence (BS% = 0).
- [ ] Unit: 1 agro invalid (вес 3) + 1 general verified (вес 1) -> BS% = 75%.
- [ ] Unit: Пустой трейс / нет evidence -> BS% = 100% (агент пиздит без пруфов) или fallback по политике.
- [ ] Прогон `tsc` по API.

## Что вернуть на ревью
- Изменённые файлы (список)
- Результаты `tsc` & `jest` по новым файлам
