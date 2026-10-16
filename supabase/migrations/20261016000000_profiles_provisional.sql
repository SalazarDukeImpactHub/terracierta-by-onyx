-- PROVISIONAL — esta tabla es del compañero de login (`/src/auth`).
-- Existe solo para que las tablas propias tengan a quién apuntar y para poder correr la página
-- con mocks. Cuando llegue la tabla real, se reemplaza este archivo (mismas columnas del contrato 7.2).
-- En la versión real, profiles.id = auth.users.id. Aquí no hay FK a auth.users para poder sembrar datos de ejemplo.

create table public.profiles (
  id uuid primary key,
  rol text not null check (rol in ('caficultor', 'cooperativa')),
  nombre text not null,
  municipio text not null,
  tiene_invima boolean not null default false,
  wallet_address text,
  creado_en timestamptz not null default now()
);

comment on table public.profiles is 'PROVISIONAL (compañero de login). Contrato 7.2 del brief.';
