"use server";

import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { iniciarSesionDemo } from "@/adapters/mocks/auth";
import { USE_MOCKS } from "@/lib/env";

/** Mock: entrar como uno de los perfiles de ejemplo. Con USE_MOCKS=false esta acción no hace nada. */
export async function entrarDemo(formData: FormData) {
  if (!USE_MOCKS) redirect("/acceso");
  const id = String(formData.get("perfil") ?? "");
  const ruta = await iniciarSesionDemo(id);
  redirect(ruta ?? "/acceso");
}

export async function salir() {
  await auth.cerrarSesion();
  redirect("/");
}
