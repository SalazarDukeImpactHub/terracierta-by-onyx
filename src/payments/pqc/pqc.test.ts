import { describe, expect, it } from "vitest";
import { createChannel, clientSeal, clientOpen, verifyChannelKey } from "./channel";
import { createHybridSigner, verifyReceipt } from "./hybridReceipt";

const signer = createHybridSigner();
const channel = createChannel(signer);
const request = { amount: 0.05, receiver: "$ilp.interledger-test.dev/921a6da8", description: "Café de Marsella" };
const context = "/api/pasarela/cobrar";

describe("canal TerraCierta", () => {
  it("cifra la solicitud y la respuesta sin publicar el secreto compartido", async () => {
    const bundle = channel.publicBundle();
    expect(verifyChannelKey(bundle)).toBe(true);
    const sealed = await clientSeal(bundle, request, context);
    expect(JSON.stringify(sealed.envelope)).not.toContain("Marsella");
    expect(sealed.envelope).not.toHaveProperty("sharedSecret");
    const opened = await channel.decrypt(sealed.envelope, context);
    expect(opened.payload).toEqual(request);
    const reply = await opened.encryptReply({ quoteId: "quote-1" });
    expect(await clientOpen(sealed, reply)).toEqual({ quoteId: "quote-1" });
  });

  it("rechaza ciphertext alterado, ruta diferente y reflejo de la solicitud", async () => {
    const sealed = await clientSeal(channel.publicBundle(), request, context);
    const corrupt = { ...sealed.envelope, ciphertext: "AAAA" + sealed.envelope.ciphertext.slice(4) };
    await expect(channel.decrypt(corrupt, context)).rejects.toThrow();
    await expect(channel.decrypt(sealed.envelope, "/api/pasarela/echo")).rejects.toThrow();
    await expect(clientOpen(sealed, sealed.envelope)).rejects.toThrow();
  });

  it("rechaza llaves sustituidas, bundle modificado y envelope malformado", async () => {
    expect(verifyChannelKey({ ...channel.publicBundle(), issuedAt: "2030-01-01" })).toBe(false);
    const forged = { ...channel.publicBundle(), publicKey: createChannel(signer).publicBundle().publicKey };
    await expect(clientSeal(forged, request, context)).rejects.toThrow();
    await expect(channel.decrypt({ kem: "!" }, context)).rejects.toThrow();
    const sealed = await clientSeal(channel.publicBundle(), request, context);
    await expect(createChannel(signer).decrypt(sealed.envelope, context)).rejects.toThrow();
  });

  it("genera encapsulaciones y nonce distintos para el mismo contenido", async () => {
    const a = await clientSeal(channel.publicBundle(), request, context);
    const b = await clientSeal(channel.publicBundle(), request, context);
    expect(a.envelope.kem).not.toBe(b.envelope.kem);
    expect(a.envelope.iv).not.toBe(b.envelope.iv);
    expect(a.envelope.requestId).not.toBe(b.envelope.requestId);
  });
});

describe("recibo híbrido", () => {
  it("exige ambas firmas contra las llaves esperadas y normaliza el orden JSON", () => {
    const receipt = signer.sign({ quoteId: "q1", debitAmount: { value: "5", assetCode: "EUR" } });
    expect(verifyReceipt(receipt, signer.publicKeys)).toEqual({ ed25519: true, mlDsa65: true, valid: true });
    expect(verifyReceipt({ ...receipt, payload: { debitAmount: { assetCode: "EUR", value: "5" }, quoteId: "q1" } }, signer.publicKeys).valid).toBe(true);
    expect(verifyReceipt({ ...receipt, payload: { ...receipt.payload, quoteId: "q2" } }, signer.publicKeys).valid).toBe(false);
    for (const field of ["ed25519", "mlDsa65"] as const) {
      expect(verifyReceipt({ ...receipt, signatures: { ...receipt.signatures, [field]: "AAAA" } }, signer.publicKeys).valid).toBe(false);
    }
    const otherSigner = createHybridSigner();
    expect(verifyReceipt(otherSigner.sign(receipt.payload), signer.publicKeys).valid).toBe(false);
  });
});
