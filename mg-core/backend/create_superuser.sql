-- Создаём или обновляем суперюзера с Telegram ID
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    telegram_id,
    personal_data_consent,
    consent_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'superuser@matrixgin.com',
    '$2b$10$abcdefghijklmnopqrstuv', -- placeholder hash
    'Super',
    'User',
    'ADMIN',
    '441610858',
    true,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    telegram_id = '441610858',
    role = 'ADMIN',
    updated_at = NOW();

-- Проверяем результат
SELECT id, email, first_name, last_name, role, telegram_id 
FROM users 
WHERE telegram_id = '441610858';
