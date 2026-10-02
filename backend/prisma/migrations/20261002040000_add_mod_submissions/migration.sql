-- CreateEnum
CREATE TYPE "ModSubmissionStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "mod_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submission_id" UUID NOT NULL,
    "user_id" UUID,
    "producer_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "discord" VARCHAR(100),
    "title" VARCHAR(150) NOT NULL,
    "game" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL DEFAULT 'Araç',
    "version" VARCHAR(50),
    "description" VARCHAR(10000) NOT NULL,
    "download_url" VARCHAR(2000) NOT NULL,
    "trailer_url" VARCHAR(2000),
    "sale_type" VARCHAR(30) NOT NULL DEFAULT 'FREE',
    "suggested_price" VARCHAR(100),
    "has_permission" BOOLEAN NOT NULL DEFAULT true,
    "status" "ModSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" VARCHAR(10000) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mod_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mod_submission_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submission_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "data" BYTEA NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mod_submission_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mod_submissions_submission_id_key" ON "mod_submissions"("submission_id");

-- CreateIndex
CREATE INDEX "mod_submissions_status_created_at_idx" ON "mod_submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "mod_submissions_created_at_idx" ON "mod_submissions"("created_at");

-- CreateIndex
CREATE INDEX "mod_submissions_user_id_idx" ON "mod_submissions"("user_id");

-- CreateIndex
CREATE INDEX "mod_submission_photos_submission_id_idx" ON "mod_submission_photos"("submission_id");

-- AddForeignKey
ALTER TABLE "mod_submissions" ADD CONSTRAINT "mod_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mod_submission_photos" ADD CONSTRAINT "mod_submission_photos_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "mod_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
