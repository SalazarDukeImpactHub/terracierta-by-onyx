import { expect, it } from "vitest";
import { clientSeal, clientOpen } from "./pqc/channel";

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
