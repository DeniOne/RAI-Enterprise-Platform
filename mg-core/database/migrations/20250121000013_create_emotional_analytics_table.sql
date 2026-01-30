-- Migration: 20250121000013_create_emotional_analytics_table
-- Description: Create emotional_analytics table for employee mood tracking
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create emotional_analytics table (partitioned by month)
CREATE TABLE emotional_analytics (
    id UUID DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(user_id) ON DELETE CASCADE,
    
    -- Emotional tone (0.0 - 4.0 scale)
    tone_score DECIMAL(3,2) NOT NULL CHECK (tone_score >= 0 AND tone_score <= 4),
    
    -- Source
    source VARCHAR(50) NOT NULL
        CHECK (source IN ('message', 'feedback', 'survey', 'social_media', 'task_comment', 'telegram')),
    source_id UUID,
    
    -- Analysis
    sentiment VARCHAR(50) NOT NULL
        CHECK (sentiment IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
    keywords TEXT[],
    
    -- ML Model
    model_version VARCHAR(50),
    confidence_score DECIMAL(3,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (id, analyzed_at),
    
    CONSTRAINT emotional_analytics_confidence_check CHECK (
        confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
    )
) PARTITION BY RANGE (analyzed_at);

-- Indexes for emotional_analytics
CREATE INDEX idx_emotional_analytics_employee ON emotional_analytics(employee_id, analyzed_at DESC);
CREATE INDEX idx_emotional_analytics_tone ON emotional_analytics(tone_score);
CREATE INDEX idx_emotional_analytics_sentiment ON emotional_analytics(sentiment);
CREATE INDEX idx_emotional_analytics_source ON emotional_analytics(source, source_id);
CREATE INDEX idx_emotional_analytics_analyzed ON emotional_analytics(analyzed_at DESC);
CREATE INDEX idx_emotional_analytics_keywords ON emotional_analytics USING GIN(keywords);

-- Comments
COMMENT ON TABLE emotional_analytics IS 'Эмоциональная аналитика сотрудников (партиционировано по месяцам)';
COMMENT ON COLUMN emotional_analytics.tone_score IS 'Эмоциональный тон по шкале 0.0-4.0 (Хаббард)';
COMMENT ON COLUMN emotional_analytics.source IS 'Источник данных для анализа';
COMMENT ON COLUMN emotional_analytics.model_version IS 'Версия ML модели для анализа';

-- Create initial partitions for emotional_analytics (2025)
CREATE TABLE emotional_analytics_2025_01 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE emotional_analytics_2025_02 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE emotional_analytics_2025_03 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE emotional_analytics_2025_04 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE emotional_analytics_2025_05 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE emotional_analytics_2025_06 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE emotional_analytics_2025_07 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE emotional_analytics_2025_08 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE emotional_analytics_2025_09 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE emotional_analytics_2025_10 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE emotional_analytics_2025_11 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE emotional_analytics_2025_12 PARTITION OF emotional_analytics
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create view for average emotional tone by employee
CREATE OR REPLACE VIEW v_employee_emotional_state AS
SELECT 
    employee_id,
    AVG(tone_score) as avg_tone_score,
    COUNT(*) as total_measurements,
    MAX(analyzed_at) as last_analyzed_at,
    CASE 
        WHEN AVG(tone_score) < 1.0 THEN 'critical'
        WHEN AVG(tone_score) < 2.0 THEN 'low'
        WHEN AVG(tone_score) < 3.0 THEN 'moderate'
        ELSE 'good'
    END as emotional_state
FROM emotional_analytics
WHERE analyzed_at >= NOW() - INTERVAL '30 days'
GROUP BY employee_id;

COMMENT ON VIEW v_employee_emotional_state IS 'Средний эмоциональный тон сотрудников за последние 30 дней';

COMMIT;
