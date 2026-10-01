import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { WorkersService } from './workers.service';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  async findAll(
    @Query('business_type') businessType?: string,
    @Query('business_id') businessId?: string,
  ) {
    return this.workersService.findAll(businessType, businessId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workersService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.workersService.create(body);
  }

  @Post(':id/credentials')
  async resetCredentials(@Param('id') id: string) {
    return this.workersService.resetCredentials(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.workersService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workersService.remove(id);
  }
}
