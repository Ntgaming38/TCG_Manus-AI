CREATE TABLE `chyusen_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`productName` varchar(255),
	`sourceName` varchar(255),
	`sourceUrl` text,
	`registrationStartAt` timestamp,
	`registrationDeadline` timestamp,
	`drawAt` timestamp,
	`resultStatus` enum('pending','won','lost','not_entered','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chyusen_entries_id` PRIMARY KEY(`id`)
);
