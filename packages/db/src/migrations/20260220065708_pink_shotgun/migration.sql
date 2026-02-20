CREATE TABLE `block_template` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`rest_day_index` integer,
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_block_template_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_block_template_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `block_template_to_workout` (
	`id` text PRIMARY KEY,
	`block_template_id` text NOT NULL,
	`workout_id` text NOT NULL,
	`index` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_block_template_to_workout_block_template_id_block_template_id_fk` FOREIGN KEY (`block_template_id`) REFERENCES `block_template`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_block_template_to_workout_workout_id_workout_id_fk` FOREIGN KEY (`workout_id`) REFERENCES `workout`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `block_template_creatorId_idx` ON `block_template` (`creator_id`);--> statement-breakpoint
CREATE INDEX `block_template_organisationId_idx` ON `block_template` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `block_template_workout_blockTemplateId_idx` ON `block_template_to_workout` (`block_template_id`);--> statement-breakpoint
CREATE INDEX `block_template_workout_workoutId_idx` ON `block_template_to_workout` (`workout_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `block_template_workout_unique_idx` ON `block_template_to_workout` (`block_template_id`,`workout_id`);