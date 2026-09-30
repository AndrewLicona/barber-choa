import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessType?: string, businessId?: string) {
    const where: any = {};
    if (businessType) where.business_type = businessType;
    if (businessId) where.business_id = businessId;

    return this.prisma.service.findMany({
      where,
      include: { business: true },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return service;
  }

  async create(data: {
    title: string;
    description?: string;
    price: number;
    duration_minutes: number;
    business_id: string;
    business_type?: string;
    category?: string;
    image_url?: string;
    buffer_minutes?: number;
    requires_appointment?: boolean;
  }) {
    const business = await this.prisma.business.findUnique({ where: { id: data.business_id } });

    if (!business) {
      throw new NotFoundException('No se encontró el negocio solicitado');
    }

    return this.prisma.service.create({
      data: {
        business_id: business.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        price: Number(data.price),
        duration_minutes: Number(data.duration_minutes) || 30,
        business_type: business.business_type,
        category: data.category?.trim() || null,
        image_url: data.image_url?.trim() || null,
        buffer_minutes: Math.max(0, Number(data.buffer_minutes) || 0),
        requires_appointment: data.requires_appointment ?? true,
        is_active: true,
      },
      include: { business: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? Number(data.price) : undefined,
        duration_minutes: data.duration_minutes !== undefined ? Number(data.duration_minutes) : undefined,
      },
      include: { business: true },
    });
  }

  async remove(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
