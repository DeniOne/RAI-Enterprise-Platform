-- Task FSM DB-level enforcement (PoC)
-- Goal: block illegal status transitions in table "tasks" at DB layer.

-- 1) Transition policy table
CREATE TABLE IF NOT EXISTS fsm_allowed_transitions (
  entity_type TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_fsm_allowed_transitions PRIMARY KEY (entity_type, from_state, to_state)
);

CREATE INDEX IF NOT EXISTS idx_fsm_allowed_transitions_entity_enabled
  ON fsm_allowed_transitions (entity_type, is_enabled);

-- 2) Seed Task transitions (must match TaskStateMachine in code)
INSERT INTO fsm_allowed_transitions (entity_type, from_state, to_state, is_enabled)
VALUES
  ('Task', 'PENDING', 'PENDING', TRUE),        -- ASSIGN
  ('Task', 'PENDING', 'IN_PROGRESS', TRUE),    -- START
  ('Task', 'PENDING', 'CANCELLED', TRUE),      -- CANCEL
  ('Task', 'IN_PROGRESS', 'IN_PROGRESS', TRUE),-- ASSIGN
  ('Task', 'IN_PROGRESS', 'COMPLETED', TRUE),  -- COMPLETE
  ('Task', 'IN_PROGRESS', 'CANCELLED', TRUE),  -- CANCEL
  ('Task', 'CANCELLED', 'PENDING', TRUE)       -- REOPEN
ON CONFLICT (entity_type, from_state, to_state) DO UPDATE
SET is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW();

-- 3) Trigger function for Task transition validation
CREATE OR REPLACE FUNCTION validate_task_fsm_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- only validate when status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT EXISTS (
      SELECT 1
      FROM fsm_allowed_transitions t
      WHERE t.entity_type = 'Task'
        AND t.from_state = OLD.status::text
        AND t.to_state = NEW.status::text
        AND t.is_enabled = TRUE
    ) THEN
      RAISE EXCEPTION 'FSM violation for Task %: % -> % is not allowed',
        NEW.id, OLD.status::text, NEW.status::text
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Attach trigger to tasks table
DROP TRIGGER IF EXISTS trg_validate_task_fsm_transition ON tasks;
CREATE TRIGGER trg_validate_task_fsm_transition
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION validate_task_fsm_transition();

