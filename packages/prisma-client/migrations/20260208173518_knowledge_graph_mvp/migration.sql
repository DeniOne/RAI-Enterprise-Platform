-- Knowledge Graph MVP (Sprint 2)

CREATE TYPE "KnowledgeNodeType" AS ENUM ('CONCEPT', 'ENTITY', 'METRIC', 'DOCUMENT');
CREATE TYPE "KnowledgeNodeSource" AS ENUM ('MANUAL', 'INGESTION', 'AI');
CREATE TYPE "KnowledgeEdgeRelation" AS ENUM ('IMPLEMENTS', 'DEPENDS_ON', 'MEASURED_BY', 'MEASURES', 'REFERENCES');
CREATE TYPE "KnowledgeEdgeSource" AS ENUM ('MANUAL', 'INGESTION', 'AI');

CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "type" "KnowledgeNodeType" NOT NULL,
    "label" TEXT NOT NULL,
    "source" "KnowledgeNodeSource" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_edges" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relation" "KnowledgeEdgeRelation" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" "KnowledgeEdgeSource" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_edges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_nodes_companyId_idx" ON "knowledge_nodes"("companyId");
CREATE INDEX "knowledge_nodes_type_idx" ON "knowledge_nodes"("type");
CREATE INDEX "knowledge_edges_companyId_idx" ON "knowledge_edges"("companyId");
CREATE INDEX "knowledge_edges_fromNodeId_idx" ON "knowledge_edges"("fromNodeId");
CREATE INDEX "knowledge_edges_toNodeId_idx" ON "knowledge_edges"("toNodeId");

ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
