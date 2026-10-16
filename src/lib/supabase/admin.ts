import { createClient } from "@supabase/supabase-js";
import { requerirEnv } from "@/lib/env";

/**
 * Cliente con la llave de servicio: se salta RLS. SOLO servidor (rutas, server actions,
 * adaptadores). Cada uso debe verificar antes quién es el dueño del dato: RLS no protege aquí.
 * La llave no tiene prefijo NEXT_PUBLIC_, así que el navegador nunca la recibe.
 */
export function clienteAdmin() {
  return createClient(requerirEnv("NEXT_PUBLIC_SUPABASE_URL"), requerirEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
