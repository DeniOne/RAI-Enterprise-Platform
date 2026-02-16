-- Event Integrity: retry policy + DLQ metadata for outbox relay

CREATE TABLE IF NOT EXISTS outbox_messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  "aggregateId" TEXT,
  "aggregateType" TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  error TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE outbox_messages
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deadLetterAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS ix_outbox_status_next_retry_created
  ON outbox_messages (status, "nextRetryAt", "createdAt");
