import type { Metadata } from "next";
import { FormularioPasarela } from "./formulario-pasarela";
import { limiteCobro } from "@/payments/settlement";
import { limiteDebitoSdk } from "@/payments/openPayments";
import { USE_MOCKS } from "@/lib/env";

export const metadata: Metadata = { title: "Pasarela de pagos" };

export default function PasarelaDePago() {
  return (
    <section className="mx-auto max-w-lg px-5 py-10 sm:py-14">
      <h1 className="text-4xl">Paga tu café</h1>
      <p className="mt-3 text-apagado">Revisa el total y confirma tu pago.</p>
      <FormularioPasarela maxAmount={limiteCobro()} maxDebit={limiteDebitoSdk()} simulado={USE_MOCKS} />
    </section>
  );
}
