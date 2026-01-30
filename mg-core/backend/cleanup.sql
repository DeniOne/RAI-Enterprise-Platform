TRUNCATE registration_step_history CASCADE;
DELETE FROM employee_registration_requests;
DELETE FROM users WHERE role != 'SUPERADMIN';
