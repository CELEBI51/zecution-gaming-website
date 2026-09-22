CREATE TABLE "quote_photos" (
  "id" UUID NOT NULL,
  "quote_id" UUID NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "data" BYTEA NOT NULL,
  "sort_order" INTEGER NOT NULL,
  CONSTRAINT "quote_photos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quote_photos_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "quote_photos_quote_id_idx" ON "quote_photos"("quote_id");
