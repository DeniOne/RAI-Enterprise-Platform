-- CreateTable
CREATE TABLE "registry_org_projections" (
    "id" TEXT NOT NULL,
    "urn" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "parent_urn" TEXT,
    "root_urn" TEXT NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registry_org_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_owner_projections" (
    "id" TEXT NOT NULL,
    "owner_urn" TEXT NOT NULL,
    "asset_urn" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "relation_urn" TEXT NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registry_owner_projections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registry_org_projections_urn_key" ON "registry_org_projections"("urn");

-- CreateIndex
CREATE INDEX "registry_org_projections_path_idx" ON "registry_org_projections"("path");

-- CreateIndex
CREATE INDEX "registry_org_projections_parent_urn_idx" ON "registry_org_projections"("parent_urn");

-- CreateIndex
CREATE INDEX "registry_org_projections_root_urn_idx" ON "registry_org_projections"("root_urn");

-- CreateIndex
CREATE INDEX "registry_owner_projections_owner_urn_idx" ON "registry_owner_projections"("owner_urn");

-- CreateIndex
CREATE INDEX "registry_owner_projections_asset_type_idx" ON "registry_owner_projections"("asset_type");

-- CreateIndex
CREATE UNIQUE INDEX "registry_owner_projections_owner_urn_asset_urn_key" ON "registry_owner_projections"("owner_urn", "asset_urn");
