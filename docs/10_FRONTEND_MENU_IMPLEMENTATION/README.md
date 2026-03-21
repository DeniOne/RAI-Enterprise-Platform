---
id: DOC-FRN-10-FRONTEND-MENU-IMPLEMENTATION-README-VI1E
layer: Frontend
type: Navigation
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-FRONT-MENU-README
claim_status: asserted
verified_by: manual
last_verified: 2026-03-21
evidence_refs: docs/10_FRONTEND_MENU_IMPLEMENTATION/00_MASTER_MENU_MAP.md;docs/10_FRONTEND_MENU_IMPLEMENTATION/99_TECH_DEBT_CHECKLIST.md;apps/web/lib/consulting/navigation-policy.ts
---
# Карта Фронта и Меню (RAI_EP)

## CLAIM
id: CLAIM-FRONT-MENU-README
status: asserted
verified_by: manual
last_verified: 2026-03-21

Этот документ является действующим входом в пакет фронтовой декомпозиции и объясняет, как использовать menu/spec-документы при работе над интерфейсом. Он описывает рабочий planning-контур, а не исчерпывающее доказательство состояния всех экранов.


Цель папки: перевести фронт и UX/UI в функциональное состояние по бизнес-логике `RAI STRATEGY v3.0` и фактически реализованному backend.

## Источники истины

- Бизнес-цель: `docs/00_STRATEGY/BUSINESS/RAI STRATEGY v3.0.md`
- Каноническое дерево меню: `apps/web/lib/consulting/navigation-policy.ts`
- Фактически существующие страницы: `apps/web/app/**`
- Доступные API-контуры: `apps/api/src/modules/**`

## Статус на старте

- Навигация описывает широкий контур (CRM/Планы/Техкарты/Исполнение/Отклонения/Результат + Стратегия/Экономика/Финансы/GR/Производство/Знания/Настройки).
- Реально реализованы только часть страниц и часть пользовательских сценариев.
- Бэкенд покрывает большую часть логики и готов как основа для фронт-функционала.

## Документы в папке

- `00_MASTER_MENU_MAP.md` — сводная карта всех меню и статус реализации.
- `01_MENU_Управление_Урожаем.md`
- `02_MENU_Стратегия.md`
- `03_MENU_Экономика.md`
- `04_MENU_Финансы.md`
- `05_MENU_GR.md`
- `06_MENU_Производство.md`
- `07_MENU_Знания.md`
- `08_MENU_Настройки.md`

## Как работать по документам

1. Выбираем одно меню.
2. Закрываем минимум `MVP`-поток: список -> карточка/деталь -> действие -> обратная связь.
3. Подключаем API и ошибки/пустые состояния.
4. Фиксируем готовность в master-карте.

