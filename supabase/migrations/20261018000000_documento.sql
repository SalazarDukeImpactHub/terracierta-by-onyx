-- Tipo y número de documento en la cuenta. Idempotente: sirve si la tabla ya existía sin estas columnas.

alter table public.usuarios add column if not exists tipo_documento text;
alter table public.usuarios add column if not exists numero_documento text;

-- Las cuentas ya creadas quedan sin documento. El formulario de ahora en adelante lo exige.

alter table public.usuarios drop constraint if exists usuarios_tipo_documento_check;
alter table public.usuarios
  add constraint usuarios_tipo_documento_check
  check (tipo_documento is null or tipo_documento in ('CC', 'CE', 'TI', 'PA', 'PPT', 'NIT'));

alter table public.usuarios drop constraint if exists usuarios_numero_documento_check;
alter table public.usuarios
  add constraint usuarios_numero_documento_check
  check (numero_documento is null or char_length(numero_documento) between 5 and 20);

create unique index if not exists usuarios_documento_idx on public.usuarios (tipo_documento, numero_documento);
