-- Migration: 20250121000007_create_employees_table
-- Description: Create employees table (extends users)
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create sequence for employee numbers
CREATE SEQUENCE employee_number_seq START 1000;

-- Create employees table
CREATE TABLE employees (
    -- Primary Key (same as users.id)
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Employment Info
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    position VARCHAR(255) NOT NULL,
    hire_date DATE NOT NULL,
    termination_date DATE,
    
    -- Classification
    rank VARCHAR(50) NOT NULL DEFAULT 'trainee'
        CHECK (rank IN ('trainee', 'junior', 'middle', 'senior', 'lead', 'expert')),
    employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time'
        CHECK (employment_type IN ('full_time', 'part_time', 'contractor', 'intern')),
    
    -- Status
    work_status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (work_status IN ('active', 'on_vacation', 'sick_leave', 'maternity_leave', 'dismissed')),
    
    -- Manager
    manager_id UUID REFERENCES employees(user_id) ON DELETE SET NULL,
    
    -- Salary (encrypted in production)
    salary DECIMAL(12,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT employees_termination_check CHECK (
        termination_date IS NULL OR termination_date >= hire_date
    ),
    CONSTRAINT employees_salary_check CHECK (salary IS NULL OR salary >= 0)
);

-- Indexes
CREATE UNIQUE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(work_status);
CREATE INDEX idx_employees_rank ON employees(rank);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);

-- Comments
COMMENT ON TABLE employees IS 'Расширенная информация о сотрудниках';
COMMENT ON COLUMN employees.employee_number IS 'Уникальный номер сотрудника (EMP000001)';
COMMENT ON COLUMN employees.rank IS 'Грейд сотрудника';
COMMENT ON COLUMN employees.work_status IS 'Текущий рабочий статус';

-- Trigger for updated_at
CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-generating employee_number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_number IS NULL OR NEW.employee_number = '' THEN
        NEW.employee_number := 'EMP' || LPAD(nextval('employee_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_employee_number
    BEFORE INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION generate_employee_number();

COMMIT;
