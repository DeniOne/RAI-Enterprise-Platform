-- Migration: 20250121000008_create_employee_documents_table
-- Description: Create employee_documents table for HR documents
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create employee_documents table
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(user_id) ON DELETE CASCADE,
    
    -- Document Info
    document_type VARCHAR(100) NOT NULL
        CHECK (document_type IN ('contract', 'nda', 'job_description', 'certificate', 'passport', 'inn', 'snils', 'other')),
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Signing (КЭДО - Квалифицированная электронная подпись)
    signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    signature_hash VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT employee_documents_signed_check CHECK (
        (signed = TRUE AND signed_at IS NOT NULL AND signature_hash IS NOT NULL) OR
        (signed = FALSE)
    ),
    CONSTRAINT employee_documents_file_size_check CHECK (file_size IS NULL OR file_size > 0)
);

-- Indexes
CREATE INDEX idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX idx_employee_documents_signed ON employee_documents(signed);
CREATE INDEX idx_employee_documents_created ON employee_documents(created_at DESC);

-- JSONB index for metadata queries
CREATE INDEX idx_employee_documents_metadata ON employee_documents USING GIN(metadata);

-- Comments
COMMENT ON TABLE employee_documents IS 'Кадровые документы сотрудников';
COMMENT ON COLUMN employee_documents.document_type IS 'Тип документа (договор, NDA, должностная инструкция и т.д.)';
COMMENT ON COLUMN employee_documents.signature_hash IS 'Hash электронной подписи (КЭДО)';
COMMENT ON COLUMN employee_documents.metadata IS 'Дополнительные данные в JSON формате';

-- Trigger for updated_at
CREATE TRIGGER trg_employee_documents_updated_at
    BEFORE UPDATE ON employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
