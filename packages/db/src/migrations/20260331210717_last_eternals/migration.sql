CREATE TABLE `daily_log_exercise` (
	`id` text PRIMARY KEY,
	`daily_log_workout_id` text NOT NULL,
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
	CONSTRAINT `fk_daily_log_exercise_daily_log_workout_id_daily_log_workout_id_fk` FOREIGN KEY (`daily_log_workout_id`) REFERENCES `daily_log_workout`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_daily_log_exercise_movement_id_movement_id_fk` FOREIGN KEY (`movement_id`) REFERENCES `movement`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `daily_log_meal` (
	`id` text PRIMARY KEY,
	`daily_log_id` text NOT NULL,
	`meal_index` integer NOT NULL,
	`name` text NOT NULL,
	`recipe_id` text NOT NULL,
	`total_calories` real DEFAULT 0 NOT NULL,
	`total_protein` real DEFAULT 0 NOT NULL,
	`total_fat` real DEFAULT 0 NOT NULL,
	`total_carbohydrate` real DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_daily_log_meal_daily_log_id_daily_log_id_fk` FOREIGN KEY (`daily_log_id`) REFERENCES `daily_log`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `daily_log_set` (
	`id` text PRIMARY KEY,
	`daily_log_exercise_id` text NOT NULL,
	`set_index` integer NOT NULL,
	`reps` integer,
	`weight` real,
	`rpe` real,
	`notes` text,
	CONSTRAINT `fk_daily_log_set_daily_log_exercise_id_daily_log_exercise_id_fk` FOREIGN KEY (`daily_log_exercise_id`) REFERENCES `daily_log_exercise`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `daily_log_warmup` (
	`id` text PRIMARY KEY,
	`daily_log_workout_id` text NOT NULL,
	`warmup_index` integer NOT NULL,
	`name` text NOT NULL,
	`source_warmup_id` text,
	CONSTRAINT `fk_daily_log_warmup_daily_log_workout_id_daily_log_workout_id_fk` FOREIGN KEY (`daily_log_workout_id`) REFERENCES `daily_log_workout`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `daily_log_workout` (
	`id` text PRIMARY KEY,
	`daily_log_id` text NOT NULL,
	`workout_index` integer NOT NULL,
	`user_workout_id` text NOT NULL,
	`name` text NOT NULL,
	`energy_level` text NOT NULL,
	CONSTRAINT `fk_daily_log_workout_daily_log_id_daily_log_id_fk` FOREIGN KEY (`daily_log_id`) REFERENCES `daily_log`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `daily_log_exercise_dailyLogWorkoutId_idx` ON `daily_log_exercise` (`daily_log_workout_id`);--> statement-breakpoint
CREATE INDEX `daily_log_exercise_exerciseIndex_idx` ON `daily_log_exercise` (`exercise_index`);--> statement-breakpoint
CREATE INDEX `daily_log_exercise_sourceExerciseId_idx` ON `daily_log_exercise` (`source_exercise_id`);--> statement-breakpoint
CREATE INDEX `daily_log_exercise_movementId_idx` ON `daily_log_exercise` (`movement_id`);--> statement-breakpoint
CREATE INDEX `daily_log_meal_dailyLogId_idx` ON `daily_log_meal` (`daily_log_id`);--> statement-breakpoint
CREATE INDEX `daily_log_meal_mealIndex_idx` ON `daily_log_meal` (`meal_index`);--> statement-breakpoint
CREATE INDEX `daily_log_meal_recipeId_idx` ON `daily_log_meal` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `daily_log_set_dailyLogExerciseId_idx` ON `daily_log_set` (`daily_log_exercise_id`);--> statement-breakpoint
CREATE INDEX `daily_log_set_setIndex_idx` ON `daily_log_set` (`set_index`);--> statement-breakpoint
CREATE INDEX `daily_log_warmup_dailyLogWorkoutId_idx` ON `daily_log_warmup` (`daily_log_workout_id`);--> statement-breakpoint
CREATE INDEX `daily_log_warmup_warmupIndex_idx` ON `daily_log_warmup` (`warmup_index`);--> statement-breakpoint
CREATE INDEX `daily_log_warmup_sourceWarmupId_idx` ON `daily_log_warmup` (`source_warmup_id`);--> statement-breakpoint
CREATE INDEX `daily_log_workout_dailyLogId_idx` ON `daily_log_workout` (`daily_log_id`);--> statement-breakpoint
CREATE INDEX `daily_log_workout_workoutIndex_idx` ON `daily_log_workout` (`workout_index`);--> statement-breakpoint
CREATE INDEX `daily_log_workout_userWorkoutId_idx` ON `daily_log_workout` (`user_workout_id`);