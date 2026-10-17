import { z } from "zod";

/**
 * Wallet address de Interledger: URL https (https://host/ruta) o payment pointer ($host/ruta).
 * Se normaliza el payment pointer a https. Validar acá evita guardar basura o URLs peligrosas
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
    .number({ error: "Poné un precio en pesos" })
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
  metodo: z.enum(["lavado", "honey", "natural"], { error: "Elegí el método" }),
  variedad: textoLimpio(2, 60, "La variedad"),
  kg: z.coerce.number().int().min(1, "Mínimo 1 kg").max(100_000, "Cantidad demasiado alta"),
  municipio: textoLimpio(2, 60, "El municipio"),
});

const correo = z.string().trim().toLowerCase().email("Escribí un correo válido").max(120, "El correo es demasiado largo");

function fechaNacimientoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha <= hoy && anio >= 1900;
}

export const TIPOS_DOCUMENTO = [
  { id: "CC", nombre: "Cédula de ciudadanía" },
  { id: "CE", nombre: "Cédula de extranjería" },
  { id: "TI", nombre: "Tarjeta de identidad" },
  { id: "PA", nombre: "Pasaporte" },
  { id: "PPT", nombre: "Permiso por protección temporal" },
  { id: "NIT", nombre: "NIT" },
] as const;

/** Sign in: solo correo y contraseña. El mensaje de error es el mismo para cualquier fallo (no revela si el correo existe). */
export const esquemaInicioSesion = z.object({
  correo,
  contrasena: z.string().min(1, "Escribí tu contraseña").max(200, "La contraseña es demasiado larga"),
});

/**
 * Sign up: la pantalla /registro pide identidad, documento y municipio.
 * Solo caficultor y comprador se registran solos (las cooperativas están precargadas).
 * `tieneInvima` solo cuenta para caficultores y es obligatorio para ellos.
 */
export const esquemaRegistro = z
  .object({
    rol: z.enum(["caficultor", "comprador"], { error: "Elegí si sos caficultor o comprador" }),
    nombres: textoLimpio(2, 60, "Los nombres"),
    apellidos: textoLimpio(2, 60, "Los apellidos"),
    tipo_documento: z.enum(["CC", "CE", "TI", "PA", "PPT", "NIT"], { error: "Elegí el tipo de documento" }),
    numero_documento: z
      .string()
      .trim()
      .min(5, "El número de documento es demasiado corto")
      .max(20, "El número de documento es demasiado largo")
      .regex(/^[0-9A-Za-z-]+$/, "El número de documento solo admite letras, números y un guion"),
    fecha_nacimiento: z.string().refine(fechaNacimientoValida, "La fecha de nacimiento no es válida"),
    municipio: textoLimpio(2, 60, "Tu municipio"),
    correo,
    contrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200, "La contraseña es demasiado larga"),
    tieneInvima: z.enum(["si", "no"]).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.rol === "caficultor" && !d.tieneInvima) {
      ctx.addIssue({ code: "custom", path: ["tieneInvima"], message: "Contanos si tenés INVIMA" });
    }
  })
  .transform((d) => ({
    ...d,
    nombre: `${d.nombres} ${d.apellidos}`,
    tieneInvima: d.rol === "caficultor" && d.tieneInvima === "si",
  }));

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
