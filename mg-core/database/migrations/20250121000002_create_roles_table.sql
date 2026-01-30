-- Migration: 20250121000002_create_roles_table
-- Description: Create roles table for RBAC
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hierarchy level (higher = more permissions)
    level INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT roles_name_check CHECK (name ~ '^[a-z_]+$'),
    CONSTRAINT roles_level_check CHECK (level >= 0 AND level <= 100)
);

-- Indexes
CREATE INDEX idx_roles_level ON roles(level DESC);
CREATE INDEX idx_roles_name ON roles(name);

-- Comments
COMMENT ON TABLE roles IS 'Роли пользователей для RBAC';
COMMENT ON COLUMN roles.name IS 'Системное имя роли (snake_case)';
COMMENT ON COLUMN roles.display_name IS 'Отображаемое имя роли';
COMMENT ON COLUMN roles.level IS 'Уровень иерархии (0-100)';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
