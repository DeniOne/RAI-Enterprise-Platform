CREATE TABLE "agent_capability_bindings" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_capability_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_tool_bindings" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tool_bindings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_capability_binding_role_capability_company_unique"
ON "agent_capability_bindings"("role", "capability", "companyId");

CREATE INDEX "agent_capability_bindings_companyId_role_idx"
ON "agent_capability_bindings"("companyId", "role");

CREATE UNIQUE INDEX "agent_tool_binding_role_tool_company_unique"
ON "agent_tool_bindings"("role", "toolName", "companyId");

CREATE INDEX "agent_tool_bindings_companyId_role_idx"
ON "agent_tool_bindings"("companyId", "role");

ALTER TABLE "agent_capability_bindings"
ADD CONSTRAINT "agent_capability_bindings_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_tool_bindings"
ADD CONSTRAINT "agent_tool_bindings_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
