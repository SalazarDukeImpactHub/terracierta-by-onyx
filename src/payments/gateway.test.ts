import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGateway } from "./gateway";
import { prepararSimulacion } from "./settlement";
import { clientOpen, clientSeal, type PublicBundle } from "./pqc/channel";
import { verifyReceipt, type HybridReceipt } from "./pqc/hybridReceipt";

const input = { action: "cotizar", amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Café de Marsella" };
const base = "http://127.0.0.1:3100";
const path = "/api/pasarela/cobrar";
const clearPath = `${path}-claro`;
let sessionCookie = "";
const network = vi.fn(() => { throw new Error("Estas pruebas no permiten red externa"); });
function post(route: string, body: unknown, origin = base) {
  return new Request(base + route, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionCookie }, body: JSON.stringify(body) });
}
const clearCommand = (command: object) => ({ ...command, requestId: crypto.randomUUID() });
beforeEach(() => {
  vi.stubEnv("USE_MOCKS", "true");
  vi.stubEnv("PAYMENTS_RAIL", "open-payments");
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", base);
  vi.stubEnv("OPEN_PAYMENTS_MAX_RECEIVE", "0.05");
  vi.stubEnv("PAYMENTS_EXECUTION_ENABLED", "true");
  network.mockClear();
  vi.stubGlobal("fetch", network);
});
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
async function setup(gateway = createGateway()) {
  const response = await gateway.key();
  sessionCookie = response.headers.get("set-cookie")!.split(";")[0];
  return { gateway, bundle: await response.json() as PublicBundle };
}
async function protectedQuote(gateway: ReturnType<typeof createGateway>, bundle: PublicBundle) {
  const sealed = await clientSeal(bundle, input, path);
  const response = await gateway.charge(post(path, sealed.envelope), true);
  expect(response.status).toBe(202);
  return await clientOpen(sealed, await response.json()) as { confirmationToken: string; quoteId: string; reciboPqc: null };
}

describe("pasarela protegida y simulación sin red", () => {
  it("key y echo solo establecen el canal; la preparación no genera pago ni recibo final", async () => {
    const { gateway, bundle } = await setup();
    expect(JSON.stringify(bundle)).not.toMatch(/secretKey|privateKey|cookie/);
    const echo = await clientSeal(bundle, { cafe: "Marsella" }, "/api/pasarela/echo");
    expect(await clientOpen(echo, await (await gateway.echo(post("/api/pasarela/echo", echo.envelope))).json())).toEqual({ ok: true, echo: { cafe: "Marsella" } });
    expect(await protectedQuote(gateway, bundle)).toMatchObject({ reciboPqc: null, quoteId: expect.stringMatching(/^mock_quote_/) });
  });

  it("la confirmación protegida cifra el resultado y verifica el recibo híbrido", async () => {
    const { gateway, bundle } = await setup();
    const quote = await protectedQuote(gateway, bundle);
    const sealed = await clientSeal(bundle, { action: "confirmar", confirmationToken: quote.confirmationToken }, path);
    const response = await gateway.charge(post(path, sealed.envelope), true);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(JSON.stringify(body)).not.toMatch(/Marsella|EUR|mock_outgoing_/);
    const result = await clientOpen(sealed, body) as { reciboPqc: HybridReceipt };
    expect(result).toMatchObject({ estado: "completado", quoteId: quote.quoteId, isReceive: true, simulado: true });
    expect(verifyReceipt(result.reciboPqc, bundle.signature.publicKeys).valid).toBe(true);
    expect(result.reciboPqc.payload).toMatchObject({ requestId: sealed.envelope.requestId, receiver: input.receiver });
    expect((await gateway.charge(post(path, sealed.envelope), true)).status).toBe(409);
  });

  it("el modo claro conserva la confirmación de un uso, sin recibo PQC", async () => {
    const { gateway } = await setup();
    const quote = await (await gateway.charge(post(clearPath, clearCommand(input)), false)).json();
    const command = { action: "confirmar", confirmationToken: quote.confirmationToken };
    const response = await gateway.charge(post(clearPath, clearCommand(command)), false);
    expect(await response.json()).toMatchObject({ estado: "completado", reciboPqc: null, quoteId: quote.quoteId });
    expect((await gateway.charge(post(clearPath, clearCommand(command)), false)).status).toBe(409);
  });

  it("rechaza origen externo, campos extra, importes inválidos y cuerpos grandes", async () => {
    const { gateway } = await setup();
    expect((await gateway.charge(post(clearPath, clearCommand(input), "https://otro.test"), false)).status).toBe(403);
    for (const change of [{ amount: 0.06 }, { amount: -1 }, { amount: "0.05" }, { receiver: "https://localhost/private" }, { walletPagador: "otra-wallet" }, { simulado: true }]) {
      expect((await gateway.charge(post(clearPath, clearCommand({ ...input, ...change })), false)).status).toBe(400);
    }
    expect((await gateway.charge(post(clearPath, { description: "a".repeat(40000) }), false)).status).toBe(413);
  });

  it("rechaza sobres vencidos, alterados o reutilizados", async () => {
    const { gateway, bundle } = await setup();
    const sealed = await clientSeal(bundle, input, path);
    for (const change of [{ issuedAt: Date.now() - 600000 }, { ciphertext: "AAAA" }, { requestId: crypto.randomUUID() }]) {
      expect((await gateway.charge(post(path, { ...sealed.envelope, ...change }), true)).status).toBe(400);
    }
    expect((await gateway.charge(post(path, sealed.envelope), true)).status).toBe(202);
    expect((await gateway.charge(post(path, sealed.envelope), true)).status).toBe(409);
  });

  it("vincula el token a sesión, modo y datos originales", async () => {
    const { gateway, bundle } = await setup();
    const quote = await (await gateway.charge(post(clearPath, clearCommand(input)), false)).json();
    const command = { action: "confirmar", confirmationToken: quote.confirmationToken };
    const originalCookie = sessionCookie;
    sessionCookie = "";
    expect((await gateway.charge(post(clearPath, clearCommand(command)), false)).status).toBe(401);
    sessionCookie = originalCookie;
    const sealed = await clientSeal(bundle, command, path);
    expect((await gateway.charge(post(path, sealed.envelope), true)).status).toBe(409);
    expect((await gateway.charge(post(clearPath, clearCommand({ ...command, amount: 100 })), false)).status).toBe(400);
    expect((await gateway.charge(post(clearPath, clearCommand({ ...command, confirmationToken: "x".repeat(43) })), false)).status).toBe(409);
    expect((await gateway.charge(post(clearPath, clearCommand(command)), false)).status).toBe(201);
  });

  it("dos confirmaciones concurrentes no duplican la ejecución", async () => {
    let sends = 0;
    const { gateway } = await setup(createGateway(async (charge) => {
      const prepared = await prepararSimulacion(charge);
      return { ...prepared, async confirm() { sends++; await Promise.resolve(); return prepared.confirm(); } };
    }));
    const quote = await (await gateway.charge(post(clearPath, clearCommand(input)), false)).json();
    const responses = await Promise.all([1, 2].map(() => gateway.charge(post(clearPath, clearCommand({ action: "confirmar", confirmationToken: quote.confirmationToken })), false)));
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(sends).toBe(1);
  });

  it("una confirmación vencida no se ejecuta", async () => {
    const { gateway } = await setup();
    const quote = await (await gateway.charge(post(clearPath, clearCommand(input)), false)).json();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60000);
    expect((await gateway.charge(post(clearPath, clearCommand({ action: "confirmar", confirmationToken: quote.confirmationToken })), false)).status).toBe(409);
  });

  it("el interruptor de ejecución permite preparar, pero bloquea confirmar", async () => {
    vi.stubEnv("PAYMENTS_EXECUTION_ENABLED", "false");
    const { gateway } = await setup();
    const quote = await (await gateway.charge(post(clearPath, clearCommand(input)), false)).json();
    expect(quote.canConfirm).toBe(false);
    expect((await gateway.charge(post(clearPath, clearCommand({ action: "confirmar", confirmationToken: quote.confirmationToken })), false)).status).toBe(409);
  });

  it("un error durante el envío queda incierto y no permite repetir la ejecución", async () => {
    let attempts = 0;
    const { gateway, bundle } = await setup(createGateway(async (charge) => ({ ...await prepararSimulacion(charge), async confirm() { attempts++; throw new Error("private-session upstream"); } })));
    const quote = await protectedQuote(gateway, bundle);
    const confirm = async () => {
      const sealed = await clientSeal(bundle, { action: "confirmar", confirmationToken: quote.confirmationToken }, path);
      const response = await gateway.charge(post(path, sealed.envelope), true);
      return { response, body: await clientOpen(sealed, await response.json()) };
    };
    const first = await confirm();
    expect(first.response.status).toBe(502);
    expect(JSON.stringify(first.body)).not.toMatch(/private-session|upstream/);
    expect((await confirm()).response.status).toBe(409);
    expect(attempts).toBe(1);
  });

  it("limita intentos por proceso", async () => {
    const { gateway } = await setup();
    for (let i = 0; i < 10; i++) await gateway.charge(post(clearPath, clearCommand(input)), false);
    expect((await gateway.charge(post(clearPath, clearCommand(input)), false)).status).toBe(429);
  });
});
