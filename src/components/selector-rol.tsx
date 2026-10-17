"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

export interface EnlaceRol {
  texto: string;
  href: string;
}

export interface OpcionRol {
  id: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  /** Botón principal del panel. */
  principal: EnlaceRol;
  /** Enlace secundario (por ejemplo, el otro camino: iniciar sesión o crear cuenta). */
  secundaria: EnlaceRol | null;
}

/**
 * Selector de rol del inicio: el visitante elige quién es y ve solo lo suyo, con su acción principal, sin bajar por la
 * página. Patrón WAI-ARIA de pestañas: flechas izquierda/derecha cambian de rol, Inicio y Fin saltan a los extremos.
 */
export function SelectorRol({ roles }: { roles: OpcionRol[] }) {
  const base = useId();
  const [activo, setActivo] = useState(0);
  const pestanas = useRef<(HTMLButtonElement | null)[]>([]);

  function elegir(i: number) {
    setActivo(i);
    pestanas.current[i]?.focus();
  }

  function alPulsar(e: React.KeyboardEvent, i: number) {
    const ultimo = roles.length - 1;
    const destino =
      e.key === "ArrowRight" ? (i + 1) % roles.length
      : e.key === "ArrowLeft" ? (i - 1 + roles.length) % roles.length
      : e.key === "Home" ? 0
      : e.key === "End" ? ultimo
      : null;
    if (destino === null) return;
    e.preventDefault();
    elegir(destino);
  }

  const rol = roles[activo];

  return (
    <div className="mt-7 max-w-xl sm:mt-9">
      <p className="etiqueta !text-crema/70">Elige cómo entras</p>

      <div role="tablist" aria-label="Tu rol en Terracierta" className="mt-3 grid grid-cols-3 gap-2">
        {roles.map((r, i) => {
          const seleccionado = i === activo;
          return (
            <button
              key={r.id}
              ref={(el) => {
                pestanas.current[i] = el;
              }}
              id={`${base}-tab-${r.id}`}
              role="tab"
              type="button"
              aria-selected={seleccionado}
              aria-controls={`${base}-panel`}
              tabIndex={seleccionado ? 0 : -1}
              onClick={() => setActivo(i)}
              onKeyDown={(e) => alPulsar(e, i)}
              className={`border px-1.5 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.06em] transition-colors sm:px-3 sm:text-[0.78rem] sm:tracking-[0.14em] ${
                seleccionado
                  ? "border-crema bg-crema text-tinta"
                  : "border-crema/40 bg-cafe/50 text-crema hover:border-crema hover:bg-cafe/70"
              }`}
            >
              {r.etiqueta}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${rol.id}`}
        className="mt-2 border border-crema/25 bg-cafe/70 p-4 backdrop-blur-sm sm:p-5"
      >
        <h2 className="font-titulo text-2xl text-white">{rol.titulo}</h2>
        <p className="mt-2 text-crema/85">{rol.texto}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={rol.principal.href} className="btn">
            {rol.principal.texto}
          </Link>
          {rol.secundaria && (
            <Link href={rol.secundaria.href} className="text-sm text-crema underline underline-offset-4 hover:text-cobre">
              {rol.secundaria.texto}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
