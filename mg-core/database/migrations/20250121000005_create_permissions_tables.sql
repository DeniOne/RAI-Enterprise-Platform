-- Migration: 20250121000005_create_permissions_tables
-- Description: Create permissions and role_permissions tables
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT permissions_unique_resource_action UNIQUE (resource, action),
    CONSTRAINT permissions_name_check CHECK (name ~ '^[a-z_\.]+$')
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (role_id, permission_id)
);

-- Indexes
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Comments
COMMENT ON TABLE permissions IS 'Разрешения для RBAC';
COMMENT ON COLUMN permissions.name IS 'Уникальное имя разрешения (resource.action)';
COMMENT ON COLUMN permissions.resource IS 'Ресурс (employees, tasks, economy)';
COMMENT ON COLUMN permissions.action IS 'Действие (read, create, update, delete)';
COMMENT ON TABLE role_permissions IS 'Связь ролей и разрешений (many-to-many)';

COMMIT;
