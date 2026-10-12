import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import {
  CreateWorkerDto,
  UpdateWorkerDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
  ScheduleDayDto,
  UpdateSettingsDto,
  AddWalkInDto,
  AdvanceQueueDto,
  RemoveQueueItemDto,
} from './dto/admin.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
    workerId?: string;
    businessId?: string;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('queue')
  async getAllQueue(@Req() req: AuthenticatedRequest) {
    return this.adminService.getAllQueue(req.user);
  }

  @Get('queue/worker/:workerId')
  async getQueueByWorker(@Req() req: AuthenticatedRequest, @Param('workerId') workerId: string) {
    return this.adminService.getQueueByWorker(req.user, workerId);
  }

  @Post('queue/walkin')
  async addWalkIn(@Req() req: AuthenticatedRequest, @Body() dto: AddWalkInDto) {
    return this.adminService.addWalkIn(req.user, dto);
  }

  @Post('queue/advance')
  async advanceQueue(@Req() req: AuthenticatedRequest, @Body() dto: AdvanceQueueDto) {
    return this.adminService.advanceQueue(req.user, dto.worker_id);
  }

  @Delete('queue/item/:queueItemId')
  async removeQueueItem(@Req() req: AuthenticatedRequest, @Param('queueItemId') queueItemId: string) {
    return this.adminService.removeQueueItem(req.user, queueItemId);
  }

  @Get('workers')
  async getWorkers(@Req() req: AuthenticatedRequest) {
    return this.adminService.getWorkersByBusiness(req.user);
  }

  @Post('workers')
  async createWorker(@Req() req: AuthenticatedRequest, @Body() dto: CreateWorkerDto) {
    return this.adminService.createWorker(req.user, dto);
  }

  @Patch('workers/:id')
  async updateWorker(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.adminService.updateWorker(req.user, id, dto);
  }

  @Delete('workers/:id')
  async deleteWorker(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deleteWorker(req.user, id);
  }

  @Post('workers/:id/credentials')
  async resetWorkerCredentials(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.resetWorkerCredentials(req.user, id);
  }

  @Get('services')
  async getServices(@Req() req: AuthenticatedRequest) {
    return this.adminService.getServicesByBusiness(req.user);
  }

  @Post('services')
  async createService(@Req() req: AuthenticatedRequest, @Body() dto: CreateServiceDto) {
    return this.adminService.createService(req.user, dto);
  }

  @Patch('services/:id')
  async updateService(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.adminService.updateService(req.user, id, dto);
  }

  @Delete('services/:id')
  async deleteService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deleteService(req.user, id);
  }

  @Get('portfolio')
  async getPortfolio(@Req() req: AuthenticatedRequest) {
    return this.adminService.getPortfolioByBusiness(req.user);
  }

  @Post('portfolio')
  async createPortfolioItem(@Req() req: AuthenticatedRequest, @Body() dto: CreatePortfolioItemDto) {
    return this.adminService.createPortfolioItem(req.user, dto);
  }

  @Patch('portfolio/:id')
  async updatePortfolioItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePortfolioItemDto) {
    return this.adminService.updatePortfolioItem(req.user, id, dto);
  }

  @Delete('portfolio/:id')
  async deletePortfolioItem(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deletePortfolioItem(req.user, id);
  }

  @Get('settings')
  async getSettings(@Req() req: AuthenticatedRequest) {
    return this.adminService.getBusinessSettings(req.user);
  }

  @Get('appointments')
  async getAppointments(@Req() req: AuthenticatedRequest) {
    return this.adminService.getAppointments(req.user);
  }

  @Patch('settings')
  async updateSettings(@Req() req: AuthenticatedRequest, @Body() dto: UpdateSettingsDto) {
    return this.adminService.updateBusinessSettings(req.user, dto as unknown as Record<string, any>);
  }

  @Patch('schedules/worker/:workerId/day/:day')
  async updateScheduleDay(
    @Req() req: AuthenticatedRequest,
    @Param('workerId') workerId: string,
    @Param('day', ParseIntPipe) day: number,
    @Body() dto: ScheduleDayDto,
  ) {
    return this.adminService.updateScheduleDay(req.user, workerId, day, dto);
  }

  @Post('schedules/worker/:workerId/copy-week')
  async copyScheduleToWeek(
    @Req() req: AuthenticatedRequest,
    @Param('workerId') workerId: string,
    @Query('baseDay') baseDay?: string,
  ) {
    const baseDayOfWeek = baseDay ? parseInt(baseDay, 10) : 1;
    return this.adminService.copyScheduleToWeek(req.user, workerId, baseDayOfWeek);
  }
}