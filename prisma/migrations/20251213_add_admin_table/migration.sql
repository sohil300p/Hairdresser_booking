-- CreateTable: Add Admin table
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('customer', 'admin', 'staff_admin') NOT NULL DEFAULT 'staff_admin',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `permissions` JSON NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_phone_key`(`phone`),
    UNIQUE INDEX `admin_email_key`(`email`),
    INDEX `admin_phone_idx`(`phone`),
    INDEX `admin_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Add admin_id to user_sessions
ALTER TABLE `user_sessions` ADD COLUMN `admin_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `user_sessions_admin_id_idx` ON `user_sessions`(`admin_id`);

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_admin_id_fkey` 
    FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE;

