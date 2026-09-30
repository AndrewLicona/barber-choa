import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByBusinessSlug(slug: string, category?: string) {
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

  async findAllAdmin(businessId: string, category?: string) {
    const where: any = { business_id: businessId };
    if (category) where.tags = { has: category };

    return this.prisma.portfolioItem.findMany({
      where,
      include: {
        worker: { select: { name: true } },
        service: { select: { title: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(data: {
    business_id: string;
    image_url: string;
    title?: string;
    tags?: string[];
    worker_id?: string;
    service_id?: string;
  }) {
    return this.prisma.portfolioItem.create({
      data: {
        business_id: data.business_id,
        image_url: data.image_url,
        title: data.title,
        tags: data.tags || [],
        worker_id: data.worker_id,
        service_id: data.service_id,
        is_active: true,
      },
    });
  }

  async update(id: string, data: { title?: string; tags?: string[]; is_active?: boolean }) {
    return this.prisma.portfolioItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.portfolioItem.delete({
      where: { id },
    });
  }
}
