-- El comprador persona también tiene cuenta (y wallet): para pagar necesita iniciar sesión, y la wallet
-- con la que paga sale de su perfil, no de lo que escriba en un formulario.
-- Cambia el contrato con el login: profiles.rol admite 'comprador' (ver src/adapters/types.ts).

-- Rol nuevo en la tabla de perfiles (tabla provisional del compañero de login).
alter table public.profiles drop constraint profiles_rol_check;
alter table public.profiles
  add constraint profiles_rol_check check (rol in ('caficultor', 'cooperativa', 'comprador'));

-- Cada pedido queda ligado a la cuenta que lo hizo. Anulable: los pedidos anteriores a este cambio no la tienen.
alter table public.pedidos add column comprador_id uuid references public.profiles (id) on delete set null;
create index pedidos_comprador_idx on public.pedidos (comprador_id);

-- Cada comprador ve solo SUS compras. El dueño del producto sigue viendo los pedidos de su tienda (política existente).
-- Los pedidos se siguen escribiendo solo desde el servidor.
create policy pedidos_comprador_lee on public.pedidos
  for select to authenticated using (comprador_id = (select auth.uid()));
