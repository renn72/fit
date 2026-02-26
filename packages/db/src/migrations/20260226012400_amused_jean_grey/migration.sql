CREATE TABLE `menu_template_meal` (
	`id` text PRIMARY KEY,
	`menu_template_id` text NOT NULL,
	`meal_index` integer NOT NULL,
	`name` text NOT NULL,
	CONSTRAINT `fk_menu_template_meal_menu_template_id_menu_template_id_fk` FOREIGN KEY (`menu_template_id`) REFERENCES `menu_template`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_ingredient` (
	`id` text PRIMARY KEY,
	`user_menu_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`alt_ingredient_id` text,
	`meal_index` integer NOT NULL,
	`recipe_index` integer NOT NULL,
	`serve_size` real NOT NULL,
	`serve_unit` text NOT NULL,
	`alt_serve_size` real,
	`alt_serve_unit` text,
	CONSTRAINT `fk_user_ingredient_user_menu_id_user_menu_id_fk` FOREIGN KEY (`user_menu_id`) REFERENCES `user_menu`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_ingredient_ingredient_id_ingredient_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_ingredient_alt_ingredient_id_ingredient_id_fk` FOREIGN KEY (`alt_ingredient_id`) REFERENCES `ingredient`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `user_meal` (
	`id` text PRIMARY KEY,
	`user_menu_id` text NOT NULL,
	`meal_index` integer NOT NULL,
	`name` text,
	`total_calories` real DEFAULT 0 NOT NULL,
	`total_protein` real DEFAULT 0 NOT NULL,
	`total_fat` real DEFAULT 0 NOT NULL,
	`total_carbohydrate` real DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_user_meal_user_menu_id_user_menu_id_fk` FOREIGN KEY (`user_menu_id`) REFERENCES `user_menu`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_menu` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` integer,
	`end_date` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`total_calories` real,
	`total_protein` real,
	`total_fat` real,
	`total_carbohydrate` real,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_menu_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_recipe` (
	`id` text PRIMARY KEY,
	`user_menu_id` text NOT NULL,
	`meal_index` integer NOT NULL,
	`recipe_index` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`image` text,
	`calories` real DEFAULT 0 NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`fat` real DEFAULT 0 NOT NULL,
	`carbohydrate` real DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_user_recipe_user_menu_id_user_menu_id_fk` FOREIGN KEY (`user_menu_id`) REFERENCES `user_menu`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `menu_template_meal_menuTemplateId_idx` ON `menu_template_meal` (`menu_template_id`);--> statement-breakpoint
CREATE INDEX `user_ingredient_userMenuId_idx` ON `user_ingredient` (`user_menu_id`);--> statement-breakpoint
CREATE INDEX `user_meal_userMenuId_idx` ON `user_meal` (`user_menu_id`);--> statement-breakpoint
CREATE INDEX `user_menu_userId_idx` ON `user_menu` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_menu_isActive_idx` ON `user_menu` (`is_active`);--> statement-breakpoint
CREATE INDEX `user_menu_startDate_idx` ON `user_menu` (`start_date`);--> statement-breakpoint
CREATE INDEX `user_recipe_userMenuId_idx` ON `user_recipe` (`user_menu_id`);