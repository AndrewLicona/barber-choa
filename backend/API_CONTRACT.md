# Contrato de dominio y API — Fase 0

**Estado:** decisión de arquitectura previa a cambios de esquema o código.  
**Ámbito:** una plataforma compartida para dos marcas independientes: Barber Choa (`barberia`) y LM Nails (`manicura`).

Este documento fija el límite multi-tenant y el contrato objetivo para que el frontend deje de acceder directamente a las tablas. No describe una API ya terminada: los endpoints marcados como **objetivo** son el contrato que debe implementarse antes de migrar cada pantalla.

## 1. Principios innegociables

1. `business_id` es el límite de tenant. Dos negocios pueden compartir aplicación, despliegue y base de datos, pero nunca datos operativos ni permisos.
2. El cliente navega por marca (`/barberia` o `/manicura`); la marca no se deduce de un campo enviado libremente por el navegador.
3. Todo recurso operativo pertenece a un negocio, directa o indirectamente. Una relación entre recursos debe verificarse dentro del mismo `business_id` en el servidor.
4. El backend NestJS + Prisma será la única API de escritura y la fuente de verdad de dominio. Supabase puede continuar como proveedor de PostgreSQL y almacenamiento, pero no como API de tablas consumida desde el cliente.
5. Los IDs internos UUID son válidos en API autenticada. Las rutas públicas deben resolver el negocio por `slug`; nunca exponer un selector de datos sin tenant.
6. `business_type` es información de presentación/compatibilidad (`barberia` o `manicura`), no un mecanismo de autorización. La autorización se decide por `business_id` y rol.

## 2. Estado observado y decisión de transición

El esquema Prisma ya contiene `Business`, `Worker`, `Service`, `Appointment`, `LiveQueueItem`, `PortfolioItem`, `Schedule`, `ScheduleException`, `BusinessSetting` y `NotificationLog`. `Worker`, `Service`, `Appointment`, `LiveQueueItem` y `PortfolioItem` ya guardan `business_id`.

Actualmente el frontend usa Supabase directamente para lecturas/escrituras. En particular, `BookingModal` inserta una cita con `date_time` ISO, mientras que Prisma define `appointment_date`, `start_time` y `end_time`. Los módulos actuales de NestJS solo cubren auth, businesses, workers, services y schedules; aún no exponen citas, cola, portafolio ni settings. Los filtros opcionales de `business_id` existentes son conveniencia de consulta, no aislamiento de seguridad.

**Decisión:** no crear otra representación de citas ni mantener dos contratos de escritura. La representación canónica será la del apartado 5. Cualquier tabla heredada que aún tenga `date_time` se adaptará en el backend durante la migración; el frontend no volverá a escribir ese campo.

## 3. Límite de tenant y reglas de integridad

### 3.1 Regla de resolución de negocio

| Contexto | Cómo se obtiene `business_id` | Regla |
| --- | --- | --- |
| Público | `GET /public/businesses/:slug` o slug de ruta | El servicio resuelve el ID internamente; solo devuelve datos públicos activos. |
| Admin | Claim `businessId` del JWT; `SUPERADMIN` debe seleccionar tenant explícitamente | Ignorar o comparar cualquier `business_id` en body/query con el tenant autorizado. |
| Trabajador | Claim `workerId` del JWT y su worker actual en DB | El negocio se deriva del worker; no se acepta otro en cliente. |
| Cliente autenticado | Cita/solicitud lleva el negocio resuelto por la ruta pública | No autoriza administración. |

`SUPERADMIN` puede operar varios negocios, pero debe enviar un tenant explícito en una ruta de administración y el servidor debe auditarlo. `ADMIN` queda limitado a su `businessId`; para que esto sea posible todos los administradores de negocio deberán tener una asignación de tenant explícita (hoy `User` solo puede derivarlo si posee `Worker`).

### 3.2 Reglas que todo comando debe comprobar

- Un `worker_id` debe pertenecer al `business_id` de la petición.
- Un `service_id` debe pertenecer al mismo `business_id`.
- Las agendas y excepciones se consultan/modifican solo si su `worker_id` pertenece al tenant.
- Una cita, elemento de cola, imagen de galería, setting y log se leen o mutan con filtro de tenant, incluso cuando se accede por `id`.
- Ninguna operación de update/delete debe ejecutar solamente `where: { id }` si el actor no es `SUPERADMIN` con tenant validado.
- El servidor asigna `business_id`; un body que intente cambiarlo se rechaza. Cambiar de negocio un worker, servicio o cita es una operación administrativa explícita y no forma parte de este contrato inicial.

## 4. Visibilidad de datos

### Público (sin token)

Solo recursos `is_active = true`, del negocio resuelto, con campos preparados para la experiencia de marca:

| Recurso | Campos públicos permitidos |
| --- | --- |
| Business | `slug`, `name`, `business_type`, `description`, `address`, `phone`, `instagram_url`, `logo_url` y atributos visuales públicos que se añadan. |
| Worker | `id`, `name`, `bio`, `avatar_url`, especialidades públicas futuras, `accepts_appointments`. Nunca `user_id`, teléfono privado ni agenda interna completa. |
| Service | `id`, `title`, `description`, `price`, `duration_minutes`, categoría/imagen pública futuras. |
| PortfolioItem | `id`, `title`, `image_url`, `tags`, asociaciones públicas con nombre de worker/servicio y orden/destacado futuros. |
| Disponibilidad | Solo slots reservables para un servicio/profesional/fecha; nunca citas de otras personas ni bloqueos con detalles. |
| Cola | Estado y tiempo estimado agregados permitidos por negocio; nunca teléfono ni nombre completo de terceros. |

### Privado (JWT y tenant/rol)

- Contacto de clientes (`client_name`, `client_phone`, `client_email`), notas y estados de citas.
- Agenda completa, excepciones, bloqueos y datos operativos de trabajadores.
- Teléfono de trabajadores, `user_id`, estado de cuenta, logs de notificación y ajustes internos.
- URLs de carga firmadas, metadatos de archivos no publicados y cualquier secreto/configuración de integración.
- Los hashes de contraseña jamás salen de la API; `AuthService` debe excluirlos en toda respuesta.

## 5. Representación canónica de citas

La cita debe modelar fecha local y hora local, no un único `date_time` enviado por UI. El negocio debe tener una zona horaria configurable (por defecto inicial: `America/Bogota`), usada para validar y presentar la cita.

```json
{
  "id": "uuid",
  "business_id": "uuid",
  "worker_id": "uuid",
  "service_id": "uuid",
  "client": {
    "name": "string",
    "phone": "string",
    "email": "string | null"
  },
  "schedule": {
    "date": "YYYY-MM-DD",
    "start_time": "HH:mm",
    "end_time": "HH:mm",
    "timezone": "America/Bogota"
  },
  "status": "PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW",
  "notes": "string | null",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

El esquema actual ya coincide en lo esencial mediante `appointment_date`, `start_time`, `end_time` y `status`. El payload de creación público debe ser mínimo y no aceptar `end_time`, `business_id` ni `status`:

```json
{
  "service_id": "uuid",
  "worker_id": "uuid",
  "date": "YYYY-MM-DD",
  "start_time": "HH:mm",
  "client_name": "string",
  "client_phone": "string",
  "client_email": "string?",
  "notes": "string?"
}
```

El servidor resuelve el negocio por slug, verifica relaciones, calcula `end_time = start_time + service.duration_minutes (+ buffer futuro)`, decide el estado inicial y rechaza solapamientos. Para evitar doble reserva, la verificación y creación deben ejecutarse en una transacción con una garantía de concurrencia de base de datos antes de habilitar producción.

## 6. Roles objetivo

| Rol | Alcance |
| --- | --- |
| `SUPERADMIN` | Todos los tenants, con tenant explícito para operaciones de negocio. |
| `ADMIN` | Un único negocio asignado: catálogo, trabajadores, agenda, galería, citas, cola y configuración de ese tenant. |
| `WORKER_AGENDA` | Solo su perfil, horario permitido y sus propias citas; no puede ver ni cambiar datos de otros trabajadores. |
| `WORKER_WALKIN` | Solo su perfil y sus elementos de cola, según reglas de barbería. |
| `CLIENT` | Sus propias reservas identificadas por autenticación o token de gestión futuro; no administración. |
| Anónimo | Catálogo y disponibilidad pública de una marca; creación de solicitud de cita protegida con validación/antispam. |

`RolesGuard` existe, pero hoy no está aplicado de forma consistente en los controladores. Tener JWT no sustituye la comprobación de rol ni la comprobación de tenant.

## 7. Superficie de API objetivo

Prefijo sugerido: `/api/v1`. Las rutas públicas quedan expresadas por slug; las privadas por tenant del token.

### Público

| Método y ruta | Propósito |
| --- | --- |
| `GET /public/businesses` | Hub: marcas activas mínimas. |
| `GET /public/businesses/:slug` | Identidad y configuración pública de una marca. |
| `GET /public/businesses/:slug/services` | Catálogo activo de esa marca. |
| `GET /public/businesses/:slug/workers` | Profesionales activos de esa marca. |
| `GET /public/businesses/:slug/portfolio` | Galería filtrable de esa marca. |
| `GET /public/businesses/:slug/availability?service_id=&worker_id=&date=` | Slots libres calculados. |
| `POST /public/businesses/:slug/appointments` | Crea una solicitud/cita con payload mínimo. |
| `GET /public/businesses/:slug/queue` | Resumen público permitido de cola. |

### Administración autenticada

| Método y ruta | Rol | Propósito |
| --- | --- | --- |
| `GET/PATCH /admin/business` | ADMIN, SUPERADMIN | Perfil y ajustes del tenant actual. |
| `GET/POST /admin/workers` | ADMIN, SUPERADMIN | Listado/alta en tenant. |
| `GET/PATCH /admin/workers/:id` | ADMIN propio, SUPERADMIN | Perfil y estado del trabajador. |
| `GET/PUT /admin/workers/:id/schedule` | ADMIN propio, worker propio | Horario semanal. |
| `GET/POST/PATCH/DELETE /admin/workers/:id/schedule-exceptions` | ADMIN propio, worker propio limitado | Excepciones y bloqueos. |
| `GET/POST /admin/services` y `PATCH /admin/services/:id` | ADMIN, SUPERADMIN | Catálogo de tenant. |
| `GET /admin/appointments` y `PATCH /admin/appointments/:id` | ADMIN propio, SUPERADMIN | Agenda y cambios de estado. |
| `GET/POST/PATCH /admin/portfolio` | ADMIN propio, SUPERADMIN | Gestión de galería y visibilidad. |
| `POST /admin/media/upload-url` | ADMIN propio, worker autorizado | URL firmada, validación de tipo/tamaño y clave por tenant. |
| `GET/POST/PATCH /admin/queue` | ADMIN propio, WORKER_WALKIN propio | Cola de barbería. |

### Portal de trabajador

El portal no debe aceptar `worker_id` como autoridad. Debe usar el claim de identidad:

- `GET /portal/me`
- `GET /portal/me/schedule`
- `PUT /portal/me/schedule` (solo reglas permitidas)
- `GET /portal/me/appointments`
- `PATCH /portal/me/appointments/:id` (solo transición autorizada de su propia cita)
- `GET /portal/me/queue` y `PATCH /portal/me/queue/:id` para `WORKER_WALKIN`.

## 8. Convenciones de respuesta y errores

- Fechas API: `YYYY-MM-DD`; horas API: `HH:mm` de 24 h; timestamps de auditoría: ISO-8601 UTC.
- IDs: UUID v4 en texto. No exponer claves de almacenamiento ni credenciales.
- La API responde `401` sin token, `403` con token sin rol/tenant, `404` cuando un recurso no existe **dentro del tenant autorizado** (evita enumeración), `409` para conflicto de reserva/solapamiento y `422` para reglas de agenda o payload inválido.
- Las respuestas de colecciones tienen formato paginable antes de que su volumen lo requiera: `{ "data": [], "meta": { "page": 1, "page_size": 20, "total": 0 } }`.

## 9. Estrategia de transición del frontend

1. **Inventario y adaptador:** introducir un cliente `api` común en frontend, con tipos explícitos del contrato. No cambiar pantallas simultáneamente.
2. **Lecturas públicas:** migrar primero `/barberia` y `/manicura` de `supabase.from('workers'|'services')` a `/public/businesses/:slug/...`. Retirar suscripciones globales de Realtime que hoy pueden cruzar negocios.
3. **Reservas:** implementar disponibilidad y `POST /public/.../appointments`; eliminar la inserción directa que usa `date_time`. No activar la UI como “confirmación inmediata” hasta que el servidor controle conflictos.
4. **Auth y paneles:** sustituir Supabase Auth de los logins, admins y portal por JWT de NestJS. Migrar módulo por módulo: workers/schedules, services, appointments, queue, portfolio/settings.
5. **Corte de escritura:** después de validar cada módulo, retirar el acceso de escritura directo desde el navegador y ajustar RLS a mínimo privilegio. No mezclar durante mucho tiempo dos escritores para una misma entidad.
6. **Retiro de legado:** eliminar los adaptadores `date_time`, claves públicas innecesarias y políticas permisivas solo después de migrar/validar los datos existentes y contar con respaldo.

## 10. Checklist de aceptación de Fase 0

- [ ] Cada ruta API de negocio resuelve o valida tenant de forma centralizada.
- [ ] Ningún endpoint autenticado de escritura acepta un `business_id` sin comprobarlo contra el actor.
- [ ] Las citas solo usan el contrato `date + start_time + end_time`; `date_time` queda únicamente en un adaptador temporal.
- [ ] Los endpoints público/admin/portal tienen DTOs separados y no serializan campos privados.
- [ ] Todos los controladores de escritura combinan JWT, roles y alcance de tenant/recurso.
- [ ] Frontend no escribe directamente en tablas Supabase al cerrar la transición.
- [ ] RLS, credenciales y almacenamiento se revisan y restringen antes de datos reales.

## 11. Diferencias que requerirán trabajo posterior

- `BusinessSetting.key` es globalmente único en el esquema actual, pero los settings se consultan por `business_id`; el contrato exige unicidad por `(business_id, key)` para evitar colisión entre marcas.
- `User` no tiene asignación de negocio para `ADMIN` sin perfil `Worker`; se necesita una relación de membresía o un `business_id` administrado de forma explícita.
- Falta el módulo de API para citas, cola, portafolio, settings, disponibilidad, carga de medios y autorización por recurso.
- Faltan atributos de presentación previstos (zona horaria, imagen de portada, categorías, orden/destacado, especialidades, buffers y configuración de reservas). Se agregarán con migraciones de una fase posterior, no en esta documentación.

