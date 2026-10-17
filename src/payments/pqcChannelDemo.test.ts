import { expect, it } from "vitest";
import { demostrarCanalPqc } from "./pqcChannelDemo";

it("cifra el mismo documento sintético por ECDH y por el canal ML-KEM de la aplicación", async () => {
  const result = await demostrarCanalPqc();
  expect(result.documento.simulado).toBe(true);
  expect(result.clasico.idaVueltaVerificada).toBe(true);
  expect(result.pqc.idaVueltaVerificada).toBe(true);
  expect(result.clasico.alteracionRechazada).toBe(true);
  expect(result.pqc.alteracionRechazada).toBe(true);
  expect(result.parametros).toEqual({ clasico: "ECDH P-256 + HKDF-SHA-256 + AES-256-GCM", pqc: "ML-KEM-768 + HKDF-SHA-256 + AES-256-GCM", clavePublicaClasicaBytes: 65, clavePublicaPqcBytes: 1184, encapsuladoPqcBytes: 1088 });
});

it("modela el compromiso de la clave ECDH propia sin afirmar que ejecutó Shor", async () => {
  const result = await demostrarCanalPqc();
  expect(result.compromisoModelado.clasicoPuedeLeer).toBe(true);
  expect(result.compromisoModelado.claveClasicaAbrePqc).toBe(false);
  expect(result.compromisoModelado.shorEjecutado).toBe(false);
  expect(result.compromisoModelado.pruebaDeResistenciaCuantica).toBe(false);
});

it("rechaza también una respuesta cifrada alterada antes de mostrarla al navegador", async () => {
  const result = await demostrarCanalPqc();
  expect(result.clasico.alteracionRespuestaRechazada).toBe(true);
  expect(result.pqc.alteracionRespuestaRechazada).toBe(true);
});

it("publica evidencia sin claves privadas, secretos compartidos ni tráfico financiero", async () => {
  const result = await demostrarCanalPqc();
  const serialized = JSON.stringify(result);
  expect(serialized).not.toMatch(/privateKey|secretKey|sharedSecret|pkcs8|cookie|walletAddressId/);
  expect(result.clasico.captura.ciphertext).not.toContain(result.documento.id);
  expect(result.pqc.captura.ciphertext).not.toContain(result.documento.id);
  expect(result.huellaClavePqc).toMatch(/^[a-f0-9]{64}$/);
});

it("crea claves y referencias nuevas en cada experimento", async () => {
  const a = await demostrarCanalPqc();
  const b = await demostrarCanalPqc();
  expect(a.documento.id).not.toBe(b.documento.id);
  expect(a.huellaClavePqc).not.toBe(b.huellaClavePqc);
  expect(a.pqc.captura.kem).not.toBe(b.pqc.captura.kem);
});
