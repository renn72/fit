CREATE TABLE `daily_log` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`organisation_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_daily_log_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_daily_log_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `daily_log_stat` (
	`id` text PRIMARY KEY,
	`daily_log_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`unit` text NOT NULL,
	`value` real NOT NULL,
	`title` text NOT NULL,
	CONSTRAINT `fk_daily_log_stat_daily_log_id_daily_log_id_fk` FOREIGN KEY (`daily_log_id`) REFERENCES `daily_log`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `daily_log_weight` (
	`id` text PRIMARY KEY,
	`daily_log_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`unit` text NOT NULL,
	`value` real NOT NULL,
	CONSTRAINT `fk_daily_log_weight_daily_log_id_daily_log_id_fk` FOREIGN KEY (`daily_log_id`) REFERENCES `daily_log`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `daily_log_userId_idx` ON `daily_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `daily_log_organisationId_idx` ON `daily_log` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `daily_log_createdAt_idx` ON `daily_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `daily_log_stat_dailyLogId_idx` ON `daily_log_stat` (`daily_log_id`);--> statement-breakpoint
CREATE INDEX `daily_log_stat_createdAt_idx` ON `daily_log_stat` (`created_at`);--> statement-breakpoint
CREATE INDEX `daily_log_stat_title_idx` ON `daily_log_stat` (`title`);--> statement-breakpoint
CREATE INDEX `daily_log_weight_dailyLogId_idx` ON `daily_log_weight` (`daily_log_id`);--> statement-breakpoint
CREATE INDEX `daily_log_weight_createdAt_idx` ON `daily_log_weight` (`created_at`);