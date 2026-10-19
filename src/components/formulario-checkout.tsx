"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cambiarDeCuenta } from "@/app/acceso/actions";
import { formatoCop } from "@/lib/validacion";
import { CheckoutError, iniciarCheckoutProtegido } from "@/payments/checkoutClient";

export type SesionCheckout =
  | { tipo: "anonimo" }
  | { tipo: "otro-rol"; nombre: string; rol: string }
  | { tipo: "pagador"; rol: "comprador" | "cooperativa"; nombre: string; wallet: string | null };

/**
 * Checkout. Pagar exige tener cuenta: la billetera con la que se paga sale del perfil del comprador (asignada al
 * registrarse), no de un campo de texto. El catálogo sigue siendo público; la cuenta se pide solo aquí.
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
  const [incierto, setIncierto] = useState(false);
  const bloqueado = useRef(false);
  const rutaAcceso = `/acceso?siguiente=${encodeURIComponent(volverA)}`;

  if (sesion.tipo === "anonimo") {
    return (
      <div className="grid gap-4 border border-linea bg-crema-2 p-5">
        <p className="font-titulo text-2xl">Para pagar, entra con tu cuenta</p>
        <p className="text-apagado">
          El pago sale de tu billetera y llega a la del caficultor. Puedes entrar como comprador o como cooperativa.
          Mirar el café no necesita cuenta.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={rutaAcceso} className="btn self-start">
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
          Tu cuenta es de <strong>caficultor</strong>. Para comprar este café entra como comprador o como cooperativa.
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
    if (bloqueado.current) return;
    bloqueado.current = true;
    setError(null);
    setEnviando(true);
    try {
      const resultado = await iniciarCheckoutProtegido({ productoId, cantidad });
      window.location.assign(resultado.redirectUrl);
    } catch (e) {
      if (e instanceof CheckoutError && e.status === 401) {
        bloqueado.current = false;
        router.push(rutaAcceso); // la sesión venció: volver a entrar y regresar a este producto
        return;
      }
      if (e instanceof CheckoutError && [400, 403, 404, 415, 429].includes(e.status)) {
        bloqueado.current = false;
      }
      setError(e instanceof CheckoutError
        ? e.message
        : "No se pudo confirmar el inicio. Revisa tu wallet y el pedido antes de intentar de nuevo.");
      setIncierto(bloqueado.current);
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
        <p className="etiqueta">Pagas desde tu wallet · {sesion.nombre}</p>
        {sesion.wallet ? (
          <p className="mt-1 break-all font-medium">{sesion.wallet}</p>
        ) : (
          <p className="mt-1 text-cereza">Tu cuenta todavía no tiene una wallet asignada.</p>
        )}
        <p className="mt-2 text-sm text-apagado">
          El dinero sale de esta billetera y entra en la del caficultor. La plataforma no lo custodia.
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

      <p className="text-sm text-apagado">Interledger te pedirá iniciar sesión y autorizar o rechazar el pago. Al volver, verificaremos el resultado antes de confirmar la compra.</p>
      <button type="submit" className="btn self-start" disabled={enviando || incierto || !sesion.wallet}>
        {enviando ? "Preparando pago…" : incierto ? "Revisa el estado antes de volver a pagar" : "Pagar con Interledger"}
      </button>
    </form>
  );
}
