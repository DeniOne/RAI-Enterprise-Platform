-- 20260324090000_tech_map_persistence_snapshots
-- Immutable persistence boundaries for TechMap review / approval / publication.

CREATE TABLE IF NOT EXISTS "tech_map_review_snapshots" (
    "id" TEXT NOT NULL,
    "techMapId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "workflowId" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "publicationState" TEXT NOT NULL,
    "persistenceBoundary" JSONB NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "isImmutable" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdBy" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_map_review_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tech_map_review_snapshots_techMapId_version_key" UNIQUE ("techMapId", "version"),
    CONSTRAINT "tech_map_review_snapshots_techMapId_fkey"
        FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tech_map_review_snapshots_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "tech_map_approval_snapshots" (
    "id" TEXT NOT NULL,
    "techMapId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "workflowId" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "publicationState" TEXT NOT NULL,
    "persistenceBoundary" JSONB NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "isImmutable" BOOLEAN NOT NULL DEFAULT TRUE,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_map_approval_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tech_map_approval_snapshots_techMapId_version_key" UNIQUE ("techMapId", "version"),
    CONSTRAINT "tech_map_approval_snapshots_techMapId_fkey"
        FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tech_map_approval_snapshots_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "tech_map_publication_locks" (
    "id" TEXT NOT NULL,
    "techMapId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "workflowId" TEXT NOT NULL,
    "publicationState" TEXT NOT NULL,
    "supersedesTechMapId" TEXT,
    "supersedesVersion" INTEGER,
    "lockReason" TEXT,
    "persistenceBoundary" JSONB NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT TRUE,
    "lockedBy" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_map_publication_locks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tech_map_publication_locks_techMapId_version_key" UNIQUE ("techMapId", "version"),
    CONSTRAINT "tech_map_publication_locks_techMapId_fkey"
        FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tech_map_publication_locks_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tech_map_review_snapshots_techMapId_createdAt_idx"
ON "tech_map_review_snapshots"("techMapId", "createdAt");

CREATE INDEX IF NOT EXISTS "tech_map_review_snapshots_companyId_createdAt_idx"
ON "tech_map_review_snapshots"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS "tech_map_approval_snapshots_techMapId_createdAt_idx"
ON "tech_map_approval_snapshots"("techMapId", "createdAt");

CREATE INDEX IF NOT EXISTS "tech_map_approval_snapshots_companyId_createdAt_idx"
ON "tech_map_approval_snapshots"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS "tech_map_publication_locks_techMapId_createdAt_idx"
ON "tech_map_publication_locks"("techMapId", "createdAt");

CREATE INDEX IF NOT EXISTS "tech_map_publication_locks_companyId_createdAt_idx"
ON "tech_map_publication_locks"("companyId", "createdAt");
