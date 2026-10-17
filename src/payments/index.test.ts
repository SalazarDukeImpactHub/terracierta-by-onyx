import { beforeEach, expect, it, vi } from "vitest";
import { iniciarPago, consultarPago } from "./index";

// Riel oficial: billetera de prueba de Interledger con cookie (ADR-001). El SDK/GNAP queda como futuro.
const ilp = vi.hoisted(() => ({ pagar: vi.fn(), estado: vi.fn() }));
const db = vi.hoisted(() => ({ pago: vi.fn() }));
vi.mock("@/lib/interledger", () => ({ pagarEntreBilleteras: ilp.pagar, estadoPagoInterledger: ilp.estado }));
vi.mock("@/lib/supabase/admin", () => ({
  clienteAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.pago() }) }) }) }) }),
}));
beforeEach(() => { vi.clearAllMocks(); });

const input = { tipo: "pedido" as const, referenciaId: "pedido-1", montoCop: 15000, walletReceptor: "$ilp.interledger-test.dev/921a6da8", walletPagador: "wallet-comprador", urlRetorno: "http://127.0.0.1:3100/pago/retorno" };

it("envía el dinero entre billeteras con la descripción del pedido y no devuelve URL de consentimiento", async () => {
  ilp.pagar.mockResolvedValue({ pagoId: "q_test", descripcion: "Terracierta pedido pedido-1", estado: "completado" });
  expect(await iniciarPago(input)).toMatchObject({ pagoId: "q_test", estado: "completado", redirectUrl: null, detalle: { paso: "finalizacion", simulado: false } });
  expect(ilp.pagar).toHaveBeenCalledExactlyOnceWith({ walletPagador: "wallet-comprador", walletReceptor: input.walletReceptor, monto: 15000, descripcion: "Terracierta pedido pedido-1", volver: "/pago/retorno" });
});

it("deja el pago pendiente mientras la billetera no lo confirme y lo marca fallido si lo rechaza", async () => {
  ilp.pagar.mockResolvedValueOnce({ pagoId: "q_1", descripcion: "d", estado: "pendiente" });
  expect(await iniciarPago(input)).toMatchObject({ estado: "pendiente", detalle: { paso: "ejecucion" } });
  ilp.pagar.mockResolvedValueOnce({ pagoId: "q_2", descripcion: "d", estado: "fallido" });
  expect(await iniciarPago(input)).toMatchObject({ estado: "fallido", detalle: { motivo: expect.stringMatching(/rechaz/) } });
});

it("consulta el estado en la billetera usando la wallet y la descripción guardadas", async () => {
  db.pago.mockReturnValue({ wallet_pagador: "wallet-comprador", detalle_json: { descripcion: "Terracierta pedido pedido-1" } });
  ilp.estado.mockResolvedValue("completado");
  expect(await consultarPago("q_test")).toMatchObject({ estado: "completado", detalle: { recibo: "ILP-Q_TEST", simulado: false } });
  expect(ilp.estado).toHaveBeenCalledExactlyOnceWith("q_test", "Terracierta pedido pedido-1", "wallet-comprador");
});

it("no inventa un estado si el pago no tiene datos guardados", async () => {
  db.pago.mockReturnValue(null);
  expect(await consultarPago("q_desconocido")).toMatchObject({ estado: "fallido", detalle: { simulado: false } });
  expect(ilp.estado).not.toHaveBeenCalled();
});
