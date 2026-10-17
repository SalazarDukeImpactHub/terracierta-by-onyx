import Image from "next/image";

/**
 * Grano de café de Terracierta. `claro` es para fondos claros y `oscuro` para fondos oscuros (como el pie).
 * Archivos originales en /public/brand.
 */
export function Marca({
  tamano = 40,
  tono = "claro",
  className,
}: {
  tamano?: number;
  tono?: "claro" | "oscuro";
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
      className={className}
    />
  );
}

/**
 * Sello "Café con nombre propio". Va en línea (no como imagen) para que el texto use las tipografías de la página:
 * un SVG cargado como imagen no puede usar las fuentes web y caería a Georgia. La geometría y los colores son los del
 * archivo original (/public/brand/terracierta-sello-*.svg); solo cambia la familia tipográfica.
 */
export function Sello({ tono, className }: { tono: "claro" | "oscuro"; className?: string }) {
  const oscuro = tono === "oscuro";
  const marco = oscuro ? "#F3EDE0" : "#334132";
  const nombre = oscuro ? "#F3EDE0" : "#2A3327";
  const sub = oscuro ? "#b9b8ac" : "#6b7166";
  const lema = oscuro ? "#F3EDE0" : "#334132";
  const surco = oscuro ? "#232C23" : "#F3EDE0";
  const fuente = "var(--font-cormorant), Georgia, serif";

  return (
    <svg viewBox="0 0 300 190" role="img" aria-label="Terracierta by Onyx — Café con nombre propio" className={className}>
      <rect x="16" y="10" width="268" height="170" rx="4" fill="none" stroke={marco} strokeWidth="2" />
      <rect x="22" y="16" width="256" height="158" rx="2" fill="none" stroke="#B0673C" strokeWidth="0.6" />
      <g transform="translate(150 50) rotate(28)">
        <ellipse rx="9" ry="14" fill="#B0673C" />
        <path d="M0 -12 C6 -5 -6 5 0 12" stroke={surco} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </g>
      <text x="153.5" y="100" textAnchor="middle" fontFamily={fuente} fontSize="22" fontWeight="500" letterSpacing="7" fill={nombre}>
        TERRACIERTA
      </text>
      <path d="M120 112 H180" stroke="#B0673C" strokeWidth="1" strokeLinecap="round" />
      <text x="151.5" y="130" textAnchor="middle" fontFamily={fuente} fontSize="10" fontWeight="500" letterSpacing="3" fill={sub}>
        BY ONYX
      </text>
      <text x="150" y="158" textAnchor="middle" fontFamily={fuente} fontSize="16" fontStyle="italic" fontWeight="500" fill={lema}>
        Café con nombre propio
      </text>
    </svg>
  );
}
