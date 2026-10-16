import { clienteAnon } from "@/lib/supabase/anon";

/**
 * Lecturas PÚBLICAS de la tienda. Usan la llave anon, así que el catálogo que se ve
 * es exactamente el que RLS permite: solo productos con publicado = true y la vista tiendas_publicas.
 */

export interface TiendaPublica {
  id: string;
  nombre: string;
  municipio: string;
}

export interface ProductoPublico {
  id: string;
  dueno_id: string;
  nombre: string;
  descripcion: string;
  precio_cop: number;
  foto_url: string | null;
}

const ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (v: string) => ID_UUID.test(v);

export async function listarTiendas(): Promise<TiendaPublica[]> {
  const { data } = await clienteAnon().from("tiendas_publicas").select("id, nombre, municipio").order("nombre");
  return data ?? [];
}

export async function obtenerTienda(id: string): Promise<TiendaPublica | null> {
  if (!esUuid(id)) return null;
  const { data } = await clienteAnon().from("tiendas_publicas").select("id, nombre, municipio").eq("id", id).maybeSingle();
  return data;
}

export async function listarProductos(duenoId: string): Promise<ProductoPublico[]> {
  if (!esUuid(duenoId)) return [];
  const { data } = await clienteAnon()
    .from("productos")
    .select("id, dueno_id, nombre, descripcion, precio_cop, foto_url")
    .eq("dueno_id", duenoId)
    .eq("publicado", true)
    .order("creado_en");
  return data ?? [];
}

export async function obtenerProducto(duenoId: string, productoId: string): Promise<ProductoPublico | null> {
  if (!esUuid(duenoId) || !esUuid(productoId)) return null;
  const { data } = await clienteAnon()
    .from("productos")
    .select("id, dueno_id, nombre, descripcion, precio_cop, foto_url")
    .eq("id", productoId)
    .eq("dueno_id", duenoId)
    .eq("publicado", true)
    .maybeSingle();
  return data;
}
