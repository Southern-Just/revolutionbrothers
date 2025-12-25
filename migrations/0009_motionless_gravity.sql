CREATE TYPE "public"."transaction_status" AS ENUM('verified', 'pending', 'declined');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('chairperson', 'secretary', 'treasurer', 'member');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transaction_status" "transaction_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_role" "user_role" DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."member_role";