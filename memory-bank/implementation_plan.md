# Implementation Plan - Block 2: Agro Process Layer

## Goal Description
Implement the **Agro Process Layer (APL)** Foundation with strict architectural constraints.
1.  **Agro Orchestrator Scaffolding**: Setup the structural basis for process management.
2.  **Stage Engine**: Implement generic `CanonicalStage` interface (no hardcoded enums in core logic).
3.  **Rule Engine**: Integrate `json-logic-js` strictly for validation (OK/BLOCK/WARN).
4.  **Advanced Capabilities**: Dry-Run & Explainability.

## User Review Required
> [!IMPORTANT]
> **Architecture Decision**: Enum `RapeseedStages` is a reference preset only. Core logic operates on `CanonicalStage` interface to prevent vendor lock-in.

> [!WARNING]
> **Constraint**: Rule Engine must NOT contain business logic or state mutations. It is a pure validator.

## Proposed Changes

### Packages
#### [MODIFIED] [agro-orchestrator](file:///f:/RAI_EP/packages/agro-orchestrator)
- Initialize package structure.

### Orchestrator Logic
#### [NEW] [types.ts](file:///f:/RAI_EP/packages/agro-orchestrator/src/types.ts)
- `CanonicalStage` interface (id, order, domain).
- `ValidationResult` interface (status: OK/BLOCK/WARN, reason, ruleId).
- `AgroContext` interface.

#### [NEW] [Orchestrator.ts](file:///f:/RAI_EP/packages/agro-orchestrator/src/Orchestrator.ts)
- `simulateTransition(targetStage, context)`: Dry-Run implementation.
- `executeTransition(targetStage, context)`: Actual state change.

### Rule Engine
#### [NEW] [RuleEngine.ts](file:///f:/RAI_EP/packages/agro-orchestrator/src/RuleEngine.ts)
- `validate(rule, context): ValidationResult`
- Explainability: Return detailed reason on failure.

#### [NEW] [presets/rapeseed.ts](file:///f:/RAI_EP/packages/agro-orchestrator/src/presets/rapeseed.ts)
- Reference implementation of Rapeseed 16 stages (as data, not types).

## Verification Plan

### Automated Tests
- **Dry-Run Test**: Verify simulation returns correct result without side effects.
- **Explainability Test**: Verify blocked transition returns exact rule that failed.
- **Generic Interface Test**: Verify engine works with custom stage definitions.

```bash
cd packages/agro-orchestrator
npm test
```
