"use client";

import { useActionState, useState } from "react";
import { registrarseAccion, type EstadoFormulario } from "@/app/acceso/actions";
import { TIPOS_DOCUMENTO } from "@/lib/validacion";

type RolRegistro = "caficultor" | "comprador";

/**
 * Sign up: aquí se SOLICITAN los datos de la persona. La pregunta del INVIMA aparece solo para caficultores y se
 * responde una vez, al crear la cuenta; después la página la lee del perfil y no vuelve a preguntarla.
 */
export function FormularioRegistro({ rolInicial, siguiente }: { rolInicial: RolRegistro | null; siguiente: string | null }) {
  const [estado, accion, pendiente] = useActionState<EstadoFormulario, FormData>(registrarseAccion, {});
  const [rol, setRol] = useState<RolRegistro | "">(rolInicial ?? (estado.valores?.rol as RolRegistro | undefined) ?? "");
  const v = estado.valores ?? {};

  return (
    <form action={accion} className="mt-8 grid gap-6" noValidate>
      {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}

      <fieldset>
        <legend className="etiqueta">Quiero registrarme como</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["caficultor", "Caficultor", "Cobro mi café en mi propia wallet"],
              ["comprador", "Comprador", "Compro café y pago desde mi wallet"],
            ] as const
          ).map(([valor, titulo, ayuda]) => (
            <label
              key={valor}
              className={`flex cursor-pointer flex-col border px-4 py-3 ${rol === valor ? "border-tinta bg-crema-2" : "border-linea"}`}
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="rol" value={valor} checked={rol === valor} onChange={() => setRol(valor)} required />
                <span className="font-titulo text-xl">{titulo}</span>
              </span>
              <span className="mt-1 text-sm text-apagado">{ayuda}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nombres" className="etiqueta">
            Nombres
          </label>
          <input id="nombres" name="nombres" autoComplete="given-name" defaultValue={v.nombres} maxLength={60} required className="campo mt-1" />
        </div>
        <div>
          <label htmlFor="apellidos" className="etiqueta">
            Apellidos
          </label>
          <input id="apellidos" name="apellidos" autoComplete="family-name" defaultValue={v.apellidos} maxLength={60} required className="campo mt-1" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo_documento" className="etiqueta">
            Tipo de documento
          </label>
          <select id="tipo_documento" name="tipo_documento" defaultValue={v.tipo_documento || ""} required className="campo mt-1">
            <option value="" disabled>
              Elige uno
            </option>
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="numero_documento" className="etiqueta">
            Número de documento
          </label>
          <input
            id="numero_documento"
            name="numero_documento"
            defaultValue={v.numero_documento}
            minLength={5}
            maxLength={20}
            required
            className="campo mt-1"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fecha_nacimiento" className="etiqueta">
            Fecha de nacimiento
          </label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            autoComplete="bday"
            defaultValue={v.fecha_nacimiento}
            required
            className="campo mt-1"
          />
        </div>
        <div>
          <label htmlFor="municipio" className="etiqueta">
            Municipio
          </label>
          <input id="municipio" name="municipio" defaultValue={v.municipio} maxLength={60} required className="campo mt-1" />
        </div>
      </div>

      {rol === "caficultor" && (
        <fieldset>
          <legend className="etiqueta">¿Tienes INVIMA?</legend>
          <p className="mt-1 text-sm text-apagado">
            De eso depende tu camino: con INVIMA abres tu tienda; sin INVIMA le vendes tu lote a una cooperativa. Lo respondes
            una sola vez, aquí.
          </p>
          <div className="mt-2 flex gap-6">
            {(
              [
                ["si", "Sí, tengo INVIMA"],
                ["no", "No, todavía no"],
              ] as const
            ).map(([valor, texto]) => (
              <label key={valor} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="tieneInvima" value={valor} defaultChecked={v.tieneInvima === valor} required />
                {texto}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="correo" className="etiqueta">
            Correo
          </label>
          <input id="correo" name="correo" type="email" autoComplete="email" defaultValue={v.correo} required className="campo mt-1" />
        </div>
        <div>
          <label htmlFor="contrasena" className="etiqueta">
            Contraseña (mínimo 8 caracteres)
          </label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="campo mt-1"
          />
        </div>
      </div>

      <p className="text-sm text-apagado">
        La cuenta queda guardada con tu documento y tu municipio. La billetera de Interledger se carga después, directo en tu usuario.
      </p>

      {estado.error && (
        <p role="alert" className="border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn self-start" disabled={pendiente}>
        {pendiente ? "Creando tu cuenta…" : "Crear mi cuenta"}
      </button>
    </form>
  );
}
