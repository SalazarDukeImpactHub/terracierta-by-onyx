import { ed25519 } from "@noble/curves/ed25519.js";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import { fromBase64, toBase64, utf8 } from "./encoding";

export type PublicKeys = { ed25519: string; mlDsa65: string };
export type HybridReceipt<T = unknown> = {
  alg: "Ed25519+ML-DSA-65";
  payload: T;
  publicKeys: PublicKeys;
  signatures: { ed25519: string; mlDsa65: string };
};

/** Orden estable de objetos JSON; rechaza valores que JSON descartaría silenciosamente. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",")}}`;
  }
  throw new Error("El recibo requiere valores JSON válidos");
}

/** Crear únicamente en el servidor; las llaves privadas permanecen dentro del cierre. */
export function createHybridSigner() {
  const ed = ed25519.keygen();
  const pq = ml_dsa65.keygen();
  const publicKeys = Object.freeze({ ed25519: toBase64(ed.publicKey), mlDsa65: toBase64(pq.publicKey) });
  return {
    publicKeys,
    sign<T>(payload: T): HybridReceipt<T> {
      const canonical = canonicalize(payload);
      const message = utf8(canonical);
      return {
        alg: "Ed25519+ML-DSA-65",
        payload: JSON.parse(canonical) as T,
        publicKeys,
        signatures: {
          ed25519: toBase64(ed25519.sign(message, ed.secretKey)),
          mlDsa65: toBase64(ml_dsa65.sign(message, pq.secretKey)),
        },
      };
    },
  };
}

/** Las llaves esperadas vienen del bundle obtenido por un transporte de confianza. */
export function verifyReceipt(receipt: HybridReceipt, expectedKeys: PublicKeys) {
  let classical = false;
  let pq = false;
  try {
    if (receipt.alg !== "Ed25519+ML-DSA-65" || receipt.publicKeys.ed25519 !== expectedKeys.ed25519 || receipt.publicKeys.mlDsa65 !== expectedKeys.mlDsa65) {
      return { ed25519: false, mlDsa65: false, valid: false };
    }
    const message = utf8(canonicalize(receipt.payload));
    classical = ed25519.verify(fromBase64(receipt.signatures.ed25519, 64), message, fromBase64(expectedKeys.ed25519, 32));
    pq = ml_dsa65.verify(fromBase64(receipt.signatures.mlDsa65, 3309), message, fromBase64(expectedKeys.mlDsa65, 1952));
  } catch {
    // Una firma incompleta o malformada nunca es un recibo válido.
  }
  return { ed25519: classical, mlDsa65: pq, valid: classical && pq };
}
