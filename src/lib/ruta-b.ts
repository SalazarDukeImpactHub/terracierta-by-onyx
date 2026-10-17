import { clienteAdmin } from "@/lib/supabase/admin";
import { recomendar, type CooperativaEntrada, type LoteEntrada, type Recomendacion } from "@/lib/match";

/**
 * Lógica de servidor de la Ruta B (caficultor sin INVIMA). El caficultor crea un lote, el agente
 * (reglas, sin modelo) recomienda 3 cooperativas y la OFERTA se crea recién cuando el caficultor elige.
 * Toda escritura revisa el dueño y recalcula el match en el servidor: nada de esto se confía al navegador.
 */

export interface Lote extends LoteEntrada {
  id: string;
  caficultor_id: string;
  estado: "registrado" | "con_ofertas" | "vendido";
  creado_en: string;
}

export interface OfertaConCooperativa {
  id: string;
  lote_id: string;
  cooperativa_id: string;
  precio_kg: number;
  total: number;
  estado: "propuesta" | "aceptada" | "pagada" | "fallida";
  pago_id: string | null;
  creado_en: string;
  cooperativas: { nombre: string; municipio: string };
}

export async function cargarCooperativas(): Promise<CooperativaEntrada[]> {
  const { data } = await clienteAdmin()
    .from("cooperativas")
    .select("id, nombre, municipio, precio_base_kg, capacidad_kg, metodos_aceptados, variedades_aceptadas")
    .order("nombre");
  return (data ?? []) as CooperativaEntrada[];
}

export async function obtenerLoteDe(loteId: string, caficultorId: string): Promise<Lote | null> {
  const { data } = await clienteAdmin()
    .from("lotes")
    .select("id, caficultor_id, metodo, variedad, kg, municipio, estado, creado_en")
    .eq("id", loteId)
    .eq("caficultor_id", caficultorId) // solo lotes propios
    .maybeSingle();
  return (data as Lote | null) ?? null;
}

/** Ofertas del lote, la más reciente primero. */
export async function ofertasDelLote(loteId: string): Promise<OfertaConCooperativa[]> {
  const { data } = await clienteAdmin()
    .from("ofertas")
    .select("id, lote_id, cooperativa_id, precio_kg, total, estado, pago_id, creado_en, cooperativas(nombre, municipio)")
    .eq("lote_id", loteId)
    .order("creado_en", { ascending: false });
  return (data ?? []) as unknown as OfertaConCooperativa[];
}

/** La oferta que "ocupa" el lote: cualquiera que no haya fallado. Con una ocupante no se puede elegir otra cooperativa. */
export function ofertaVigente(ofertas: OfertaConCooperativa[]): OfertaConCooperativa | null {
  return ofertas.find((o) => o.estado !== "fallida") ?? null;
}

export async function recomendacionesDelLote(lote: Lote): Promise<Recomendacion[]> {
  return recomendar(lote, await cargarCooperativas());
}

export type ResultadoElegir = { ok: true; ofertaId: string } | { ok: false; error: string };

/**
 * El caficultor elige una cooperativa de las 3 recomendadas: se crea la oferta (estado "propuesta").
 * Se recalcula el top 3 en el servidor y solo se acepta una cooperativa elegible de esa lista.
 */
export async function elegirCooperativaParaLote(
  loteId: string,
  cooperativaId: string,
  caficultorId: string,
): Promise<ResultadoElegir> {
  const lote = await obtenerLoteDe(loteId, caficultorId);
  if (!lote) return { ok: false, error: "No encontramos ese lote en tu cuenta." };

  if (ofertaVigente(await ofertasDelLote(lote.id))) {
    return { ok: false, error: "Este lote ya tiene una oferta en curso." };
  }

  const elegida = (await recomendacionesDelLote(lote)).find((r) => r.cooperativaId === cooperativaId);
  if (!elegida) return { ok: false, error: "Esa cooperativa no está entre las recomendadas para tu lote." };
  if (!elegida.elegible) return { ok: false, error: "Esa cooperativa no puede comprar este lote (ver el motivo)." };

  const db = clienteAdmin();
  const { data, error } = await db
    .from("ofertas")
    .insert({ lote_id: lote.id, cooperativa_id: elegida.cooperativaId, precio_kg: elegida.precioKg, total: elegida.total })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No pudimos crear la oferta. Intenta de nuevo." };

  await db.from("lotes").update({ estado: "con_ofertas" }).eq("id", lote.id).eq("caficultor_id", caficultorId);
  return { ok: true, ofertaId: data.id };
}

export interface OfertaRecibida {
  id: string;
  precio_kg: number;
  total: number;
  estado: OfertaConCooperativa["estado"];
  pago_id: string | null;
  creado_en: string;
  cooperativas: { nombre: string; perfil_id: string };
  lotes: { metodo: string; variedad: string; kg: number; municipio: string; profiles: { nombre: string; municipio: string } };
}

/** Ofertas dirigidas a las cooperativas que pertenecen al perfil de la sesión. */
export async function ofertasRecibidas(perfilId: string): Promise<OfertaRecibida[]> {
  const { data } = await clienteAdmin()
    .from("ofertas")
    .select(
      "id, precio_kg, total, estado, pago_id, creado_en, cooperativas!inner(nombre, perfil_id), lotes!inner(metodo, variedad, kg, municipio, profiles!inner(nombre, municipio))",
    )
    .eq("cooperativas.perfil_id", perfilId)
    .order("creado_en", { ascending: false });
  return (data ?? []) as unknown as OfertaRecibida[];
}

export type ResultadoAceptar = { ok: true } | { ok: false; error: string };

/** La cooperativa acepta una oferta suya que está en "propuesta". */
export async function aceptarOfertaDeCooperativa(ofertaId: string, perfilId: string): Promise<ResultadoAceptar> {
  const db = clienteAdmin();
  const { data: oferta } = await db
    .from("ofertas")
    .select("id, estado, cooperativas!inner(perfil_id)")
    .eq("id", ofertaId)
    .eq("cooperativas.perfil_id", perfilId) // solo ofertas dirigidas a su cooperativa
    .maybeSingle();
  if (!oferta) return { ok: false, error: "No encontramos esa oferta." };
  if (oferta.estado !== "propuesta") return { ok: false, error: "Esta oferta ya no está pendiente de respuesta." };

  const { data: actualizada } = await db
    .from("ofertas")
    .update({ estado: "aceptada" })
    .eq("id", ofertaId)
    .eq("estado", "propuesta")
    .select("id")
    .maybeSingle();
  return actualizada ? { ok: true } : { ok: false, error: "La oferta cambió mientras la aceptabas." };
}
