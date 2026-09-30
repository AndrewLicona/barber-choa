import crypto from 'node:crypto';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: resolve(process.cwd(), '../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Falta la configuración pública de Supabase en frontend/.env.local.');
}

const profiles = [
  { email: 'superadmin.choa@choastudio.test', name: 'Superadministrador de prueba', accessRole: 'SUPERADMIN', appRole: 'SUPERADMIN' },
  { email: 'admin.barberia@choastudio.test', name: 'Administrador Barber Choa', accessRole: 'ADMIN', appRole: 'ADMIN', businessSlug: 'barberia' },
  { email: 'admin.manicura@choastudio.test', name: 'Administradora LM Nails', accessRole: 'ADMIN', appRole: 'ADMIN', businessSlug: 'manicura' },
  { email: 'trabajador.barberia@choastudio.test', name: 'Barbero de prueba', accessRole: 'WORKER', appRole: 'WORKER_AGENDA', businessSlug: 'barberia', worker: true },
  { email: 'trabajador.manicura@choastudio.test', name: 'Manicurista de prueba', accessRole: 'WORKER', appRole: 'WORKER_AGENDA', businessSlug: 'manicura', worker: true },
];

const prisma = new PrismaClient();

function createPassword() {
  return `Choa-${crypto.randomBytes(9).toString('base64url')}-2026`;
}

async function createAuthUser(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.user?.id) {
    throw new Error(`No se pudo crear ${email}: ${payload.msg || payload.message || 'error desconocido'}`);
  }
  return payload.user.id;
}

async function provisionProfile(profile) {
  const password = createPassword();
  const authUserId = profile.authUserId || await createAuthUser(profile.email, password);
  const appUserId = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO "users" ("id", "email", "auth_user_id", "password_hash", "role", "is_active", "created_at", "updated_at")
    VALUES (${appUserId}::uuid, ${profile.email}, ${authUserId}::uuid, 'supabase-auth-managed', ${profile.appRole}::"Role", true, NOW(), NOW())
    ON CONFLICT ("email") DO UPDATE
    SET "auth_user_id" = EXCLUDED."auth_user_id", "role" = EXCLUDED."role", "is_active" = true, "updated_at" = NOW()
  `;

  const users = await prisma.$queryRaw`
    SELECT "id" FROM "users" WHERE "auth_user_id" = ${authUserId}::uuid LIMIT 1
  `;
  const userId = users[0]?.id;
  if (!userId) throw new Error(`No se pudo vincular el usuario interno para ${profile.email}.`);

  if (profile.accessRole === 'SUPERADMIN') {
    await prisma.$executeRaw`DELETE FROM "user_business_access" WHERE "auth_user_id" = ${authUserId}::uuid AND "business_id" IS NULL`;
    await prisma.$executeRaw`
      INSERT INTO "user_business_access" ("id", "user_id", "auth_user_id", "business_id", "role", "is_active", "created_at", "updated_at")
      VALUES (${crypto.randomUUID()}::uuid, ${userId}::uuid, ${authUserId}::uuid, NULL, 'SUPERADMIN'::"BusinessAccessRole", true, NOW(), NOW())
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "user_business_access" ("id", "user_id", "auth_user_id", "business_id", "role", "is_active", "created_at", "updated_at")
      SELECT ${crypto.randomUUID()}::uuid, ${userId}::uuid, ${authUserId}::uuid, "id", ${profile.accessRole}::"BusinessAccessRole", true, NOW(), NOW()
      FROM "businesses" WHERE "slug" = ${profile.businessSlug}
      ON CONFLICT ("auth_user_id", "business_id") DO UPDATE
      SET "role" = EXCLUDED."role", "is_active" = true, "updated_at" = NOW()
    `;
  }

  if (profile.worker) {
    await prisma.$executeRaw`
      INSERT INTO "workers" ("id", "user_id", "business_id", "name", "phone", "business_type", "accepts_appointments", "is_active", "is_public", "created_at", "updated_at")
      SELECT ${crypto.randomUUID()}::uuid, ${userId}::uuid, "id", ${profile.name}, '', "business_type", true, true, true, NOW(), NOW()
      FROM "businesses" WHERE "slug" = ${profile.businessSlug}
      ON CONFLICT ("user_id") DO NOTHING
    `;
  }

  return { email: profile.email, password, role: profile.accessRole, business: profile.businessSlug || 'ambos negocios' };
}

async function main() {
  const created = [];
  for (const profile of profiles) created.push(await provisionProfile(profile));
  console.table(created);
  console.log('Guarda estas credenciales de prueba en un lugar seguro y elimínalas cuando finalicen las pruebas.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
