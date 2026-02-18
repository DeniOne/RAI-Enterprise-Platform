---
id: DOC-MET-LC-002
type: Metrics Specification
layer: Metrics (Level C)
status: Draft
version: 1.3.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL C DIVERGENCE METRICS
## Метрики семантического и структурного расхождения (D5 Hardened)

---

## 1. Калибровка Предиктивной Мощи

### M-DIV-05: Divergence-Regret Correlation
Для оценки адекватности Risk Engine используется коэффициент ранговой корреляции.

**Метод:** **Spearman Rank Correlation** ($\rho$).
- **Почему:** Мы оцениваем монотонность (согласованность рангов), а не линейную зависимость. Высокий DIS должен соответствовать высокому Regret в большинстве случаев.
- **Window:** Rolling 90 days / Full Season.
- **Target:** $\rho > 0.65$.

---

## 2. Invariants

- **I-DIV-003 (Policy Linkage):** Расчет корреляции обязан учитывать версии `RiskEscalationPolicy`. Смешивание данных разных политик без нормализации запрещено.

---

[Changelog]
- v1.2.0: D5 Hardening.
- v1.3.0: Correlation Formalization. Зафиксирован Spearman Rank Correlation как основной метод калибровки DIS-Regret. Добавлен инвариант Policy Linkage.
