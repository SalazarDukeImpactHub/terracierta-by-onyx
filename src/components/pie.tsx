import Link from "next/link";

export function Pie() {
  return (
    <footer className="bg-bosque-hondo text-crema">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-titulo text-2xl font-medium uppercase tracking-[0.26em]">Terracierta</p>
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-crema/70">by Onyx</p>
          <p className="mt-3 font-titulo text-lg italic text-crema/90">Café con nombre propio.</p>
        </div>
        <p className="max-w-sm text-sm text-crema/70 sm:text-right">
          Cada caficultor cobra directo, de wallet a wallet, con Open Payments. La plataforma no custodia el dinero.
          <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.18em] text-crema/55">
            Hackatón Open Payments · Medellín 2026
          </span>
          <Link href="/pago/pasarela" className="mt-3 inline-block text-sm text-crema/80 underline underline-offset-4 hover:text-crema">
            Probar la pasarela de pagos
          </Link>
        </p>
      </div>
    </footer>
  );
}
