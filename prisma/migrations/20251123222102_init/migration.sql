-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NULL,
    `password_salt` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `role` ENUM('customer', 'admin', 'staff_admin') NOT NULL DEFAULT 'customer',
    `email_verified_at` BIGINT NULL,
    `phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `otp` VARCHAR(191) NULL,
    `otp_expires` BIGINT NULL,
    `wallet_balance` DECIMAL(20, 2) NOT NULL DEFAULT 0,
    `transaction_code` VARCHAR(191) NULL,
    `public_meta` JSON NULL,
    `private_meta` JSON NULL,
    `last_login` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `customers_email_key`(`email`),
    UNIQUE INDEX `customers_phone_key`(`phone`),
    INDEX `customers_email_idx`(`email`),
    INDEX `customers_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barbers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_ref_id` INTEGER NOT NULL,
    `full_name` VARCHAR(191) NULL,
    `specialization` VARCHAR(191) NULL,
    `experience_years` INTEGER NULL,
    `bio` TEXT NULL,
    `avatar` VARCHAR(191) NULL,
    `service_audience` JSON NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NULL,
    `email_verified_at` BIGINT NULL,
    `phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `wallet_balance` DECIMAL(20, 2) NOT NULL DEFAULT 0,
    `transaction_code` VARCHAR(191) NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `barbers_user_ref_id_key`(`user_ref_id`),
    UNIQUE INDEX `barbers_email_key`(`email`),
    UNIQUE INDEX `barbers_phone_key`(`phone`),
    INDEX `barbers_user_ref_id_idx`(`user_ref_id`),
    INDEX `barbers_email_idx`(`email`),
    INDEX `barbers_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barbershops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `gender` ENUM('male', 'female', 'unisex') NOT NULL,
    `type` ENUM('fixed', 'onsite', 'hybrid') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `address` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `city` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `opening_time` VARCHAR(191) NULL,
    `closing_time` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `wallet_balance` DECIMAL(20, 2) NOT NULL DEFAULT 0,
    `transaction_code` VARCHAR(191) NULL,
    `averageRating` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `public_meta` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `barbershops_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbershop_id` INTEGER NOT NULL,
    `parent_service_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `gender` ENUM('male', 'female', 'other') NOT NULL,
    `estimated_time` INTEGER NOT NULL,
    `is_vip` BOOLEAN NOT NULL DEFAULT false,
    `price` DECIMAL(20, 2) NULL,
    `description` TEXT NULL,
    `readmore` TEXT NULL,
    `files` JSON NULL,
    `avatar` VARCHAR(191) NULL,
    `is_medical` BOOLEAN NOT NULL DEFAULT false,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `services_barbershop_id_idx`(`barbershop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_addons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(20, 2) NOT NULL,
    `duration` INTEGER NOT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `service_addons_service_id_idx`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `barber_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `barbershop_id` INTEGER NULL,
    `location_type` ENUM('customer_location', 'barbershop_fixed') NOT NULL,
    `start_time` BIGINT NOT NULL,
    `end_time` BIGINT NOT NULL,
    `status` ENUM('pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'pending',
    `service_type` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `public_meta` JSON NULL,
    `private_meta` JSON NULL,
    `base_price` DECIMAL(20, 2) NULL,
    `addons_total` DECIMAL(20, 2) NULL,
    `price_total` DECIMAL(20, 2) NULL,
    `paid_amount` DECIMAL(20, 2) NULL,
    `payment_lock_external_transaction_id` INTEGER NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `appointments_customer_id_idx`(`customer_id`),
    INDEX `appointments_barber_id_idx`(`barber_id`),
    INDEX `appointments_service_id_idx`(`service_id`),
    INDEX `appointments_barbershop_id_idx`(`barbershop_id`),
    INDEX `appointments_start_time_idx`(`start_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_barbers` (
    `appointmentId` INTEGER NOT NULL,
    `barberId` INTEGER NOT NULL,

    PRIMARY KEY (`appointmentId`, `barberId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_addons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `addon_id` INTEGER NOT NULL,
    `price` DECIMAL(20, 2) NOT NULL,
    `duration` INTEGER NOT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `appointment_addons_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_type` VARCHAR(191) NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'IRR',
    `balance` DECIMAL(20, 2) NOT NULL DEFAULT 0,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `wallets_owner_type_owner_id_idx`(`owner_type`, `owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `external_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `initiator_type` VARCHAR(191) NOT NULL,
    `initiator_id` INTEGER NOT NULL,
    `kind` ENUM('deposit', 'withdrawal', 'appointment_lock', 'payout') NOT NULL,
    `related_appointment_id` INTEGER NULL,
    `amount` DECIMAL(20, 2) NOT NULL,
    `method` ENUM('cash', 'card', 'online', 'wallet') NULL,
    `status` ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    `reference` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `external_transactions_initiator_type_initiator_id_idx`(`initiator_type`, `initiator_id`),
    INDEX `external_transactions_related_appointment_id_idx`(`related_appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `internal_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_external_transaction_id` INTEGER NOT NULL,
    `from_wallet_id` INTEGER NULL,
    `to_wallet_id` INTEGER NULL,
    `amount` DECIMAL(20, 2) NOT NULL,
    `direction` ENUM('credit', 'debit') NOT NULL,
    `note` TEXT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `internal_transactions_parent_external_transaction_id_idx`(`parent_external_transaction_id`),
    INDEX `internal_transactions_from_wallet_id_idx`(`from_wallet_id`),
    INDEX `internal_transactions_to_wallet_id_idx`(`to_wallet_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `external_transaction_id` INTEGER NULL,
    `amount` DECIMAL(20, 2) NOT NULL,
    `method` ENUM('cash', 'card', 'online', 'wallet') NULL,
    `paid_at` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `appointment_payments_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `invoice_no` VARCHAR(191) NOT NULL,
    `total` DECIMAL(20, 2) NOT NULL,
    `discount` DECIMAL(20, 2) NULL,
    `tax` DECIMAL(20, 2) NULL,
    `grand_total` DECIMAL(20, 2) NOT NULL,
    `method` ENUM('cash', 'card', 'online', 'wallet') NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `invoices_invoice_no_key`(`invoice_no`),
    INDEX `invoices_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `value` DECIMAL(20, 2) NULL,
    `usage_max` INTEGER NULL,
    `usage_count` INTEGER NOT NULL DEFAULT 0,
    `expires_at` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `coupons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_usages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coupon_id` INTEGER NOT NULL,
    `customer_id` INTEGER NULL,
    `appointment_id` INTEGER NULL,
    `used_at` BIGINT NOT NULL,

    INDEX `coupon_usages_coupon_id_idx`(`coupon_id`),
    INDEX `coupon_usages_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barber_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barber_id` INTEGER NOT NULL,
    `weekday` INTEGER NOT NULL,
    `start_ms` INTEGER NOT NULL,
    `end_ms` INTEGER NOT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `barber_schedules_barber_id_idx`(`barber_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barber_time_off` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barber_id` INTEGER NOT NULL,
    `start_at` BIGINT NOT NULL,
    `end_at` BIGINT NOT NULL,
    `reason` VARCHAR(191) NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `barber_time_off_barber_id_idx`(`barber_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barbershop_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NOT NULL,
    `weekday` INTEGER NOT NULL,
    `open_ms` INTEGER NOT NULL,
    `close_ms` INTEGER NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `barbershop_schedules_shop_id_idx`(`shop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_type` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NULL,
    `channel` VARCHAR(191) NOT NULL,
    `payload` JSON NULL,
    `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    `error_msg` VARCHAR(191) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `scheduled_at` BIGINT NULL,
    `sent_at` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `notifications_user_type_user_id_idx`(`user_type`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `send_at` BIGINT NOT NULL,
    `sent` BOOLEAN NOT NULL DEFAULT false,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `appointment_reminders_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show') NOT NULL,
    `note` TEXT NULL,
    `changed_by_type` VARCHAR(191) NULL,
    `changed_by_id` INTEGER NULL,
    `changed_at` BIGINT NOT NULL,

    INDEX `appointment_logs_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NULL,
    `barber_id` INTEGER NULL,
    `token` VARCHAR(191) NULL,
    `refresh_token` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `expires_at` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `user_sessions_token_key`(`token`),
    UNIQUE INDEX `user_sessions_refresh_token_key`(`refresh_token`),
    INDEX `user_sessions_customer_id_idx`(`customer_id`),
    INDEX `user_sessions_barber_id_idx`(`barber_id`),
    INDEX `user_sessions_refresh_token_idx`(`refresh_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_meta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `meta_key` VARCHAR(191) NOT NULL,
    `meta_value` VARCHAR(191) NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `appointment_meta_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barber_kpis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barber_id` INTEGER NOT NULL,
    `date` BIGINT NOT NULL,
    `revenue` DECIMAL(20, 2) NOT NULL,
    `appointments` INTEGER NOT NULL,
    `ratingAvg` DOUBLE NOT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `barber_kpis_barber_id_date_idx`(`barber_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NULL,
    `barbershop_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `appointment_id` INTEGER NULL,
    `parent_comment_id` INTEGER NULL,
    `comment` TEXT NULL,
    `rate` INTEGER NULL,
    `comment_meta` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `comment_rates_customer_id_idx`(`customer_id`),
    INDEX `comment_rates_barbershop_id_idx`(`barbershop_id`),
    INDEX `comment_rates_service_id_idx`(`service_id`),
    INDEX `comment_rates_appointment_id_idx`(`appointment_id`),
    INDEX `comment_rates_parent_comment_id_idx`(`parent_comment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('external', 'internal') NOT NULL,
    `direction` ENUM('credit', 'debit') NOT NULL,
    `authority` VARCHAR(191) NULL,
    `status` ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    `reference_id` INTEGER NULL,
    `parent_id` INTEGER NULL,
    `customer_id` INTEGER NULL,
    `barber_id` INTEGER NULL,
    `barbershop_id` INTEGER NULL,
    `amount` DECIMAL(20, 2) NOT NULL,
    `description` TEXT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    INDEX `transactions_customer_id_idx`(`customer_id`),
    INDEX `transactions_barber_id_idx`(`barber_id`),
    INDEX `transactions_barbershop_id_idx`(`barbershop_id`),
    INDEX `transactions_reference_id_idx`(`reference_id`),
    INDEX `transactions_parent_id_idx`(`parent_id`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('deposit', 'full_payment', 'subscription') NOT NULL,
    `price` DECIMAL(20, 2) NOT NULL,
    `deposit_amount` DECIMAL(20, 2) NULL,
    `service_ids` JSON NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `valid_from` BIGINT NULL,
    `valid_until` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `package_purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `package_id` INTEGER NOT NULL,
    `customer_id` INTEGER NULL,
    `barber_id` INTEGER NULL,
    `external_transaction_id` INTEGER NULL,
    `amount` DECIMAL(20, 2) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` BIGINT NULL,
    `created` BIGINT NOT NULL DEFAULT 0,

    INDEX `package_purchases_package_id_idx`(`package_id`),
    INDEX `package_purchases_customer_id_idx`(`customer_id`),
    INDEX `package_purchases_barber_id_idx`(`barber_id`),
    INDEX `package_purchases_external_transaction_id_idx`(`external_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barbers` ADD CONSTRAINT `barbers_user_ref_id_fkey` FOREIGN KEY (`user_ref_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barbershops` ADD CONSTRAINT `barbershops_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_parent_service_id_fkey` FOREIGN KEY (`parent_service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_addons` ADD CONSTRAINT `service_addons_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_barbers` ADD CONSTRAINT `appointment_barbers_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_barbers` ADD CONSTRAINT `appointment_barbers_barberId_fkey` FOREIGN KEY (`barberId`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_addons` ADD CONSTRAINT `appointment_addons_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_addons` ADD CONSTRAINT `appointment_addons_addon_id_fkey` FOREIGN KEY (`addon_id`) REFERENCES `service_addons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `external_transactions` ADD CONSTRAINT `external_transactions_related_appointment_id_fkey` FOREIGN KEY (`related_appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `internal_transactions` ADD CONSTRAINT `internal_transactions_parent_external_transaction_id_fkey` FOREIGN KEY (`parent_external_transaction_id`) REFERENCES `external_transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `internal_transactions` ADD CONSTRAINT `internal_transactions_from_wallet_id_fkey` FOREIGN KEY (`from_wallet_id`) REFERENCES `wallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `internal_transactions` ADD CONSTRAINT `internal_transactions_to_wallet_id_fkey` FOREIGN KEY (`to_wallet_id`) REFERENCES `wallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_payments` ADD CONSTRAINT `appointment_payments_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_payments` ADD CONSTRAINT `appointment_payments_external_transaction_id_fkey` FOREIGN KEY (`external_transaction_id`) REFERENCES `external_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_usages` ADD CONSTRAINT `coupon_usages_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_usages` ADD CONSTRAINT `coupon_usages_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_usages` ADD CONSTRAINT `coupon_usages_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barber_schedules` ADD CONSTRAINT `barber_schedules_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barber_time_off` ADD CONSTRAINT `barber_time_off_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barbershop_schedules` ADD CONSTRAINT `barbershop_schedules_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `barbershops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_reminders` ADD CONSTRAINT `appointment_reminders_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_logs` ADD CONSTRAINT `appointment_logs_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_meta` ADD CONSTRAINT `appointment_meta_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barber_kpis` ADD CONSTRAINT `barber_kpis_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_rates` ADD CONSTRAINT `comment_rates_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_rates` ADD CONSTRAINT `comment_rates_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_rates` ADD CONSTRAINT `comment_rates_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_rates` ADD CONSTRAINT `comment_rates_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_rates` ADD CONSTRAINT `comment_rates_parent_comment_id_fkey` FOREIGN KEY (`parent_comment_id`) REFERENCES `comment_rates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_reference_id_fkey` FOREIGN KEY (`reference_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_purchases` ADD CONSTRAINT `package_purchases_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_purchases` ADD CONSTRAINT `package_purchases_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_purchases` ADD CONSTRAINT `package_purchases_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_purchases` ADD CONSTRAINT `package_purchases_external_transaction_id_fkey` FOREIGN KEY (`external_transaction_id`) REFERENCES `external_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
