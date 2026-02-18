---
id: DOC-ENG-LD-002
type: Engineering
layer: Engineering
status: Accepted
version: 3.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# MODEL REGISTRY — DATABASE SCHEMA (D7 Perfection)
## Схема базы данных для Industrial Registry

---

## 1. Prisma Models

### training_runs
*Execution Control.*
```prisma
model TrainingRun {
  id              String   @id @default(cuid())
  tenantId        String
  seasonId        String
  
  status          String   // RUNNING | COMPLETED | FAILED | ABORTED
  
  // D7: Deletion Protection
  company         Company  @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  model           ModelVersion? @relation(fields: [generatedModelId], references: [id])

  generatedModelId String? @unique

  // D6: Only one RUNNING job per context
  // @@index([tenantId, seasonId], map: "idx_single_running_job", where: "status = 'RUNNING'")
  @@map("training_runs")
}
```

### model_versions
*The Crown Jewels.*
```prisma
model ModelVersion {
  id                String   @id @default(cuid())
  version           Int
  tenantId          String
  status            String
  isDeleted         Boolean @default(false) // D7: Soft Delete only
  
  // Deep Hash Integrity
  configurationHash   String  @map("configuration_hash")
  artifactHash        String  @map("artifact_hash")
  
  // Lineage Protection
  branchType          String  @default("MAIN")
  lineageSignature    String  @map("lineage_signature")
  
  parentVersionId     String?
  biasAuditId         String? @unique

  parent        ModelVersion? @relation("ModelLineage", fields: [parentVersionId], references: [id])
  company       Company       @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  
  @@unique([tenantId, version])
  @@map("model_versions")
}
```

---

## 2. SQL Hardening (The Laws)

### 2.1. Strict State Machine
```sql
CREATE OR REPLACE FUNCTION validate_model_status_transition() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- 1. No Resurrection
  IF OLD.status IN ('DEPRECATED', 'ARCHIVED') THEN
    RAISE EXCEPTION 'Cannot change status of finalized version';
  END IF;

  -- 2. CANDIDATE -> SHADOW Guard
  IF OLD.status = 'CANDIDATE' AND NEW.status = 'SHADOW' THEN
    IF NEW.bias_audit_id IS NULL THEN
      RAISE EXCEPTION 'Policy Violation: BiasAudit required for SHADOW mode';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_status 
BEFORE UPDATE ON model_versions
FOR EACH ROW EXECUTE FUNCTION validate_model_status_transition();
```

### 2.2. Lineage Integrity & Genesis Block
```sql
CREATE OR REPLACE FUNCTION enforce_lineage_integrity() RETURNS TRIGGER AS $$
DECLARE
  parent_sig TEXT;
  parent_tid TEXT;
  expected_sig TEXT;
BEGIN
  IF NEW.parent_version_id IS NOT NULL THEN
    -- Standard Chain
    SELECT lineage_signature, tenant_id INTO parent_sig, parent_tid 
    FROM model_versions WHERE id = NEW.parent_version_id;

    -- Cross-Tenant Isolation
    IF parent_tid <> NEW.tenant_id THEN
      RAISE EXCEPTION 'Security Breach: Cross-Tenant Inheritance Forbidden';
    END IF;

    -- Sig(N) = SHA256(Sig(N-1) + ConfigHash(N))
    expected_sig := encode(digest(parent_sig || NEW.configuration_hash, 'sha256'), 'hex');
    
  ELSE
    -- D7: Genesis Block Logic
    -- Sig(Genesis) = SHA256('GENESIS' + ConfigHash)
    expected_sig := encode(digest('GENESIS' || NEW.configuration_hash, 'sha256'), 'hex');
  END IF;

  IF NEW.lineage_signature <> expected_sig THEN
    RAISE EXCEPTION 'Integrity Error: Invalid Lineage Signature';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verify_lineage
BEFORE INSERT ON model_versions
FOR EACH ROW EXECUTE FUNCTION enforce_lineage_integrity();
```

### 2.3. Monotonic Version Enforcer
```sql
CREATE OR REPLACE FUNCTION force_monotonic_version() RETURNS TRIGGER AS $$
DECLARE next_ver INT;
BEGIN
  SELECT last_version + 1 INTO next_ver 
  FROM model_version_counters WHERE tenant_id = NEW.tenant_id FOR UPDATE;

  IF next_ver IS NULL THEN next_ver := 1; END IF;
  NEW.version := next_ver;
  
  INSERT INTO model_version_counters (tenant_id, last_version)
  VALUES (NEW.tenant_id, next_ver)
  ON CONFLICT (tenant_id) DO UPDATE SET last_version = next_ver;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_force_version
BEFORE INSERT ON model_versions
FOR EACH ROW EXECUTE FUNCTION force_monotonic_version();
```

### 2.4. Row-Level Security (RLS)
```sql
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON model_versions
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Force RLS on all queries
ALTER TABLE model_versions FORCE ROW LEVEL SECURITY;
```

### 2.5. Artifact Physical Verification (Procedure)
```sql
-- D7: Periodic Integrity Check Procedure
-- Runs nightly via pg_cron or K8s Job
CREATE OR REPLACE PROCEDURE verify_artifact_existence(tid TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
  exists_on_storage BOOLEAN;
BEGIN
  FOR rec IN SELECT id, artifact_uri, artifact_hash FROM model_versions WHERE tenant_id = tid LOOP
    -- Call external function or notify worker to verify S3 object
    -- INSERT INTO integrity_checks (check_type, status) ... 
  END LOOP;
END;
$$;
```

---

## 3. Связанные документы
- [RETRAINING_PIPELINE_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/RETRAINING_PIPELINE_ARCHITECTURE.md)
- [LEVEL_D_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/LEVEL_D_INVARIANTS.md)
