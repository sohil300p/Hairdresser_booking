-- AlterTable
ALTER TABLE `barbershops` ADD COLUMN `reservation_payment_percent` INTEGER NULL DEFAULT 100, ADD COLUMN `cancellation_policy` VARCHAR(191) NULL, ADD COLUMN `cancellation_tiers` JSON NULL;
