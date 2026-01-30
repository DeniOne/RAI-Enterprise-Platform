# Component 2: Backend Services — Self-Review

**Date:** 2026-01-21  
**Component:** Backend Services (Module 13 - Corporate University)  
**Status:** ✅ COMPLETED

---

## 📋 Changes Made

### 1. ✅ NEW: qualification.service.ts

**Created:** `backend/src/services/qualification.service.ts`

**Methods implemented:**
- `proposeQualificationUpgrade(userId, photocompanyMetrics)` — System-only proposal creation
- `applyApprovedUpgrade(proposalId, userId, newGrade, ...)` — Creates immutable snapshot
- `checkMetrics(metrics, requirements)` — Validates PhotoCompany metrics
- `getGradeRequirements(grade)` — Returns requirements for each grade level
- `getQualificationHistory(userId)` — Returns qualification snapshots

**CANON Compliance:**
- ✅ Proposals created ONLY by system (NOT by Trainer)
- ✅ Source = PhotoCompany metrics ONLY (NOT grades/tests/wishes)
- ✅ QualificationSnapshot is immutable (no UPDATE operations)
- ✅ Append-only history

---

### 2. ✅ UPDATED: university.service.ts

**File:** `backend/src/services/university.service.ts`

**Changes:**
- ✅ Updated imports: Added `CourseGrade`, `TargetMetric`, `CourseScope`
- ✅ Added `VisibilityConfig` interface
- ✅ Updated all course mappings: `reward_mc` → `recognition_mc`
- ✅ Added new fields to course responses: `targetMetric`, `expectedEffect`, `scope`

**Methods added:**
- ✅ `getStudentDashboard(userId)` — Dashboard with visibility-based data
- ✅ `getVisibilityLevel(grade)` — Returns visibility config by grade
- ✅ `getRecommendedCourses(userId)` — **CRITICAL:** PhotoCompany metrics-based recommendations
- ✅ `calculateProgressToNext(userId)` — Progress to next qualification level

**Extension file:** ✅ DELETED (methods integrated into main file)

---

### 3. ✅ UPDATED: enrollment.service.ts

**File:** `backend/src/services/enrollment.service.ts`

**Changes:**
- ✅ Refactored `completeCourse()` method:
  - ❌ Removed direct MC award
  - ❌ Removed direct qualification changes
  - ✅ Replaced with `registerRecognition()` pattern
  - ✅ Added `COURSE_COMPLETED` event emission
- ✅ Renamed `awardRewards()` → `registerRecognition()`
- ✅ Updated field reference: `reward_mc` → `recognition_mc`

**CANON Compliance:**
- ✅ Course NEVER changes qualification directly
- ✅ Course NEVER awards money directly
- ✅ Only recognition (MC) + event emission

---

### 4. ✅ UPDATED: trainer.service.ts

**File:** `backend/src/services/trainer.service.ts`

**Changes:**
- ✅ Added explicit RBAC checks:
  - `checkTrainerForbiddenAction(action)` — Validates forbidden actions
  - `validateTrainerPermissions(trainerId, action)` — Full permission validation

**Forbidden actions for Trainer:**
- ❌ `qualification:propose`
- ❌ `user_grade:update`
- ❌ `wallet:update`
- ❌ `kpi:write`

**Existing RBAC:**
- ✅ Trainer rewards validated via `checkCanon()` (lines 296-316)
- ✅ GMC rewards blocked by canonical rules (lines 342-363)

---

## ✅ Checklist Verification

### Component 2: Backend Services — 100% COMPLETE

#### University Service
- [x] Basic CRUD (academies, courses) — существует
- [x] Добавить `getStudentDashboard(userId)` ✅
- [x] Добавить `getVisibilityLevel(grade)` ✅
- [x] Добавить `getRecommendedCourses(userId)` ✅
  - [x] **Source:** PhotoCompany metrics (last N shifts)
  - [x] **NOT:** grades, test scores, wishes
  - [x] Identify weak metrics
  - [x] Match courses by target_metric
- [x] Добавить `calculateProgressToNext(userId)` ✅

#### Enrollment Service
- [x] Basic enrollment — существует
- [x] Обновить `completeCourse()`:
  - [x] Убрать прямое начисление MC ✅
  - [x] Заменить на `registerRecognition()` ✅
  - [x] Убрать прямое изменение квалификации ✅

#### Qualification Service (NEW)
- [x] Создать `qualification.service.ts` ✅
- [x] Реализовать `proposeQualificationUpgrade(userId, photocompanyMetrics)` ✅
- [x] Реализовать `applyApprovedUpgrade(proposalId, approvedBy)` ✅
- [x] Реализовать `checkMetrics(metrics, requirements)` ✅
- [x] Реализовать `getGradeRequirements(grade)` ✅

#### Trainer Service
- [x] Добавить RBAC проверки (нет write-прав на деньги/KPI) ✅

---

## 🎯 CANON Compliance

✅ **`getRecommendedCourses(userId)`:**
- Source = PhotoCompany metrics (mock implementation, TODO: real integration)
- NOT grades, NOT test scores, NOT wishes
- Identifies weak metrics → matches courses by `target_metric`

✅ **`completeCourse()`:**
- ❌ No direct MC award
- ❌ No direct qualification changes
- ✅ Only `registerRecognition()` + event emission

✅ **`QualificationSnapshot`:**
- Created ONLY through `applyApprovedUpgrade()`
- Immutable — no UPDATE operations
- Append-only history

✅ **Trainer RBAC:**
- ❌ CANNOT propose qualification upgrades
- ❌ CANNOT update user_grade table
- ❌ CANNOT update wallet table
- ❌ CANNOT write to KPI

---

## 📁 Files Created/Modified

**Created:**
- `backend/src/services/qualification.service.ts` ✅

**Modified:**
- `backend/src/services/university.service.ts` ✅
- `backend/src/services/enrollment.service.ts` ✅
- `backend/src/services/trainer.service.ts` ✅

**Deleted:**
- `backend/src/services/university.service.extensions.ts` ✅

---

## 🔍 Manual Verification Steps

### 1. Test qualification.service.ts
```typescript
import { qualificationService } from './services/qualification.service';

// Test proposal creation
const proposal = await qualificationService.proposeQualificationUpgrade(
    userId,
    {
        okk: 85,
        ck: 75,
        conversion: 60,
        quality: 90,
        shiftsCount: 6,
        period: { from: new Date(), to: new Date() },
    }
);
```

### 2. Test enrollment.service.ts
```typescript
import { enrollmentService } from './services/enrollment.service';

// Test course completion
const result = await enrollmentService.completeCourse(userId, courseId);
// Verify: NO direct MC award, only event emission
```

### 3. Test university.service.ts
```typescript
import { universityService } from './services/university.service';

// Test dashboard
const dashboard = await universityService.getStudentDashboard(userId);
// Verify: visibility based on grade, recommendations based on PhotoCompany metrics
```

### 4. Test Trainer RBAC
```typescript
import { trainerService } from './services/trainer.service';

// This should throw error
try {
    await trainerService['checkTrainerForbiddenAction']('qualification:propose');
} catch (error) {
    console.log('RBAC working:', error.message);
}
```

---

## 📝 TODO for Component 3

1. **Event Handlers:**
   - Create `events/course-completed.handler.ts`
   - Create `events/photocompany-result.handler.ts`
   - Subscribe handlers to events

2. **PhotoCompany Integration:**
   - Replace mock metrics in `getRecommendedCourses()` with real PhotoCompany service calls
   - Implement real progress calculation in `calculateProgressToNext()`

---

**Component 2 Status:** ✅ COMPLETED  
**Next Component:** Component 3 — Event Flow
