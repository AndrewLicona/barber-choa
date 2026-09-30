// Eliminar workers duplicados (quedarse con el más reciente por nombre+business_type)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dedupe() {
  console.log('🔄 Deduplicando workers...\n');

  const businesses = await prisma.business.findMany();
  for (const biz of businesses) {
    const workers = await prisma.worker.findMany({
      where: { business_id: biz.id },
      orderBy: { created_at: 'desc' },
    });

    // Agrupa por nombre
    const byName: Record<string, typeof workers> = {};
    for (const w of workers) {
      (byName[w.name] = byName[w.name] || []).push(w);
    }

    for (const [name, ws] of Object.entries(byName)) {
      if (ws.length > 1) {
        // Mantener el más reciente (primero en la lista ordenada desc)
        const toDelete = ws.slice(1);
        for (const w of toDelete) {
          await prisma.schedule.deleteMany({ where: { worker_id: w.id } });
          await prisma.worker.delete({ where: { id: w.id } });
          console.log(`🗑️  Eliminado duplicado: ${w.name} (${w.id}) de ${biz.slug}`);
        }
      }
    }

    // Ver final
    const remaining = await prisma.worker.findMany({ where: { business_id: biz.id } });
    console.log(`\n✅ ${biz.slug}: ${remaining.map(w => w.name).join(', ')}`);
  }

  console.log('\n✅ Deduplicación completada!');
}

dedupe().catch(console.error).finally(() => prisma.$disconnect());
