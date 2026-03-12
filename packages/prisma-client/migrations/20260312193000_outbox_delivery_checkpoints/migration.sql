-- Outbox productionization.
-- Scope:
--   1) Persist per-destination delivery checkpoints for broker/local delivery.
--   2) Allow safe retry after partial delivery without redoing successful legs.

ALTER TABLE "outbox_messages"
  ADD COLUMN IF NOT EXISTS "localDeliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "brokerDeliveredAt" TIMESTAMP(3);
