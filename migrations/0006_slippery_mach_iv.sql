DROP TABLE "contributions" CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "month" varchar(7) NOT NULL;