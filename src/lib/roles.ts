import type { Rol } from "@/adapters/types";

/** Cómo se muestra el rol junto al nombre. */
export function etiquetaRol(rol: Rol): string {
  if (rol === "comprador") return "Comprador";
  if (rol === "cooperativa") return "Cooperativa";
  return "Caficultor";
}

/** Pantalla de inicio de cada rol. */
export function rutaDeRol(rol: Rol): string {
  if (rol === "cooperativa") return "/cooperativa";
  if (rol === "comprador") return "/comprador";
  return "/caficultor";
}

/**
 * Valida a dónde volver tras iniciar sesión (parámetro `siguiente`). Solo se aceptan rutas INTERNAS:
 * empiezan con una sola "/" y no llevan esquema, "//" ni caracteres de control. Evita el "open redirect"
 * (un enlace armado para mandar a la gente a otro sitio tras entrar).
 */
export function rutaSegura(valor: string | null | undefined): string | null {
  if (!valor || valor.length > 300) return null;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return null;
  // Se rechazan a propósito los caracteres de control y las barras invertidas
  if (/[\u0000-\u001f\u007f\\]/.test(valor)) return null;
  try {
    const u = new URL(valor, "http://interno.local");
    if (u.origin !== "http://interno.local") return null;
  } catch {
    return null;
  }
  return valor;
}
