# Progress: RAI_EP

## Milestone 1: Foundational Canon & Context (In Progress)
- [x] Анализ текущего состояния проекта.
- [x] Реструктуризация дерева `docs/`.
- [x] Создание `BUSINESS_CORE_EXTRACTION_GUIDE.md`.
- [x] Настройка Memory Bank (projectbrief, productContext, activeContext, systemPatterns, techContext).
- [x] Окончательная верификация структуры юзером.

## Milestone 2: Business Core Extraction (Class A/B) - DONE
- [x] Анализ существующих модулей в `mg-core`.
- [x] Выделение кандидатов для экстракции (Class A/B).
- [x] Создание планов экстракции по компонентам.
- [x] Физическая изоляция (src/core-new).
- [x] Восстановление компиляции (npm run build PASS).

## Milestone 3: Neutralization & Migration - DONE
- [x] Глобальная замена MatrixCoin -> BusinessCoin.
- [x] Глобальная замена MatrixGin -> BusinessCore (внутри ядра).
- [x] Глобальная замена MatrixGin -> RAI_EP (на уровне инфраструктуры).
- [x] Перенос `src/core-new` -> `src/core`.
- [x] Чистка `src/index.ts` и `package.json`.
- [x] **Step 5.1 FIX**: Полное удаление доменного имени RAI_EP из ядра.

## Milestone 4: RAI Domain Construction
- [ ] Создание RAI_CANON.md.
- [ ] Регистрация первых агро-сущностей в Registry.
- [ ] Реализация доменного слоя RAI.
