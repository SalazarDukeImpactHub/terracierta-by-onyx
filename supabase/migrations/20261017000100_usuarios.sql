-- Cuentas con las que se entra al presionar Entrar.
-- profiles.id coincide con usuarios.id (el resto de la app sigue leyendo profiles).
-- El token NO lo escribe el registro: se asigna a mano en la base.

create table public.usuarios (
  id uuid primary key,
  nombres text not null check (char_length(nombres) between 2 and 60),
  apellidos text not null check (char_length(apellidos) between 2 and 60),
  tipo_documento text check (tipo_documento is null or tipo_documento in ('CC', 'CE', 'TI', 'PA', 'PPT', 'NIT')),
  numero_documento text check (numero_documento is null or char_length(numero_documento) between 5 and 20),
  fecha_nacimiento date not null check (
    fecha_nacimiento <= current_date and fecha_nacimiento >= date '1900-01-01'
  ),
  correo text not null check (char_length(correo) between 5 and 200),
  contrasena_hash text not null,
  tiene_invima boolean not null,
  rol text not null check (rol in ('caficultor', 'cooperativa', 'comprador')),
  token text,
  creado_en timestamptz not null default now()
);

create unique index usuarios_correo_idx on public.usuarios (correo);
create unique index usuarios_documento_idx on public.usuarios (tipo_documento, numero_documento);

comment on table public.usuarios is 'Cuentas de login. La contraseña se guarda solo como hash scrypt.';
comment on column public.usuarios.token is 'Se asigna a mano en la base. El formulario de registro no lo escribe.';

create table public.sesiones (
  id text primary key,
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  expira_en timestamptz not null
);

create index sesiones_usuario_idx on public.sesiones (usuario_id);

alter table public.usuarios enable row level security;
alter table public.sesiones enable row level security;

-- Sin políticas: solo el servidor (service role) lee y escribe estas tablas.
revoke all on public.usuarios from public, anon, authenticated;
revoke all on public.sesiones from public, anon, authenticated;
grant select, insert, update, delete on public.usuarios to service_role;
grant select, insert, update, delete on public.sesiones to service_role;
