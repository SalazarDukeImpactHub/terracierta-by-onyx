import { cookies } from "next/headers";
import { clienteAdmin } from "@/lib/supabase/admin";
import { USE_MOCKS } from "@/lib/env";
import { rutaSegura } from "@/lib/roles";
import type { Perfil, Sesion } from "@/adapters/types";

/**
 * MOCK de login (USE_MOCKS=true). Elegir un perfil de ejemplo guarda su id en una cookie.
 * Esto NO es autenticación: solo existe para recorrer la demo mientras llega el login real.
 * Solo acepta los ids de ejemplo del seed.
 */

const COOKIE = "tc_demo_perfil";

export const PERFILES_DEMO = [
  { id: "11111111-1111-4111-8111-111111111111", etiqueta: "Caficultora con INVIMA", ruta: "/caficultor" },
  { id: "22222222-2222-4222-8222-222222222222", etiqueta: "Caficultor sin INVIMA", ruta: "/caficultor" },
  { id: "33333333-3333-4333-8333-333333333333", etiqueta: "Cooperativa (cuenta demo)", ruta: "/cooperativa" },
  { id: "44444444-4444-4444-8444-444444444444", etiqueta: "Comprador (cuenta demo)", ruta: "/comprador" },
  { id: "55555555-5555-4555-8555-555555555555", etiqueta: "Comprador cuyo pago falla (demo)", ruta: "/comprador" },
] as const;

const IDS_DEMO: readonly string[] = PERFILES_DEMO.map((p) => p.id);

async function leerPerfil(id: string): Promise<Perfil | null> {
  const { data } = await clienteAdmin()
    .from("profiles")
    .select("id, rol, nombre, municipio, tiene_invima, wallet_address")
    .eq("id", id)
    .maybeSingle();
  return (data as Perfil | null) ?? null;
}

async function idDeCookie(): Promise<string | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  return id && IDS_DEMO.includes(id) ? id : null;
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const id = await idDeCookie();
  if (!id) return null;
  const perfil = await leerPerfil(id);
  return perfil ? { userId: perfil.id, rol: perfil.rol } : null;
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  const id = await idDeCookie();
  return id ? leerPerfil(id) : null;
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/**
 * Solo mock: "entrar" como uno de los perfiles de ejemplo. Devuelve adónde ir: la ruta `siguiente`
 * (solo si es interna; p. ej. el producto que se iba a pagar) o la home del perfil.
 */
export async function iniciarSesionDemo(id: string, siguiente?: string | null): Promise<string | null> {
  if (!USE_MOCKS) throw new Error("iniciarSesionDemo solo existe con USE_MOCKS=true");
  const demo = PERFILES_DEMO.find((p) => p.id === id);
  if (!demo) return null;
  (await cookies()).set(COOKIE, demo.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return rutaSegura(siguiente) ?? demo.ruta;
}
