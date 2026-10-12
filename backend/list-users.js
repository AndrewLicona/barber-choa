const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== USERS ===');
  // Usamos el nombre de tabla sin comillas entre comillas dobles, usando el modelo
  const users = await prisma.user.findMany({
    select: { id: true, email: true, auth_user_id: true, role: true, is_active: true },
    orderBy: { id: 'asc' }
  });
  console.log(JSON.stringify(users, null, 2));
  
  console.log('\n=== USER_BUSINESS_ACCESS ===');
  const access = await prisma.$queryRaw`SELECT * FROM "user_business_access" ORDER BY id;`;
  console.log(JSON.stringify(access, null, 2));
  
  console.log('\n=== BUSINESSES ===');
  const businesses = await prisma.$queryRaw`SELECT id, slug, name, business_type FROM "businesses" ORDER BY id;`;
  console.log(JSON.stringify(businesses, null, 2));
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});