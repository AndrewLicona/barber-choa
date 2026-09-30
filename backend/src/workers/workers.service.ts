import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessType?: string, businessId?: string) {
    const where: any = {};
    if (businessType) where.business_type = businessType;
    if (businessId) where.business_id = businessId;

    return this.prisma.worker.findMany({
      where,
      include: {
        business: true,
        schedules: { orderBy: { day_of_week: 'asc' } },
      },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async findOne(id: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: {
        business: true,
        schedules: { orderBy: { day_of_week: 'asc' } },
        schedule_exceptions: true,
      },
    });

    if (!worker) {
      throw new NotFoundException(`Especialista con ID ${id} no encontrado`);
    }

    return worker;
  }

  async create(data: {
    name: string;
    phone: string;
    bio?: string;
    business_id: string;
    business_type?: string;
    accepts_appointments?: boolean;
    avatar_url?: string;
  }) {
    const business = await this.prisma.business.findUnique({ where: { id: data.business_id } });

    if (!business) {
      throw new NotFoundException('No se encontró el negocio solicitado');
    }

    const worker = await this.prisma.worker.create({
      data: {
        business_id: business.id,
        name: data.name.trim(),
        phone: data.phone.trim(),
        bio: data.bio?.trim() || null,
        business_type: business.business_type,
        accepts_appointments: data.accepts_appointments ?? true,
        avatar_url: data.avatar_url || (business.business_type === 'manicura' ? '/logo_lmnail.jpg' : '/logo_barberchoa.jpg'),
        is_active: true,
      },
      include: { business: true },
    });

    // Crear horario estándar de lunes a sábado (09:00 a 18:00)
    for (let day = 1; day <= 6; day++) {
      await this.prisma.schedule.create({
        data: {
          worker_id: worker.id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true,
        },
      });
    }

    return worker;
  }

  async update(id: string, data: any) {
    return this.prisma.worker.update({
      where: { id },
      data,
      include: { business: true, schedules: true },
    });
  }

  async remove(id: string) {
    return this.prisma.worker.delete({
      where: { id },
    });
  }
}
