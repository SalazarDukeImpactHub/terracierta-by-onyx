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
 * CAMBIO DE CONTRATO (2026-10-16): `rol` ahora es 'caficultor' | 'cooperativa' | 'comprador'. El comprador
 * también inicia sesión y recibe wallet al registrarse: PAGA con la wallet de su perfil (el checkout ya no la pide).
 * La página manda a `/acceso?siguiente=<ruta interna>` para pedir la cuenta y volver al producto que se iba a
 * pagar: el login real debe respetar `siguiente` (src/lib/roles.ts → rutaSegura valida que sea una ruta interna).
 * La tabla `profiles` también debe admitir rol 'comprador' (migración 20261017000000_comprador.sql).
 *
 * `tiene_invima` (solo caficultores): lo debe PEDIR y GUARDAR el login al crear la cuenta. La página ya no lo
 * pregunta ni lo modifica (se quitó la acción `declararInvima`): lee `perfil.tiene_invima` y muestra el camino
 * que corresponde (con INVIMA -> su tienda; sin INVIMA -> vender el lote a una cooperativa).
 *
 * Para integrar: reemplazar el cuerpo de estas funciones y poner USE_MOCKS=false.
 */
import type { Perfil, Sesion } from "@/adapters/types";

export async function obtenerSesion(): Promise<Sesion | null> {
  throw new Error("src/auth no está implementado todavía: activa USE_MOCKS=true o integra el módulo real.");
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  throw new Error("src/auth no está implementado todavía: activa USE_MOCKS=true o integra el módulo real.");
}

export async function cerrarSesion(): Promise<void> {
  throw new Error("src/auth no está implementado todavía: activa USE_MOCKS=true o integra el módulo real.");
}
