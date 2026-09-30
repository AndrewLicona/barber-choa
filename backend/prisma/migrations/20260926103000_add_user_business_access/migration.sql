-- Access grants link a Supabase Auth account to one business or both businesses.
-- A SUPERADMIN grant has a NULL business_id and may administer every business.

DO $$ BEGIN
  CREATE TYPE "BusinessAccessRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'WORKER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_key" ON "users"("auth_user_id");

CREATE TABLE IF NOT EXISTS "user_business_access" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "auth_user_id" UUID NOT NULL,
  "business_id" UUID,
  "role" "BusinessAccessRole" NOT NULL DEFAULT 'ADMIN',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_business_access_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_business_access_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "user_business_access_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_business_access_auth_user_id_business_id_key"
  ON "user_business_access"("auth_user_id", "business_id");
CREATE INDEX IF NOT EXISTS "user_business_access_auth_user_id_is_active_idx"
  ON "user_business_access"("auth_user_id", "is_active");
CREATE INDEX IF NOT EXISTS "user_business_access_business_id_role_idx"
  ON "user_business_access"("business_id", "role");

ALTER TABLE "user_business_access" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own business access" ON "user_business_access";
CREATE POLICY "Read own business access" ON "user_business_access"
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id AND is_active = true);

-- No client-side INSERT, UPDATE or DELETE policy is created. Grants are provisioned
-- by a reviewed server-side/admin process only.
