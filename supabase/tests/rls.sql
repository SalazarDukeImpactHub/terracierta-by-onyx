-- Pruebas de RLS. Contra la base local:
--   docker exec -i supabase_db_terracierta-by-onyx psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/rls.sql
-- Contra Supabase en la nube: pegar este archivo completo en el SQL Editor y ejecutarlo (con el seed limpio).
--   Si todo está bien, devuelve una fila "RLS: todas las pruebas pasaron". Si algo falla, muestra el error en rojo.
-- Todo ocurre dentro de una transacción que termina en ROLLBACK: no deja datos.
-- Espera el seed limpio (cuenta filas): `npm run test:rls` recrea la base antes de correrlo.
-- Cada bloque lanza una excepción si el comportamiento no es el esperado.
-- Actores: anon (sin sesión) · Marta (caficultora con INVIMA) · Jairo (caficultor sin INVIMA) · Cumbres (cooperativa demo).

begin;

-- Datos de prueba creados como superusuario (el servidor usa la llave de servicio, que también se salta RLS)
reset role;
insert into public.pagos (id, tipo, referencia_id, monto, wallet_pagador, wallet_receptor)
  values ('test_pago_1', 'pedido', 'cccccccc-0001-4000-8000-000000000001', 38000,
          'https://wallet.example.test/andres-giraldo', 'https://wallet.example.test/marta-ospina');
-- El pedido lo hizo el comprador Andrés (cuenta con wallet propia)
insert into public.pedidos (id, producto_id, comprador_id, wallet_comprador, cantidad, monto, pago_id)
  values ('cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001',
          '44444444-4444-4444-8444-444444444444', 'https://wallet.example.test/andres-giraldo', 1, 38000, 'test_pago_1');
insert into public.lotes (id, caficultor_id, metodo, variedad, kg, municipio)
  values ('dddddddd-0001-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'lavado', 'Castillo', 300, 'Andes');
insert into public.ofertas (id, lote_id, cooperativa_id, precio_kg, total)
  values ('eeeeeeee-0001-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000001',
          'aaaaaaaa-0001-4000-8000-000000000001', 21000, 6300000);

-- Helper: cuenta filas visibles de una tabla con el rol actual
create or replace function pg_temp.cuenta(tabla text) returns int language plpgsql as $$
declare n int;
begin
  execute format('select count(*) from %s', tabla) into n;
  return n;
end $$;
grant execute on function pg_temp.cuenta(text) to anon, authenticated;

create or replace function pg_temp.esperar(nombre text, obtenido int, esperado int) returns void language plpgsql as $$
begin
  if obtenido is distinct from esperado then
    raise exception 'FALLÓ [%]: obtuvo %, esperaba %', nombre, obtenido, esperado;
  end if;
  raise notice 'OK    [%] = %', nombre, obtenido;
end $$;
grant execute on function pg_temp.esperar(text, int, int) to anon, authenticated;

-- ======================= ANON (sin sesión) =======================
set local role anon;

select pg_temp.esperar('anon ve productos publicados', pg_temp.cuenta('public.productos'), 2);
select pg_temp.esperar('anon ve 0 pedidos', pg_temp.cuenta('public.pedidos'), 0);
select pg_temp.esperar('anon ve 0 pagos', pg_temp.cuenta('public.pagos'), 0);
select pg_temp.esperar('anon ve 0 lotes', pg_temp.cuenta('public.lotes'), 0);
select pg_temp.esperar('anon ve 0 ofertas', pg_temp.cuenta('public.ofertas'), 0);
select pg_temp.esperar('anon ve 0 cooperativas', pg_temp.cuenta('public.cooperativas'), 0);
select pg_temp.esperar('anon ve 0 perfiles (wallets no se filtran)', pg_temp.cuenta('public.profiles'), 0);
select pg_temp.esperar('anon ve la vista tiendas_publicas', pg_temp.cuenta('public.tiendas_publicas'), 1);

do $$ begin
  begin
    perform wallet_address from public.tiendas_publicas;
    raise exception 'FALLÓ: la vista pública expone wallet_address';
  exception when undefined_column then raise notice 'OK    [la vista pública no expone wallet_address]';
  end;
  begin
    insert into public.productos (dueno_id, nombre, precio_cop) values ('11111111-1111-4111-8111-111111111111', 'Intruso', 5000);
    raise exception 'FALLÓ: anon pudo insertar un producto';
  exception when insufficient_privilege then raise notice 'OK    [anon no puede insertar productos]';
  end;
end $$;

-- ======================= MARTA (caficultora con INVIMA) =======================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select pg_temp.esperar('Marta ve sus 3 productos (incl. borrador)', pg_temp.cuenta('public.productos'), 3);
select pg_temp.esperar('Marta ve su pedido', pg_temp.cuenta('public.pedidos'), 1);
select pg_temp.esperar('Marta ve el pago recibido en su wallet', pg_temp.cuenta('public.pagos'), 1);
select pg_temp.esperar('Marta ve 0 lotes de otros', pg_temp.cuenta('public.lotes'), 0);
select pg_temp.esperar('Marta ve 0 ofertas ajenas', pg_temp.cuenta('public.ofertas'), 0);
select pg_temp.esperar('Marta ve solo su perfil', pg_temp.cuenta('public.profiles'), 1);

do $$
declare filas int;
begin
  insert into public.productos (dueno_id, nombre, precio_cop) values ('11111111-1111-4111-8111-111111111111', 'Producto propio de prueba', 25000);
  raise notice 'OK    [Marta puede crear un producto propio]';

  begin
    insert into public.productos (dueno_id, nombre, precio_cop) values ('22222222-2222-4222-8222-222222222222', 'A nombre de otro', 25000);
    raise exception 'FALLÓ: Marta creó un producto a nombre de Jairo';
  exception when insufficient_privilege then raise notice 'OK    [Marta NO puede crear productos a nombre de otro]';
  end;

  begin
    insert into public.pedidos (producto_id, wallet_comprador, monto) values ('bbbbbbbb-0001-4000-8000-000000000001', 'https://x.example.test/a', 1000);
    raise exception 'FALLÓ: un usuario pudo insertar un pedido directo';
  exception when insufficient_privilege then raise notice 'OK    [los pedidos solo se escriben desde el servidor]';
  end;

  begin
    insert into public.pagos (id, tipo, referencia_id, monto, wallet_pagador, wallet_receptor)
      values ('x_fake', 'pedido', 'cccccccc-0001-4000-8000-000000000001', 1, 'a', 'b');
    raise exception 'FALLÓ: un usuario pudo insertar un pago directo';
  exception when insufficient_privilege then raise notice 'OK    [los pagos solo se escriben desde el servidor]';
  end;

  update public.pagos set estado = 'completado' where id = 'test_pago_1';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLÓ: un usuario pudo modificar el estado de un pago'; end if;
  raise notice 'OK    [nadie con sesión puede modificar un pago]';
end $$;

-- ======================= JAIRO (caficultor SIN INVIMA) =======================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);

select pg_temp.esperar('Jairo ve solo los 2 publicados (no el borrador de Marta)', pg_temp.cuenta('public.productos'), 2);
select pg_temp.esperar('Jairo no ve pedidos de Marta', pg_temp.cuenta('public.pedidos'), 0);
select pg_temp.esperar('Jairo no ve pagos de Marta', pg_temp.cuenta('public.pagos'), 0);
select pg_temp.esperar('Jairo ve su lote', pg_temp.cuenta('public.lotes'), 1);
select pg_temp.esperar('Jairo ve la oferta sobre su lote', pg_temp.cuenta('public.ofertas'), 1);
select pg_temp.esperar('Jairo ve las 4 cooperativas', pg_temp.cuenta('public.cooperativas'), 4);

do $$
declare filas int;
begin
  begin
    insert into public.productos (dueno_id, nombre, precio_cop) values ('22222222-2222-4222-8222-222222222222', 'Sin INVIMA no vende', 25000);
    raise exception 'FALLÓ: un caficultor sin INVIMA pudo crear un producto';
  exception when insufficient_privilege then raise notice 'OK    [sin INVIMA no se puede abrir tienda (RLS)]';
  end;

  update public.productos set precio_cop = 1000 where id = 'bbbbbbbb-0001-4000-8000-000000000001';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLÓ: Jairo pudo editar un producto de Marta'; end if;
  raise notice 'OK    [Jairo NO puede editar productos de Marta]';

  update public.cooperativas set precio_base_kg = 1 where id = 'aaaaaaaa-0002-4000-8000-000000000002';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLÓ: Jairo pudo editar una cooperativa'; end if;
  raise notice 'OK    [Jairo NO puede editar cooperativas]';
end $$;

-- ======================= CUMBRES (cooperativa demo) =======================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);

select pg_temp.esperar('Cumbres ve la oferta que emitió', pg_temp.cuenta('public.ofertas'), 1);
select pg_temp.esperar('Cumbres ve el lote sobre el que ofertó', pg_temp.cuenta('public.lotes'), 1);
select pg_temp.esperar('Cumbres no ve pedidos de tiendas', pg_temp.cuenta('public.pedidos'), 0);

do $$
declare filas int;
begin
  update public.cooperativas set capacidad_kg = 5100 where id = 'aaaaaaaa-0001-4000-8000-000000000001';
  get diagnostics filas = row_count;
  if filas <> 1 then raise exception 'FALLÓ: Cumbres no pudo editar su propia cooperativa'; end if;
  raise notice 'OK    [Cumbres edita su propia cooperativa]';

  update public.cooperativas set capacidad_kg = 1 where id = 'aaaaaaaa-0002-4000-8000-000000000002';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLÓ: Cumbres pudo editar otra cooperativa'; end if;
  raise notice 'OK    [Cumbres NO edita cooperativas ajenas]';
end $$;

-- ======================= ANDRÉS (comprador, hizo el pedido de prueba) =======================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);

select pg_temp.esperar('Andrés ve su compra', pg_temp.cuenta('public.pedidos'), 1);
select pg_temp.esperar('Andrés ve el pago que hizo', pg_temp.cuenta('public.pagos'), 1);
select pg_temp.esperar('Andrés ve solo su perfil', pg_temp.cuenta('public.profiles'), 1);
select pg_temp.esperar('Andrés no ve lotes', pg_temp.cuenta('public.lotes'), 0);
select pg_temp.esperar('Andrés no ve ofertas', pg_temp.cuenta('public.ofertas'), 0);
select pg_temp.esperar('Andrés ve el catálogo publicado (no el borrador)', pg_temp.cuenta('public.productos'), 2);

do $$
declare filas int;
begin
  begin
    insert into public.pedidos (producto_id, comprador_id, wallet_comprador, monto)
      values ('bbbbbbbb-0001-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'https://wallet.example.test/andres-giraldo', 1000);
    raise exception 'FALLÓ: un comprador pudo insertar un pedido directo (debe hacerlo solo el servidor)';
  exception when insufficient_privilege then raise notice 'OK    [el comprador NO escribe pedidos directo]';
  end;

  update public.pedidos set monto = 1 where id = 'cccccccc-0001-4000-8000-000000000001';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLÓ: un comprador pudo modificar un pedido'; end if;
  raise notice 'OK    [el comprador NO modifica pedidos]';

  begin
    insert into public.productos (dueno_id, nombre, precio_cop) values ('44444444-4444-4444-8444-444444444444', 'Un comprador no vende', 5000);
    raise exception 'FALLÓ: un comprador pudo crear un producto';
  exception when insufficient_privilege then raise notice 'OK    [el comprador NO crea productos]';
  end;
end $$;

-- ======================= SOFÍA (otra compradora, sin compras) =======================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);

select pg_temp.esperar('Sofía no ve la compra de Andrés', pg_temp.cuenta('public.pedidos'), 0);
select pg_temp.esperar('Sofía no ve el pago de Andrés', pg_temp.cuenta('public.pagos'), 0);

reset role;
rollback;
-- Si llegó hasta aquí, ninguna verificación lanzó excepción. (Es un select, no \echo: así también corre en el SQL Editor de Supabase.)
select 'RLS: todas las pruebas pasaron (transacción revertida)' as resultado;
