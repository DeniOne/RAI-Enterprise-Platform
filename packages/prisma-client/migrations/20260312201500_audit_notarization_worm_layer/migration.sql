-- Audit log notarization + external WORM proof layer.
-- Scope:
--   1) Add separate notarization/proof table for append-only audit proof metadata.
--   2) Enforce append-only semantics for proof records.

CREATE TABLE "audit_notarization_records" (
  "id" TEXT NOT NULL,
  "auditLogId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "entryHash" TEXT NOT NULL,
  "prevChainHash" TEXT,
  "chainHash" TEXT NOT NULL,
  "wormProvider" TEXT NOT NULL,
  "wormObjectKey" TEXT NOT NULL,
  "wormUri" TEXT NOT NULL,
  "wormContentHash" TEXT NOT NULL,
  "retentionMode" TEXT NOT NULL DEFAULT 'COMPLIANCE',
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "hsmKid" TEXT NOT NULL,
  "hsmSignature" TEXT NOT NULL,
  "anchorProvider" TEXT NOT NULL,
  "anchorReceiptId" TEXT NOT NULL,
  "anchoredAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_notarization_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "audit_notarization_records_auditLogId_key"
  ON "audit_notarization_records"("auditLogId");
CREATE UNIQUE INDEX "audit_notarization_records_chainHash_key"
  ON "audit_notarization_records"("chainHash");
CREATE INDEX "audit_notarization_records_companyId_idx"
  ON "audit_notarization_records"("companyId");
CREATE INDEX "audit_notarization_records_createdAt_idx"
  ON "audit_notarization_records"("createdAt");
CREATE INDEX "audit_notarization_records_anchoredAt_idx"
  ON "audit_notarization_records"("anchoredAt");

ALTER TABLE "audit_notarization_records"
  ADD CONSTRAINT "audit_notarization_records_auditLogId_fkey"
  FOREIGN KEY ("auditLogId") REFERENCES "audit_logs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_notarization_records"
  ADD CONSTRAINT "audit_notarization_records_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION enforce_audit_notarization_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    '[I-AUDIT-002] audit_notarization_records is append-only. UPDATE/DELETE forbidden for id=%',
    OLD."id"
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_notarization_append_only ON "audit_notarization_records";
CREATE TRIGGER trg_audit_notarization_append_only
BEFORE UPDATE OR DELETE ON "audit_notarization_records"
FOR EACH ROW
EXECUTE FUNCTION enforce_audit_notarization_append_only();
