-- CreateTable
CREATE TABLE IF NOT EXISTS "content_reactions" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "client_ip" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "content_reviews" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "author_name" VARCHAR(100) NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT NOT NULL,
    "client_ip" VARCHAR(64),
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "content_reactions_content_id_emoji_client_ip_key" ON "content_reactions"("content_id", "emoji", "client_ip");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "content_reactions_content_id_idx" ON "content_reactions"("content_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "content_reviews_content_id_created_at_idx" ON "content_reviews"("content_id", "created_at");

-- AddForeignKey
ALTER TABLE "content_reactions" DROP CONSTRAINT IF EXISTS "content_reactions_content_id_fkey";
ALTER TABLE "content_reactions" ADD CONSTRAINT "content_reactions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reviews" DROP CONSTRAINT IF EXISTS "content_reviews_content_id_fkey";
ALTER TABLE "content_reviews" ADD CONSTRAINT "content_reviews_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
