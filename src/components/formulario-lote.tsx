"use client";

import { useActionState } from "react";
import { crearLote, type EstadoFormulario } from "@/app/caficultor/lote/actions";

const VARIEDADES = ["Caturra", "Castillo", "Colombia", "Typica", "Geisha"];

export function FormularioLote({ municipioInicial }: { municipioInicial: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoFormulario, FormData>(crearLote, {});

  return (
    <form action={accion} className="grid max-w-xl gap-5">
      <div>
        <label htmlFor="metodo" className="etiqueta">
          Método de beneficio
        </label>
        <select id="metodo" name="metodo" required defaultValue="lavado" className="campo mt-1">
          <option value="lavado">Lavado</option>
          <option value="honey">Honey</option>
          <option value="natural">Natural</option>
        </select>
      </div>

      <div>
        <label htmlFor="variedad" className="etiqueta">
          Variedad
        </label>
        <input id="variedad" name="variedad" list="variedades" required maxLength={60} className="campo mt-1" />
        <datalist id="variedades">
          {VARIEDADES.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="kg" className="etiqueta">
          Cantidad (kg)
        </label>
        <input id="kg" name="kg" type="number" min={1} max={100000} step={1} required className="campo mt-1 max-w-[12rem]" />
      </div>

      <div>
        <label htmlFor="municipio" className="etiqueta">
          Municipio
        </label>
        <input id="municipio" name="municipio" defaultValue={municipioInicial} required maxLength={60} className="campo mt-1" />
      </div>

      {estado.error && (
        <p role="alert" className="border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn self-start" disabled={pendiente}>
        {pendiente ? "Analizando…" : "Ver las 3 mejores cooperativas"}
      </button>
    </form>
  );
}
