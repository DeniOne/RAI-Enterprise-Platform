# PROMPT — A_RAI S22 Queue & Backpressure Visibility
Дата: 2026-03-07
Статус: active
Приоритет: P1

## Цель
Закрыть operational observability gap `Есть queue/backpressure visibility` и довести `Control Tower` до состояния, где он показывает не только latency/error/cost, но и признаки перегруза orchestration-пайплайна. После этой задачи queue/backpressure state должен быть source-of-truth-backed, а не декоративной заглушкой.

## Контекст
- После `S21` ключевые structural AI claims уже закрыты, включая integration proof на runtime spine.
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` всё ещё открыт operational gap:
  - `Есть queue/backpressure visibility`
- В существующем observability contour уже есть:
  - performance metrics
  - latency/error visibility
  - cost visibility
  - critical path visibility
- Значит следующий шаг не про новую архитектуру, а про честный operational signal, который показывает:
  - перегруз runtime очередей;
  - накопление backlog;
  - pressure / saturation contour без synthetic fallback.

## Ограничения (жёстко)
- Не рисовать queue/backpressure через статические или hand-made числа.
- Не подменять отсутствие live queue source “оценкой на глаз”.
- Не ломать:
  - runtime spine
  - control tower quality/governance surface
  - tenant isolation
  - replay safety
- Не уходить в distributed systems overhaul; нужен минимально честный observability slice.

## Задачи (что сделать)
- [ ] Определить канонический live source для queue/backpressure signal в текущей архитектуре.
- [ ] Довести backend metrics/service path до честного queue/backpressure contract.
- [ ] Вывести этот signal в `Control Tower` так, чтобы было видно:
  - текущий pressure state;
  - backlog/queue size или эквивалентную operational saturation метрику;
  - отсутствие synthetic fallback.
- [ ] Добавить producer-side proof, что метрика читается из живого source, а не из константы/заглушки.
- [ ] Обновить readiness checklist, если пункт `Есть queue/backpressure visibility` можно честно закрыть.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Есть live backend source для queue/backpressure visibility.
- [ ] `Control Tower` показывает этот source честно.
- [ ] Tenant isolation и runtime stability не деградировали.
- [ ] Пункт readiness про queue/backpressure можно поднять в `[x]`, либо остаточный разрыв честно локализован.

## Тест-план (минимум)
- [ ] Unit/service-level: queue/backpressure metric считается/читается из живого source.
- [ ] Integration/service-level: control-tower API возвращает этот signal без synthetic fallback.
- [ ] UI proof: панель показывает queue/backpressure state.
- [ ] Regression: tenant isolation сохранена.

## Что вернуть на ревью
- Изменённые файлы.
- Какой именно queue/backpressure source выбран.
- Где этот signal входит в backend contract и Control Tower.
- Какие тесты доказывают, что это не заглушка.
- Результаты `tsc` и целевых тестов.
- Явное указание, можно ли теперь закрыть readiness-пункт про queue/backpressure.
