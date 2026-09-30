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
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    businessId?: string;
    role: string;
  };
}

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  // Público
  @Get('public/business/:slug')
  async getPublicPortfolio(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ) {
    return this.portfolioService.findAllByBusinessSlug(slug, category);
  }

  // Admin autenticado
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  async getAdminPortfolio(@Req() req: AuthenticatedRequest, @Query('category') category?: string) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new Error('Business ID not found in token');
    }
    return this.portfolioService.findAllAdmin(businessId, category);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: { image_url: string; title?: string; tags?: string[]; worker_id?: string; service_id?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new Error('Business ID not found in token');
    }
    return this.portfolioService.create({
      business_id: businessId,
      ...body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; tags?: string[]; is_active?: boolean },
    @Req() req: AuthenticatedRequest,
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new Error('Business ID not found in token');
    }
    return this.portfolioService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.portfolioService.remove(id);
  }
}
