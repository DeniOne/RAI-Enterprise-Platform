-- Migration: 20250121000014_create_utility_functions
-- Description: Create utility functions for partitioning and maintenance
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partitions(
    table_name TEXT,
    start_date DATE,
    end_date DATE
)
RETURNS VOID AS $$
DECLARE
    partition_date DATE := start_date;
    partition_name TEXT;
    start_range DATE;
    end_range DATE;
BEGIN
    WHILE partition_date < end_date LOOP
        partition_name := table_name || '_' || to_char(partition_date, 'YYYY_MM');
        start_range := partition_date;
        end_range := partition_date + INTERVAL '1 month';
        
        -- Check if partition already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                partition_name, table_name, start_range, end_range
            );
            
            RAISE NOTICE 'Created partition % for range % to %', partition_name, start_range, end_range;
        END IF;
        
        partition_date := end_range;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_monthly_partitions IS 'Автоматическое создание месячных партиций';

-- Function to drop old partitions (data retention)
CREATE OR REPLACE FUNCTION drop_old_partitions(
    table_name TEXT,
    retention_months INTEGER
)
RETURNS VOID AS $$
DECLARE
    partition_record RECORD;
    cutoff_date DATE := CURRENT_DATE - (retention_months || ' months')::INTERVAL;
BEGIN
    FOR partition_record IN
        SELECT 
            child.relname AS partition_name
        FROM pg_inherits
        JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
        JOIN pg_class child ON pg_inherits.inhrelid = child.oid
        WHERE parent.relname = table_name
    LOOP
        -- Extract date from partition name (assumes format: table_YYYY_MM)
        DECLARE
            partition_date DATE;
            date_part TEXT;
        BEGIN
            date_part := substring(partition_record.partition_name from '\d{4}_\d{2}$');
            IF date_part IS NOT NULL THEN
                partition_date := to_date(date_part, 'YYYY_MM');
                
                IF partition_date < cutoff_date THEN
                    EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.partition_name);
                    RAISE NOTICE 'Dropped old partition %', partition_record.partition_name;
                END IF;
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION drop_old_partitions IS 'Удаление старых партиций согласно политике хранения';

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id
      AND u.status = 'active'
      AND u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_permissions IS 'Получить все разрешения пользователя';

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = p_user_id
          AND p.name = p_permission_name
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_has_permission IS 'Проверить наличие разрешения у пользователя';

-- Function to calculate employee tenure in days
CREATE OR REPLACE FUNCTION calculate_employee_tenure(p_employee_id UUID)
RETURNS INTEGER AS $$
DECLARE
    tenure_days INTEGER;
BEGIN
    SELECT 
        EXTRACT(DAY FROM (COALESCE(termination_date, CURRENT_DATE) - hire_date))::INTEGER
    INTO tenure_days
    FROM employees
    WHERE user_id = p_employee_id;
    
    RETURN COALESCE(tenure_days, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_employee_tenure IS 'Рассчитать стаж сотрудника в днях';

-- Function to get department hierarchy
CREATE OR REPLACE FUNCTION get_department_hierarchy(p_department_id UUID)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    level INTEGER,
    path LTREE
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dept_tree AS (
        -- Base case
        SELECT d.id, d.name, d.level, d.path
        FROM departments d
        WHERE d.id = p_department_id
        
        UNION ALL
        
        -- Recursive case
        SELECT d.id, d.name, d.level, d.path
        FROM departments d
        INNER JOIN dept_tree dt ON d.parent_id = dt.id
    )
    SELECT * FROM dept_tree
    ORDER BY level;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_department_hierarchy IS 'Получить иерархию департамента и всех подчиненных';

COMMIT;
