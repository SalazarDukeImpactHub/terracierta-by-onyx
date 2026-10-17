"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MenuCaficultor({ tieneInvima }: { tieneInvima: boolean }) {
  const ruta = usePathname();
  const items = tieneInvima
    ? [
        { href: "/caficultor", etiqueta: "Resumen" },
        { href: "/caficultor/tienda", etiqueta: "Tienda" },
        { href: "/caficultor/pedidos", etiqueta: "Ventas" },
        { href: "/caficultor/cuenta", etiqueta: "Mi información" },
      ]
    : [
        { href: "/caficultor", etiqueta: "Resumen" },
        { href: "/caficultor/lote", etiqueta: "Mis lotes" },
        { href: "/caficultor/cuenta", etiqueta: "Mi información" },
      ];

  return (
    <nav aria-label="Secciones del caficultor" className="-mb-px flex flex-wrap">
      {items.map((item) => {
        const activo = item.href === "/caficultor" ? ruta === item.href : ruta === item.href || ruta.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`border-b-2 px-3 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-colors sm:px-4 sm:text-[0.74rem] sm:tracking-[0.14em] ${
              activo ? "border-cobre-oscuro text-tinta" : "border-transparent text-apagado hover:text-tinta"
            }`}
          >
            {item.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
