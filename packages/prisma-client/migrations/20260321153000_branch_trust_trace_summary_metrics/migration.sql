ALTER TABLE "ai_trace_summaries"
ADD COLUMN IF NOT EXISTS "verifiedBranchCount" INTEGER,
ADD COLUMN IF NOT EXISTS "partialBranchCount" INTEGER,
ADD COLUMN IF NOT EXISTS "unverifiedBranchCount" INTEGER,
ADD COLUMN IF NOT EXISTS "conflictedBranchCount" INTEGER,
ADD COLUMN IF NOT EXISTS "rejectedBranchCount" INTEGER,
ADD COLUMN IF NOT EXISTS "trustGateLatencyMs" INTEGER,
ADD COLUMN IF NOT EXISTS "trustLatencyProfile" TEXT,
ADD COLUMN IF NOT EXISTS "trustLatencyBudgetMs" INTEGER,
ADD COLUMN IF NOT EXISTS "trustLatencyWithinBudget" BOOLEAN;
