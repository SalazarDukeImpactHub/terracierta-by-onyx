import { clientOpen, clientSeal, verifyChannelKey, type PublicBundle } from "./pqc/channel";
import { fromBase64, toBase64 } from "./pqc/encoding";
import { verifyReceipt } from "./pqc/hybridReceipt";

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;
export type PruebaPqc = Awaited<ReturnType<typeof comprobarPqc>>;

/** Solo usa key/echo con un nonce sintético; nunca prepara, autoriza ni ejecuta pagos. */
export async function comprobarPqc(fetcher: Fetcher = (path, init) => fetch(path, init)) {
  const keyResponse = await fetcher("/api/pasarela/key", { credentials: "same-origin", cache: "no-store" });
  if (!keyResponse.ok) throw new Error("La comprobación no está disponible. Intenta de nuevo más tarde.");
  const bundle = await keyResponse.json() as PublicBundle;
  if (!verifyChannelKey(bundle)) throw new Error("No se pudo verificar la llave del canal.");
  const { signature, ...keyPayload } = bundle;
  const verified = verifyReceipt({ ...signature, payload: keyPayload }, signature.publicKeys);
  const modified = verifyReceipt({ ...signature, payload: { ...keyPayload, keyId: `${keyPayload.keyId}-alterado` } }, signature.publicKeys);
  if (!verified.valid || modified.ed25519 || modified.mlDsa65) throw new Error("Las firmas no superaron la comprobación.");

  const nonce = crypto.randomUUID();
  const sealed = await clientSeal(bundle, { nonce }, "/api/pasarela/echo");
  const post = (value: unknown) => fetcher("/api/pasarela/echo", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  const reply = await post(sealed.envelope);
  if (!reply.ok) throw new Error("No se pudo comprobar el intercambio cifrado.");
  const plain = await clientOpen(sealed, await reply.json()) as { ok?: boolean; echo?: { nonce?: string } };
  if (!plain.ok || plain.echo?.nonce !== nonce) throw new Error("La respuesta no corresponde a esta prueba.");

  // Cambiar un bit conserva la codificación y longitud: probamos integridad, no un JSON inválido.
  const bytes = fromBase64(sealed.envelope.ciphertext);
  bytes[0] ^= 1;
  const rejected = await post({ ...sealed.envelope, ciphertext: toBase64(bytes) });
  const error = await rejected.json();
  if (rejected.status !== 400 || error.error !== "No se pudo validar el sobre cifrado.") throw new Error("No se pudo comprobar el rechazo de la alteración. Intenta de nuevo más tarde.");
  return {
    requestId: sealed.envelope.requestId,
    keyId: bundle.keyId,
    bytesCifrados: fromBase64(sealed.envelope.ciphertext).length,
    muestraCifrada: sealed.envelope.ciphertext.slice(0, 64),
    cifradoVerificado: plain.ok && plain.echo.nonce === nonce,
    alteracionRechazada: rejected.status === 400,
    firmaClasica: verified.ed25519,
    firmaPqc: verified.mlDsa65,
    firmaAlteradaRechazada: !modified.ed25519 && !modified.mlDsa65,
  };
}
