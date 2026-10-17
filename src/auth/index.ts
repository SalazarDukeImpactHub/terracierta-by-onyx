/**
 * STUB — esta carpeta es de Álvaro Henao González (autenticación: sign in y sign up con Supabase Auth,
 * y asignación de wallets). El Dev System solo dejó este punto de enchufe; NO implementa el login real.
 *
 * Contrato que espera la página (ver src/adapters/types.ts). Dos momentos distintos:
 *
 *  SIGN UP (registro) — es quien SOLICITA los datos de la persona (la pantalla /registro los captura y los valida):
 *    registrarse({ correo, contrasena, rol, nombre, municipio, tieneInvima }) -> { ok: true, rol } | { ok: false, error }
 *    Debe: crear la cuenta en Supabase Auth, ASIGNAR LA WALLET, guardar el perfil en `profiles` e INICIAR SESIÓN.
 *    `tieneInvima` solo se pregunta y solo se guarda si rol === 'caficultor' (para los demás es false).
 *    Las cooperativas están precargadas: no se registran solas.
 *
 *  SIGN IN (ingreso) — solo correo y contraseña; detecta TODO automáticamente (rol, perfil, wallet, INVIMA):
 *    iniciarSesion({ correo, contrasena }) -> { ok: true, rol } | { ok: false, error }
 *    El error debe ser genérico ("Correo o contraseña incorrectos"): no revela si el correo existe.
 *
 *  Después, la página lee la sesión con:
 *    obtenerSesion() -> { userId, rol } | null
 *    obtenerPerfil() -> { id, rol, nombre, municipio, tiene_invima, wallet_address } | null
 *    cerrarSesion()
 *
 * La protección de rutas por rol la arma la página encima de obtenerSesion (src/adapters/auth.ts).
 * La página NUNCA le pregunta al usuario su INVIMA después del registro: lo lee del perfil.
 *
 * `rol` es 'caficultor' | 'cooperativa' | 'comprador'. El comprador también tiene cuenta y wallet: PAGA con la wallet de
 * su perfil. La tabla `profiles` debe admitir rol 'comprador' (migración 20261017000000_comprador.sql).
 *
 * `?siguiente=<ruta interna>`: la página manda a /acceso para pedir la cuenta y volver al producto que se iba a pagar.
 * (La pantalla /acceso ya lo maneja; src/lib/roles.ts → rutaSegura valida que sea una ruta interna.)
 *
 * Para integrar: reemplazar el cuerpo de estas funciones y poner USE_MOCKS=false.
 * Las pantallas /acceso y /registro ya existen en src/app y llaman a estas funciones.
 */
import type { CredencialesInicio, DatosRegistro, Perfil, ResultadoAuth, Sesion } from "@/adapters/types";

const NO_IMPLEMENTADO = "src/auth no está implementado todavía: activá USE_MOCKS=true o integrá el módulo real.";

/* eslint-disable @typescript-eslint/no-unused-vars -- stub: los parámetros documentan el contrato */
export async function iniciarSesion(_credenciales: CredencialesInicio): Promise<ResultadoAuth> {
  throw new Error(NO_IMPLEMENTADO);
}

export async function registrarse(_datos: DatosRegistro): Promise<ResultadoAuth> {
  throw new Error(NO_IMPLEMENTADO);
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export async function obtenerSesion(): Promise<Sesion | null> {
  throw new Error(NO_IMPLEMENTADO);
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  throw new Error(NO_IMPLEMENTADO);
}

export async function cerrarSesion(): Promise<void> {
  throw new Error(NO_IMPLEMENTADO);
}
