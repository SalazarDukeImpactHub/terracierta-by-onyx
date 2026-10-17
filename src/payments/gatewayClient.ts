import { clientSeal, clientOpen, verifyChannelKey, type PublicBundle } from "./pqc/channel";
import { canonicalize, verifyReceipt, type HybridReceipt } from "./pqc/hybridReceipt";
import type { ChargeInput, Settlement } from "./settlement";

export type Mode = "protegido" | "claro";
type BaseResult = Settlement & ChargeInput & { requestId: string; issuedAt: string; paso: string; reciboPqc: HybridReceipt | null };
export type PreparedResult = BaseResult & { confirmationToken: string; confirmationId: string; expiresAt: string; canConfirm: boolean; quoteProof: HybridReceipt | null; cotizacionVerificada: boolean };
export type ChargeResult = BaseResult & { reciboVerificado: boolean; redirectUrl?: string; authorizationId?: string };

export class GatewayRequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) { super(message); }
}

async function post(path: string, value: unknown) {
  return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value), cache: "no-store", credentials: "same-origin" });
}

export async function conectarCanal(): Promise<PublicBundle> {
  const response = await fetch("/api/pasarela/key", { cache: "no-store", credentials: "same-origin" });
  const bundle = await response.json();
  if (!response.ok) throw new Error(bundle.error ?? "No se pudo obtener la llave de la pasarela.");
  if (!verifyChannelKey(bundle)) throw new Error("La llave de la pasarela no superó la verificación.");
  const nonce = crypto.randomUUID();
  const sealed = await clientSeal(bundle, { nonce }, "/api/pasarela/echo");
  const echoResponse = await post("/api/pasarela/echo", sealed.envelope);
  if (!echoResponse.ok) throw new Error("No se pudo comprobar el canal. Actualiza la conexión.");
  const echo = await clientOpen(sealed, await echoResponse.json()) as { ok?: boolean; echo?: { nonce?: string } };
  if (!echo.ok || echo.echo?.nonce !== nonce) throw new Error("La comprobación del canal no coincide.");
  return bundle;
}

async function transport(value: unknown, mode: Mode, bundle: PublicBundle | null) {
  if (mode === "protegido" && !bundle) throw new Error("Primero comprueba el canal protegido.");
  const sealed = mode === "protegido" ? await clientSeal(bundle!, value, "/api/pasarela/cobrar") : null;
  const requestId = sealed?.envelope.requestId ?? crypto.randomUUID();
  const response = await post(mode === "protegido" ? "/api/pasarela/cobrar" : "/api/pasarela/cobrar-claro", sealed?.envelope ?? { ...(value as object), requestId });
  const body = await response.json();
  const data = sealed && body.ciphertext ? await clientOpen(sealed, body) : body;
  if (!response.ok) {
    const failure = data as { error?: string; code?: string };
    throw new GatewayRequestError(failure.error ?? "No se pudo confirmar el cobro. Revisa la wallet antes de volver a pagar.", response.status, failure.code);
  }
  if (sealed && !body.ciphertext) throw new Error("La respuesta protegida no está cifrada.");
  return { result: data as BaseResult, requestId };
}

function matches(result: BaseResult, input: ChargeInput, requestId: string) {
  if (result.requestId !== requestId || result.receiver !== input.receiver || result.amount !== input.amount || result.description !== input.description || !["completado", "pendiente"].includes(result.estado)) throw new Error("El resultado no coincide con el cobro. Revisa la wallet antes de volver a pagar.");
}

export async function cotizarCobro(input: ChargeInput, mode: Mode, bundle: PublicBundle | null): Promise<PreparedResult> {
  const { result, requestId } = await transport({ ...input, action: "cotizar" }, mode, bundle);
  matches(result, input, requestId);
  const prepared = result as Omit<PreparedResult, "cotizacionVerificada">;
  let verified = false;
  if (mode === "protegido") {
    const { confirmationToken, quoteProof } = prepared;
    const quotePayload = { ...prepared } as Partial<PreparedResult>;
    delete quotePayload.confirmationToken; delete quotePayload.canConfirm; delete quotePayload.quoteProof; delete quotePayload.reciboPqc;
    const tokenHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(confirmationToken))), (b) => b.toString(16).padStart(2, "0")).join("");
    verified = !!quoteProof && verifyReceipt(quoteProof, bundle!.signature.publicKeys).valid && canonicalize(quoteProof.payload) === canonicalize(quotePayload) && tokenHash === prepared.confirmationId;
    if (!verified) throw new Error("La cotización no superó la verificación de integridad.");
  }
  if (prepared.paso !== "cotizacion" || prepared.estado !== "pendiente" || !prepared.confirmationToken || Date.parse(prepared.expiresAt) <= Date.now()) throw new Error("La cotización no es válida o venció.");
  return { ...prepared, cotizacionVerificada: verified };
}

export async function confirmarCobro(prepared: PreparedResult, mode: Mode, bundle: PublicBundle | null, action: "confirmar" | "finalizar" | "consultar" = "confirmar"): Promise<ChargeResult> {
  const { result, requestId } = await transport({ action, confirmationToken: prepared.confirmationToken }, mode, bundle);
  matches(result, prepared, requestId);
  if (result.quoteId !== prepared.quoteId || canonicalize(result.debitAmount) !== canonicalize(prepared.debitAmount)) throw new Error("La confirmación no coincide con la cotización autorizada.");
  let verified = false;
  if (mode === "protegido" && result.estado === "completado") {
    const { reciboPqc, ...payload } = result;
    verified = !!reciboPqc && verifyReceipt(reciboPqc, bundle!.signature.publicKeys).valid && canonicalize(reciboPqc.payload) === canonicalize(payload);
    if (!verified) throw new Error("No se pudo verificar el recibo híbrido. Revisa la wallet antes de volver a pagar.");
  }
  return { ...result, reciboVerificado: verified };
}
