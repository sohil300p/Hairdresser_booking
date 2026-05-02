-- CreateTable
CREATE TABLE `user_devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_type` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `fcm_token` VARCHAR(512) NOT NULL,
    `platform` VARCHAR(191) NULL,
    `last_used` BIGINT NOT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `user_devices_user_type_user_id_fcm_token_key`(`user_type`, `user_id`, `fcm_token`),
    INDEX `user_devices_user_type_user_id_idx`(`user_type`, `user_id`),
    INDEX `user_devices_fcm_token_idx`(`fcm_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_in_app_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `meta` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `customer_in_app_notifications_customer_id_idx`(`customer_id`),
    INDEX `customer_in_app_notifications_customer_id_read_idx`(`customer_id`, `read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
