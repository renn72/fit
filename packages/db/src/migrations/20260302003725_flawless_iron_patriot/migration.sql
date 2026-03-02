ALTER TABLE `ingredient` ADD `is_user_created` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `ingredient_isUserCreated_idx` ON `ingredient` (`is_user_created`);