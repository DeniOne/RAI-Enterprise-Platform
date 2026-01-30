-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('VIDEO', 'TEXT', 'PDF', 'QUIZ', 'SIMULATION');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CourseGrade" AS ENUM ('INTERN', 'SPECIALIST', 'PROFESSIONAL', 'EXPERT', 'MASTER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TrainerSpecialty" AS ENUM ('PHOTOGRAPHER', 'SALES', 'DESIGNER');

-- CreateEnum
CREATE TYPE "TrainerStatus" AS ENUM ('CANDIDATE', 'TRAINER', 'ACCREDITED', 'SENIOR', 'METHODOLOGIST');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "annual_goals" TEXT,
ADD COLUMN     "budget_annual" DECIMAL(15,2),
ADD COLUMN     "department_type" TEXT,
ADD COLUMN     "faculty_link" TEXT,
ADD COLUMN     "functions" TEXT[],
ADD COLUMN     "hierarchy_level" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kpis" JSONB,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "path" TEXT;

-- CreateTable
CREATE TABLE "role_competency_matrix" (
    "id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "department_id" TEXT,
    "required_competencies" JSONB NOT NULL,
    "responsibilities" TEXT[],
    "permissions" JSONB,
    "salary_min" DECIMAL(15,2),
    "salary_max" DECIMAL(15,2),
    "purpose" TEXT,
    "expected_results" TEXT[],
    "required_knowledge" TEXT[],
    "required_skills" TEXT[],
    "interactions" JSONB,
    "corporate_university_courses" TEXT[],
    "golden_standard_processes" TEXT[],
    "efficiency_metrics" JSONB,
    "lean_principles" TEXT[],
    "documents" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_competency_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_roles" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role_matrix_id" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "assigned_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_structure_history" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_structure_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_relationships" (
    "id" TEXT NOT NULL,
    "subordinate_id" TEXT NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL DEFAULT 'direct',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_hierarchy_levels" (
    "id" TEXT NOT NULL,
    "level_number" INTEGER NOT NULL,
    "level_name" TEXT NOT NULL,
    "level_name_ru" TEXT NOT NULL,
    "description" TEXT,
    "can_have_children" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_hierarchy_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pyramid_roles" (
    "id" TEXT NOT NULL,
    "role_type" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "kpi_metrics" JSONB,
    "interdependencies" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pyramid_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triangle_assignments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "triangle_role" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "flow_metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triangle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raci_matrix" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "employee_id" TEXT,
    "role_id" TEXT,
    "raci_role" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raci_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_channels" (
    "id" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "submitted_by" TEXT,
    "target_level" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "priority" TEXT,
    "implementation_plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idea_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hybrid_team_interactions" (
    "id" TEXT NOT NULL,
    "human_employee_id" TEXT,
    "ai_agent_name" TEXT NOT NULL,
    "interaction_type" TEXT,
    "privacy_consent" BOOLEAN NOT NULL DEFAULT false,
    "ai_mode_enabled" BOOLEAN NOT NULL DEFAULT true,
    "interaction_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hybrid_team_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "academy_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level_required" TEXT,
    "kpi_impact" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "title" TEXT NOT NULL,
    "content_url" TEXT,
    "content_text" TEXT,
    "duration_minutes" INTEGER,
    "tags" JSONB,
    "level" TEXT,
    "academy_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "MaterialStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "academy_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required_grade" "CourseGrade",
    "reward_mc" INTEGER NOT NULL DEFAULT 0,
    "reward_gmc" INTEGER NOT NULL DEFAULT 0,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "material_id" TEXT,
    "module_order" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_grades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_grade" "CourseGrade" NOT NULL DEFAULT 'INTERN',
    "motivation_coefficient" DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    "grade_history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "assigned_by" TEXT,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_progress" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT,
    "academy_id" TEXT,
    "level" "CourseGrade",
    "score" INTEGER,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "certificate_url" TEXT,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "courses_planned" JSONB,
    "skills_target" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "specialty" "TrainerSpecialty" NOT NULL,
    "status" "TrainerStatus" NOT NULL DEFAULT 'CANDIDATE',
    "accreditation_date" TIMESTAMP(3),
    "rating" DECIMAL(3,2),
    "trainees_total" INTEGER NOT NULL DEFAULT 0,
    "trainees_successful" INTEGER NOT NULL DEFAULT 0,
    "avg_nps" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_assignments" (
    "id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "trainee_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_results" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "kpi_improvement" INTEGER,
    "nps_score" INTEGER,
    "retention_days" INTEGER,
    "hot_leads_percentage" INTEGER,
    "quality_score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_competency_matrix_role_name_department_id_key" ON "role_competency_matrix"("role_name", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_hierarchy_levels_level_number_key" ON "org_hierarchy_levels"("level_number");

-- CreateIndex
CREATE UNIQUE INDEX "pyramid_roles_role_type_role_name_key" ON "pyramid_roles"("role_type", "role_name");

-- CreateIndex
CREATE UNIQUE INDEX "academies_name_key" ON "academies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_user_id_skill_id_key" ON "user_skills"("user_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_grades_user_id_key" ON "user_grades"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "enrollments"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_user_id_key" ON "learning_paths"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trainers_user_id_key" ON "trainers"("user_id");

-- AddForeignKey
ALTER TABLE "role_competency_matrix" ADD CONSTRAINT "role_competency_matrix_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_role_matrix_id_fkey" FOREIGN KEY ("role_matrix_id") REFERENCES "role_competency_matrix"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_structure_history" ADD CONSTRAINT "org_structure_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_relationships" ADD CONSTRAINT "reporting_relationships_subordinate_id_fkey" FOREIGN KEY ("subordinate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_relationships" ADD CONSTRAINT "reporting_relationships_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triangle_assignments" ADD CONSTRAINT "triangle_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raci_matrix" ADD CONSTRAINT "raci_matrix_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raci_matrix" ADD CONSTRAINT "raci_matrix_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role_competency_matrix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_channels" ADD CONSTRAINT "idea_channels_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hybrid_team_interactions" ADD CONSTRAINT "hybrid_team_interactions_human_employee_id_fkey" FOREIGN KEY ("human_employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_assignments" ADD CONSTRAINT "trainer_assignments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_results" ADD CONSTRAINT "training_results_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "trainer_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
