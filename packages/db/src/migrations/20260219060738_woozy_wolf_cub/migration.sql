CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text,
	`meta_tags` text,
	`banned` integer,
	`ban_reason` text,
	`ban_expires` integer,
	`organisation_slug` text,
	`organisation_id` text,
	`organisation_creator_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`theme` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_settings_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_toggles` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`is_root` integer DEFAULT false NOT NULL,
	`is_creator` integer DEFAULT false NOT NULL,
	`is_trainer` integer DEFAULT false NOT NULL,
	`is_client` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_toggles_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercise` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`movement_id` text,
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
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_exercise_movement_id_movement_id_fk` FOREIGN KEY (`movement_id`) REFERENCES `movement`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_exercise_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_exercise_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `ingredient` (
	`id` text PRIMARY KEY,
	`public_food_key` text,
	`name` text NOT NULL,
	`calories` real NOT NULL,
	`protein` real NOT NULL,
	`fat` real NOT NULL,
	`carbohydrate` real NOT NULL,
	`serve_size` real NOT NULL,
	`serve_unit` text NOT NULL,
	`is_base` integer DEFAULT false NOT NULL,
	`base_id` text,
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_ingredient_base_id_ingredient_id_fk` FOREIGN KEY (`base_id`) REFERENCES `ingredient`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_ingredient_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_ingredient_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `movement` (
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
	`is_base` integer DEFAULT false NOT NULL,
	`base_id` text,
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_movement_base_id_movement_id_fk` FOREIGN KEY (`base_id`) REFERENCES `movement`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_movement_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_movement_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organisation` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`state` text NOT NULL,
	`creator_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_organisation_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `plan` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`features` text DEFAULT '' NOT NULL,
	`cta` text NOT NULL,
	`price_monthly` integer NOT NULL,
	`price_yearly` integer NOT NULL,
	`stripe_price_id` text,
	`max_members` integer DEFAULT 1 NOT NULL,
	`max_trainers` integer DEFAULT 1 NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`hidden` integer DEFAULT false NOT NULL
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
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY,
	`organisation_id` text NOT NULL,
	`stripe_id` text,
	`plan_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	CONSTRAINT `fk_subscription_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `recipe` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`image` text,
	`meta_tags` text NOT NULL,
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_recipe_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_recipe_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `recipe_to_ingredient` (
	`id` text PRIMARY KEY,
	`recipe_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`is_base_ingredient` integer DEFAULT false NOT NULL,
	`alt_ingredient_id` text,
	`amount` real NOT NULL,
	`unit` text NOT NULL,
	CONSTRAINT `fk_recipe_to_ingredient_recipe_id_recipe_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_ingredient_id_ingredient_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_alt_ingredient_id_ingredient_id_fk` FOREIGN KEY (`alt_ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_organisationId_idx` ON `user` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `exercise_movementId_idx` ON `exercise` (`movement_id`);--> statement-breakpoint
CREATE INDEX `exercise_organisationId_idx` ON `exercise` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `ingredient_organisationId_idx` ON `ingredient` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `ingredient_isBase_idx` ON `ingredient` (`is_base`);--> statement-breakpoint
CREATE INDEX `movement_organisationId_idx` ON `movement` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `movement_isBase_idx` ON `movement` (`is_base`);--> statement-breakpoint
CREATE INDEX `user_organisationSlug_idx` ON `organisation` (`slug`);--> statement-breakpoint
CREATE INDEX `recipe_organisationId_idx` ON `recipe` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `recipe_creatorId_idx` ON `recipe` (`creator_id`);