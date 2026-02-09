ALTER TABLE `plan` ADD `max_members` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `plan` ADD `features` text DEFAULT '' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_plan` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`interval` text NOT NULL,
	`stripe_price_id` text,
	`max_members` integer DEFAULT 1 NOT NULL,
	`features` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_plan`(`id`, `name`, `description`, `price`, `interval`, `stripe_price_id`) SELECT `id`, `name`, `description`, `price`, `interval`, `stripe_price_id` FROM `plan`;--> statement-breakpoint
DROP TABLE `plan`;--> statement-breakpoint
ALTER TABLE `__new_plan` RENAME TO `plan`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subscription` (
	`id` text PRIMARY KEY,
	`organisation_id` text NOT NULL,
	`stripe_id` text,
	`plan_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	CONSTRAINT `fk_subscription_organisation_id_organisation_id_fk` FOREIGN KEY (`organisation_id`) REFERENCES `organisation`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_subscription`(`id`, `organisation_id`, `stripe_id`, `plan_id`, `status`, `current_period_end`) SELECT `id`, `organisation_id`, `stripe_id`, `plan_id`, `status`, `current_period_end` FROM `subscription`;--> statement-breakpoint
DROP TABLE `subscription`;--> statement-breakpoint
ALTER TABLE `__new_subscription` RENAME TO `subscription`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP TABLE `plan_limit`;