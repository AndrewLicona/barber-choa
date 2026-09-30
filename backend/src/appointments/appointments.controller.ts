import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AvailabilityQueryDto, CreatePublicAppointmentDto } from './dto/appointments.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get('availability') availability(@Query() query: AvailabilityQueryDto) {
    return this.appointments.availability(query);
  }

  @Post('public') createPublic(@Body() dto: CreatePublicAppointmentDto) {
    return this.appointments.createPublic(dto);
  }
}
