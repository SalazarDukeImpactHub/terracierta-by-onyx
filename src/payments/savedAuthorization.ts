import type { Mode, PreparedResult } from "./gatewayClient";
import type { WalletAmount } from "./settlement";

export const authorizationStorageKey = "terracierta-autorizacion";
export type SavedAuthorization = { prepared: PreparedResult; mode: Mode; authorizationId: string; phase?: "awaiting" | "finalizing" | "sent" };

function validAmount(value: unknown): value is WalletAmount {
  if (!value || typeof value !== "object") return false;
  const amount = value as WalletAmount;
  return typeof amount.value === "string" && /^\d{1,80}$/.test(amount.value)
    && typeof amount.assetCode === "string" && /^[A-Z0-9]{1,12}$/.test(amount.assetCode)
    && Number.isInteger(amount.assetScale) && amount.assetScale! >= 0 && amount.assetScale! <= 9;
}

/** Datos de recuperación del navegador, nunca una fuente de autorización para el servidor. */
export function readSavedAuthorization(storage: Pick<Storage, "getItem">): SavedAuthorization | null {
  try {
    const raw = storage.getItem(authorizationStorageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedAuthorization;
    const prepared = saved?.prepared;
    if (!saved || !/^[A-Za-z0-9_-]{43}$/.test(saved.authorizationId) || !["protegido", "claro"].includes(saved.mode)
      || (saved.phase !== undefined && !["awaiting", "finalizing", "sent"].includes(saved.phase))
      || !prepared || !/^[A-Za-z0-9_-]{43}$/.test(prepared.confirmationToken) || typeof prepared.quoteId !== "string"
      || !Number.isFinite(prepared.amount) || typeof prepared.receiver !== "string" || typeof prepared.description !== "string"
      || !Number.isFinite(Date.parse(prepared.expiresAt)) || !validAmount(prepared.debitAmount)
      || (prepared.receiveAmount !== null && !validAmount(prepared.receiveAmount))) throw new Error("invalid");
    return saved;
  } catch {
    throw new Error("No pudimos recuperar el intento guardado. Revisa tu wallet antes de iniciar otro pago.");
  }
}

export function saveAuthorization(storage: Pick<Storage, "setItem">, saved: SavedAuthorization) {
  try { storage.setItem(authorizationStorageKey, JSON.stringify(saved)); }
  catch { throw new Error("No pudimos guardar el estado del intento en este navegador. No se iniciará otro envío. Revisa tu wallet."); }
}
