ALTER TABLE `session` ADD `impersonated_by` text;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text;--> statement-breakpoint
ALTER TABLE `user` ADD `meta_tags` text;--> statement-breakpoint
ALTER TABLE `user` ADD `banned` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_expires` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `organisation_slug` text;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `roles`;