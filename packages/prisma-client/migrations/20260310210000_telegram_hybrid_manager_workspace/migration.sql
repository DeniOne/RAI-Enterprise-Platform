ALTER TABLE "rai_front_office_threads"
ADD COLUMN "farmAccountId" TEXT,
ADD COLUMN "farmNameSnapshot" TEXT,
ADD COLUMN "representativeUserId" TEXT,
ADD COLUMN "representativeTelegramId" TEXT,
ADD COLUMN "lastMessageDirection" TEXT;

CREATE INDEX "rai_front_office_threads_companyId_farmAccountId_updatedAt_idx"
ON "rai_front_office_threads"("companyId", "farmAccountId", "updatedAt");

ALTER TABLE "rai_front_office_threads"
ADD CONSTRAINT "rai_front_office_threads_farmAccountId_fkey"
FOREIGN KEY ("farmAccountId") REFERENCES "accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "rai_back_office_farm_assignments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_back_office_farm_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "back_office_farm_assignment_unique"
ON "rai_back_office_farm_assignments"("companyId", "userId", "farmAccountId");

CREATE INDEX "rai_back_office_farm_assignments_companyId_userId_status_idx"
ON "rai_back_office_farm_assignments"("companyId", "userId", "status");

CREATE INDEX "rai_back_office_farm_assignments_companyId_farmAccountId_status_idx"
ON "rai_back_office_farm_assignments"("companyId", "farmAccountId", "status");

ALTER TABLE "rai_back_office_farm_assignments"
ADD CONSTRAINT "rai_back_office_farm_assignments_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rai_back_office_farm_assignments"
ADD CONSTRAINT "rai_back_office_farm_assignments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rai_back_office_farm_assignments"
ADD CONSTRAINT "rai_back_office_farm_assignments_farmAccountId_fkey"
FOREIGN KEY ("farmAccountId") REFERENCES "accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "rai_front_office_thread_participant_states" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_front_office_thread_participant_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "front_office_participant_state_unique"
ON "rai_front_office_thread_participant_states"("companyId", "threadId", "userId");

CREATE INDEX "rai_front_office_thread_participant_states_companyId_userId_updatedAt_idx"
ON "rai_front_office_thread_participant_states"("companyId", "userId", "updatedAt");

CREATE INDEX "rai_front_office_thread_participant_states_companyId_threadId_idx"
ON "rai_front_office_thread_participant_states"("companyId", "threadId");

ALTER TABLE "rai_front_office_thread_participant_states"
ADD CONSTRAINT "rai_front_office_thread_participant_states_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rai_front_office_thread_participant_states"
ADD CONSTRAINT "rai_front_office_thread_participant_states_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "rai_front_office_threads"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rai_front_office_thread_participant_states"
ADD CONSTRAINT "rai_front_office_thread_participant_states_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "rai_back_office_farm_assignments" (
    "id",
    "companyId",
    "userId",
    "farmAccountId",
    "status",
    "priority",
    "createdAt",
    "updatedAt"
)
SELECT
    concat('bo_assign_', md5(ep."companyId" || ':' || ep."userId" || ':' || ep."clientId")),
    ep."companyId",
    ep."userId",
    ep."clientId",
    'ACTIVE',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "employee_profiles" ep
JOIN "users" u
    ON u."id" = ep."userId"
   AND u."companyId" = ep."companyId"
JOIN "accounts" a
    ON a."id" = ep."clientId"
   AND a."companyId" = ep."companyId"
WHERE ep."userId" IS NOT NULL
  AND ep."clientId" IS NOT NULL
ON CONFLICT ("companyId", "userId", "farmAccountId") DO NOTHING;
