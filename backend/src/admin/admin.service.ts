import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueStatus, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: string;
  workerId?: string;
  businessId?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBusinessId(user: AuthenticatedUser): Promise<string> {
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException('SUPERADMIN debe especificar businessId');
    }
    if (!user.businessId) {
      throw new ForbiddenException('No tienes acceso a ningún negocio');
    }
    return user.businessId;
  }

  private async validateWorkerAccess(user: AuthenticatedUser, workerId: string): Promise<void> {
    const businessId = await this.getBusinessId(user);
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: { business_id: true },
    });
    if (!worker || worker.business_id !== businessId) {
      throw new ForbiddenException('No tienes acceso a este profesional');
    }
  }

  async getQueueByWorker(user: AuthenticatedUser, workerId: string) {
    await this.validateWorkerAccess(user, workerId);

    const queue = await this.prisma.liveQueueItem.findMany({
      where: {
        worker_id: workerId,
        status: { in: [QueueStatus.WAITING, QueueStatus.IN_SERVICE] },
      },
      orderBy: { position: 'asc' },
      include: {
        worker: { select: { name: true } },
      },
    });

    return queue;
  }

  async getAllQueue(user: AuthenticatedUser) {
    const businessId = await this.getBusinessId(user);

    const queue = await this.prisma.liveQueueItem.findMany({
      where: {
        business_id: businessId,
        status: { in: [QueueStatus.WAITING, QueueStatus.IN_SERVICE] },
      },
      orderBy: [{ worker_id: 'asc' }, { position: 'asc' }],
      include: {
        worker: { select: { name: true, business_type: true } },
      },
    });

    return queue;
  }

  async addWalkIn(user: AuthenticatedUser, data: { client_name: string; client_phone?: string; worker_id: string }) {
    await this.validateWorkerAccess(user, data.worker_id);

    const businessId = await this.getBusinessId(user);
    const worker = await this.prisma.worker.findUnique({
      where: { id: data.worker_id },
      select: { id: true, name: true, business_id: true },
    });

    if (!worker || worker.business_id !== businessId) {
      throw new NotFoundException('Profesional no encontrado');
    }

    const activeQueue = await this.prisma.liveQueueItem.findMany({
      where: { worker_id: data.worker_id, status: { in: [QueueStatus.WAITING, QueueStatus.IN_SERVICE] } },
      orderBy: { position: 'asc' },
    });

    const inService = activeQueue.find((q) => q.status === QueueStatus.IN_SERVICE);
    const waiting = activeQueue.filter((q) => q.status === QueueStatus.WAITING);
    const position = waiting.length + 1;
    const estimatedWait = waiting.length * 25 + (inService ? 15 : 0);
    const status = inService ? QueueStatus.WAITING : QueueStatus.IN_SERVICE;

    const item = await this.prisma.liveQueueItem.create({
      data: {
        business_id: businessId,
        worker_id: data.worker_id,
        client_name: data.client_name.trim(),
        client_phone: data.client_phone?.trim() || null,
        status,
        position,
        estimated_wait_minutes: estimatedWait,
      },
      include: { worker: { select: { name: true } } },
    });

    return {
      id: item.id,
      position: status === QueueStatus.IN_SERVICE ? 0 : position,
      estimatedWaitMinutes: estimatedWait,
      status,
      workerName: worker.name,
    };
  }

  async advanceQueue(user: AuthenticatedUser, workerId: string) {
    await this.validateWorkerAccess(user, workerId);

    const inService = await this.prisma.liveQueueItem.findFirst({
      where: { worker_id: workerId, status: QueueStatus.IN_SERVICE },
      orderBy: { position: 'asc' },
    });

    const waitingList = await this.prisma.liveQueueItem.findMany({
      where: { worker_id: workerId, status: QueueStatus.WAITING },
      orderBy: { position: 'asc' },
    });

    if (inService) {
      await this.prisma.liveQueueItem.update({
        where: { id: inService.id },
        data: { status: QueueStatus.FINISHED },
      });
    }

    if (waitingList.length > 0) {
      await this.prisma.liveQueueItem.update({
        where: { id: waitingList[0].id },
        data: { status: QueueStatus.IN_SERVICE },
      });
    }

    return this.getQueueByWorker(user, workerId);
  }

  async removeQueueItem(user: AuthenticatedUser, queueItemId: string) {
    const businessId = await this.getBusinessId(user);

    const item = await this.prisma.liveQueueItem.findUnique({
      where: { id: queueItemId },
      select: { business_id: true, worker_id: true },
    });

    if (!item || item.business_id !== businessId) {
      throw new NotFoundException('Elemento de cola no encontrado');
    }

    await this.prisma.liveQueueItem.update({
      where: { id: queueItemId },
      data: { status: QueueStatus.CANCELLED },
    });

    return { success: true };
  }

  async getWorkersByBusiness(user: AuthenticatedUser) {
    const businessId = await this.getBusinessId(user);

    return this.prisma.worker.findMany({
      where: { business_id: businessId, is_active: true },
      include: {
        schedules: { orderBy: { day_of_week: 'asc' } },
        user: { select: { id: true, email: true, role: true } },
        worker_services: { include: { service: { select: { title: true } } } },
      },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async getServicesByBusiness(user: AuthenticatedUser) {
    const businessId = await this.getBusinessId(user);

    return this.prisma.service.findMany({
      where: { business_id: businessId, is_active: true },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async getPortfolioByBusiness(user: AuthenticatedUser) {
    const businessId = await this.getBusinessId(user);

    return this.prisma.portfolioItem.findMany({
      where: { business_id: businessId, is_active: true },
      include: {
        worker: { select: { name: true } },
        service: { select: { title: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getBusinessSettings(user: AuthenticatedUser) {
    const businessId = await this.getBusinessId(user);

    const settings = await this.prisma.businessSetting.findMany({
      where: { business_id: businessId },
    });

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        instagram_url: true,
        logo_url: true,
        hero_image_url: true,
        map_url: true,
        description: true,
        booking_message: true,
        timezone: true,
        slug: true,
        business_type: true,
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value; });

    return { business, settings: settingsMap };
  }

  async updateBusinessSettings(user: AuthenticatedUser, data: Record<string, any>) {
    const businessId = await this.getBusinessId(user);

    const entries = Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null && value !== '');

    for (const [key, value] of entries) {
      const existing = await this.prisma.businessSetting.findFirst({
        where: { business_id: businessId, key },
      });
      if (existing) {
        await this.prisma.businessSetting.update({
          where: { id: existing.id },
          data: { value: String(value) },
        });
      } else {
        await this.prisma.businessSetting.create({
          data: { business_id: businessId, key, value: String(value) },
        });
      }
    }

    const businessUpdate: Record<string, string | number> = {};
    if (data['business_name']) businessUpdate.name = data['business_name'];
    if (data['whatsapp_number']) businessUpdate.phone = data['whatsapp_number'];
    if (data['address']) businessUpdate.address = data['address'];
    if (data['instagram_url']) businessUpdate.instagram_url = data['instagram_url'];
    if (data['facebook_url']) businessUpdate.facebook_url = data['facebook_url'];
    if (data['tiktok_url']) businessUpdate.tiktok_url = data['tiktok_url'];
    if (data['website_url']) businessUpdate.website_url = data['website_url'];
    if (data['logo_url']) businessUpdate.logo_url = data['logo_url'];
    if (data['description']) businessUpdate.description = data['description'];
    if (data['booking_message']) businessUpdate.booking_message = data['booking_message'];
    if (data['hero_image_url']) businessUpdate.hero_image_url = data['hero_image_url'];
    if (data['map_url']) businessUpdate.map_url = data['map_url'];
    if (data['latitude']) businessUpdate.latitude = data['latitude'];
    if (data['longitude']) businessUpdate.longitude = data['longitude'];
    if (data['timezone']) businessUpdate.timezone = data['timezone'];

    if (Object.keys(businessUpdate).length > 0) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: businessUpdate,
      });
    }

    return this.getBusinessSettings(user);
  }

  async getAppointments(user: AuthenticatedUser) {
    const businessId = await this.getBusinessId(user);
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        business_id: businessId,
        OR: [
          { appointment_date: { gte: now } },
          { appointment_date: { lte: now } },
        ],
      },
      include: {
        worker: { select: { name: true, avatar_url: true } },
        service: { select: { title: true, price: true } },
      },
      orderBy: { appointment_date: 'asc' },
    });
  }

  async createWorker(user: AuthenticatedUser, data: any) {
    const businessId = await this.getBusinessId(user);
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    const slugName = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const barberEmail = data.email?.toLowerCase().trim() || `${slugName || 'barbero'}${randomDigits}@barberchoa.com`;
    const barberPassword = data.password?.trim() || `Choa${Math.floor(1000 + Math.random() * 9000)}!`;

    let userRecord = await this.prisma.user.findUnique({ where: { email: barberEmail } });
    if (!userRecord) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(barberPassword, salt);
      userRecord = await this.prisma.user.create({
        data: {
          email: barberEmail,
          password_hash: passwordHash,
          role: 'WORKER_WALKIN',
          is_active: true,
        },
      });
    }

    const worker = await this.prisma.worker.create({
      data: {
        business_id: businessId,
        user_id: userRecord.id,
        name: data.name.trim(),
        phone: data.phone.trim(),
        bio: data.bio?.trim() || null,
        business_type: business.business_type,
        accepts_appointments: data.accepts_appointments ?? true,
        avatar_url: data.avatar_url || (business.business_type === 'manicura' ? '/logo_lmnail.jpg' : '/logo_barberchoa.jpg'),
        is_active: true,
        // Redes sociales del trabajador
        instagram_url: data.instagram_url?.trim() || null,
        facebook_url: data.facebook_url?.trim() || null,
        tiktok_url: data.tiktok_url?.trim() || null,
      },
      include: { business: true },
    });

    await this.prisma.userBusinessAccess.upsert({
      where: {
        auth_user_id_business_id: {
          auth_user_id: userRecord.id,
          business_id: businessId,
        },
      },
      update: { role: 'WORKER', is_active: true },
      create: {
        user_id: userRecord.id,
        auth_user_id: userRecord.id,
        business_id: businessId,
        role: 'WORKER',
        is_active: true,
      },
    });

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

  async updateWorker(user: AuthenticatedUser, workerId: string, data: any) {
    await this.validateWorkerAccess(user, workerId);

    return this.prisma.worker.update({
      where: { id: workerId },
      data: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        bio: data.bio?.trim() || null,
        accepts_appointments: data.accepts_appointments,
        avatar_url: data.avatar_url?.trim(),
        is_active: data.is_active,
        // Redes sociales del trabajador
        instagram_url: data.instagram_url?.trim() || null,
        facebook_url: data.facebook_url?.trim() || null,
        tiktok_url: data.tiktok_url?.trim() || null,
      },
      include: { business: true, schedules: true },
    });
  }

  async deleteWorker(user: AuthenticatedUser, workerId: string) {
    await this.validateWorkerAccess(user, workerId);
    return this.prisma.worker.delete({ where: { id: workerId } });
  }

  async resetWorkerCredentials(user: AuthenticatedUser, workerId: string) {
    await this.validateWorkerAccess(user, workerId);

    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      include: { user: true, business: true },
    });

    if (!worker) throw new NotFoundException('Profesional no encontrado');

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

    let userRecord = worker.user;
    if (userRecord) {
      userRecord = await this.prisma.user.update({
        where: { id: userRecord.id },
        data: { password_hash: passwordHash, is_active: true },
      });
    } else {
      userRecord = await this.prisma.user.create({
        data: {
          email: barberEmail,
          password_hash: passwordHash,
          role: 'WORKER_WALKIN',
          is_active: true,
        },
      });
      await this.prisma.worker.update({
        where: { id: worker.id },
        data: { user_id: userRecord.id },
      });
    }

    await this.prisma.userBusinessAccess.upsert({
      where: {
        auth_user_id_business_id: {
          auth_user_id: userRecord.id,
          business_id: worker.business_id,
        },
      },
      update: { role: 'WORKER', is_active: true },
      create: {
        user_id: userRecord.id,
        auth_user_id: userRecord.id,
        business_id: worker.business_id,
        role: 'WORKER',
        is_active: true,
      },
    });

    return {
      workerId: worker.id,
      workerName: worker.name,
      credentials: {
        email: userRecord.email,
        password: newPassword,
      },
    };
  }

  async createService(user: AuthenticatedUser, data: any) {
    const businessId = await this.getBusinessId(user);
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    return this.prisma.service.create({
      data: {
        business_id: businessId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        price: Number(data.price),
        duration_minutes: Number(data.duration_minutes) || 30,
        business_type: business.business_type,
        category: data.category?.trim() || null,
        image_url: data.image_url?.trim() || null,
        buffer_minutes: Math.max(0, Number(data.buffer_minutes) || 0),
        requires_appointment: data.requires_appointment ?? true,
        is_active: true,
      },
      include: { business: true },
    });
  }

  async updateService(user: AuthenticatedUser, serviceId: string, data: any) {
    const businessId = await this.getBusinessId(user);
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.business_id !== businessId) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...data,
        price: data.price !== undefined ? Number(data.price) : undefined,
        duration_minutes: data.duration_minutes !== undefined ? Number(data.duration_minutes) : undefined,
        buffer_minutes: data.buffer_minutes !== undefined ? Math.max(0, Number(data.buffer_minutes)) : undefined,
      },
      include: { business: true },
    });
  }

  async deleteService(user: AuthenticatedUser, serviceId: string) {
    const businessId = await this.getBusinessId(user);
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.business_id !== businessId) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return this.prisma.service.delete({ where: { id: serviceId } });
  }

  async createPortfolioItem(user: AuthenticatedUser, data: { image_url: string; title?: string; tags?: string[]; worker_id?: string; service_id?: string }) {
    const businessId = await this.getBusinessId(user);

    if (data.worker_id) {
      await this.validateWorkerAccess(user, data.worker_id);
    }

    if (data.service_id) {
      const service = await this.prisma.service.findUnique({ where: { id: data.service_id } });
      if (!service || service.business_id !== businessId) {
        throw new NotFoundException('Servicio no encontrado');
      }
    }

    return this.prisma.portfolioItem.create({
      data: {
        business_id: businessId,
        image_url: data.image_url,
        title: data.title,
        tags: data.tags || [],
        worker_id: data.worker_id,
        service_id: data.service_id,
        is_active: true,
      },
    });
  }

  async updatePortfolioItem(user: AuthenticatedUser, id: string, data: { title?: string; tags?: string[]; is_active?: boolean }) {
    const businessId = await this.getBusinessId(user);
    const item = await this.prisma.portfolioItem.findUnique({ where: { id } });
    if (!item || item.business_id !== businessId) {
      throw new NotFoundException('Elemento de portafolio no encontrado');
    }

    return this.prisma.portfolioItem.update({
      where: { id },
      data,
    });
  }

  async deletePortfolioItem(user: AuthenticatedUser, id: string) {
    const businessId = await this.getBusinessId(user);
    const item = await this.prisma.portfolioItem.findUnique({ where: { id } });
    if (!item || item.business_id !== businessId) {
      throw new NotFoundException('Elemento de portafolio no encontrado');
    }
    return this.prisma.portfolioItem.delete({ where: { id } });
  }

  async updateScheduleDay(user: AuthenticatedUser, workerId: string, dayOfWeek: number, data: any) {
    await this.validateWorkerAccess(user, workerId);

    return this.prisma.schedule.upsert({
      where: {
        worker_id_day_of_week: {
          worker_id: workerId,
          day_of_week: dayOfWeek,
        },
      },
      update: data,
      create: {
        worker_id: workerId,
        day_of_week: dayOfWeek,
        ...data,
      },
    });
  }

  async copyScheduleToWeek(user: AuthenticatedUser, workerId: string, baseDayOfWeek: number = 1) {
    await this.validateWorkerAccess(user, workerId);

    const baseSchedule = await this.prisma.schedule.findUnique({
      where: {
        worker_id_day_of_week: {
          worker_id: workerId,
          day_of_week: baseDayOfWeek,
        },
      },
    });

    const startTime = baseSchedule?.start_time || '09:00';
    const endTime = baseSchedule?.end_time || '18:00';

    const updates = [1, 2, 3, 4, 5, 6].map((day) =>
      this.prisma.schedule.upsert({
        where: {
          worker_id_day_of_week: {
            worker_id: workerId,
            day_of_week: day,
          },
        },
        update: {
          start_time: startTime,
          end_time: endTime,
          is_active: true,
        },
        create: {
          worker_id: workerId,
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          is_active: true,
        },
      }),
    );

    await Promise.all(updates);

    return this.prisma.schedule.findMany({
      where: { worker_id: workerId },
      orderBy: { day_of_week: 'asc' },
    });
  }
}