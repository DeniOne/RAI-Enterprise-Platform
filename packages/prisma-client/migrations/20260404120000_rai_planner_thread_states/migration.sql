-- Состояние планировщика веток RAI chat по (companyId, threadId) для переживания рестарта API.

CREATE TABLE IF NOT EXISTS "rai_planner_thread_states" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "sliceJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_planner_thread_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rai_planner_thread_state_company_thread_unique" ON "rai_planner_thread_states"("companyId", "threadId");

CREATE INDEX IF NOT EXISTS "rai_planner_thread_states_companyId_idx" ON "rai_planner_thread_states"("companyId");
