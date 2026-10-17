import "server-only";
import { createChannel } from "./channel";
import { createHybridSigner } from "./hybridReceipt";

function createRuntime() {
  const signer = createHybridSigner();
  return { signer, channel: createChannel(signer) };
}

// Next puede compilar cada ruta por separado; se conservan las mismas llaves en el proceso.
const shared = globalThis as typeof globalThis & { terraCiertaPqc?: ReturnType<typeof createRuntime> };
export function getPqcRuntime() {
  return shared.terraCiertaPqc ??= createRuntime();
}
