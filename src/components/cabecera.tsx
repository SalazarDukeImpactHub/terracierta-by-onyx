import Link from "next/link";
import { auth } from "@/adapters/auth";
import { salir } from "@/app/acceso/actions";
import { Marca } from "@/components/marca";
import { etiquetaRol, rutaDeRol } from "@/lib/roles";

export async function Cabecera() {
  const perfil = await auth.obtenerPerfil().catch(() => null);
  const home = perfil ? rutaDeRol(perfil.rol) : "/acceso";

  return (
    <header className="sticky top-0 z-30 border-b border-linea bg-crema/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 leading-none" aria-label="Terracierta by Onyx, inicio">
          <Marca tamano={44} className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
          <span>
            <span className="block font-titulo text-lg font-medium uppercase tracking-[0.22em] sm:text-xl sm:tracking-[0.28em]">Terracierta</span>
            <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.22em] text-apagado">
              by Onyx
            </span>
          </span>
        </Link>

        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-5">
          {perfil ? (
            <Link href={home} className="text-right font-titulo text-base font-medium leading-tight normal-case tracking-normal hover:text-cobre-oscuro sm:order-last">
              {perfil.nombre} ({etiquetaRol(perfil.rol)})
            </Link>
          ) : null}
          <nav aria-label="Principal" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[0.74rem] font-semibold uppercase tracking-[0.14em] sm:gap-x-5 sm:text-[0.78rem]">
            <Link href="/tienda" className="hover:text-cobre-oscuro">
              Tienda
            </Link>
            {perfil ? (
              <form action={salir}>
                <button type="submit" className="uppercase tracking-[0.14em] text-apagado hover:text-cereza">
                  Salir
                </button>
              </form>
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
      </div>
    </header>
  );
}
