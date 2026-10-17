# Handoff: pasarela Open Payments y login

Para la IA que integra el trabajo de login con pagos. Rama de entrega: `feat/pqc-quotes-send`. Base de esta entrega: `68ab3e0`. Consultar el commit final con `git log -1`. No sustituir módulos completos al resolver conflictos; preservar el trabajo de login del compañero.

## Estado y alcance

Pasarela independiente en `/pago/pasarela`, puerto local 3100. SDK oficial `@interledger/open-payments@7.4.0`, autorización GNAP, protección PQC de navegador a TerraCierta y comprobantes con dos firmas. No implementa login. `src/auth` y `src/adapters/types.ts` se conservan.

La demo no representa el precio del catálogo: 0,05 EUR es un importe técnico configurado. Se observó una cotización de 1,05 EUR de débito por 0,05 EUR recibidos. La diferencia de 1 EUR la devuelve el proveedor; no es una comisión creada por TerraCierta. No se concilió todavía el movimiento real ni la tarifa administrativa desplegada. Ver `investigacion-pagos-pqc.md`.

Estado de integración: listo para conectar el contrato de login y probarlo; no se afirma que el checkout comercial o un pago real completo estén validados. Quedan pendientes moneda, estado durable y aceptación manual del titular.

## Archivos y responsabilidades

- `src/payments/index.ts`: implementa `iniciarPago` y `consultarPago`.
- `src/payments/sdkAdapter.ts`: checkout del catálogo, sesión de retorno y selección de wallet pagadora desde `input.walletPagador`.
- `src/payments/openPayments.ts`: descubrimiento, incoming, quote, grants, validación GNAP y outgoing. Rechaza importes recibidos distintos de lo solicitado.
- `src/payments/gateway.ts`: demo autónoma, confirmación de un uso y estado por sesión.
- `src/payments/gatewayClient.ts`: canal del navegador y verificación de cotización/comprobante.
- `src/payments/pqc/`: ML-KEM-768, HKDF-SHA-256/AES-256-GCM, Ed25519 + ML-DSA-65.
- `src/payments/amounts.ts`: diferencia entre débito y recepción solo para la misma moneda y escala, con enteros exactos.
- `src/app/pago/pasarela/`: pantalla sencilla; separar vendedor, adicional de wallet y total.
- `src/app/api/pasarela/retorno/route.ts`: retorno compartido; `checkoutState` usa adaptador de checkout, `state` usa gateway de demo.
- `src/lib/pagos-service.ts` y `src/adapters/payments.ts`: integración existente de tienda/DB. No se modificaron en esta entrega.

## Conectar login

1. Implementar el contrato existente de `src/auth/index.ts`: sesión y perfil validados en servidor. El perfil incluye `wallet_address` y rol comprador; preservar rutas internas seguras de retorno.
2. Mantener `iniciarPagoDePedido` como punto de entrada del checkout: importe y vendedor salen de la base, comprador de su perfil. No aceptar wallet pagadora, receptora ni precio arbitrarios del navegador.
3. El `walletPagador` del contrato ahora se pasa al riel oficial como wallet del titular que debe aprobar. La configuración `OPEN_PAYMENTS_SENDER_WALLET` solo es el valor temporal de la demo autónoma; no debe sustituir la wallet del perfil en checkout.
4. `OPEN_PAYMENTS_CLIENT_WALLET` y su llave identifican al cliente TerraCierta. No son la wallet del comprador ni una autorización para gastar: el comprador concede su propio grant GNAP limitado a débito y receptor.
5. Login de TerraCierta y consentimiento de Test Wallet son procesos separados. No reenviar a pagos cookies ni contraseña de Test Wallet. No trasladar el endpoint web `/quotes`: fue retirado porque el usuario reportó movimiento de fondos al llamarlo.
6. Activar `USE_MOCKS=false` solo cuando ambos módulos reales estén configurados. Actualmente este interruptor es compartido por auth/pagos; no confundir simulación con prueba externa.

## Contrato público (sin cambios)

```ts
iniciarPago({
  tipo: 'pedido' | 'oferta',
  referenciaId: string,
  montoCop: number, // entero de pesos colombianos; no céntimos EUR
  walletReceptor: string,
  walletPagador: string,
  urlRetorno: string,
}): Promise<{ pagoId: string; redirectUrl: string | null; estado: EstadoPago }>
consultarPago(pagoId: string): Promise<{ estado: EstadoPago; detalle: Record<string, unknown> }>
```

El checkout necesita wallet receptora COP para representar `montoCop` directamente. Con la wallet de demo EUR se rechaza la operación antes del consentimiento. No solucionar esto cambiando la etiqueta de moneda ni multiplicando por una tasa inventada. Alternativas: wallet receptora COP soportada, o contrato de precios/conversión explícito acordado con el equipo. El proveedor puede convertir la moneda del comprador al cotizar, si soporta ese par; la moneda recibida debe corresponder al precio acordado.

## Flujo y garantías

1. Crear incoming por el importe solicitado para el vendedor; cotejar valor, moneda y escala devueltos.
2. Crear quote oficial; cotejar la recepción exacta y limitar el débito total mediante `OPEN_PAYMENTS_MAX_DEBIT`.
3. Mostrar cantidades antes de confirmar. No reducir el monto del vendedor para caber en el límite ni ocultar un adicional.
4. Solicitar grant saliente limitado al débito y al incoming. El titular aprueba en su wallet.
5. Verificar nonce cliente/servidor, referencia de interacción y URI de autorización con SHA-256; aceptar Base64 de Rafiki y Base64URL canónicos. Verificar sesión y estado. No omitir la comprobación del hash.
6. Crear outgoing una sola vez. La demo valida el GET y finaliza con un POST desde su pantalla; el checkout finaliza durante el callback tras validar GNAP. No precargar ni repetir este callback como si fuera una consulta.
7. Consultar outgoing e incoming. Emitir comprobante híbrido únicamente cuando la recepción está completada por el importe requerido y el envío es positivo, consistente y sin fallo.

`debitAmount` puede incluir tarifas; `sentAmount` puede excluirlas. No exigir igualdad entre ambos, ni comparar monedas diferentes por resta.

Las cookies `tc_pasarela` y `tc_checkout_gnap` son propias, HttpOnly/SameSite=Lax. No son credenciales bancarias. Para probar el retorno debe conservarse navegador y origen exacto (127.0.0.1 y localhost son orígenes diferentes).

## Configuración privada

Copiar `.env.example` y completar variables **solo en servidor**:

- `PAYMENTS_RAIL=open-payments`.
- `OPEN_PAYMENTS_CLIENT_WALLET`, `OPEN_PAYMENTS_KEY_ID`, `OPEN_PAYMENTS_PRIVATE_KEY_PATH` (local) o `OPEN_PAYMENTS_PRIVATE_KEY` (secret manager).
- `OPEN_PAYMENTS_SENDER_WALLET`: únicamente wallet temporal de demo.
- `OPEN_PAYMENTS_REDIRECT_ORIGIN` y `NEXT_PUBLIC_SITE_URL`: mismo origen; local `http://127.0.0.1:3100`.
- `OPEN_PAYMENTS_MAX_RECEIVE` y `OPEN_PAYMENTS_MAX_DEBIT`: unidades mayores; límites independientes. Los límites de prueba actuales no sirven para pedidos de miles de COP.
- `PAYMENTS_EXECUTION_ENABLED=false`: bloquea autorización/ejecución, permite cotizar.
- `PASARELA_DEMO_ENABLED=false`: impide exponer la demo pública en producción por defecto.

La llave y cookies locales no viajan en Git. En otro equipo hay que configurar credenciales propias; no copiar `.env.local`, Downloads ni valores del chat al repositorio. Conservar `serverExternalPackages: ['@interledger/open-payments']` en Next: el SDK carga especificaciones YAML en runtime.

## Pruebas y pendientes reales

```sh
npm ci
npm test
npm run typecheck
npx eslint src/payments src/app/pago/pasarela src/app/api/pasarela
npm run build
npm audit --omit=dev
npm run dev -- --hostname 127.0.0.1 --port 3100
LOCAL_PASARELA_ORIGIN=http://127.0.0.1:3100 npx vitest run src/payments/local-channel.test.ts
```

La última prueba solo usa key/echo, sin cotizaciones ni pagos externos. Las pruebas del SDK usan simulaciones locales y cubren sesiones equivocadas, hash alterado, replay, confirmación anticipada, concurrencia, sobreprecio fuera del límite, monedas incompatibles, importes cambiados, proveedor con comisiones y pérdida de estado.

Prueba de aceptación del equipo: comprador real autenticado → precio de DB y moneda acordada → wallet correcta → cotización visible → aprobación manual → envío único → recepción comprobada → pedido completado. Registrar IDs del outgoing/incoming y movimientos de ambas wallets sin secretos. No se ha completado todavía esta validación con login real.

Persistencia pendiente: estado, grants y llaves PQC están en memoria de un proceso. Un reinicio puede perder seguimiento y cambiar llaves; el pago se reporta pendiente/incierto, nunca fallido por ausencia del registro. No desplegar con varias réplicas/serverless sin persistir estado y coordinar idempotencia. Una firma del comprobante certifica la observación de TerraCierta, no una firma bancaria ni una garantía postcuántica de todo Interledger.

## Integración Git por la IA del compañero

En una rama de integración con su trabajo ya guardado:

```sh
git fetch origin
git merge origin/feat/pqc-quotes-send
```

Resolver conflictos preservando login, rutas y los contratos. Revisar especialmente `package.json`, lockfile, `.env.example`, `next.config.ts`, cabecera/pie y documentación compartida. No reemplazar el lockfile a mano: resolver el manifiesto y regenerar con npm si hace falta. Ejecutar las pruebas anteriores después de resolver. No usar `reset --hard`, `push --force` ni compartir secretos para arreglar conflictos.

No se fusiona main automáticamente desde la rama de pagos. Las ramas remotas de otros compañeros se dejan para la IA que coordina la integración.

## Propuestas de Open Payments

Prioridad de integración: cobro por pedido con recepción fija, wallet del perfil, consentimiento limitado y seguimiento/comprobante. Siguiente etapa: cotización entre monedas soportadas con precio vendedor preservado; verificación de titularidad de wallet para el registro; grants revocables y de privilegio mínimo. Después: reparto vendedor/plataforma transparente y suscripciones de café con límites e intervalos explícitos. Los repartos requieren varios pagos y manejo de resultados parciales; no prometer atomicidad. Una devolución también requiere otro pago autorizado, no revertir localmente un estado.

Fuentes: [flujo](https://openpayments.dev/concepts/op-flow/), [cotizaciones](https://openpayments.dev/sdk/quote-create/), [repartos](https://openpayments.dev/guides/split-payments/), [recurrencia](https://openpayments.dev/guides/recurring-subscription-incoming-amount/).

## Diseño futuro: pago rápido y aprobación desde reloj

No implementado en esta rama. La cookie persistente de TerraCierta no sustituye un grant ni demuestra aprobación del titular. El SDK no utiliza la cookie de sesión de Test Wallet.

Open Payments documenta [grants para pagos futuros](https://openpayments.dev/guides/outgoing-grant-future-payments/): el titular puede autorizar previamente un presupuesto/intervalo y la app puede operar dentro del permiso concedido. Para una versión rápida, conservar el token solo en servidor, comprobar límites efectivos, revocación y consentimiento, y acotar destinatarios cuando el caso lo permita. No reutilizar un grant de un solo incoming para otro pedido ni saltar el consentimiento mediante el endpoint web `/quotes`.

Una app watchOS podría enviar la aprobación al iPhone conectado mediante [Watch Connectivity](https://developer.apple.com/documentation/watchconnectivity). El reloj sin internet propio no equivale a un sistema completamente desconectado: el iPhone necesita conexión para enviar la autorización al servidor. Sin conexión de ningún dispositivo, una aprobación local se mantiene pendiente y puede vencer; no se muestra como autorizada por el proveedor o pagada.

Una aprobación de dispositivo debe vincularse a pedido, importe vendedor, máximo de débito, moneda, destinatario, nonce, vencimiento e identidad del dispositivo; el servidor verifica firma, sesión, consumo único y estado. Esto es una comprobación de la app, no un reemplazo automático del consentimiento GNAP: para que la wallet acepte directamente el reloj se requiere soporte de su proveedor/IdP.

Ida/vuelta: el canal implementado cifra solicitud y respuesta con claves distintas y contexto autenticado, y valida cotización/comprobante. El retorno GNAP verifica hash, sesión y estado, seguido de observación del pago por API. Los futuros canales reloj–teléfono y teléfono–backend necesitarían su propio diseño de autenticación y validación; no heredan PQC por reutilizar una cookie.
