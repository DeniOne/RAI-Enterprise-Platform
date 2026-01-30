-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "goals" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_on_ones" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "action_items" JSONB,
    "mood" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "one_on_ones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaizen" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "manager_comment" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kaizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economy_reward_eligibility" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_ref_id" TEXT NOT NULL,
    "mc_amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "audit_flag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economy_reward_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participation_statuses" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "governance_flags" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participation_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "user_participation_statuses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status_code" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "user_participation_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participation_status_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT NOT NULL,

    CONSTRAINT "participation_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participation_ranks" (
    "code" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participation_ranks_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "user_participation_ranks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rank_code" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_participation_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentorships_mentee_id_key" ON "mentorships"("mentee_id");

-- CreateIndex
CREATE INDEX "economy_reward_eligibility_status_idx" ON "economy_reward_eligibility"("status");

-- CreateIndex
CREATE INDEX "economy_reward_eligibility_created_at_idx" ON "economy_reward_eligibility"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "economy_reward_eligibility_user_id_event_type_event_ref_id_key" ON "economy_reward_eligibility"("user_id", "event_type", "event_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_participation_statuses_user_id_key" ON "user_participation_statuses"("user_id");

-- CreateIndex
CREATE INDEX "user_participation_statuses_status_code_idx" ON "user_participation_statuses"("status_code");

-- CreateIndex
CREATE INDEX "user_participation_statuses_assigned_at_idx" ON "user_participation_statuses"("assigned_at");

-- CreateIndex
CREATE INDEX "participation_status_history_user_id_idx" ON "participation_status_history"("user_id");

-- CreateIndex
CREATE INDEX "participation_status_history_changed_at_idx" ON "participation_status_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_participation_ranks_user_id_key" ON "user_participation_ranks"("user_id");

-- CreateIndex
CREATE INDEX "user_participation_ranks_rank_code_idx" ON "user_participation_ranks"("rank_code");

-- CreateIndex
CREATE INDEX "user_participation_ranks_calculated_at_idx" ON "user_participation_ranks"("calculated_at");

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_on_ones" ADD CONSTRAINT "one_on_ones_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_on_ones" ADD CONSTRAINT "one_on_ones_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizen" ADD CONSTRAINT "kaizen_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economy_reward_eligibility" ADD CONSTRAINT "economy_reward_eligibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_participation_statuses" ADD CONSTRAINT "user_participation_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_participation_statuses" ADD CONSTRAINT "user_participation_statuses_status_code_fkey" FOREIGN KEY ("status_code") REFERENCES "participation_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_status_history" ADD CONSTRAINT "participation_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_participation_ranks" ADD CONSTRAINT "user_participation_ranks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_participation_ranks" ADD CONSTRAINT "user_participation_ranks_rank_code_fkey" FOREIGN KEY ("rank_code") REFERENCES "participation_ranks"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
