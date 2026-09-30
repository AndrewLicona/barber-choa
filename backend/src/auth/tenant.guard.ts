import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    // SUPERADMIN puede hacer todo
    if (user.role === 'SUPERADMIN') {
      return true;
    }

    // Obtener businessId del usuario
    const businessId = user.businessId;

    if (!businessId) {
      // Intentar obtener desde el worker del usuario
      if (user.workerId) {
        const worker = await this.prisma.worker.findUnique({
          where: { id: user.workerId },
          select: { business_id: true },
        });
        if (worker) {
          request.tenantId = worker.business_id;
          return true;
        }
      }
      throw new ForbiddenException('No tienes acceso a ningún negocio');
    }

    // Validar que el recurso pertenece al negocio del usuario
    const method = request.method;
    const params = request.params;
    const body = request.body;
    const query = request.query;

    // Para operaciones de negocio específico, validar business_id
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      const resourceBusinessId = body?.business_id || params?.businessId || query?.businessId;

      if (resourceBusinessId && resourceBusinessId !== businessId) {
        throw new ForbiddenException('No tienes acceso a este negocio');
      }

      // Adjuntar el businessId validado al request
      request.tenantId = businessId;
    }

    return true;
  }
}
