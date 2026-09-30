// Crear usuarios en Supabase Auth y vincular a user_business_access
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  'https://eukuwryssmpkqkiwcufr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a3V3cnlzc21wa3FraXdjdWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY3MzQ5MCwiZXhwIjoyMTA1MjQ5NDkwfQ.4hUFbDT8CPA3ykv_36uxgqxw7WkC0Z3Fn-lrANm6vyY'
);

async function main() {
  console.log('🔐 Creando usuarios en Supabase Auth...\n');

  const users = [
    { email: 'david@barberchoa.com', password: 'BarberChoa2026!', role: 'ADMIN', businessSlug: 'barberia' },
    { email: 'mateo@barberchoa.com', password: 'BarberChoa2026!', role: 'WORKER_AGENDA', businessSlug: 'barberia' },
    { email: 'valentina@lmnails.com', password: 'LMNails2026!', role: 'ADMIN', businessSlug: 'manicura' },
  ];

  const authIds: Record<string, string> = {};

  for (const u of users) {
    // Crear en Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        // Buscar el user existente
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData.users.find(x => x.email === u.email);
        if (existing) {
          authIds[u.email] = existing.id;
          console.log(`ℹ️  Auth ya existe: ${u.email} → ${existing.id}`);
        }
      } else {
        console.log(`❌ Error Auth ${u.email}: ${error.message}`);
      }
    } else if (data.user) {
      authIds[u.email] = data.user.id;
      console.log(`✅ Auth creado: ${u.email} → ${data.user.id}`);
    }

    // Crear/actualizar User en Prisma
    const hash = await bcrypt.hash(u.password, 10);
    const prismaUser = await prisma.user.upsert({
      where: { email: u.email },
      update: { password_hash: hash, role: u.role, is_active: true },
      create: { email: u.email, password_hash: hash, role: u.role, is_active: true },
    });
    console.log(`✅ Prisma user: ${prismaUser.email} (${prismaUser.id})`);
  }

  // Obtener negocios
  const barberia = await prisma.business.findUnique({ where: { slug: 'barberia' } });
  const manicura = await prisma.business.findUnique({ where: { slug: 'manicura' } });

  // Crear user_business_access
  const accessData = [
    { email: 'david@barberchoa.com', businessId: barberia!.id, role: 'ADMIN' },
    { email: 'mateo@barberchoa.com', businessId: barberia!.id, role: 'WORKER' },
    { email: 'valentina@lmnails.com', businessId: manicura!.id, role: 'ADMIN' },
  ];

  for (const acc of accessData) {
    const authUid = authIds[acc.email];
    if (!authUid) { console.log(`⚠️  No auth UID for ${acc.email}`); continue; }

    const existing = await prisma.userBusinessAccess.findFirst({
      where: { auth_user_id: authUid, business_id: acc.businessId },
    });

    if (!existing) {
      await prisma.userBusinessAccess.create({
        data: { auth_user_id: authUid, business_id: acc.businessId, role: acc.role, is_active: true },
      });
      console.log(`✅ Access: ${acc.email} → ${acc.role} (auth: ${authUid})`);
    } else {
      console.log(`ℹ️  Access ya existe: ${acc.email}`);
    }
  }

  console.log('\n🎉 Credenciales creadas:');
  console.log('   david@barberchoa.com  / BarberChoa2026!  (Admin Barbería)');
  console.log('   mateo@barberchoa.com  / BarberChoa2026!  (Worker Barbería)');
  console.log('   valentina@lmnails.com / LMNails2026!     (Admin Manicura)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
