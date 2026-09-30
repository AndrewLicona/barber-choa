import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getBusinessBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug, is_active: true },
      select: {
        id: true,
        slug: true,
        name: true,
        business_type: true,
        description: true,
        address: true,
        phone: true,
        instagram_url: true,
        logo_url: true,
        hero_image_url: true,
        map_url: true,
        booking_message: true,
        timezone: true,
      },
    });

    if (!business) {
      throw new NotFoundException(`Negocio '${slug}' no encontrado`);
    }

    return business;
  }

  async getBusinessServices(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug, is_active: true },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundException(`Negocio '${slug}' no encontrado`);
    }

    return this.prisma.service.findMany({
      where: {
        business_id: business.id,
        is_active: true,
        is_public: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        duration_minutes: true,
        category: true,
        image_url: true,
        buffer_minutes: true,
      },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async getBusinessWorkers(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug, is_active: true },
      select: { id: true, business_type: true },
    });

    if (!business) {
      throw new NotFoundException(`Negocio '${slug}' no encontrado`);
    }

    return this.prisma.worker.findMany({
      where: {
        business_id: business.id,
        is_active: true,
        is_public: true,
      },
      select: {
        id: true,
        name: true,
        avatar_url: true,
        bio: true,
        specialties: true,
        accepts_appointments: true,
        display_order: true,
      },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async getBusinessPortfolio(slug: string, category?: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug, is_active: true },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundException(`Negocio '${slug}' no encontrado`);
    }

    const where: any = {
      business_id: business.id,
      is_active: true,
    };

    return this.prisma.portfolioItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        image_url: true,
        tags: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
