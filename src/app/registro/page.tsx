import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/adapters/auth";
import { FormularioRegistro } from "@/components/formulario-registro";
import { USE_MOCKS } from "@/lib/env";
import { rutaDeRol, rutaSegura } from "@/lib/roles";

export const metadata: Metadata = { title: "Crear cuenta" };

/**
 * Sign up (registro): acá se solicitan los datos de la persona. Si es caficultor, se le pregunta una sola vez si tiene INVIMA.
 * Las cooperativas están precargadas, por eso solo se ofrecen caficultor y comprador.
 */
export default async function Registro({ searchParams }: { searchParams: Promise<{ rol?: string; siguiente?: string }> }) {
  const { rol, siguiente: crudo } = await searchParams;
  const siguiente = rutaSegura(crudo);

  const sesion = await auth.obtenerSesion().catch(() => null);
  if (sesion) redirect(siguiente ?? rutaDeRol(sesion.rol));

  const rolInicial = rol === "caficultor" || rol === "comprador" ? rol : null;
  const rutaAcceso = siguiente ? `/acceso?siguiente=${encodeURIComponent(siguiente)}` : "/acceso";

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <p className="etiqueta">Registro</p>
      <h1 className="mt-2 text-4xl">Creá tu cuenta</h1>
      <p className="mt-3 text-apagado">
        Contanos quién sos. Con tu cuenta recibís tu billetera: la dirección con la que cobrás o pagás en Terracierta.
      </p>

      {USE_MOCKS && (
        <p className="mt-4 border border-linea bg-crema-2 p-3 text-sm text-apagado">
          <span className="etiqueta !text-cereza">Modo demostración</span> · Se crea una cuenta de ejemplo con una wallet simulada.
        </p>
      )}

      <FormularioRegistro rolInicial={rolInicial} siguiente={siguiente} />

      <p className="mt-6 text-sm text-apagado">
        ¿Ya tenés cuenta?{" "}
        <Link href={rutaAcceso} className="text-cobre-oscuro underline">
          Iniciá sesión
        </Link>
      </p>
    </section>
  );
}
