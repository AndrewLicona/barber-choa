# Barber Choa & LM Nails — Plan maestro de producto y ejecución

## Decisión de producto

La plataforma atiende a un mismo local, pero ofrece dos negocios **completamente independientes**: **Barber Choa** y **LM Nails & Spa**. Comparten código, infraestructura y base de datos; nunca identidad, servicios, profesionales, imágenes, clientes, agenda, permisos ni administración.

### Rutas objetivo

| Ruta | Experiencia |
| --- | --- |
| `/` | Hub neutral para elegir una marca. |
| `/barberia` | Experiencia pública exclusiva de Barber Choa. |
| `/manicura` | Experiencia pública exclusiva de LM Nails. |
| `/barberia/admin` | Administración exclusiva de Barber Choa. |
| `/manicura/admin` | Administración exclusiva de LM Nails. |
| `/portal` | Portal autenticado del trabajador, resuelto por su negocio y rol. |

Dentro de una marca solo se muestra su propia navegación. El único enlace compartido para clientes es un enlace discreto a inicio/cambio de experiencia.

## Estado real del proyecto — 26 de septiembre de 2026

### Base existente

- Monorepo: Next.js en `frontend/` y NestJS + Prisma en `backend/`.
- Modelo inicial con negocios, usuarios, profesionales, servicios, horarios, citas, cola y portafolio.
- Login JWT básico, CRUD de negocios, servicios, profesionales y horario semanal en NestJS.
- Landings, login, paneles administrativos y portal de trabajador como base visual.
- Identidades visuales diferenciadas y logos de ambas marcas.

### Brechas que impiden considerarlo listo

- La página raíz favorece Barber Choa; no es un hub dual neutral.
- La navegación pública de barbería contiene enlaces a manicura. Las navbars separadas existen, pero se usan solo en los paneles.
- El frontend modifica Supabase directamente y el backend usa Prisma: son dos caminos de datos que ya tienen contratos distintos.
- Las citas usan campos diferentes entre frontend y Prisma; los horarios del modal son fijos y no validan disponibilidad.
- La galería de manicura es estática/de muestra, Barbería no tiene galería pública y no hay gestión ni carga de fotos.
- NestJS aún no tiene módulos de citas, cola, portafolio, carga de imágenes ni notificaciones.
- No existen migraciones Prisma versionadas ni seguridad multi-negocio lista para producción.
- Hay políticas RLS permisivas y una credencial expuesta en un script local: debe rotarse antes de continuar con datos reales.

## Principios no negociables

1. `business_id` es la frontera de aislamiento de todos los datos operativos.
2. NestJS + Prisma será la API de dominio única; el frontend no escribirá directamente tablas operativas.
3. Los datos públicos se limitan a contenido publicado; nombres, teléfonos y agendas son privados.
4. Cada negocio tiene identidad, navegación, contenido, categorías y administración propias.
5. Las reservas y la cola se validan en el servidor, con control de concurrencia.
6. Cada fase se da por terminada solo con criterios de aceptación verificables.

## Atributos prioritarios

| Entidad | Atributos a completar |
| --- | --- |
| Negocio | logo, portada, paleta, descripción, dirección, mapa, WhatsApp, Instagram, horario, políticas y mensajes de reserva. |
| Profesional | foto, bio, especialidades, servicios habilitados, agenda, descansos, orden público y portafolio. |
| Servicio | categoría, imagen, precio desde, duración, buffer, modalidad de atención, activo y orden. |
| Galería | negocio, profesional, servicio, categoría, etiquetas, fotos, título, descripción, destacado, orden, visibilidad y consentimiento. |
| Cita | negocio, profesional, servicio, cliente, inicio, fin, estado, notas, origen, recordatorios y auditoría. |
| Cola | negocio, profesional/silla, posición, estado, espera estimada y avance. |

## Fases de ejecución

### Fase 0 — Saneamiento, seguridad y contrato canónico

**Objetivo:** una base segura con una sola fuente de verdad.

- Rotar la credencial expuesta y retirarla del script y del historial operativo.
- Reemplazar RLS permisivo por diseño de roles, usuario y negocio.
- Definir una identidad única: preferiblemente Supabase Auth validado por NestJS, o auth NestJS sin sesiones Supabase paralelas.
- Decidir y documentar NestJS + Prisma como API única de negocio.
- Crear migraciones Prisma versionadas, seed reproducible y contrato API tipado.
- Alinear tipos frontend con Prisma/API: citas, estados, categoría, destacados y excepciones.

**Criterio de aceptación:** no hay secretos activos en código, no existen dos escrituras para el mismo recurso y una base vacía se reconstruye con migraciones y seed.

### Fase 1 — Hub y experiencias de marca separadas

**Objetivo:** que un cliente no perciba mezcla entre marcas.

- Convertir `/` en selector neutral y equilibrado de Barber Choa y LM Nails.
- Aplicar `BarberiaNav` en toda la sección de barbería y `ManicuraNav` en toda manicura.
- Eliminar enlaces cruzados promocionales; añadir solo “Cambiar experiencia” hacia `/`.
- Añadir navegación local por marca: inicio, servicios, galería, reservar y acceso privado propio.
- Completar metadatos, favicon, manifest, WhatsApp, ubicación y mensajes por negocio.

**Criterio de aceptación:** en `/barberia` no se ven logo, colores, servicios ni CTA de manicura; se cumple el equivalente en `/manicura`.

### Fase 2 — Contenido administrable: negocios, servicios y profesionales

**Objetivo:** que el cliente pueda personalizar el sitio sin cambios de código.

**Estado:** en curso. El esquema aditivo y la relación profesional-servicio ya están versionados; faltan la aplicación controlada de la migración y las pantallas de gestión.

- Configuración de marca por negocio: datos de contacto, portada, fotos del local, textos, redes y políticas.
- Perfil enriquecido de cada profesional y asociación explícita entre profesional y servicios (`WorkerService`).
- Servicio con categoría, imagen, duración, buffer, precio, modalidad y visibilidad.
- Paneles separados para administrar este contenido exclusivamente dentro de su negocio.

**Criterio de aceptación:** desactivar un servicio/profesional lo retira únicamente de su experiencia pública; ningún campo comercial relevante permanece rígido en la interfaz.

### Fase 3 — Galerías y portafolios reales

**Objetivo:** hacer de las imágenes una herramienta de confianza y reserva.

- Implementar módulo `portfolio` en API con `business_id` obligatorio.
- Extender `PortfolioItem` con título, descripción, categoría, etiquetas, destacado, orden, estado (`DRAFT`, `PUBLISHED`, `ARCHIVED`) y consentimiento.
- Crear `PortfolioMedia` para soportar portada, detalle, antes/después, texto alternativo, dimensiones y orden.
- Carga validada, compresión, variantes optimizadas, remoción de EXIF/GPS y almacenamiento por negocio.
- Crear `/barberia/galeria` y `/manicura/galeria` con filtros propios, ficha/lightbox y CTA “Reservar este estilo”.
- Crear panel de galería separado: subir, revisar, publicar, ocultar, ordenar y asociar con profesional/servicio.
- Sustituir imágenes de muestra por fotos reales autorizadas.

**Categorías iniciales:**

- Barbería: cortes, fades, barbas, color, tratamientos, infantil y combos.
- Manicura: semipermanente, soft gel, acrílico, nail art, pedicura, refuerzo y retiro.

**Criterio de aceptación:** una foto publicada solo aparece en el negocio propietario; desde ella se puede abrir una reserva precargada con servicio/profesional compatibles.

### Fase 4 — Disponibilidad, agenda y reservas fiables

**Objetivo:** eliminar horas fijas y evitar solapamientos.

**Estado:** en curso. Ya existe API de disponibilidad y reserva pública con validación de negocio, horarios, descansos, excepciones y bloqueo transaccional; falta migrar el resto de vistas administrativas y añadir pruebas de concurrencia automatizadas.

- Completar horarios semanales, descansos, bloques, vacaciones y excepciones.
- Normalizar citas a `starts_at`/`ends_at` con zona horaria definida por negocio, o mantener fecha/hora separadas con contrato estricto.
- Crear endpoint de disponibilidad por negocio, servicio, profesional y fecha.
- Calcular slots usando servicio, duración, buffer, agenda existente y excepciones.
- Crear reserva transaccional en servidor; el cliente nunca define el fin de la cita.
- Reemplazar el modal actual por flujo: servicio → profesional/slot → datos/resumen → confirmación.
- Añadir calendario diario/semanal para administración y agenda propia para trabajadores.

**Criterio de aceptación:** dos peticiones simultáneas no reservan el mismo intervalo; se respetan almuerzos, vacaciones, bloqueos y negocio correspondiente.

### Fase 5 — Operación de Barber Choa: turnos en vivo

**Objetivo:** gestionar la atención por llegada sin afectar manicura.

- Crear módulo `live-queue` exclusivo para Barber Choa.
- Transacciones para agregar, iniciar, finalizar, cancelar y recalcular posición/espera.
- Widget público en tiempo real con datos no sensibles.
- Administración por barbero/silla y reglas de tiempo promedio.

**Criterio de aceptación:** la cola mantiene posiciones válidas, no expone teléfonos y nunca aparece dentro de manicura.

### Fase 6 — Roles, seguridad y operación completa

**Objetivo:** asegurar administraciones y portal de trabajadores.

**Estado:** iniciado. El modelo `UserBusinessAccess`, la migración y la validación de ruta por marca están listos; falta aplicar la migración y aprovisionar la cuenta del dueño como `SUPERADMIN`.

- Roles: superadmin, admin barbería, admin manicura, trabajador y cliente.
- `TenantGuard` que valida ruta, token, negocio del recurso y pertenencia del trabajador en cada operación.
- Endpoints administrativos expresados por negocio; ningún `business_id` del payload se acepta sin validar.
- Migrar frontend en orden: contenido público, sesión, paneles, portal, citas y cola. Cada módulo tiene una sola ruta de escritura.
- Eliminar `@ts-nocheck`, tipos duplicados y contratos paralelos.

**Criterio de aceptación:** una cuenta de manicura no puede leer ni modificar ningún recurso de barbería aunque manipule URL, token o payload.

### Fase 7 — Comunicación, calidad y lanzamiento

**Objetivo:** entrega sostenible para el cliente.

- Confirmaciones y recordatorios por WhatsApp: primero enlace prellenado, automatización solo tras aprobación.
- PWA, accesibilidad, SEO local, optimización de imágenes y analítica respetuosa de privacidad.
- Pruebas unitarias de disponibilidad; integración de autorización y concurrencia; E2E móvil de reserva, cola y administración.
- Backups, logs, monitoreo y capacitación para gestionar fotos, servicios, horarios y turnos.

**Criterio de aceptación:** flujos críticos pasan pruebas en móvil y el cliente puede operar ambas marcas sin apoyo técnico diario.

## Orden inmediato y frentes paralelos

1. Ejecutar Fase 0 antes de conectar clientes o usar datos reales.
2. Implementar Fase 1 en paralelo con el diseño del contrato de Fase 0/2.
3. Implementar Fase 3 cuando el contrato de portafolio y storage esté aprobado.
4. Construir Fase 4 después de contratos, permisos y esquema canónico.

| Frente | Responsable sugerido | Archivos/área | Dependencia |
| --- | --- | --- | --- |
| UX e identidad | Agente frontend | hub, layouts, navbars, metadatos, componentes de marca | Ninguna. |
| Datos y API | Agente backend | Prisma, migraciones, DTOs, contratos, módulos | Fase 0. |
| Seguridad tenant | Agente backend/QA | auth, guards, RLS, tests de aislamiento | Fase 0 y esquema. |
| Galería y medios | Agentes backend + frontend | portfolio, storage, panel, galería pública | Contrato de datos. |
| Agenda y reservas | Agentes backend + frontend | slots, citas, calendario, flujo de reserva | Contrato y permisos. |
| Cola y comunicación | Agente backend + frontend | cola en vivo, realtime, WhatsApp | Permisos/API base. |

Cada frente debe trabajar en archivos delimitados, no cambiar contratos compartidos sin coordinación con Datos y API, y entregar build/pruebas antes de integrarse.
