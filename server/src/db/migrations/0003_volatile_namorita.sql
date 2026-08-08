ALTER TABLE "campaigns" ALTER COLUMN "scheduled_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "sent_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "email_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "email_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "email_logs" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "email_logs" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "event_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "event_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_owner_id_unique" UNIQUE("owner_id");