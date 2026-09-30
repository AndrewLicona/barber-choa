import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const davidUser = await prisma.user.findUnique({ where: { email: 'david@barberchoa.com' } });
  const barberia = await prisma.business.findUnique({ where: { slug: 'barberia' } });

  const choaWorker = await prisma.worker.findFirst({ where: { business_id: barberia!.id, name: 'Choa' } });
  if (choaWorker && davidUser) {
    await prisma.worker.update({ where: { id: choaWorker.id }, data: { user_id: davidUser.id } });
    console.log('David Choa worker linked:', choaWorker.id);
  }

  const davidWorker = await prisma.worker.findFirst({ where: { user_id: davidUser!.id } });
  console.log('David user worker:', davidWorker?.name, davidWorker?.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
