import { expect, it } from "vitest";
import { demostrarCompromisoClasico } from "./pqcQuantumDemo";
import { verifyReceipt } from "./pqc/hybridReceipt";

it.each(["comprador", "cooperativa", "caficultor"] as const)("demuestra para %s qué aporta la firma PQC ante compromiso clásico", (rol) => {
  const result = demostrarCompromisoClasico(rol);
  expect(result.originalVerificado).toBe(true);
  expect(result.clasicaAceptaAlteracion).toBe(true);
  expect(result.pqcAceptaAlteracion).toBe(false);
  expect(result.hibridaAceptaAlteracion).toBe(false);
  expect(result.original.payload.rol).toBe(rol);
  expect(result.original.payload.simulado).toBe(true);
  expect(result.parametros).toEqual({ ed25519: { clavePublicaBytes: 32, firmaBytes: 64 }, mlDsa65: { clavePublicaBytes: 1952, firmaBytes: 3309 } });
  expect(result.original.payload.receptor).not.toBe(result.alterado.payload.receptor);
  expect(result.original.publicKeys).toEqual(result.alterado.publicKeys);
  expect(result.original.signatures.mlDsa65).toBe(result.alterado.signatures.mlDsa65);
  expect(result.original.signatures.ed25519).not.toBe(result.alterado.signatures.ed25519);
  expect(verifyReceipt(result.alterado, result.original.publicKeys)).toEqual({ ed25519: true, mlDsa65: false, valid: false });
  expect(JSON.stringify(result)).not.toMatch(/secretKey|privateKey|seed/);
});

it("genera identidades y claves nuevas para cada demostración", () => {
  const a = demostrarCompromisoClasico("comprador");
  const b = demostrarCompromisoClasico("comprador");
  expect(a.original.payload.id).not.toBe(b.original.payload.id);
  expect(a.original.publicKeys.ed25519).not.toBe(b.original.publicKeys.ed25519);
});
