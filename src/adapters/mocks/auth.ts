import { cookies } from "next/headers";
import { clienteAdmin } from "@/lib/supabase/admin";
import { requerirEnv, USE_MOCKS } from "@/lib/env";
import { rutaSegura } from "@/lib/roles";
import {
  firmarCookie,
  normalizarCorreo,
  uuidDesdeCorreo,
  verificarCookie,
  walletDeEjemplo,
} from "@/lib/sesion-mock";
import type { CredencialesInicio, DatosRegistro, Perfil, ResultadoAuth, Rol, Sesion } from "@/adapters/types";

/**
 * MOCK de autenticación (USE_MOCKS=true). Simula sign in y sign up mientras llega el módulo real (src/auth).
 * Esto NO es autenticación segura: existe para recorrer la demostración.
 *
 *  - Sign in: correo + contraseña. Cada cuenta de ejemplo tiene la suya (se verifica).
 *    Las cuentas creadas en modo demostración NO guardan la contraseña, así que no se verifica (solo se exige que no esté vacía).
 *  - Sign up: crea el perfil (con su wallet de ejemplo y, si es caficultor, su INVIMA) e inicia sesión.
 *  - La sesión es una cookie FIRMADA (HMAC con un secreto del servidor): no se puede fabricar a mano.
 */

const COOKIE = "tc_demo_perfil";

export const PERFILES_DEMO = [
  {
    id: "40088dae-afd2-4ec3-9946-dbb8b245e474",
    etiqueta: "Caficultor con INVIMA (Alvaro, tienda Finca Henao)",
    correo: "al.henao1256@gmail.com",
    contrasena: "2026grupoonyX$",
    ruta: "/caficultor",
  },
  {
    id: "6b1c0a11-7e2a-4c11-9a11-000000000001",
    etiqueta: "Comprador (Camila Restrepo)",
    correo: "camila.restrepo@terracierta.test",
    contrasena: "Terracierta1",
    ruta: "/comprador",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    etiqueta: "Cooperativa (Cumbres Cafeteras)",
    correo: "cooperativa@terracierta.test",
    contrasena: "Terracierta1",
    ruta: "/cooperativa",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    etiqueta: "Caficultor sin INVIMA (Jairo Montoya)",
    correo: "jairo@terracierta.test",
    contrasena: "Terracierta1",
    ruta: "/caficultor",
  },
] as const;

const IDS_DEMO: readonly string[] = PERFILES_DEMO.map((p) => p.id);
const ERROR_CREDENCIALES = "Correo o contraseña incorrectos";

async function leerPerfil(id: string): Promise<Perfil | null> {
  const { data } = await clienteAdmin()
    .from("profiles")
    .select("id, rol, nombre, municipio, tiene_invima, wallet_address")
    .eq("id", id)
    .maybeSingle();
  return (data as Perfil | null) ?? null;
}

/**
 * Id de la sesión actual. Se acepta (a) la cookie firmada, o (b) el id plano de una cuenta de ejemplo
 * (compatibilidad con las pruebas de la demo). Cualquier otra cosa se ignora.
 */
async function idDeCookie(): Promise<string | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;
  if (IDS_DEMO.includes(valor)) return valor;
  return verificarCookie(valor, requerirEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

async function abrirSesion(id: string) {
  const valor = firmarCookie(id, requerirEnv("SUPABASE_SERVICE_ROLE_KEY"));
  (await cookies()).set(COOKIE, valor, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
}

// ---------- Lógica sobre la base (sin cookies: se prueba con vitest) ----------

/** Sign in simulado. Devuelve el id y el rol DETECTADOS a partir del correo, o null si no coincide. */
export async function autenticarMock(correo: string, contrasena: string): Promise<{ id: string; rol: Rol } | null> {
  const email = normalizarCorreo(correo);
  if (!contrasena) return null;

  const demo = PERFILES_DEMO.find((p) => p.correo === email);
  if (demo) {
    if (contrasena !== demo.contrasena) return null;
    const perfil = await leerPerfil(demo.id);
    return perfil ? { id: perfil.id, rol: perfil.rol } : null;
  }

  const perfil = await leerPerfil(uuidDesdeCorreo(email));
  return perfil ? { id: perfil.id, rol: perfil.rol } : null;
}

export type ResultadoRegistroMock = { ok: true; id: string; rol: Rol } | { ok: false; error: string };

/** Sign up simulado: crea el perfil con wallet de ejemplo. `tiene_invima` solo se guarda si el rol es caficultor. */
export async function registrarMock(datos: DatosRegistro): Promise<ResultadoRegistroMock> {
  if (datos.rol === "cooperativa") {
    return { ok: false, error: "Las cooperativas están precargadas: usá la cuenta de la cooperativa de ejemplo." };
  }
  const email = normalizarCorreo(datos.correo);
  if (PERFILES_DEMO.some((p) => p.correo === email)) return { ok: false, error: "Ese correo ya está registrado" };

  const id = uuidDesdeCorreo(email);
  if (await leerPerfil(id)) return { ok: false, error: "Ese correo ya está registrado" };

  const { error } = await clienteAdmin()
    .from("profiles")
    .insert({
      id,
      rol: datos.rol,
      nombre: datos.nombre.trim(),
      municipio: datos.municipio.trim(),
      tiene_invima: datos.rol === "caficultor" ? datos.tieneInvima : false,
      wallet_address: walletDeEjemplo(datos.nombre, id),
    });
  if (error) return { ok: false, error: "No pudimos crear tu cuenta. Probá de nuevo." };
  return { ok: true, id, rol: datos.rol };
}

// ---------- Contrato (AuthAdapter) ----------

export async function iniciarSesion({ correo, contrasena }: CredencialesInicio): Promise<ResultadoAuth> {
  const encontrado = await autenticarMock(correo, contrasena);
  if (!encontrado) return { ok: false, error: ERROR_CREDENCIALES };
  await abrirSesion(encontrado.id);
  return { ok: true, rol: encontrado.rol };
}

export async function registrarse(datos: DatosRegistro): Promise<ResultadoAuth> {
  const r = await registrarMock(datos);
  if (!r.ok) return r;
  await abrirSesion(r.id);
  return { ok: true, rol: r.rol };
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
 * Solo mock: "entrar rápido" como uno de los perfiles de ejemplo (sin escribir correo y contraseña).
 * Devuelve adónde ir: la ruta `siguiente` (solo si es interna; p. ej. el producto que se iba a pagar) o la home del perfil.
 */
export async function iniciarSesionDemo(id: string, siguiente?: string | null): Promise<string | null> {
  if (!USE_MOCKS) throw new Error("iniciarSesionDemo solo existe con USE_MOCKS=true");
  const demo = PERFILES_DEMO.find((p) => p.id === id);
  if (!demo) return null;
  await abrirSesion(demo.id);
  return rutaSegura(siguiente) ?? demo.ruta;
}
