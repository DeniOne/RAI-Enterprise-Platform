---
id: DOC-ARH-PNC-LD-001
type: Principle
layer: Architecture
status: Accepted
version: 2.2.0
owners: [@techlead]
last_updated: 2026-02-18
---

# ПРИНЦИП: Контролируемое обучение (Controlled Learning D6+++)

---

## 1. Формулировка

> **Система может адаптироваться (изменять параметры модели), но не может изменять историю, правила управления (governance) или целевую функцию без явного внешнего утверждения.**

---

## 2. Формальная модель (Hybrid Isolation D6+++)

Пусть состояние системы состоит из **Shared Foundation** и **Tenant Specific State**.

### A. Shared State (Immutable Foundation)
$$S_{base} = \{M_{foundations}, O_{canonical}\}$$
*   $M_{foundations}$ — Базовые модели (Read-Only).
*   $O_{canonical}$ — Канонические формулы KPI и Loss (Read-Only).

### B. Tenant State (Mutable)
$$S_t^i = \{M_t^i, G_t^i, O_t^i, H_t^i\}$$

### C. Инвариант Изоляции
Пересечение состояний тенантов допустимо **только** в части Immutable Foundation:
$$S^i \cap S^j \subseteq S_{base}$$
Любая мутация ($M_t^i$) строго изолирована.

---

## 3. Определение Адаптации (Valid Adaptation)

Переход $S_t^i \to S_{t+1}^i$ допустим, если:

1.  $M_{t+1}^i \neq M_t^i$ (Параметры изменились).
2.  $G_{t+1}^i \equiv G_t^i$ (Governance Const).
3.  $O_{t+1}^i \equiv O_t^i$ (Objective Const).
4.  $H_{t+1}^i \supseteq H_t^i$ (History Append-Only).

---

## 4. Механизм принуждения (Enforcement Mechanism)

### A. Cryptographic Lineage ($M_{ver}$)
Идентификатор версии включает **все** влияющие факторы, в том числе Objective Function и Base Model:
$$ID(M_{ver}) = SHA256(Weights \oplus SnapshotID \oplus Hash(G_{cfg}) \oplus Hash(O_{code}) \oplus ID(M_{base}))$$

*   Если меняется код Objective ($O$) $\to$ Меняется хэш $\to$ Старая модель невалидна (Mismatch).
*   Это гарантирует `Semantic Consistency` инференса.

### B. Lineage Topology (DAG)
Граф версий $V$ является **Directed Acyclic Graph**.
1.  **Branching:** Разрешено (Manual Override создает ветку).
2.  **Merging:** **ЗАПРЕЩЕНО**. Нельзя слить две разные политики Governance.

### C. Rollback Policy (Forward-Only)
Откат модели — это **создание новой версии**, семантически эквивалентной старой.
$$Rollback(V_{bad} \to V_{good}) \implies V_{new} \equiv \{Weights(V_{good}), Snapshot(V_{good}), ...\}$$
$$Parent(V_{new}) = V_{bad}$$
*   История ($H$) не стирается.
*   Факт сбоя $V_{bad}$ остается в Lineage навсегда.

---

## 5. Evolution Registry ($\Delta S$)
Каждое изменение фиксируется криптографически:
$$\Delta S = \{ Hash(M_{new}), Hash(M_{old}), Signature(Governance) \}$$

---

## 6. Режимы обучения

| Режим | Триггер | Достигаемый результат | Topology Effect |
|-------|---------|-----------------------|-----------------|
| **Scheduled Retraining** | Cron | $M_{t+1}$ | Linear Extension |
| **Drift-Triggered** | Warning Config | $M_{t+1}$ | Linear Extension |
| **Manual Override** | Admin | $M_{new}$ using $G_{new}$ | **FORK (New Branch)** |
| **Rollback** | Critical Alert | $M_{new} \equiv M_{old}$ | Linear Extension (Recovery) |

---

## 7. Связь с инвариантами

- **D1 (No Retroactive Mutation):** Rollback реализуется через Forward-Only версию.
- **D3 (Governance Threshold):** Governance Hash включен в ID модели.
- **D6 (Exact Semantics):** Hash(O) включен в ID модели.

---

## 8. Связанные документы
- [ADR_LD_001_CONTROLLED_AUTONOMY.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/DECISIONS/ADR_LD_001_CONTROLLED_AUTONOMY.md)
- [LEVEL_D_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/LEVEL_D_INVARIANTS.md)
