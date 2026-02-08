---
id: process-hr-ops
type: process
status: approved
owners: [hr-department]
depends_on: [principle-vision]
---

# HR_Functions_Operating_Model

> Canonical operating model for HR functions in RAI_EP.
> Purpose: give IDE / implementation team a **clear, non-ambiguous understanding** of how each HR function WORKS technically.

---

## 0. System Boundary (Hard Rule)

**RAI_EP is NOT a кадровая система.**
Legal HR facts and documents live outside (1C:ZUP, EDO, HRIS).

RAI_EP:

* consumes **confirmed facts**
* manages **processes, signals, analytics, development**
* never stores legal documents or personal data

---

## 1. FOUNDATION LAYER (Corporate / Lifecycle)

### 1.1 Hiring (Найм)

**Purpose**: trigger internal management processes after legal hiring.

* Source of truth: external HRIS / EDO
* Input: `EmployeeHired` event
* Storage: `EmployeeProfile (externalId, role, team, status)`

**RAI_EP actions**:

* create/activate EmployeeProfile
* start OnboardingPlan
* initialize HR analytics baseline

**Explicitly NOT**:

* creating contracts
* storing documents
* signing anything

---

### 1.2 Employment Accounting (Учёт)

**Purpose**: reflect legal employment state inside management system.

* Source of truth: external HRIS
* Inputs:

  * `EmployeeStatusChanged`
  * `EmployeeTransferred`
  * `EmployeeTerminated`

**RAI_EP actions**:

* update employmentStatus
* suspend / resume HR processes
* stop OKR / Development on termination

**Explicitly NOT**:

* payroll
* timesheets
* legal records

---

### 1.3 Onboarding (Адаптация)

**Purpose**: controlled integration into company system.

* Source of truth: RAI_EP
* Trigger: `EmployeeHired`

**RAI_EP actions**:

* create OnboardingPlan
* track stages
* emit delay / overload signals

---

### 1.4 Learning (Обучение)

**Purpose**: competency development aligned with role.

* Source of truth: LMS / external platforms
* Inputs: `LearningAssigned`, `LearningCompleted`

**RAI_EP actions**:

* link learning to role / OKR
* detect skill gaps
* feed Development layer

---

### 1.5 Support (Сопровождение)

**Purpose**: operational support of employee as system unit.

* Source of truth: RAI_EP

**RAI_EP actions**:

* manage SupportCases
* measure support load
* send signals to Analytics

---

## 2. INCENTIVE LAYER (Direction & Reinforcement)

### 2.1 KPI

**Purpose**: operational performance signals.

* Source of truth: operational systems
* Input: KPI values import

**RAI_EP actions**:

* analyze KPI pressure
* correlate with burnout / engagement

---

### 2.2 OKR

**Purpose**: intent and focus alignment.

* Source of truth: RAI_EP

**RAI_EP actions**:

* manage OKR cycles
* track progress
* connect with Strategy & TechMap

**Explicitly NOT**:

* punishment system
* HR evaluation

---

### 2.3 OCR (Operational Control Results)

**Purpose**: process execution visibility.

* Source of truth: Task Engine / TechMap

**RAI_EP actions**:

* correlate OCR with OKR
* emit risk signals

---

### 2.4 Bonuses

**Purpose**: financial reinforcement (signal, not payroll).

* Source of truth: management decision

**RAI_EP actions**:

* record immutable RewardEvent
* analyze motivation effect

---

### 2.5 Recognition

**Purpose**: social and cultural reinforcement.

* Source of truth: RAI_EP

**RAI_EP actions**:

* record RecognitionEvent (append-only)
* analyze cultural health

---

## 3. DEVELOPMENT LAYER (Strategic / Human-Centric)

### 3.1 Signals (Pulse & Feedback)

**Purpose**: listen, not judge.

* Inputs: PulseSurvey, self/peer feedback
* Storage: SurveyResponse (immutable)

---

### 3.2 Assessments

**Purpose**: structured understanding, not verdicts.

* Input: aggregated signals
* Storage: HumanAssessmentSnapshot (immutable)

Examples:

* engagement level
* burnout risk
* ethical alignment

---

### 3.3 Individual Development Programs

**Purpose**: long-term human investment.

* Source of truth: RAI_EP

**RAI_EP actions**:

* create DevelopmentPlan
* track outcome deltas

---

### 3.4 Non-Financial Motivation

**Purpose**: meaning, autonomy, growth.

* Source: HR / AI proposals

**RAI_EP actions**:

* apply MotivationPrograms
* measure engagement delta

---

### 3.5 Personal Incentives

**Purpose**: targeted reinforcement.

* Source: management decision

**RAI_EP actions**:

* record IncentiveApplied
* evaluate response

---

### 3.6 Mentorship

**Purpose**: experience transfer.

* Source: RAI_EP

**RAI_EP actions**:

* manage MentorAssignment
* evaluate development impact

---

### 3.7 Environment Change (Key Principle)

**Purpose**: change system, not person.

* Source: HR / Management decision

**RAI_EP actions**:

* record EnvironmentChangeAction
* measure before/after impact

---

## 4. AI AGENT ROLE

**AI DOES**:

* analyze signals and trends
* generate proposals
* attach confidence levels

**AI DOES NOT**:

* create facts
* change data
* make decisions

---

## 5. Final Canon Rules

1. HR facts come from outside
2. Signals ≠ judgments
3. Assessments are immutable
4. Development is personalized
5. Environment > personality
6. AI advises, humans decide

---

**Document status**: Canonical / Implementation-ready
