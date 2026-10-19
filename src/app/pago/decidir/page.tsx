import { redirect } from "next/navigation";
import { leerCobro } from "@/lib/cobro-pendiente";
import { formatoCop } from "@/lib/validacion";
import { aceptarPago, rechazarPago } from "./actions";

export const dynamic = "force-dynamic";

export default async function DecidirPago() {
  const cobro = await leerCobro();
  if (!cobro) redirect("/");

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <p className="etiqueta">Pago</p>
      <h1 className="mt-2 text-4xl">¿Aceptas este pago?</h1>
      <p className="mt-6 font-titulo text-5xl text-cobre-oscuro">{formatoCop(cobro.monto)}</p>
      <p className="mt-4 text-apagado">Sale de la cuenta con la que entraste a Interledger y entra en la billetera de quien vende.</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <form action={aceptarPago}>
          <button type="submit" className="btn w-full sm:w-auto">
            Aceptar
          </button>
        </form>
        <form action={rechazarPago}>
          <button type="submit" className="btn btn-borde w-full sm:w-auto">
            Rechazar
          </button>
        </form>
      </div>
    </section>
  );
}
