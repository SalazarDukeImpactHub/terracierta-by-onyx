import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";
import { canonicalize, verifyReceipt, type createHybridSigner, type HybridReceipt } from "./hybridReceipt";
import { fromBase64, toBase64, utf8 } from "./encoding";

type KeyPayload = { alg: "ML-KEM-768"; keyId: string; publicKey: string; issuedAt: string };
export type PublicBundle = KeyPayload & { signature: Omit<HybridReceipt, "payload"> };
type Metadata = { v: 1; keyId: string; requestId: string; issuedAt: number };
export type SealedReply = Metadata & { iv: string; ciphertext: string };
export type Envelope = SealedReply & { kem: string };
type ClientContext = { envelope: Envelope; sharedSecret: Uint8Array; context: string };

function associatedData(meta: Metadata, context: string, direction: "request" | "reply") {
  return utf8(canonicalize({ domain: "terracierta-pasarela-v1", v: meta.v, keyId: meta.keyId, requestId: meta.requestId, issuedAt: meta.issuedAt, context, direction }));
}

async function deriveKey(secret: Uint8Array, direction: "request" | "reply") {
  const key = await crypto.subtle.importKey("raw", new Uint8Array(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: utf8(`terracierta-pasarela-v1:${direction}`) }, key, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function seal(secret: Uint8Array, meta: Metadata, value: unknown, context: string, direction: "request" | "reply"): Promise<SealedReply> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret, direction);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: associatedData(meta, context, direction), tagLength: 128 }, key, utf8(canonicalize(value)));
  return { ...meta, iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

function metadata(value: unknown): SealedReply {
  const e = value as SealedReply | null;
  if (!e || e.v !== 1 || typeof e.keyId !== "string" || !/^[0-9a-f-]{36}$/.test(e.keyId) || typeof e.requestId !== "string" || !/^[0-9a-f-]{36}$/.test(e.requestId) || !Number.isSafeInteger(e.issuedAt)) {
    throw new Error("Sobre inválido");
  }
  fromBase64(e.iv, 12);
  if (fromBase64(e.ciphertext).length < 16) throw new Error("Sobre inválido");
  return { v: 1, keyId: e.keyId, requestId: e.requestId, issuedAt: e.issuedAt, iv: e.iv, ciphertext: e.ciphertext };
}

async function open(secret: Uint8Array, envelope: SealedReply, context: string, direction: "request" | "reply"): Promise<unknown> {
  const key = await deriveKey(secret, direction);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(envelope.iv, 12), additionalData: associatedData(envelope, context, direction), tagLength: 128 }, key, fromBase64(envelope.ciphertext));
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext));
}

export function createChannel(signer: ReturnType<typeof createHybridSigner>) {
  const kem = ml_kem768.keygen();
  const payload: KeyPayload = { alg: "ML-KEM-768", keyId: crypto.randomUUID(), publicKey: toBase64(kem.publicKey), issuedAt: new Date().toISOString() };
  const receipt = signer.sign(payload);
  const signature = { alg: receipt.alg, publicKeys: receipt.publicKeys, signatures: receipt.signatures };
  const bundle: PublicBundle = { ...payload, signature };
  return {
    publicBundle: (): PublicBundle => structuredClone(bundle),
    async decrypt(value: unknown, context: string) {
      const envelope = metadata(value);
      if (envelope.keyId !== payload.keyId || Math.abs(Date.now() - envelope.issuedAt) > 5 * 60_000) throw new Error("Sobre vencido; actualiza el canal");
      const cipherText = fromBase64((value as Envelope).kem, 1088);
      const secret = ml_kem768.decapsulate(cipherText, kem.secretKey);
      const plain = await open(secret, envelope, context, "request");
      // Las claves derivadas son distintas en cada dirección, incluso ante reflexión de mensajes.
      return { payload: plain, requestId: envelope.requestId, encryptReply: (reply: unknown) => seal(secret, { v: 1, keyId: envelope.keyId, requestId: envelope.requestId, issuedAt: envelope.issuedAt }, reply, context, "reply") };
    },
  };
}

export function verifyChannelKey(bundle: PublicBundle): boolean {
  try {
    if (bundle.alg !== "ML-KEM-768" || !Number.isFinite(Date.parse(bundle.issuedAt))) return false;
    fromBase64(bundle.publicKey, 1184);
    const { signature, ...payload } = bundle;
    return verifyReceipt({ ...signature, payload }, signature.publicKeys).valid;
  } catch {
    return false;
  }
}

export async function clientSeal(bundle: PublicBundle, value: unknown, context: string): Promise<ClientContext> {
  if (!verifyChannelKey(bundle)) throw new Error("Llave de pasarela inválida");
  const { cipherText, sharedSecret } = ml_kem768.encapsulate(fromBase64(bundle.publicKey, 1184));
  const meta: Metadata = { v: 1, keyId: bundle.keyId, requestId: crypto.randomUUID(), issuedAt: Date.now() };
  return { envelope: { ...await seal(sharedSecret, meta, value, context, "request"), kem: toBase64(cipherText) }, sharedSecret, context };
}

export async function clientOpen(sealed: ClientContext, value: unknown): Promise<unknown> {
  const reply = metadata(value);
  if (reply.keyId !== sealed.envelope.keyId || reply.requestId !== sealed.envelope.requestId || reply.issuedAt !== sealed.envelope.issuedAt) throw new Error("La respuesta pertenece a otra solicitud");
  return open(sealed.sharedSecret, reply, sealed.context, "reply");
}
