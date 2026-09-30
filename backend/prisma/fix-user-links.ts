import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Vinculando usuarios Prisma con Supabase Auth IDs...\n');

  // 1. Actualizar auth_user_id en users
  const updates = [
    { email: 'david@barberchoa.com', auth_user_id: 'c084b8e0-0f1d-4cd4-9b75-06bef8418e4e' },
    { email: 'mateo@barberchoa.com', auth_user_id: '15dfe3b6-26a1-45f7-8ac5-7a1f2bcc89f0' },
    { email: 'valentina@lmnails.com', auth_user_id: '34673881-f798-4d85-8f0a-38200e28448b' },
  ];

  for (const u of updates) {
    const user = await prisma.user.findUnique({ where: { email: u.email } });
    if (user) {
      await prisma.user.update({
        where: { email: u.email },
        data: { auth_user_id: u.auth_user_id },
      });
      console.log(`✅ User: ${u.email} → auth_id: ${u.auth_user_id.substring(0, 8)}`);
    } else {
      console.log(`⚠️ User no encontrado: ${u.email}`);
    }
  }

  // 2. Vincular Workers a Users (user_id en Worker → Prisma User.id)
  const barberia = await prisma.business.findUnique({ where: { slug: 'barberia' } });
  const manicura = await prisma.business.findUnique({ where: { slug: 'manicura' } });

  const davidUser = await prisma.user.findUnique({ where: { email: 'david@barberchoa.com' } });
  const mateoUser = await prisma.user.findUnique({ where: { email: 'mateo@barberchoa.com' } });
  const valentinaUser = await prisma.user.findUnique({ where: { email: 'valentina@lmnails.com' } });

  console.log('\n📋 Vincular Workers a Users:');

  if (barberia) {
    const workersBarberia = await prisma.worker.findMany({ where: { business_id: barberia.id } });
    console.log('Barbería workers:', workersBarberia.map(w => `${w.name} (user_id=${w.user_id})`).join(', '));

    for (const w of workersBarberia) {
      if (w.name === 'David Choa' && davidUser) {
        await prisma.worker.update({ where: { id: w.id }, data: { user_id: davidUser.id } });
        console.log(`✅ David worker → user_id: ${davidUser.id}`);
      }
      if (w.name === 'Mateo Fade' && mateoUser) {
        await prisma.worker.update({ where: { id: w.id }, data: { user_id: mateoUser.id } });
        console.log(`✅ Mateo worker → user_id: ${mateoUser.id}`);
      }
    }
  }

  if (manicura) {
    const workersManicura = await prisma.worker.findMany({ where: { business_id: manicura.id } });
    console.log('Manicura workers:', workersManicura.map(w => `${w.name} (user_id=${w.user_id})`).join(', '));

    for (const w of workersManicura) {
      if (w.name === 'Valentina Nails' && valentinaUser) {
        await prisma.worker.update({ where: { id: w.id }, data: { user_id: valentinaUser.id } });
        console.log(`✅ Valentina worker → user_id: ${valentinaUser.id}`);
      }
    }
  }

  console.log('\n🎉 Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
