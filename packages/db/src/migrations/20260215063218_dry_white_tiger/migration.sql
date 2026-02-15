CREATE TABLE `recipe` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text NOT NULL,
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
	`alt_ingredient_id` text,
	`amount` real NOT NULL,
	`unit` text NOT NULL,
	CONSTRAINT `fk_recipe_to_ingredient_recipe_id_recipe_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_ingredient_id_ingredient_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_alt_ingredient_id_ingredient_id_fk` FOREIGN KEY (`alt_ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `recipe_organisationId_idx` ON `recipe` (`organisation_id`);