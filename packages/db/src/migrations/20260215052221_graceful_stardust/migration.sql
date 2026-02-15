CREATE TABLE `exercise` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`force` text,
	`level` text,
	`mechanic` text,
	`equipment` text,
	`primary_muscles` text NOT NULL,
	`secondary_muscles` text NOT NULL,
	`instructions` text NOT NULL,
	`category` text NOT NULL,
	`images` text NOT NULL,
	`base_exercise_id` text,
	`creator_id` text,
	`organisation_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_exercise_base_exercise_id_base_exercise_id_fk` FOREIGN KEY (`base_exercise_id`) REFERENCES `base_exercise`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_exercise_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_exercise_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_base_exercise` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`force` text,
	`level` text,
	`mechanic` text,
	`equipment` text,
	`primary_muscles` text,
	`secondary_muscles` text,
	`instructions` text NOT NULL,
	`category` text NOT NULL,
	`images` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_base_exercise`(`id`, `name`, `force`, `level`, `mechanic`, `equipment`, `primary_muscles`, `secondary_muscles`, `instructions`, `category`, `images`, `created_at`, `updated_at`) SELECT `id`, `name`, `force`, `level`, `mechanic`, `equipment`, `primary_muscles`, `secondary_muscles`, `instructions`, `category`, `images`, `created_at`, `updated_at` FROM `base_exercise`;--> statement-breakpoint
DROP TABLE `base_exercise`;--> statement-breakpoint
ALTER TABLE `__new_base_exercise` RENAME TO `base_exercise`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `exercise_organisationId_idx` ON `exercise` (`organisation_id`);