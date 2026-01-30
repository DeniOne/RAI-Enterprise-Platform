-- Migration: 20250121000009_create_tasks_tables
-- Description: Create tasks, task_comments, and task_history tables
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Classification
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    
    -- Timing
    due_date TIMESTAMPTZ,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Rewards
    mc_reward INTEGER DEFAULT 100 CHECK (mc_reward >= 0),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT tasks_completion_check CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    ),
    CONSTRAINT tasks_hours_check CHECK (
        estimated_hours IS NULL OR estimated_hours > 0
    )
);

-- Indexes for tasks
CREATE INDEX idx_tasks_status ON tasks(status) WHERE status != 'completed';
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL AND status != 'completed';
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE status != 'completed';
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_metadata ON tasks USING GIN(metadata);

-- Composite index for common query
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status) 
    WHERE status IN ('pending', 'in_progress');

-- Full-text search index
CREATE INDEX idx_tasks_fulltext ON tasks USING GIN(
    to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Comments
COMMENT ON TABLE tasks IS 'Задачи системы (Smart Task Management)';
COMMENT ON COLUMN tasks.mc_reward IS 'Награда в MatrixCoin за выполнение задачи';
COMMENT ON COLUMN tasks.tags IS 'Теги задачи для категоризации';
COMMENT ON COLUMN tasks.metadata IS 'Дополнительные данные (NLP parsing results, etc.)';

-- Trigger for updated_at
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create task_comments table
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT task_comments_content_check CHECK (length(content) > 0)
);

-- Indexes for task_comments
CREATE INDEX idx_task_comments_task ON task_comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_comments_user ON task_comments(user_id);
CREATE INDEX idx_task_comments_created ON task_comments(created_at DESC);

-- Comments
COMMENT ON TABLE task_comments IS 'Комментарии к задачам';

-- Trigger for updated_at
CREATE TRIGGER trg_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create task_history table (partitioned by month)
CREATE TABLE task_history (
    id UUID DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Change tracking
    action VARCHAR(50) NOT NULL
        CHECK (action IN ('created', 'updated', 'assigned', 'completed', 'cancelled', 'commented', 'status_changed')),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes for task_history
CREATE INDEX idx_task_history_task ON task_history(task_id, created_at DESC);
CREATE INDEX idx_task_history_user ON task_history(user_id);
CREATE INDEX idx_task_history_action ON task_history(action);

-- Comments
COMMENT ON TABLE task_history IS 'История изменений задач (партиционировано по месяцам)';

-- Create initial partitions for task_history (2025)
CREATE TABLE task_history_2025_01 PARTITION OF task_history
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE task_history_2025_02 PARTITION OF task_history
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE task_history_2025_03 PARTITION OF task_history
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE task_history_2025_04 PARTITION OF task_history
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE task_history_2025_05 PARTITION OF task_history
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE task_history_2025_06 PARTITION OF task_history
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE task_history_2025_07 PARTITION OF task_history
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE task_history_2025_08 PARTITION OF task_history
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE task_history_2025_09 PARTITION OF task_history
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE task_history_2025_10 PARTITION OF task_history
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE task_history_2025_11 PARTITION OF task_history
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE task_history_2025_12 PARTITION OF task_history
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

COMMIT;
