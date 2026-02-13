-- Ensure customer timestamp columns are BIGINT (milliseconds).
-- Init migration already created them as BIGINT; this is idempotent and keeps schema explicit.
-- If your DB was created from init, no data change. If you had DATETIME here (e.g. from db push),
-- convert existing data first: e.g. UPDATE customers SET created = UNIX_TIMESTAMP(created)*1000 WHERE ... then run this.
ALTER TABLE `customers` MODIFY COLUMN `last_login` BIGINT NULL;
ALTER TABLE `customers` MODIFY COLUMN `created` BIGINT NOT NULL DEFAULT 0;
ALTER TABLE `customers` MODIFY COLUMN `updated` BIGINT NOT NULL DEFAULT 0;
