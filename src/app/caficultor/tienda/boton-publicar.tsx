"use client";

import { useFormStatus } from "react-dom";

export function BotonPublicar({ publicado }: { publicado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn w-full" disabled={pending}>
      {pending ? "Guardando…" : publicado ? "Ocultar" : "Publicar"}
    </button>
  );
}
