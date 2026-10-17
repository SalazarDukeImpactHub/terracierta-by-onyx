import { createClient } from "@supabase/supabase-js";
import { requerirEnv } from "@/lib/env";

/**
 * Cliente con la llave pública (anon), sin sesión. Todo lo que lee pasa por RLS:
 * solo ve el catálogo con `publicado = true` y las vistas públicas.
 */
export function clienteAnon() {
  return createClient(requerirEnv("NEXT_PUBLIC_SUPABASE_URL"), requerirEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
