import "server-only";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { getPqcRuntime } from "./pqc/server";
import { limiteCobro, prepararSimulacion, assertOfficialRail, assertExecutionEnabled, PaymentError, type ChargeInput, type Settlement } from "./settlement";
import { prepararOpenPayment, paymentOrigin } from "./openPayments";
import type { HybridReceipt } from "./pqc/hybridReceipt";

const chargeSchema = z.strictObject({
  amount: z.number().positive(),
  receiver: z.string().trim().regex(/^\$ilp\.interledger-test\.dev\/[A-Za-z0-9_-]{1,120}$/),
  description: z.string().trim().min(1).max(120),
});
const confirmationSchema = z.strictObject({ action: z.enum(["confirmar", "finalizar", "consultar"]), confirmationToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
const commandSchema = z.union([chargeSchema.extend({ action: z.literal("cotizar") }), confirmationSchema]);

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

function assertAvailable() {
  if (process.env.NODE_ENV === "production" && process.env.PASARELA_DEMO_ENABLED !== "true") throw new PaymentError("La pasarela de demostración no está habilitada en este despliegue.", 503);
}

function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== paymentOrigin()) || request.headers.get("sec-fetch-site") === "cross-site") throw new PaymentError("Origen no permitido.", 403);
}

async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new PaymentError("Envía un cuerpo JSON.", 415);
  if (!request.body || Number(request.headers.get("content-length")) > 32768) throw new PaymentError("La solicitud está vacía o es demasiado grande.", 413);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 32768) { await reader.cancel(); throw new PaymentError("La solicitud es demasiado grande.", 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new PaymentError("El JSON no es válido.", 400); }
  } finally { reader.releaseLock(); }
}

function publicError(error: unknown) {
  return error instanceof PaymentError ? error : new PaymentError("No se pudo procesar la solicitud. Revisa la wallet antes de repetir un pago.", 502);
}


export type PreparedCharge = {
  quote: Settlement;
  expiresAt?: string;
  clear(): void;
  confirm(): Promise<Settlement>;
  poll?(): Promise<Settlement>;
  authorize?(callback: string): Promise<{ redirectUrl: string }>;
  authorizeReturn?(interactRef: string, hash: string): Promise<void>;
};

async function prepare(input: ChargeInput): Promise<PreparedCharge> {
  assertOfficialRail();
  if (process.env.USE_MOCKS === "true") return prepararSimulacion(input);
  return prepararOpenPayment(input);
}

type PendingCharge = {
  session: string;
  protectedMode: boolean;
  input: ChargeInput;
  prepared: PreparedCharge;
  expiresAt: number;
  flowId: string;
  phase: "quoted" | "awaiting" | "authorized" | "sending" | "sent" | "uncertain";
  result?: Settlement;
};
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const randomToken = () => randomBytes(32).toString("base64url");
const sessionCookieName = "tc_pasarela";

/** Estado acotado a un proceso para la demo; el riel sigue siendo responsable de su autorización. */
export function createGateway(prepareCharge: (input: ChargeInput) => Promise<PreparedCharge> = prepare) {
  const { signer, channel } = getPqcRuntime();
  const seen = new Map<string, number>();
  const sessions = new Map<string, number>();
  const pending = new Map<string, PendingCharge>();
  const flows = new Map<string, string>();
  const windows = new Map<string, { start: number; count: number }>();
  function prune() {
    const now = Date.now();
    for (const [id, until] of seen) if (until < now) seen.delete(id);
    for (const [id, until] of sessions) if (until < now) sessions.delete(id);
    for (const [id, charge] of pending) if (charge.expiresAt < now) { charge.prepared.clear(); pending.delete(id); flows.delete(charge.flowId); }
  }
  function limit(kind: string, max: number) {
    const now = Date.now();
    let window = windows.get(kind);
    if (!window || now - window.start >= 60000) { window = { start: now, count: 0 }; windows.set(kind, window); }
    if (++window.count > max) throw new PaymentError("Se alcanzó el límite de intentos. Espera un minuto.", 429);
  }
  function cookie(request?: Request) {
    return request?.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1) ?? "";
  }
  function requireSession(request: Request) {
    const value = cookie(request);
    const id = digest(value);
    if (!value || !sessions.has(id)) throw new PaymentError("La sesión de la pasarela venció. Comprueba el canal de nuevo.", 401);
    return id;
  }
  function claim(requestId: string) {
    if (seen.has(requestId)) throw new PaymentError("Esta solicitud ya se procesó. Revisa la wallet antes de volver a pagar.", 409);
    if (seen.size >= 10000) throw new PaymentError("La demo alcanzó su límite de solicitudes.", 429);
    seen.set(requestId, Date.now() + 24 * 60 * 60000);
  }
  function find(token: string, session: string, protectedMode: boolean) {
    const record = pending.get(digest(token));
    if (!record || record.session !== session || record.protectedMode !== protectedMode || record.expiresAt <= Date.now()) throw new PaymentError("La confirmación no es válida para esta sesión, modo o cotización, o ya venció.", 409);
    return record;
  }
  function signedResult(record: PendingCharge, result: Settlement, requestId: string) {
    const payload = { ...result, requestId, receiver: record.input.receiver, amount: record.input.amount, description: record.input.description, issuedAt: new Date().toISOString(), paso: result.estado === "completado" ? "liquidacion" : "ejecucion" };
    const reciboPqc: HybridReceipt | null = record.protectedMode && result.estado === "completado" ? signer.sign(payload) : null;
    return { ...payload, reciboPqc };
  }
  return {
    async key(request?: Request) {
      try {
        assertAvailable(); prune(); limit("key", 60);
        let value = cookie(request);
        if (!sessions.has(digest(value))) {
          if (sessions.size >= 2000) throw new PaymentError("La demo alcanzó el límite de sesiones.", 429);
          value = randomToken();
        }
        sessions.set(digest(value), Date.now() + 30 * 60000);
        const response = json(channel.publicBundle());
        // Lax permite el retorno de la wallet por navegación GET; todos los POST exigen mismo origen.
        response.headers.set("Set-Cookie", `${sessionCookieName}=${value}; HttpOnly; SameSite=Lax; Path=/api/pasarela; Max-Age=1800${request?.url.startsWith("https:") ? "; Secure" : ""}`);
        return response;
      } catch (error) { const e = publicError(error); return json({ error: e.message }, e.status); }
    },
    async echo(request: Request) {
      try {
        assertAvailable(); assertOrigin(request); limit("echo", 30);
        const body = await readJson(request);
        let opened;
        try { opened = await channel.decrypt(body, "/api/pasarela/echo"); }
        catch { throw new PaymentError("No se pudo validar el sobre cifrado.", 400); }
        return json(await opened.encryptReply({ ok: true, echo: opened.payload }));
      } catch (error) { const e = publicError(error); return json({ error: e.message }, e.status); }
    },
    async charge(request: Request, protectedMode: boolean) {
      let encryptReply: ((value: unknown) => Promise<unknown>) | undefined;
      let activeRecord: PendingCharge | undefined;
      try {
        assertAvailable(); assertOrigin(request); prune();
        const body = await readJson(request);
        limit("charge", 10);
        let payload: unknown = body;
        let requestId: string;
        if (protectedMode) {
          let opened;
          try { opened = await channel.decrypt(body, "/api/pasarela/cobrar"); }
          catch { throw new PaymentError("El sobre cifrado es inválido o venció. Comprueba el canal de nuevo.", 400); }
          encryptReply = opened.encryptReply;
          requestId = opened.requestId;
          payload = opened.payload;
        } else {
          const record = z.record(z.string(), z.unknown()).safeParse(body);
          if (!record.success || !z.uuid().safeParse(record.data.requestId).success) throw new PaymentError("La solicitud no es válida.", 400);
          const { requestId: id, ...input } = record.data;
          requestId = id as string;
          payload = input;
        }
        const parsed = commandSchema.safeParse(payload);
        if (!parsed.success) throw new PaymentError("Revisa los datos y la acción de la solicitud.", 400);
        const session = requireSession(request);
        claim(requestId);
        let response: unknown;
        let status = 202;
        const command = parsed.data;
        if (command.action === "cotizar") {
          const input = { amount: command.amount, receiver: command.receiver, description: command.description };
          if (input.amount > limiteCobro()) throw new PaymentError("El monto supera el límite de la demo.", 400);
          if (pending.size >= 100) throw new PaymentError("Hay demasiadas cotizaciones pendientes.", 429);
          const prepared = await prepareCharge(input);
          const token = randomToken();
          const expiresAt = Math.min(Date.now() + 5 * 60000, prepared.expiresAt ? Date.parse(prepared.expiresAt) : Infinity);
          const flowId = randomToken();
          const record: PendingCharge = { session, protectedMode, input, prepared, expiresAt, flowId, phase: "quoted" };
          pending.set(digest(token), record);
          flows.set(flowId, digest(token));
          const quotePayload = { ...prepared.quote, requestId, receiver: input.receiver, amount: input.amount, description: input.description, issuedAt: new Date().toISOString(), paso: "cotizacion", expiresAt: new Date(expiresAt).toISOString(), confirmationId: digest(token) };
          response = { ...quotePayload, confirmationToken: token, canConfirm: process.env.PAYMENTS_EXECUTION_ENABLED !== "false", quoteProof: protectedMode ? signer.sign(quotePayload) : null, reciboPqc: null };
        } else {
          const record = find(command.confirmationToken, session, protectedMode);
          activeRecord = record;
          if (command.action === "confirmar" && record.phase === "quoted") {
            assertExecutionEnabled();
            if (record.prepared.authorize) {
              record.phase = "awaiting";
              const callback = `${paymentOrigin()}/api/pasarela/retorno?state=${record.flowId}`;
              const auth = await record.prepared.authorize(callback);
              response = { ...signedResult(record, record.prepared.quote, requestId), paso: "autorizacion", authorizationId: record.flowId, redirectUrl: auth.redirectUrl };
            } else {
              record.phase = "sending";
              record.expiresAt = Date.now() + 30 * 60000;
              record.result = await record.prepared.confirm();
              record.phase = "sent";
              response = signedResult(record, record.result, requestId);
            }
          } else if (command.action === "finalizar" && record.phase === "authorized") {
            assertExecutionEnabled();
            record.phase = "sending";
              record.expiresAt = Date.now() + 30 * 60000;
            record.result = await record.prepared.confirm();
            record.phase = "sent";
            response = signedResult(record, record.result, requestId);
          } else if (command.action === "consultar" && ["sent", "uncertain"].includes(record.phase)) {
            if (record.result?.estado !== "completado" && record.prepared.poll) record.result = await record.prepared.poll();
            response = signedResult(record, record.result ?? record.prepared.quote, requestId);
          } else {
            throw new PaymentError("Falta el consentimiento verificado o esta cotización ya fue enviada.", 409);
          }
          status = record.result?.estado === "completado" ? 201 : 202;
        }
        if (process.env.NODE_ENV === "development") console.info("[TerraCierta pasarela]", { requestId, protegido: protectedMode, accion: command.action, status });
        return json(encryptReply ? await encryptReply(response) : response, status);
      } catch (error) {
        const e = publicError(error);
        if (activeRecord?.phase === "sending") activeRecord.phase = "uncertain";
        return json(encryptReply ? await encryptReply({ error: e.message }) : { error: e.message }, e.status);
      }
    },
    async callback(request: Request) {
      try {
        assertAvailable(); prune(); limit("callback", 20);
        const session = requireSession(request);
        const url = new URL(request.url);
        const state = url.searchParams.get("state") ?? "";
        const id = flows.get(state);
        const record = id ? pending.get(id) : undefined;
        if (!record || record.session !== session || record.phase !== "awaiting" || !record.prepared.authorizeReturn) throw new PaymentError("El retorno no corresponde a una autorización pendiente de esta sesión.", 403);
        await record.prepared.authorizeReturn(url.searchParams.get("interact_ref") ?? "", url.searchParams.get("hash") ?? "");
        record.phase = "authorized";
        // El GET valida el retorno; la creación del pago ocurre después por POST desde la página.
        return new Response(null, { status: 303, headers: { Location: `${paymentOrigin()}/pago/pasarela?autorizacion=${record.flowId}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
      } catch (error) { const e = publicError(error); return json({ error: e.message }, e.status); }
    },
  };
}

const shared = globalThis as typeof globalThis & { terraCiertaGatewayV5?: ReturnType<typeof createGateway> };
export function getGateway() { return shared.terraCiertaGatewayV5 ??= createGateway(); }
