/** Medidas y límites para achicar imágenes en el navegador antes de subirlas. Los valida de nuevo el servidor. */
export const MAX_BYTES_IMAGEN = 2 * 1024 * 1024;
export const MAX_LADO_IMAGEN = 1600;
export const TIPOS_IMAGEN_ADMITIDOS = ["image/jpeg", "image/png", "image/webp"];

/** Escala el ancho y el alto para que el lado mayor no pase de `max`, sin agrandar y sin deformar. */
export function medidasAjustadas(ancho: number, alto: number, max: number): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= max) return { ancho, alto };
  const factor = max / mayor;
  return { ancho: Math.max(1, Math.round(ancho * factor)), alto: Math.max(1, Math.round(alto * factor)) };
}

/** Nombre del archivo con la extensión que corresponde al tipo nuevo. */
export function nombreConTipo(nombre: string, tipo: string): string {
  const base = nombre.replace(/\.[^./\\]+$/, "") || "imagen";
  const extension = tipo === "image/jpeg" ? "jpg" : tipo === "image/png" ? "png" : "webp";
  return `${base}.${extension}`;
}
