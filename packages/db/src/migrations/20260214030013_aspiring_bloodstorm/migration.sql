CREATE TABLE `base_ingredients` (
	`id` text PRIMARY KEY,
	`public_food_key` text NOT NULL,
	`name` text NOT NULL,
	`calories` real NOT NULL,
	`protein` real NOT NULL,
	`fat` real NOT NULL,
	`carbohydrate` real NOT NULL,
	`serve_size` real NOT NULL,
	`serve_unit` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
