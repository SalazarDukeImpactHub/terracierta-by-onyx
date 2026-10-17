import { clientOpen, clientSeal, createChannel } from "./pqc/channel";
import { canonicalize, createHybridSigner } from "./pqc/hybridReceipt";
import { fromBase64, toBase64, utf8 } from "./pqc/encoding";

const context = "laboratorio-canal-sintetico-v1";
type Capture = { iv: string; ciphertext: string };

async function classicKey(secret: ArrayBuffer, direction: "ida" | "vuelta") {
  const material = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: utf8(`${context}:${direction}`) }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encryptClassic(secret: ArrayBuffer, payload: unknown, direction: "ida" | "vuelta"): Promise<Capture> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: utf8(`${context}:${direction}`), tagLength: 128 }, await classicKey(secret, direction), utf8(canonicalize(payload)));
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

async function decryptClassic(secret: ArrayBuffer, capture: Capture, direction: "ida" | "vuelta") {
  const value = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(capture.iv), additionalData: utf8(`${context}:${direction}`), tagLength: 128 }, await classicKey(secret, direction), fromBase64(capture.ciphertext));
  return JSON.parse(new TextDecoder().decode(value));
}

function alter<T extends Capture>(capture: T): T {
  const bytes = fromBase64(capture.ciphertext);
  bytes[0] ^= 1;
  return { ...capture, ciphertext: toBase64(bytes) };
}

async function rejects(operation: () => Promise<unknown>) {
  try { await operation(); return false; } catch { return true; }
}

/** Laboratorio local, sin fetch ni datos financieros. Las dos partes y el atacante
 * se ejecutan en este navegador con claves nuevas. Se entrega deliberadamente
 * la clave ECDH efímera del laboratorio al atacante: NO se ejecuta Shor.
 * El rechazo de una clave ajena demuestra separación criptográfica, no una
 * prueba experimental de resistencia de ML-KEM a computadoras cuánticas.
 */
export async function demostrarCanalPqc() {
  const documento = { id: crypto.randomUUID(), tipo: "mensaje-sintetico", simulado: true as const, contenido: "Café de prueba; sin datos personales ni dinero" };
  const keys = await Promise.all([0, 1].map(() => crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])));
  const [client, server] = keys;
  const secret = await crypto.subtle.deriveBits({ name: "ECDH", public: server.publicKey }, client.privateKey, 256);
  const receiverSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: client.publicKey }, server.privateKey, 256);
  const capture = await encryptClassic(secret, documento, "ida");
  const received = await decryptClassic(receiverSecret, capture, "ida");
  const reply = await encryptClassic(receiverSecret, { recibido: received.id }, "vuelta");
  const openedReply = await decryptClassic(secret, reply, "vuelta");

  // Oráculo didáctico: se concede la clave efímera clásica propia, no se calcula
  // a partir de su clave pública. Esto representa el supuesto de compromiso.
  const grantedKey = await crypto.subtle.exportKey("pkcs8", server.privateKey);
  const attackerKey = await crypto.subtle.importKey("pkcs8", grantedKey, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const attackerSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: client.publicKey }, attackerKey, 256);
  const attackerOpened = await decryptClassic(attackerSecret, capture, "ida");

  const channel = createChannel(createHybridSigner());
  const bundle = channel.publicBundle();
  const sealed = await clientSeal(bundle, documento, context);
  const opened = await channel.decrypt(sealed.envelope, context);
  const sealedReply = await opened.encryptReply({ recibido: (opened.payload as typeof documento).id });
  const pqcReply = await clientOpen(sealed, sealedReply) as { recibido: string };
  const fingerprint = await crypto.subtle.digest("SHA-256", fromBase64(bundle.publicKey));

  return {
    documento,
    huellaClavePqc: Array.from(new Uint8Array(fingerprint), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    parametros: { clasico: "ECDH P-256 + HKDF-SHA-256 + AES-256-GCM", pqc: "ML-KEM-768 + HKDF-SHA-256 + AES-256-GCM", clavePublicaClasicaBytes: (await crypto.subtle.exportKey("raw", server.publicKey)).byteLength, clavePublicaPqcBytes: fromBase64(bundle.publicKey).length, encapsuladoPqcBytes: fromBase64(sealed.envelope.kem).length },
    clasico: { captura: capture, idaVueltaVerificada: canonicalize(received) === canonicalize(documento) && openedReply.recibido === documento.id, alteracionRechazada: await rejects(() => decryptClassic(receiverSecret, alter(capture), "ida")), alteracionRespuestaRechazada: await rejects(() => decryptClassic(secret, alter(reply), "vuelta")) },
    pqc: { captura: sealed.envelope, idaVueltaVerificada: canonicalize(opened.payload) === canonicalize(documento) && pqcReply.recibido === documento.id, alteracionRechazada: await rejects(() => channel.decrypt(alter(sealed.envelope), context)), alteracionRespuestaRechazada: await rejects(() => clientOpen(sealed, alter(sealedReply))) },
    compromisoModelado: { clasicoPuedeLeer: canonicalize(attackerOpened) === canonicalize(documento), claveClasicaAbrePqc: !await rejects(() => clientOpen({ ...sealed, sharedSecret: new Uint8Array(attackerSecret) }, sealedReply)), shorEjecutado: false as const, pruebaDeResistenciaCuantica: false as const },
  };
}

export type ResultadoCanalPqc = Awaited<ReturnType<typeof demostrarCanalPqc>>;
