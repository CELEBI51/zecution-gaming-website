CREATE TYPE "QuoteStatus" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'COMPLETED');
CREATE TYPE "QuoteType" AS ENUM ('VEHICLE', 'MAP', 'MODIFICATION', 'MODEL', 'OTHER');

CREATE TABLE "quote_requests" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "game" VARCHAR(120) NOT NULL,
    "type" "QuoteType" NOT NULL,
    "description" VARCHAR(10000) NOT NULL,
    "reference_url" VARCHAR(2000),
    "budget" VARCHAR(120),
    "desired_date" VARCHAR(10),
    "status" "QuoteStatus" NOT NULL DEFAULT 'NEW',
    "admin_notes" VARCHAR(10000) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quote_requests_submission_id_key" ON "quote_requests"("submission_id");
CREATE INDEX "quote_requests_status_created_at_idx" ON "quote_requests"("status", "created_at");
CREATE INDEX "quote_requests_created_at_idx" ON "quote_requests"("created_at");
