-- Tablas propias de Terracierta by Onyx (brief §6).
-- Montos en pesos colombianos (COP) como enteros: no hay decimales en COP.
-- Columnas agregadas al brief (aditivas, marcadas): pedidos.cantidad, pedidos.creado_en,
-- cooperativas.variedades_aceptadas, y las marcas de tiempo.

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null references public.profiles (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 3 and 80),
  descripcion text not null default '' check (char_length(descripcion) <= 600),
  precio_cop integer not null check (precio_cop between 1000 and 100000000),
  foto_url text,
  publicado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index productos_dueno_idx on public.productos (dueno_id);
create index productos_publicado_idx on public.productos (publicado) where publicado;

create table public.pagos (
  -- id = pagoId que devuelve el módulo de pagos (texto: puede no ser uuid)
  id text primary key,
  tipo text not null check (tipo in ('pedido', 'oferta')),
  referencia_id uuid not null,
  monto integer not null check (monto > 0),
  wallet_pagador text not null,
  wallet_receptor text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completado', 'fallido')),
  detalle_json jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index pagos_referencia_idx on public.pagos (tipo, referencia_id);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete restrict,
  wallet_comprador text not null,
  cantidad integer not null default 1 check (cantidad between 1 and 20), -- agregada
  monto integer not null check (monto > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'fallido')),
  pago_id text references public.pagos (id) on delete set null,
  creado_en timestamptz not null default now() -- agregada
);
create index pedidos_producto_idx on public.pedidos (producto_id);

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  caficultor_id uuid not null references public.profiles (id) on delete cascade,
  metodo text not null check (metodo in ('lavado', 'honey', 'natural')),
  variedad text not null check (char_length(variedad) between 2 and 60),
  kg integer not null check (kg between 1 and 100000),
  municipio text not null,
  estado text not null default 'registrado' check (estado in ('registrado', 'con_ofertas', 'vendido')),
  creado_en timestamptz not null default now()
);
create index lotes_caficultor_idx on public.lotes (caficultor_id);

create table public.cooperativas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references public.profiles (id) on delete set null, -- null = precargada sin cuenta
  nombre text not null,
  municipio text not null,
  precio_base_kg integer not null check (precio_base_kg > 0),
  capacidad_kg integer not null check (capacidad_kg > 0),
  metodos_aceptados text[] not null default '{}',
  variedades_aceptadas text[] not null default '{}' -- agregada (el agente puntúa método y variedad)
);

create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes (id) on delete cascade,
  cooperativa_id uuid not null references public.cooperativas (id) on delete restrict,
  precio_kg integer not null check (precio_kg > 0),
  total integer not null check (total > 0),
  estado text not null default 'propuesta' check (estado in ('propuesta', 'aceptada', 'pagada', 'fallida')),
  pago_id text references public.pagos (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index ofertas_lote_idx on public.ofertas (lote_id);
create index ofertas_cooperativa_idx on public.ofertas (cooperativa_id);
