import { afterEach, expect, it, vi } from "vitest";
import { createHybridSigner } from "@/payments/pqc/hybridReceipt";

const state = vi.hoisted(() => ({ lookup: vi.fn(), consultar: vi.fn(), current: null as string | null }));
vi.mock("@/adapters/payments", () => ({ pagos: { consultarPago: state.consultar } }));
vi.mock("@/adapters/auth", () => ({ auth: { obtenerPerfil: async () => ({ id: "buyer-id", rol: "comprador", wallet_address: "buyer" }) } }));
vi.mock("@/lib/supabase/admin", () => ({ clienteAdmin: () => ({ from: (table: string) => {
  let newId: string | undefined;
  let previous: string | null | undefined;
  const query = {
    select: () => query,
    update: (input: { pago_id: string }) => { newId = input.pago_id; return query; },
    eq: (key: string, value: string) => { if (key === "pago_id") previous = value; return query; },
    in: () => query,
    is: (key: string, value: null) => { if (key === "pago_id") previous = value; return query; },
    maybeSingle: async () => {
      if (table === "ofertas" && newId) {
        const match = state.current === previous;
        if (match) state.current = newId;
        return { data: match ? { id: "oferta" } : null, error: null };
      }
      return { data: state.lookup(table), error: null };
    },
  };
  return query;
} }) }));
import { sincronizarPago, reservarPagoDeOferta, iniciarPagoDeOferta } from "./pagos-service";

afterEach(() => vi.clearAllMocks());
it("no consulta al riel ni revela datos si la wallet no participa en el pago", async () => {
  state.lookup.mockReturnValue({ tipo: "pedido", wallet_pagador: "buyer", wallet_receptor: "seller", estado: "pendiente" });
  expect(await sincronizarPago("op_payment_123", "stranger")).toBeNull();
  expect(state.consultar).not.toHaveBeenCalled();
});
it("conserva el comprobante firmado y la procedencia PQC hasta la pantalla de retorno", async () => {
  const receipt = createHybridSigner().sign({ pagoId: "op_payment_123", estado: "completado", amount: 15000, receiver: "seller", canalPqc: true });
  state.lookup.mockImplementation((table: string) => table === "pagos" ? { tipo: "pedido", referencia_id: "pedido-1", wallet_pagador: "buyer", wallet_receptor: "seller", estado: "completado", monto: 15000, detalle_json: { canalPqc: true, reciboPqc: receipt } } : { cantidad: 1, productos: { nombre: "Café" } });
  expect(await sincronizarPago("op_payment_123", "buyer")).toMatchObject({ estado: "completado", detalle: { canalPqc: true, reciboPqc: receipt } });
  expect(state.consultar).not.toHaveBeenCalled();
});

it("dos reservas concurrentes de la misma oferta solo entregan una autorización activa", async () => {
  state.current = null;
  const results = await Promise.all([reservarPagoDeOferta("oferta", null, "op_first"), reservarPagoDeOferta("oferta", null, "op_second")]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(state.current).toBe("op_first");
});
it("un reintento solo reemplaza exactamente el pago anterior esperado", async () => {
  state.current = "op_failed";
  expect(await reservarPagoDeOferta("oferta", "op_failed", "op_retry")).toBe(true);
  expect(await reservarPagoDeOferta("oferta", "op_failed", "op_stale")).toBe(false);
  expect(state.current).toBe("op_retry");
});
it("una oferta con pago pendiente no prepara otra autorización", async () => {
  state.lookup.mockImplementation((table: string) => table === "ofertas" ? { id: "oferta", estado: "aceptada", pago_id: "op_pending" } : { estado: "pendiente" });
  expect(await iniciarPagoDeOferta("oferta", "cooperativa")).toMatchObject({ ok: false, status: 409 });
});

it("el guard de envío rechaza pagos que no coincidan con la reserva o con el monto del servidor", async () => {
  const { assertActiveCheckoutPayment } = await import("@/payments/checkoutReservation");
  const input = { tipo: "pedido" as const, referenciaId: "pedido-1", montoCop: 15000, walletPagador: "buyer", walletReceptor: "seller", urlRetorno: "http://127.0.0.1:3100/pago/retorno" };
  const row = { estado: "pendiente", tipo: "pedido", referencia_id: "pedido-1", monto: 15000, wallet_pagador: "buyer", wallet_receptor: "seller" };
  state.lookup.mockImplementation((table: string) => table === "pagos" ? row : { pago_id: "op_current", estado: "pendiente", comprador_id: "buyer-id" });
  await expect(assertActiveCheckoutPayment(input, "op_current")).resolves.toBeUndefined();
  await expect(assertActiveCheckoutPayment(input, "op_old")).rejects.toMatchObject({ status: 409 });
  await expect(assertActiveCheckoutPayment({ ...input, montoCop: 1 }, "op_current")).rejects.toMatchObject({ status: 409 });
});
