ALTER TABLE "agent_configurations"
ADD COLUMN "autonomyMode" TEXT NOT NULL DEFAULT 'advisory',
ADD COLUMN "runtimeProfile" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "memoryPolicy" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "outputContract" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "governancePolicy" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "agent_connector_bindings" (
  "id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "connectorName" TEXT NOT NULL,
  "accessMode" TEXT NOT NULL DEFAULT 'read',
  "scopes" JSONB NOT NULL DEFAULT '[]',
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "companyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agent_connector_bindings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_connector_binding_role_connector_company_unique"
ON "agent_connector_bindings"("role", "connectorName", "companyId");

CREATE INDEX "agent_connector_bindings_companyId_role_idx"
ON "agent_connector_bindings"("companyId", "role");

ALTER TABLE "agent_connector_bindings"
ADD CONSTRAINT "agent_connector_bindings_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
