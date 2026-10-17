import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { USE_MOCKS } from "@/lib/env";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Toda la app depende de la sesión (el encabezado la lee en cada página): nunca se prerenderiza.
// Sin esto, el build intenta generar páginas estáticas y ejecuta el módulo de login durante la compilación.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Terracierta by Onyx — Café con nombre propio", template: "%s · Terracierta by Onyx" },
  description:
    "Cada caficultor con su propia wallet para cobrar directo con Interledger: vende en su tienda o a la mejor cooperativa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${cormorant.variable} ${ebGaramond.variable}`}>
      <body className="flex min-h-screen flex-col">
        {USE_MOCKS && (
          <p className="bg-cereza px-4 py-1.5 text-center text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-crema">
            Modo demostración · los pagos y el acceso son simulados
          </p>
        )}
        <Cabecera />
        <main className="flex-1">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
