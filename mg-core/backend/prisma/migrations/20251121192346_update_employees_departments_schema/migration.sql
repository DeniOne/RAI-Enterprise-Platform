/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employee_number]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `departments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "emotional_tone" INTEGER DEFAULT 0,
ADD COLUMN     "employee_number" TEXT,
ADD COLUMN     "gmc_balance" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "mc_balance" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "salary" DECIMAL(10,2),
ADD COLUMN     "termination_date" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");
