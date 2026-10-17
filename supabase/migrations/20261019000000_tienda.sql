-- Nombre y logo de la tienda del caficultor con INVIMA. El catálogo público muestra ese nombre
-- (o el del perfil, si todavía no lo definió) y el logo, sin exponer la wallet.

alter table public.profiles add column if not exists tienda_nombre text;
alter table public.profiles add column if not exists tienda_logo_url text;

alter table public.profiles drop constraint if exists profiles_tienda_nombre_len;
alter table public.profiles
  add constraint profiles_tienda_nombre_len
  check (tienda_nombre is null or char_length(btrim(tienda_nombre)) between 3 and 80);

create or replace view public.tiendas_publicas as
select
  p.id,
  coalesce(nullif(btrim(p.tienda_nombre), ''), p.nombre) as nombre,
  p.municipio,
  p.tienda_logo_url as logo_url
from public.profiles p
where p.rol = 'caficultor'
  and p.tiene_invima
  and exists (select 1 from public.productos pr where pr.dueno_id = p.id and pr.publicado);

grant select on public.tiendas_publicas to anon, authenticated;
