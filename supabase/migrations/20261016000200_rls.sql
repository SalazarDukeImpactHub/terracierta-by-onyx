-- RLS (brief §6): cada caficultor ve y edita solo lo suyo; el catálogo público es de solo lectura
-- sobre publicado = true; las cooperativas ven sus ofertas.
-- Las ESCRITURAS sensibles (pedidos, pagos, ofertas) las hace únicamente el servidor con la llave de
-- servicio, tras validar. Por eso esas tablas no tienen políticas de insert/update para usuarios.

alter table public.profiles enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pagos enable row level security;
alter table public.lotes enable row level security;
alter table public.cooperativas enable row level security;
alter table public.ofertas enable row level security;

-- profiles (tabla del compañero; estas políticas son provisionales): cada quien ve su propia fila.
create policy profiles_propio_lee on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- productos
create policy productos_publico_lee on public.productos
  for select to anon, authenticated using (publicado);

create policy productos_dueno_todo on public.productos
  for all to authenticated
  using (dueno_id = (select auth.uid()))
  with check (
    dueno_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.rol = 'caficultor' and p.tiene_invima
    )
  );

-- pedidos: solo el dueño del producto los ve. El comprador no tiene sesión: crea y consulta por el servidor.
create policy pedidos_dueno_lee on public.pedidos
  for select to authenticated
  using (exists (
    select 1 from public.productos pr
    where pr.id = pedidos.producto_id and pr.dueno_id = (select auth.uid())
  ));

-- pagos: lo ve quien cobra (su wallet es la receptora) o quien paga (su wallet es la pagadora).
create policy pagos_partes_leen on public.pagos
  for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.wallet_address is not null
      and p.wallet_address in (pagos.wallet_receptor, pagos.wallet_pagador)
  ));

-- lotes: el caficultor dueño; la cooperativa que tiene una oferta sobre ese lote.
create policy lotes_dueno_todo on public.lotes
  for all to authenticated
  using (caficultor_id = (select auth.uid()))
  with check (caficultor_id = (select auth.uid()));

-- Las políticas de lotes y ofertas se consultan entre sí; sin estas funciones Postgres detecta
-- recursión infinita. Corren con permisos del dueño (saltan RLS) pero solo devuelven un booleano
-- sobre el usuario de la sesión actual.
create function public.es_dueno_del_lote(p_lote uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lotes l where l.id = p_lote and l.caficultor_id = (select auth.uid())
  )
$$;

create function public.cooperativa_tiene_oferta_en_lote(p_lote uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ofertas o
    join public.cooperativas c on c.id = o.cooperativa_id
    where o.lote_id = p_lote and c.perfil_id = (select auth.uid())
  )
$$;

revoke execute on function public.es_dueno_del_lote(uuid), public.cooperativa_tiene_oferta_en_lote(uuid) from public, anon;
grant execute on function public.es_dueno_del_lote(uuid), public.cooperativa_tiene_oferta_en_lote(uuid) to authenticated;

create policy lotes_cooperativa_lee on public.lotes
  for select to authenticated
  using (public.cooperativa_tiene_oferta_en_lote(id));

-- cooperativas: las ven los usuarios con sesión (el agente las puntúa); cada una edita solo la suya.
create policy cooperativas_lee on public.cooperativas
  for select to authenticated using (true);

create policy cooperativas_propia_actualiza on public.cooperativas
  for update to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

-- ofertas: las ve el dueño del lote y la cooperativa que la emitió.
create policy ofertas_partes_leen on public.ofertas
  for select to authenticated
  using (
    public.es_dueno_del_lote(lote_id)
    or exists (select 1 from public.cooperativas c where c.id = ofertas.cooperativa_id and c.perfil_id = (select auth.uid()))
  );

-- Defensa en profundidad: el rol anónimo no escribe nada en ninguna tabla.
revoke insert, update, delete, truncate on all tables in schema public from anon;
