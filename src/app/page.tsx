import Link from "next/link";
import { Sello } from "@/components/marca";

const ROLES = [
  {
    numeral: "I",
    titulo: "Soy caficultor",
    texto: "Al crear tu cuenta recibís tu wallet propia. Con INVIMA, abrí tu tienda; sin INVIMA, mirá a qué cooperativa venderle tu lote.",
    href: "/acceso",
    accion: "Iniciar sesión",
    registro: "/registro?rol=caficultor",
  },
  {
    numeral: "II",
    titulo: "Quiero comprar café",
    texto: "Mirá el café de cada finca sin cuenta. Para pagar entrás con tu cuenta: pagás desde tu billetera, directo a su dueño.",
    href: "/tienda",
    accion: "Ver la tienda",
    registro: "/registro?rol=comprador",
  },
  {
    numeral: "III",
    titulo: "Soy cooperativa",
    texto: "Revisá las ofertas por lotes que te recomendamos y pagá desde la plataforma.",
    href: "/acceso",
    accion: "Iniciar sesión",
    registro: null,
  },
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
      <section className="bg-bosque-hondo text-crema">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[1fr_20rem]">
          <div>
            <p className="etiqueta !text-crema/70">Hackatón Open Payments · Medellín 2026</p>
            <h1 className="mt-5 max-w-3xl text-5xl text-white sm:text-6xl">
              Que el caficultor cobre directo, <em className="text-cobre">con nombre propio.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-crema/85">
              Hoy muchos caficultores dependen de un intermediario que decide cuándo y cómo les paga. Acá cada uno tiene
              su wallet y vende en su tienda o a la mejor cooperativa. Sin promesas grandes: un cobro que se puede ver.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/registro?rol=caficultor" className="btn">
                Crear mi cuenta de caficultor
              </Link>
              <Link href="/tienda" className="btn btn-borde !border-crema !text-crema hover:!bg-crema hover:!text-tinta">
                Ver la tienda
              </Link>
            </div>
          </div>
          <Sello tono="oscuro" className="hidden w-full lg:block" />
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
                <Link href={r.href} className="btn btn-bosque self-start">
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
            <div className="bg-bosque p-5 text-crema">
              <p className="font-titulo text-5xl">1</p>
              <p className="mt-1 text-sm text-crema/80">wallet propia por caficultor, de wallet a wallet</p>
            </div>
            <div className="bg-bosque p-5 text-crema">
              <p className="font-titulo text-5xl">0</p>
              <p className="mt-1 text-sm text-crema/80">dinero custodiado por la plataforma</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
