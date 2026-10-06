ALTER TABLE `memberships` ADD `area_id` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `retention_days` integer;--> statement-breakpoint
ALTER TABLE `organizations` ADD `privacy_contact` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `records` ADD `archived_at` text;