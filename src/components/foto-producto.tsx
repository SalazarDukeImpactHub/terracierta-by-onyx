import { urlSegura } from "@/lib/validacion";

/**
 * Foto del producto. Si no hay foto (o la URL no es http/https) se muestra un marcador sobrio
 * con ✦: no se inventan ilustraciones.
 */
export function FotoProducto({ url, alt, className = "" }: { url: string | null; alt: string; className?: string }) {
  const segura = urlSegura(url);
  if (!segura) {
    return (
      <div
        role="img"
        aria-label={`${alt} (sin foto todavía)`}
        className={`flex items-center justify-center bg-crema-2 text-cobre ${className}`}
      >
        <span className="text-3xl" aria-hidden="true">
          ✦
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- fotos del Storage de Supabase; dominio variable según el entorno
  return <img src={segura} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
}
