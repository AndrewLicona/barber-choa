# Choa Studio

Plataforma web personalizada para un mismo local con dos experiencias operativas y visuales aisladas:

- **Barber Choa:** turnos por llegada, agenda de colaboradores y servicios de barbería.
- **LM Nails & Spa:** portafolio visual y reservas de manicura y spa.

El producto comparte infraestructura, pero cada negocio mantiene sus propias rutas, identidad, servicios, profesionales, galerías, agenda, permisos y administración.

## Estructura

```text
barber_choa/
├── frontend/  # Next.js: experiencia pública, paneles y portal de trabajadores
├── backend/   # NestJS + Prisma: API, reglas de negocio y acceso a PostgreSQL
├── PLAN_DE_DESARROLLO.md
└── plan.md
```

## Desarrollo local

Requisitos: Node.js 20.9 o superior y las variables de entorno configuradas localmente. Nunca se deben incluir credenciales activas en el repositorio.

```bash
npm run dev:frontend
npm run dev:backend
```

Para compilar:

```bash
npm run build:frontend
npm run build:backend
```

## Estado y siguiente hito

El proyecto está en **Fase 0: saneamiento, seguridad y contrato canónico**. Antes de habilitar reservas reales se debe consolidar una única API, alinear el modelo de datos y endurecer la seguridad por negocio.

Consulta [PLAN_DE_DESARROLLO.md](PLAN_DE_DESARROLLO.md) para las fases, criterios de aceptación y división de trabajo en paralelo.
