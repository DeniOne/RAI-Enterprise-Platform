-- Phase 5 enum literal normalization: remove BudgetCategory.FERTILIZERS alias.

ALTER TYPE "BudgetCategory" RENAME TO "BudgetCategory_old";

CREATE TYPE "BudgetCategory" AS ENUM (
  'SEEDS',
  'FERTILIZER',
  'PESTICIDES',
  'FUEL',
  'LABOR',
  'MACHINERY',
  'RENT',
  'LOGISTICS',
  'ANALYSES',
  'OTHER'
);

ALTER TABLE "budget_lines"
  ALTER COLUMN "category" TYPE "BudgetCategory"
  USING (
    CASE
      WHEN "category"::text = 'FERTILIZERS' THEN 'FERTILIZER'
      ELSE "category"::text
    END
  )::"BudgetCategory";

ALTER TABLE "consulting_budget_items"
  ALTER COLUMN "category" TYPE "BudgetCategory"
  USING (
    CASE
      WHEN "category"::text = 'FERTILIZERS' THEN 'FERTILIZER'
      ELSE "category"::text
    END
  )::"BudgetCategory";

DROP TYPE "BudgetCategory_old";
