import { createBrowserClient } from "@supabase/ssr";
import { clavePublicaSupabase, requerirEnv } from "@/lib/env";

/** Cliente del navegador. La sesión de Supabase Auth, si existe, vive en cookies. */
export function clienteNavegador() {
  return createBrowserClient(requerirEnv("NEXT_PUBLIC_SUPABASE_URL"), clavePublicaSupabase());
}
