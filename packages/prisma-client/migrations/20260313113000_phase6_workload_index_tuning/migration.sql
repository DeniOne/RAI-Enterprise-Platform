-- Phase 6: workload-driven index tuning for confirmed hot paths.

CREATE INDEX "harvest_plans_companyId_seasonId_idx"
  ON "harvest_plans"("companyId", "seasonId");

CREATE INDEX "harvest_plans_companyId_status_createdAt_idx"
  ON "harvest_plans"("companyId", "status", "createdAt");

CREATE INDEX "tasks_companyId_seasonId_idx"
  ON "tasks"("companyId", "seasonId");

CREATE INDEX "tasks_companyId_status_createdAt_idx"
  ON "tasks"("companyId", "status", "createdAt");

CREATE INDEX "cmr_deviation_reviews_companyId_status_createdAt_idx"
  ON "cmr_deviation_reviews"("companyId", "status", "createdAt");

CREATE INDEX "cmr_risks_companyId_status_createdAt_idx"
  ON "cmr_risks"("companyId", "status", "createdAt");

CREATE INDEX "cmr_risks_companyId_type_createdAt_idx"
  ON "cmr_risks"("companyId", "type", "createdAt");

CREATE INDEX "economic_events_companyId_type_createdAt_idx"
  ON "economic_events"("companyId", "type", "createdAt");

CREATE INDEX "economic_events_companyId_seasonId_createdAt_idx"
  ON "economic_events"("companyId", "seasonId", "createdAt");

CREATE INDEX "ledger_entries_companyId_createdAt_idx"
  ON "ledger_entries"("companyId", "createdAt");

CREATE INDEX "commerce_parties_companyId_status_createdAt_idx"
  ON "commerce_parties"("companyId", "status", "createdAt");
