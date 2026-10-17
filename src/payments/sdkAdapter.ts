import "server-only";
import { randomBytes, createHash } from "node:crypto";
import type { IniciarPagoInput, ConsultarPagoOutput } from "@/adapters/types";
import { getPqcRuntime } from "./pqc/server";
import { prepararOpenPayment, paymentOrigin, testnetUrl } from "./openPayments";
import { limiteCobro, PaymentError, type ChargeInput } from "./settlement";
import type { PreparedCharge } from "./gateway";

type RecordSdk = {
  input: IniciarPagoInput;
  prepared: PreparedCharge;
  sessionHash: string;
  state: string;
  expiresAt: number;
  phase: "awaiting" | "sending" | "sent" | "uncertain";
  output: ConsultarPagoOutput;
};
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const checkoutCookie = "tc_checkout_gnap";

/** Conserva el contrato del checkout usando el mismo SDK y consentimiento de la pasarela. */
export function createSdkAdapter(prepare: (input: ChargeInput, payerWallet?: string) => Promise<PreparedCharge> = prepararOpenPayment) {
  const records = new Map<string, RecordSdk>();
  const flows = new Map<string, string>();
  function prune() {
    for (const [id, record] of records) if (record.expiresAt < Date.now()) { record.prepared.clear(); records.delete(id); flows.delete(record.state); }
  }
  function update(id: string, record: RecordSdk, result: Awaited<ReturnType<PreparedCharge["confirm"]>>) {
    const payload = { pagoId: id, ...result, receiver: record.input.walletReceptor, amount: record.input.montoCop, issuedAt: new Date().toISOString() };
    record.output = { estado: result.estado, detalle: { ...payload, canalPqc: false, reciboPqc: result.estado === "completado" ? getPqcRuntime().signer.sign(payload) : null, emisor: "wallet-servidor-autorizada-gnap" } };
  }
  return {
    async start(input: IniciarPagoInput, session: string) {
      prune();
      if (records.size >= 100) throw new PaymentError("Hay demasiados pagos pendientes.", 429);
      if (!Number.isSafeInteger(input.montoCop) || input.montoCop <= 0 || new URL(input.urlRetorno).origin !== paymentOrigin()) throw new PaymentError("Los datos o el retorno del pago no son válidos.", 400);
      if (input.montoCop > limiteCobro()) throw new PaymentError("El pedido supera el límite de la demo. No se reduce el importe para ejecutar el pago.", 400);
      const payerWallet = testnetUrl(input.walletPagador);
      getPqcRuntime();
      // El contrato del checkout expresa COP; una wallet de otra moneda requiere conversión explícita.
      const prepared = await prepare({ amount: input.montoCop, receiver: input.walletReceptor, description: `TerraCierta ${input.tipo} ${input.referenciaId}`, expectedReceiveAssetCode: "COP" }, payerWallet);
      if (!prepared.authorize) throw new PaymentError("Este riel requiere autorización GNAP.");
      const state = randomBytes(32).toString("base64url");
      const id = `op_${randomBytes(12).toString("hex")}`;
      const authorization = await prepared.authorize(`${paymentOrigin()}/api/pasarela/retorno?checkoutState=${state}`);
      records.set(id, { input, prepared, sessionHash: hash(session), state, expiresAt: Date.now() + 10 * 60000, phase: "awaiting", output: { estado: "pendiente", detalle: { rail: "open-payments", paso: "autorizacion", quoteId: prepared.quote.quoteId, debitAmount: prepared.quote.debitAmount } } });
      flows.set(state, id);
      return { pagoId: id, redirectUrl: authorization.redirectUrl, estado: "pendiente" as const };
    },
    async callback(request: Request) {
      prune();
      const url = new URL(request.url);
      const id = flows.get(url.searchParams.get("checkoutState") ?? "");
      const record = id ? records.get(id) : undefined;
      const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${checkoutCookie}=`))?.slice(checkoutCookie.length + 1) ?? "";
      if (!id || !record || !cookie || record.sessionHash !== hash(cookie) || record.phase !== "awaiting" || !record.prepared.authorizeReturn) return Response.json({ error: "El retorno no corresponde a un pago pendiente de esta sesión." }, { status: 403 });
      try {
        await record.prepared.authorizeReturn(url.searchParams.get("interact_ref") ?? "", url.searchParams.get("hash") ?? "");
        record.phase = "sending";
        record.expiresAt = Date.now() + 30 * 60000;
        update(id, record, await record.prepared.confirm());
        record.phase = "sent";
        const target = new URL(record.input.urlRetorno);
        target.searchParams.set("pago_id", id);
        return new Response(null, { status: 303, headers: { Location: target.href, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
      } catch (error) {
        if (record.phase === "sending") { record.phase = "uncertain"; record.output = { estado: "pendiente", detalle: { rail: "open-payments", resultadoIncierto: true, motivo: "No se pudo confirmar el pago. Revisa la wallet antes de volver a pagar." } }; }
        return Response.json({ error: error instanceof PaymentError ? error.message : "No se pudo verificar la autorización del pago." }, { status: error instanceof PaymentError ? error.status : 502, headers: { "Cache-Control": "no-store" } });
      }
    },
    async consultar(id: string): Promise<ConsultarPagoOutput> {
      prune();
      const record = records.get(id);
      if (!record) return { estado: "pendiente", detalle: { resultadoIncierto: true, requiereConciliacion: true, motivo: "El estado no está disponible en este proceso. Revisa la wallet antes de repetir el pago." } };
      if (["sent", "uncertain"].includes(record.phase) && record.output.estado === "pendiente" && record.prepared.poll) {
        try { update(id, record, await record.prepared.poll()); }
        catch { return { estado: "pendiente", detalle: { ...record.output.detalle, motivo: "No se pudo actualizar el estado; revisa la wallet antes de repetir el pago." } }; }
      }
      return structuredClone(record.output);
    },
  };
}
const shared = globalThis as typeof globalThis & { terraCiertaSdkAdapter?: ReturnType<typeof createSdkAdapter> };
export function getSdkAdapter() { return shared.terraCiertaSdkAdapter ??= createSdkAdapter(); }

export async function iniciarPagoSdk(input: IniciarPagoInput) {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const session = jar.get(checkoutCookie)?.value || randomBytes(32).toString("base64url");
  jar.set(checkoutCookie, session, { httpOnly: true, sameSite: "lax", path: "/", secure: paymentOrigin().startsWith("https:"), maxAge: 1800 });
  return getSdkAdapter().start(input, session);
}
