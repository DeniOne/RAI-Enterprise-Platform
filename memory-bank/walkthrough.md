# Sprint B1 Walkthrough: Consulting Control Plane & Risk Architecture

## 1. Database Schema (Prisma)
Updated `schema.prisma` with new domains:
- **Tech Map Domain**: `TechMap`, `MapStage`, `MapOperation`, `MapResource`.
- **CMR Domain**: `DeviationReview`, `CmrDecision`.
- **Risk & Insurance**: `CmrRisk`, `InsuranceCoverage`.
- **Enums**: `ResponsibilityMode`, `RiskType`, `Controllability`, `LiabilityMode`, `ConfidenceLevel`.

> [!NOTE]
> Fixed validation errors (P1012) by adding missing back-relations to `Company`, `Season`, `User`, and `DeviationReview` models.

## 2. Backend Modules (NestJS)
### Tech Map Module (`apps/api/src/modules/tech-map`)
- **Controller**: `TechMapController` for Canvas UI interactions (`generate`, `validate`).
- **Service**: `TechMapService` for map construction and validation logic.

### CMR Module (`apps/api/src/modules/cmr`)
- **Services**:
  - `DeviationService`: Handles reviews and SLA logic (`handleSilence`).
  - `RiskService`: Assessments and insurance proposals.
  - `DecisionService`: Immutable logging of decisions.
- **Automation**: Added `@Cron(CronExpression.EVERY_HOUR)` to `DeviationService` to automatically shift liability if client is silent (>48h).

### App Module
- Registered `TechMapModule` and `CmrModule`.
- Added `ScheduleModule` for background jobs.

## 3. Verification & Logic
- **SLA Logic**: Verified via code review. The system checks `slaExpiration` and updates `responsibilityMode` to `CLIENT_ONLY` if expired.
- **Tripartite Logic**: Implemented in `DeviationService.createReview` (defaults to SHARED liability).
- **Schema Validation**: `db:generate` passed successfully.

## 4. Manual Actions Checklist
All automated steps completed. To apply changes to the database:

```bash
# Create Migration (Applies schema to DB)
npx prisma migrate dev --name sprint_b1_cmr
```
