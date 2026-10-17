import type { WalletAmount } from "./settlement";

/** Diferencia cotizada, sin atribuirla a una tarifa concreta ni convertir divisas. */
export function quotedDifference(debit: WalletAmount, receive: WalletAmount | null): WalletAmount | null {
  if (!receive || !debit.assetCode || debit.assetCode !== receive.assetCode || !Number.isInteger(debit.assetScale) || debit.assetScale !== receive.assetScale || !/^\d+$/.test(debit.value ?? "") || !/^\d+$/.test(receive.value ?? "")) return null;
  const difference = BigInt(debit.value!) - BigInt(receive.value!);
  return difference < BigInt(0) ? null : { value: String(difference), assetCode: debit.assetCode, assetScale: debit.assetScale };
}
