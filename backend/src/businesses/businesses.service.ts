import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.business.findMany({
      where: { is_active: true },
      include: {
        _count: {
          select: { workers: true, services: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        workers: { where: { is_active: true } },
        services: { where: { is_active: true } },
        settings: true,
      },
    });

    if (!business) {
      throw new NotFoundException(`Negocio con slug '${slug}' no encontrado`);
    }

    return business;
  }

  async update(id: string, data: any) {
    return this.prisma.business.update({
      where: { id },
      data,
    });
  }
}
