"use client";

import { useActionState } from "react";
import { iniciarSesionAccion, type EstadoFormulario } from "@/app/acceso/actions";

/** Sign in: solo correo y contraseña. El resto (rol, wallet, INVIMA) se detecta solo al entrar. */
export function FormularioAcceso({ siguiente }: { siguiente: string | null }) {
  const [estado, accion, pendiente] = useActionState<EstadoFormulario, FormData>(iniciarSesionAccion, {});

  return (
    <form action={accion} className="mt-8 grid gap-5" noValidate>
      {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}

      <div>
        <label htmlFor="correo" className="etiqueta">
          Correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          defaultValue={estado.valores?.correo}
          required
          className="campo mt-1"
        />
      </div>

      <div>
        <label htmlFor="contrasena" className="etiqueta">
          Contraseña
        </label>
        <input id="contrasena" name="contrasena" type="password" autoComplete="current-password" required className="campo mt-1" />
      </div>

      {estado.error && (
        <p role="alert" className="border border-cereza bg-cereza/10 px-3 py-2 text-cereza">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn btn-bosque self-start" disabled={pendiente}>
        {pendiente ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
