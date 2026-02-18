ALTER TABLE `recipe_to_ingredient` ADD `base_ingredient_id` text REFERENCES ingredient(id);--> statement-breakpoint
ALTER TABLE `recipe_to_ingredient` ADD `custom_ingredient_id` text REFERENCES base_ingredients(id);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recipe_to_ingredient` (
	`id` text PRIMARY KEY,
	`recipe_id` text NOT NULL,
	`base_ingredient_id` text,
	`custom_ingredient_id` text,
	`alt_ingredient_id` text,
	`amount` real NOT NULL,
	`unit` text NOT NULL,
	CONSTRAINT `fk_recipe_to_ingredient_recipe_id_recipe_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_base_ingredient_id_ingredient_id_fk` FOREIGN KEY (`base_ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_custom_ingredient_id_base_ingredients_id_fk` FOREIGN KEY (`custom_ingredient_id`) REFERENCES `base_ingredients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recipe_to_ingredient_alt_ingredient_id_ingredient_id_fk` FOREIGN KEY (`alt_ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_recipe_to_ingredient`(`id`, `recipe_id`, `alt_ingredient_id`, `amount`, `unit`) SELECT `id`, `recipe_id`, `alt_ingredient_id`, `amount`, `unit` FROM `recipe_to_ingredient`;--> statement-breakpoint
DROP TABLE `recipe_to_ingredient`;--> statement-breakpoint
ALTER TABLE `__new_recipe_to_ingredient` RENAME TO `recipe_to_ingredient`;--> statement-breakpoint
PRAGMA foreign_keys=ON;