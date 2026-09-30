import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Asegurar carga de variables de entorno sin depender del orden de importación
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          // La conexión directa evita incompatibilidades del pooler durante
          // operaciones transaccionales de reservas. En despliegue puede
          // configurarse un pooler compatible si la plataforma lo requiere.
          url: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ [PrismaService] Conectado exitosamente a PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
