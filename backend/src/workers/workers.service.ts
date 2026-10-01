import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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
        user: { select: { id: true, email: true, role: true } },
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
        user: { select: { id: true, email: true, role: true } },
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
    email?: string;
    password?: string;
  }) {
    const business = await this.prisma.business.findUnique({ where: { id: data.business_id } });

    if (!business) {
      throw new NotFoundException('No se encontró el negocio solicitado');
    }

    // 1. Generar credenciales de acceso para el barbero
    const slugName = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const barberEmail =
      data.email?.toLowerCase().trim() ||
      `${slugName || 'barbero'}${randomDigits}@barberchoa.com`;
    const barberPassword =
      data.password?.trim() || `Choa${Math.floor(1000 + Math.random() * 9000)}!`;

    // 2. Crear usuario asociado
    let user = await this.prisma.user.findUnique({ where: { email: barberEmail } });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(barberPassword, salt);
      user = await this.prisma.user.create({
        data: {
          email: barberEmail,
          password_hash: passwordHash,
          role: 'WORKER_WALKIN',
          is_active: true,
        },
      });
    }

    // 3. Crear registro del trabajador
    const worker = await this.prisma.worker.create({
      data: {
        business_id: business.id,
        user_id: user.id,
        name: data.name.trim(),
        phone: data.phone.trim(),
        bio: data.bio?.trim() || null,
        business_type: business.business_type,
        accepts_appointments: data.accepts_appointments ?? true,
        avatar_url:
          data.avatar_url ||
          (business.business_type === 'manicura'
            ? '/logo_lmnail.jpg'
            : '/logo_barberchoa.jpg'),
        is_active: true,
      },
      include: { business: true },
    });

    // 4. Crear acceso al negocio con rol WORKER
    try {
      await this.prisma.userBusinessAccess.upsert({
        where: {
          auth_user_id_business_id: {
            auth_user_id: user.id,
            business_id: business.id,
          },
        },
        update: { role: 'WORKER', is_active: true },
        create: {
          user_id: user.id,
          auth_user_id: user.id,
          business_id: business.id,
          role: 'WORKER',
          is_active: true,
        },
      });
    } catch (e) {
      console.warn('Could not upsert userBusinessAccess:', e);
    }

    // 5. Crear horario estándar de lunes a sábado (09:00 a 18:00)
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

    return {
      ...worker,
      credentials: {
        email: barberEmail,
        password: barberPassword,
      },
    };
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

  async resetCredentials(id: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: { user: true, business: true },
    });

    if (!worker) {
      throw new NotFoundException(`Barbero no encontrado`);
    }

    const slugName = worker.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const barberEmail = worker.user?.email || `${slugName || 'barbero'}${randomDigits}@barberchoa.com`;
    const newPassword = `Choa${Math.floor(1000 + Math.random() * 9000)}!`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    let user = worker.user;
    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { password_hash: passwordHash, is_active: true },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: barberEmail,
          password_hash: passwordHash,
          role: 'WORKER_WALKIN',
          is_active: true,
        },
      });
      await this.prisma.worker.update({
        where: { id: worker.id },
        data: { user_id: user.id },
      });
    }

    try {
      await this.prisma.userBusinessAccess.upsert({
        where: {
          auth_user_id_business_id: {
            auth_user_id: user.id,
            business_id: worker.business_id,
          },
        },
        update: { role: 'WORKER', is_active: true },
        create: {
          user_id: user.id,
          auth_user_id: user.id,
          business_id: worker.business_id,
          role: 'WORKER',
          is_active: true,
        },
      });
    } catch (e) {
      console.warn('Could not upsert userBusinessAccess in resetCredentials:', e);
    }

    return {
      workerId: worker.id,
      workerName: worker.name,
      credentials: {
        email: user.email,
        password: newPassword,
      },
    };
  }
}
