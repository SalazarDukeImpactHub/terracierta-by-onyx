import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { iniciarPago, consultarPago } from "./index";
const sdk = vi.hoisted(() => ({ start: vi.fn(), consultar: vi.fn() }));
vi.mock("./sdkAdapter", () => ({ iniciarPagoSdk: sdk.start, getSdkAdapter: () => ({ consultar: sdk.consultar }) }));
beforeEach(() => { vi.stubEnv("PAYMENTS_RAIL", "open-payments"); vi.clearAllMocks(); });
afterEach(() => { vi.unstubAllEnvs(); });
it("delega el inicio al SDK conservando la URL de consentimiento GNAP", async () => {
  const input = { tipo: "pedido" as const, referenciaId: "pedido-1", montoCop: 15000, walletReceptor: "$ilp.interledger-test.dev/921a6da8", walletPagador: "wallet-comprador", urlRetorno: "http://127.0.0.1:3100/pago/retorno" };
  sdk.start.mockResolvedValue({ pagoId: "op_test", estado: "pendiente", redirectUrl: "https://wallet.interledger-test.dev/consent/test" });
  expect(await iniciarPago(input)).toMatchObject({ pagoId: "op_test", estado: "pendiente", redirectUrl: expect.stringContaining("/consent/") });
  expect(sdk.start).toHaveBeenCalledExactlyOnceWith(input);
});
it("consulta el estado del SDK sin una ruta alternativa con cookies", async () => {
  sdk.consultar.mockResolvedValue({ estado: "pendiente", detalle: { rail: "open-payments" } });
  expect(await consultarPago("op_test")).toMatchObject({ estado: "pendiente", detalle: { rail: "open-payments" } });
  expect(sdk.consultar).toHaveBeenCalledExactlyOnceWith("op_test");
});
