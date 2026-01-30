-- CreateTable
CREATE TABLE "anti_fraud_signals" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metric_snapshot" JSONB NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" JSONB NOT NULL,

    CONSTRAINT "anti_fraud_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anti_fraud_signals_entity_type_entity_id_idx" ON "anti_fraud_signals"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "anti_fraud_signals_level_type_idx" ON "anti_fraud_signals"("level", "type");

-- CreateIndex
CREATE INDEX "anti_fraud_signals_detected_at_idx" ON "anti_fraud_signals"("detected_at");
