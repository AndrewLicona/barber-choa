import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, QueueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityQueryDto, CreatePublicAppointmentDto, JoinQueueDto } from './dto/appointments.dto';

type TimeRange = { start: number; end: number };

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getContext(query: AvailabilityQueryDto) {
    const business = await this.prisma.business.findUnique({ where: { slug: query.businessSlug } });
    if (!business || !business.is_active) throw new NotFoundException('Negocio no disponible.');

    const [service, worker] = await Promise.all([
      this.prisma.service.findFirst({
        where: { id: query.serviceId, business_id: business.id, is_active: true, is_public: true },
      }),
      this.prisma.worker.findFirst({
        where: { id: query.workerId, business_id: business.id, is_active: true, is_public: true, accepts_appointments: true },
      }),
    ]);
    if (!service) throw new NotFoundException('Servicio no disponible.');
    if (!worker) throw new NotFoundException('Profesional no disponible para citas.');

    const assignedServices = await this.prisma.workerService.count({ where: { worker_id: worker.id } });
    if (assignedServices > 0) {
      const canProvide = await this.prisma.workerService.findUnique({
        where: { worker_id_service_id: { worker_id: worker.id, service_id: service.id } },
      });
      if (!canProvide) throw new BadRequestException('Este profesional no presta el servicio seleccionado.');
    }
    return { business, service, worker };
  }

  private async getAvailability(query: AvailabilityQueryDto) {
    const context = await this.getContext(query);
    const dayOfWeek = new Date(`${query.date}T12:00:00Z`).getUTCDay();
    const [schedule, exception, appointments] = await Promise.all([
      this.prisma.schedule.findUnique({
        where: { worker_id_day_of_week: { worker_id: context.worker.id, day_of_week: dayOfWeek } },
      }),
      this.prisma.scheduleException.findUnique({
        where: { worker_id_date: { worker_id: context.worker.id, date: new Date(`${query.date}T00:00:00.000Z`) } },
      }),
      this.prisma.appointment.findMany({
        where: {
          worker_id: context.worker.id,
          appointment_date: new Date(`${query.date}T00:00:00.000Z`),
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        },
        select: { start_time: true, end_time: true },
      }),
    ]);

    if (exception && !exception.is_available) return { ...context, slots: [] as string[] };
    const startTime = exception?.start_time || schedule?.start_time;
    const endTime = exception?.end_time || schedule?.end_time;
    if (!schedule?.is_active || !startTime || !endTime) return { ...context, slots: [] as string[] };

    const opening = toMinutes(startTime);
    const closing = toMinutes(endTime);
    const duration = context.service.duration_minutes + context.service.buffer_minutes;
    const breakRange =
      schedule.break_start && schedule.break_end
        ? { start: toMinutes(schedule.break_start), end: toMinutes(schedule.break_end) }
        : null;
    const occupied: TimeRange[] = appointments.map((a) => ({ start: toMinutes(a.start_time), end: toMinutes(a.end_time) }));
    const overlaps = (candidate: TimeRange, range: TimeRange) => candidate.start < range.end && candidate.end > range.start;
    const slots: string[] = [];

    for (let start = opening; start + duration <= closing; start += 30) {
      const candidate = { start, end: start + duration };
      if (
        (!breakRange || !overlaps(candidate, breakRange)) &&
        !occupied.some((range) => overlaps(candidate, range))
      ) {
        slots.push(toTime(start));
      }
    }
    return { ...context, slots };
  }

  async availability(query: AvailabilityQueryDto) {
    const result = await this.getAvailability(query);
    return { date: query.date, serviceDurationMinutes: result.service.duration_minutes, slots: result.slots };
  }

  async createPublic(dto: CreatePublicAppointmentDto) {
    const lockKey = `appointment:${dto.workerId}:${dto.date}`;
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const result = await this.getAvailability(dto);
      if (!result.slots.includes(dto.startTime))
        throw new ConflictException('Ese horario acaba de ser reservado o ya no está disponible.');

      const start = toMinutes(dto.startTime);
      const end = toTime(start + result.service.duration_minutes);
      const appointment = await tx.appointment.create({
        data: {
          business_id: result.business.id,
          worker_id: result.worker.id,
          service_id: result.service.id,
          client_name: dto.clientName.trim(),
          client_phone: dto.clientPhone.trim(),
          appointment_date: new Date(`${dto.date}T00:00:00.000Z`),
          start_time: dto.startTime,
          end_time: end,
          notes: dto.notes?.trim() || null,
          status: AppointmentStatus.PENDING,
        },
        include: {
          worker: { select: { name: true } },
          service: { select: { title: true, price: true } },
        },
      });

      // Añadir automáticamente a la fila en vivo (live_queue) para que aparezca en la plataforma
      const activeQueue = await tx.liveQueueItem.findMany({
        where: { worker_id: result.worker.id, status: { in: [QueueStatus.WAITING, QueueStatus.IN_SERVICE] } },
        orderBy: { position: 'asc' },
      });
      const inService = activeQueue.find((q) => q.status === QueueStatus.IN_SERVICE);
      const waiting = activeQueue.filter((q) => q.status === QueueStatus.WAITING);
      const position = waiting.length + 1;
      const estimatedWait = waiting.length * 25 + (inService ? 15 : 0);
      const queueStatus = inService ? QueueStatus.WAITING : QueueStatus.IN_SERVICE;

      await tx.liveQueueItem.create({
        data: {
          business_id: result.business.id,
          worker_id: result.worker.id,
          client_name: `${dto.clientName.trim()} (Cita ${dto.startTime})`,
          client_phone: dto.clientPhone.trim(),
          status: queueStatus,
          position,
          estimated_wait_minutes: estimatedWait,
        },
      });

      return appointment;
    });
  }

  /** Anotarse en la fila de turno libre (walk-in). */
  async joinQueue(dto: JoinQueueDto) {
    const business = await this.prisma.business.findUnique({ where: { slug: dto.businessSlug } });
    if (!business || !business.is_active) throw new NotFoundException('Negocio no disponible.');

    const worker = await this.prisma.worker.findFirst({
      where: { id: dto.workerId, business_id: business.id, is_active: true },
    });
    if (!worker) throw new NotFoundException('Profesional no encontrado.');

    const activeQueue = await this.prisma.liveQueueItem.findMany({
      where: { worker_id: dto.workerId, status: { in: [QueueStatus.WAITING, QueueStatus.IN_SERVICE] } },
      orderBy: { position: 'asc' },
    });

    const inService = activeQueue.find((q) => q.status === QueueStatus.IN_SERVICE);
    const waiting = activeQueue.filter((q) => q.status === QueueStatus.WAITING);
    const position = waiting.length + 1;
    const estimatedWait = waiting.length * 25 + (inService ? 15 : 0);
    const status = inService ? QueueStatus.WAITING : QueueStatus.IN_SERVICE;

    const item = await this.prisma.liveQueueItem.create({
      data: {
        business_id: business.id,
        worker_id: dto.workerId,
        client_name: dto.clientName.trim(),
        client_phone: dto.clientPhone.trim(),
        status,
        position,
        estimated_wait_minutes: estimatedWait,
      },
    });

    return {
      id: item.id,
      position: status === QueueStatus.IN_SERVICE ? 0 : position,
      estimatedWaitMinutes: estimatedWait,
      status,
      workerName: worker.name,
    };
  }
}
