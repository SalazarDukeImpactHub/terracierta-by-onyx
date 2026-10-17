import { z } from "zod";

/**
 * Wallet address de Open Payments: URL https (https://host/ruta) o payment pointer ($host/ruta).
 * Se normaliza el payment pointer a https. Validar aquí evita guardar basura o URLs peligrosas
 * (javascript:, data:, etc.).
 */
export const walletAddress = z
  .string()
  .trim()
  .min(1, "Pegá la dirección de tu billetera")
  .max(300, "La dirección es demasiado larga")
  .transform((v) => (v.startsWith("$") ? `https://${v.slice(1)}` : v))
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && u.hostname.includes(".") && u.pathname.length > 1;
    } catch {
      return false;
    }
  }, "Debe ser una dirección tipo https://billetera.com/tu-nombre o $billetera.com/tu-nombre");

const textoLimpio = (min: number, max: number, etiqueta: string) =>
  z
    .string()
    .trim()
    .min(min, `${etiqueta} es obligatorio`)
    .max(max, `${etiqueta} admite hasta ${max} caracteres`);

export const esquemaProducto = z.object({
  nombre: textoLimpio(3, 80, "El nombre"),
  descripcion: z.string().trim().max(600, "La descripción admite hasta 600 caracteres").default(""),
  precio_cop: z.coerce
    .number({ error: "Ingresa un precio en pesos" })
    .int("El precio va en pesos enteros")
    .min(1000, "El precio mínimo es $1.000")
    .max(100_000_000, "El precio es demasiado alto"),
});

// La wallet del comprador NO viene en el cuerpo: sale de su perfil (sesión). El navegador solo elige producto y cantidad.
export const esquemaCheckout = z.object({
  productoId: z.string().uuid("Producto inválido"),
  cantidad: z.coerce.number().int().min(1, "Mínimo 1 unidad").max(20, "Máximo 20 unidades por pedido"),
});

export const esquemaLote = z.object({
  metodo: z.enum(["lavado", "honey", "natural"], { error: "Elige el método" }),
  variedad: textoLimpio(2, 60, "La variedad"),
  kg: z.coerce.number().int().min(1, "Mínimo 1 kg").max(100_000, "Cantidad demasiado alta"),
  municipio: textoLimpio(2, 60, "El municipio"),
});

export const TIPOS_FOTO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const MAX_FOTO_BYTES = 2 * 1024 * 1024;

/** Solo se pinta una URL de foto si es http(s). Frena javascript:, data: y similares (XSS). */
export function urlSegura(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const u = new URL(valor);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}

export const formatoCop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
