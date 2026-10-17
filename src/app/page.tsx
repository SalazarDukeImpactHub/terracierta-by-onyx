import Image from "next/image";
import Link from "next/link";
import { SelectorRol, type OpcionRol } from "@/components/selector-rol";

interface RolInicio {
  id: string;
  etiqueta: string;
  numeral: string;
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
    numeral: "I",
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
    numeral: "II",
    titulo: "Quiero comprar café",
    texto: "Mirá el café de cada finca sin cuenta. Para pagar entrás con tu cuenta: pagás desde tu billetera, directo a su dueño.",
    href: "/tienda",
    accion: "Ver la tienda",
    registro: "/registro?rol=comprador",
  },
  {
    id: "cooperativa",
    etiqueta: "Cooperativa",
    numeral: "III",
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
              Que el caficultor cobre directo, <em className="text-cobre">con nombre propio.</em>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-crema/85 sm:mt-6 sm:text-lg">
              Hoy muchos caficultores dependen de un intermediario que decide cuándo y cómo les paga. Acá cada uno tiene
              su wallet y vende en su tienda o a la mejor cooperativa. Sin promesas grandes: un cobro que se puede ver.
            </p>
            <SelectorRol roles={ROLES.map(paraSelector)} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="etiqueta">Uno · Elegí tu entrada</p>
        <h2 className="mt-2 text-4xl">¿Desde dónde llegás?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {ROLES.map((r) => (
            <article key={r.numeral} className="flex flex-col border border-linea bg-crema-2 p-6">
              <span className="font-titulo text-5xl text-cobre">{r.numeral}</span>
              <h3 className="mt-3 text-2xl">{r.titulo}</h3>
              <p className="mt-2 flex-1 text-apagado">{r.texto}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link href={r.href} className="btn self-start">
                  {r.accion}
                </Link>
                {r.registro && (
                  <Link href={r.registro} className="text-sm text-cobre-oscuro underline">
                    Crear cuenta
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <div className="rombo" aria-hidden="true">
          ◆
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <p className="etiqueta">Dos · Cómo funciona</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cafe-claro p-5 text-crema">
              <p className="font-titulo text-5xl">1</p>
              <p className="mt-1 text-sm text-crema/80">wallet propia por caficultor, de wallet a wallet</p>
            </div>
            <div className="bg-cafe-claro p-5 text-crema">
              <p className="font-titulo text-5xl">0</p>
              <p className="mt-1 text-sm text-crema/80">dinero custodiado por la plataforma</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
