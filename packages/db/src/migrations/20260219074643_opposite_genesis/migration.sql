CREATE TABLE `super_set_to_exercise` (
	`id` text PRIMARY KEY,
	`super_set_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_super_set_to_exercise_super_set_id_exercise_id_fk` FOREIGN KEY (`super_set_id`) REFERENCES `exercise`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_super_set_to_exercise_exercise_id_exercise_id_fk` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `exercise` ADD `is_superset` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `exercise_isSuperSet_idx` ON `exercise` (`is_superset`);--> statement-breakpoint
CREATE INDEX `superset_superSetId_idx` ON `super_set_to_exercise` (`super_set_id`);--> statement-breakpoint
CREATE INDEX `superset_exerciseId_idx` ON `super_set_to_exercise` (`exercise_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `superset_unique_idx` ON `super_set_to_exercise` (`super_set_id`,`exercise_id`);