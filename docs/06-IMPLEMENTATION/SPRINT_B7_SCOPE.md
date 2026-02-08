---
id: sprint-b7-scope
type: sprint
status: planning
owners: [techleads]
aligned_with: [beta-integrity-layer]
---

# Sprint B7: Advanced Agro AI (Vision Service) 👁️

> **Timeline:** ASAP
> **Focus:** AI-driven Visual Analysis & Diagnostics

## 1. Objective
Enable automated pest and disease detection from field photos submitted via Telegram. The system must analyze images, identify threats with a confidence score, and recommend checking specific tech maps or operations.

## 2. Key Modules
### 2.1 VisionService (Core)
- **Role:** Orchestrates communication with the AI Model (mocked or external API).
- **Input:** Image Buffer / URL.
- **Output:** JSON Inference Result (Class, Bounding Box, Confidence).

### 2.2 Telegram Integration
- **Flow:** User sends photo -> "Analyze?" inline button -> `VisionService` processes -> Reply with annotated image/text.

### 2.3 FieldObservation Enrichment
- **ObservationType:** `PEST_EVIDENCE` / `DISEASE_EVIDENCE`.
- **Metadata:** Store JSON inference results in `FieldObservation.telemetryJson` or a new `aiAnalysis` field.

## 3. Work Breakdown Structure (WBS)

### Block 7.1: Infrastructure & API
- [ ] **Module:** `modules/vision/`
- [ ] **Service:** `VisionService` (Skeleton)
- [ ] **API:** `POST /agro/vision/analyze` (Internal/External)

### Block 7.2: Integration
- [ ] **Telegram:** Handler for Photo messages with Intent `ANALYSIS_REQUEST`.
- [ ] **Prisma:** Update `FieldObservation` to support AI metadata (if needed).

### Block 7.3: Mock Logic (Prototype)
- [ ] Implement Mock Inference for:
    - `WHEAT_RUST` (Puccinia triticina)
    - `EURYGASTER_INTEGRICEPS` (Sunn pest)
    - `HEALTHY`
- [ ] Confidence Logic: Random or deterministic based on file hash.
