# Beta Exit Criteria & Decision Canon ⚖️

## 1. Automated Risk Thresholds (Critical Gates)
The following events are physically blocked by the Risk Engine without human override in the current implementation:

| Action Category | Trigger | Verdict | FSM State |
| :--- | :--- | :--- | :--- |
| **APL Transition** | Any `RiskVerdict.BLOCKED` | `RiskBlockedError` | `BLOCKED` |
| **Financing** | Budget Exhausted | `RESTRICTED` | `CRITICAL` |
| **R&D Scaling** | Violations found in 3+ Experiments | `BLOCKED` | `BLOCKED` |

## 2. Shared Responsibility Model
- **System Decides**: Deterministic safety (Legal compliance, basic financial solvency). 
- **Human Decides**: Strategic trade-offs (Choosing between two "Allowed" risks, selecting crop varieties).

## 3. Decision Traceability
Every block or critical restriction is logged in `DecisionRecord`:
- `traceId`: Linking the event to the user's attempt.
- `explanation`: Full snapshot of why the engine blocked (rules, signals, history).

## 4. Phase Beta Exit Sign-off (Canon)
**Audit Correction (2026-02-07):** Phase Beta reopened due to missing Contour 2 (Field Execution).

- [x] Unified Risk Engine (Deterministic FSM)
- [x] Cross-domain Collectors (Audit Ready)
- [x] Immutable Decision Audit Trail
- [x] Physical Risk Gates in Orchestrators
- [x] Frontend Visibility (Strategic Health View)

**Exit Status:** Phase Beta -> **IN PROGRESS**
**Next Phase:** Gamma (Not Started ? waiting for Beta completion)
