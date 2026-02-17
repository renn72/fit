PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exercise` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`force` text,
	`level` text,
	`mechanic` text,
	`equipment` text,
	`primary_muscles` text,
	`secondary_muscles` text,
	`instructions` text,
	`category` text,
	`images` text,
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
INSERT INTO `__new_exercise`(`id`, `name`, `force`, `level`, `mechanic`, `equipment`, `primary_muscles`, `secondary_muscles`, `instructions`, `category`, `images`, `base_exercise_id`, `creator_id`, `organisation_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `force`, `level`, `mechanic`, `equipment`, `primary_muscles`, `secondary_muscles`, `instructions`, `category`, `images`, `base_exercise_id`, `creator_id`, `organisation_id`, `created_at`, `updated_at` FROM `exercise`;--> statement-breakpoint
DROP TABLE `exercise`;--> statement-breakpoint
ALTER TABLE `__new_exercise` RENAME TO `exercise`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `exercise_organisationId_idx` ON `exercise` (`organisation_id`);