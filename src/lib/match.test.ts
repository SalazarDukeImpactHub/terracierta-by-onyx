import { describe, expect, it } from "vitest";
import { PESOS, puntuarTodas, recomendar, type CooperativaEntrada, type LoteEntrada } from "./match";

// Mismas cooperativas del seed
const COOPS: CooperativaEntrada[] = [
  { id: "c1", nombre: "Cumbres Cafeteras", municipio: "Marsella", precio_base_kg: 21500, capacidad_kg: 5000, metodos_aceptados: ["lavado", "honey"], variedades_aceptadas: ["Caturra", "Castillo", "Colombia"] },
  { id: "c2", nombre: "Raíz Alta", municipio: "Andes", precio_base_kg: 19800, capacidad_kg: 12000, metodos_aceptados: ["lavado", "natural"], variedades_aceptadas: ["Caturra", "Castillo", "Typica"] },
  { id: "c3", nombre: "Aroma del Suroeste", municipio: "Jardín", precio_base_kg: 23000, capacidad_kg: 3000, metodos_aceptados: ["lavado", "honey", "natural"], variedades_aceptadas: ["Caturra", "Castillo", "Colombia", "Geisha"] },
  { id: "c4", nombre: "Tierra Nueva", municipio: "Urrao", precio_base_kg: 18900, capacidad_kg: 20000, metodos_aceptados: ["lavado"], variedades_aceptadas: ["Castillo", "Colombia"] },
];

const LOTE: LoteEntrada = { metodo: "lavado", variedad: "Caturra", kg: 500, municipio: "Marsella" };

describe("pesos", () => {
  it("suman 100", () => {
    expect(Object.values(PESOS).reduce((s, n) => s + n, 0)).toBe(100);
  });
});

describe("recomendar", () => {
  it("devuelve 3 recomendaciones ordenadas por puntaje", () => {
    const r = recomendar(LOTE, COOPS);
    expect(r).toHaveLength(3);
    expect(r[0].puntaje).toBeGreaterThanOrEqual(r[1].puntaje);
    expect(r[1].puntaje).toBeGreaterThanOrEqual(r[2].puntaje);
  });

  it("es determinista: mismo lote y cooperativas, mismo resultado (sin importar el orden de entrada)", () => {
    const a = recomendar(LOTE, COOPS);
    const b = recomendar(LOTE, [...COOPS].reverse());
    expect(b).toEqual(a);
  });

  it("para un lote de Marsella premia la cercanía y el precio: Aroma del Suroeste y Cumbres encabezan", () => {
    const r = recomendar(LOTE, COOPS);
    expect(r.map((x) => x.cooperativaId).slice(0, 2).sort()).toEqual(["c1", "c3"]);
  });

  it("una cooperativa que no acepta la variedad no es elegible y queda detrás de las elegibles", () => {
    // Tierra Nueva solo recibe Castillo y Colombia: no acepta Caturra
    const todas = puntuarTodas(LOTE, COOPS);
    const tierraNueva = todas.find((x) => x.cooperativaId === "c4")!;
    expect(tierraNueva.elegible).toBe(false);
    expect(tierraNueva.motivo).toContain("no recibe la variedad Caturra");
    const r = recomendar(LOTE, COOPS);
    expect(r.every((x) => x.cooperativaId !== "c4")).toBe(true); // hay 3 elegibles, no hace falta rellenar
  });

  it("no es elegible si el lote supera la capacidad, y el motivo lo dice", () => {
    const grande: LoteEntrada = { ...LOTE, kg: 4000 };
    const aroma = puntuarTodas(grande, COOPS).find((x) => x.cooperativaId === "c3")!;
    expect(aroma.elegible).toBe(false);
    expect(aroma.motivo).toContain("solo tiene capacidad para 3000 kg");
  });

  it("si hay menos de 3 elegibles, completa con las no elegibles al final", () => {
    const natural: LoteEntrada = { metodo: "natural", variedad: "Castillo", kg: 300, municipio: "Andes" };
    const r = recomendar(natural, COOPS); // solo Raíz Alta y Aroma aceptan natural
    expect(r.filter((x) => x.elegible).map((x) => x.cooperativaId).sort()).toEqual(["c2", "c3"]);
    expect(r).toHaveLength(3);
    expect(r[2].elegible).toBe(false);
  });

  it("calcula el total como precio por kg × kg", () => {
    const r = recomendar(LOTE, COOPS).find((x) => x.cooperativaId === "c1")!;
    expect(r.precioKg).toBe(21500);
    expect(r.total).toBe(21500 * 500);
  });

  it("mismo municipio: distancia 0 y motivo lo menciona", () => {
    const r = puntuarTodas(LOTE, COOPS).find((x) => x.cooperativaId === "c1")!;
    expect(r.distanciaKm).toBe(0);
    expect(r.desglose.cercania).toBe(PESOS.cercania);
    expect(r.motivo).toContain("en tu mismo municipio");
  });

  it("ignora tildes y mayúsculas en municipio, método y variedad", () => {
    const lote: LoteEntrada = { metodo: "LAVADO", variedad: "caturra", kg: 500, municipio: "JARDIN" };
    const r = puntuarTodas(lote, COOPS).find((x) => x.cooperativaId === "c3")!;
    expect(r.distanciaKm).toBe(0);
    expect(r.elegible).toBe(true);
  });

  it("municipio desconocido: cercanía neutra y lo avisa en el motivo", () => {
    const lote: LoteEntrada = { ...LOTE, municipio: "Pueblo Inventado" };
    const r = puntuarTodas(lote, COOPS)[0];
    expect(r.distanciaKm).toBeNull();
    expect(r.desglose.cercania).toBe(PESOS.cercania / 2);
    expect(r.motivo).toMatch(/^No tenemos la ubicación exacta/);
  });

  it("marca el mejor precio en el motivo", () => {
    const aroma = puntuarTodas(LOTE, COOPS).find((x) => x.cooperativaId === "c3")!;
    expect(aroma.motivo).toContain("el mejor precio entre las cooperativas");
  });

  it("puntajes siempre entre 0 y 100", () => {
    for (const r of puntuarTodas({ ...LOTE, kg: 99999, municipio: "Nada" }, COOPS)) {
      expect(r.puntaje).toBeGreaterThanOrEqual(0);
      expect(r.puntaje).toBeLessThanOrEqual(100);
    }
  });

  it("sin cooperativas devuelve vacío", () => {
    expect(recomendar(LOTE, [])).toEqual([]);
  });

  it("una cooperativa sin listas de métodos/variedades acepta cualquiera", () => {
    const abierta: CooperativaEntrada = { ...COOPS[0], id: "x", metodos_aceptados: [], variedades_aceptadas: [] };
    expect(puntuarTodas({ ...LOTE, metodo: "natural", variedad: "Geisha" }, [abierta])[0].elegible).toBe(true);
  });
});
