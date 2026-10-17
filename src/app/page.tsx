import Image from "next/image";
import { SelectorRol, type OpcionRol } from "@/components/selector-rol";

interface RolInicio {
  id: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  href: string;
  accion: string;
  registro: string | null;
  /** En el selector del encabezado, el botón principal es crear la cuenta (quien llega acá casi siempre es nuevo). */
  principalEsRegistro?: boolean;
}

const ROLES: RolInicio[] = [
  {
    id: "caficultor",
    etiqueta: "Caficultor",
    titulo: "Soy caficultor",
    texto: "Al crear tu cuenta recibís tu wallet propia. Con INVIMA, abrí tu tienda; sin INVIMA, mirá a qué cooperativa venderle tu lote.",
    href: "/acceso",
    accion: "Iniciar sesión",
    registro: "/registro?rol=caficultor",
    principalEsRegistro: true,
  },
  {
    id: "comprador",
    etiqueta: "Comprador",
    titulo: "Quiero comprar café",
    texto: "Mirá el café de cada finca sin cuenta. Para pagar entrás con tu cuenta: pagás desde tu billetera, directo a su dueño.",
    href: "/tienda",
    accion: "Ver la tienda",
    registro: "/registro?rol=comprador",
  },
  {
    id: "cooperativa",
    etiqueta: "Cooperativa",
    titulo: "Soy cooperativa",
    texto: "Revisá las ofertas por lotes que te recomendamos y pagá desde la plataforma.",
    href: "/acceso",
    accion: "Iniciar sesión",
    registro: null,
  },
];

/** Arma lo que muestra el selector del encabezado a partir de la misma lista de roles que usan las tarjetas. */
function paraSelector(r: RolInicio): OpcionRol {
  const { id, etiqueta, titulo, texto } = r;
  if (r.principalEsRegistro && r.registro) {
    return { id, etiqueta, titulo, texto, principal: { texto: "Crear mi cuenta", href: r.registro }, secundaria: { texto: r.accion, href: r.href } };
  }
  return {
    id,
    etiqueta,
    titulo,
    texto,
    principal: { texto: r.accion, href: r.href },
    secundaria: r.registro ? { texto: "Crear cuenta", href: r.registro } : null,
  };
}

const CIFRAS = [
  { cifra: "1", texto: "wallet propia por caficultor, de wallet a wallet" },
  { cifra: "0", texto: "dinero custodiado por la plataforma" },
];

const PASOS = [
  "El caficultor recibe una wallet propia: una dirección de cobro que cualquier billetera puede pagar.",
  "Con INVIMA publica su tienda; sin INVIMA carga su lote y le mostramos las 3 cooperativas que mejor le calzan.",
  "El pagador ve la cotización exacta y aprueba antes de pagar. El dinero va de wallet a wallet.",
  "Queda el recibo y un historial de ingresos propio.",
];

export default function Inicio() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-cafe text-crema">
        <Image
          src="/fotos/cafetal-amanecer.webp"
          alt=""
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          className="-z-20 object-cover object-[60%_50%]"
        />
        {/* Velo oscuro: deja el texto legible sobre la foto, más fuerte a la izquierda donde va el texto. */}
        <div className="absolute inset-0 -z-10 bg-cafe/65 lg:bg-transparent lg:bg-gradient-to-r lg:from-cafe/85 lg:via-cafe/45 lg:to-transparent" />
        <div className="mx-auto flex min-h-[30rem] max-w-6xl items-center px-5 py-8 sm:min-h-[36rem] sm:py-28">
          <div>
            <p className="etiqueta !text-crema/70">Hackatón Open Payments · Medellín 2026</p>
            <h1 className="mt-4 max-w-3xl text-4xl text-white sm:mt-5 sm:text-6xl">
              Que el caficultor cobre directo, <em className="tipeo">
                <span className="tipeo-texto">con nombre propio.</span>
                <span className="tipeo-cursor" aria-hidden="true" />
              </em>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-crema/85 sm:mt-6 sm:text-lg">
              Hoy muchos caficultores dependen de un intermediario que decide cuándo y cómo les paga. Acá cada uno tiene
              su wallet y vende en su tienda o a la mejor cooperativa. Sin promesas grandes: un cobro que se puede ver.
            </p>
            <SelectorRol roles={ROLES.map(paraSelector)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <p className="etiqueta">Cómo funciona</p>
          <h2 className="mt-2 text-4xl">Del lote a la billetera</h2>
          <ul className="cruces mt-6">
            {PASOS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center gap-6">
          <blockquote className="cita">
            Una dirección de cobro propia y portátil, que cualquier billetera puede pagar.
          </blockquote>
          <div className="grid grid-cols-2 gap-5 pt-2">
            {CIFRAS.map((c, i) => (
              // Estilo sello (doble marco, como el logo) y apenas inclinado, como un sello de costal de café.
              <div
                key={c.cifra}
                className={`border-2 border-cafe bg-crema-2 p-1.5 transition-transform duration-200 hover:rotate-0 ${i === 0 ? "-rotate-1" : "rotate-1"}`}
              >
                <div className="flex h-full flex-col items-center border border-cobre/70 px-4 py-6 text-center">
                  <p className="font-titulo text-7xl font-medium italic leading-none text-cobre">{c.cifra}</p>
                  <p aria-hidden="true" className="my-3 text-xs text-cobre">
                    ◆
                  </p>
                  <p className="text-[0.72rem] font-semibold uppercase leading-relaxed tracking-[0.16em] text-tinta">{c.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
