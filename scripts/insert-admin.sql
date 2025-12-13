-- Insert admin user into the admin table
-- Username: 09999918441
-- Password: admin123456

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
    '$2a$10$Xg7s2ccGwkInacWajpyyOeMQI5uC8ZAWVWc6Uf1W3VuOlE77da4MG',
    'admin',
    1,
    NOW(),
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    `password` = '$2a$10$Xg7s2ccGwkInacWajpyyOeMQI5uC8ZAWVWc6Uf1W3VuOlE77da4MG',
    `updated_at` = NOW();

-- Verify the admin was created
SELECT id, full_name, phone, email, role, is_active, created_at FROM `admin`;

