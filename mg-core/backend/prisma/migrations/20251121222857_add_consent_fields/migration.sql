-- AlterTable
ALTER TABLE "users" ADD COLUMN     "consent_date" TIMESTAMP(3),
ADD COLUMN     "personal_data_consent" BOOLEAN NOT NULL DEFAULT false;
