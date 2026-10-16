/**
 * STUB — esta carpeta es del compañero de login (Supabase Auth + asignación de wallets).
 * El Dev System solo dejó este punto de enchufe; NO implementa el login real.
 *
 * Contrato que espera la página (brief §7.2, ver src/adapters/types.ts):
 *   obtenerSesion() -> { userId, rol } | null
 *   obtenerPerfil() -> { id, rol, nombre, municipio, tiene_invima, wallet_address } | null
 *   cerrarSesion()
 * La protección de rutas por rol la arma la página encima de obtenerSesion (src/adapters/auth.ts).
 * La asignación de wallet ocurre en el registro; la página solo MUESTRA la wallet del perfil.
 *
 * Para integrar: reemplazar el cuerpo de estas funciones y poner USE_MOCKS=false.
 */
import type { Perfil, Sesion } from "@/adapters/types";

export async function obtenerSesion(): Promise<Sesion | null> {
  throw new Error("src/auth no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.");
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  throw new Error("src/auth no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.");
}

export async function cerrarSesion(): Promise<void> {
  throw new Error("src/auth no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.");
}
