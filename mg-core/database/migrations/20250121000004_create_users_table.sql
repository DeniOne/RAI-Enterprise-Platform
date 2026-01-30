-- Migration: 20250121000004_create_users_table
-- Description: Create users table with authentication
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create users table
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(50) UNIQUE,
    phone_number VARCHAR(20),
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    avatar_url TEXT,
    
    -- Relations
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT users_phone_format CHECK (phone_number IS NULL OR phone_number ~ '^\+7\d{10}$')
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_telegram_id ON users(telegram_id) WHERE telegram_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_department ON users(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Full-text search index
CREATE INDEX idx_users_fulltext ON users USING GIN(
    to_tsvector('russian', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(middle_name, '') || ' ' ||
        coalesce(email, '')
    )
) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE users IS 'Основная таблица пользователей системы';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash пароля (cost factor 12)';
COMMENT ON COLUMN users.telegram_id IS 'Telegram User ID для интеграции с ботом';
COMMENT ON COLUMN users.status IS 'Статус пользователя: active, inactive, suspended, deleted';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp';

-- Trigger for updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key to departments.head_id (now that users table exists)
ALTER TABLE departments 
    ADD CONSTRAINT fk_departments_head 
    FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

COMMIT;
