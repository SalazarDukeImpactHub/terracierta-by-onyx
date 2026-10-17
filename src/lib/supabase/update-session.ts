import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clavePublicaSupabase, requerirEnv } from "@/lib/env";

/** Renueva la sesión de Supabase Auth antes de renderizar. No toca la cookie propia de Terracierta. */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(requerirEnv("NEXT_PUBLIC_SUPABASE_URL"), clavePublicaSupabase(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch {
    // Sin sesión de Supabase Auth la página sigue: el acceso de Terracierta usa su propia cookie.
  }
  return respuesta;
}
