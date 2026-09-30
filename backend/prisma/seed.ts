// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seeding de Base de Datos para Barber Choa...');

  // 1. Crear Negocio: Barbería Choa
  const barberia = await prisma.business.upsert({
    where: { slug: 'barberia' },
    update: {},
    create: {
      slug: 'barberia',
      name: 'Barber Choa Studio',
      business_type: 'barberia',
      description: 'Maestría & Navaja Tradicional. Atención por orden de llegada y citas VIP.',
      address: 'Calle 45 #23-10, Local 102',
      phone: '+573001234567',
      instagram_url: 'https://instagram.com/barberchoa',
      logo_url: '/logo_barberchoa.jpg',
    },
  });

  // 2. Crear Negocio: Manicura Choa
  const manicura = await prisma.business.upsert({
    where: { slug: 'manicura' },
    update: {},
    create: {
      slug: 'manicura',
      name: 'Choa Nails & Spa Studio',
      business_type: 'manicura',
      description: 'Manicura rusa, Soft Gel y Nail Art de alta costura.',
      address: 'Calle 45 #23-10, Local 104',
      phone: '+573009876543',
      instagram_url: 'https://instagram.com/choanails',
      logo_url: '/logo_barberchoa.jpg',
    },
  });

  // 3. Crear Usuario Dueño / Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@barberchoa.com' },
    update: {},
    create: {
      email: 'admin@barberchoa.com',
      password_hash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // hash de ejemplo
      role: 'SUPERADMIN',
    },
  });

  // 4. Crear Profesionales
  // Barbero Maestro (Sillón en vivo)
  const masterBarber = await prisma.worker.create({
    data: {
      business_id: barberia.id,
      name: 'David Choa',
      phone: '+573001234567',
      bio: 'Master Barber con más de 10 años de experiencia en cortes clásicos y degradados.',
      accepts_appointments: false, // Turno en vivo
      business_type: 'barberia',
      is_active: true,
      avatar_url: '/logo_barberchoa.jpg',
    },
  });

  // Barbero Colaborador (Cita previa)
  const collabBarber = await prisma.worker.create({
    data: {
      business_id: barberia.id,
      name: 'Mateo Fade',
      phone: '+573112223344',
      bio: 'Especialista en degradados modernos, diseños freestyle y perfilado de barba.',
      accepts_appointments: true,
      business_type: 'barberia',
      is_active: true,
      avatar_url: '/logo_barberchoa.jpg',
    },
  });

  // Manicurista
  const nailArtist = await prisma.worker.create({
    data: {
      business_id: manicura.id,
      name: 'Valentina Nails',
      phone: '+573009876543',
      bio: 'Especialista en manicura rusa combinada, nivelación y diseños a mano alzada.',
      accepts_appointments: true,
      business_type: 'manicura',
      is_active: true,
      avatar_url: '/logo_barberchoa.jpg',
    },
  });

  // 5. Crear Horarios semanales para el barbero con cita
  for (let day = 1; day <= 6; day++) {
    await prisma.schedule.create({
      data: {
        worker_id: collabBarber.id,
        day_of_week: day,
        start_time: '09:00',
        end_time: '19:00',
        break_start: '13:00',
        break_end: '14:00',
        is_active: true,
      },
    });
  }

  // 6. Crear Servicios de Barbería
  await prisma.service.createMany({
    data: [
      {
        business_id: barberia.id,
        title: 'Corte Clásico & Degradado',
        description: 'Lavado exfoliante, degradado preciso, perfilado de cejas y peinado con pomada mate.',
        price: 25000,
        duration_minutes: 35,
        business_type: 'barberia',
      },
      {
        business_id: barberia.id,
        title: 'Ritual de Barba con Toalla Caliente',
        description: 'Vapor de ozono, toalla caliente aromatizada con eucalipto, perfilado a navaja y aceite hidratante.',
        price: 18000,
        duration_minutes: 25,
        business_type: 'barberia',
      },
      {
        business_id: barberia.id,
        title: 'Servicio Completo VIP Choa',
        description: 'Corte personalizado + Ritual de Barba + Mascarilla facial de carbón activo y tónico relajante.',
        price: 40000,
        duration_minutes: 60,
        business_type: 'barberia',
      },
    ],
  });

  // 7. Crear Servicios de Manicura
  await prisma.service.createMany({
    data: [
      {
        business_id: manicura.id,
        title: 'Manicura Rusa Combinada',
        description: 'Limpieza profunda de cutícula con torno, nivelación con base rubber y esmaltado semipermanente.',
        price: 45000,
        duration_minutes: 60,
        business_type: 'manicura',
      },
      {
        business_id: manicura.id,
        title: 'Extensiones Soft Gel Express',
        description: 'Tips de gel ultra livianos de larga duración con esmaltado liso.',
        price: 70000,
        duration_minutes: 90,
        business_type: 'manicura',
      },
    ],
  });

  // 8. Crear Settings iniciales (usar upsert para no fallar si ya existen)
  const settingsData = [
    { key: 'business_name', value: 'Barber Choa Studio' },
    { key: 'owner_phone', value: '+573001234567' },
    { key: 'business_address', value: 'Calle 45 #23-10, Local 102' },
    { key: 'instagram_url', value: 'https://instagram.com/barberchoa' },
  ];
  for (const s of settingsData) {
    await prisma.businessSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('✅ Base de datos sembrada con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
