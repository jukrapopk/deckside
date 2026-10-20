CREATE TABLE `game_platforms` (
	`game_id` integer NOT NULL,
	`platform_id` integer NOT NULL,
	PRIMARY KEY(`game_id`, `platform_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_platforms_platform_idx` ON `game_platforms` (`platform_id`);--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'console' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platforms_name_unique` ON `platforms` (`name`);--> statement-breakpoint
-- Carry the free-text platforms on existing games into the new list: one
-- platform per distinct name, with a best-guess icon from the name itself.
INSERT INTO `platforms` (`name`, `icon`)
SELECT DISTINCT trim(`platform`),
	CASE
		WHEN lower(trim(`platform`)) IN ('pc', 'windows', 'mac', 'linux') THEN 'monitor'
		WHEN lower(trim(`platform`)) IN ('handheld', 'switch', 'steam deck') THEN 'handheld'
		WHEN lower(trim(`platform`)) LIKE 'ps%' OR lower(trim(`platform`)) LIKE 'xbox%' THEN 'console'
		ELSE 'console'
	END
FROM `games`
WHERE `platform` IS NOT NULL AND trim(`platform`) <> '';--> statement-breakpoint
INSERT INTO `game_platforms` (`game_id`, `platform_id`)
SELECT `games`.`id`, `platforms`.`id`
FROM `games`
JOIN `platforms` ON `platforms`.`name` = trim(`games`.`platform`)
WHERE `games`.`platform` IS NOT NULL AND trim(`games`.`platform`) <> '';--> statement-breakpoint
ALTER TABLE `games` DROP COLUMN `platform`;