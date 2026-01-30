-- Seed: 03_seed_test_users
-- Description: Seed test users for development and testing
-- Author: MatrixGin Development Team
-- Date: 2025-01-21
-- NOTE: These are test users with default password "Test123!@#"
-- Password hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzjK.daa

BEGIN;

-- Get role IDs
DO $$
DECLARE
    admin_role_id UUID;
    hr_role_id UUID;
    dept_head_role_id UUID;
    employee_role_id UUID;
    comm_dept_id UUID;
    prod_dept_id UUID;
    it_dept_id UUID;
    admin_user_id UUID;
    hr_user_id UUID;
    manager_user_id UUID;
    emp1_user_id UUID;
    emp2_user_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO hr_role_id FROM roles WHERE name = 'hr_manager';
    SELECT id INTO dept_head_role_id FROM roles WHERE name = 'department_head';
    SELECT id INTO employee_role_id FROM roles WHERE name = 'employee';
    
    -- Get department IDs
    SELECT id INTO comm_dept_id FROM departments WHERE code = 'COMM';
    SELECT id INTO prod_dept_id FROM departments WHERE code = 'PROD';
    SELECT id INTO it_dept_id FROM departments WHERE code = 'IT';
    
    -- Insert test users
    -- 1. Admin user
    INSERT INTO users (id, email, password_hash, first_name, last_name, middle_name, role_id, department_id, status, email_verified)
    VALUES (
        gen_random_uuid(),
        'admin@photomatrix.ru',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzjK.daa',
        'Денис',
        'Анискевич',
        'Владимирович',
        admin_role_id,
        it_dept_id,
        'active',
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO admin_user_id;
    
    -- 2. HR Manager
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department_id, status, email_verified)
    VALUES (
        gen_random_uuid(),
        'hr@photomatrix.ru',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzjK.daa',
        'Анна',
        'Петрова',
        hr_role_id,
        (SELECT id FROM departments WHERE code = 'HR'),
        'active',
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO hr_user_id;
    
    -- 3. Department Head (Commercial)
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department_id, status, email_verified)
    VALUES (
        gen_random_uuid(),
        'manager@photomatrix.ru',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzjK.daa',
        'Иван',
        'Сидоров',
        dept_head_role_id,
        comm_dept_id,
        'active',
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO manager_user_id;
    
    -- 4. Employee 1 (Photographer)
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department_id, status, email_verified)
    VALUES (
        gen_random_uuid(),
        'photographer@photomatrix.ru',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzjK.daa',
        'Мария',
        'Иванова',
        employee_role_id,
        prod_dept_id,
        'active',
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO emp1_user_id;
    
    -- 5. Employee 2 (Sales)
    INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department_id, status, email_verified)
    VALUES (
        gen_random_uuid(),
        'sales@photomatrix.ru',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzjK.daa',
        'Алексей',
        'Смирнов',
        employee_role_id,
        comm_dept_id,
        'active',
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO emp2_user_id;
    
    -- Get user IDs if they already exist
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users WHERE email = 'admin@photomatrix.ru';
    END IF;
    IF hr_user_id IS NULL THEN
        SELECT id INTO hr_user_id FROM users WHERE email = 'hr@photomatrix.ru';
    END IF;
    IF manager_user_id IS NULL THEN
        SELECT id INTO manager_user_id FROM users WHERE email = 'manager@photomatrix.ru';
    END IF;
    IF emp1_user_id IS NULL THEN
        SELECT id INTO emp1_user_id FROM users WHERE email = 'photographer@photomatrix.ru';
    END IF;
    IF emp2_user_id IS NULL THEN
        SELECT id INTO emp2_user_id FROM users WHERE email = 'sales@photomatrix.ru';
    END IF;
    
    -- Insert employee records
    INSERT INTO employees (user_id, position, hire_date, rank, employment_type, work_status, salary)
    VALUES
        (admin_user_id, 'Генеральный директор', '2020-01-01', 'expert', 'full_time', 'active', 150000.00),
        (hr_user_id, 'HR Менеджер', '2021-03-15', 'senior', 'full_time', 'active', 80000.00),
        (manager_user_id, 'Руководитель коммерческого департамента', '2021-06-01', 'senior', 'full_time', 'active', 100000.00),
        (emp1_user_id, 'Фотограф', '2022-09-01', 'middle', 'full_time', 'active', 60000.00),
        (emp2_user_id, 'Менеджер по продажам', '2023-01-15', 'junior', 'full_time', 'active', 50000.00)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update department heads
    UPDATE departments SET head_id = manager_user_id WHERE code = 'COMM';
    UPDATE departments SET head_id = hr_user_id WHERE code = 'HR';
    UPDATE departments SET head_id = admin_user_id WHERE code = 'IT';
    
    -- Set manager relationships
    UPDATE employees SET manager_id = manager_user_id WHERE user_id = emp2_user_id;
    UPDATE employees SET manager_id = admin_user_id WHERE user_id IN (hr_user_id, manager_user_id);
    
    RAISE NOTICE 'Test users created successfully';
    RAISE NOTICE 'Login credentials: email / password';
    RAISE NOTICE 'Admin: admin@photomatrix.ru / Test123!@#';
    RAISE NOTICE 'HR: hr@photomatrix.ru / Test123!@#';
    RAISE NOTICE 'Manager: manager@photomatrix.ru / Test123!@#';
    RAISE NOTICE 'Photographer: photographer@photomatrix.ru / Test123!@#';
    RAISE NOTICE 'Sales: sales@photomatrix.ru / Test123!@#';
END $$;

COMMIT;
