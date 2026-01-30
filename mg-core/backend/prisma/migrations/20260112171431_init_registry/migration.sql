-- CreateTable
CREATE TABLE "registry_entities" (
    "urn" TEXT NOT NULL,
    "entity_type_urn" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT,
    "description" TEXT,
    "attributes" JSONB NOT NULL,
    "fsm_state" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registry_entities_pkey" PRIMARY KEY ("urn")
);

-- CreateTable
CREATE TABLE "registry_audit_events" (
    "id" TEXT NOT NULL,
    "entity_urn" TEXT,
    "action" TEXT NOT NULL,
    "actor_urn" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registry_entities_entity_type_urn_idx" ON "registry_entities"("entity_type_urn");

-- CreateIndex
CREATE INDEX "registry_entities_fsm_state_idx" ON "registry_entities"("fsm_state");

-- CreateIndex
CREATE INDEX "registry_audit_events_entity_urn_idx" ON "registry_audit_events"("entity_urn");
