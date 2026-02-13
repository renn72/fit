CREATE TABLE `base_exercise` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`force` text,
	`level` text NOT NULL,
	`mechanic` text,
	`equipment` text,
	`primary_muscles` text NOT NULL,
	`secondary_muscles` text NOT NULL,
	`instructions` text NOT NULL,
	`category` text NOT NULL,
	`images` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_code` (
	`id` text PRIMARY KEY,
	`code` text NOT NULL UNIQUE,
	`plan_id` text NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_plan_code_plan_id_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `plan` ADD `hidden` integer DEFAULT false NOT NULL;