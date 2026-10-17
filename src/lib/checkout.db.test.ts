import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Integración del checkout con COMPRADOR (cuenta + wallet de perfil) contra la base local.
 * Se salta sola si no hay llaves en el entorno. Correr con `npm run test:db` (necesita `supabase start`).
 * Crea sus propios pedidos y pagos y los borra al terminar.
 */
const HAY_DB = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

const ANDRES = "44444444-4444-4444-8444-444444444444"; // comprador con wallet normal
const SOFIA = "55555555-5555-4555-8555-555555555555"; // comprador con "fail" en la wallet: sus pagos fallan
const MARTA = "11111111-1111-4111-8111-111111111111"; // caficultora (dueña de la tienda)
const COOPERATIVA = "33333333-3333-4333-8333-333333333333";
const PRODUCTO = "bbbbbbbb-0001-4000-8000-000000000001"; // $38.000, publicado
const BORRADOR = "bbbbbbbb-0003-4000-8000-000000000003"; // no publicado

type PerfilMin = { id: string; rol: "caficultor" | "cooperativa" | "comprador"; wallet_address: string | null };

describe.skipIf(!HAY_DB)("Checkout con comprador (integración con la base local)", () => {
  let pagos: typeof import("./pagos-service");
  let mock: typeof import("@/adapters/mocks/payments");
  let db: ReturnType<typeof import("./supabase/admin").clienteAdmin>;
  const perfil: Record<string, PerfilMin> = {};
  const pedidosCreados: string[] = [];

  beforeAll(async () => {
    if (typeof WebSocket === "undefined") vi.stubGlobal("WebSocket", class {}); // Node < 22 (ver ruta-b.db.test.ts)
    vi.stubEnv("USE_MOCKS", "true");
    vi.resetModules();
    pagos = await import("./pagos-service");
    mock = await import("@/adapters/mocks/payments");
    db = (await import("./supabase/admin")).clienteAdmin();
    const { data } = await db.from("profiles").select("id, rol, wallet_address").in("id", [ANDRES, SOFIA, MARTA, COOPERATIVA]);
    for (const p of (data ?? []) as PerfilMin[]) perfil[p.id] = p;
  });

  afterAll(async () => {
    if (!db) return;
    if (pedidosCreados.length) {
      const { data: peds } = await db.from("pedidos").select("pago_id").in("id", pedidosCreados);
      const pagoIds = (peds ?? []).map((p) => p.pago_id).filter(Boolean) as string[];
      await db.from("pedidos").delete().in("id", pedidosCreados);
      if (pagoIds.length) await db.from("pagos").delete().in("id", pagoIds);
    }
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function pedidoDe(pagoId: string) {
    const { data } = await db.from("pedidos").select("*").eq("pago_id", pagoId).single();
    if (data) pedidosCreados.push(data.id);
    return data;
  }

  it("los perfiles de ejemplo existen: 2 compradores con wallet", () => {
    expect(perfil[ANDRES]).toMatchObject({ rol: "comprador" });
    expect(perfil[ANDRES].wallet_address).toBeTruthy();
    expect(perfil[SOFIA].wallet_address).toContain("fail");
  });

  it("el comprador paga con la wallet de SU perfil; el monto y la wallet del caficultor salen de la base", async () => {
    const r = await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 2 }, perfil[ANDRES]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.redirectUrl).toContain("/pago/mock?pago_id=");

    const pedido = await pedidoDe(r.pagoId);
    expect(pedido).toMatchObject({
      comprador_id: ANDRES,
      wallet_comprador: perfil[ANDRES].wallet_address,
      cantidad: 2,
      monto: 76000,
      estado: "pendiente",
    });
    const { data: pago } = await db.from("pagos").select("*").eq("id", r.pagoId).single();
    expect(pago).toMatchObject({
      tipo: "pedido",
      monto: 76000,
      wallet_pagador: perfil[ANDRES].wallet_address,
      wallet_receptor: perfil[MARTA].wallet_address,
    });
  });

  it("ignora una wallet o un monto que mande el navegador", async () => {
    const r = await pagos.iniciarPagoDePedido(
      { productoId: PRODUCTO, cantidad: 1, walletComprador: "https://evil.test/yo", monto: 1, montoCop: 1, walletReceptor: "https://evil.test/x" },
      perfil[ANDRES],
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const pedido = await pedidoDe(r.pagoId);
    expect(pedido).toMatchObject({ wallet_comprador: perfil[ANDRES].wallet_address, monto: 38000 });
    const { data: pago } = await db.from("pagos").select("wallet_pagador, wallet_receptor, monto").eq("id", r.pagoId).single();
    expect(pago).toEqual({ wallet_pagador: perfil[ANDRES].wallet_address, wallet_receptor: perfil[MARTA].wallet_address, monto: 38000 });
  });

  it("el caficultor no compra su propio café: recibe 403 y no se crea nada", async () => {
    const antes = (await db.from("pedidos").select("id", { count: "exact", head: true })).count;
    expect(await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 1 }, perfil[MARTA])).toMatchObject({ ok: false, status: 403 });
    const despues = (await db.from("pedidos").select("id", { count: "exact", head: true })).count;
    expect(despues).toBe(antes);
  });

  it("un comprador sin wallet asignada no puede pagar (409)", async () => {
    const sinWallet: PerfilMin = { ...perfil[ANDRES], wallet_address: null };
    expect(await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 1 }, sinWallet)).toMatchObject({ ok: false, status: 409 });
  });

  it("rechaza producto no publicado, id inválido y cantidades fuera de rango", async () => {
    expect(await pagos.iniciarPagoDePedido({ productoId: BORRADOR, cantidad: 1 }, perfil[ANDRES])).toMatchObject({ ok: false, status: 404 });
    expect(await pagos.iniciarPagoDePedido({ productoId: "1' OR '1'='1", cantidad: 1 }, perfil[ANDRES])).toMatchObject({ ok: false, status: 400 });
    expect(await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 99 }, perfil[ANDRES])).toMatchObject({ ok: false, status: 400 });
    expect(await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 0 }, perfil[ANDRES])).toMatchObject({ ok: false, status: 400 });
  });

  it("al autorizar, el pedido queda pagado y aparece en las compras del comprador (y no en las de otro)", async () => {
    const r = await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 1 }, perfil[ANDRES]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const pedido = await pedidoDe(r.pagoId);
    await mock.registrarDecisionMock(r.pagoId, true);
    await new Promise((res) => setTimeout(res, 3500)); // el mock tarda 3 s en "ejecutar"

    const vista = await pagos.sincronizarPago(r.pagoId);
    expect(vista?.estado).toBe("completado");
    const { data: estado } = await db.from("pedidos").select("estado").eq("id", pedido!.id).single();
    expect(estado?.estado).toBe("pagado");

    // La pantalla "Mis compras" filtra por comprador_id
    const deAndres = await db.from("pedidos").select("id").eq("comprador_id", ANDRES).eq("id", pedido!.id);
    const deSofia = await db.from("pedidos").select("id").eq("comprador_id", SOFIA).eq("id", pedido!.id);
    expect(deAndres.data).toHaveLength(1);
    expect(deSofia.data).toHaveLength(0);
  }, 15000);

  it("el comprador cuya wallet contiene 'fail' termina con el pedido fallido (demo del estado fallido)", async () => {
    const r = await pagos.iniciarPagoDePedido({ productoId: PRODUCTO, cantidad: 1 }, perfil[SOFIA]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const pedido = await pedidoDe(r.pagoId);
    expect(pedido).toMatchObject({ comprador_id: SOFIA });
    await mock.registrarDecisionMock(r.pagoId, true);
    await new Promise((res) => setTimeout(res, 3500));

    expect((await pagos.sincronizarPago(r.pagoId))?.estado).toBe("fallido");
    const { data: estado } = await db.from("pedidos").select("estado").eq("id", pedido!.id).single();
    expect(estado?.estado).toBe("fallido");
  }, 15000);
});
