-- 20260312190000_front_office_first_class_drafts
-- Выделение first-class front-office draft/commit storage из generic agro_event_* таблиц.

CREATE TABLE IF NOT EXISTS "rai_front_office_drafts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "threadKey" TEXT,
    "farmRef" TEXT,
    "fieldRef" TEXT,
    "seasonRef" TEXT,
    "taskRef" TEXT,
    "payloadJson" JSONB NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "missingMust" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_front_office_drafts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rai_front_office_drafts_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "rai_front_office_committed" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadKey" TEXT,
    "farmRef" TEXT,
    "fieldRef" TEXT,
    "seasonRef" TEXT,
    "taskRef" TEXT,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "committedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedBy" TEXT NOT NULL,
    "provenanceHash" TEXT NOT NULL,

    CONSTRAINT "rai_front_office_committed_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rai_front_office_committed_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "rai_front_office_drafts_companyId_userId_idx"
ON "rai_front_office_drafts"("companyId", "userId");

CREATE INDEX IF NOT EXISTS "rai_front_office_drafts_companyId_status_createdAt_idx"
ON "rai_front_office_drafts"("companyId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_drafts_companyId_threadKey_idx"
ON "rai_front_office_drafts"("companyId", "threadKey");

CREATE INDEX IF NOT EXISTS "rai_front_office_drafts_expiresAt_idx"
ON "rai_front_office_drafts"("expiresAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_committed_companyId_eventType_idx"
ON "rai_front_office_committed"("companyId", "eventType");

CREATE INDEX IF NOT EXISTS "rai_front_office_committed_companyId_committedAt_idx"
ON "rai_front_office_committed"("companyId", "committedAt");

CREATE INDEX IF NOT EXISTS "rai_front_office_committed_companyId_threadKey_idx"
ON "rai_front_office_committed"("companyId", "threadKey");

INSERT INTO "rai_front_office_drafts" (
    "id",
    "companyId",
    "userId",
    "status",
    "eventType",
    "timestamp",
    "threadKey",
    "farmRef",
    "fieldRef",
    "seasonRef",
    "taskRef",
    "payloadJson",
    "evidenceJson",
    "confidence",
    "missingMust",
    "createdAt",
    "updatedAt",
    "expiresAt"
)
SELECT
    draft."id",
    draft."companyId",
    draft."userId",
    draft."status",
    draft."eventType",
    draft."timestamp",
    draft."payloadJson"->>'threadKey',
    draft."farmRef",
    draft."fieldRef",
    draft."payloadJson"->>'seasonId',
    draft."taskRef",
    draft."payloadJson",
    draft."evidenceJson",
    draft."confidence",
    draft."missingMust",
    draft."createdAt",
    draft."updatedAt",
    draft."expiresAt"
FROM "agro_event_drafts" draft
WHERE draft."payloadJson" ? 'threadKey'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "rai_front_office_committed" (
    "id",
    "companyId",
    "threadKey",
    "farmRef",
    "fieldRef",
    "seasonRef",
    "taskRef",
    "eventType",
    "payloadJson",
    "evidenceJson",
    "timestamp",
    "committedAt",
    "committedBy",
    "provenanceHash"
)
SELECT
    committed."id",
    committed."companyId",
    committed."payloadJson"->>'threadKey',
    committed."farmRef",
    committed."fieldRef",
    committed."payloadJson"->>'seasonId',
    committed."taskRef",
    committed."eventType",
    committed."payloadJson",
    committed."evidenceJson",
    committed."timestamp",
    committed."committedAt",
    committed."committedBy",
    committed."provenanceHash"
FROM "agro_events_committed" committed
WHERE committed."payloadJson" ? 'threadKey'
ON CONFLICT ("id") DO NOTHING;
