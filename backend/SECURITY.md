# Seguridad de configuración y RLS

## Estado de Fase 0

`apply_rls.mjs` está deshabilitado intencionalmente. No se deben aplicar políticas
RLS mediante un script que contenga credenciales ni mediante reglas universales
como `FOR ALL USING (true)`. Los cambios de base de datos se revisan y aplican
manualmente con una migración versionada después de definir la identidad y los
roles de la aplicación.

## Rotar la credencial expuesta

La credencial que existía en el historial de trabajo debe considerarse
comprometida, aunque se retire del árbol actual.

1. En Supabase, revocar o regenerar el token de Management API afectado.
2. Rotar cualquier `service_role` key, contraseña de base de datos y JWT secret
   que pudiera haber compartido el mismo entorno o haber sido copiado en otros
   lugares.
3. Actualizar los secretos únicamente en el gestor de secretos o en un `.env`
   local no versionado. Partir de `.env.example`; no copiar claves a archivos
   `NEXT_PUBLIC_*` ni al repositorio.
4. Revisar el historial y los registros de CI/despliegue para eliminar el token
   de secretos almacenados, artefactos o variables antiguas. Si el repositorio se
   comparte, coordinar la limpieza del historial con el propietario antes de
   forzar cambios.
5. Verificar que los tokens anteriores ya no autentican y registrar quién hizo
   la rotación y cuándo.

## Diseño obligatorio antes de habilitar RLS

La aplicación tiene dos negocios independientes. Cada tabla con datos de negocio
debe contener o poder resolver un `business_id`; ninguna política debe depender
del valor enviado por el navegador sin validar el usuario autenticado.

- Definir una tabla o reclamo de pertenencia que relacione `auth.uid()` con un
  usuario interno, su rol y los `business_id` autorizados.
- Separar permisos mínimos: cliente, profesional y administrador. Los
  administradores de Barber Choa no pueden leer ni modificar datos de LM Nails,
  salvo una asignación explícita para ambos negocios.
- Limitar escrituras públicas a una función/RPC o endpoint de reservas con
  validación de servicio, profesional, horario, solapamientos y negocio. No dar
  `INSERT`, `UPDATE` o `DELETE` global a `anon`.
- Dejar que NestJS/Prisma se conecte con una credencial de servidor que no se
  expone al cliente. Si se conserva acceso directo de Supabase desde el
  frontend, las políticas RLS deben cubrir todas las tablas y operaciones.
- Añadir pruebas de aislamiento: un token de cada negocio debe fallar al leer,
  modificar o eliminar registros del otro, incluidas citas, horarios, cola,
  servicios, trabajadores, configuración y futuras galerías.

## Aplicación y verificación manual

1. Acordar y revisar una migración SQL versionada con políticas nombradas por
   tabla y operación (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
2. Probarla primero en un proyecto de desarrollo con cuentas representativas de
   cada rol y de ambos negocios.
3. En el SQL Editor o proceso de migración autorizado, habilitar RLS y aplicar
   únicamente la migración revisada. No ejecutar `apply_rls.mjs`.
4. Confirmar que no existen políticas universales y que las tablas sensibles
   tienen RLS habilitado. Ejecutar las pruebas de aislamiento antes de promover
   a producción.
5. Mantener una vía de despliegue auditada; nunca llamar la Management API desde
   scripts guardados en el repositorio con tokens incrustados.
