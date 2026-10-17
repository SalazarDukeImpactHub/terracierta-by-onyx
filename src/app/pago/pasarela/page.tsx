import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/adapters/auth";
import { FormularioPasarela } from "./formulario-pasarela";
import { PruebaPostcuantica } from "./prueba-pqc";
import { limiteCobro } from "@/payments/settlement";
import { limiteDebitoSdk } from "@/payments/openPayments";
import { USE_MOCKS } from "@/lib/env";
import { ResumenPasarela } from "./resumen-pasarela";

export const metadata: Metadata = { title: "Pasarela de pagos" };
export const dynamic = "force-dynamic";

export default async function PasarelaDePago({ searchParams }: { searchParams: Promise<{ prueba?: string; autorizacion?: string }> }) {
  const params = await searchParams;
  const perfil = await auth.obtenerPerfil().catch(() => null);
  // Conserva el retorno GNAP anterior. Elegir esta vista nunca concede permisos de pago.
  const prueba = params.prueba === "1" || (typeof params.autorizacion === "string" && !!params.autorizacion);
  if (!prueba) return <section className="mx-auto max-w-lg px-5 py-10 sm:py-14">
    <ResumenPasarela perfil={perfil} maxAmount={limiteCobro()} maxDebit={limiteDebitoSdk()} simulado={USE_MOCKS} />
  </section>;
  return (
    <section className="mx-auto max-w-lg px-5 py-10 sm:py-14">
      <h1 className="text-4xl">Prueba técnica de pago</h1>
        <p className="mt-3 text-apagado">Usa la wallet de prueba configurada en el servidor, independientemente de la cuenta de TerraCierta. No representa un pedido del catálogo.</p>
        <FormularioPasarela maxAmount={limiteCobro()} maxDebit={limiteDebitoSdk()} simulado={USE_MOCKS} />
        <Link href="/pago/pasarela" className="mt-6 inline-block text-sm text-cobre-oscuro underline underline-offset-4">Volver a los pagos de mi cuenta</Link>
      <PruebaPostcuantica />
    </section>
  );
}
