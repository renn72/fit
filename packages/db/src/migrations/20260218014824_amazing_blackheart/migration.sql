PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recipe` (
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
INSERT INTO `__new_recipe`(`id`, `name`, `description`, `category`, `image`, `meta_tags`, `creator_id`, `organisation_id`, `created_at`, `updated_at`) SELECT `id`, `name`, `description`, `category`, `image`, `meta_tags`, `creator_id`, `organisation_id`, `created_at`, `updated_at` FROM `recipe`;--> statement-breakpoint
DROP TABLE `recipe`;--> statement-breakpoint
ALTER TABLE `__new_recipe` RENAME TO `recipe`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `recipe_organisationId_idx` ON `recipe` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `recipe_creatorId_idx` ON `recipe` (`creator_id`);