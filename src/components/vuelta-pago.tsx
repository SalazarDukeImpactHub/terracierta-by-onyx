"use client";

import { useEffect } from "react";

/** Si el login de Interledger no devuelve solo, el botón atrás de esa pestaña abre aceptar o rechazar. */
export function VueltaPago() {
  useEffect(() => {
    const pendiente = () => sessionStorage.getItem("tc_vuelta_pago") === "1";
    const seguir = () => {
      if (!pendiente()) return;
      sessionStorage.removeItem("tc_vuelta_pago");
      if (location.pathname.startsWith("/pago/decidir")) return;
      location.replace("/pago/decidir");
    };
    if (location.pathname.startsWith("/pago/decidir")) {
      sessionStorage.removeItem("tc_vuelta_pago");
      return;
    }
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "back_forward") seguir();
    const alMostrar = (event: PageTransitionEvent) => {
      if (event.persisted) seguir();
    };
    const alEnviar = (event: Event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && form.hasAttribute("data-vuelta-pago")) {
        sessionStorage.setItem("tc_vuelta_pago", "1");
      }
    };
    window.addEventListener("pageshow", alMostrar);
    document.addEventListener("submit", alEnviar, true);
    return () => {
      window.removeEventListener("pageshow", alMostrar);
      document.removeEventListener("submit", alEnviar, true);
    };
  }, []);
  return null;
}
