import { requerirRol } from "@/adapters/auth";
import { MenuCaficultor } from "@/components/menu-caficultor";

export const dynamic = "force-dynamic";

export default async function MarcoCaficultor({ children }: { children: React.ReactNode }) {
  const perfil = await requerirRol("caficultor");

  return (
    <div>
      <div className="border-b border-linea bg-crema-2">
        <div className="mx-auto max-w-6xl px-5 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="etiqueta">Caficultor</p>
              <p className="mt-1 font-titulo text-3xl">{perfil.nombre}</p>
            </div>
            <p className="text-sm text-apagado">
              {perfil.municipio}
              <span className="mx-2 text-cobre">✦</span>
              {perfil.tiene_invima ? "Tienda con INVIMA" : "Venta por lote"}
            </p>
          </div>
          <MenuCaficultor tieneInvima={perfil.tiene_invima} />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10">{children}</div>
    </div>
  );
}
