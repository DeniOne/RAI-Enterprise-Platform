ALTER TABLE "rai_front_office_threads"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

ALTER TABLE "rai_front_office_thread_messages"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

ALTER TABLE "rai_front_office_handoffs"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

ALTER TABLE "rai_front_office_thread_participant_states"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

CREATE INDEX IF NOT EXISTS "rai_front_office_threads_tenantId_updatedAt_idx"
  ON "rai_front_office_threads" ("tenantId", "updatedAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_threads_tenantId_currentHandoffStatus_idx"
  ON "rai_front_office_threads" ("tenantId", "currentHandoffStatus");

CREATE INDEX IF NOT EXISTS "rai_front_office_threads_tenantId_farmAccountId_updatedAt_idx"
  ON "rai_front_office_threads" ("tenantId", "farmAccountId", "updatedAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_threads_tenantId_threadKey_idx"
  ON "rai_front_office_threads" ("tenantId", "threadKey");

CREATE INDEX IF NOT EXISTS "rai_front_office_thread_messages_tenantId_threadId_createdAt_idx"
  ON "rai_front_office_thread_messages" ("tenantId", "threadId", "createdAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_thread_messages_tenantId_draftId_idx"
  ON "rai_front_office_thread_messages" ("tenantId", "draftId");

CREATE INDEX IF NOT EXISTS "rai_front_office_handoffs_tenantId_status_createdAt_idx"
  ON "rai_front_office_handoffs" ("tenantId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_handoffs_tenantId_targetOwnerRole_status_idx"
  ON "rai_front_office_handoffs" ("tenantId", "targetOwnerRole", "status");

CREATE INDEX IF NOT EXISTS "rai_front_office_handoffs_tenantId_draftId_idx"
  ON "rai_front_office_handoffs" ("tenantId", "draftId");

CREATE INDEX IF NOT EXISTS "rai_front_office_thread_participant_states_tenantId_userId_updatedAt_idx"
  ON "rai_front_office_thread_participant_states" ("tenantId", "userId", "updatedAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_thread_participant_states_tenantId_threadId_idx"
  ON "rai_front_office_thread_participant_states" ("tenantId", "threadId");

CREATE UNIQUE INDEX IF NOT EXISTS "front_office_participant_state_tenant_unique"
  ON "rai_front_office_thread_participant_states" ("tenantId", "threadId", "userId");

WITH resolved_tenants AS (
  SELECT
    c.id AS company_id,
    COALESCE(primary_binding."tenantId", active_binding."tenantId", ts."tenantId") AS tenant_id
  FROM "companies" c
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
      AND tcb."isPrimary" = true
    ORDER BY tcb."boundAt" DESC
    LIMIT 1
  ) primary_binding ON true
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
    ORDER BY tcb."isPrimary" DESC, tcb."boundAt" DESC
    LIMIT 1
  ) active_binding ON true
  LEFT JOIN "tenant_states" ts ON ts."companyId" = c.id
)
UPDATE "rai_front_office_threads" fot
SET "tenantId" = rt.tenant_id
FROM resolved_tenants rt
WHERE fot."companyId" = rt.company_id
  AND fot."tenantId" IS NULL
  AND rt.tenant_id IS NOT NULL;

WITH resolved_tenants AS (
  SELECT
    c.id AS company_id,
    COALESCE(primary_binding."tenantId", active_binding."tenantId", ts."tenantId") AS tenant_id
  FROM "companies" c
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
      AND tcb."isPrimary" = true
    ORDER BY tcb."boundAt" DESC
    LIMIT 1
  ) primary_binding ON true
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
    ORDER BY tcb."isPrimary" DESC, tcb."boundAt" DESC
    LIMIT 1
  ) active_binding ON true
  LEFT JOIN "tenant_states" ts ON ts."companyId" = c.id
)
UPDATE "rai_front_office_thread_messages" fotm
SET "tenantId" = COALESCE(fot."tenantId", rt.tenant_id)
FROM "rai_front_office_threads" fot
LEFT JOIN resolved_tenants rt ON rt.company_id = fot."companyId"
WHERE fotm."threadId" = fot.id
  AND fotm."tenantId" IS NULL
  AND COALESCE(fot."tenantId", rt.tenant_id) IS NOT NULL;

WITH resolved_tenants AS (
  SELECT
    c.id AS company_id,
    COALESCE(primary_binding."tenantId", active_binding."tenantId", ts."tenantId") AS tenant_id
  FROM "companies" c
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
      AND tcb."isPrimary" = true
    ORDER BY tcb."boundAt" DESC
    LIMIT 1
  ) primary_binding ON true
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
    ORDER BY tcb."isPrimary" DESC, tcb."boundAt" DESC
    LIMIT 1
  ) active_binding ON true
  LEFT JOIN "tenant_states" ts ON ts."companyId" = c.id
)
UPDATE "rai_front_office_handoffs" foh
SET "tenantId" = COALESCE(fot."tenantId", rt.tenant_id)
FROM "rai_front_office_threads" fot
LEFT JOIN resolved_tenants rt ON rt.company_id = fot."companyId"
WHERE foh."threadId" = fot.id
  AND foh."tenantId" IS NULL
  AND COALESCE(fot."tenantId", rt.tenant_id) IS NOT NULL;

WITH resolved_tenants AS (
  SELECT
    c.id AS company_id,
    COALESCE(primary_binding."tenantId", active_binding."tenantId", ts."tenantId") AS tenant_id
  FROM "companies" c
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
      AND tcb."isPrimary" = true
    ORDER BY tcb."boundAt" DESC
    LIMIT 1
  ) primary_binding ON true
  LEFT JOIN LATERAL (
    SELECT tcb."tenantId"
    FROM "tenant_company_bindings" tcb
    WHERE tcb."companyId" = c.id
      AND tcb."isActive" = true
    ORDER BY tcb."isPrimary" DESC, tcb."boundAt" DESC
    LIMIT 1
  ) active_binding ON true
  LEFT JOIN "tenant_states" ts ON ts."companyId" = c.id
)
UPDATE "rai_front_office_thread_participant_states" fopts
SET "tenantId" = COALESCE(fot."tenantId", rt.tenant_id)
FROM "rai_front_office_threads" fot
LEFT JOIN resolved_tenants rt ON rt.company_id = fot."companyId"
WHERE fopts."threadId" = fot.id
  AND fopts."tenantId" IS NULL
  AND COALESCE(fot."tenantId", rt.tenant_id) IS NOT NULL;
