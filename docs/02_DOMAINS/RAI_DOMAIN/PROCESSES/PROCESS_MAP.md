---
id: DOC-DOM-GEN-079
type: Domain Spec
layer: Domain
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

---
id: component-rai-process-map
type: component
status: review
owners: [domain-experts]
aligned_with: [principle-vision]
---

# RAI: ПРОЦЕССЫ

## 1. Планирование сезона
1. Создание экземпляра `Season`.
2. Маппинг на `Core.Flow`.
3. Формирование Технологической карты (набор `Operation`).
4. Генерация черновиков `Core.Task` для каждой операции.

## 2. Учет агроопераций (Исполнение)
1. Назначение исполнителя и техники через `Core.Task`.
2. Фиксация начала работ (событие `Task.Started`).
3. Ввод фактических параметров (расход семян, ГСМ) в метаданные задачи.
4. Закрытие задачи (`Task.Completed`).
5. Автоматический пересчет экономики в `Core.Economy` (списание ресурсов).

## 3. Уборка урожая и закрытие сезона
1. Фиксация валового сбора.
2. Сравнение `YieldTarget` vs `YieldFact`.
3. Закрытие `Core.Flow`.
4. Архивация данных в `PersonalFile` поля/сезона.

> [!IMPORTANT]
> **PersonalFile** — доменный read-model RAI, не часть Business Core.
