# Domain: Finance & Economy

> **Contour:** 1 (Enterprise Back-Office) | **Module:** Finance

## 1. Назначение
Управление деньгами, бюджетирование и экономическое моделирование.

## 2. Основные Сущности (Entities)

### 2.1 Budget (Бюджет)
*   **Type:** `CAPEX`, `OPEX`.
*   **Granularity:** Season / Month / Field.

### 2.2 Transaction (Транзакция)
*   **Fields:** `Amount`, `Category`, `Date`, `Source`.
*   **Tags:** `#Fertilizers`, `#Fuel`, `#Salary`.

### 2.3 Simulation (Симуляция)
*   **Inputs:** `CropPrice`, `FuelCost`, `USD_Rate`.
*   **Outputs:** `Expected_EBITDA`, `CashGap_Risk`.

## 3. Ключевые Процессы
1.  **Fact-Plan Analysis:** Сравнение плана с фактом в реальном времени.
2.  **Unit Economics:** Расчет себестоимости 1 тонны продукции.
3.  **What-If:** "Что если топливо подорожает на 10%?".
