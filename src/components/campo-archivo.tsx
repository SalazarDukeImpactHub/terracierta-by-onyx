"use client";

import { useRef, useState } from "react";
import { MAX_BYTES_IMAGEN, MAX_LADO_IMAGEN, medidasAjustadas, nombreConTipo, TIPOS_IMAGEN_ADMITIDOS } from "@/lib/imagen";

/** Codifica el lienzo probando WebP y, si el navegador no lo sabe, JPEG. Devuelve null si no pudo. */
async function codificar(lienzo: HTMLCanvasElement, calidad: number): Promise<Blob | null> {
  for (const tipo of ["image/webp", "image/jpeg"]) {
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, tipo, calidad));
    if (blob && blob.type === tipo) return blob;
  }
  return null;
}

/** Reduce la imagen hasta que quepa en el límite. Devuelve null si no se pudo leer o no se logró. */
async function achicar(archivo: File): Promise<File | null> {
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo);
  } catch {
    return null;
  }
  try {
    let lado = MAX_LADO_IMAGEN;
    for (let ronda = 0; ronda < 4; ronda += 1) {
      const { ancho, alto } = medidasAjustadas(imagen.width, imagen.height, lado);
      const lienzo = document.createElement("canvas");
      lienzo.width = ancho;
      lienzo.height = alto;
      const contexto = lienzo.getContext("2d");
      if (!contexto) return null;
      contexto.drawImage(imagen, 0, 0, ancho, alto);
      for (const calidad of [0.85, 0.7, 0.5]) {
        const blob = await codificar(lienzo, calidad);
        if (blob && blob.size <= MAX_BYTES_IMAGEN) {
          return new File([blob], nombreConTipo(archivo.name, blob.type), { type: blob.type });
        }
      }
      lado = Math.round(lado * 0.7);
    }
    return null;
  } finally {
    imagen.close();
  }
}

/** Elige un archivo, lo achica en el navegador si pesa más de 2 MB y muestra el nombre, sin el input nativo a la vista. */
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
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  function limpiar(texto: string) {
    if (entrada.current) entrada.current.value = "";
    setNombre(null);
    setAviso({ texto, error: true });
  }

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    setAviso(null);
    if (!archivo) {
      setNombre(null);
      return;
    }
    if (!TIPOS_IMAGEN_ADMITIDOS.includes(archivo.type)) {
      limpiar("Ese formato no se admite. Usá una imagen JPG, PNG o WebP (no SVG, HEIC ni PDF).");
      return;
    }
    if (archivo.size <= MAX_BYTES_IMAGEN) {
      setNombre(archivo.name);
      return;
    }
    setNombre("Ajustando la imagen…");
    const reducida = await achicar(archivo);
    if (!reducida || !entrada.current) {
      limpiar("No pudimos ajustar esa imagen. Probá con otra más liviana (hasta 2 MB).");
      return;
    }
    const lista = new DataTransfer();
    lista.items.add(reducida);
    entrada.current.files = lista.files;
    setNombre(reducida.name);
    setAviso({ texto: `La imagen pesaba ${(archivo.size / 1048576).toFixed(1)} MB; la ajustamos a ${(reducida.size / 1024).toFixed(0)} KB.`, error: false });
  }

  return (
    <div>
      <label htmlFor={id} className="btn btn-borde cursor-pointer">
        {etiqueta}
      </label>
      <input ref={entrada} id={id} name={name} type="file" accept={accept} className="sr-only" onChange={alElegir} />
      <p className="mt-2 text-sm text-apagado">{nombre ?? ayuda}</p>
      {aviso && (
        <p role={aviso.error ? "alert" : "status"} className={`mt-1 text-sm ${aviso.error ? "text-cereza" : "text-apagado"}`}>
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
