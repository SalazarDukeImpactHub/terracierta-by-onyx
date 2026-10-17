import Image from "next/image";

/**
 * Grano de café de Terracierta. `claro` es para fondos claros y `oscuro` para fondos oscuros (como el pie).
 * Archivos originales en /public/brand.
 */
export function Marca({
  tamano = 40,
  tono = "claro",
  carga = "eager",
  className,
}: {
  tamano?: number;
  tono?: "claro" | "oscuro";
  /** `eager` (por defecto) para lo que se ve al abrir la página; `lazy` para lo que queda abajo, como el pie. */
  carga?: "eager" | "lazy";
  className?: string;
}) {
  return (
    <Image
      src={`/brand/terracierta-grano-${tono}.svg`}
      alt=""
      aria-hidden="true"
      width={tamano}
      height={tamano}
      unoptimized
      loading={carga}
      className={className}
    />
  );
}
