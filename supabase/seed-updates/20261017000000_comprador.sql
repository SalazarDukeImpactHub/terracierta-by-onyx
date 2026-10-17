-- Datos de ejemplo que agrega la migración 20261017000000_comprador.sql.
-- Para un proyecto que YA tiene el seed original: se aplica junto con la migración (npm run cloud:update).
-- Es idempotente. En un proyecto nuevo estos perfiles ya vienen en supabase/seed.sql.
insert into public.profiles (id, rol, nombre, municipio, tiene_invima, wallet_address) values
  ('44444444-4444-4444-8444-444444444444', 'comprador', 'Andrés Giraldo', 'Medellín', false, 'https://wallet.example.test/andres-giraldo'),
  ('55555555-5555-4555-8555-555555555555', 'comprador', 'Sofía Arango (su pago falla)', 'Medellín', false, 'https://wallet.example.test/fail-sofia-arango')
on conflict (id) do nothing;
