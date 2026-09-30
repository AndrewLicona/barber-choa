-- Phase 2: editable business, professional and service content.
-- This migration is additive and does not delete existing production data.

ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "hero_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "map_url" TEXT,
  ADD COLUMN IF NOT EXISTS "booking_message" TEXT,
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Bogota';

ALTER TABLE "workers"
  ADD COLUMN IF NOT EXISTS "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "display_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "requires_appointment" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "display_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "worker_services" (
  "worker_id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "worker_services_pkey" PRIMARY KEY ("worker_id", "service_id"),
  CONSTRAINT "worker_services_worker_id_fkey"
    FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "worker_services_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "worker_services_service_id_idx" ON "worker_services"("service_id");
CREATE INDEX IF NOT EXISTS "services_business_id_is_public_display_order_idx"
  ON "services"("business_id", "is_public", "display_order");
CREATE INDEX IF NOT EXISTS "workers_business_id_is_public_display_order_idx"
  ON "workers"("business_id", "is_public", "display_order");
