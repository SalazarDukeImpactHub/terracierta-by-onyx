"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cambiarDeCuenta } from "@/app/acceso/actions";
import { formatoCop } from "@/lib/validacion";

export type SesionCheckout =
  | { tipo: "anonimo" }
  | { tipo: "otro-rol"; nombre: string; rol: string }
  | { tipo: "comprador"; nombre: string; wallet: string | null };

/**
 * Checkout. Pagar exige tener cuenta: la billetera con la que se paga sale del perfil del comprador (asignada al
 * registrarse), no de un campo de texto. El catálogo sigue siendo público; la cuenta se pide solo acá.
 * El total que se muestra es informativo: el servidor recalcula el monto desde la base.
 */
export function FormularioCheckout({
  productoId,
  precioCop,
  sesion,
  volverA,
}: {
  productoId: string;
  precioCop: number;
  sesion: SesionCheckout;
  volverA: string;
}) {
  const router = useRouter();
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const rutaAcceso = `/acceso?siguiente=${encodeURIComponent(volverA)}`;

  if (sesion.tipo === "anonimo") {
    return (
      <div className="grid gap-4 border border-linea bg-crema-2 p-5">
        <p className="font-titulo text-2xl">Para pagar, entrá con tu cuenta</p>
        <p className="text-apagado">
          Cada persona tiene su billetera. Entrando, tu pago sale de tu wallet y queda en tus compras. Mirar el café no
          necesita cuenta.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={rutaAcceso} className="btn btn-bosque self-start">
            Entrar para pagar
          </Link>
          <Link href={`/registro?rol=comprador&siguiente=${encodeURIComponent(volverA)}`} className="text-sm text-cobre-oscuro underline">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (sesion.tipo === "otro-rol") {
    return (
      <div className="grid gap-4 border border-linea bg-crema-2 p-5">
        <p className="font-titulo text-2xl">Entraste como {sesion.nombre}</p>
        <p className="text-apagado">
          Tu cuenta es de <strong>{sesion.rol}</strong>. Para comprar café necesitás una cuenta de <strong>comprador</strong>.
        </p>
        <form action={cambiarDeCuenta}>
          <input type="hidden" name="siguiente" value={volverA} />
          <button type="submit" className="btn btn-borde">
            Cambiar de cuenta
          </button>
        </form>
      </div>
    );
  }

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/pagos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId, cantidad }),
      });
      if (respuesta.status === 401) {
        router.push(rutaAcceso); // la sesión venció: volver a entrar y regresar a este producto
        return;
      }
      const datos = (await respuesta.json()) as { redirectUrl?: string; error?: string };
      if (!respuesta.ok || !datos.redirectUrl) {
        setError(datos.error ?? "No pudimos iniciar el pago");
        setEnviando(false);
        return;
      }
      window.location.assign(datos.redirectUrl);
    } catch {
      setError("No pudimos conectar. Revisá tu internet e intentá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={pagar} className="grid gap-4" noValidate>
      <div>
        <label htmlFor="cantidad" className="etiqueta">
          Cantidad
        </label>
        <input
          id="cantidad"
          type="number"
          min={1}
          max={20}
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="campo mt-1 max-w-[8rem]"
        />
      </div>

      <div className="border border-linea bg-crema-2 p-4">
        <p className="etiqueta">Pagás desde tu wallet · {sesion.nombre}</p>
        {sesion.wallet ? (
          <p className="mt-1 break-all font-medium">{sesion.wallet}</p>
        ) : (
          <p className="mt-1 text-cereza">Tu cuenta todavía no tiene una wallet asignada.</p>
        )}
        <p className="mt-2 text-sm text-apagado">
          Vas a aprobar el pago en tu billetera antes de que se cobre. No guardamos claves.
        </p>
      </div>

      <p className="font-titulo text-2xl">
        Total: <span className="text-cobre-oscuro">{formatoCop(precioCop * cantidad)}</span>
      </p>

      {error && (
        <p role="alert" className="border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-bosque self-start" disabled={enviando || !sesion.wallet}>
        {enviando ? "Iniciando pago…" : "Pagar con Open Payments"}
      </button>
    </form>
  );
}
