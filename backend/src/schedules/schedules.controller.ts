import { Controller, Get, Put, Post, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('worker/:workerId')
  async findByWorker(@Param('workerId') workerId: string) {
    return this.schedulesService.findByWorker(workerId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('worker/:workerId/day/:day')
  async updateDay(
    @Param('workerId') workerId: string,
    @Param('day', ParseIntPipe) day: number,
    @Body() body: any,
  ) {
    return this.schedulesService.updateDay(workerId, day, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('worker/:workerId/copy-week')
  async copyScheduleToWeek(@Param('workerId') workerId: string) {
    return this.schedulesService.copyScheduleToWeek(workerId);
  }
}
