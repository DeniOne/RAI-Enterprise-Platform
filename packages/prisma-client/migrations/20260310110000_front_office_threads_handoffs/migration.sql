-- CreateTable
CREATE TABLE "rai_front_office_threads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "threadExternalId" TEXT,
    "dialogExternalId" TEXT,
    "senderExternalId" TEXT,
    "recipientExternalId" TEXT,
    "route" TEXT,
    "currentClassification" TEXT,
    "currentOwnerRole" TEXT,
    "currentHandoffStatus" TEXT,
    "lastDraftId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_front_office_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_front_office_thread_messages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "draftId" TEXT,
    "auditLogId" TEXT,
    "traceId" TEXT,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "chatId" TEXT,
    "route" TEXT,
    "evidenceJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_front_office_thread_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_front_office_handoffs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "draftId" TEXT,
    "traceId" TEXT,
    "targetOwnerRole" TEXT,
    "sourceIntent" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ownerRoute" TEXT,
    "nextAction" TEXT,
    "ownerResultRef" TEXT,
    "rejectionReason" TEXT,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "operatorNotesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_front_office_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rai_front_office_threads_companyId_threadKey_key"
ON "rai_front_office_threads"("companyId", "threadKey");

-- CreateIndex
CREATE INDEX "rai_front_office_threads_companyId_updatedAt_idx"
ON "rai_front_office_threads"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "rai_front_office_threads_companyId_currentHandoffStatus_idx"
ON "rai_front_office_threads"("companyId", "currentHandoffStatus");

-- CreateIndex
CREATE INDEX "rai_front_office_thread_messages_companyId_threadId_createdAt_idx"
ON "rai_front_office_thread_messages"("companyId", "threadId", "createdAt");

-- CreateIndex
CREATE INDEX "rai_front_office_thread_messages_companyId_draftId_idx"
ON "rai_front_office_thread_messages"("companyId", "draftId");

-- CreateIndex
CREATE INDEX "rai_front_office_handoffs_companyId_status_createdAt_idx"
ON "rai_front_office_handoffs"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "rai_front_office_handoffs_companyId_targetOwnerRole_status_idx"
ON "rai_front_office_handoffs"("companyId", "targetOwnerRole", "status");

-- CreateIndex
CREATE INDEX "rai_front_office_handoffs_companyId_draftId_idx"
ON "rai_front_office_handoffs"("companyId", "draftId");

-- AddForeignKey
ALTER TABLE "rai_front_office_threads"
ADD CONSTRAINT "rai_front_office_threads_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_front_office_thread_messages"
ADD CONSTRAINT "rai_front_office_thread_messages_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_front_office_thread_messages"
ADD CONSTRAINT "rai_front_office_thread_messages_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "rai_front_office_threads"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_front_office_handoffs"
ADD CONSTRAINT "rai_front_office_handoffs_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_front_office_handoffs"
ADD CONSTRAINT "rai_front_office_handoffs_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "rai_front_office_threads"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
