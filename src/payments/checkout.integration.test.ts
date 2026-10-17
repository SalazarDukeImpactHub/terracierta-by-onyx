import { afterEach, describe, expect, it, vi } from "vitest";
import { createCheckoutChannel } from "./checkoutChannel";
import { createCheckoutHandlers } from "./checkoutHandlers";
import { createCheckoutClient } from "./checkoutClient";
import { createHybridSigner } from "./pqc/hybridReceipt";
import { clientOpen, clientSeal } from "./pqc/channel";
import { hasProtectedCheckout } from "./checkoutContext";
import type { Perfil } from "@/adapters/types";

const origin = "http://127.0.0.1:3100";
const productoId = "bbbbbbbb-0001-4000-8000-000000000001";
const profile = { id: "buyer", rol: "comprador" as const, wallet_address: "https://ilp.interledger-test.dev/buyer", nombre: "Comprador", municipio: "Marsella", tiene_invima: false };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function fixture() {
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", origin);
  const channel = createCheckoutChannel();
  let perfil: Perfil | null = profile;
  const iniciarPedido = vi.fn(async () => {
    expect(hasProtectedCheckout()).toBe(true);
    return { ok: true as const, pagoId: "op_checkout_123", redirectUrl: "https://wallet.interledger-test.dev/consent" };
  });
  const consultar = vi.fn(async () => ({ pagoId: "op_checkout_123", tipo: "pedido" as const, estado: "pendiente" as const, monto: 15000, walletReceptor: "https://ilp.interledger-test.dev/seller", concepto: "Café", detalle: {} }));
  const iniciarOferta = vi.fn(async () => ({ ok: true as const, pagoId: "op_checkout_123", redirectUrl: "https://wallet.interledger-test.dev/consent" }));
  const handlers = createCheckoutHandlers({ perfil: async () => perfil, iniciarPedido, iniciarOferta, consultar }, channel);
  const requests: { path: string; body: string }[] = [];
  const fetcher = async (url: string | URL | Request, init: RequestInit = {}) => {
    const path = String(url);
    requests.push({ path, body: String(init.body ?? "") });
    const req = new Request(origin + path, { ...init, headers: { ...init.headers, Origin: origin } });
    if (path === "/api/pagos/key") return handlers.key(req);
    if (path === "/api/pagos/iniciar") return handlers.iniciar(req);
    if (path === "/api/pagos/oferta") return handlers.oferta(req);
    return handlers.estado(req, path.split("/").at(-1)!);
  };
  return { channel, handlers, iniciarPedido, iniciarOferta, consultar, requests, client: createCheckoutClient(fetcher as typeof fetch), logout: () => { perfil = null; }, as: (rol: Perfil["rol"]) => { perfil = { ...profile, id: crypto.randomUUID(), rol }; } };
}

describe("checkout comercial con canal PQC obligatorio", () => {
  it("cifra ida y vuelta antes de llamar al servicio con perfil validado", async () => {
    const f = fixture();
    expect(await f.client.iniciarPedido({ productoId, cantidad: 2 })).toMatchObject({ pagoId: "op_checkout_123" });
    expect(f.iniciarPedido).toHaveBeenCalledWith({ productoId, cantidad: 2 }, profile);
    expect(f.requests.find((r) => r.path.endsWith("iniciar"))!.body).not.toContain(productoId);
    expect(hasProtectedCheckout()).toBe(false);
  });
  it("anuncia autorización solo después de verificar la respuesta del inicio", async () => {
    const f = fixture();
    const events: string[] = [];
    f.iniciarPedido.mockImplementationOnce(async () => {
      expect(events).toEqual(["canal-verificado", "solicitud-cifrada"]);
      return { ok: true, pagoId: "op_checkout_123", redirectUrl: "https://wallet.interledger-test.dev/consent" };
    });
    await f.client.iniciarPedido({ productoId, cantidad: 1 }, (event) => events.push(event));
    expect(events).toEqual(["canal-verificado", "solicitud-cifrada", "respuesta-verificada", "autorizacion"]);
    expect(events).not.toContain("completado");
  });
  it("no anuncia autorización cuando falla la sesión", async () => {
    const f = fixture(); f.logout();
    const events: string[] = [];
    await expect(f.client.iniciarPedido({ productoId, cantidad: 1 }, (event) => events.push(event))).rejects.toMatchObject({ status: 401 });
    expect(events).not.toContain("autorizacion");
  });
  it("no permite iniciar por JSON claro ni acepta un canalPqc inventado", async () => {
    const f = fixture();
    const response = await f.handlers.iniciar(new Request(origin + "/api/pagos/iniciar", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ productoId, cantidad: 1, canalPqc: true }) }));
    expect(response.status).toBe(400);
    expect(f.iniciarPedido).not.toHaveBeenCalled();
  });
  it("cifra el error de sesión vencida y no ejecuta el servicio", async () => {
    const f = fixture(); f.logout();
    await expect(f.client.iniciarPedido({ productoId, cantidad: 1 })).rejects.toMatchObject({ status: 401 });
    expect(f.iniciarPedido).not.toHaveBeenCalled();
  });
  it("rechaza replay y cambios de ruta antes de ejecutar", async () => {
    const f = fixture();
    const bundle = await (await f.handlers.key(new Request(origin + "/api/pagos/key"))).json();
    const sealed = await clientSeal(bundle, { productoId, cantidad: 1 }, "/api/pagos/iniciar");
    const request = (path: string) => new Request(origin + path, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(sealed.envelope) });
    expect((await f.handlers.estado(request("/api/pagos/op_checkout_123"), "op_checkout_123")).status).toBe(400);
    expect((await f.handlers.iniciar(request("/api/pagos/iniciar"))).status).toBe(200);
    const repeated = await f.handlers.iniciar(request("/api/pagos/iniciar"));
    expect(repeated.status).toBe(409);
    expect(await clientOpen(sealed, await repeated.json())).toMatchObject({ error: expect.any(String) });
    expect(f.iniciarPedido).toHaveBeenCalledTimes(1);
  });
  it("consulta por POST cifrado y pasa la wallet autorizada del perfil", async () => {
    const f = fixture();
    expect(await f.client.consultar("op_checkout_123")).toMatchObject({ estado: "pendiente", canalVerificado: true });
    expect(f.consultar).toHaveBeenCalledWith("op_checkout_123", profile.wallet_address);
  });
  it("no acepta éxito real sin un comprobante híbrido válido", async () => {
    const f = fixture();
    f.consultar.mockResolvedValue({ pagoId: "op_checkout_123", tipo: "pedido", estado: "completado", monto: 15000, walletReceptor: "https://ilp.interledger-test.dev/seller", concepto: "Café", detalle: {} } as never);
    await expect(f.client.consultar("op_checkout_123")).rejects.toThrow(/comprobante/);
  });
  it("no acepta un comprobante autofirmado con otra identidad", async () => {
    const f = fixture();
    const receipt = createHybridSigner().sign({ pagoId: "op_checkout_123", estado: "completado", amount: 15000, receiver: "https://ilp.interledger-test.dev/seller" });
    f.consultar.mockResolvedValue({ pagoId: "op_checkout_123", tipo: "pedido", estado: "completado", monto: 15000, walletReceptor: "https://ilp.interledger-test.dev/seller", concepto: "Café", detalle: { reciboPqc: receipt } } as never);
    await expect(f.client.consultar("op_checkout_123")).rejects.toThrow(/comprobante/);
  });
});

it("la cooperativa inicia su oferta protegida y no puede usar el inicio de comprador", async () => {
  const f = fixture(); f.as("cooperativa");
  await expect(f.client.iniciarOferta(productoId)).resolves.toMatchObject({ canalPqc: true });
  expect(f.iniciarOferta).toHaveBeenCalledWith(productoId, expect.any(String));
  await expect(f.client.iniciarPedido({ productoId, cantidad: 1 })).rejects.toMatchObject({ status: 403 });
  expect(f.iniciarPedido).not.toHaveBeenCalled();
});
it("el caficultor consulta pero no puede iniciar pagos ajenos a su rol", async () => {
  const f = fixture(); f.as("caficultor");
  await expect(f.client.consultar("op_checkout_123")).resolves.toMatchObject({ canalVerificado: true });
  await expect(f.client.iniciarPedido({ productoId, cantidad: 1 })).rejects.toMatchObject({ status: 403 });
  await expect(f.client.iniciarOferta(productoId)).rejects.toMatchObject({ status: 403 });
  expect(f.iniciarPedido).not.toHaveBeenCalled();
  expect(f.iniciarOferta).not.toHaveBeenCalled();
});

it("reutiliza la llave verificada al consultar varias veces el mismo pago", async () => {
  const f = fixture();
  for (let i = 0; i < 4; i++) await f.client.consultar("op_checkout_123");
  expect(f.requests.filter((r) => r.path.endsWith("/key"))).toHaveLength(1);
});
it("las cuotas de un comprador no bloquean a otro y las llaves requieren sesión", async () => {
  const f = fixture();
  for (let i = 0; i < 120; i++) expect((await f.handlers.key(new Request(origin + "/api/pagos/key"))).status).toBe(200);
  expect((await f.handlers.key(new Request(origin + "/api/pagos/key"))).status).toBe(429);
  expect(f.channel.key(new Request(origin + "/api/pagos/key"), "otro-comprador").status).toBe(200);
  f.logout();
  expect((await f.handlers.key(new Request(origin + "/api/pagos/key"))).status).toBe(401);
});
it("no permite inyectar importes ni wallets dentro de una solicitud cifrada válida", async () => {
  const f = fixture();
  const bundle = await (await f.handlers.key(new Request(origin + "/api/pagos/key"))).json();
  const sealed = await clientSeal(bundle, { productoId, cantidad: 1, montoCop: 1, walletReceptor: "attacker" }, "/api/pagos/iniciar");
  const response = await f.handlers.iniciar(new Request(origin + "/api/pagos/iniciar", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(sealed.envelope) }));
  expect(response.status).toBe(400);
  expect(await clientOpen(sealed, await response.json())).toHaveProperty("error");
  expect(f.iniciarPedido).not.toHaveBeenCalled();
});
it("el estado por GET ya no expone datos de pago", async () => {
  const { GET } = await import("@/app/api/pagos/[id]/route");
  expect(GET().status).toBe(405);
});

it.each(["monto", "destinatario", "procedencia"])("rechaza un recibo válido si se altera %s fuera de la firma", async (field) => {
  const { getPqcRuntime } = await import("./pqc/server");
  const f = fixture();
  const payload = { pagoId: "op_checkout_123", estado: "completado", amount: 15000, receiver: "https://ilp.interledger-test.dev/seller", canalPqc: true };
  const receipt = getPqcRuntime().signer.sign(payload);
  f.consultar.mockResolvedValue({ pagoId: payload.pagoId, tipo: "pedido", estado: "completado", monto: field === "monto" ? 1 : payload.amount, walletReceptor: field === "destinatario" ? "attacker" : payload.receiver, concepto: "Café", detalle: { canalPqc: field !== "procedencia", reciboPqc: receipt } } as never);
  await expect(f.client.consultar(payload.pagoId)).rejects.toThrow(/comprobante/);
});
