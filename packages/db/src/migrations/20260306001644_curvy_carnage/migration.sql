CREATE TABLE `features` (
	`ai_enabled` integer DEFAULT false NOT NULL,
	`ai_nutrition_enabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE `organisation` ADD `meta_tags` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plan` ADD `meta_tags` text DEFAULT '' NOT NULL;