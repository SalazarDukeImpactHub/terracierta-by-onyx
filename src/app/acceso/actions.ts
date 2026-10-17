"use server";

import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { iniciarSesionDemo } from "@/adapters/mocks/auth";
import type { ResultadoAuth } from "@/adapters/types";
import { USE_MOCKS } from "@/lib/env";
import { rutaDeRol, rutaSegura } from "@/lib/roles";
import { esquemaInicioSesion, esquemaRegistro, primerError } from "@/lib/validacion";

export interface EstadoFormulario {
  error?: string;
  /** Lo escrito (sin la contraseña), para no obligar a volver a tipear todo tras un error. */
  valores?: Record<string, string>;
}

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "");

/** Llama al módulo de autenticación sin dejar que una caída (p. ej. el módulo real aún sin integrar) rompa la página. */
async function conAuth(accion: () => Promise<ResultadoAuth>): Promise<ResultadoAuth> {
  try {
    return await accion();
  } catch (e) {
    console.error("[auth] el módulo de autenticación falló:", e instanceof Error ? e.message : e);
    return { ok: false, error: "No pudimos conectar con el acceso. Probá de nuevo en un momento." };
  }
}

/** SIGN IN: correo y contraseña. Detecta rol, perfil, wallet e INVIMA solo; la página no pregunta nada más. */
export async function iniciarSesionAccion(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const valores = { correo: texto(formData, "correo") };
  const parsed = esquemaInicioSesion.safeParse({ correo: valores.correo, contrasena: texto(formData, "contrasena") });
  if (!parsed.success) return { error: primerError(parsed.error), valores };

  const r = await conAuth(() => auth.iniciarSesion(parsed.data));
  if (!r.ok) return { error: r.error, valores };
  redirect(rutaSegura(texto(formData, "siguiente")) ?? rutaDeRol(r.rol));
}

/** SIGN UP: solicita los datos de la persona (incluido el INVIMA si es caficultor), crea la cuenta e inicia sesión. */
export async function registrarseAccion(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const valores = {
    rol: texto(formData, "rol"),
    nombre: texto(formData, "nombre"),
    municipio: texto(formData, "municipio"),
    correo: texto(formData, "correo"),
    tieneInvima: texto(formData, "tieneInvima"),
  };
  const parsed = esquemaRegistro.safeParse({
    ...valores,
    contrasena: texto(formData, "contrasena"),
    tieneInvima: valores.tieneInvima || undefined,
  });
  if (!parsed.success) return { error: primerError(parsed.error), valores };

  const r = await conAuth(() => auth.registrarse(parsed.data));
  if (!r.ok) return { error: r.error, valores };
  redirect(rutaSegura(texto(formData, "siguiente")) ?? rutaDeRol(r.rol));
}

/** Mock: "entrar rápido" como uno de los perfiles de ejemplo. Con USE_MOCKS=false esta acción no hace nada. */
export async function entrarDemo(formData: FormData) {
  if (!USE_MOCKS) redirect("/acceso");
  const id = String(formData.get("perfil") ?? "");
  const siguiente = String(formData.get("siguiente") ?? "");
  const ruta = await iniciarSesionDemo(id, siguiente);
  redirect(ruta ?? "/acceso");
}

export async function salir() {
  await auth.cerrarSesion();
  redirect("/");
}

/** Cierra la sesión y vuelve a pedir acceso, conservando a dónde volver (p. ej. el producto que se iba a pagar). */
export async function cambiarDeCuenta(formData: FormData) {
  await auth.cerrarSesion();
  const siguiente = rutaSegura(String(formData.get("siguiente") ?? ""));
  redirect(siguiente ? `/acceso?siguiente=${encodeURIComponent(siguiente)}` : "/acceso");
}
