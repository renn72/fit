ALTER TABLE `plan` ADD `cta` text NOT NULL;--> statement-breakpoint
ALTER TABLE `plan` ADD `price_monthly` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `plan` ADD `price_yearly` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `plan` ADD `max_trainers` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `plan` ADD `tags` text DEFAULT '' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_plan` (
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
	`tags` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_plan`(`id`, `name`, `description`, `stripe_price_id`, `max_members`, `features`) SELECT `id`, `name`, `description`, `stripe_price_id`, `max_members`, `features` FROM `plan`;--> statement-breakpoint
DROP TABLE `plan`;--> statement-breakpoint
ALTER TABLE `__new_plan` RENAME TO `plan`;--> statement-breakpoint
PRAGMA foreign_keys=ON;