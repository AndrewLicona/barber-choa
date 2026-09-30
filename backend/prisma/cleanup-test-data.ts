// Script de limpieza: eliminar workers y datos de prueba
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Limpiando datos de prueba...\n');

  // Workers de prueba a eliminar
  const testWorkers = [
    'Barbero de prueba',
    'Juan peluquero',
    'Manicurista de prueba',
  ];

  for (const name of testWorkers) {
    const worker = await prisma.worker.findFirst({ where: { name } });
    if (worker) {
      // Eliminar horarios primero
      await prisma.schedule.deleteMany({ where: { worker_id: worker.id } });
      // Eliminar worker
      await prisma.worker.delete({ where: { id: worker.id } });
      console.log(`✅ Eliminado: ${name} (${worker.id})`);
    } else {
      console.log(`⚠️ No encontrado: ${name}`);
    }
  }

  // Verificar workers reales
  console.log('\n📋 Workers en DB después de limpieza:');
  const remaining = await prisma.worker.findMany({
    select: { id: true, name: true, business_type: true, is_active: true }
  });
  remaining.forEach(w => {
    console.log(`  - ${w.name} | ${w.business_type} | active=${w.is_active}`);
  });

  // Limpiar appointments de prueba si hay
  const appointments = await prisma.appointment.findMany({ take: 5 });
  console.log(`\n📅 Appointments en DB: ${appointments.length}`);

  console.log('\n✅ Limpieza completada!');
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
