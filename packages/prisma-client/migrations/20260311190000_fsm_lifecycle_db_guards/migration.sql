-- DB-level FSM enforcement for critical lifecycle entities.
-- Scope:
--   - tech_maps
--   - harvest_plans
--   - budget_plans
--   - budgets
--
-- IMPORTANT:
--   DB validates only the allowed status graph.
--   RBAC, governance prerequisites, integrity gates and human review remain
--   enforced in application services.

CREATE TABLE IF NOT EXISTS fsm_allowed_transitions (
  entity_type TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_fsm_allowed_transitions PRIMARY KEY (
    entity_type,
    from_state,
    to_state
  )
);

CREATE INDEX IF NOT EXISTS idx_fsm_allowed_transitions_entity_enabled
  ON fsm_allowed_transitions (entity_type, is_enabled);

INSERT INTO fsm_allowed_transitions (
  entity_type,
  from_state,
  to_state,
  is_enabled
)
VALUES
  -- TechMap: classic runtime FSM + generative/override graph
  ('TechMap', 'GENERATED_DRAFT', 'DRAFT', TRUE),
  ('TechMap', 'GENERATED_DRAFT', 'ARCHIVED', TRUE),
  ('TechMap', 'DRAFT', 'REVIEW', TRUE),
  ('TechMap', 'DRAFT', 'OVERRIDE_ANALYSIS', TRUE),
  ('TechMap', 'REVIEW', 'DRAFT', TRUE),
  ('TechMap', 'REVIEW', 'APPROVED', TRUE),
  ('TechMap', 'APPROVED', 'ACTIVE', TRUE),
  ('TechMap', 'APPROVED', 'DRAFT', TRUE),
  ('TechMap', 'ACTIVE', 'ARCHIVED', TRUE),
  ('TechMap', 'OVERRIDE_ANALYSIS', 'DRAFT', TRUE),
  ('TechMap', 'OVERRIDE_ANALYSIS', 'ARCHIVED', TRUE),

  -- HarvestPlan: consulting seasonal lifecycle
  ('HarvestPlan', 'DRAFT', 'REVIEW', TRUE),
  ('HarvestPlan', 'REVIEW', 'APPROVED', TRUE),
  ('HarvestPlan', 'APPROVED', 'ACTIVE', TRUE),
  ('HarvestPlan', 'ACTIVE', 'DONE', TRUE),
  ('HarvestPlan', 'DONE', 'ARCHIVE', TRUE),

  -- BudgetPlan: consulting budget lifecycle
  ('BudgetPlan', 'DRAFT', 'APPROVED', TRUE),
  ('BudgetPlan', 'APPROVED', 'LOCKED', TRUE),
  ('BudgetPlan', 'LOCKED', 'CLOSED', TRUE),

  -- Budget: finance runtime lifecycle
  ('Budget', 'DRAFT', 'APPROVED', TRUE),
  ('Budget', 'APPROVED', 'ACTIVE', TRUE),
  ('Budget', 'ACTIVE', 'EXHAUSTED', TRUE),
  ('Budget', 'ACTIVE', 'BLOCKED', TRUE),
  ('Budget', 'ACTIVE', 'CLOSED', TRUE),
  ('Budget', 'EXHAUSTED', 'ACTIVE', TRUE),
  ('Budget', 'EXHAUSTED', 'CLOSED', TRUE),
  ('Budget', 'BLOCKED', 'ACTIVE', TRUE),
  ('Budget', 'BLOCKED', 'CLOSED', TRUE)
ON CONFLICT (entity_type, from_state, to_state) DO UPDATE
SET is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();

CREATE OR REPLACE FUNCTION validate_fsm_transition_from_policy()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_type TEXT := TG_ARGV[0];
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT EXISTS (
      SELECT 1
      FROM fsm_allowed_transitions t
      WHERE t.entity_type = v_entity_type
        AND t.from_state = OLD.status::text
        AND t.to_state = NEW.status::text
        AND t.is_enabled = TRUE
    ) THEN
      RAISE EXCEPTION 'FSM violation for % %: % -> % is not allowed',
        v_entity_type, NEW.id, OLD.status::text, NEW.status::text
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.tech_maps') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_validate_tech_map_fsm_transition ON "tech_maps"';
    EXECUTE '
      CREATE TRIGGER trg_validate_tech_map_fsm_transition
      BEFORE UPDATE OF status ON "tech_maps"
      FOR EACH ROW
      EXECUTE FUNCTION validate_fsm_transition_from_policy(''TechMap'')
    ';
  END IF;

  IF to_regclass('public.harvest_plans') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_validate_harvest_plan_fsm_transition ON "harvest_plans"';
    EXECUTE '
      CREATE TRIGGER trg_validate_harvest_plan_fsm_transition
      BEFORE UPDATE OF status ON "harvest_plans"
      FOR EACH ROW
      EXECUTE FUNCTION validate_fsm_transition_from_policy(''HarvestPlan'')
    ';
  END IF;

  IF to_regclass('public.budget_plans') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_validate_budget_plan_fsm_transition ON "budget_plans"';
    EXECUTE '
      CREATE TRIGGER trg_validate_budget_plan_fsm_transition
      BEFORE UPDATE OF status ON "budget_plans"
      FOR EACH ROW
      EXECUTE FUNCTION validate_fsm_transition_from_policy(''BudgetPlan'')
    ';
  END IF;

  IF to_regclass('public.budgets') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_validate_budget_fsm_transition ON "budgets"';
    EXECUTE '
      CREATE TRIGGER trg_validate_budget_fsm_transition
      BEFORE UPDATE OF status ON "budgets"
      FOR EACH ROW
      EXECUTE FUNCTION validate_fsm_transition_from_policy(''Budget'')
    ';
  END IF;
END;
$$;
