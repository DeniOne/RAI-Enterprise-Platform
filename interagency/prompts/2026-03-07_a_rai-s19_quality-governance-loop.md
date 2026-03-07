# PROMPT — A_RAI S19 Quality Governance Loop Closeout
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести связанный контур `quality metrics -> quality alerts -> autonomy policy -> governance incidents/feed` до состояния, где remaining governance/observability claims Stage 2 перестают быть `PARTIAL`. После этой задачи система должна не просто считать quality-метрики, а реально использовать их для автономных переходов, инцидентов и честного governance surface.

## Контекст
- После `S18` в `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` остаются связанные `PARTIAL` claims:
  - `Quality & Evals Panel`
  - `Автономность регулируется по BS% и quality alerts`
  - `Governance counters и incidents feed реально живые`
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` всё ещё открыты пункты:
  - `В панели реально отображаются BS%, Evidence Coverage, Acceptance Rate, Correction Rate`
  - `Автономность нельзя случайно обойти через UI или ручной config`
  - часть live governance / runtime / smoke-confirmation хвостов
- Сейчас главный остаточный разрыв уже не в evidence spine и не в registry/runtime authority. Он в замыкании quality-governance loop:
  - есть quality-данные;
  - есть policy/incidents механика;
  - но claims всё ещё слабее, чем хотелось бы для production-grade правды.

## Ограничения (жёстко)
- Не рисовать synthetic `Correction Rate` или любые другие красивые числа без живого backend source.
- Не переводить claim в `CONFIRMED`, если autonomy/governance path всё ещё можно обойти вручную или он не пишет живые runtime evidence.
- Не ломать:
  - tenant isolation
  - replay safety
  - prompt governance / eval workflow
  - registry runtime authority
  - budget runtime authority
- Не расползаться в большой UI-редизайн. Нужен source-of-truth-backed closeout, а не косметика.

## Задачи (что сделать)
- [ ] Закрыть `Quality & Evals Panel` по live source of truth:
  - либо ввести реальный source для `Correction Rate`,
  - либо честно инструментировать replacement/contract, который позволяет claim поднять без лжи;
  - panel/API должны явно отражать источник и отсутствие synthetic fallback.
- [ ] Замкнуть quality-driven autonomy loop:
  - quality metrics / alerts должны реально влиять на autonomy state;
  - переходы `AUTONOMOUS -> TOOL_FIRST -> QUARANTINE` должны быть подтверждаемы producer-side proof;
  - ручной/config/UI путь не должен тихо обходить этот контур.
- [ ] Довести governance feed/counters до честного live state:
  - incidents feed должен отражать quality/autonomy/policy события как first-class runtime incidents;
  - counters должны читаться из живых persisted данных без декоративных агрегатов;
  - UI/API должны показывать lifecycle и breakdown достаточно прозрачно.
- [ ] Если для закрытия autonomy/governance claims нужны дополнительные runtime/audit signals или incident subtypes, добавить их.
- [ ] Обновить `TRUTH_SYNC_STAGE_2_CLAIMS.md` по фактическому состоянию после работ.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] `Quality & Evals Panel` больше не `PARTIAL` из-за декоративной/отсутствующей quality-метрики, либо остаточный разрыв очень узко и честно локализован.
- [ ] Autonomy transitions реально driven by live quality signals и не обходятся случайным config/UI path.
- [ ] Governance incidents feed/counters отражают живые quality/autonomy/policy incidents с lifecycle и breakdown.
- [ ] Tenant isolation и replay safety не деградировали.
- [ ] Есть producer-side tests на quality-governance loop.

## Тест-план (минимум)
- [ ] Unit/service-level: live source для `Correction Rate` или эквивалентной closing metric действительно считается из persisted truth, а не из fallback.
- [ ] Unit/service-level: quality alerts ведут к ожидаемым autonomy transitions.
- [ ] Integration/service-level: governance feed/counters возвращают quality/autonomy/policy incidents из живых persisted rows.
- [ ] Regression: ручной/config path не обходит quality-driven autonomy restrictions.
- [ ] Regression: replay mode и tenant isolation не ломаются.
- [ ] UI/controller-level proof: quality/governance surface показывает честные live значения и lifecycle.

## Что вернуть на ревью
- Изменённые файлы.
- Как теперь считается и откуда берётся `Correction Rate` или closing replacement metric.
- Где именно quality alerts переводятся в autonomy transitions.
- Какие incidents/counters/feed semantics были усилены.
- Результаты `tsc` и целевых тестов.
- Явное указание, какие из remaining `PARTIAL` claims после этого можно перевести в `CONFIRMED`.
