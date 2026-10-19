import type { Metadata } from "next";
import { requerirRol } from "@/adapters/auth";
import { clienteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Mi información" };
export const dynamic = "force-dynamic";

export default async function MiInformacion() {
  const perfil = await requerirRol("caficultor");
  const { data: usuario } = await clienteAdmin()
    .from("usuarios")
    .select("correo, tipo_documento, numero_documento")
    .eq("id", perfil.id)
    .maybeSingle();

  const documento =
    usuario?.tipo_documento && usuario.numero_documento ? `${usuario.tipo_documento} ${usuario.numero_documento}` : "Sin documento";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="border border-linea bg-[#fbf8f1] p-6">
        <p className="etiqueta">Cuenta</p>
        <h1 className="mt-1 text-3xl">Tus datos</h1>
        <dl className="mt-6 divide-y divide-linea">
          <Fila etiqueta="Nombre" valor={perfil.nombre} />
          <Fila etiqueta="Correo" valor={usuario?.correo ?? "—"} />
          <Fila etiqueta="Documento" valor={documento} />
          <Fila etiqueta="Municipio" valor={perfil.municipio} />
          <Fila etiqueta="INVIMA" valor={perfil.tiene_invima ? "Registrado con la cuenta" : "Sin registro"} />
        </dl>
      </section>

      <section className="border border-linea bg-[#fbf8f1] p-6">
        <p className="etiqueta">Cobro</p>
        <h2 className="mt-1 text-3xl">Billetera de destino</h2>
        <p className="mt-3 text-sm text-apagado">
          {perfil.tiene_invima
            ? "Las compras de tu tienda se pagan a esta dirección."
            : "Cuando una cooperativa pague tu lote, el dinero llega a esta dirección."}
        </p>
        {perfil.wallet_address ? (
          <p className="mt-4 break-all border border-linea bg-crema px-4 py-3 text-sm">{perfil.wallet_address}</p>
        ) : (
          <p className="mt-4 text-apagado">Todavía no tienes una billetera asignada.</p>
        )}
      </section>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="etiqueta self-center">{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
