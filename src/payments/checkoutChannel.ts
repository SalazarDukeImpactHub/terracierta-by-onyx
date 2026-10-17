import "server-only";
import { getPqcRuntime } from "./pqc/server";
import { paymentOrigin } from "./openPayments";
import { PaymentError } from "./settlement";
import { withProtectedCheckout } from "./checkoutContext";

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });

/** Canal comercial: no depende del interruptor de la demo pública ni autentica usuarios. */
export function createCheckoutChannel() {
  const { channel } = getPqcRuntime();
  const used = new Map<string, number>();
  const windows = new Map<string, { at: number; count: number }>();
  function limit(kind: string, max: number) {
    const now = Date.now();
    for (const [id, value] of windows) if (now - value.at > 60000) windows.delete(id);
    let window = windows.get(kind);
    if (!window || now - window.at > 60000) { window = { at: now, count: 0 }; windows.set(kind, window); }
    if (++window.count > max) throw new PaymentError("Demasiados intentos. Espera un minuto antes de consultar de nuevo.", 429);
  }
  return {
    limitUser(id: string, operation: "start" | "status") { limit(`${operation}:${id}`, operation === "start" ? 20 : 120); },
    key(_request: Request, principal: string) {
      try { limit(`key:${principal}`, 120); return json(channel.publicBundle()); }
      catch { return json({ error: "Demasiadas solicitudes de llave." }, 429); }
    },
    async handle(request: Request, path: string, action: (payload: unknown) => Promise<Response>) {
      let reply: ((payload: unknown) => Promise<unknown>) | undefined;
      try {
        if (request.method !== "POST") throw new PaymentError("Este endpoint requiere POST cifrado.", 405);
        if (request.headers.get("origin") !== paymentOrigin() || request.headers.get("sec-fetch-site") === "cross-site" || new URL(request.url).pathname !== path) throw new PaymentError("Origen no permitido.", 403);
        if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new PaymentError("Se esperaba un sobre JSON cifrado.", 415);
        if (!request.body || Number(request.headers.get("content-length")) > 32768) throw new PaymentError("Sobre vacío o demasiado grande.", 413);
        const reader = request.body.getReader();
        let raw = ""; let length = 0;
        const decoder = new TextDecoder("utf-8", { fatal: true });
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            length += value.length;
            if (length > 32768) { await reader.cancel(); throw new PaymentError("Sobre demasiado grande.", 413); }
            raw += decoder.decode(value, { stream: true });
          }
          raw += decoder.decode();
        } finally { reader.releaseLock(); }
        let opened;
        let envelope;
        try { envelope = JSON.parse(raw); opened = await channel.decrypt(envelope, path); }
        catch { throw new PaymentError("El canal cifrado es inválido o venció. Actualiza la página; si ya pagaste, revisa tu wallet antes de repetir.", 400); }
        reply = opened.encryptReply;
        for (const [id, expires] of used) if (expires < Date.now()) used.delete(id);
        if (used.has(opened.requestId)) throw new PaymentError("Esta solicitud ya fue recibida. No repitas el pago; consulta su estado.", 409);
        if (used.size >= 50000) throw new PaymentError("El canal alcanzó su límite de solicitudes.", 429);
        // El sobre admite +/- cinco minutos: conservar hasta que ese mismo
        // timestamp deje de ser aceptable, no durante un día entero de polling.
        used.set(opened.requestId, envelope.issuedAt + 5 * 60000);
        const response = await withProtectedCheckout(() => action(opened.payload));
        const data = await response.json();
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "no-store"); headers.set("X-Content-Type-Options", "nosniff");
        return new Response(JSON.stringify(await reply(data)), { status: response.status, headers });
      } catch (error) {
        const known = error instanceof PaymentError;
        const status = known ? error.status : 502;
        const body = { error: known ? error.message : "No se pudo confirmar la operación. Consulta tu pago antes de volver a enviarlo." };
        return json(reply ? await reply(body) : body, status);
      }
    },
  };
}
const shared = globalThis as typeof globalThis & { terraCiertaCheckoutChannel?: ReturnType<typeof createCheckoutChannel> };
export const getCheckoutChannel = () => shared.terraCiertaCheckoutChannel ??= createCheckoutChannel();
