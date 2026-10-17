"use client";

import { useRef, useState } from "react";
import { CheckoutError, iniciarOfertaProtegida } from "@/payments/checkoutClient";
import { FlujoPago, type FasePago } from "./flujo-pago";

export function PagoOferta({ ofertaId, reintento }: { ofertaId: string; reintento: boolean }) {
  const locked = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [incierto, setIncierto] = useState(false);
  const [error, setError] = useState("");
  const [fase, setFase] = useState<FasePago | null>(null);
  async function pagar() {
    if (locked.current) return;
    locked.current = true; setEnviando(true); setError(""); setFase("solicitud");
    try { window.location.assign((await iniciarOfertaProtegida(ofertaId, (event) => setFase(event === "autorizacion" ? "autorizacion" : "canal"))).redirectUrl); }
    catch (error) {
      setError(error instanceof CheckoutError ? error.message : "No se pudo confirmar el inicio. Revisa tu wallet y la oferta antes de repetir el pago.");
      if (error instanceof CheckoutError && [400, 401, 403, 404, 415, 429].includes(error.status)) locked.current = false;
      setIncierto(locked.current);
      setFase("pendiente");
      setEnviando(false);
    }
  }
  return <div>
    <button type="button" className="btn btn-bosque" onClick={pagar} disabled={enviando || incierto}>{enviando ? "Preparando pago protegido…" : incierto ? "Revisa el estado del pago" : reintento ? "Reintentar pago" : "Pagar con Open Payments"}</button>
    {error && <p role="alert" className="mt-3 text-cereza">{error}</p>}
    {fase && <FlujoPago fase={fase} />}
  </div>;
}
