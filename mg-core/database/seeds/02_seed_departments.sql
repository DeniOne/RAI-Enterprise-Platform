-- Seed: 02_seed_departments
-- Description: Seed initial departments structure
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Insert main departments
INSERT INTO departments (id, name, code, description, level, budget_annual) VALUES
    (gen_random_uuid(), 'Коммерческий департамент', 'COMM', 'Продажи и работа с клиентами', 1, 5000000.00),
    (gen_random_uuid(), 'Производственный департамент', 'PROD', 'Производство фотосессий', 1, 8000000.00),
    (gen_random_uuid(), 'Финансовый департамент', 'FIN', 'Финансы и бухгалтерия', 1, 2000000.00),
    (gen_random_uuid(), 'Департамент развития', 'DEV', 'Развитие и инновации', 1, 3000000.00),
    (gen_random_uuid(), 'Департамент квалификации', 'EDU', 'Обучение и развитие персонала', 1, 1500000.00),
    (gen_random_uuid(), 'HR департамент', 'HR', 'Управление персоналом', 1, 2500000.00),
    (gen_random_uuid(), 'IT департамент', 'IT', 'Информационные технологии', 1, 4000000.00)
ON CONFLICT (code) DO NOTHING;

COMMIT;
