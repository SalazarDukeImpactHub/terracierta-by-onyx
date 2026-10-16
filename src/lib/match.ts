import { formatoCop } from "@/lib/validacion";

/**
 * Agente de match (Ruta B, brief §8). 100 % determinista: mismo lote + mismas cooperativas = mismo
 * resultado, sin modelo de lenguaje. Puntúa cada cooperativa de 0 a 100 y devuelve las 3 mejores con
 * el motivo. Los pesos y las reglas están a la vista para poder evolucionarlos (p. ej. que un modelo
 * redacte el "por qué") sin cambiar el puntaje.
 */

export interface LoteEntrada {
  metodo: string;
  variedad: string;
  kg: number;
  municipio: string;
}

export interface CooperativaEntrada {
  id: string;
  nombre: string;
  municipio: string;
  precio_base_kg: number;
  capacidad_kg: number;
  metodos_aceptados: string[];
  variedades_aceptadas: string[];
}

export interface Recomendacion {
  cooperativaId: string;
  nombre: string;
  municipio: string;
  /** 0 a 100 */
  puntaje: number;
  /** Puede comprar este lote: acepta método y variedad y tiene capacidad. Solo las elegibles se pueden elegir. */
  elegible: boolean;
  precioKg: number;
  total: number;
  distanciaKm: number | null;
  desglose: { precio: number; cercania: number; metodo: number; variedad: number; capacidad: number };
  motivo: string;
}

/** Puntos máximos por criterio (suman 100). */
export const PESOS = { precio: 35, cercania: 25, metodo: 15, variedad: 10, capacidad: 15 } as const;

/** A esta distancia (o más) la cercanía vale 0. */
const KM_SIN_PUNTOS = 150;

/**
 * Ubicación APROXIMADA (lat, lng) de los municipios que usa la demo. Es una tabla chica a propósito:
 * el brief pide cercanía por municipio. Si un municipio no está, la cercanía queda neutra (50 %).
 */
const MUNICIPIOS: Record<string, [number, number]> = {
  marsella: [4.9358, -75.7425],
  pereira: [4.8133, -75.6961],
  dosquebradas: [4.8333, -75.6667],
  "santa rosa de cabal": [4.8686, -75.6228],
  chinchina: [4.9833, -75.6039],
  andes: [5.6563, -75.8786],
  jardin: [5.5985, -75.819],
  urrao: [6.3167, -76.1333],
  fredonia: [5.9269, -75.6759],
  venecia: [5.9667, -75.7333],
  tamesis: [5.6643, -75.7144],
  jerico: [5.7894, -75.786],
  salgar: [5.965, -75.9867],
  medellin: [6.2442, -75.5812],
};

export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

function distanciaKm(a: string, b: string): number | null {
  const pa = MUNICIPIOS[normalizar(a)];
  const pb = MUNICIPIOS[normalizar(b)];
  if (!pa || !pb) return null;
  if (normalizar(a) === normalizar(b)) return 0;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(pb[0] - pa[0]);
  const dLng = rad(pb[1] - pa[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(pa[0])) * Math.cos(rad(pb[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const redondear1 = (n: number) => Math.round(n * 10) / 10;

/** Puntúa TODAS las cooperativas, de mayor a menor puntaje (desempate: precio, luego nombre). */
export function puntuarTodas(lote: LoteEntrada, cooperativas: CooperativaEntrada[]): Recomendacion[] {
  if (cooperativas.length === 0) return [];
  const precios = cooperativas.map((c) => c.precio_base_kg);
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  const metodo = normalizar(lote.metodo);
  const variedad = normalizar(lote.variedad);

  const todas = cooperativas.map((c): Recomendacion => {
    // Precio: la cooperativa le PAGA al caficultor, así que más es mejor.
    const fPrecio = max === min ? 1 : (c.precio_base_kg - min) / (max - min);

    const km = distanciaKm(lote.municipio, c.municipio);
    const fCercania = km === null ? 0.5 : Math.max(0, 1 - km / KM_SIN_PUNTOS);

    const aceptaMetodo = c.metodos_aceptados.length === 0 || c.metodos_aceptados.some((m) => normalizar(m) === metodo);
    const aceptaVariedad =
      c.variedades_aceptadas.length === 0 || c.variedades_aceptadas.some((v) => normalizar(v) === variedad);

    const fCapacidad = lote.kg <= c.capacidad_kg ? 1 : c.capacidad_kg / lote.kg;

    const desglose = {
      precio: redondear1(fPrecio * PESOS.precio),
      cercania: redondear1(fCercania * PESOS.cercania),
      metodo: aceptaMetodo ? PESOS.metodo : 0,
      variedad: aceptaVariedad ? PESOS.variedad : 0,
      capacidad: redondear1(fCapacidad * PESOS.capacidad),
    };
    const puntaje = Math.round(Object.values(desglose).reduce((s, n) => s + n, 0));
    const elegible = aceptaMetodo && aceptaVariedad && lote.kg <= c.capacidad_kg;

    return {
      cooperativaId: c.id,
      nombre: c.nombre,
      municipio: c.municipio,
      puntaje,
      elegible,
      precioKg: c.precio_base_kg,
      total: c.precio_base_kg * lote.kg,
      distanciaKm: km === null ? null : Math.round(km),
      desglose,
      motivo: redactarMotivo(lote, c, { km, aceptaMetodo, aceptaVariedad, mejorPrecio: c.precio_base_kg === max && max !== min }),
    };
  });

  return todas.sort((a, b) => b.puntaje - a.puntaje || b.precioKg - a.precioKg || a.nombre.localeCompare(b.nombre, "es"));
}

/**
 * Las 3 mejores. Primero las que PUEDEN comprar el lote; si hay menos de 3, se completan con las
 * demás (marcadas como no elegibles, con el motivo de por qué no calzan).
 */
export function recomendar(lote: LoteEntrada, cooperativas: CooperativaEntrada[]): Recomendacion[] {
  const todas = puntuarTodas(lote, cooperativas);
  return [...todas.filter((r) => r.elegible), ...todas.filter((r) => !r.elegible)].slice(0, 3);
}

function redactarMotivo(
  lote: LoteEntrada,
  c: CooperativaEntrada,
  { km, aceptaMetodo, aceptaVariedad, mejorPrecio }: { km: number | null; aceptaMetodo: boolean; aceptaVariedad: boolean; mejorPrecio: boolean },
): string {
  const partes: string[] = [];

  if (km === null) partes.push(`no tenemos la ubicación exacta de ${c.municipio}`);
  else if (km === 0) partes.push("está en tu mismo municipio");
  else partes.push(`queda a unos ${Math.round(km)} km de ${lote.municipio}`);

  partes.push(`paga ${formatoCop(c.precio_base_kg)} por kg${mejorPrecio ? ", el mejor precio entre las cooperativas" : ""}`);

  if (aceptaMetodo && aceptaVariedad) partes.push(`acepta café ${lote.metodo} ${lote.variedad}`);
  else {
    if (!aceptaMetodo) partes.push(`no recibe café ${lote.metodo}`);
    if (!aceptaVariedad) partes.push(`no recibe la variedad ${lote.variedad}`);
  }

  partes.push(
    lote.kg <= c.capacidad_kg
      ? `tiene capacidad para tus ${lote.kg} kg`
      : `solo tiene capacidad para ${c.capacidad_kg} kg y tu lote es de ${lote.kg} kg`,
  );

  const texto = partes.join(", ");
  return texto.charAt(0).toUpperCase() + texto.slice(1) + ".";
}
