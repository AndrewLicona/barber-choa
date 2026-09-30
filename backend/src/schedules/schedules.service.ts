import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorker(workerId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        schedules: { orderBy: { day_of_week: 'asc' } },
        schedule_exceptions: { orderBy: { date: 'asc' } },
      },
    });

    if (!worker) {
      throw new NotFoundException(`Especialista con ID ${workerId} no encontrado`);
    }

    return {
      worker: { id: worker.id, name: worker.name, business_type: worker.business_type },
      schedules: worker.schedules,
      exceptions: worker.schedule_exceptions,
    };
  }

  async updateDay(workerId: string, dayOfWeek: number, data: {
    start_time: string;
    end_time: string;
    break_start?: string;
    break_end?: string;
    is_active: boolean;
  }) {
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

  async copyScheduleToWeek(workerId: string, baseDayOfWeek: number = 1) {
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
    return this.findByWorker(workerId);
  }
}
