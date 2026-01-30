-- CreateTable
CREATE TABLE "registry_relationships" (
    "id" TEXT NOT NULL,
    "definition_urn" TEXT NOT NULL,
    "from_urn" TEXT NOT NULL,
    "to_urn" TEXT NOT NULL,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registry_relationships_definition_urn_idx" ON "registry_relationships"("definition_urn");

-- CreateIndex
CREATE INDEX "registry_relationships_from_urn_idx" ON "registry_relationships"("from_urn");

-- CreateIndex
CREATE INDEX "registry_relationships_to_urn_idx" ON "registry_relationships"("to_urn");
