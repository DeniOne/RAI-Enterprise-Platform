-- Migration: 20250121000006_create_refresh_tokens_table
-- Description: Create refresh_tokens table for JWT authentication
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT refresh_tokens_expires_check CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- Index for cleanup of old tokens
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(created_at) 
    WHERE revoked_at IS NOT NULL OR expires_at < NOW();

-- Comments
COMMENT ON TABLE refresh_tokens IS 'Refresh токены для JWT аутентификации';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash refresh токена';
COMMENT ON COLUMN refresh_tokens.user_agent IS 'User-Agent клиента для безопасности';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP адрес клиента';

COMMIT;
