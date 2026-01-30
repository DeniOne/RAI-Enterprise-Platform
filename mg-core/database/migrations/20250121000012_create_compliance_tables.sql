-- Migration: 20250121000012_create_compliance_tables
-- Description: Create audit_logs and consent_records tables for legal compliance
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create audit_logs table (partitioned by month)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    
    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    
    -- Details
    changes JSONB,
    
    -- Request info
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    
    -- Severity
    severity VARCHAR(20) DEFAULT 'info'
        CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;

-- Comments
COMMENT ON TABLE audit_logs IS 'Журнал аудита всех действий в системе (партиционировано по месяцам)';
COMMENT ON COLUMN audit_logs.changes IS 'JSON с изменениями (old_value, new_value)';
COMMENT ON COLUMN audit_logs.request_id IS 'UUID запроса для трассировки';

-- Create initial partitions for audit_logs (2025)
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE audit_logs_2025_04 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE audit_logs_2025_05 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE audit_logs_2025_06 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE audit_logs_2025_07 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE audit_logs_2025_08 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE audit_logs_2025_09 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create consent_records table (152-ФЗ compliance)
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Consent type
    consent_type VARCHAR(100) NOT NULL
        CHECK (consent_type IN ('personal_data', 'marketing', 'analytics', 'third_party', 'biometric')),
    
    -- Status
    granted BOOLEAN NOT NULL,
    
    -- Details
    consent_text TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT consent_records_granted_check CHECK (
        (granted = TRUE AND granted_at IS NOT NULL AND revoked_at IS NULL) OR
        (granted = FALSE AND revoked_at IS NOT NULL)
    )
);

-- Indexes for consent_records
CREATE INDEX idx_consent_records_user ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_granted ON consent_records(granted) WHERE granted = TRUE;
CREATE INDEX idx_consent_records_version ON consent_records(version);

-- Comments
COMMENT ON TABLE consent_records IS 'Согласия на обработку персональных данных (152-ФЗ)';
COMMENT ON COLUMN consent_records.consent_type IS 'Тип согласия (ПДн, маркетинг, аналитика, третьи лица)';
COMMENT ON COLUMN consent_records.version IS 'Версия текста согласия';

COMMIT;
