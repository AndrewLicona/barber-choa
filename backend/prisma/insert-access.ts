import { PrismaClient, Role, BusinessAccessRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const barberia = await prisma.business.findUnique({ where: { slug: 'barberia' } });
  const manicura = await prisma.business.findUnique({ where: { slug: 'manicura' } });
  console.log('barberia id:', barberia?.id);
  console.log('manicura id:', manicura?.id);

  const records = [
    { auth_user_id: 'c084b8e0-0f1d-4cd4-9b75-06bef8418e4e', business_id: barberia!.id, role: 'ADMIN' as Role },
    { auth_user_id: '15dfe3b6-26a1-45f7-8ac5-7a1f2bcc89f0', business_id: barberia!.id, role: 'WORKER' as BusinessAccessRole },
    { auth_user_id: '34673881-f798-4d85-8f0a-38200e28448b', business_id: manicura!.id, role: 'ADMIN' as Role },
  ];

  for (const r of records) {
    try {
      const existing = await prisma.userBusinessAccess.findFirst({
        where: { auth_user_id: r.auth_user_id, business_id: r.business_id },
      });
      if (!existing) {
        await prisma.userBusinessAccess.create({
          data: r,
        });
        console.log('Created access:', r.auth_user_id.substring(0, 8), r.role);
      } else {
        console.log('Already exists:', r.auth_user_id.substring(0, 8));
      }
    } catch (e: any) {
      console.error('Error:', e.message);
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
