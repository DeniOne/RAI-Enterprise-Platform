# Advisory Canary Progression Report (Sprint 6)

## Session Metadata
- Session ID: `ADVISORY-STAGE-PROGRESSION-2026-02-08`
- Date (UTC): `2026-02-08`
- Base URL: `http://localhost:4000`
- Trace Prefix: `progression-1770590227955`

## Stage Progression
- Before: `S1` (`10%`)
- Gate `S2`: `PASS`
- Promote `S2`: `25%`
- Gate `S3`: `PASS`
- Promote `S3`: `50%`
- After: `S3` (`50%`)

## Gate Metrics Used
- S2 gate: `errorRate=0`, `p95=2036ms`, `conversion=0.2`
- S3 gate: `errorRate=0`, `p95=2076ms`, `conversion=0.2`

## Result
- Final Status: `PASS`
- Conclusion: controlled staged rollout progression to `S3` validated.

## Execution Command
```bash
pnpm --dir apps/api run rollout:advisory:progress
```
