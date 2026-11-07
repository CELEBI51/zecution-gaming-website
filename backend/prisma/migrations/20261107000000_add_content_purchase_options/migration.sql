-- AlterTable
ALTER TABLE "contents" ADD COLUMN IF NOT EXISTS "purchase_options" JSONB;
