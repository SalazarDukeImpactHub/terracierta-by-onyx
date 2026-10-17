"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guardarProducto, type EstadoFormulario } from "@/app/caficultor/tienda/actions";
import { CampoArchivo } from "@/components/campo-archivo";

interface Valores {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio_cop?: number;
}

export function FormularioProducto({ valores = {} }: { valores?: Valores }) {
  const [estado, accion, pendiente] = useActionState<EstadoFormulario, FormData>(guardarProducto, {});

  return (
    <form action={accion} className="grid max-w-xl gap-5 border border-linea bg-[#fbf8f1] p-6">
      {valores.id && <input type="hidden" name="id" value={valores.id} />}

      <div>
        <label htmlFor="nombre" className="etiqueta">
          Nombre del producto
        </label>
        <input id="nombre" name="nombre" defaultValue={valores.nombre} maxLength={80} required className="campo mt-1" />
      </div>

      <div>
        <label htmlFor="descripcion" className="etiqueta">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          defaultValue={valores.descripcion}
          maxLength={600}
          rows={4}
          className="campo mt-1"
        />
      </div>

      <div>
        <label htmlFor="precio_cop" className="etiqueta">
          Precio en pesos colombianos (COP)
        </label>
        <input
          id="precio_cop"
          name="precio_cop"
          type="number"
          min={1000}
          step={1}
          defaultValue={valores.precio_cop}
          required
          className="campo mt-1 max-w-[14rem]"
        />
      </div>

      <CampoArchivo id="foto" name="foto" accept="image/jpeg,image/png,image/webp" etiqueta="Elegir foto" ayuda="JPG, PNG o WebP · hasta 2 MB. Si no elegís una, se conserva la actual." />

      {estado.error && (
        <p role="alert" className="border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {estado.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar producto"}
        </button>
        <Link href="/caficultor/tienda" className="btn btn-borde">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
