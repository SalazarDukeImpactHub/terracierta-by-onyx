"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cambiarDeCuenta } from "@/app/acceso/actions";
import { formatoCop } from "@/lib/validacion";
import { iniciarCheckoutProtegido, CheckoutError } from "@/payments/checkoutClient";
import { FlujoPago, type FasePago } from "./flujo-pago";

export type SesionCheckout =
  | { tipo: "anonimo" }
  | { tipo: "otro-rol"; nombre: string; rol: string }
  | { tipo: "comprador"; nombre: string; wallet: string | null };

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
  const [fase, setFase] = useState<FasePago | null>(null);
  const locked = useRef(false);
  const rutaAcceso = `/acceso?siguiente=${encodeURIComponent(volverA)}`;

  if (sesion.tipo === "anonimo") {
    return (
      <div className="grid gap-4 border border-linea bg-crema-2 p-5">
        <p className="font-titulo text-2xl">Para pagar, entra con tu cuenta</p>
        <p className="text-apagado">
          Cada persona tiene su billetera. Entrando, tu pago sale de tu wallet y queda en tus compras. Mirar el café no
          necesita cuenta.
        </p>
        <Link href={rutaAcceso} className="btn btn-bosque self-start">
          Entrar para pagar
        </Link>
      </div>
    );
  }

  if (sesion.tipo === "otro-rol") {
    return (
      <div className="grid gap-4 border border-linea bg-crema-2 p-5">
        <p className="font-titulo text-2xl">Entraste como {sesion.nombre}</p>
        <p className="text-apagado">
          Tu cuenta es de <strong>{sesion.rol}</strong>. Para comprar café necesitas una cuenta de <strong>comprador</strong>.
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
    if (locked.current) return;
    locked.current = true;
    setError(null);
    setEnviando(true);
    setFase("solicitud");
    try {
      const datos = await iniciarCheckoutProtegido({ productoId, cantidad }, (event) => setFase(event === "autorizacion" ? "autorizacion" : "canal"));
      window.location.assign(datos.redirectUrl);
    } catch (error) {
      if (error instanceof CheckoutError && error.status === 401) router.push(rutaAcceso);
      setError(error instanceof CheckoutError ? error.message : "No pudimos confirmar el inicio. Revisa tus compras y tu wallet antes de repetir el pago.");
      // Un resultado incierto no habilita un segundo envío desde este formulario.
      if (error instanceof CheckoutError && [400, 401, 403, 404, 415, 429].includes(error.status)) locked.current = false;
      setIncierto(locked.current);
      setFase("pendiente");
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
          Vas a aprobar el pago en tu billetera antes de que se cobre. La solicitud y la respuesta viajan protegidas con postcuántica.
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

      {incierto && <Link href="/comprador" className="text-cobre-oscuro underline underline-offset-4">Revisar mis compras</Link>}
      {fase && <FlujoPago fase={fase} />}
      <button type="submit" className="btn btn-bosque self-start" disabled={enviando || incierto || !sesion.wallet}>
        {enviando ? "Iniciando pago…" : incierto ? "Revisa el estado de tu compra" : "Pagar con Open Payments"}
      </button>
    </form>
  );
}
