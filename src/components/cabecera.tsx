import Link from "next/link";
import { auth } from "@/adapters/auth";
import { salir } from "@/app/acceso/actions";
import { Marca } from "@/components/marca";
import { rutaDeRol } from "@/lib/roles";

export async function Cabecera() {
  const perfil = await auth.obtenerPerfil().catch(() => null);
  const home = perfil ? rutaDeRol(perfil.rol) : "/acceso";

  return (
    <header className="sticky top-0 z-30 border-b border-linea bg-crema/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
        <Link href="/" className="flex items-center gap-3 leading-none" aria-label="Terracierta by Onyx, inicio">
          <Marca tamano={44} className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
          <span>
            <span className="block font-titulo text-lg font-medium uppercase tracking-[0.22em] sm:text-xl sm:tracking-[0.28em]">Terracierta</span>
            <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.22em] text-apagado">
              by Onyx
            </span>
          </span>
        </Link>

        <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem] sm:gap-x-5 sm:text-[0.78rem] font-semibold uppercase tracking-[0.14em]">
          <Link href="/tienda" className="hover:text-cobre-oscuro">
            Tienda
          </Link>
          {perfil ? (
            <>
              <Link href={home} className="hover:text-cobre-oscuro">
                Mi cuenta
              </Link>
              <form action={salir}>
                <button type="submit" className="uppercase tracking-[0.14em] text-apagado hover:text-cereza">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/registro" className="hover:text-cobre-oscuro">
                Registrarse
              </Link>
              <Link href="/acceso" className="btn !py-2">
                Iniciar sesión
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
