-- Migration: 20250121000010_create_kpi_tables
-- Description: Create KPI templates, metrics, and snapshots tables
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create kpi_templates table
CREATE TABLE kpi_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Metric
    metric_type VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    
    -- Calculation
    calculation_formula TEXT,
    calculation_period VARCHAR(50) NOT NULL
        CHECK (calculation_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Target
    default_target_value DECIMAL(15,2),
    
    -- Department specific
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT kpi_templates_target_check CHECK (
        default_target_value IS NULL OR default_target_value >= 0
    )
);

-- Indexes for kpi_templates
CREATE INDEX idx_kpi_templates_department ON kpi_templates(department_id);
CREATE INDEX idx_kpi_templates_active ON kpi_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_kpi_templates_period ON kpi_templates(calculation_period);

-- Comments
COMMENT ON TABLE kpi_templates IS 'Шаблоны KPI метрик';
COMMENT ON COLUMN kpi_templates.calculation_formula IS 'Формула расчета KPI (для автоматизации)';

-- Trigger for updated_at
CREATE TRIGGER trg_kpi_templates_updated_at
    BEFORE UPDATE ON kpi_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create kpi_metrics table
CREATE TABLE kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(user_id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES kpi_templates(id) ON DELETE CASCADE,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Values
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0,
    achievement_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN target_value > 0 THEN (current_value / target_value * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'failed')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT kpi_metrics_unique_employee_template_period 
        UNIQUE (employee_id, template_id, period_start, period_end),
    CONSTRAINT kpi_metrics_period_check CHECK (period_end >= period_start),
    CONSTRAINT kpi_metrics_values_check CHECK (
        target_value >= 0 AND current_value >= 0
    )
);

-- Indexes for kpi_metrics
CREATE INDEX idx_kpi_metrics_employee ON kpi_metrics(employee_id);
CREATE INDEX idx_kpi_metrics_template ON kpi_metrics(template_id);
CREATE INDEX idx_kpi_metrics_period ON kpi_metrics(period_start, period_end);
CREATE INDEX idx_kpi_metrics_status ON kpi_metrics(status);
CREATE INDEX idx_kpi_metrics_achievement ON kpi_metrics(achievement_percentage DESC);

-- Composite index for dashboard queries
CREATE INDEX idx_kpi_metrics_employee_period ON kpi_metrics(employee_id, period_start, period_end);

-- Comments
COMMENT ON TABLE kpi_metrics IS 'KPI метрики сотрудников';
COMMENT ON COLUMN kpi_metrics.achievement_percentage IS 'Процент достижения цели (вычисляемое поле)';

-- Trigger for updated_at
CREATE TRIGGER trg_kpi_metrics_updated_at
    BEFORE UPDATE ON kpi_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create kpi_snapshots table (partitioned by date)
CREATE TABLE kpi_snapshots (
    id UUID DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(user_id) ON DELETE CASCADE,
    
    snapshot_date DATE NOT NULL,
    snapshot_data JSONB NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (id, snapshot_date),
    CONSTRAINT kpi_snapshots_unique_employee_date UNIQUE (employee_id, snapshot_date)
) PARTITION BY RANGE (snapshot_date);

-- Indexes for kpi_snapshots
CREATE INDEX idx_kpi_snapshots_employee ON kpi_snapshots(employee_id);
CREATE INDEX idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date DESC);

-- Comments
COMMENT ON TABLE kpi_snapshots IS 'Ежедневные снимки KPI для истории (партиционировано по дате)';
COMMENT ON COLUMN kpi_snapshots.snapshot_data IS 'JSON с полными данными KPI на момент снимка';

-- Create initial partitions for kpi_snapshots (2025 by quarter)
CREATE TABLE kpi_snapshots_2025_q1 PARTITION OF kpi_snapshots
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE kpi_snapshots_2025_q2 PARTITION OF kpi_snapshots
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE kpi_snapshots_2025_q3 PARTITION OF kpi_snapshots
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE kpi_snapshots_2025_q4 PARTITION OF kpi_snapshots
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

COMMIT;
