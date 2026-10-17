import { fecha, infoInterledger } from "@/lib/interledger";

const TIPOS: Record<string, string> = { OUTGOING: "Enviado", INCOMING: "Recibido" };
const ESTADOS: Record<string, string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  FAILED: "Fallido",
  REJECTED: "Rechazado",
  APPROVED: "Aprobada",
  FINALIZED: "Cerrada",
};
const MOTIVOS: Record<string, string> = { ISSUED: "Emitida" };

function etiqueta(valor: string, mapa: Record<string, string>) {
  return mapa[valor] ?? valor;
}

function Dato({ etiquetaTexto, valor }: { etiquetaTexto: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <p className="mt-1 break-all text-sm">
      <span className="text-apagado">{etiquetaTexto}: </span>
      {valor}
    </p>
  );
}

export async function BilleteraInterledger({ usuarioId, token }: { usuarioId: string; token?: string | null }) {
  const info = await infoInterledger(usuarioId, token ?? null);
  if (!info) return null;

  return (
    <div className="mt-4 border border-linea bg-crema-2 p-5">
      <p className="etiqueta">Billetera Interledger</p>
      {info.error && (
        <p role="alert" className="mt-2 text-cereza">
          {info.error}
        </p>
      )}

      {info.titular && (
        <div className="mt-4">
          <h2 className="text-2xl">Titular</h2>
          <p className="mt-1 font-medium">
            {info.titular.nombre} {info.titular.apellidos}
          </p>
          <Dato etiquetaTexto="Correo" valor={info.titular.correo} />
          <Dato etiquetaTexto="Dirección" valor={info.titular.direccion} />
          <Dato etiquetaTexto="Cliente" valor={info.titular.clienteId} />
          <p className="mt-1 text-sm text-apagado">
            Identidad {info.titular.necesitaIdentidad ? "pendiente" : "verificada"} · Billetera{" "}
            {info.titular.necesitaBilletera ? "pendiente" : "activa"} · Tarjetas{" "}
            {info.titular.tarjetasVisibles ? "visibles" : "ocultas"}
          </p>
        </div>
      )}

      {info.cuentas.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl">Cuentas</h2>
          <ul className="mt-3 grid gap-4">
            {info.cuentas.map((cuenta) => (
              <li key={cuenta.id} className="border border-linea bg-crema px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-titulo text-2xl">{cuenta.nombre}</p>
                  <p className="font-titulo text-2xl text-cobre-oscuro">{cuenta.saldo}</p>
                </div>
                <Dato etiquetaTexto="Moneda" valor={`${cuenta.moneda} · escala ${cuenta.escala}`} />
                <Dato etiquetaTexto="Saldo en unidades menores" valor={cuenta.saldoMenor} />
                <Dato etiquetaTexto="Cuenta" valor={cuenta.id} />
                <Dato etiquetaTexto="Usuario Interledger" valor={cuenta.usuarioId} />
                <Dato etiquetaTexto="Activo" valor={cuenta.activoId} />
                <Dato etiquetaTexto="GateHub" valor={cuenta.gateHub} />
                <Dato etiquetaTexto="Tarjeta ligada" valor={cuenta.tarjetaId} />
                <p className="mt-1 text-sm text-apagado">
                  Creada {fecha(cuenta.creada)} · Actualizada {fecha(cuenta.actualizada)} ·{" "}
                  {cuenta.fondeada ? "Fondeada" : "Sin fondeo de prueba"} · {cuenta.oculta ? "Oculta" : "Visible"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {info.direcciones.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl">Direcciones de pago</h2>
          <ul className="mt-3 grid gap-4">
            {info.direcciones.map((direccion) => (
              <li key={direccion.id} className="border border-linea bg-crema px-4 py-3">
                <p className="font-medium">{direccion.nombrePublico ?? "Sin nombre público"}</p>
                <Dato etiquetaTexto="Dirección" valor={direccion.url} />
                <Dato etiquetaTexto="Id" valor={direccion.id} />
                <Dato etiquetaTexto="Cuenta" valor={direccion.cuentaId} />
                <Dato etiquetaTexto="Servidor de autorización" valor={direccion.servidorAuth} />
                <Dato etiquetaTexto="Servidor de recursos" valor={direccion.servidorRecursos} />
                <p className="mt-1 text-sm text-apagado">
                  {direccion.activa ? "Activa" : "Inactiva"} · Creada {fecha(direccion.creada)}
                  {direccion.esTarjeta ? " · Asociada a tarjeta" : ""}
                </p>
                {direccion.llaves.length > 0 && (
                  <ul className="mt-3 grid gap-3">
                    {direccion.llaves.map((llave) => (
                      <li key={llave.id} className="border border-linea px-3 py-2">
                        <p className="text-sm font-medium">Llave pública {llave.apodo ? `· ${llave.apodo}` : ""}</p>
                        <Dato etiquetaTexto="Id" valor={llave.id} />
                        <p className="mt-1 text-sm text-apagado">Creada {fecha(llave.creada)}</p>
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs">{llave.publica}</pre>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl">Movimientos</h2>
        {info.movimientos.length === 0 ? (
          <p className="mt-2 text-apagado">No hay movimientos.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {info.movimientos.map((movimiento) => (
              <li key={movimiento.id} className="border border-linea bg-crema px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {etiqueta(movimiento.tipo, TIPOS)} · {etiqueta(movimiento.estado, ESTADOS)}
                  </p>
                  <p className="font-titulo text-xl text-cobre-oscuro">{movimiento.monto}</p>
                </div>
                <Dato etiquetaTexto="Descripción" valor={movimiento.descripcion} />
                <Dato etiquetaTexto="Cuenta" valor={movimiento.cuenta} />
                <Dato etiquetaTexto="Contraparte" valor={movimiento.contraparte} />
                <Dato etiquetaTexto="Wallet de la contraparte" valor={movimiento.contraparteUrl} />
                <Dato etiquetaTexto="Origen" valor={movimiento.origen} />
                <Dato etiquetaTexto="Pago" valor={movimiento.pagoId} />
                <Dato etiquetaTexto="Movimiento" valor={movimiento.id} />
                <p className="mt-1 text-sm text-apagado">
                  {fecha(movimiento.creado)}
                  {movimiento.vence ? ` · Vence ${fecha(movimiento.vence)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-2xl">Autorizaciones</h2>
        {info.autorizaciones.length === 0 ? (
          <p className="mt-2 text-apagado">No hay autorizaciones.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {info.autorizaciones.map((autorizacion) => (
              <li key={autorizacion.id} className="border border-linea bg-crema px-4 py-3">
                <p className="font-medium">
                  {etiqueta(autorizacion.estado, ESTADOS)}
                  {autorizacion.motivo ? ` · ${etiqueta(autorizacion.motivo, MOTIVOS)}` : ""}
                </p>
                <Dato etiquetaTexto="Cliente" valor={autorizacion.cliente} />
                <Dato etiquetaTexto="Id" valor={autorizacion.id} />
                <p className="mt-1 text-sm text-apagado">{fecha(autorizacion.creada)}</p>
                {autorizacion.accesos.map((acceso, indice) => (
                  <div key={`${autorizacion.id}-${indice}`} className="mt-2 text-sm">
                    <p>
                      {acceso.tipo} · {acceso.acciones || "sin acciones"}
                    </p>
                    <Dato etiquetaTexto="Límite" valor={acceso.limite} />
                    <Dato etiquetaTexto="Receptor" valor={acceso.receptor} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-2xl">Tarjetas</h2>
        <p className="mt-2 text-apagado">
          {info.tarjetas.length === 0 ? "Esta cuenta no tiene tarjetas." : `${info.tarjetas.length} tarjeta(s).`}
        </p>
      </div>

      {info.tasas.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl">Tasas</h2>
          <ul className="mt-3 grid gap-4">
            {info.tasas.map((tasa) => (
              <li key={tasa.base} className="border border-linea bg-crema px-4 py-3">
                <p className="font-medium">1 {tasa.base}</p>
                <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  {tasa.pares.map((par) => (
                    <li key={par.moneda}>
                      {par.moneda} {par.valor}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
