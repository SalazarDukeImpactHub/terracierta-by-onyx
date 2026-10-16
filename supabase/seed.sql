-- Datos semilla de EJEMPLO (inventados para la demo; no son personas ni cooperativas reales).
-- Las wallets usan el dominio reservado wallet.example.test: son marcadores, hay que reemplazarlos
-- por wallets reales cuando el compañero de login entregue la asignación.

-- Perfiles de ejemplo (provisionales; ver migración profiles_provisional)
insert into public.profiles (id, rol, nombre, municipio, tiene_invima, wallet_address) values
  ('11111111-1111-4111-8111-111111111111', 'caficultor',  'Marta Ospina',  'Marsella', true,  'https://wallet.example.test/marta-ospina'),
  ('22222222-2222-4222-8222-222222222222', 'caficultor',  'Jairo Montoya', 'Andes',    false, 'https://wallet.example.test/jairo-montoya'),
  ('33333333-3333-4333-8333-333333333333', 'cooperativa', 'Cooperativa Cumbres Cafeteras (cuenta demo)', 'Marsella', false, 'https://wallet.example.test/cumbres-cafeteras');

-- Cooperativas precargadas (la primera tiene cuenta demo que aprueba pagos)
insert into public.cooperativas (id, perfil_id, nombre, municipio, precio_base_kg, capacidad_kg, metodos_aceptados, variedades_aceptadas) values
  ('aaaaaaaa-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Cooperativa Cumbres Cafeteras', 'Marsella', 21500, 5000,  '{lavado,honey}',         '{Caturra,Castillo,Colombia}'),
  ('aaaaaaaa-0002-4000-8000-000000000002', null, 'Cooperativa Raíz Alta',            'Andes',    19800, 12000, '{lavado,natural}',       '{Caturra,Castillo,Typica}'),
  ('aaaaaaaa-0003-4000-8000-000000000003', null, 'Cooperativa Aroma del Suroeste',   'Jardín',   23000, 3000,  '{lavado,honey,natural}','{Caturra,Castillo,Colombia,Geisha}'),
  ('aaaaaaaa-0004-4000-8000-000000000004', null, 'Cooperativa Tierra Nueva',         'Urrao',    18900, 20000, '{lavado}',               '{Castillo,Colombia}');

-- Productos de ejemplo de Marta (sin foto: la interfaz muestra un marcador; las fotos se suben desde el panel)
insert into public.productos (id, dueno_id, nombre, descripcion, precio_cop, foto_url, publicado) values
  ('bbbbbbbb-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Marsella lavado · 500 g',
   'Café de mi finca en Marsella, proceso lavado. Cultivado a la sombra, secado al sol. Molido o en grano, vos elegís.',
   38000, null, true),
  ('bbbbbbbb-0002-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Caturra tostado · 250 g',
   'Tostión media, notas a panela y cacao. Se tuesta en la semana del despacho.',
   21000, null, true),
  ('bbbbbbbb-0003-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   'Honey de altura · 500 g',
   'Lote pequeño en proceso honey. Borrador: todavía no está publicado.',
   42000, null, false);
