import { afterEach, expect, it, vi } from "vitest";
import { createGateway } from "./gateway";
import { comprobarPqc } from "./pqcProof";

afterEach(() => vi.unstubAllEnvs());

it("comprueba cifrado y firmas con los handlers reales sin preparar un pago", async () => {
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", "http://127.0.0.1:3100");
  const prepare = vi.fn(async () => { throw new Error("Esta prueba no debe operar pagos"); });
  const gateway = createGateway(prepare);
  const paths: string[] = [];
  const fetcher = async (path: string, init: RequestInit = {}) => {
    paths.push(path);
    const request = new Request(`http://127.0.0.1:3100${path}`, { ...init, headers: { ...init.headers, Origin: "http://127.0.0.1:3100" } });
    if (path === "/api/pasarela/key") return gateway.key(request);
    if (path === "/api/pasarela/echo") return gateway.echo(request);
    throw new Error("Ruta financiera inesperada");
  };
  const result = await comprobarPqc(fetcher);
  expect(result).toMatchObject({ cifradoVerificado: true, alteracionRechazada: true, firmaClasica: true, firmaPqc: true, firmaAlteradaRechazada: true });
  expect(result.bytesCifrados).toBeGreaterThan(16);
  expect(paths).toEqual(["/api/pasarela/key", "/api/pasarela/echo", "/api/pasarela/echo"]);
  expect(prepare).not.toHaveBeenCalled();
});

it("no presenta un bloqueo por disponibilidad como protección contra alteraciones", async () => {
  vi.stubEnv("OPEN_PAYMENTS_REDIRECT_ORIGIN", "http://127.0.0.1:3100");
  const gateway = createGateway();
  let echoCalls = 0;
  await expect(comprobarPqc(async (path, init = {}) => {
    const request = new Request(`http://127.0.0.1:3100${path}`, init);
    if (path.endsWith("/key")) return gateway.key(request);
    if (++echoCalls === 2) return Response.json({ error: "Sin servicio" }, { status: 503 });
    return gateway.echo(request);
  })).rejects.toThrow(/comprobar el rechazo/);
});
