-- Terracierta by Onyx — verificación de la carga en Supabase.
-- Pegar en SQL Editor y ejecutar. Devuelve una tabla: cada fila trae lo ESPERADO entre paréntesis.
-- Solo lee; no cambia nada.
select '1. tablas en public con RLS activo (esperado 7)' as chequeo,
       count(*)::text as resultado
from pg_tables where schemaname = 'public' and rowsecurity
union all
select '2. tablas en public', string_agg(tablename, ', ' order by tablename)
from pg_tables where schemaname = 'public'
union all
select '3. políticas RLS (esperado 11)', count(*)::text
from pg_policies where schemaname = 'public'
union all
select '4. funciones auxiliares (esperado 2)', count(*)::text
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('es_dueno_del_lote', 'cooperativa_tiene_oferta_en_lote')
union all
select '5. perfiles (esperado 5: 1 caficultor sin INVIMA, 1 con INVIMA, 1 cooperativa, 2 compradores)', count(*)::text from public.profiles
union all
select '6. cooperativas (esperado 4)', count(*)::text from public.cooperativas
union all
select '7. productos / publicados (esperado 3 / 2)',
       count(*)::text || ' / ' || (count(*) filter (where publicado))::text from public.productos
union all
select '8. tiendas públicas (esperado 1)', count(*)::text from public.tiendas_publicas
union all
select '9. municipio de Jairo (esperado Marsella)',
       coalesce((select municipio from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 'NO EXISTE')
union all
select '10. bucket productos-fotos (esperado: público true, 2097152 bytes)',
       coalesce((select 'público ' || public::text || ', ' || file_size_limit::text || ' bytes'
                 from storage.buckets where id = 'productos-fotos'), 'NO EXISTE')
union all
select '11. anon puede escribir en productos (esperado false)',
       has_table_privilege('anon', 'public.productos', 'INSERT')::text
union all
select '12. anon lee la vista tiendas_publicas (esperado true)',
       has_table_privilege('anon', 'public.tiendas_publicas', 'SELECT')::text
union all
select '13. pedidos tiene comprador_id (esperado true)',
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'pedidos' and column_name = 'comprador_id')::text
union all
select '14. profiles.rol admite comprador (esperado true)',
       coalesce((select pg_get_constraintdef(oid) like '%comprador%' from pg_constraint
                 where conrelid = 'public.profiles'::regclass and conname = 'profiles_rol_check'), false)::text
union all
select '15. compradores de ejemplo con wallet (esperado 2)',
       count(*)::text from public.profiles where rol = 'comprador' and wallet_address is not null
order by 1;
