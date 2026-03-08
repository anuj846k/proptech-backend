DROP INDEX "property_name_owner_idx";--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "property_name_owner_idx" UNIQUE("name","owner_id");