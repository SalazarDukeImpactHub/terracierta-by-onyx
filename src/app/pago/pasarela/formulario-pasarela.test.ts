// @vitest-environment jsdom
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ChargeResult, PreparedResult } from "@/payments/gatewayClient";

const client = vi.hoisted(() => ({ conectarCanal: vi.fn(), cotizarCobro: vi.fn(), confirmarCobro: vi.fn() }));
vi.mock("@/payments/gatewayClient", () => client);
import { FormularioPasarela } from "./formulario-pasarela";

const storageKey = "terracierta-autorizacion";
const authorizationId = "a".repeat(43);
let root: Root | undefined;
let host: HTMLDivElement;
function saved(phase?: "awaiting" | "finalizing" | "sent", expired = false) {
  const prepared: PreparedResult = {
    requestId: crypto.randomUUID(), issuedAt: new Date().toISOString(), paso: "cotizacion", reciboPqc: null,
    amount: 0.05, receiver: "$ilp.interledger-test.dev/receiver", description: "Compra de prueba", rail: "mock",
    estado: "pendiente", quoteId: "mock_quote_fixture", debitAmount: { value: "5", assetCode: "EUR", assetScale: 2 },
    receiveAmount: { value: "5", assetCode: "EUR", assetScale: 2 }, debitAssetCode: "EUR", outgoingId: null,
    isReceive: true, simulado: true, evidencia: null, confirmationToken: "b".repeat(43), confirmationId: "c".repeat(64),
    expiresAt: new Date(Date.now() + (expired ? -60000 : 240000)).toISOString(), canConfirm: true,
    quoteProof: null, cotizacionVerificada: true,
  };
  return { prepared, mode: "protegido", authorizationId, phase };
}
async function mount() {
  root = createRoot(host);
  await act(async () => { root!.render(createElement(StrictMode, null, createElement(FormularioPasarela, { maxAmount: 0.05, maxDebit: 1.05, simulado: true }))); });
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  sessionStorage.clear(); window.history.replaceState(null, "", "/pago/pasarela");
  host = document.createElement("div"); document.body.append(host);
  client.conectarCanal.mockResolvedValue({ keyId: "public-test-key" });
  client.confirmarCobro.mockRejectedValue(new Error("La confirmación no está disponible. Revisa tu wallet."));
});
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; host.remove(); vi.restoreAllMocks(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

it("la página normal recuerda una autorización sin ocultarla con un nuevo botón de pago", async () => {
  sessionStorage.setItem(storageKey, JSON.stringify(saved()));
  await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/autorización pendiente/i);
  expect(host.textContent).not.toContain("Ver total para pagar");
  expect(client.confirmarCobro).not.toHaveBeenCalled();
  expect(client.cotizarCobro).not.toHaveBeenCalled();
});

it("un retorno vencido no intenta finalizar ni permite iniciar otro pago automáticamente", async () => {
  sessionStorage.setItem(storageKey, JSON.stringify(saved(undefined, true)));
  window.history.replaceState(null, "", `/pago/pasarela?autorizacion=${authorizationId}`);
  await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/venci[oó]/i);
  expect(client.confirmarCobro).not.toHaveBeenCalled();
  expect(host.textContent).not.toContain("Ver total para pagar");
});

it("marca el intento antes de enviar y tras perder la respuesta solo consulta al volver", async () => {
  sessionStorage.setItem(storageKey, JSON.stringify(saved()));
  window.history.replaceState(null, "", `/pago/pasarela?autorizacion=${authorizationId}`);
  client.confirmarCobro.mockImplementation(async (_prepared, _mode, _key, action) => {
    if (action === "finalizar") {
      expect(JSON.parse(sessionStorage.getItem(storageKey)!).phase).toBe("finalizing");
      throw new Error("Se perdió la conexión; revisa tu wallet antes de repetir.");
    }
    throw new Error("El estado todavía no está disponible.");
  });
  await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/perdió la conexión/);
  await act(async () => root!.unmount()); root = undefined;
  window.history.replaceState(null, "", "/pago/pasarela");
  await mount();
  expect(client.confirmarCobro.mock.calls.map(call => call[3])).toEqual(["finalizar", "consultar"]);
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/estado todavía/);
  expect(host.textContent).not.toContain("Ver total para pagar");
});

it("si no puede guardar el bloqueo de ejecución no envía el pago", async () => {
  sessionStorage.setItem(storageKey, JSON.stringify(saved()));
  window.history.replaceState(null, "", `/pago/pasarela?autorizacion=${authorizationId}`);
  vi.spyOn(Object.getPrototypeOf(sessionStorage), "setItem").mockImplementation(() => { throw new DOMException("Quota", "QuotaExceededError"); });
  await mount();
  expect(client.confirmarCobro).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/guardar/i);
});

it("una consulta pendiente sigue disponible después del vencimiento de la cotización", async () => {
  const attempt = saved("sent", true);
  sessionStorage.setItem(storageKey, JSON.stringify(attempt));
  const result: ChargeResult = { ...attempt.prepared, paso: "ejecucion", reciboVerificado: false };
  client.confirmarCobro.mockResolvedValue(result);
  await mount();
  expect(client.confirmarCobro.mock.calls.map(call => call[3])).toEqual(["consultar"]);
  expect(host.textContent).toContain("Tu pago está en proceso");
});

it("los datos locales dañados muestran recuperación y nunca habilitan un cobro nuevo", async () => {
  sessionStorage.setItem(storageKey, "{broken");
  await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/recuperar/i);
  expect(host.textContent).not.toContain("Ver total para pagar");
  expect(client.confirmarCobro).not.toHaveBeenCalled();
});

it.each([{ assetScale: 999 }, { value: "not-an-integer" }, { assetCode: null }])("un importe guardado malformado no rompe el render: %j", async change => {
  const attempt = saved("sent");
  const corrupted = { ...attempt, prepared: { ...attempt.prepared, debitAmount: { ...attempt.prepared.debitAmount, ...change } } };
  sessionStorage.setItem(storageKey, JSON.stringify(corrupted));
  await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/recuperar/i);
  expect(host.textContent).not.toContain("Ver total para pagar");
  expect(client.confirmarCobro).not.toHaveBeenCalled();
});

it("un 409 cifrado ya abierto por el cliente muestra revisión y bloquea otro cobro", async () => {
  sessionStorage.setItem(storageKey, JSON.stringify(saved("sent")));
  client.confirmarCobro.mockRejectedValue(Object.assign(new Error("La confirmación no está disponible en esta sesión."), { code: "CONFIRMATION_UNAVAILABLE", status: 409 }));
  await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/confirmación no está disponible/);
  expect(host.querySelector('a[href="https://wallet.interledger-test.dev/"]')).not.toBeNull();
  expect(host.textContent).not.toContain("Consultar mi pago");
  const close = Array.from(host.querySelectorAll("button")).find(button => button.textContent === "Cerrar revisión");
  expect(close?.disabled).toBe(true);
  expect(client.confirmarCobro.mock.calls.map(call => call[3])).toEqual(["consultar"]);
});

it("una finalización completada verifica el resultado y limpia el intento guardado", async () => {
  const attempt = saved();
  sessionStorage.setItem(storageKey, JSON.stringify(attempt));
  window.history.replaceState(null, "", `/pago/pasarela?autorizacion=${authorizationId}`);
  client.confirmarCobro.mockResolvedValue({ ...attempt.prepared, estado: "completado", paso: "liquidacion", reciboVerificado: true });
  await mount();
  expect(client.confirmarCobro.mock.calls.map(call => call[3])).toEqual(["finalizar"]);
  expect(host.textContent).toContain("Gracias por tu compra");
  expect(sessionStorage.getItem(storageKey)).toBeNull();
  expect(window.location.search).toBe("");
});
