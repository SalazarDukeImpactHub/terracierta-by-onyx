import Link from "next/link";
import { auth } from "@/adapters/auth";
import { salir } from "@/app/acceso/actions";

export async function Cabecera() {
  const perfil = await auth.obtenerPerfil().catch(() => null);
  const home = perfil?.rol === "cooperativa" ? "/cooperativa" : "/caficultor";

  return (
    <header className="sticky top-0 z-30 border-b border-linea bg-crema/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="leading-none" aria-label="Terracierta by Onyx, inicio">
          <span className="block font-titulo text-xl font-medium uppercase tracking-[0.28em]">Terracierta</span>
          <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.22em] text-apagado">
            by Onyx · Marsella · Antioquia
          </span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-5 text-[0.78rem] font-semibold uppercase tracking-[0.14em]">
          <Link href="/tienda" className="hover:text-cobre-oscuro">
            Tienda
          </Link>
          {perfil ? (
            <>
              <Link href={home} className="hover:text-cobre-oscuro">
                Mi espacio
              </Link>
              <form action={salir}>
                <button type="submit" className="uppercase tracking-[0.14em] text-apagado hover:text-cereza">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link href="/acceso" className="btn !py-2">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
