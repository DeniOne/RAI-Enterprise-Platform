-- Migration: 20250121000003_create_departments_table
-- Description: Create departments table with hierarchical structure
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 0,
    path LTREE, -- Materialized path for fast hierarchy queries
    
    -- Head (will be set after users table is created)
    head_id UUID,
    
    -- Budget
    budget_annual DECIMAL(15,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT departments_code_check CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT departments_level_check CHECK (level >= 0),
    CONSTRAINT departments_budget_check CHECK (budget_annual IS NULL OR budget_annual >= 0)
);

-- Indexes
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_head ON departments(head_id);
CREATE INDEX idx_departments_path ON departments USING GIST(path);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_departments_code ON departments(code);

-- Comments
COMMENT ON TABLE departments IS 'Департаменты и подразделения компании';
COMMENT ON COLUMN departments.code IS 'Уникальный код департамента (UPPERCASE)';
COMMENT ON COLUMN departments.path IS 'Материализованный путь для иерархии (ltree)';
COMMENT ON COLUMN departments.budget_annual IS 'Годовой бюджет департамента в рублях';

-- Trigger for updated_at
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update path on insert/update
CREATE OR REPLACE FUNCTION update_department_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path LTREE;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = text2ltree(NEW.id::TEXT);
        NEW.level = 0;
    ELSE
        SELECT path, level INTO parent_path, NEW.level 
        FROM departments 
        WHERE id = NEW.parent_id;
        
        NEW.path = parent_path || text2ltree(NEW.id::TEXT);
        NEW.level = NEW.level + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_department_path
    BEFORE INSERT OR UPDATE OF parent_id ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_department_path();

COMMIT;
