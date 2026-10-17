"use server";

import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { PERFILES_DEMO } from "@/adapters/mocks/auth";
import type { ResultadoAuth } from "@/adapters/types";
import { USE_MOCKS } from "@/lib/env";
import { abrirSesionDe } from "@/lib/sesion";
import { rutaDeRol, rutaSegura } from "@/lib/roles";
import { esquemaInicioSesion, esquemaRegistro, primerError } from "@/lib/validacion";

export interface EstadoFormulario {
  error?: string;
  /** Lo escrito (sin la contraseña), para no obligar a volver a tipear todo tras un error. */
  valores?: Record<string, string>;
}

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "");

/** Llama al módulo de autenticación sin dejar que una caída rompa la página. */
async function conAuth(accion: () => Promise<ResultadoAuth>): Promise<ResultadoAuth> {
  try {
    return await accion();
  } catch (e) {
    console.error("[auth] el módulo de autenticación falló:", e instanceof Error ? e.message : e);
    return { ok: false, error: "No pudimos conectar con el acceso. Probá de nuevo en un momento." };
  }
}

/** SIGN IN: correo y contraseña. Detecta rol, perfil, wallet e INVIMA solo. */
export async function iniciarSesionAccion(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const valores = { correo: texto(formData, "correo") };
  const parsed = esquemaInicioSesion.safeParse({ correo: valores.correo, contrasena: texto(formData, "contrasena") });
  if (!parsed.success) return { error: primerError(parsed.error), valores };

  const r = await conAuth(() => auth.iniciarSesion(parsed.data));
  if (!r.ok) return { error: r.error, valores };
  redirect(rutaSegura(texto(formData, "siguiente")) ?? rutaDeRol(r.rol));
}

/** SIGN UP: documento, identidad, municipio y, si es caficultor, INVIMA. Crea la cuenta e inicia sesión. */
export async function registrarseAccion(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const valores = {
    rol: texto(formData, "rol"),
    nombres: texto(formData, "nombres"),
    apellidos: texto(formData, "apellidos"),
    tipo_documento: texto(formData, "tipo_documento"),
    numero_documento: texto(formData, "numero_documento"),
    fecha_nacimiento: texto(formData, "fecha_nacimiento"),
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

/** Acceso rápido de las cuentas de demostración: abre la misma sesión real que el formulario. */
export async function entrarDemo(formData: FormData) {
  if (!USE_MOCKS) redirect("/acceso");
  const id = String(formData.get("perfil") ?? "");
  const demo = PERFILES_DEMO.find((p) => p.id === id);
  if (!demo || !(await abrirSesionDe(demo.id))) redirect("/acceso");
  redirect(rutaSegura(String(formData.get("siguiente") ?? "")) ?? demo.ruta);
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
