import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('businesses/:slug')
  async getBusiness(@Param('slug') slug: string) {
    return this.publicService.getBusinessBySlug(slug);
  }

  @Get('businesses/:slug/services')
  async getServices(@Param('slug') slug: string) {
    return this.publicService.getBusinessServices(slug);
  }

  @Get('businesses/:slug/workers')
  async getWorkers(@Param('slug') slug: string) {
    return this.publicService.getBusinessWorkers(slug);
  }

  @Get('businesses/:slug/portfolio')
  async getPortfolio(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ) {
    return this.publicService.getBusinessPortfolio(slug, category);
  }
}
