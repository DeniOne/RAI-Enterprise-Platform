# LEVEL E: Спецификация Агро-Эко Капитального Учета

## 1. Введение
Стандарт учета плодородия почвы как финансового актива.
**Goal**: Превратить "истощение почвы" из невидимого фактора в строку финансовой отчетности.

## 2. Soil Asset Valuation (Оценка Актива)

### 2.1. Base Formula
Балансовая стоимость плодородия ($BV_{soil}$) рассчитывается как Net Present Value будущих урожаев, обеспечиваемых текущим уровнем гумуса.
$$
BV_{soil} = SRI_{current} \cdot Area_{ha} \cdot \text{ValuationFactor}_{region}
$$
*   $\text{ValuationFactor} \approx \$2000/\text{ha}$ (Стоимость "идеальной" земли минус стоимость "мертвой" земли).

## 3. Depreciation Logic (Амортизация)

### 3.1. Calculation
В конце каждого сезона рассчитывается изменение SRI:
$$
\Delta SRI = SRI_{end} - SRI_{start}
$$
*   Если $\Delta SRI < 0$: **Depreciation Expense** (Расход).
    $$
    D_{exp} = |\Delta SRI| \cdot Area \cdot \text{RestorationCostMultiplier}(\Delta SRI)
    $$
*   Если $\Delta SRI > 0$: **Capital Gain** (Доход от переоценки актива).

### 3.2. Restoration Cost Multiplier (Non-Linearity)
Восстанавливать сильно убитую почву дороже, чем поддерживать среднюю.
$$
RCM(x) = \text{BaseCost} \cdot e^{k \cdot (1 - SRI)}
$$
Это штрафует стратегии, доводящие почву до истощения.

## 4. Financial Reporting (P&L Integration)

### 4.1. Extended P&L Structure
Отчет о прибылях и убытках дополняется секцией "Ecosystem flows":

| Item | Value | Note |
| :--- | :--- | :--- |
| **Gross Margin** | $500/ha | Standard Calc |
| (-) **Soil Depreciation** | ($120/ha) | Hidden Cost (N mining) |
| **Sustainability Adjusted Profit**| **$380/ha** | Real metric for dividends |

## 5. Audit & Compliance
*   **Internal Audit**: Проверяет, что дивиденды не выплачиваются из *Soil Depreciation* (проедание капитала).
*   **Blockchain Anchor**: Значение $BV_{soil}$ фиксируется в Ledger ежегодно (Snapshot).
