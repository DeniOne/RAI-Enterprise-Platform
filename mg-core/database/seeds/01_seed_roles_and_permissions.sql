-- Seed: 01_seed_roles_and_permissions
-- Description: Seed initial roles and permissions for RBAC
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Insert roles
INSERT INTO roles (name, display_name, description, level) VALUES
    ('admin', 'Администратор', 'Полный доступ ко всем функциям системы', 100),
    ('hr_manager', 'HR Менеджер', 'Управление персоналом и кадровыми документами', 80),
    ('department_head', 'Руководитель департамента', 'Управление департаментом и сотрудниками', 60),
    ('branch_manager', 'Управляющий филиалом', 'Управление филиалом', 50),
    ('employee', 'Сотрудник', 'Базовый доступ для сотрудников', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    -- Employees
    ('employees.read', 'employees', 'read', 'Просмотр информации о сотрудниках'),
    ('employees.read_all', 'employees', 'read_all', 'Просмотр всех сотрудников'),
    ('employees.create', 'employees', 'create', 'Создание новых сотрудников'),
    ('employees.update', 'employees', 'update', 'Обновление информации о сотрудниках'),
    ('employees.delete', 'employees', 'delete', 'Удаление сотрудников'),
    
    -- Tasks
    ('tasks.read', 'tasks', 'read', 'Просмотр задач'),
    ('tasks.read_all', 'tasks', 'read_all', 'Просмотр всех задач'),
    ('tasks.create', 'tasks', 'create', 'Создание задач'),
    ('tasks.update', 'tasks', 'update', 'Обновление задач'),
    ('tasks.delete', 'tasks', 'delete', 'Удаление задач'),
    ('tasks.assign', 'tasks', 'assign', 'Назначение задач'),
    ('tasks.assign_any', 'tasks', 'assign_any', 'Назначение задач любому сотруднику'),
    ('tasks.comment', 'tasks', 'comment', 'Комментирование задач'),
    
    -- Economy
    ('economy.read_own', 'economy', 'read_own', 'Просмотр своего баланса'),
    ('economy.read_all', 'economy', 'read_all', 'Просмотр всех балансов'),
    ('economy.transfer', 'economy', 'transfer', 'Перевод MC/GMC'),
    ('economy.admin', 'economy', 'admin', 'Администрирование экономики'),
    
    -- KPI
    ('kpi.read_own', 'kpi', 'read_own', 'Просмотр своих KPI'),
    ('kpi.read_team', 'kpi', 'read_team', 'Просмотр KPI команды'),
    ('kpi.read_all', 'kpi', 'read_all', 'Просмотр всех KPI'),
    ('kpi.update_own', 'kpi', 'update_own', 'Обновление своих KPI'),
    ('kpi.update_any', 'kpi', 'update_any', 'Обновление любых KPI'),
    
    -- Departments
    ('departments.read', 'departments', 'read', 'Просмотр департаментов'),
    ('departments.create', 'departments', 'create', 'Создание департаментов'),
    ('departments.update', 'departments', 'update', 'Обновление департаментов'),
    ('departments.delete', 'departments', 'delete', 'Удаление департаментов'),
    
    -- Legal
    ('legal.read', 'legal', 'read', 'Просмотр юридических документов'),
    ('legal.create', 'legal', 'create', 'Создание юридических документов'),
    ('legal.update', 'legal', 'update', 'Обновление юридических документов'),
    
    -- Emotional Analytics
    ('emotional.read', 'emotional', 'read', 'Просмотр эмоциональной аналитики'),
    ('emotional.read_all', 'emotional', 'read_all', 'Просмотр эмоциональной аналитики всех'),
    
    -- Social Monitoring
    ('social.read', 'social', 'read', 'Просмотр социальных данных'),
    ('social.screen', 'social', 'screen', 'Скрининг кандидатов'),
    
    -- Ethics
    ('ethics.read', 'ethics', 'read', 'Просмотр этических нарушений'),
    ('ethics.manage', 'ethics', 'manage', 'Управление этическими вопросами'),
    
    -- Admin
    ('admin.users', 'admin', 'users', 'Управление пользователями'),
    ('admin.roles', 'admin', 'roles', 'Управление ролями'),
    ('admin.settings', 'admin', 'settings', 'Управление настройками'),
    ('admin.audit_logs', 'admin', 'audit_logs', 'Просмотр журнала аудита')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- HR Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'hr_manager'
  AND p.name IN (
    'employees.read_all', 'employees.create', 'employees.update',
    'tasks.read_all', 'tasks.create', 'tasks.assign_any',
    'kpi.read_all', 'kpi.update_any',
    'departments.read',
    'legal.read', 'legal.create',
    'emotional.read_all',
    'social.read', 'social.screen',
    'ethics.read'
  )
ON CONFLICT DO NOTHING;

-- Department Head
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'department_head'
  AND p.name IN (
    'employees.read', 'employees.update',
    'tasks.read_all', 'tasks.create', 'tasks.assign', 'tasks.update',
    'kpi.read_team', 'kpi.update_any',
    'departments.read',
    'economy.read_own', 'economy.transfer',
    'emotional.read'
  )
ON CONFLICT DO NOTHING;

-- Branch Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'branch_manager'
  AND p.name IN (
    'employees.read',
    'tasks.read', 'tasks.create', 'tasks.assign',
    'kpi.read_team',
    'departments.read',
    'economy.read_own', 'economy.transfer'
  )
ON CONFLICT DO NOTHING;

-- Employee
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'employee'
  AND p.name IN (
    'tasks.read', 'tasks.create', 'tasks.update', 'tasks.comment',
    'kpi.read_own', 'kpi.update_own',
    'economy.read_own', 'economy.transfer'
  )
ON CONFLICT DO NOTHING;

COMMIT;
