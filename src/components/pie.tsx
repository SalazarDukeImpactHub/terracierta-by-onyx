import { Marca } from "@/components/marca";

export function Pie() {
  return (
    <footer className="bg-cafe text-crema">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 sm:items-end">
        <div>
          {/* Grano y nombre centrados entre sí, como en el logo; el lema va aparte, debajo. */}
          <div className="flex items-center gap-4">
            <Marca tono="oscuro" carga="lazy" tamano={56} className="shrink-0" />
            <div className="leading-none">
              <p className="font-titulo text-2xl font-medium uppercase tracking-[0.26em]">Terracierta</p>
              <p className="mt-2 text-[0.7rem] uppercase tracking-[0.22em] text-crema/70">by Onyx</p>
            </div>
          </div>
          <p className="mt-4 font-titulo text-lg italic text-crema/90">Café con nombre propio.</p>
        </div>
        <p className="max-w-sm text-sm text-crema/70 sm:justify-self-end sm:text-right">
          Cada caficultor cobra directo, de wallet a wallet, con Interledger. La plataforma no custodia el dinero.
          <span className="mt-2 block text-[0.68rem] uppercase tracking-[0.18em] text-crema/55">
            Hackatón Open Payments · Medellín 2026
          </span>
        </p>
      </div>
    </footer>
  );
}
