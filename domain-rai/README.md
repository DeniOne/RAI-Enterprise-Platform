# RAI Domain Layer
Rules:
- No direct imports from mg-core
- All interactions go through adapters/
- FSM here subscribes to PSEE, not modifies it
- AI is advisory only
> [!CAUTION]
> **ACCESS POLICY: ISOLATED**

All logic in this directory:
1. Must define the specific business rules for RAI (Rapeseed Agro-Intelligence).
2. Must **NOT** import `mg-core` directly.
3. Must work through `adapters` only.

## Structure
- `registry/`: Domain entities specific to RAI (Field, Crop, Inspection).
- `fsm/`: State machines for RAI processes (Harvest Cycle, Advisory Flow).
- `services/`: Business logic services.
- `economy/`: Specific economic rules (AgroCoin, Yield Bonus).
- `analytics/`: Data processing for advisory.
- `decision-log/`: Immaculate record of Human/AI decisions.
