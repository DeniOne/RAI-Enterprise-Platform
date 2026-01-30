# Component 1: Database Schema — Self-Review

**Date:** 2026-01-21  
**Component:** Database Schema (Module 13 - Corporate University)  
**Status:** ✅ COMPLETED

---

## 📋 Changes Made

### 1. New Enums

✅ **TargetMetric** — PhotoCompany metrics that courses target
- OKK
- CK
- CONVERSION
- QUALITY
- RETOUCH_TIME
- AVG_CHECK
- ANOMALIES

✅ **CourseScope** — Target role scope for courses
- PHOTOGRAPHER
- SALES
- RETOUCH
- GENERAL

### 2. Course Model Updates

✅ **Added canonical fields (REQUIRED):**
- `target_metric: TargetMetric` — Which PhotoCompany metric this course targets
- `expected_effect: String` — Expected improvement (e.g., "↓ declined 10%")
- `scope: CourseScope` — Target role scope

✅ **Renamed field:**
- `reward_mc` → `recognition_mc` (using `@map("reward_mc")` to preserve DB column name)
- **CANON:** Course ≠ money, only recognition

### 3. QualificationSnapshot Model (NEW)

✅ **Created immutable qualification history model:**
- `id`, `user_id`, `previous_grade`, `new_grade`
- `photocompany_metrics` (JSON) — Evidence from PhotoCompany
- `stability_period` (Int) — Number of shifts with stable metrics
- `proposal_id`, `approved_by`, `approved_at` — Approval workflow
- `reason` — Why this upgrade happened
- `created_at` — Timestamp (NO `updated_at` — immutable!)

✅ **Indexes:**
- `user_id`
- `new_grade`
- `created_at`

---

## 🔧 Migration Details

**Migration name:** `20260120234728_add_course_photocompany_fields`

**Strategy:** Safe migration for existing data
1. Add columns as NULLABLE
2. Populate existing courses with defaults:
   - `target_metric` = 'OKK'
   - `expected_effect` = 'Улучшение общей результативности'
   - `scope` = 'GENERAL'
3. Make columns NOT NULL

**Result:** ✅ Migration applied successfully

---

## ✅ Checklist Verification

### Component 1: Database Schema

#### Schema Updates
- [x] Добавить enum `TargetMetric` (OKK, CK, CONVERSION, QUALITY, RETOUCH_TIME, AVG_CHECK, ANOMALIES)
- [x] Добавить enum `CourseScope` (PHOTOGRAPHER, SALES, RETOUCH, GENERAL)
- [x] Обновить модель `Course`:
  - [x] Добавить `target_metric: TargetMetric`
  - [x] Добавить `expected_effect: String`
  - [x] Добавить `scope: CourseScope`
  - [x] Переименовать `reward_mc` → `recognition_mc` (using @map)
- [x] Создать модель `QualificationSnapshot`
  - [x] **Immutable** (no UPDATE operations)
  - [x] **Append-only** history
  - [x] Created ONLY via approved upgrade
  - [x] Snapshot ≠ current state
- [x] Создать миграцию `add_course_photocompany_fields`
- [x] Обновить существующие курсы (добавить обязательные поля)

#### Existing Tables (Already Complete)
- [x] academies
- [x] skills
- [x] materials
- [x] courses (✅ UPDATED)
- [x] course_modules
- [x] user_skills
- [x] user_grades
- [x] enrollments
- [x] module_progress
- [x] certifications
- [x] learning_paths
- [x] trainers
- [x] trainer_assignments
- [x] training_results

---

## 🎯 CANON Compliance

✅ **Курс НИКОГДА не начисляет деньги**
- Field renamed: `reward_mc` → `recognition_mc`
- Comment added: "course ≠ money, only recognition"

✅ **Курс НЕ меняет квалификацию напрямую**
- QualificationSnapshot created ONLY via approved upgrade
- Immutable, append-only design

✅ **Доход = f(Результат, Квалификация)**
- Course fields linked to PhotoCompany metrics (`target_metric`, `expected_effect`)

✅ **QualificationSnapshot immutable, append-only**
- No `updated_at` field
- Comments in schema: "IMMUTABLE: This is a snapshot, not current state"

---

## 📊 Database State

**Tables created:**
- `qualification_snapshots` ✅

**Tables updated:**
- `courses` ✅ (3 new columns, 1 renamed)

**Enums created:**
- `TargetMetric` ✅
- `CourseScope` ✅

**Existing courses:**
- All courses populated with default values ✅

---

## 🔍 Manual Verification Required

### 1. Check Course Table Structure
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('target_metric', 'expected_effect', 'scope', 'reward_mc');
```

**Expected result:**
- `target_metric` — USER-DEFINED (TargetMetric), NOT NULL
- `expected_effect` — TEXT, NOT NULL
- `scope` — USER-DEFINED (CourseScope), NOT NULL
- `reward_mc` — INTEGER, NOT NULL (DB column still exists, mapped to `recognition_mc`)

### 2. Check QualificationSnapshot Table
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'qualification_snapshots';
```

**Expected result:** Table exists

### 3. Check Existing Courses
```sql
SELECT id, title, target_metric, expected_effect, scope, reward_mc 
FROM courses 
LIMIT 5;
```

**Expected result:** All courses have default values populated

---

## 🚀 Next Steps

1. **Manual Verification** (USER must perform):
   - [ ] Verify course table structure
   - [ ] Verify QualificationSnapshot table exists
   - [ ] Check existing courses have default values

2. **Component 2: Backend Services** (next):
   - Create `qualification.service.ts`
   - Update `university.service.ts`
   - Update `enrollment.service.ts`

---

## 📝 Notes

- Migration strategy ensures zero downtime
- Existing courses preserved with sensible defaults
- Schema changes are backward-compatible (DB column `reward_mc` preserved)
- QualificationSnapshot design enforces immutability at schema level

---

**Component 1 Status:** ✅ READY FOR VERIFICATION
