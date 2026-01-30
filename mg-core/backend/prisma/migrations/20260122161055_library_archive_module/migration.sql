-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DESTROYED');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('REFERENCE', 'MANDATORY', 'EDUCATIONAL');

-- CreateTable
CREATE TABLE "library_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "logicalOwner" TEXT NOT NULL DEFAULT 'LIBRARY',
    "businessOwnerRole" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_links" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "linkedModule" TEXT NOT NULL,
    "linkedEntityId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_documents_currentVersionId_key" ON "library_documents"("currentVersionId");

-- CreateIndex
CREATE INDEX "library_documents_status_idx" ON "library_documents"("status");

-- CreateIndex
CREATE INDEX "library_documents_documentType_idx" ON "library_documents"("documentType");

-- CreateIndex
CREATE INDEX "library_document_versions_documentId_idx" ON "library_document_versions"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "library_document_versions_documentId_version_key" ON "library_document_versions"("documentId", "version");

-- CreateIndex
CREATE INDEX "library_links_documentId_idx" ON "library_links"("documentId");

-- CreateIndex
CREATE INDEX "library_links_linkedModule_linkedEntityId_idx" ON "library_links"("linkedModule", "linkedEntityId");

-- AddForeignKey
ALTER TABLE "library_documents" ADD CONSTRAINT "library_documents_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "library_document_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "library_document_versions" ADD CONSTRAINT "library_document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "library_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_links" ADD CONSTRAINT "library_links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "library_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
