import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

// Prueba de procedencia de la petición, nunca un booleano aceptado del navegador.
const shared = globalThis as typeof globalThis & { terraCiertaCheckoutContext?: AsyncLocalStorage<boolean> };
const context = shared.terraCiertaCheckoutContext ??= new AsyncLocalStorage<boolean>();
export const withProtectedCheckout = <T>(action: () => T): T => context.run(true, action);
export const hasProtectedCheckout = (): boolean => context.getStore() === true;
