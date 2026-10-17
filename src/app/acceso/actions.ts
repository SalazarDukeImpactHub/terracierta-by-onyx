"use server";

import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { iniciarSesionDemo } from "@/adapters/mocks/auth";
import { USE_MOCKS } from "@/lib/env";
import { rutaSegura } from "@/lib/roles";

/** Mock: entrar como uno de los perfiles de ejemplo. Con USE_MOCKS=false esta acción no hace nada. */
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
