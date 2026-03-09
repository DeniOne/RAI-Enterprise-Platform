---
id: DOC-STR-FO-001
type: Index
layer: Strategy
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-09
---

# FRONT_OFFICE — Canon Index

> Стратегическая точка входа для блока `Front-Office` в `RAI_EP`.

Этот индекс собран после сверки стратегии, архитектурных правил, execution-документов и текущего кода на `2026-03-09`.

## Главный активный документ

**[FRONT_OFFICE_MASTER_PLAN.md](./FRONT_OFFICE_MASTER_PLAN.md)**  
→ Главный active canon блока `Front-Office`. С него нужно начинать. Остальные документы блока являются активными приложениями и детализацией.

## 1. Что входит в блок Front-Office

- исполнительный и сенсорный контур работы с хозяйствами;
- поля, сезоны, техкарты, задачи, оркестратор стадий, события и evidence;
- web-интерфейс, Telegram-интерфейс и их связь с Back-office через `Integrity Gate`.

## 2. Главные документы

| Документ | Статус | Роль |
|----------|--------|------|
| [FRONT_OFFICE_MASTER_PLAN.md](./FRONT_OFFICE_MASTER_PLAN.md) | `ACTIVE CANON` | Главный сводный документ блока |
| [../VISION_SCOPE.md](../VISION_SCOPE.md) | `CANON INPUT` | Верхнеуровневая модель двух контуров и scope Front-Office |
| [../BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md](../BUSINESS/RAI%20BUSINESS%20ARCHITECTURE%20v2.0.md) | `ACTIVE REALITY MAP` | Фактическая картина по коду: что реально реализовано |
| [../../01_ARCHITECTURE/PRINCIPLES/Front-Office_Function_Admission_Rules.md](../../01_ARCHITECTURE/PRINCIPLES/Front-Office_Function_Admission_Rules.md) | `NORMATIVE` | Что вообще разрешено реализовывать во Front-Office |
| [../../01_ARCHITECTURE/PRINCIPLES/BETA_INTEGRITY_LAYER.md](../../01_ARCHITECTURE/PRINCIPLES/BETA_INTEGRITY_LAYER.md) | `NORMATIVE` | Правило причинной замкнутости Front -> Back |
| [../../07_EXECUTION/PHASE_BETA/FRONT_OFFICE_FRONTEND_DEVELOPMENT_PLAN.md](../../07_EXECUTION/PHASE_BETA/FRONT_OFFICE_FRONTEND_DEVELOPMENT_PLAN.md) | `EXECUTION PLAN` | Целевой web-scope: страницы, роли, API-гармонизация |
| [../../07_EXECUTION/PHASE_BETA/BETA_CONTOUR_ANALYSIS_2026-02-08.md](../../07_EXECUTION/PHASE_BETA/BETA_CONTOUR_ANALYSIS_2026-02-08.md) | `GAP ANALYSIS` | Зафиксированные разрывы между backend и frontend |
| [../../03_PRODUCT/UI_UX/Prompt_for_design_research.md](../../03_PRODUCT/UI_UX/Prompt_for_design_research.md) | `UX REFERENCE` | Общие требования к зрелому enterprise UX для операционного контура |
| [../../10_FRONTEND_MENU_IMPLEMENTATION/01_MENU_Управление_Урожаем.md](../../10_FRONTEND_MENU_IMPLEMENTATION/01_MENU_%D0%A3%D0%BF%D1%80%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5_%D0%A3%D1%80%D0%BE%D0%B6%D0%B0%D0%B5%D0%BC.md) | `PRODUCT IA REFERENCE` | Операционный UX-контекст, близкий к Front-Office domain |
| [FRONT_OFFICE_DEMO_FLOWS.md](./FRONT_OFFICE_DEMO_FLOWS.md) | `ACTIVE APPENDIX` | Канонические demo-сценарии для пилота, показов и smoke/e2e |
| [FRONT_OFFICE_REFACTOR_PLAN.md](./FRONT_OFFICE_REFACTOR_PLAN.md) | `ACTIVE APPENDIX` | Точный план доведения кода до канонического `Draft / Thread / Confirm` контура |

## 3. Карта кода

### Web

- `apps/web/app/(app)/front-office/layout.tsx`
- `apps/web/app/(app)/front-office/page.tsx`
- `apps/web/lib/api/front-office.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/consulting/execution/*`

### Backend

- `apps/api/src/modules/field-registry/*`
- `apps/api/src/modules/task/*`
- `apps/api/src/modules/tech-map/*`
- `apps/api/src/modules/season/*`
- `apps/api/src/modules/agro-orchestrator/*`
- `apps/api/src/modules/field-observation/*`
- `apps/api/src/modules/integrity/*`

### Telegram / field transport

- `telegram/README.md`
- `apps/telegram-bot/src/telegram/*`

## 4. Фактическое состояние на 2026-03-09

- Стратегически Front-Office давно определён как отдельный контур, но не как автономный продукт, а как исполнительный слой Back-office.
- Backend-ядро по Front-Office реально существует: реестр полей, lifecycle задач, техкарты, APL-orchestrator, field observation, integrity contour.
- Web-route `/front-office` уже заведен, но сейчас это только базовый layout и placeholder-страница.
- Часть операционного UI уже живет вне `/front-office`, в `dashboard` и `consulting/execution`, поэтому текущая реализация фрагментирована.
- Для `season` есть GraphQL access (`getSeasons`, `getSeason`), но отдельного REST controller для продуктового Front-Office контура сейчас не видно.

## 5. Важные контрактные рассинхроны

- `apps/web/lib/api/front-office.ts` ожидает `GET /registry/fields/:id`, но `FieldRegistryController` сейчас дает только `GET /registry/fields` и `POST /registry/fields`.
- `apps/web/lib/api/front-office.ts` ожидает `POST /tech-map/:id/activate`, но в текущем `TechMapController` exposed путь — `PATCH /tech-map/:id/transition`.
- План Front-Office предполагает полноценный раздел `seasons`, но в текущем web/API слое это еще не оформлено как единый продуктовый маршрут.

## 6. Что логично складывать в эту папку дальше

- [FRONT_OFFICE_SCOPE.md](./FRONT_OFFICE_SCOPE.md) — границы блока и его business outcome.
- [FRONT_OFFICE_IA.md](./FRONT_OFFICE_IA.md) — структура раздела, навигация и кабинеты ролей.
- [FRONT_OFFICE_USER_FLOWS.md](./FRONT_OFFICE_USER_FLOWS.md) — ключевые пользовательские сценарии.
- [FRONT_OFFICE_API_CONTRACTS.md](./FRONT_OFFICE_API_CONTRACTS.md) — целевые read/write контракты.
- [FRONT_OFFICE_BACKLOG.md](./FRONT_OFFICE_BACKLOG.md) — очередь работ по web/UI/API harmonization.
- [FRONT_OFFICE_DEMO_FLOWS.md](./FRONT_OFFICE_DEMO_FLOWS.md) — канонические demo-сценарии для пилота и показов.
- [FRONT_OFFICE_REFACTOR_PLAN.md](./FRONT_OFFICE_REFACTOR_PLAN.md) — точный план исправления текущей реализации до канонического состояния.
