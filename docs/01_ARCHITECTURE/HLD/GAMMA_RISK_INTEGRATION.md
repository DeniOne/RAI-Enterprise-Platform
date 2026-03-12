---
id: DOC-ARC-HLD-GAMMA-RISK-INTEGRATION-KNZR
layer: Architecture
type: HLD
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# HLD: Интеграция Gamma & Risk Engine 🛡️

## 1. Концепция
Для предотвращения дублирования логики и обеспечения безопасности, все проактивные рекомендации фазы Gamma обязаны проходить через существующий **Risk Engine** (Block 6).

## 2. Петля принятия решения (Decision Loop)

```mermaid
sequenceDiagram
    participant P as Perception (Vision/Satellite)
    participant M as Memory (Semantic/Episodic)
    participant A as Gamma Advisory
    participant RE as Risk Engine (Block 6)
    participant U as User (UI/Bot)

    P->>A: Сигнал аномалии / болезни
    M->>A: Исторический контекст (аналоги)
    A->>A: Формирование черновика рекомендации
    A->>RE: Запрос на Admission Verdict (Черновик + Контекст)
    Note over RE: Проверка Hard Constraints и Risk Gates
    RE-->>A: Verdict (Approved / Blocked / Warning)
    alt Approved
        A->>U: Публикация совета в интерфейс (Recommendation Card)
    else Blocked
        A->>A: Отмена (Запись в Audit Trail: Blocked by Risk Engine)
    end
```

## 3. Разделение ответственности
- **Gamma Advisory:** Генерирует "ЧТО" делать на основе данных и опыта.
- **Risk Engine:** Решает "МОЖНО ЛИ" это сейчас делать, исходя из бизнес-правил, SLA и матриц рисков.

## 4. Канонический инвариант
> [!IMPORTANT]
> Система не имеет права показывать пользователю совет, который не прошел верификацию в Risk Engine. Любая попытка обхода считается критическим инцидентом безопасности.
