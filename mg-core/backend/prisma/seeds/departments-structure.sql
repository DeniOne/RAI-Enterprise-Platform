-- Seed data: 6 main departments with divisions from Constitution
-- This represents the actual organizational structure of Photomatrix

-- 1. ДЕПАРТАМЕНТ ПОСТРОЕНИЯ ОРГАНИЗАЦИИ (Department of Organizational Building)
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('dept-org-build', 'Департамент построения организации', 'HR, коммуникации, защита системы управления', 4, 'support', NULL);

-- Divisions under Dept of Org Building
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('div-hr', 'Отдел персонала', 'Подбор, адаптация, развитие персонала', 5, 'support', 'dept-org-build'),
('div-comm', 'Отдел коммуникаций', 'Внутренние и внешние коммуникации', 5, 'support', 'dept-org-build'),
('div-sys-protect', 'Отдел защиты системы управления', 'Контроль соблюдения процедур и стандартов', 5, 'support', 'dept-org-build');

-- 2. КОММЕРЧЕСКИЙ ДЕПАРТАМЕНТ (Commercial Department)
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('dept-commercial', 'Коммерческий департамент', 'Маркетинг, администрирование, фотография, продажи', 4, 'operational', NULL);

INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('div-marketing', 'Отдел маркетинга', 'Продвижение, реклама, бренд', 5, 'operational', 'dept-commercial'),
('div-admin', 'Отдел администрирования', 'Координация операций, документооборот', 5, 'operational', 'dept-commercial'),
('div-photography', 'Отдел фотографии', 'Фотосъемка клиентов', 5, 'operational', 'dept-commercial'),
('div-sales', 'Отдел продаж', 'Продажа готовой продукции', 5, 'operational', 'dept-commercial');

-- 3. ФИНАНСОВЫЙ ДЕПАРТАМЕНТ (Financial Department)
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('dept-finance', 'Финансовый департамент', 'Управление финансами компании', 4, 'support', NULL);

INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('div-revenue', 'Отдел доходов', 'Учет и планирование доходов', 5, 'support', 'dept-finance'),
('div-expenses', 'Отдел расходов', 'Контроль и оптимизация расходов', 5, 'support', 'dept-finance'),
('div-accounting', 'Отдел учёта', 'Бухгалтерский и управленческий учет', 5, 'support', 'dept-finance');

-- 4. ПРОИЗВОДСТВЕННЫЙ ДЕПАРТАМЕНТ (Production Department)
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('dept-production', 'Производственный департамент', 'ИТ, логистика, производство сувениров, склад', 4, 'operational', NULL);

INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('div-it-dev', 'Отдел разработки платформы ИТ', 'Разработка и поддержка ИТ-систем', 5, 'operational', 'dept-production'),
('div-logistics', 'Отдел снабжения и логистики', 'Закупки, доставка материалов', 5, 'operational', 'dept-production'),
('div-souvenirs', 'Отдел производства сувениров', 'Печать и изготовление продукции', 5, 'operational', 'dept-production'),
('div-warehouse', 'Отдел складского хозяйства', 'Хранение и учет материалов', 5, 'operational', 'dept-production');

-- 5. ДЕПАРТАМЕНТ КВАЛИФИКАЦИИ (Qualification Department)
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('dept-qualification', 'Департамент квалификации', 'Качество, обучение, улучшения', 4, 'support', NULL);

INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('div-quality', 'Отдел качества', 'Контроль качества процессов и продукции', 5, 'support', 'dept-qualification'),
('div-corp-training', 'Отдел корпоративного обучения', 'Корпоративный университет, тренинги', 5, 'support', 'dept-qualification'),
('div-improvements', 'Отдел улучшений', 'Непрерывное совершенствование, кайдзен', 5, 'support', 'dept-qualification');

-- 6. ДЕПАРТАМЕНТ РАЗВИТИЯ (Development Department)
INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('dept-development', 'Департамент развития', 'PR, новые продукты, партнерства', 4, 'operational', NULL);

INSERT INTO departments (id, name, description, hierarchy_level, department_type, parent_id) VALUES
('div-pr-brand', 'Отдел PR и построения брэнда', 'PR-активности, имидж компании', 5, 'operational', 'dept-development'),
('div-intro-products', 'Отдел вводных продуктов', 'Разработка новых продуктовых линеек', 5, 'operational', 'dept-development'),
('div-partners', 'Отдел новых партнёров', 'Поиск и развитие партнерских отношений', 5, 'operational', 'dept-development');

-- MatrixGin AI functions for each department
UPDATE departments SET 
    functions = ARRAY['HR-аналитика', 'Скрининг кандидатов', 'Онбординг через бот']
WHERE id = 'dept-org-build';

UPDATE departments SET 
    functions = ARRAY['Прогнозирование продаж', 'Оптимизация воронки', 'Анализ конверсий']
WHERE id = 'dept-commercial';

UPDATE departments SET 
    functions = ARRAY['Real-time финансовая аналитика', 'Риск-менеджмент', 'Прогнозирование бюджета']
WHERE id = 'dept-finance';

UPDATE departments SET 
    functions = ARRAY['Операционные фидбэки', 'Контроль качества', 'Оптимизация производства']
WHERE id = 'dept-production';

UPDATE departments SET 
    functions = ARRAY['Персонализированное обучение', 'Оценка компетенций', 'Адаптивные программы']
WHERE id = 'dept-qualification';

UPDATE departments SET 
    functions = ARRAY['Инновационные предложения', 'Анализ трендов', 'Мониторинг рынка']
WHERE id = 'dept-development';
