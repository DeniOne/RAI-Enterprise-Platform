---
id: DOC-DOM-AGRO-DOMAIN-TECHMAP-USER-GUIDE-2UVL
layer: Domain
type: Guide
status: draft
version: 0.1.0
---
# User Guide: Использование Техкарт (TechMap)

Бля, мы это сделали. Вот как теперь работать с техкартами в RAI EP.

## 1. Жизненный цикл (FSM)
Техкарта проходит через строгие состояния:
1.  **DRAFT**: Черновик. Можно редактировать операции, ресурсы, даты.
2.  **PENDING**: Ожидает утверждения. Заблокирована для редактирования.
3.  **ACTIVE**: Действующая карта. Исполнение началось. Разрешено прикрепление доказательств (`Evidence`) и создание `ChangeOrder`.
4.  **FROZEN**: Завершена или отменена. Полная блокировка любых изменений.

## 2. Как создать Техкарту (Backend Flow)
Используй API эндпоинт `POST /api/tech-map/generate`.
**Payload:**
```json
{
  "harvestPlanId": "UUID",
  "seasonId": "UUID"
}
```
*Система автоматически рассчитает DAG операций на основе региональных профилей и агрономической стратегии.*

## 3. UI Workbench (Интерфейс агронома)
Перейди в раздел `/consulting/techmaps/design`.
Там теперь доступны:
- **DAG View**: Визуальный граф операций (SVG). Красным подсвечен критический путь.
- **Evidence Panel**: Прикрепление фото-отчетов к активным операциям.
- **ChangeOrder Panel**: Запросы на изменение нормы высева или препаратов прямо "в бою".

## 4. Как проверить (Smoke Test)
Если API поднят, выполни этот CURL для создания тестовой карты:
```bash
curl -X POST http://localhost:4000/api/tech-map/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"harvestPlanId": "...", "seasonId": "..."}'
```

> [!IMPORTANT]
> При `status: FROZEN` интерфейс полностью блокируется (read-only). Это канон неизменяемости истории.
