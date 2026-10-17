import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenPaymentsRail, verifyInteractionHash } from "./openPayments";
import { mockWalletAddress, mockQuote, mockIncomingPayment, mockOutgoingPayment, mockGrant, mockPendingGrant, type AuthenticatedClient } from "@interledger/open-payments";

const sender = "https://ilp.interledger-test.dev/buyer";
const receiver = "https://ilp.interledger-test.dev/921a6da8";
const amount = { value: "5", assetCode: "EUR", assetScale: 2 };
const authServer = "https://auth.interledger-test.dev/";
const callback = "http://127.0.0.1:3100/api/pasarela/retorno?state=state-1";
const input = { amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Café" };

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function fixture(assetCode = "EUR", value = "5") {
  const amount = { value, assetCode, assetScale: 2 };
  const grants: Record<string, unknown>[] = [];
  let outgoingCount = 0;
  let outgoingComplete = false;
  const client = {
    walletAddress: { get: async ({ url }: { url: string }) => mockWalletAddress({ id: url, assetCode, assetScale: 2, authServer, resourceServer: "https://ilp.interledger-test.dev/op" }) },
    grant: {
      request: async (_: unknown, body: Record<string, unknown>) => { grants.push(body); return body.interact ? mockPendingGrant({ interact: { redirect: "https://wallet.interledger-test.dev/consent/1", finish: "server-nonce" }, continue: { uri: "https://auth.interledger-test.dev/continue/1", access_token: { value: "test-only-continue-token" } } }) : mockGrant(); },
      continue: vi.fn(async () => mockGrant()),
    },
    incomingPayment: {
      create: async () => mockIncomingPayment({ id: "https://ilp.interledger-test.dev/incoming/1", walletAddress: receiver, incomingAmount: amount, receivedAmount: { ...amount, value: "0" }, completed: false }),
      get: async () => mockIncomingPayment({ walletAddress: receiver, incomingAmount: amount, receivedAmount: amount, completed: true }),
    },
    quote: { create: async () => mockQuote({ id: "https://ilp.interledger-test.dev/quotes/1", walletAddress: sender, debitAmount: amount, receiveAmount: amount, expiresAt: new Date(Date.now() + 300000).toISOString() }) },
    outgoingPayment: {
      create: async () => { outgoingCount++; return mockOutgoingPayment({ id: "https://ilp.interledger-test.dev/outgoing/1", walletAddress: sender, debitAmount: amount, receiveAmount: amount, sentAmount: { ...amount, value: "0" }, failed: false }); },
      get: async () => { outgoingComplete = true; return mockOutgoingPayment({ id: "https://ilp.interledger-test.dev/outgoing/1", debitAmount: amount, receiveAmount: amount, sentAmount: amount, failed: false }); },
    },
  } as unknown as AuthenticatedClient;
  return { client, grants, outgoingCount: () => outgoingCount, outgoingComplete: () => outgoingComplete };
}

describe("riel SDK oficial y GNAP", () => {
  it("valida el vector publicado de hash y rechaza cambios", () => {
    const args = { clientNonce: "VJLO6A4CATR0KRO", serverNonce: "MBDOFXG4Y5CVJCX821LH", interactRef: "4IFWWIKYB2PQ6U56NL1", authServer: "https://server.example.com/tx" };
    expect(verifyInteractionHash(args, "x-gguKWTj8rQf7d7i3w3UhzvuJ5bpOlKyAlVpLxBffY")).toBe(true);
    expect(verifyInteractionHash({ ...args, interactRef: "otro" }, "x-gguKWTj8rQf7d7i3w3UhzvuJ5bpOlKyAlVpLxBffY")).toBe(false);
  });

  it("verifica el Base64 con relleno que devuelve Rafiki sin aceptar hashes alterados", () => {
    const values = { clientNonce: "VJLO6A4CATR0KRO", serverNonce: "MBDOFXG4Y5CVJCX821LH", interactRef: "4IFWWIKYB2PQ6U56NL1", authServer: "https://server.example.com/tx" };
    const hash = "x+gguKWTj8rQf7d7i3w3UhzvuJ5bpOlKyAlVpLxBffY=";
    expect(verifyInteractionHash(values, hash)).toBe(true);
    for (const key of Object.keys(values) as (keyof typeof values)[]) {
      expect(verifyInteractionHash({ ...values, [key]: `${values[key]}-alterado` }, hash)).toBe(false);
    }
    for (const invalid of [hash.slice(1), `${hash}=`, `${hash}\n`, hash.replace("+", " "), hash.replace("Y=", "Z="), "A".repeat(44)]) {
      expect(verifyInteractionHash(values, invalid)).toBe(false);
    }
  });

  it("no envía fondos antes de verificar consentimiento; pide un grant acotado al débito y receptor", async () => {
    const f = fixture();
    const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
    expect(prepared.quote).toMatchObject({ estado: "pendiente", rail: "open-payments", isReceive: true, debitAmount: amount });
    await expect(prepared.confirm()).rejects.toThrow();
    expect(f.outgoingCount()).toBe(0);
    const authorization = await prepared.authorize(callback);
    expect(authorization.redirectUrl).toBe("https://wallet.interledger-test.dev/consent/1");
    const request = f.grants[2] as { access_token: { access: unknown[] }; interact: { finish: { nonce: string } } };
    expect(request.access_token.access).toEqual([{ type: "outgoing-payment", actions: ["create", "read"], identifier: sender, limits: { debitAmount: amount, receiver: "https://ilp.interledger-test.dev/incoming/1" } }]);
    const hash = createHash("sha256").update([request.interact.finish.nonce, "server-nonce", "reference-1", authServer].join("\n")).digest("base64url");
    await expect(prepared.authorizeReturn("reference-1", "wrong")).rejects.toThrow();
    expect(f.outgoingCount()).toBe(0);
    await prepared.authorizeReturn("reference-1", hash);
    const payment = await prepared.confirm();
    expect(payment.estado).toBe("pendiente");
    expect(f.outgoingCount()).toBe(1);
    expect((await prepared.poll()).estado).toBe("completado");
    expect(f.outgoingComplete()).toBe(true);
    await expect(prepared.confirm()).rejects.toThrow();
    expect(f.outgoingCount()).toBe(1);
  });

  it("no crea cotizaciones ni pagos para montos que exceden el límite", async () => {
    const f = fixture();
    await expect(createOpenPaymentsRail(f.client, sender).prepare({ ...input, amount: 0.06 })).rejects.toThrow();
    expect(f.grants).toHaveLength(0);
    expect(f.outgoingCount()).toBe(0);
  });
});

it("la pasarela une sesión, cotización, retorno GNAP y pago sin aceptar finalización anticipada", async () => {
  const { createGateway } = await import("./gateway");
  const f = fixture();
  const rail = createOpenPaymentsRail(f.client, sender);
  const gateway = createGateway((input) => rail.prepare(input));
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", "http://127.0.0.1:3100");
  const key = await gateway.key();
  const cookie = key.headers.get("set-cookie")!.split(";")[0];
  const post = (payload: unknown) => gateway.charge(new Request("http://127.0.0.1:3100/api/pasarela/cobrar-claro", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:3100", Cookie: cookie }, body: JSON.stringify({ ...payload as object, requestId: crypto.randomUUID() }) }), false);
  const prepared = await (await post({ action: "cotizar", ...input })).json();
  expect(f.outgoingCount()).toBe(0);
  expect((await post({ action: "finalizar", confirmationToken: prepared.confirmationToken })).status).toBe(409);
  const auth = await (await post({ action: "confirmar", confirmationToken: prepared.confirmationToken })).json();
  expect(auth).toMatchObject({ paso: "autorizacion", redirectUrl: "https://wallet.interledger-test.dev/consent/1", reciboPqc: null });
  const request = f.grants[2] as { interact: { finish: { nonce: string; uri: string } } };
  const wrong = new URL(request.interact.finish.uri);
  wrong.searchParams.set("interact_ref", "reference-1"); wrong.searchParams.set("hash", "wrong");
  expect((await gateway.callback(new Request(wrong, { headers: { Cookie: cookie } }))).status).toBe(403);
  expect(f.outgoingCount()).toBe(0);
  // Rafiki usa digest('base64'); URLSearchParams preserva +, / y = al redirigir.
  const hash = createHash("sha256").update([request.interact.finish.nonce, "server-nonce", "reference-1", authServer].join("\n")).digest("base64");
  wrong.searchParams.set("hash", hash);
  expect((await gateway.callback(new Request(wrong))).status).toBe(401);
  const callback = await gateway.callback(new Request(wrong, { headers: { Cookie: cookie } }));
  expect(callback.status).toBe(303);
  expect(callback.headers.get("location")).toContain("/pago/pasarela?autorizacion=");
  expect(f.outgoingCount()).toBe(0);
  const sent = await post({ action: "finalizar", confirmationToken: prepared.confirmationToken });
  expect(await sent.json()).toMatchObject({ estado: "pendiente", reciboPqc: null });
  expect(f.outgoingCount()).toBe(1);
  expect((await post({ action: "finalizar", confirmationToken: prepared.confirmationToken })).status).toBe(409);
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60000);
  const done = await post({ action: "consultar", confirmationToken: prepared.confirmationToken });
  expect(await done.json()).toMatchObject({ estado: "completado", reciboPqc: null });
  expect(f.outgoingCount()).toBe(1);
});

it("el contrato iniciar/consultar conserva la autorización y guarda el recibo híbrido tras la entrega", async () => {
  const { createSdkAdapter, checkoutCookie } = await import("./sdkAdapter");
  const f = fixture("COP", "1500000");
  vi.stubEnv("OPEN_PAYMENTS_MAX_RECEIVE", "15000");
  vi.stubEnv("OPEN_PAYMENTS_MAX_DEBIT", "15000");
  const prepare = vi.fn((input, payerWallet?: string) => createOpenPaymentsRail(f.client, payerWallet ?? sender).prepare(input));
  const adapter = createSdkAdapter(prepare);
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", "http://127.0.0.1:3100");
  const output = await adapter.start({ tipo: "pedido", referenciaId: "pedido-1", montoCop: 15000, walletReceptor: input.receiver, walletPagador: sender, urlRetorno: "http://127.0.0.1:3100/pago/retorno" }, "sesion-checkout");
  expect(prepare).toHaveBeenCalledWith(expect.objectContaining({ amount: 15000, expectedReceiveAssetCode: "COP" }), sender);
  expect(output.estado).toBe("pendiente");
  expect(output.redirectUrl).toBe("https://wallet.interledger-test.dev/consent/1");
  expect(f.outgoingCount()).toBe(0);
  const grantRequest = f.grants[2] as { interact: { finish: { nonce: string; uri: string } } };
  const callback = new URL(grantRequest.interact.finish.uri);
  callback.searchParams.set("interact_ref", "ref-checkout");
  callback.searchParams.set("hash", createHash("sha256").update([grantRequest.interact.finish.nonce, "server-nonce", "ref-checkout", authServer].join("\n")).digest("base64url"));
  expect((await adapter.callback(new Request(callback))).status).toBe(403);
  const request = new Request(callback, { headers: { Cookie: `${checkoutCookie}=sesion-checkout` } });
  const response = await adapter.callback(request);
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain(`/pago/retorno?pago_id=${output.pagoId}`);
  expect(f.outgoingCount()).toBe(1);
  const result = await adapter.consultar(output.pagoId);
  expect(result.estado).toBe("completado");
  const { verifyReceipt } = await import("./pqc/hybridReceipt");
  const receipt = result.detalle.reciboPqc as import("./pqc/hybridReceipt").HybridReceipt;
  expect(verifyReceipt(receipt, receipt.publicKeys).valid).toBe(true);
  expect((await adapter.callback(request)).status).toBe(403);
  expect(f.outgoingCount()).toBe(1);
});


it("conserva el pago pendiente si falla la observación después de crear outgoing y luego lo recupera", async () => {
  const f = fixture();
  const incomingGet = f.client.incomingPayment.get;
  f.client.incomingPayment.get = async () => { throw new Error("Interrupción de red al observar la recepción"); };
  const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
  await prepared.authorize(callback);
  const request = f.grants[2] as { interact: { finish: { nonce: string } } };
  await prepared.authorizeReturn("ref-recovery", createHash("sha256").update([request.interact.finish.nonce, "server-nonce", "ref-recovery", authServer].join("\n")).digest("base64url"));
  expect(await prepared.confirm()).toMatchObject({ estado: "pendiente", outgoingId: "https://ilp.interledger-test.dev/outgoing/1" });
  expect(f.outgoingCount()).toBe(1);
  f.client.incomingPayment.get = incomingGet;
  expect((await prepared.poll()).estado).toBe("completado");
  expect(f.outgoingCount()).toBe(1);
});

it("separa el importe receptor del tope de débito y nunca amplía el límite automáticamente", async () => {
  const f = fixture();
  f.client.quote.create = async () => mockQuote({ id: "https://ilp.interledger-test.dev/quotes/fees", walletAddress: sender, debitAmount: { ...amount, value: "105" }, receiveAmount: amount });
  vi.stubEnv("OPEN_PAYMENTS_MAX_DEBIT", "0.05");
  await expect(createOpenPaymentsRail(f.client, sender).prepare(input)).rejects.toThrow(/débito/);
  vi.stubEnv("OPEN_PAYMENTS_MAX_DEBIT", "1.05");
  const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
  expect(prepared.quote).toMatchObject({ debitAmount: { value: "105", assetCode: "EUR", assetScale: 2 }, receiveAmount: { value: "5", assetCode: "EUR", assetScale: 2 } });
  expect(f.outgoingCount()).toBe(0);
});

it("rechaza permisos salientes sin interacción y no crea el pago", async () => {
  const f = fixture();
  const request = f.client.grant.request;
  f.client.grant.request = (async (params: unknown, body: Record<string, unknown>) => body.interact ? mockGrant() : request(params as never, body as never)) as typeof request;
  const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
  await expect(prepared.authorize(callback)).rejects.toThrow(/consentimiento interactivo/);
  await expect(prepared.confirm()).rejects.toThrow();
  expect(f.outgoingCount()).toBe(0);
});

it("vuelve a comprobar el interruptor justo antes del envío autorizado", async () => {
  const f = fixture();
  const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
  await prepared.authorize(callback);
  const request = f.grants[2] as { interact: { finish: { nonce: string } } };
  await prepared.authorizeReturn("ref-disabled", createHash("sha256").update([request.interact.finish.nonce, "server-nonce", "ref-disabled", authServer].join("\n")).digest("base64url"));
  vi.stubEnv("PAYMENTS_EXECUTION_ENABLED", "false");
  await expect(prepared.confirm()).rejects.toThrow(/deshabilitada/);
  expect(f.client.grant.continue).not.toHaveBeenCalled();
  expect(f.outgoingCount()).toBe(0);
});

it("el recorrido SDK con PQC conserva consentimiento y verifica el recibo tras confirmar recepción", async () => {
  const { createGateway } = await import("./gateway");
  const { conectarCanal, cotizarCobro, confirmarCobro } = await import("./gatewayClient");
  const f = fixture();
  const gateway = createGateway((charge) => createOpenPaymentsRail(f.client, sender).prepare(charge));
  const origin = "http://127.0.0.1:3100";
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", origin);
  let cookie = "";
  vi.stubGlobal("fetch", async (path: string, init: RequestInit = {}) => {
    expect(path.startsWith("/api/pasarela/")).toBe(true);
    const request = new Request(origin + path, { ...init, headers: { ...init.headers, Origin: origin, Cookie: cookie } });
    if (path === "/api/pasarela/key") {
      const response = await gateway.key(request);
      cookie = response.headers.get("set-cookie")!.split(";")[0];
      return response;
    }
    if (path === "/api/pasarela/echo") return gateway.echo(request);
    return gateway.charge(request, path === "/api/pasarela/cobrar");
  });
  const bundle = await conectarCanal();
  const prepared = await cotizarCobro(input, "protegido", bundle);
  expect(prepared.cotizacionVerificada).toBe(true);
  expect(f.outgoingCount()).toBe(0);
  const authorization = await confirmarCobro(prepared, "protegido", bundle);
  expect(authorization.redirectUrl).toContain("/consent/");
  expect(f.outgoingCount()).toBe(0);
  const grant = f.grants[2] as { interact: { finish: { nonce: string; uri: string } } };
  const redirect = new URL(grant.interact.finish.uri);
  redirect.searchParams.set("interact_ref", "ref-pqc");
  redirect.searchParams.set("hash", createHash("sha256").update([grant.interact.finish.nonce, "server-nonce", "ref-pqc", authServer].join("\n")).digest("base64url"));
  expect((await gateway.callback(new Request(redirect, { headers: { Cookie: cookie } }))).status).toBe(303);
  expect(f.outgoingCount()).toBe(0);
  expect(await confirmarCobro(prepared, "protegido", bundle, "finalizar")).toMatchObject({ estado: "pendiente", reciboPqc: null });
  expect(f.outgoingCount()).toBe(1);
  expect(await confirmarCobro(prepared, "protegido", bundle, "consultar")).toMatchObject({ estado: "completado", reciboVerificado: true, evidencia: "envio-y-recepcion-sdk" });
  expect(f.outgoingCount()).toBe(1);
});


it("no recorta silenciosamente el monto del checkout para adaptarlo al tope de demo", async () => {
  const { createSdkAdapter } = await import("./sdkAdapter");
  vi.stubEnv("OPEN_PAYMENTS_MAX_RECEIVE", "0.05");
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", "http://127.0.0.1:3100");
  const prepare = vi.fn();
  const adapter = createSdkAdapter(prepare);
  await expect(adapter.start({ tipo: "pedido", referenciaId: "pedido-limitado", montoCop: 15000, walletReceptor: input.receiver, walletPagador: sender, urlRetorno: "http://127.0.0.1:3100/pago/retorno" }, "sesion")).rejects.toThrow(/límite/);
  expect(prepare).not.toHaveBeenCalled();
});

it("un pedido en COP no se interpreta como un importe EUR", async () => {
  const f = fixture();
  await expect(createOpenPaymentsRail(f.client, sender).prepare({ ...input, expectedReceiveAssetCode: "COP" })).rejects.toThrow(/moneda/);
  expect(f.grants).toHaveLength(0);
  expect(f.outgoingCount()).toBe(0);
});

it("un pago perdido de memoria conserva estado incierto para impedir que el checkout lo dé por fallido", async () => {
  const { createSdkAdapter } = await import("./sdkAdapter");
  expect(await createSdkAdapter().consultar("op_anterior_al_reinicio")).toMatchObject({ estado: "pendiente", detalle: { resultadoIncierto: true } });
});

it("el importe enviado puede excluir comisiones sin impedir comprobar la recepción completa", async () => {
  const f = fixture();
  vi.stubEnv("OPEN_PAYMENTS_MAX_DEBIT", "1.05");
  const debit = { ...amount, value: "105" };
  f.client.quote.create = async () => mockQuote({ id: "https://ilp.interledger-test.dev/quotes/with-fees", walletAddress: sender, debitAmount: debit, receiveAmount: amount });
  f.client.outgoingPayment.create = async () => mockOutgoingPayment({ id: "https://ilp.interledger-test.dev/outgoing/with-fees", walletAddress: sender, debitAmount: debit, receiveAmount: amount, sentAmount: amount, failed: false });
  const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
  await prepared.authorize(callback);
  const request = f.grants[2] as { interact: { finish: { nonce: string } } };
  await prepared.authorizeReturn("ref-fees", createHash("sha256").update([request.interact.finish.nonce, "server-nonce", "ref-fees", authServer].join("\n")).digest("base64url"));
  expect(await prepared.confirm()).toMatchObject({ estado: "completado", debitAmount: debit, receiveAmount: amount, evidencia: "envio-y-recepcion-sdk" });
});

it.each([
  { stage: 'incoming', received: { ...amount, value: '4' } },
  { stage: 'quote', received: { ...amount, value: '4' } },
  { stage: 'quote', received: { ...amount, assetCode: 'USD' } },
  { stage: 'quote', received: { ...amount, assetScale: 3 } },
])('rechaza un monto de vendedor alterado en $stage: $received', async ({ stage, received }) => {
  const f = fixture();
  if (stage === 'incoming') f.client.incomingPayment.create = async () => ({ ...mockIncomingPayment({ id: "https://ilp.interledger-test.dev/incoming/1", incomingAmount: received }), methods: [] });
  else f.client.quote.create = async () => mockQuote({ id: "https://ilp.interledger-test.dev/quotes/1", debitAmount: amount, receiveAmount: received });
  await expect(createOpenPaymentsRail(f.client, sender).prepare(input)).rejects.toThrow(/importe.*vendedor/);
  expect(f.grants.filter((grant) => grant.interact)).toHaveLength(0);
  expect(f.outgoingCount()).toBe(0);
});

it('no confirma una entrega con un receiveAmount diferente al autorizado', async () => {
  const f = fixture();
  f.client.outgoingPayment.create = async () => mockOutgoingPayment({ id: 'https://ilp.interledger-test.dev/outgoing/1', debitAmount: amount, receiveAmount: { ...amount, value: '4' }, sentAmount: amount, failed: false });
  const prepared = await createOpenPaymentsRail(f.client, sender).prepare(input);
  await prepared.authorize(callback);
  const request = f.grants[2] as { interact: { finish: { nonce: string } } };
  await prepared.authorizeReturn('ref-mismatch', createHash('sha256').update([request.interact.finish.nonce, 'server-nonce', 'ref-mismatch', authServer].join('\n')).digest('base64'));
  await expect(prepared.confirm()).rejects.toThrow(/importe.*vendedor/);
});

it('rechaza una wallet de comprador inválida antes de solicitar autorización', async () => {
  const { createSdkAdapter } = await import('./sdkAdapter');
  vi.stubEnv('OPEN_PAYMENTS_MAX_RECEIVE', '15000');
  vi.stubEnv('OPEN_PAYMENTS_REDIRECT_ORIGIN', 'http://127.0.0.1:3100');
  const prepare = vi.fn();
  await expect(createSdkAdapter(prepare).start({ tipo: 'pedido', referenciaId: '1', montoCop: 15000, walletReceptor: receiver, walletPagador: 'https://evil.example/buyer', urlRetorno: 'http://127.0.0.1:3100/pago/retorno' }, 'session')).rejects.toThrow(/testnet/);
  expect(prepare).not.toHaveBeenCalled();
});
