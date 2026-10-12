-- Insertar SUPERADMIN global (business_id NULL) para el usuario superadmin.choa@choastudio.test
INSERT INTO "user_business_access" ("user_id", "auth_user_id", "business_id", "role", "is_active")
VALUES 
  (
    'd36212c8-e1bb-4bb5-821f-419e6bb29bab', -- user id del superadmin
    '99ba8967-a896-4900-b824-fa8973b89c86', -- auth_user_id del superadmin
    NULL, -- business_id NULL = SUPERADMIN global (puede administrar todos los negocios)
    'SUPERADMIN',
    true
  );

-- También asegurar que el admin@barberchoa.com tenga acceso SUPERADMIN si es necesario
-- (commentado por ahora: auth_user_id es null para este usuario)
-- INSERT INTO "user_business_access" ("user_id", "auth_user_id", "business_id", "role", "is_active")
-- VALUES (
--   '50992d13-afcf-47b8-b060-49c1299d7fb5',
--   NULL,
--   NULL,
--   'SUPERADMIN',
--   true
-- );

SELECT 'SUPERADMIN global insertado correctamente';
SELECT * FROM "user_business_access" WHERE role = 'SUPERADMIN' AND business_id IS NULL;