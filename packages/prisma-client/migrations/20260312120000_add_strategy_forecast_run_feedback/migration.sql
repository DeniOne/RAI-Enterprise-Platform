ALTER TABLE "strategy_forecast_runs"
    ADD COLUMN "feedbackJson" JSONB,
    ADD COLUMN "evaluationJson" JSONB,
    ADD COLUMN "feedbackByUserId" TEXT,
    ADD COLUMN "feedbackAt" TIMESTAMP(3);
