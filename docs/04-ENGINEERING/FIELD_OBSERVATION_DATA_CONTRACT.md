# Field Observation — Data Contract (Telegram Ingestion)

**Purpose**
Define the minimal data required from farms via Telegram (text/voice/photo/video) so AI can extract and persist structured records in the database.

---

## 1) Global Context (always required)
These fields are attached to every event.

- `event_id`
- `event_type`
- `field_id`
- `season_id`
- `stage` (if applicable)
- `timestamp`
- `geo` (lat, lon, accuracy_m)
- `author_id`
- `confidence` (A/B/C)
- `media` (list of media items with type, file_id, taken_at)

### Confidence rules
- `A`: geo + photo/video + measurement
- `B`: geo + voice/text, no media
- `C`: voice/text only (requires follow-up)

---

## 2) Event Types and Minimal Fields

### 2.1 Observation
Field inspection report.

- `pest_or_issue` (string)
- `count_or_severity` (string)
- `note` (string, optional)

### 2.2 TechChecklistResult
Stage checklist completion.

- `checklist_id`
- `item_results[]` (item_id, status)
- `comment` (optional)

### 2.3 TaskExecution
Execution of field operation.

- `operation` (seed/spray/fertilize/harvest/etc)
- `area_ha`
- `duration_min`
- `executor_id` (optional if same as author)

### 2.4 InputUsage
Material usage.

- `input_type` (fertilizer/pesticide/seed/etc)
- `name`
- `amount`
- `unit`

### 2.5 MachineryUsage
Machine usage report.

- `machine_id`
- `hours`
- `fuel_liters`

### 2.6 YieldResult
Harvest or yield report.

- `yield_t_ha`
- `quality` (grade)
- `humidity` (optional)

### 2.7 Incident/SOS
Emergency escalation.

- `severity` (low/medium/high)
- `symptom`
- `immediate_action` (optional)

### 2.8 ComplianceProof
Regulatory or process proof.

- `proof_type`
- `comment` (optional)

---

## 3) AI Extraction Mapping (minimal)

- **Voice/Text** > `pest_or_issue`, `count_or_severity`, `operation`, `amount`, `unit`, `note`
- **Photo/Video** > media evidence + OCR (labels, meters) + pest/plant recognition
- **Geo** > validation against field polygon

---

## 4) Telegram UX (minimal steps)

- `REPORT` > ask 1–2 photos + 10–20 sec voice
- `SOS` > photo + voice
- `CHECKLIST` > quick buttons + optional voice

---

## 5) Canonical JSON Envelope

```json
{
  "event_id": "uuid",
  "event_type": "Observation",
  "field_id": "uuid",
  "season_id": "uuid",
  "stage": "Budding",
  "timestamp": "2026-02-07T10:15:00Z",
  "geo": { "lat": 0, "lon": 0, "accuracy_m": 15 },
  "author_id": "uuid",
  "confidence": "A",
  "media": [
    { "type": "photo", "file_id": "tg_file_id", "taken_at": "2026-02-07T10:14:30Z" }
  ],
  "payload": {
    "pest_or_issue": "hidden snout weevil",
    "count_or_severity": "5 per plant",
    "note": "edge of field"
  }
}
```

---

## 6) Validation Rules (MVP)

- Geo point must be inside field polygon (+20–50m tolerance).
- Media must be camera-captured (no gallery uploads).
- EXIF time must be within 10 minutes of `timestamp`.

---

## 7) DB Target Tables (mapping)

- `Observation` > `observation_events`
- `TechChecklistResult` > `checklist_events`
- `TaskExecution` > `task_execution_events`
- `InputUsage` > `input_usage_events`
- `MachineryUsage` > `machinery_usage_events`
- `YieldResult` > `yield_events`
- `Incident/SOS` > `incident_events`
- `ComplianceProof` > `compliance_events`

---

**Next step**: confirm event list and add field/season reference lookup endpoints for Telegram bot.
