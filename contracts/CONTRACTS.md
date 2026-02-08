# CONTRACTS — Sprint 1 / Gamma

## Назначение
Контракты описывают канонические JSON‑структуры для ingestion, inference и Risk Engine (dry‑run).
Это только схемы и примеры. Никакой логики, SDK, runtime‑валидации или интеграций.

## Версионирование
- Семантическое: `MAJOR.MINOR.PATCH`.
- `MAJOR` — breaking change.
- Версия фиксируется в имени файла и в поле `schema_version`.
- Все схемы Draft 2020‑12.

## Политика breaking changes
- Любое удаление поля, изменение типа, ужесточение обязательности — новый `MAJOR`.
- Новые optional‑поля — `MINOR`.
- Исправления описаний/примеров — `PATCH`.

## Как добавить новую схему
1. Создать файл в `contracts/schemas/<domain>/` с именем `name.vX.Y.Z.schema.json`.
2. Добавить `schema_version` и `trace_id` в обязательные поля.
3. Указать `additionalProperties: false`.
4. Добавить минимум 1 пример в `contracts/examples/<domain>/`.

## Что считается контрактом
- JSON Schema в `contracts/schemas/**`.
- Пример в `contracts/examples/**`.

## Что НЕ является контрактом
- Бизнес‑правила.
- Runtime‑валидация.
- SDK/клиенты.
- Миграции данных.
