const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect().then(async () => {
  const workers = await p.worker.findMany({ 
    select: { id: true, name: true, is_active: true, business_id: true, business_type: true } 
  });
  console.log(JSON.stringify(workers, null, 2));
  await p.$disconnect();
}).catch(e => { console.error(e); p.$disconnect(); });