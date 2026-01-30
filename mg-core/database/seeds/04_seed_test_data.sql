-- Seed: 04_seed_test_data
-- Description: Seed test tasks, transactions, and KPI data
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

DO $$
DECLARE
    admin_id UUID;
    manager_id UUID;
    photographer_id UUID;
    sales_id UUID;
    comm_dept_id UUID;
    prod_dept_id UUID;
    task1_id UUID;
    task2_id UUID;
    task3_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_id FROM users WHERE email = 'admin@photomatrix.ru';
    SELECT id INTO manager_id FROM users WHERE email = 'manager@photomatrix.ru';
    SELECT id INTO photographer_id FROM users WHERE email = 'photographer@photomatrix.ru';
    SELECT id INTO sales_id FROM users WHERE email = 'sales@photomatrix.ru';
    
    -- Get department IDs
    SELECT id INTO comm_dept_id FROM departments WHERE code = 'COMM';
    SELECT id INTO prod_dept_id FROM departments WHERE code = 'PROD';
    
    -- Create test tasks
    INSERT INTO tasks (id, title, description, status, priority, created_by, assignee_id, department_id, due_date, mc_reward, tags)
    VALUES
        (
            gen_random_uuid(),
            'Провести фотосессию для клиента Иванов',
            'Семейная фотосессия в студии, 2 часа',
            'in_progress',
            'high',
            manager_id,
            photographer_id,
            prod_dept_id,
            NOW() + INTERVAL '2 days',
            150,
            ARRAY['фотосессия', 'студия', 'семейная']
        ),
        (
            gen_random_uuid(),
            'Обзвонить новых лидов',
            'Обзвонить 20 новых лидов из CRM',
            'pending',
            'medium',
            manager_id,
            sales_id,
            comm_dept_id,
            NOW() + INTERVAL '1 day',
            100,
            ARRAY['продажи', 'лиды']
        ),
        (
            gen_random_uuid(),
            'Подготовить отчет по продажам',
            'Ежемесячный отчет по продажам за ноябрь',
            'completed',
            'high',
            admin_id,
            manager_id,
            comm_dept_id,
            NOW() - INTERVAL '1 day',
            200,
            ARRAY['отчет', 'продажи']
        )
    ON CONFLICT DO NOTHING
    RETURNING id INTO task1_id;
    
    -- Update completed task
    UPDATE tasks 
    SET completed_at = NOW() - INTERVAL '6 hours'
    WHERE status = 'completed' AND completed_at IS NULL;
    
    -- Create task comments
    INSERT INTO task_comments (task_id, user_id, content)
    SELECT 
        t.id,
        photographer_id,
        'Начал работу над задачей'
    FROM tasks t
    WHERE t.title = 'Провести фотосессию для клиента Иванов'
    ON CONFLICT DO NOTHING;
    
    -- Create test transactions (initial bonuses)
    INSERT INTO transactions (from_user_id, to_user_id, amount, currency, transaction_type, description)
    VALUES
        (NULL, admin_id, 1000, 'MC', 'bonus', 'Приветственный бонус'),
        (NULL, admin_id, 10, 'GMC', 'bonus', 'Приветственный GMC'),
        (NULL, manager_id, 800, 'MC', 'bonus', 'Приветственный бонус'),
        (NULL, manager_id, 5, 'GMC', 'bonus', 'Приветственный GMC'),
        (NULL, photographer_id, 500, 'MC', 'bonus', 'Приветственный бонус'),
        (NULL, sales_id, 500, 'MC', 'bonus', 'Приветственный бонус')
    ON CONFLICT DO NOTHING;
    
    -- Create KPI templates
    INSERT INTO kpi_templates (name, description, metric_type, unit, calculation_period, default_target_value, department_id)
    VALUES
        (
            'Количество фотосессий',
            'Количество проведенных фотосессий за месяц',
            'count',
            'шт',
            'monthly',
            20,
            prod_dept_id
        ),
        (
            'Выручка от продаж',
            'Общая выручка от продаж за месяц',
            'revenue',
            'руб',
            'monthly',
            500000,
            comm_dept_id
        ),
        (
            'Конверсия лидов',
            'Процент конверсии лидов в продажи',
            'percentage',
            '%',
            'monthly',
            25,
            comm_dept_id
        )
    ON CONFLICT DO NOTHING;
    
    -- Create KPI metrics for employees
    INSERT INTO kpi_metrics (employee_id, template_id, period_start, period_end, target_value, current_value, status)
    SELECT 
        photographer_id,
        t.id,
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
        20,
        12,
        'in_progress'
    FROM kpi_templates t
    WHERE t.name = 'Количество фотосессий'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO kpi_metrics (employee_id, template_id, period_start, period_end, target_value, current_value, status)
    SELECT 
        sales_id,
        t.id,
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
        25,
        18,
        'in_progress'
    FROM kpi_templates t
    WHERE t.name = 'Конверсия лидов'
    ON CONFLICT DO NOTHING;
    
    -- Create emotional analytics data
    INSERT INTO emotional_analytics (employee_id, tone_score, source, sentiment, model_version, confidence_score)
    VALUES
        (photographer_id, 3.2, 'feedback', 'positive', 'v1.0', 0.85),
        (photographer_id, 3.5, 'task_comment', 'very_positive', 'v1.0', 0.92),
        (sales_id, 2.8, 'feedback', 'positive', 'v1.0', 0.78),
        (manager_id, 3.0, 'message', 'positive', 'v1.0', 0.80)
    ON CONFLICT DO NOTHING;
    
    -- Create consent records
    INSERT INTO consent_records (user_id, consent_type, granted, consent_text, version, granted_at)
    SELECT 
        id,
        'personal_data',
        TRUE,
        'Я даю согласие на обработку моих персональных данных в соответствии с 152-ФЗ',
        '1.0',
        created_at
    FROM users
    WHERE email IN ('admin@photomatrix.ru', 'hr@photomatrix.ru', 'manager@photomatrix.ru', 'photographer@photomatrix.ru', 'sales@photomatrix.ru')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test data seeded successfully';
    RAISE NOTICE 'Created: tasks, transactions, KPI metrics, emotional analytics, consents';
END $$;

COMMIT;
