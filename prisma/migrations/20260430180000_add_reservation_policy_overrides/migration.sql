-- CreateTable
CREATE TABLE `reservation_policy_defaults` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slot_granularity_minutes` INTEGER NULL,
    `min_advance_minutes` INTEGER NULL,
    `buffer_before_minutes` INTEGER NULL,
    `buffer_after_minutes` INTEGER NULL,
    `max_bookings_per_slot` INTEGER NULL,
    `deposit_percent` INTEGER NULL,
    `cancellation_policy` VARCHAR(191) NULL,
    `cancellation_tiers` JSON NULL,
    `reminder_schedule` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_policy_barbershops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbershop_id` INTEGER NOT NULL,
    `slot_granularity_minutes` INTEGER NULL,
    `min_advance_minutes` INTEGER NULL,
    `buffer_before_minutes` INTEGER NULL,
    `buffer_after_minutes` INTEGER NULL,
    `max_bookings_per_slot` INTEGER NULL,
    `deposit_percent` INTEGER NULL,
    `cancellation_policy` VARCHAR(191) NULL,
    `cancellation_tiers` JSON NULL,
    `reminder_schedule` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `reservation_policy_barbershops_barbershop_id_key`(`barbershop_id`),
    INDEX `reservation_policy_barbershops_barbershop_id_idx`(`barbershop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_policy_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `slot_granularity_minutes` INTEGER NULL,
    `min_advance_minutes` INTEGER NULL,
    `buffer_before_minutes` INTEGER NULL,
    `buffer_after_minutes` INTEGER NULL,
    `max_bookings_per_slot` INTEGER NULL,
    `deposit_percent` INTEGER NULL,
    `cancellation_policy` VARCHAR(191) NULL,
    `cancellation_tiers` JSON NULL,
    `reminder_schedule` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `reservation_policy_services_service_id_key`(`service_id`),
    INDEX `reservation_policy_services_service_id_idx`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_policy_barbers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barber_id` INTEGER NOT NULL,
    `slot_granularity_minutes` INTEGER NULL,
    `min_advance_minutes` INTEGER NULL,
    `buffer_before_minutes` INTEGER NULL,
    `buffer_after_minutes` INTEGER NULL,
    `max_bookings_per_slot` INTEGER NULL,
    `deposit_percent` INTEGER NULL,
    `cancellation_policy` VARCHAR(191) NULL,
    `cancellation_tiers` JSON NULL,
    `reminder_schedule` JSON NULL,
    `created` BIGINT NOT NULL DEFAULT 0,
    `updated` BIGINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `reservation_policy_barbers_barber_id_key`(`barber_id`),
    INDEX `reservation_policy_barbers_barber_id_idx`(`barber_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservation_policy_barbershops` ADD CONSTRAINT `reservation_policy_barbershops_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_policy_services` ADD CONSTRAINT `reservation_policy_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_policy_barbers` ADD CONSTRAINT `reservation_policy_barbers_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

