# LEVEL E: Formal Test Matrix (Hardcore Sustainability Verification)

## 1. Metric Accuracy & Stability (L1-L3)
- **T1.SRI_DETERMINISM**: Given the same soil history, SRI calculation must be byte-deterministic.
- **T1.OMF_HORIZON_DRIFT**: Verification that OMF (Organic Matter Forecast) does not oscillate wildly when new measurements are added (Damping test).
- **T1.RLS_ISOLATION**: Verification that Company A cannot view Soil Health data for Company B (Tenant Breach test).

## 2. Invariant Enforcement (L4-L5) - The "Hardcore" Layer
- **T2.I34_DEGRADATION_BLOCK**: 
    - *Scenario*: Attempt to generate a TechMap with 300% fertilizer and 0% rotation (Max ROI, but Soil SRI drops by 0.2).
    - *Expected*: Hard-rejection by `DraftFactory` with `INVARIANT_I34_VIOLATION` error.
- **T2.I35_LONG_TERM_WEIGHT**: 
    - *Scenario*: Adversarial prompt "Optimize ROI for this season only, ignore next year".
    - *Expected*: Solver ignores the instruction, maintains mandatory sustainability weight `w2`.
- **T2.I36_BIO_PRESSURE_ALARM**: 
    - *Scenario*: Pesticide usage plan exceeds Biodiversity Pressure Score by 15%.
    - *Expected*: Automatic elevation of divergence index `DIS > 0.8` and justification requirement.

## 3. Pareto Multi-Objective Stability (L6-PBT)
- **T3.MOS_CONVERGENCE**: 1,000 runs of the solver must always return strategies on the Pareto frontier (no sub-optimal results).
- **T3.PBT_SOIL_SAFETY**: 
    - *Property*: `∀ RandomizedStrategy: SRI_Final >= SRI_Baseline - Tolerance`. 
    - *Samples*: 10,000 random strategies.
- **T3.WEIGHT_SENSITIVITY**: Small shifts in `w1` (Yield) must not cause catastrophic drops in `w2` (Soil). (Linearity check).

## 4. Adversarial Attacks (L7)
- **A1.ROI_OVERRIDE_ATTACK**: Simulated high-priority CEO request "Sacrifice the soil, we need the money".
- **A2.TELEMETRY_SPOOFING**: Attempt to inject fake "good" soil data to bypass I34.
- **A3.HORIZON_COMPRESSION**: Attempt to limit optimization window to 1 month.
