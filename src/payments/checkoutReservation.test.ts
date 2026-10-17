import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { IniciarPagoInput, Perfil } from "@/adapters/types";

const state = vi.hoisted(() => ({ profile: vi.fn(), database: vi.fn(), lookup: vi.fn() }));
vi.mock("@/adapters/auth", () => ({ auth: { obtenerPerfil: state.profile } }));
vi.mock("@/lib/supabase/admin", () => ({ clienteAdmin: () => {
  state.database();
  return { from: (table: string) => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => state.lookup(table) };
    return query;
  } };
} }));
import { assertActiveCheckoutPayment } from "./checkoutReservation";
import { checkoutCookie, createSdkAdapter } from "./sdkAdapter";

const profile: Perfil = { id: "buyer-id", rol: "comprador", nombre: "Comprador", municipio: "Marsella", tiene_invima: false, wallet_address: "https://ilp.interledger-test.dev/buyer" };
const input: IniciarPagoInput = { tipo: "pedido", referenciaId: "pedido-id", montoCop: 15000, walletPagador: profile.wallet_address!, walletReceptor: "https://ilp.interledger-test.dev/seller", urlRetorno: "http://127.0.0.1:3100/pago/retorno" };
function rows(owner = profile.id, payment: Partial<typeof input> = {}) {
  const value = { ...input, ...payment };
  state.lookup.mockImplementation((table: string) => ({ data: table === "pagos" ? { estado: "pendiente", tipo: value.tipo, referencia_id: value.referenciaId, monto: value.montoCop, wallet_pagador: value.walletPagador, wallet_receptor: value.walletReceptor } : { estado: value.tipo === "pedido" ? "pendiente" : "aceptada", pago_id: "op_active", comprador_id: owner, cooperativas: { perfil_id: owner } }, error: null }));
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("OPEN_PAYMENTS_MAX_RECEIVE", "15000");
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", "http://127.0.0.1:3100");
  state.profile.mockResolvedValue(profile);
  rows();
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it.each(["pedido", "oferta"] as const)("la reserva exige el perfil y propietario correctos para %s", async (tipo) => {
  const payer = { ...profile, rol: tipo === "pedido" ? "comprador" as const : "cooperativa" as const };
  state.profile.mockResolvedValue(payer);
  rows(payer.id, { tipo });
  await expect(assertActiveCheckoutPayment({ ...input, tipo }, "op_active")).resolves.toBeUndefined();
  rows("another-owner", { tipo });
  await expect(assertActiveCheckoutPayment({ ...input, tipo }, "op_active")).rejects.toMatchObject({ status: 403 });
});

it.each([
  ["pedido", { comprador_id: null }],
  ["pedido", {}],
  ["oferta", { cooperativas: null }],
  ["oferta", { cooperativas: { perfil_id: null } }],
] as const)("rechaza una referencia %s sin propietario comprobable: %j", async (tipo, ownership) => {
  state.profile.mockResolvedValue({ ...profile, rol: tipo === "pedido" ? "comprador" : "cooperativa" });
  rows(profile.id, { tipo });
  const lookup = state.lookup.getMockImplementation()!;
  state.lookup.mockImplementation((table: string) => {
    const row = lookup(table);
    if (table !== "pagos") row.data = { pago_id: "op_active", estado: tipo === "pedido" ? "pendiente" : "aceptada", ...ownership };
    return row;
  });
  await expect(assertActiveCheckoutPayment({ ...input, tipo }, "op_active")).rejects.toMatchObject({ status: 403 });
});

it.each([
  ["pedido", "fallido"], ["pedido", "pagado"], ["pedido", "desconocido"],
  ["oferta", "propuesta"], ["oferta", "pagada"], ["oferta", "pendiente"], ["oferta", "desconocido"],
] as const)("la referencia %s en estado %s no autoriza el envío", async (tipo, estado) => {
  state.profile.mockResolvedValue({ ...profile, rol: tipo === "pedido" ? "comprador" : "cooperativa" });
  rows(profile.id, { tipo });
  const lookup = state.lookup.getMockImplementation()!;
  state.lookup.mockImplementation((table: string) => {
    const row = lookup(table);
    if (table !== "pagos") row.data.estado = estado;
    return row;
  });
  await expect(assertActiveCheckoutPayment({ ...input, tipo }, "op_active")).rejects.toMatchObject({ status: 409 });
});

it("una oferta fallida con un nuevo pago activo reservado conserva el reintento autorizado", async () => {
  state.profile.mockResolvedValue({ ...profile, rol: "cooperativa" });
  rows(profile.id, { tipo: "oferta" });
  const lookup = state.lookup.getMockImplementation()!;
  state.lookup.mockImplementation((table: string) => {
    const row = lookup(table);
    if (table === "ofertas") row.data.estado = "fallida";
    return row;
  });
  await expect(assertActiveCheckoutPayment({ ...input, tipo: "oferta" }, "op_active")).resolves.toBeUndefined();
});

it.each([
  ["sesión cerrada", null],
  ["otro rol", { ...profile, rol: "caficultor" }],
  ["wallet cambiada", { ...profile, wallet_address: "https://ilp.interledger-test.dev/other" }],
] as const)("rechaza %s antes de consultar con privilegios", async (_, current) => {
  state.profile.mockResolvedValue(current);
  await expect(assertActiveCheckoutPayment(input, "op_active")).rejects.toMatchObject({ status: current ? 403 : 401 });
  expect(state.database).not.toHaveBeenCalled();
});

it("un fallo al validar identidad o consultar DB bloquea la ejecución", async () => {
  state.profile.mockRejectedValueOnce(new Error("auth unavailable"));
  await expect(assertActiveCheckoutPayment(input, "op_active")).rejects.toMatchObject({ status: 401 });
  state.lookup.mockResolvedValue({ data: null, error: { message: "DB unavailable" } });
  await expect(assertActiveCheckoutPayment(input, "op_active")).rejects.toMatchObject({ status: 409 });
});

it.each(["logout", "switch-account"])("el retorno después de %s no valida GNAP ni crea el pago", async (change) => {
  let callback = "";
  const amount = { value: "1500000", assetCode: "COP", assetScale: 2 };
  const quote = { rail: "open-payments" as const, estado: "pendiente" as const, quoteId: "quote", debitAmount: amount, receiveAmount: amount, debitAssetCode: "COP", outgoingId: null, isReceive: true as const, simulado: false, evidencia: null };
  const confirm = vi.fn(async () => ({ ...quote, estado: "completado" as const }));
  const authorizeReturn = vi.fn(async () => {});
  const adapter = createSdkAdapter(async () => ({ quote, clear() {}, confirm, authorizeReturn, authorize: async (url) => { callback = url; return { redirectUrl: "https://wallet.interledger-test.dev/consent" }; } }));
  const started = await adapter.start(input, "browser-session");
  rows();
  // The DB payment id is generated by the adapter; keep the reservation current.
  const lookup = state.lookup.getMockImplementation()!;
  state.lookup.mockImplementation((table: string) => {
    const row = lookup(table);
    if (table === "pedidos") row.data.pago_id = started.pagoId;
    return row;
  });
  state.profile.mockResolvedValue(change === "logout" ? null : { ...profile, id: "another-owner" });
  const response = await adapter.callback(new Request(callback, { headers: { Cookie: `${checkoutCookie}=browser-session` } }));
  expect(response.status).toBe(change === "logout" ? 401 : 403);
  expect(authorizeReturn).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});
