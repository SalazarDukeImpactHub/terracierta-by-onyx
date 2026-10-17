import { afterEach, expect, it, vi } from "vitest";
import { createGateway } from "./gateway";
import { clientOpen, clientSeal } from "./pqc/channel";
import { iniciarPago } from "./index";

vi.mock("@/lib/supabase/admin", () => ({
  clienteAdmin: () => ({ from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }) }),
}));

const origin = "http://127.0.0.1:3100";
const input = { action: "cotizar", amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Café" };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("rechaza el riel retirado antes de contactar la API web, con y sin PQC", async () => {
  vi.stubEnv("PAYMENTS_RAIL", "wallet-ui");
  vi.stubEnv("USE_MOCKS", "false");
  vi.stubEnv("WALLET_UI_COOKIE", "testnet.cookie=retired-session");
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", origin);
  const fetch = vi.fn(() => { throw new Error("No se permiten solicitudes externas"); });
  vi.stubGlobal("fetch", fetch);
  const gateway = createGateway();
  const key = await gateway.key();
  const bundle = await key.json();
  const cookie = key.headers.get("set-cookie")!.split(";")[0];
  for (const protectedMode of [false, true]) {
    const path = `/api/pasarela/cobrar${protectedMode ? "" : "-claro"}`;
    const sealed = protectedMode ? await clientSeal(bundle, input, path) : null;
    const response = await gateway.charge(new Request(origin + path, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie }, body: JSON.stringify(sealed?.envelope ?? { ...input, requestId: crypto.randomUUID() }) }), protectedMode);
    expect(response.status).toBe(503);
    const body = await response.json();
    const result = sealed ? await clientOpen(sealed, body) : body;
    expect(result).toMatchObject({ error: expect.stringMatching(/Open Payments/) });
  }
  expect(fetch).not.toHaveBeenCalled();
});

// Riel oficial del checkout: cookie de la billetera de prueba (ADR-001). Sin sesión ni credenciales no se envía dinero.
it("el checkout con cookie no contacta la API ni envía dinero si no puede entrar a la billetera", async () => {
  vi.stubEnv("INTERLEDGER_EMAIL", "");
  vi.stubEnv("INTERLEDGER_PASSWORD", "");
  const fetch = vi.fn(() => { throw new Error("No se permiten solicitudes externas"); });
  vi.stubGlobal("fetch", fetch);
  await expect(iniciarPago({ tipo: "pedido", referenciaId: "pedido-1", montoCop: 15000, walletReceptor: input.receiver, walletPagador: "wallet-comprador", urlRetorno: origin + "/pago/retorno" })).rejects.toMatchObject({ name: "LoginInterledgerError", message: expect.stringMatching(/entrar a Interledger/) });
  expect(fetch).not.toHaveBeenCalled();
});

it("una configuración SDK incompleta falla sin recurrir a cookies ni a la API web", async () => {
  vi.stubEnv("PAYMENTS_RAIL", "open-payments");
  vi.stubEnv("USE_MOCKS", "false");
  vi.stubEnv("OPEN_PAYMENTS_CLIENT_WALLET", "");
  vi.stubEnv("WALLET_UI_COOKIE", "testnet.cookie=retired-session");
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", origin);
  const fetch = vi.fn(() => { throw new Error("No se permiten solicitudes externas"); });
  vi.stubGlobal("fetch", fetch);
  const gateway = createGateway();
  const key = await gateway.key();
  const cookie = key.headers.get("set-cookie")!.split(";")[0];
  const response = await gateway.charge(new Request(origin + "/api/pasarela/cobrar-claro", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie }, body: JSON.stringify({ ...input, requestId: crypto.randomUUID() }) }), false);
  expect(response.status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();
});
