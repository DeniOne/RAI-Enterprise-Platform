---
id: component-gamma-ai-solvers
type: component
status: review
owners: [architects, techleads]
aligned_with: [principle-gamma-vision-scope]
---

# HLD: AI Solvers (Gamma)

## Назначение
Набор специализированных сервисов, решающих конкретные задачи в производстве с учетом данных и контекста.

## Solvers
- Vision Solver: Диагностика болезней/вредителей по фото-фиксации из Телеграм-бота.
- Satellite Solver: Анализ NDVI/NDRE, детектирование аномалий и зонирование полей.
- Advisory Solver: Генерация проактивных рекомендаций и адаптация техкарт.

## Matrix: Gamma Capabilities

Для исключения монолитности и гибкого управления (развертывание по регионам/ролям), Gamma разделена на независимые способности:

| Capability | Scope | Output |
|------------|-------|--------|
| **Memory** | Semantic & Episodic graph | Контекстные связи, поиск аналогов из прошлого. |
| **Perception** | Vision AI & Satellite Monitoring | Сигналы аномалий, детекция болезней по фото. |
| **Reasoning** | Risk & Economic filters | Верификация сигналов через призму рисков и денег. |
| **Advisory** | Recommendation Card | Финальный проактивный совет пользователю. |

> [!NOTE]
> Каждая способность может быть ограничена или отключена независимо (например, Satellite только для крупных агрохолдингов).

## Ограничения
- Обязательный human-in-the-loop.
- Строгие лимиты времени на инференс.
- Наличие полного audit trail по каждому решению.
- **Инвариант:** Любой Advisory-вывод обязан пройти через Risk Engine.
