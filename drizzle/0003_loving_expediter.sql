ALTER TABLE `organizations` ADD `brand_primary` text DEFAULT '#0A7655' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `brand_sidebar` text DEFAULT '#102C2A' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `brand_tagline` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `brand_logo_key` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `brand_logo_type` text;