CREATE TABLE `chyusen_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceId` int,
	`chyusenEntryId` int,
	`kind` enum('new_chyusen','source_error') NOT NULL DEFAULT 'new_chyusen',
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chyusen_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chyusen_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceUrl` text NOT NULL,
	`sourceLabel` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastCheckedAt` timestamp,
	`lastStatus` enum('monitoring','detected','unavailable','error') NOT NULL DEFAULT 'monitoring',
	`lastError` text,
	`lastContentHash` varchar(128),
	`lastDetectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chyusen_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chyusen_entries` ADD `sourceId` int;