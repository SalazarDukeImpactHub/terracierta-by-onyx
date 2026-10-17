"use client";

import { useState } from "react";

/** Elige un archivo y muestra el nombre, sin el input nativo a la vista. */
export function CampoArchivo({
  id,
  name,
  accept,
  etiqueta,
  ayuda,
}: {
  id: string;
  name: string;
  accept: string;
  etiqueta: string;
  ayuda: string;
}) {
  const [nombre, setNombre] = useState<string | null>(null);

  return (
    <div>
      <label htmlFor={id} className="btn btn-borde cursor-pointer">
        {etiqueta}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => setNombre(e.target.files?.[0]?.name ?? null)}
      />
      <p className="mt-2 text-sm text-apagado">{nombre ?? ayuda}</p>
    </div>
  );
}
