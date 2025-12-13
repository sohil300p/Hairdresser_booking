-- Create admin user
-- Password: admin123456 (bcrypt hashed)

INSERT INTO `admin` (
    `full_name`,
    `phone`,
    `email`,
    `password`,
    `role`,
    `is_active`,
    `created_at`,
    `updated_at`,
    `last_login_at`
) VALUES (
    'مدیر سیستم',
    '09999918441',
    'admin@hairdresser.com',
    '$2a$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'admin',
    1,
    NOW(),
    NOW(),
    NOW()
);

-- Check if the admin was created
SELECT * FROM `admin` WHERE `phone` = '09999918441';

