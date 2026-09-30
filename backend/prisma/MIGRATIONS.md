# Migraciones de Prisma

Las migraciones se versionan en esta carpeta y se aplican de forma explícita por ambiente. No se ejecuta `prisma db push` contra bases compartidas o de producción.

## Primera migración versionada

`20260926090000_expand_business_content` es aditiva: agrega atributos editables para negocio, profesional y servicio, y crea la relación `worker_services`.

Antes de aplicarla en un ambiente real:

1. Confirmar que existe una copia de seguridad de PostgreSQL/Supabase.
2. Revisar el SQL con el responsable de datos.
3. Rotar la credencial administrativa expuesta anteriormente.
4. Aplicar por el flujo de migraciones aprobado para ese ambiente.
5. Verificar que cada servicio y profesional conserva el `business_id` correcto.

La aplicación de la migración queda pendiente de autorización y no se ejecutó durante esta tarea.
