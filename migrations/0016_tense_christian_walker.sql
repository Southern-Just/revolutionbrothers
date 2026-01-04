CREATE TYPE "public"."investment_status" AS ENUM('suggested', 'approved', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "investment_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"details" text,
	"cost" varchar(50),
	"time" varchar(50),
	"return" varchar(50),
	"suggester_id" uuid NOT NULL,
	"status" "investment_status" DEFAULT 'suggested' NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"in_charge" uuid[],
	"progress" integer,
	"amount_invested" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investment_votes" ADD CONSTRAINT "investment_votes_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_votes" ADD CONSTRAINT "investment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_suggester_id_users_id_fk" FOREIGN KEY ("suggester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_vote" ON "investment_votes" USING btree ("investment_id","user_id");