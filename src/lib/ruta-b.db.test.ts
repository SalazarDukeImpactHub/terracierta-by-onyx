import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Pruebas de INTEGRACIÓN de la Ruta B contra la base local (Supabase). Se saltan solas si no hay
 * llaves en el entorno. Correr con `npm run test:db` (necesita `supabase start`).
 * Crean sus propios datos (marcados por el lote que crean) y los borran al terminar.
 */
const HAY_DB = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

const JAIRO = "22222222-2222-4222-8222-222222222222"; // caficultor sin INVIMA, dueño del lote de prueba
const MARTA = "11111111-1111-4111-8111-111111111111"; // otro caficultor (también hace de "perfil equivocado")
const CUMBRES_PERFIL = "33333333-3333-4333-8333-333333333333"; // cooperativa demo
const CUMBRES = "aaaaaaaa-0001-4000-8000-000000000001";
const AROMA = "aaaaaaaa-0003-4000-8000-000000000003";
const TIERRA_NUEVA = "aaaaaaaa-0004-4000-8000-000000000004"; // no recibe Caturra

describe.skipIf(!HAY_DB)("Ruta B (integración con la base local)", () => {
  let loteId = "";
  let ofertaId = "";
  let ruta: typeof import("./ruta-b");
  let pagos: typeof import("./pagos-service");
  let db: ReturnType<typeof import("./supabase/admin").clienteAdmin>;

  beforeAll(async () => {
    // Node < 22 no trae WebSocket nativo y supabase-js lo exige al crear el cliente. La app no usa realtime:
    // basta un reemplazo vacío (solo si falta) para que el cliente se construya.
    if (typeof WebSocket === "undefined") vi.stubGlobal("WebSocket", class {});
    vi.stubEnv("USE_MOCKS", "true");
    vi.resetModules();
    ruta = await import("./ruta-b");
    pagos = await import("./pagos-service");
    db = (await import("./supabase/admin")).clienteAdmin();
    const { data, error } = await db
      .from("lotes")
      .insert({ caficultor_id: JAIRO, metodo: "lavado", variedad: "Caturra", kg: 500, municipio: "Marsella" })
      .select("id")
      .single();
    if (error || !data) throw new Error("No se pudo crear el lote de prueba: " + error?.message);
    loteId = data.id;
  });

  afterAll(async () => {
    if (!db || !loteId) return;
    const { data: ofertas } = await db.from("ofertas").select("id, pago_id").eq("lote_id", loteId);
    const pagoIds = (ofertas ?? []).map((o) => o.pago_id).filter(Boolean) as string[];
    await db.from("ofertas").delete().eq("lote_id", loteId);
    if (pagoIds.length) await db.from("pagos").delete().in("id", pagoIds);
    await db.from("lotes").delete().eq("id", loteId);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("no deja elegir cooperativa sobre un lote ajeno", async () => {
    const r = await ruta.elegirCooperativaParaLote(loteId, CUMBRES, MARTA);
    expect(r).toEqual({ ok: false, error: "No encontramos ese lote en tu cuenta." });
  });

  it("no deja elegir una cooperativa que no puede comprar el lote (no recibe Caturra)", async () => {
    const r = await ruta.elegirCooperativaParaLote(loteId, TIERRA_NUEVA, JAIRO);
    expect(r.ok).toBe(false);
  });

  it("no deja elegir una cooperativa inexistente", async () => {
    const r = await ruta.elegirCooperativaParaLote(loteId, "aaaaaaaa-9999-4000-8000-000000000999", JAIRO);
    expect(r.ok).toBe(false);
  });

  it("crea la oferta SOLO cuando el caficultor elige, con precio y total calculados en el servidor", async () => {
    expect(await ruta.ofertasDelLote(loteId)).toHaveLength(0); // ver el top 3 no crea ofertas
    const r = await ruta.elegirCooperativaParaLote(loteId, CUMBRES, JAIRO);
    expect(r.ok).toBe(true);
    if (r.ok) ofertaId = r.ofertaId;

    const [oferta] = await ruta.ofertasDelLote(loteId);
    expect(oferta.estado).toBe("propuesta");
    expect(oferta.precio_kg).toBe(21500);
    expect(oferta.total).toBe(21500 * 500);
    const { data: lote } = await db.from("lotes").select("estado").eq("id", loteId).single();
    expect(lote?.estado).toBe("con_ofertas");
  });

  it("no deja elegir otra cooperativa mientras hay una oferta en curso", async () => {
    const r = await ruta.elegirCooperativaParaLote(loteId, AROMA, JAIRO);
    expect(r).toEqual({ ok: false, error: "Este lote ya tiene una oferta en curso." });
  });

  it("no se puede pagar una oferta que todavía no fue aceptada", async () => {
    const r = await pagos.iniciarPagoDeOferta(ofertaId, CUMBRES_PERFIL);
    expect(r).toMatchObject({ ok: false, status: 409 });
  });

  it("solo la cooperativa destinataria puede aceptar la oferta", async () => {
    expect(await ruta.aceptarOfertaDeCooperativa(ofertaId, MARTA)).toEqual({ ok: false, error: "No encontramos esa oferta." });
    expect(await ruta.aceptarOfertaDeCooperativa(ofertaId, JAIRO)).toEqual({ ok: false, error: "No encontramos esa oferta." });
  });

  it("la cooperativa acepta una vez; la segunda vez ya no está pendiente", async () => {
    expect(await ruta.aceptarOfertaDeCooperativa(ofertaId, CUMBRES_PERFIL)).toEqual({ ok: true });
    const otra = await ruta.aceptarOfertaDeCooperativa(ofertaId, CUMBRES_PERFIL);
    expect(otra.ok).toBe(false);
  });

  it("otro perfil no puede pagar la oferta de esta cooperativa", async () => {
    const r = await pagos.iniciarPagoDeOferta(ofertaId, MARTA);
    expect(r).toMatchObject({ ok: false, status: 404 });
  });

  it("la cooperativa paga: wallet pagadora = la suya, receptora = la del caficultor, monto = el de la oferta", async () => {
    const r = await pagos.iniciarPagoDeOferta(ofertaId, CUMBRES_PERFIL);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.redirectUrl).toContain("/pago/mock?pago_id=");

    const { data: pago } = await db.from("pagos").select("*").eq("id", r.pagoId).single();
    expect(pago).toMatchObject({
      tipo: "oferta",
      referencia_id: ofertaId,
      monto: 21500 * 500,
      estado: "pendiente",
      wallet_pagador: "https://wallet.example.test/cumbres-cafeteras",
      wallet_receptor: "https://wallet.example.test/jairo-montoya",
    });
  });

  it("al autorizarse y completarse, la oferta queda pagada y el lote vendido", async () => {
    const [oferta] = await ruta.ofertasDelLote(loteId);
    const mock = await import("@/adapters/mocks/payments");
    await mock.registrarDecisionMock(oferta.pago_id!, true);
    await new Promise((res) => setTimeout(res, 3500)); // el mock tarda 3 s en "ejecutar"

    const vista = await pagos.sincronizarPago(oferta.pago_id!);
    expect(vista?.estado).toBe("completado");
    expect(vista?.concepto).toBe("Lote de 500 kg · Caturra lavado");

    expect((await ruta.ofertasDelLote(loteId))[0].estado).toBe("pagada");
    const { data: lote } = await db.from("lotes").select("estado").eq("id", loteId).single();
    expect(lote?.estado).toBe("vendido");
  }, 15000);

  it("una oferta ya pagada no se puede volver a pagar", async () => {
    const r = await pagos.iniciarPagoDeOferta(ofertaId, CUMBRES_PERFIL);
    expect(r).toMatchObject({ ok: false, status: 409, error: "Esta oferta ya está pagada" });
  });

  it("si el pagador rechaza, la oferta queda fallida y la cooperativa puede reintentar", async () => {
    const { data: lote2 } = await db
      .from("lotes")
      .insert({ caficultor_id: JAIRO, metodo: "lavado", variedad: "Castillo", kg: 200, municipio: "Marsella" })
      .select("id")
      .single();
    const lote2Id = lote2!.id;
    try {
      const elegida = await ruta.elegirCooperativaParaLote(lote2Id, CUMBRES, JAIRO);
      expect(elegida.ok).toBe(true);
      if (!elegida.ok) return;
      await ruta.aceptarOfertaDeCooperativa(elegida.ofertaId, CUMBRES_PERFIL);

      const primero = await pagos.iniciarPagoDeOferta(elegida.ofertaId, CUMBRES_PERFIL);
      expect(primero.ok).toBe(true);
      if (!primero.ok) return;
      const mock = await import("@/adapters/mocks/payments");
      await mock.registrarDecisionMock(primero.pagoId, false); // el pagador rechaza

      expect((await pagos.sincronizarPago(primero.pagoId))?.estado).toBe("fallido");
      expect((await ruta.ofertasDelLote(lote2Id))[0].estado).toBe("fallida");
      const { data: l } = await db.from("lotes").select("estado").eq("id", lote2Id).single();
      expect(l?.estado).toBe("con_ofertas"); // no se vendió

      const reintento = await pagos.iniciarPagoDeOferta(elegida.ofertaId, CUMBRES_PERFIL);
      expect(reintento.ok).toBe(true);
      expect(reintento.ok && reintento.pagoId).not.toBe(primero.pagoId);
    } finally {
      const { data: ofs } = await db.from("ofertas").select("id").eq("lote_id", lote2Id);
      const { data: pgs } = await db.from("pagos").select("id").in("referencia_id", (ofs ?? []).map((o) => o.id));
      await db.from("ofertas").delete().eq("lote_id", lote2Id);
      if (pgs?.length) await db.from("pagos").delete().in("id", pgs.map((p) => p.id));
      await db.from("lotes").delete().eq("id", lote2Id);
    }
  });
});
