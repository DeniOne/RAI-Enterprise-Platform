# LEVEL E: Спецификация UI Устойчивости

## 1. Введение
Стандарт интерфейса для систем принятия решений с учетом долгосрочных рисков.
**Goal**: Сделать невидимые риски ($D_t$) видимыми и осязаемыми.

## 2. The "Truth Chart" (Delta Gap Visualization)
Центральный элемент дашборда стратегии.
*   **X-Axis**: 5-10 лет.
*   **Y-Axis**: Cumulative Real Profit (EVA).
*   **Vis 1 (Business As Usual)**: Резкий рост, затем стагнация/падение. (Красная линия).
*   **Vis 2 (Regenerative)**: Медленный старт, экспоненциальный рост. (Зеленая линия).
*   **The Delta Gap**: Заштрихованная область между линиями.
    *   **Investment Phase (Years 1-3)**: Красная зона (Сколько я теряю сейчас?).
    *   **Payoff Phase (Years 4+)**: Зеленая зона (Сколько я выигрываю потом?).
*   **Break-Even Marker**: Точка пересечения линий с подписью года (e.g., "Year 3.5").

## 3. Governance Guard UI
Элементы управления для утверждения стратегий с рисками.
*   **State: BLOCKED (I34 Violation)**:
    *   Кнопка "Approve" неактивна (Disabled).
    *   Баннер: "Strategy violates Soil Constitution (Invariant I34)".
    *   Action: "Request Exception (Risk Committee)".
*   **State: WARNING (High Risk)**:
    *   Кнопка "Approve" требует **Double Confirmation**.
    *   Modal: "I acknowledge the P05 Risk and accept liability."
    *   Display: `RationaleHash` (e.g., `a7f3...9c`) рядом с кнопкой согласия.

## 4. Soil Wealth Indicator
Виджет "Капитализация Почвы" в шапке профиля.
*   **Metric**: $AssetValue_{soil}$.
*   **Trend**: $\Delta \%_{YoY}$.
*   **Drill-down**: Показывает разбивку на $N_{stock}$, $C_{org}$, $Structure$.

## 5. Adversarial Alerts
Если система обнаруживает попытку "геймификации" (например, монокультура ради субсидий):
*   **Alert**: "Monoculture Detected (I36)".
*   **Icon**: ⚠️ Shield Icon with 'Bio' symbol.
*   **Context**: "Rotation limit exceeded for Sunflower (1/7 years)."
