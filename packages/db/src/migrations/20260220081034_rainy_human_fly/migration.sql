CREATE TABLE `menu_template` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`creator_id` text,
	`organisation_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_menu_template_creator_id_user_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_menu_template_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `menu_template_to_recipe` (
	`id` text PRIMARY KEY,
	`menu_template_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`meal_index` integer NOT NULL,
	`recipe_index` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_menu_template_to_recipe_menu_template_id_menu_template_id_fk` FOREIGN KEY (`menu_template_id`) REFERENCES `menu_template`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_menu_template_to_recipe_recipe_id_recipe_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `menu_template_creatorId_idx` ON `menu_template` (`creator_id`);--> statement-breakpoint
CREATE INDEX `menu_template_organisationId_idx` ON `menu_template` (`organisation_id`);--> statement-breakpoint
CREATE INDEX `menu_template_recipe_menuTemplateId_idx` ON `menu_template_to_recipe` (`menu_template_id`);--> statement-breakpoint
CREATE INDEX `menu_template_recipe_recipeId_idx` ON `menu_template_to_recipe` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `menu_template_recipe_mealIndex_idx` ON `menu_template_to_recipe` (`meal_index`);--> statement-breakpoint
CREATE INDEX `menu_template_recipe_recipeIndex_idx` ON `menu_template_to_recipe` (`recipe_index`);--> statement-breakpoint
CREATE UNIQUE INDEX `menu_template_recipe_unique_idx` ON `menu_template_to_recipe` (`menu_template_id`,`recipe_id`,`meal_index`,`recipe_index`);