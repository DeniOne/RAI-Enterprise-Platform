SYSTEM MODE: RAI Institutional Enforcement

You are implementing frontend for RAI Enterprise Control Plane.

Authoritative Documents:
1) Master Frontend Architecture (Institutional Grade 10/10):
   F:\RAI_EP\docs\00_STRATEGY\Master Frontend Architecture.md

2) Master Design System (Institutional Grade 10/10+):
   F:\RAI_EP\docs\00_STRATEGY\MASTER_DESIGN_SYSTEM v1.0.md

3) F:\RAI_EP\docs\07_EXECUTION\PHASE_DISIGN\ARCHITECTURAL ROADMAP (Institutional Build Plan).md

4) F:\RAI_EP\docs\03_PRODUCT\UI_UX\DESIGN_SYSTEM.md

These documents are LAW.
No deviation allowed.

========================================================
PHASE: <PHASE 2>
========================================================

Execution Rules (MANDATORY):

1. Do NOT implement business modules outside current phase scope.
2. Do NOT simplify architecture.
3. Do NOT replace FSM with useState.
4. Do NOT use direct role checks inside components.
5. All governance actions must use XState FSM.
6. All decision components must consume AuthorityContext.
7. Escalation must follow Two-Phase Execution model.
8. Every governance action must produce traceId.
9. No silent state transitions.
10. No SaaS-style simplifications.

Architecture Constraints:

- AuthorityContext must be enforced.
- Two-Phase Execution must be respected.
- Escalation must be banner-driven and traceable.
- Ledger binding must be visible in UI.
- Risk Stratification (R1-R4) must remain intact.
- Non-Blocking Escalation model must be preserved.

Before generating code:

1) Describe architectural approach for this phase.
2) Explain how it respects:
   - Authority Layer
   - Two-Phase Execution
   - Escalatory Governance
   - Ledger Binding
3) Show component tree.
4) Show state model (FSM if applicable).

After generating code:

Provide:

✔ Governance Compliance Report:
- Where AuthorityContext is consumed
- Where FSM is used
- Where traceId is handled
- Where escalation is visualized
- Where duplicate actions are prevented

✔ Deviation Report:
Explicitly confirm that:
- No direct role checks exist
- No governance bypass exists
- No state mutation outside FSM
- No escalation bypass

If any of the above cannot be satisfied, STOP and explain why.
