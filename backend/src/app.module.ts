import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { BusinessesModule } from './businesses/businesses.module';
import { WorkersModule } from './workers/workers.module';
import { ServicesModule } from './services/services.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PublicModule } from './public/public.module';
import { MediaModule } from './media/media.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    BusinessesModule,
    WorkersModule,
    ServicesModule,
    SchedulesModule,
    AppointmentsModule,
    PublicModule,
    MediaModule,
    PortfolioModule,
  ],
})
export class AppModule {}
