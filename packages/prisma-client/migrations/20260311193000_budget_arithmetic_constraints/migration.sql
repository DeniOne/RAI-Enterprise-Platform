-- Budget arithmetic invariants.
-- Goal: prevent silent drift between limit / consumed / remaining even if a
-- write bypasses application services.

ALTER TABLE "budgets"
  DROP CONSTRAINT IF EXISTS "budgets_limit_non_negative",
  DROP CONSTRAINT IF EXISTS "budgets_consumed_non_negative",
  DROP CONSTRAINT IF EXISTS "budgets_remaining_non_negative",
  DROP CONSTRAINT IF EXISTS "budgets_remaining_consistency";

ALTER TABLE "budgets"
  ADD CONSTRAINT "budgets_limit_non_negative"
    CHECK ("limit" >= 0),
  ADD CONSTRAINT "budgets_consumed_non_negative"
    CHECK ("consumed" >= 0),
  ADD CONSTRAINT "budgets_remaining_non_negative"
    CHECK ("remaining" >= 0),
  ADD CONSTRAINT "budgets_remaining_consistency"
    CHECK ("remaining" = "limit" - "consumed");

DO $$
BEGIN
  IF to_regclass('public.budget_plans') IS NOT NULL THEN
    EXECUTE '
      ALTER TABLE "budget_plans"
        DROP CONSTRAINT IF EXISTS "budget_plans_total_planned_non_negative",
        DROP CONSTRAINT IF EXISTS "budget_plans_total_actual_non_negative"
    ';

    EXECUTE '
      ALTER TABLE "budget_plans"
        ADD CONSTRAINT "budget_plans_total_planned_non_negative"
          CHECK ("totalPlannedAmount" >= 0),
        ADD CONSTRAINT "budget_plans_total_actual_non_negative"
          CHECK ("totalActualAmount" >= 0)
    ';
  END IF;
END;
$$;
