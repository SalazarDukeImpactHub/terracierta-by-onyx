"use client";

import Link from "next/link";
import { useState } from "react";
import { formatoCop } from "@/lib/validacion";

export interface VentaVista {
  id: string;
  fecha: string;
  producto: string;
  cantidad: number;
  monto: number;
  estado: "pagado" | "pendiente" | "fallido";
  cliente: string;
  rolCliente: string;
  pagoId: string | null;
}

const FILTROS = [
  { id: "todos", etiqueta: "Todas" },
  { id: "pagado", etiqueta: "Pagadas" },
  { id: "pendiente", etiqueta: "Pendientes" },
  { id: "fallido", etiqueta: "Fallidas" },
] as const;

const ESTADO: Record<VentaVista["estado"], { texto: string; clase: string }> = {
  pagado: { texto: "Pagado", clase: "text-bosque" },
  pendiente: { texto: "Pendiente", clase: "text-apagado" },
  fallido: { texto: "Fallido", clase: "text-cereza" },
};

export function ListaVentas({ ventas }: { ventas: VentaVista[] }) {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const visibles = filtro === "todos" ? ventas : ventas.filter((v) => v.estado === filtro);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar ventas">
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          const cantidad = f.id === "todos" ? ventas.length : ventas.filter((v) => v.estado === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setFiltro(f.id)}
              className={`border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                activo ? "border-cobre-oscuro bg-cobre-oscuro text-crema" : "border-linea bg-[#fbf8f1] text-apagado hover:border-cobre hover:text-tinta"
              }`}
            >
              {f.etiqueta} {cantidad}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-4 border border-linea bg-[#fbf8f1] p-6 text-apagado">No hay ventas en este grupo.</p>
      ) : (
        <ul className="mt-4 divide-y divide-linea border border-linea bg-[#fbf8f1]">
          {visibles.map((v) => (
            <li key={v.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium">{v.cliente}</p>
                <p className="text-sm text-apagado">
                  {v.rolCliente} · {v.cantidad} × {v.producto}
                </p>
                <p className="text-sm text-apagado">{v.fecha}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-titulo text-2xl text-cobre-oscuro">{formatoCop(v.monto)}</p>
                <p className={`text-sm ${ESTADO[v.estado].clase}`}>{ESTADO[v.estado].texto}</p>
                {v.pagoId && (
                  <Link href={`/pago/retorno?pago_id=${encodeURIComponent(v.pagoId)}`} className="text-sm text-cobre-oscuro underline">
                    Ver recibo
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
