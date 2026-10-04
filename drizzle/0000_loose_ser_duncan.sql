CREATE TABLE `acceptanceStages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`scheduleTaskId` int,
	`title` varchar(255) NOT NULL,
	`status` enum('pending','submitted','accepted','changes_requested') NOT NULL DEFAULT 'pending',
	`amount` decimal(14,2) NOT NULL DEFAULT '0',
	`holdback` decimal(14,2) NOT NULL DEFAULT '0',
	`comment` text,
	`submittedAt` datetime,
	`acceptedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `acceptanceStages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billingEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`userId` int,
	`status` enum('received','fulfilled','ignored','failed') NOT NULL DEFAULT 'received',
	`providerObjectId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `billingEvents_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `documentAudit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`actorId` int,
	`action` varchar(80) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planCode` enum('free','estimate','project','brigade','studio') NOT NULL,
	`providerCustomerId` varchar(255),
	`providerSubscriptionId` varchar(255),
	`providerPaymentId` varchar(255),
	`status` enum('active','processing','cancelled','past_due') NOT NULL DEFAULT 'active',
	`currentPeriodEnd` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entitlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimateCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estimateCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimateItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` decimal(12,3) NOT NULL DEFAULT '1',
	`unit` varchar(32) NOT NULL,
	`price` decimal(14,2) NOT NULL DEFAULT '0',
	`source` enum('manual','pdf','scan','ai') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimateItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`code` enum('free','estimate','project','brigade','studio') NOT NULL DEFAULT 'free',
	`projectsUsed` int NOT NULL DEFAULT 0,
	`periodStart` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('contract','invoice','act') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('draft','sent','signed','cancelled') NOT NULL DEFAULT 'draft',
	`fileUrl` text,
	`signedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`url` text NOT NULL,
	`kind` enum('design_project','price_list','room_photo','acceptance_photo','document','other') NOT NULL DEFAULT 'other',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int,
	`invitedEmail` varchar(320),
	`invitedPhone` varchar(32),
	`role` enum('owner','foreman','contractor','designer','client') NOT NULL,
	`inviteToken` varchar(80),
	`joinedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `projectMembers_inviteToken_unique` UNIQUE(`inviteToken`)
);
--> statement-breakpoint
CREATE TABLE `projectMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`authorId` int NOT NULL,
	`channel` enum('team','foreman_client','designer_client','general') NOT NULL DEFAULT 'general',
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(120) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`workType` varchar(120) NOT NULL,
	`status` enum('draft','in_progress','review','completed','archived') NOT NULL DEFAULT 'draft',
	`deadline` datetime,
	`budget` decimal(14,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduleTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`startsAt` datetime,
	`endsAt` datetime,
	`status` enum('planned','in_progress','done','blocked') NOT NULL DEFAULT 'planned',
	`paymentMilestone` decimal(14,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduleTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
