-- Event Integrity: consumer idempotency store
-- Ensures each consumer processes each outbox event at most once.

CREATE TABLE IF NOT EXISTS event_consumptions (
  id TEXT PRIMARY KEY,
  consumer TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "aggregateId" TEXT,
  "companyId" TEXT,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_consumptions_consumer_event
ON event_consumptions (consumer, "eventId");

CREATE INDEX IF NOT EXISTS ix_event_consumptions_consumer_event_type_processed
ON event_consumptions (consumer, "eventType", "processedAt");

CREATE INDEX IF NOT EXISTS ix_event_consumptions_company_processed
ON event_consumptions ("companyId", "processedAt");

