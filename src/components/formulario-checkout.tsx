"use client";

import { useState } from "react";
import { formatoCop } from "@/lib/validacion";

/**
 * Checkout del comprador (sin registro): pide cantidad y su wallet address y llama a
 * /api/pagos/iniciar. El monto que se muestra es informativo; el servidor lo recalcula desde la base.
 */
export function FormularioCheckout({ productoId, precioCop }: { productoId: string; precioCop: number }) {
  const [cantidad, setCantidad] = useState(1);
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/pagos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId, cantidad, walletComprador: wallet }),
      });
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

      <div>
        <label htmlFor="wallet" className="etiqueta">
          Tu wallet address (la billetera desde la que pagás)
        </label>
        <input
          id="wallet"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://billetera.com/tu-nombre  o  $billetera.com/tu-nombre"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="campo mt-1"
          aria-describedby="wallet-ayuda"
          required
        />
        <p id="wallet-ayuda" className="mt-1 text-sm text-apagado">
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

      <button type="submit" className="btn btn-bosque self-start" disabled={enviando || wallet.trim().length === 0}>
        {enviando ? "Iniciando pago…" : "Pagar con Open Payments"}
      </button>
    </form>
  );
}
