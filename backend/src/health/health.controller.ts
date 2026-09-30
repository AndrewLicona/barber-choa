import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'Barber Choa Backend API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      version: '1.0.0',
    };
  }

  @Get('db')
  async getDbHealth() {
    try {
      const [businessCount, workerCount, serviceCount] = await Promise.all([
        this.prisma.business.count(),
        this.prisma.worker.count(),
        this.prisma.service.count(),
      ]);

      return {
        database: 'connected',
        status: 'healthy',
        stats: {
          businesses: businessCount,
          workers: workerCount,
          services: serviceCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        database: 'error',
        status: 'unhealthy',
        message: error?.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
