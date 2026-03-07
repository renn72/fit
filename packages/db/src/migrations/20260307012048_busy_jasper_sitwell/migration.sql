CREATE TABLE `user_block` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`tags` text DEFAULT '' NOT NULL,
	`rest_day_indexes` text DEFAULT '[]' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_block_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_exercise` (
	`id` text PRIMARY KEY,
	`user_workout_id` text NOT NULL,
	`source_exercise_id` text,
	`movement_id` text,
	`exercise_index` integer NOT NULL,
	`super_set_group` text,
	`super_set_order` integer,
	`label` text,
	`sets` integer,
	`reps` integer,
	`rep_unit` text,
	`orm_percent` real,
	`target_rpe` real,
	`rest_time` integer,
	`rest_unit` text,
	`tempo_down` integer,
	`tempo_pause` integer,
	`tempo_up` integer,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_exercise_user_workout_id_user_workout_id_fk` FOREIGN KEY (`user_workout_id`) REFERENCES `user_workout`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_warmup` (
	`id` text PRIMARY KEY,
	`user_workout_id` text NOT NULL,
	`source_warmup_id` text,
	`warmup_index` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`images` text,
	`link` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_warmup_user_workout_id_user_workout_id_fk` FOREIGN KEY (`user_workout_id`) REFERENCES `user_workout`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_workout` (
	`id` text PRIMARY KEY,
	`user_block_id` text NOT NULL,
	`source_workout_id` text,
	`source_warmup_group_id` text,
	`day_index` integer NOT NULL,
	`workout_index` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_workout_user_block_id_user_block_id_fk` FOREIGN KEY (`user_block_id`) REFERENCES `user_block`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `user_block_userId_idx` ON `user_block` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_block_isActive_idx` ON `user_block` (`is_active`);--> statement-breakpoint
CREATE INDEX `user_block_isTemplate_idx` ON `user_block` (`is_template`);--> statement-breakpoint
CREATE INDEX `user_block_startDate_idx` ON `user_block` (`start_date`);--> statement-breakpoint
CREATE INDEX `user_exercise_userWorkoutId_idx` ON `user_exercise` (`user_workout_id`);--> statement-breakpoint
CREATE INDEX `user_exercise_sourceExerciseId_idx` ON `user_exercise` (`source_exercise_id`);--> statement-breakpoint
CREATE INDEX `user_exercise_movementId_idx` ON `user_exercise` (`movement_id`);--> statement-breakpoint
CREATE INDEX `user_exercise_superSetGroup_idx` ON `user_exercise` (`super_set_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_exercise_order_unique_idx` ON `user_exercise` (`user_workout_id`,`exercise_index`);--> statement-breakpoint
CREATE INDEX `user_warmup_userWorkoutId_idx` ON `user_warmup` (`user_workout_id`);--> statement-breakpoint
CREATE INDEX `user_warmup_sourceWarmupId_idx` ON `user_warmup` (`source_warmup_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_warmup_order_unique_idx` ON `user_warmup` (`user_workout_id`,`warmup_index`);--> statement-breakpoint
CREATE INDEX `user_workout_userBlockId_idx` ON `user_workout` (`user_block_id`);--> statement-breakpoint
CREATE INDEX `user_workout_sourceWorkoutId_idx` ON `user_workout` (`source_workout_id`);--> statement-breakpoint
CREATE INDEX `user_workout_dayIndex_idx` ON `user_workout` (`day_index`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_workout_schedule_unique_idx` ON `user_workout` (`user_block_id`,`day_index`,`workout_index`);