CREATE TABLE `appVersions` (
		`id` int AUTO_INCREMENT NOT NULL,
		`versionName` varchar(40) NOT NULL,
		`versionCode` int NOT NULL,
		`apkUrl` varchar(1000) NOT NULL,
		`releaseNotes` text,
		`minimumVersionCode` int NOT NULL,
		`forceUpdate` boolean NOT NULL DEFAULT false,
		`releaseDate` timestamp NOT NULL DEFAULT (now()),
		`apkSize` varchar(40),
		`status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		CONSTRAINT `appVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bloodDonors` (
		`id` int AUTO_INCREMENT NOT NULL,
		`userId` int NOT NULL,
		`name` varchar(160) NOT NULL,
		`bloodGroup` varchar(5) NOT NULL,
		`area` varchar(120) NOT NULL,
		`phone` varchar(24) NOT NULL,
		`isAvailable` boolean NOT NULL DEFAULT true,
		`note` varchar(500),
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `bloodDonors_id` PRIMARY KEY(`id`),
		CONSTRAINT `bloodDonors_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
		`id` int AUTO_INCREMENT NOT NULL,
		`name` varchar(120) NOT NULL,
		`slug` varchar(120) NOT NULL,
		`icon` varchar(80),
		`sortOrder` int NOT NULL DEFAULT 0,
		`isActive` boolean NOT NULL DEFAULT true,
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `categories_id` PRIMARY KEY(`id`),
		CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
		`id` int AUTO_INCREMENT NOT NULL,
		`postId` int NOT NULL,
		`authorId` int NOT NULL,
		`parentId` int,
		`body` varchar(1000) NOT NULL,
		`status` enum('visible','hidden','removed') NOT NULL DEFAULT 'visible',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emergencyRequests` (
		`id` int AUTO_INCREMENT NOT NULL,
		`authorId` int,
		`type` varchar(80) NOT NULL,
		`bloodGroup` varchar(5),
		`requiredAmount` varchar(40),
		`hospital` varchar(240),
		`location` varchar(300),
		`contact` varchar(80) NOT NULL,
		`urgency` enum('normal','urgent','critical') NOT NULL DEFAULT 'urgent',
		`message` text,
		`status` enum('open','closed') NOT NULL DEFAULT 'open',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `emergencyRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationTokens` (
		`id` int AUTO_INCREMENT NOT NULL,
		`userId` int NOT NULL,
		`token` varchar(512) NOT NULL,
		`platform` varchar(30) NOT NULL,
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `notificationTokens_id` PRIMARY KEY(`id`),
		CONSTRAINT `notification_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
		`id` int AUTO_INCREMENT NOT NULL,
		`userId` int,
		`title` varchar(180) NOT NULL,
		`message` varchar(1000) NOT NULL,
		`deepLink` varchar(500),
		`targetType` varchar(40) NOT NULL DEFAULT 'system',
		`isRead` boolean NOT NULL DEFAULT false,
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordRecoveryRequests` (
		`id` int AUTO_INCREMENT NOT NULL,
		`phone` varchar(24) NOT NULL,
		`note` varchar(500),
		`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `passwordRecoveryRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
		`id` int AUTO_INCREMENT NOT NULL,
		`authorId` int,
		`category` varchar(80) NOT NULL DEFAULT 'সাধারণ',
		`title` varchar(180),
		`content` text,
		`imageUrls` text,
		`location` varchar(300),
		`contact` varchar(80),
		`lostFoundType` varchar(80),
		`isPinned` boolean NOT NULL DEFAULT false,
		`status` enum('published','hidden','removed') NOT NULL DEFAULT 'published',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
		`id` int AUTO_INCREMENT NOT NULL,
		`postId` int NOT NULL,
		`userId` int NOT NULL,
		`type` varchar(30) NOT NULL DEFAULT 'like',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		CONSTRAINT `reactions_id` PRIMARY KEY(`id`),
		CONSTRAINT `reactions_post_user_unique` UNIQUE(`postId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
		`id` int AUTO_INCREMENT NOT NULL,
		`reporterId` int,
		`targetType` varchar(40) NOT NULL,
		`targetId` int NOT NULL,
		`reason` varchar(120) NOT NULL,
		`note` varchar(500),
		`status` enum('open','dismissed','resolved') NOT NULL DEFAULT 'open',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`resolvedAt` timestamp,
		CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
		`id` int AUTO_INCREMENT NOT NULL,
		`serviceId` int NOT NULL,
		`userId` int NOT NULL,
		`rating` int NOT NULL,
		`body` varchar(1000),
		`status` enum('visible','hidden','removed') NOT NULL DEFAULT 'visible',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
		CONSTRAINT `reviews_service_user_unique` UNIQUE(`serviceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `services` (
		`id` int AUTO_INCREMENT NOT NULL,
		`categoryId` int,
		`submittedBy` int,
		`name` varchar(180) NOT NULL,
		`shortDescription` varchar(500),
		`description` text,
		`phone` varchar(24),
		`address` varchar(300),
		`openingHours` varchar(300),
		`mapUrl` varchar(1000),
		`imageUrl` varchar(1000),
		`averageRating` decimal(3,2) NOT NULL DEFAULT '0.00',
		`reviewCount` int NOT NULL DEFAULT 0,
		`status` enum('pending','published','rejected') NOT NULL DEFAULT 'published',
		`createdAt` timestamp NOT NULL DEFAULT (now()),
		`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(24);--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `profileImageUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `isPostingRestricted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_ci_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `app_versions_code_idx` ON `appVersions` (`versionCode`,`status`);--> statement-breakpoint
CREATE INDEX `blood_donors_group_area_idx` ON `bloodDonors` (`bloodGroup`,`area`);--> statement-breakpoint
CREATE INDEX `comments_post_idx` ON `comments` (`postId`);--> statement-breakpoint
CREATE INDEX `emergency_blood_idx` ON `emergencyRequests` (`bloodGroup`,`status`);--> statement-breakpoint
CREATE INDEX `notification_tokens_user_idx` ON `notificationTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `posts_feed_idx` ON `posts` (`isPinned`,`createdAt`);--> statement-breakpoint
CREATE INDEX `posts_category_idx` ON `posts` (`category`);--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reviews_service_idx` ON `reviews` (`serviceId`);--> statement-breakpoint
CREATE INDEX `services_category_idx` ON `services` (`categoryId`);--> statement-breakpoint
CREATE INDEX `services_status_idx` ON `services` (`status`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone`);
