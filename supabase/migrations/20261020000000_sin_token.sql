-- La sesión de Interledger no se guarda en la base ni se escribe a mano.
-- Si falta, la app redirige al login de la billetera.

alter table public.usuarios drop column if exists token;
