---
id: DOC-OPS-DEVELOPMENT-GUIDELINES-ARCHITECTURE-GROWTH-1NOJ
layer: Operations
type: Report
status: draft
version: 0.1.0
---
# Architecture Growth Guardrails

## Зачем это введено

Система уже вышла в режим, где главный риск не только в безопасности или инвариантах, но и в стоимости любого следующего изменения.

Критические симптомы:

- `packages/prisma-client/schema.prisma` уже превысил `6000` строк;
- в `apps/api/src/modules` уже `38` top-level доменных модулей;
- отдельные модули стали явными hotspots по размеру и связности: `rai-chat`, `explainability`, `generative-engine`, `tech-map`, `front-office-draft`, `consulting`, `finance-economy`, `commerce`.

Поэтому введён отдельный growth-control слой, который не “чинит архитектуру магией”, а не даёт ей дальше бесконтрольно распухать.

## Канонический инструмент

Используется скрипт:

```bash
pnpm gate:architecture
```

Жёсткий режим:

```bash
pnpm gate:architecture:enforce
```

Конфигурация бюджетов лежит в:

- `scripts/architecture-budgets.json`

Сама проверка лежит в:

- `scripts/architecture-budget-gate.cjs`

## Что именно контролируется

### 1. Общий бюджет схемы

Проверяется рост:

- `schema.prisma` line-count

Цель:

- не дать схеме тихо перейти границу, после которой review и миграции становятся непредсказуемо дорогими.

### 2. Общий бюджет количества модулей

Проверяется рост:

- числа top-level директорий в `apps/api/src/modules`

Цель:

- не плодить новые boundary без явного архитектурного решения.

### 3. Watch-list тяжёлых модулей

Для текущих hotspots введены отдельные бюджеты:

- `rai-chat`
- `explainability`
- `generative-engine`
- `tech-map`
- `front-office-draft`
- `consulting`
- `finance-economy`
- `commerce`

Для них контролируются:

- число `*.ts` файлов
- суммарный line-count

### 4. Неучтённые hotspots

Если модуль не в watch-list, но уже перешёл базовый порог по line-count или file-count, скрипт явно сообщает об этом как о новом hotspot.

## Как этим пользоваться в работе

Перед большим доменным изменением:

```bash
pnpm gate:architecture
```

Если модуль начинает постоянно светиться как hotspot, это означает не “надо поднять лимит”, а одно из трёх:

1. Нужно разрезать module boundary.
2. Нужно вынести shared policy/service/pattern в cross-cutting слой.
3. Нужно зафиксировать новый canonical owner и обновить бюджет осознанно.

## Что не считается решением

Не считается “архитектурным упрощением”:

- просто поднять лимиты в `scripts/architecture-budgets.json`
- добавить ещё один top-level модуль без описания boundary
- продолжать складывать orchestration, policy и domain rules в один и тот же большой модуль

## Что считать правильным следующим шагом

Если guard начал регулярно сигналить, следующий шаг должен быть один из:

- выделение `subdomain` с отдельным модулем и owner
- вынос policy/gateway/adapter слоя из доменного модуля
- разрезание “god-module” на `application / domain / integration / controllers`
- фиксация ADR на новый boundary, если расширение действительно оправдано
