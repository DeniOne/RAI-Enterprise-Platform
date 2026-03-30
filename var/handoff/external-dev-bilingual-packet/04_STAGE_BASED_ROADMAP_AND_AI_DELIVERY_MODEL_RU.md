# 04. Stage-Based Roadmap And AI Delivery Model

## Подтверждённая стартовая точка

- У проекта уже есть рабочее инженерное ядро, активный runtime и governance baseline.
- Основной риск не в том, что системы “ещё нет”, а в том, что её можно начать расширять не в той последовательности.
- Следующий ход должен быть stage-based и dependency-based, а не driven шириной UI или количеством новых идей.

## Целевое направление

Проект должен двигаться как governed enterprise platform вокруг `TechMap`, `season execution`, evidence, explainability, controlled AI и installable `self-host / localized` contour.

## Последовательность stages

| Stage | Что нужно закрыть | Prerequisites | Expected effect | Exit criteria |
| --- | --- | --- | --- | --- |
| `Stage 1` | Замкнуть единый продуктовый и доменный центр вокруг `TechMap` | действующий доменный baseline и существующие tech-map/season contours | product core перестаёт быть размазанным между вторичными модулями | есть чёткий и проверяемый `TechMap -> execution -> deviations -> recommendations -> result` loop |
| `Stage 2` | Замкнуть governed AI runtime | stage 1 как domain center; существующий `rai-chat` runtime | AI перестаёт быть неформальным риском и становится controlled layer | есть `tool matrix`, `HITL matrix`, evidence thresholds, eval discipline и incident contour |
| `Stage 3` | Довести release discipline | stage 1 и 2 как product/governance base | engineering baseline превращается в честный release contour | закрыт critical AppSec debt, собран legal evidence contour, есть backup/restore evidence и installability packet |
| `Stage 4` | Подтвердить `self-host / localized` pilot packet | stage 3 как обязательная база | появляется реалистичный путь ограниченного внедрения | есть support boundary, topology, install/upgrade path и reproducible pilot packet |
| `Stage 5` | Масштабировать breadth только после core closure | stages 1-4 закрыты как minimum viable governance base | новые роли, UI breadth и интеграции перестают подрывать ядро | расширение происходит без разрушения policy, domain integrity и release discipline |

## AI-first delivery model

### Роль ИИ

- ИИ пишет основной объём bounded implementation work.
- ИИ может быстро собирать черновые implementation slices, тестовые заготовки, refactoring batches и documentation drafts.
- ИИ особенно полезен там, где нужно быстро пройти несколько итераций по routing, contracts, backend/frontend glue и repetitive engineering work.

### Роль человека

- Человек принимает архитектурные решения и удерживает систему от drift.
- Человек задаёт acceptance criteria и проверяет, что реализация не ломает домен.
- Человек контролирует security, legal, privacy, policy и release boundaries.
- Человек утверждает merge/release для high-impact изменений.

### Нерушимое правило

High-impact changes не считаются завершёнными без human review, даже если основной объём кода был сгенерирован или написан ИИ.

## Anti-roadmap: чего делать сейчас нельзя

- Нельзя идти в `SaaS-first`, пока приоритетным честным путём остаётся `self-host / localized`.
- Нельзя расширять autonomy AI быстрее, чем формализуются policy, `HITL`, evals и incident discipline.
- Нельзя принимать menu breadth или UI completeness за реальный proxy готовности.
- Нельзя агрессивно наращивать интеграции до закрытия legal/ops perimeter.
- Нельзя расширять новые agent roles быстрее, чем закрывается общий governance framework.
- Нельзя позволять вторичным модулям вытеснять `TechMap`-центр продукта.

## Открытые gaps

- Core product flow вокруг `TechMap` ещё нужно сделать главным фокусом delivery, а не просто одной из тем в широком монорепо.
- AI runtime governance уже концептуально понятен, но должен быть доведён до formal release-grade contour.
- Release discipline ещё не поднята до уровня, на котором внешний production можно защищать как зрелое решение.

## Source anchors

- `docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md`
- `docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md`
- `docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`
- `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
