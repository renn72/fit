CREATE TABLE `warmup` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`images` text,
	`link` text,
	`warmup_group_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_warmup_warmup_group_id_warmup_group_id_fk` FOREIGN KEY (`warmup_group_id`) REFERENCES `warmup_group`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `warmup_group` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_warmup_group_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_warmup_group_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `workout` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`creator_id` text,
	`organisation_id` text,
	`warmup_group_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_workout_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_workout_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_workout_warmup_group_id_warmup_group_id_fk` FOREIGN KEY (`warmup_group_id`) REFERENCES `warmup_group`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `workout_to_exercise` (
	`id` text PRIMARY KEY,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`index` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_workout_to_exercise_workout_id_workout_id_fk` FOREIGN KEY (`workout_id`) REFERENCES `workout`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_workout_to_exercise_exercise_id_exercise_id_fk` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `workout_to_superset` (
	`id` text PRIMARY KEY,
	`workout_id` text NOT NULL,
	`superset_id` text NOT NULL,
	`index` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_workout_to_superset_workout_id_workout_id_fk` FOREIGN KEY (`workout_id`) REFERENCES `workout`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_workout_to_superset_superset_id_exercise_id_fk` FOREIGN KEY (`superset_id`) REFERENCES `exercise`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `warmup_warmupGroupId_idx` ON `warmup` (`warmup_group_id`);--> statement-breakpoint
CREATE INDEX `warmup_group_creatorId_idx` ON `warmup_group` (`creator_id`);--> statement-breakpoint
CREATE INDEX `warmup_group_organisationId_idx` ON `warmup_group` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `workout_creatorId_idx` ON `workout` (`creator_id`);--> statement-breakpoint
CREATE INDEX `workout_organisationId_idx` ON `workout` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `workout_warmupGroupId_idx` ON `workout` (`warmup_group_id`);--> statement-breakpoint
CREATE INDEX `workout_exercise_workoutId_idx` ON `workout_to_exercise` (`workout_id`);--> statement-breakpoint
CREATE INDEX `workout_exercise_exerciseId_idx` ON `workout_to_exercise` (`exercise_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workout_exercise_unique_idx` ON `workout_to_exercise` (`workout_id`,`exercise_id`);--> statement-breakpoint
CREATE INDEX `workout_superset_workoutId_idx` ON `workout_to_superset` (`workout_id`);--> statement-breakpoint
CREATE INDEX `workout_superset_supersetId_idx` ON `workout_to_superset` (`superset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workout_superset_unique_idx` ON `workout_to_superset` (`workout_id`,`superset_id`);