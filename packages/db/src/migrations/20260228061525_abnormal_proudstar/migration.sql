ALTER TABLE `user_menu` ADD `is_template` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `user_menu_isTemplate_idx` ON `user_menu` (`is_template`);