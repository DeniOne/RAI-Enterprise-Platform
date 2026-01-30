# Migration: add_course_photocompany_fields

**Date:** 2026-01-21  
**Module:** 13-Corporate-University  
**Status:** Ready for Review

## Summary

This migration adds PhotoCompany-linked canonical fields to the `Course` model and creates the immutable `QualificationSnapshot` model.

## Changes

### 1. New Enums

```prisma
enum TargetMetric {
  OKK
  CK
  CONVERSION
  QUALITY
  RETOUCH_TIME
  AVG_CHECK
  ANOMALIES
}

enum CourseScope {
  PHOTOGRAPHER
  SALES
  RETOUCH
  GENERAL
}
```

### 2. Course Model Updates

**Added fields:**
- `target_metric: TargetMetric` — Which PhotoCompany metric this course targets
- `expected_effect: String` — Expected improvement (e.g., "↓ declined 10%")
- `scope: CourseScope` — Target role scope

**Renamed field:**
- `reward_mc` → `recognition_mc` (using @map to preserve DB column)

**Before:**
```prisma
model Course {
  id             String      @id @default(uuid())
  academy_id     String?
  title          String
  description    String?
  
  required_grade CourseGrade?
  reward_mc      Int         @default(0)
  reward_gmc     Int         @default(0)
  
  is_mandatory   Boolean     @default(false)
  is_active      Boolean     @default(true)
  
  created_at     DateTime    @default(now())
  updated_at     DateTime    @updatedAt
}
```

**After:**
```prisma
model Course {
  id             String       @id @default(uuid())
  academy_id     String?
  title          String
  description    String?
  
  // CANONICAL FIELDS (REQUIRED)
  target_metric   TargetMetric
  expected_effect String
  scope           CourseScope
  
  required_grade  CourseGrade?
  recognition_mc  Int          @default(0) @map("reward_mc") // Renamed, preserves DB column
  reward_gmc      Int          @default(0)
  
  is_mandatory    Boolean      @default(false)
  is_active       Boolean      @default(true)
  
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
}
```

### 3. New Model: QualificationSnapshot

**Purpose:** Immutable, append-only history of qualification changes

```prisma
model QualificationSnapshot {
  id                String      @id @default(uuid())
  user_id           String
  
  // Qualification data
  previous_grade    CourseGrade?
  new_grade         CourseGrade
  
  // Evidence (PhotoCompany metrics)
  photocompany_metrics Json     // Last N shifts data
  stability_period     Int      // Number of shifts with stable metrics
  
  // Approval workflow
  proposal_id       String?    // Link to approval proposal
  approved_by       String?
  approved_at       DateTime?
  
  // Metadata
  reason            String     // Why this upgrade happened
  created_at        DateTime   @default(now())
  
  // IMMUTABLE: No updates allowed, append-only
  // Snapshot ≠ current state
  
  @@index([user_id])
  @@index([new_grade])
  @@index([created_at])
  @@map("qualification_snapshots")
}
```

## Migration Steps

1. Add enums `TargetMetric` and `CourseScope`
2. Add new fields to `Course` model
3. Create `QualificationSnapshot` model
4. Run migration
5. Update existing courses with default values (manual data migration)

## Data Migration Required

After schema migration, run data migration script to:
- Set `target_metric`, `expected_effect`, `scope` for existing courses
- Default values based on course title/description analysis

## Rollback Plan

If rollback needed:
1. Drop `qualification_snapshots` table
2. Remove new fields from `courses` table
3. Revert `recognition_mc` mapping
4. Drop enums `TargetMetric` and `CourseScope`
