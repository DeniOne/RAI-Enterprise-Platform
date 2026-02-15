---
id: DOC-DOM-GEN-063
type: Domain Spec
layer: Domain
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

---
id: component-enterprise-legal
type: component
status: review
owners: [legal, architects]
aligned_with: [principle-vision]
---

# Domain: Legal & GR

> **Contour:** 1 (Enterprise Back-Office) | **Module:** Legal

## 1. Назначение
Юридическая защита, комплаенс и взаимодействие с государством.

## 2. Основные Сущности (Entities)

### 2.1 Contract (Договор)
*   **Fields:** `Parties`, `EffectiveDate`, `Status` (Draft/Signed), `LinkToScan`.
*   **AI:** `RiskAnalysis` (JSON report).

### 2.2 Risk (Риск)
*   **Level:** `High`, `Med`, `Low`.
*   **Description:** "Отсутствует пункт о форс-мажоре".

### 2.3 Report (Отчет)
*   **Type:** `Tax`, `Stat`, `Grant`.
*   **Status:** `Generated`, `Submitted`.

## 3. Ключевые Процессы
1.  **AI Review:** Авто-проверка входящих договоров на риски.
2.  **Generator:** Создание договоров из шаблонов.
3.  **Grants:** Отслеживание доступных субсидий для агро.
