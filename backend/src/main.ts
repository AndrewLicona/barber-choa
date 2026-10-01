import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde backend/.env o la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // Habilitar validación automática con DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  // Habilitar CORS para el frontend Next.js y orígenes de Railway / localhost
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origen (curl, server-side) y cualquier origen en producción/desarrollo
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 [NestJS API] Servidor ejecutándose en http://localhost:${port}/api`);
  console.log(`🩺 [Health Check] Disponible en http://localhost:${port}/api/health`);
}

bootstrap();
