import { expect, it } from "vitest";
import { clientSeal, clientOpen } from "./pqc/channel";
import { comprobarPqc } from "./pqcProof";

// Prueba optativa contra Next local: únicamente key/echo; nunca crea cotizaciones ni mueve fondos.
it.skipIf(!process.env.LOCAL_PASARELA_ORIGIN)("el canal funciona entre handlers reales de Next", async () => {
  const origin = process.env.LOCAL_PASARELA_ORIGIN!;
  const keyResponse = await fetch(`${origin}/api/pasarela/key`);
  expect(keyResponse.status).toBe(200);
  const bundle = await keyResponse.json();
  const sealed = await clientSeal(bundle, { cafe: "Marsella" }, "/api/pasarela/echo");
  const response = await fetch(`${origin}/api/pasarela/echo`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(sealed.envelope) });
  const body = await response.json();
  expect({ status: response.status, error: body.error }).toEqual({ status: 200, error: undefined });
  expect(await clientOpen(sealed, body)).toEqual({ ok: true, echo: { cafe: "Marsella" } });
});

it.skipIf(!process.env.LOCAL_PASARELA_ORIGIN)("la prueba que se intercepta con Burp acepta el original y rechaza su copia alterada en Next", async () => {
  const origin = process.env.LOCAL_PASARELA_ORIGIN!;
  const codes: number[] = [];
  const result = await comprobarPqc(async (path, init = {}) => {
    expect(["/api/pasarela/key", "/api/pasarela/echo"]).toContain(path);
    const response = await fetch(`${origin}${path}`, { ...init, headers: { ...init.headers, Origin: origin } });
    codes.push(response.status);
    return response;
  });
  expect(codes).toEqual([200, 200, 400]);
  expect(result).toMatchObject({ cifradoVerificado: true, alteracionRechazada: true, firmaClasica: true, firmaPqc: true });
});
