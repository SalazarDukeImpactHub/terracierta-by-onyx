import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clavePublicaSupabase, requerirEnv } from "@/lib/env";

/** Cliente de servidor que lee y escribe las cookies de Supabase Auth en esta petición. */
export async function clienteServidor() {
  const cookieStore = await cookies();
  return createServerClient(requerirEnv("NEXT_PUBLIC_SUPABASE_URL"), clavePublicaSupabase(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // En un Server Component las cookies son de solo lectura. El proxy se encarga de refrescarlas.
        }
      },
    },
  });
}
