import { afterEach, expect, it, vi } from "vitest";
import { createGateway } from "./gateway";
import { conectarCanal, cotizarCobro, confirmarCobro } from "./gatewayClient";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("el cliente solo usa rutas propias y exige cotización antes de confirmar y verificar el recibo", async () => {
  vi.stubEnv("USE_MOCKS", "true");
  const gateway = createGateway();
  const seen: string[] = [];
  let cookie = "";
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    seen.push(url);
    const request = new Request(`http://127.0.0.1:3100${url}`, { ...init, headers: { ...init.headers, Cookie: cookie } });
    if (url === "/api/pasarela/key") {
      const response = await gateway.key(request);
      cookie = response.headers.get("set-cookie")!.split(";")[0];
      return response;
    }
    if (url === "/api/pasarela/echo") return gateway.echo(request);
    return gateway.charge(request, url === "/api/pasarela/cobrar");
  });
  const bundle = await conectarCanal();
  const input = { amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Café" };
  const prepared = await cotizarCobro(input, "protegido", bundle);
  expect(prepared).toMatchObject({ estado: "pendiente", paso: "cotizacion", reciboPqc: null, cotizacionVerificada: true });
  expect(await confirmarCobro(prepared, "protegido", bundle)).toMatchObject({ estado: "completado", reciboVerificado: true, simulado: true });
  const clear = await cotizarCobro(input, "claro", null);
  expect(await confirmarCobro(clear, "claro", null)).toMatchObject({ estado: "completado", reciboPqc: null, reciboVerificado: false });
  expect(seen).toEqual(["/api/pasarela/key", "/api/pasarela/echo", "/api/pasarela/cobrar", "/api/pasarela/cobrar", "/api/pasarela/cobrar-claro", "/api/pasarela/cobrar-claro"]);
});

it("un modo protegido sin canal no envía ninguna solicitud", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(cotizarCobro({ amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Café" }, "protegido", null)).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});

it("abre un 409 cifrado y conserva su código de recuperación sin ejecutar el pago", async () => {
  vi.stubEnv("USE_MOCKS", "true");
  let gateway = createGateway();
  let cookie = "";
  const statuses: number[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const request = new Request(`http://127.0.0.1:3100${url}`, { ...init, headers: { ...init.headers, Cookie: cookie } });
    if (url === "/api/pasarela/key") {
      const response = await gateway.key(request);
      cookie = response.headers.get("set-cookie")!.split(";")[0];
      return response;
    }
    if (url === "/api/pasarela/echo") return gateway.echo(request);
    const response = await gateway.charge(request, true);
    statuses.push(response.status);
    if (response.status === 409) expect(await response.clone().json()).toHaveProperty("ciphertext");
    return response;
  });
  const bundle = await conectarCanal();
  const prepared = await cotizarCobro({ amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Prueba sin fondos" }, "protegido", bundle);
  // Simula pérdida del seguimiento del proceso; el canal sigue siendo el mismo runtime.
  gateway = createGateway();
  const refreshed = await conectarCanal();
  await expect(confirmarCobro(prepared, "protegido", refreshed, "consultar")).rejects.toMatchObject({ status: 409, code: "CONFIRMATION_UNAVAILABLE" });
  expect(statuses).toEqual([202, 409]);
});
