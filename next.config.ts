import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El SDK lee sus esquemas YAML desde disco; Node debe conservar las rutas del paquete.
  serverExternalPackages: ["@interledger/open-payments"],
  // Cache Components / partialPrefetching venían activados por el scaffold;
  // no adoptamos ese modelo (obliga a envolver todo dato dinámico en Suspense).
  turbopack: {
    // Fija la raíz de este proyecto: Next detectaba un package-lock.json ajeno en C:\Users\jsala.
    root: import.meta.dirname,
    rules: {
      // Solo el entrypoint de Tailwind: `as: *.css` sobre *.module.css
      // elimina su clasificación como módulo y sus exports de clases.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Subida de fotos de producto por Server Action (el servidor valida tipo y tamaño).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
