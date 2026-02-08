---
id: decision-adr-002
type: decision
status: approved
owners: [architects]
aligned_with: [principle-axioms]
---

# ADR 002: Стратегия хранения событий — Hybrid CRUD + Audit Log

## Статус
**Принято** | **Версия:** 1.0 | **Дата:** 2026.02.02

---

## Контекст
Для Business Core (Identity, Registry, Task Engine) необходимо выбрать стратегию хранения данных:
1. **Традиционный CRUD** — обновление состояния сущностей
2. **Event Sourcing** — сохранение неизменяемых событий
3. **Hybrid approach** — CRUD + аудит событий

## Решение
**Выбираем Hybrid Approach: CRUD с полным аудитом событий**

### Для Business Core:
- **Основное хранилище:** PostgreSQL (CRUD модель)
- **Аудит событий:** Redis Streams + PostgreSQL audit_log
- **Все изменения:** сохраняются как события в `audit_events`

### Для RAI Domain:
- **Только CRUD** (пока что)
- **Важные события:** публикуются в Event Bus

## Обоснование
1. **Business Core требует полного аудита** — кто, когда, что изменил
2. **Event Sourcing слишком сложен для старта** — нужно восстанавливать состояние
3. **Hybrid даёт баланс** — работаем с текущим состоянием, но имеем историю