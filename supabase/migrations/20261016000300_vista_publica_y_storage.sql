-- Vista pública de tiendas: expone SOLO id, nombre y municipio de caficultores con INVIMA que tienen
-- al menos un producto publicado. No expone wallet ni otras columnas de profiles.
-- La vista corre con permisos del dueño (salta RLS de profiles a propósito, con columnas acotadas).
create view public.tiendas_publicas as
select p.id, p.nombre, p.municipio
from public.profiles p
where p.rol = 'caficultor'
  and p.tiene_invima
  and exists (select 1 from public.productos pr where pr.dueno_id = p.id and pr.publicado);

grant select on public.tiendas_publicas to anon, authenticated;

-- Fotos de producto: bucket público de lectura. Sin políticas de escritura en storage.objects:
-- solo el servidor (llave de servicio) sube, tras validar tipo y tamaño.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos-fotos', 'productos-fotos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
