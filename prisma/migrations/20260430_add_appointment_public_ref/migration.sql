-- Add a human-friendly public reference for tracking reservations
ALTER TABLE `appointments`
  ADD COLUMN `public_ref` VARCHAR(16) NULL;

-- Unique index (allows multiple NULLs)
CREATE UNIQUE INDEX `appointments_public_ref_key` ON `appointments` (`public_ref`);

