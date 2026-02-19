# LEVEL E: Протокол Регенеративной Объяснимости

## 1. Введение
Стандарт "почему?" для ИИ-рекомендаций Level E.
**Principle**: Фермер не должен верить на слово. Он должен понимать математику решения.

## 2. Layer 1: Agronomic Narrative (The "What")
Простое объяснение для агронома.
*   **Template**: "Recommendation: Reduce Nitrogen by 15%."
*   **Reason**: "To prevent acidification ($pH < 5.5$) and preserve longterm yield potential."

## 3. Layer 2: Mathematical Trace (The "Why")
Детальное объяснение для аналитика/технолога.
*   **Formula**: "Objective Function Weight for $SRI$ is $0.4$, dominating $Yield$ ($0.3$) in this zone."
*   **Data Source**: "Based on Soil Sample #12345 (Lab A) showing $OM=2.1\%$."
*   **Model Confidence**: "Confidence $0.85$ (High) due to consistent historical data."

## 4. Layer 3: Governance Provenance (The "Authority")
Юридическое обоснование ограничений.
*   **Block Reason**: "Invariant I34 (Non-Degradation)."
*   **Authority**: "Enforced by `SoilConstitution_v1.0` (Immutable Ledger Block #998877)."
*   **Hash**: `SHA256(Strategy | Constitution)`.

## 5. Explainability of Uncertainty
Как объяснять вероятности?
*   **Bad**: "P95 Value is X."
*   **Good**: "In 19 out of 20 weather scenarios, your soil health improves. In the worst case (extreme drought), it remains stable."
*   **Visual**: "Fan Charts" (Веерные диаграммы) вместо сухих цифр.

## 6. Feedback Loop Explanation
Когда система меняет стратегию сама (Level D adaptation):
*   **Message**: "Strategy updated based on recent field sensor data."
*   **Diff**: "Previous plan: 100kg N. New plan: 80kg N."
*   **Reason**: "Soil moisture dropped below 30% critical threshold."
