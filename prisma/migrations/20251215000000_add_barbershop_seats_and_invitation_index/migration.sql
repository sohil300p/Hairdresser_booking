-- CreateTable
CREATE TABLE `barbershop_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbershop_id` INTEGER NOT NULL,
    `barber_id` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'staff',
    `joined_at` BIGINT NOT NULL,

    UNIQUE INDEX `barbershop_members_barbershop_id_barber_id_key`(`barbershop_id`, `barber_id`),
    INDEX `barbershop_members_barbershop_id_idx`(`barbershop_id`),
    INDEX `barbershop_members_barber_id_idx`(`barber_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barbershop_invitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbershop_id` INTEGER NOT NULL,
    `invitee_phone` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `invited_by_barber_id` INTEGER NOT NULL,
    `created_at` BIGINT NOT NULL,
    `expires_at` BIGINT NOT NULL,

    UNIQUE INDEX `barbershop_invitations_token_key`(`token`),
    INDEX `barbershop_invitations_barbershop_id_idx`(`barbershop_id`),
    INDEX `barbershop_invitations_invitee_phone_idx`(`invitee_phone`),
    INDEX `barbershop_invitations_token_idx`(`token`),
    INDEX `barbershop_invitations_status_idx`(`status`),
    INDEX `barbershop_invitations_invitee_phone_status_idx`(`invitee_phone`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barbershop_members` ADD CONSTRAINT `barbershop_members_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barbershop_members` ADD CONSTRAINT `barbershop_members_barber_id_fkey` FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barbershop_invitations` ADD CONSTRAINT `barbershop_invitations_barbershop_id_fkey` FOREIGN KEY (`barbershop_id`) REFERENCES `barbershops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barbershop_invitations` ADD CONSTRAINT `barbershop_invitations_invited_by_barber_id_fkey` FOREIGN KEY (`invited_by_barber_id`) REFERENCES `barbers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
