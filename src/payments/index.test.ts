import { beforeEach, expect, it, vi } from "vitest";
import { iniciarPago, consultarPago } from "./index";

const sdk = vi.hoisted(() => ({ iniciar: vi.fn(), consultar: vi.fn() }));
vi.mock("./sdkAdapter", () => ({
  iniciarPagoSdk: sdk.iniciar,
  getSdkAdapter: () => ({ consultar: sdk.consultar }),
}));
beforeEach(() => { vi.clearAllMocks(); });

const input = { tipo: "pedido" as const, referenciaId: "pedido-1", montoCop: 15000, walletReceptor: "$ilp.interledger-test.dev/921a6da8", walletPagador: "wallet-comprador", urlRetorno: "http://127.0.0.1:3100/pago/retorno" };

it("solicita consentimiento a Interledger antes de iniciar el envío", async () => {
  sdk.iniciar.mockResolvedValue({ pagoId: "op_test", redirectUrl: "https://wallet.interledger-test.dev/consent", estado: "pendiente", canalPqc: true });
  expect(await iniciarPago(input)).toMatchObject({
    pagoId: "op_test",
    redirectUrl: "https://wallet.interledger-test.dev/consent",
    estado: "pendiente",
    detalle: { rail: "open-payments", paso: "autorizacion", simulado: false },
  });
  expect(sdk.iniciar).toHaveBeenCalledExactlyOnceWith(input);
});

it("consulta el estado y el recibo de Open Payments", async () => {
  sdk.consultar.mockResolvedValue({ estado: "completado", detalle: { reciboPqc: { id: "receipt" } } });
  expect(await consultarPago("op_test")).toMatchObject({ estado: "completado", detalle: { reciboPqc: { id: "receipt" } } });
  expect(sdk.consultar).toHaveBeenCalledExactlyOnceWith("op_test");
});
