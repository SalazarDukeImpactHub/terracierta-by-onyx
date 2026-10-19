import type { Metadata } from "next";
import "./globals.css";
import { Cabecera } from "@/components/cabecera";
import { Pie } from "@/components/pie";
import { VueltaPago } from "@/components/vuelta-pago";

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
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <VueltaPago />
        <Cabecera />
        <main className="flex-1">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
