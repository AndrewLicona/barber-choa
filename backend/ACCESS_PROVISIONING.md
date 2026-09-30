# Provisionamiento de acceso administrativo

La autenticación se mantiene en Supabase Auth. Los permisos se registran en `user_business_access`, usando el UUID de `auth.users.id` como `auth_user_id`.

## Cuenta única para el dueño

Para permitir que una sola cuenta administre Barber Choa y LM Nails, cree un único grant `SUPERADMIN` con `business_id` nulo. Este grant se debe realizar desde el SQL Editor de Supabase o un proceso administrativo seguro, nunca desde el navegador público.

```sql
INSERT INTO public.user_business_access (auth_user_id, business_id, role, is_active)
VALUES ('UUID-DE-LA-CUENTA-DEL-DUENO', NULL, 'SUPERADMIN', true);
```

El UUID se consulta en **Authentication → Users** en Supabase. No use correo electrónico como permiso ni lo incluya en el código.

## Administrador de una sola marca

```sql
INSERT INTO public.user_business_access (auth_user_id, business_id, role, is_active)
SELECT 'UUID-DE-LA-CUENTA', id, 'ADMIN', true
FROM public.businesses
WHERE slug = 'barberia'; -- usar 'manicura' para LM Nails
```

## Orden de puesta en marcha

1. Aplicar la migración `20260926103000_add_user_business_access` mediante el flujo revisado de migraciones.
2. Crear el grant `SUPERADMIN` de la cuenta del dueño.
3. Iniciar sesión una sola vez y abrir `/admin`.
4. Verificar que la misma cuenta accede a ambos paneles y que una cuenta `ADMIN` solo accede a su marca.

No se aplicó esta migración ni se creó ningún usuario/grant automáticamente durante el desarrollo.
