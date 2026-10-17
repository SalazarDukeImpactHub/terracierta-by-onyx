import { ed25519 } from "@noble/curves/ed25519.js";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import type { Rol } from "@/adapters/types";
import { canonicalize, verifyReceipt, type HybridReceipt } from "./pqc/hybridReceipt";
import { toBase64, utf8 } from "./pqc/encoding";

/** Experimento aislado: usa únicamente claves efímeras y documentos sintéticos.
 * Se concede deliberadamente al atacante la clave clásica de ESTA prueba;
 * no ejecuta Shor, no usa claves de la app y no demuestra un ataque cuántico real.
 */
export function demostrarCompromisoClasico(rol: Rol) {
  const classical = ed25519.keygen();
  const quantumSafe = ml_dsa65.keygen();
  const payload = { id: crypto.randomUUID(), rol, receptor: `https://demo.invalid/${crypto.randomUUID()}`, simulado: true as const, tipo: "demostracion-firma-hibrida" };
  const publicKeys = { ed25519: toBase64(classical.publicKey), mlDsa65: toBase64(quantumSafe.publicKey) };
  const message = utf8(canonicalize(payload));
  const original: HybridReceipt<typeof payload> = {
    alg: "Ed25519+ML-DSA-65", payload, publicKeys,
    signatures: { ed25519: toBase64(ed25519.sign(message, classical.secretKey)), mlDsa65: toBase64(ml_dsa65.sign(message, quantumSafe.secretKey)) },
  };
  const alteredPayload = { ...payload, receptor: `https://demo.invalid/${crypto.randomUUID()}` };
  const alterado: typeof original = { ...original, payload: alteredPayload, signatures: { ...original.signatures, ed25519: toBase64(ed25519.sign(utf8(canonicalize(alteredPayload)), classical.secretKey)) } };
  const originalCheck = verifyReceipt(original, publicKeys);
  const alteredCheck = verifyReceipt(alterado, publicKeys);
  return { original, alterado,
    parametros: { ed25519: { clavePublicaBytes: classical.publicKey.length, firmaBytes: atob(original.signatures.ed25519).length }, mlDsa65: { clavePublicaBytes: quantumSafe.publicKey.length, firmaBytes: atob(original.signatures.mlDsa65).length } },
    originalVerificado: originalCheck.valid, clasicaAceptaAlteracion: alteredCheck.ed25519, pqcAceptaAlteracion: alteredCheck.mlDsa65, hibridaAceptaAlteracion: alteredCheck.valid };
}
