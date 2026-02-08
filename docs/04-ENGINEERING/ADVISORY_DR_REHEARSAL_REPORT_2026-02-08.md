# Advisory DR/Rollback Rehearsal Report (Sprint 6)

## Session Metadata
- Session ID: `ADVISORY-DR-REHEARSAL-2026-02-08`
- Date (UTC): `2026-02-08T22:28:06.340Z`
- Environment: `local-dev`
- Base URL: `http://localhost:4000`
- Trace Prefix: `dr-1770589685664`

## Scenario
- Simulated incident at rollout stage `S3`.
- Immediate containment by enabling kill-switch.
- Rollback rollout stage to `S1`.
- Recovery by disabling kill-switch and validating safe state.

## Timeline
1. Configure rollout stage `S3`.
2. Simulate incident detection.
3. Enable kill-switch.
4. Verify `pilot/status` => `enabled=false`.
5. Rollback rollout stage to `S1`.
6. Disable kill-switch.
7. Verify rollout status at safe stage (`S1`, 10%).

## Measured Metrics
- Containment RTO: `0.04s`
- Full Recovery RTO: `0.13s`
- Simulated RPO: `0s`
- Total Drill Duration: `0.30s`

## Verification Checks
- `pilotDisabledOnContainment`: `true`
- `rollbackReachedS1`: `true`
- `killSwitchEnabled` audit event: `true`
- `killSwitchDisabled` audit event: `true`
- `rollbackRecorded` audit event: `true`

## Result
- Final Status: `PASS`
- Conclusion: DR/rollback procedure is operationally valid for advisory staged rollout.

## Execution Command
```bash
pnpm --dir apps/api run drill:advisory:dr
```
