# Handoff: integrar login con la pasarela PQC

Actualizado el 17 de octubre de 2026. Alcance: pagos y evidencia de seguridad. El compañero entrega login, registro, sesión y asociación de wallets. **No crear otro login ni sustituir sus pantallas.** Esta entrega tiene cambios locales sin publicar: un merge de una rama remota no los transporta hasta que el responsable prepare y publique el commit autorizado. Este documento no autoriza commit, push ni despliegue.

## Integración para la IA de login

1. Obtener el commit de entrega confirmado por el responsable; resolver conflictos conservando el login del compañero y los controles de pagos. No seleccionar versiones completas de archivos para resolverlos por conveniencia.
2. Usar Node **26** para reproducir el entorno verificado y la comprobación nativa PQC. Ejecutar `npm ci` con el `package-lock.json` entregado. No instalar paquetes de este documento por separado ni regenerar versiones sin necesidad.
3. Implementar las funciones existentes de `src/auth/index.ts`, manteniendo `src/adapters/types.ts`: `obtenerSesion`, `obtenerPerfil`, `cerrarSesion`. Validar la identidad y cargar rol/wallet en servidor. Devolver `null` ante sesión ausente o inválida.
4. Conservar los tres roles literales y la migración compatible con `comprador`. Validar que sesión y perfil pertenecen a la misma persona. Una wallet ausente impide pagar; nunca usar otra wallet como valor por defecto comercial.
5. Mantener los clientes de `src/payments/checkoutClient.ts` en pedidos, ofertas y estado. No enviar JSON claro al checkout ni añadir acciones que eviten el canal cifrado.
6. Configurar moneda, origen, credenciales de cliente y límites antes de activar el riel real. Los precios comerciales son **COP enteros**; la prueba autónoma EUR no constituye una conversión.
7. Validar primero con SDK/servicios simulados y la matriz de aceptación de este documento. Después probar una operación testnet de extremo a extremo con autorización manual del titular y observar ambas wallets.
8. Registrar el resultado y los pendientes de producción. Un login integrado no aporta persistencia de grants, claves ni seguimiento del SDK.

No se considera completa la integración hasta verificar estas ocho condiciones con el módulo real de login. Actualmente `src/auth/index.ts` sigue siendo un stub; este documento no describe trabajo privado del compañero aún no integrado.

## Dependencias y preparación

El manifiesto/lockfile incluyen `@interledger/open-payments@7.4.0`, `@noble/post-quantum@0.7.1`, `@noble/curves@2.4.0`, Vitest y las dependencias del proyecto. Las regresiones de navegador usan `jsdom` y `@types/jsdom` como dependencias de desarrollo. **No hacen falta un servidor cuántico, una cuenta IBM ni una wallet adicional para ejecutar la suite.**

El lockfile actual de `jsdom@30.1.3` requiere Node `^22.22.2 || ^24.15.0 || >=26.0.0`; el mínimo de Next por sí solo no basta para esa dependencia. Se ha trabajado con Node 26. El verificador independiente también necesita soporte nativo ML-KEM/ML-DSA en Node/OpenSSL y un CLI OpenSSL compatible; ver [evidencia y reproducción](demo-pqc-jurado.md).

```sh
node --version
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Ejecutar el build fuera del servidor de demostración activo: comparte `.next` con desarrollo. **No reiniciar durante una autorización pendiente**, porque el seguimiento de SDK/grants está en memoria. En otro terminal, con desarrollo ya iniciado:

```sh
LOCAL_PASARELA_ORIGIN=http://127.0.0.1:3100 npx vitest run src/payments/local-channel.test.ts
```

Esta última prueba solo llama a key/echo locales; no cotiza ni envía fondos. Revisar también `npm audit` completo: el árbol de herramientas de desarrollo tiene avisos distintos de los paquetes de producción; documentarlos y resolver con una actualización compatible disponible, sin forzar una versión arbitraria para silenciar el informe. Para la simulación didáctica de Shor, opcional y separada de la app, seguir `scripts/quantum/requirements.txt` y [la guía de demo](demo-pqc-jurado.md). No instalar Python/Qiskit como dependencia del login.

## Contrato de identidad y responsabilidades

El punto de conexión comercial es `auth.obtenerPerfil()` desde `src/adapters/auth.ts`. Sus controladores inyectables son `createCheckoutHandlers({ perfil, iniciarPedido, iniciarOferta, consultar }, channel)`; las pruebas sustituyen dependencias sin añadir un bypass público.

```ts
// Contrato existente en src/adapters/types.ts
interface Sesion { userId: string; rol: 'caficultor' | 'cooperativa' | 'comprador' }
interface Perfil {
  id: string;
  rol: 'caficultor' | 'cooperativa' | 'comprador';
  nombre: string;
  municipio: string;
  tiene_invima: boolean;
  wallet_address: string | null;
}
```

`id` debe ser estable y corresponder a `Sesion.userId` y a las referencias comerciales de DB. `tiene_invima` es una condición del caficultor, no un cuarto rol. El login debe mantener la asociación de wallet con la identidad validada y revocar la sesión al cerrar. El módulo de pagos no asigna wallets durante el registro.

| Rol validado | Recorrido comercial | Validaciones de pagos |
| --- | --- | --- |
| `comprador` | Compra desde tienda/checkout | Producto publicado y cantidad; precio y vendedor de DB; wallet pagadora del perfil; consentimiento GNAP |
| `cooperativa` | Paga una oferta propia aceptada | Propiedad y estado; lote/caficultor correspondiente; importe y wallets de DB; consentimiento GNAP |
| `caficultor` | Consulta sus cobros | Wallet participante comprobada en servidor; no se añade aprobación por recibir |

La selección visual de rol nunca concede permisos. No aceptar `rol`, `usuarioId`, precio o wallets del navegador como autoridad. Conservar `src/lib/roles.ts → rutaSegura` al usar `/acceso?siguiente=<ruta interna>`; rechazar retornos externos.

`USE_MOCKS=true` selecciona **ambos** adaptadores: auth y pagos. `tc_demo_perfil` es una selección de fixtures de `src/adapters/mocks/auth.ts`, no autenticación. Cambiar a `USE_MOCKS=false` solo tras integrar/configurar ambos módulos reales. No mezclar sesiones de demo con fondos externos mediante excepciones a los controladores.

## Rutas y transporte que debe conservar el integrador

| Ruta | Contrato |
| --- | --- |
| `GET /api/pagos/key` | Exige perfil autenticado; entrega exclusivamente llaves públicas |
| `POST /api/pagos/iniciar` | Sobre PQC; contenido lógico `{ productoId, cantidad }`; solo comprador |
| `POST /api/pagos/oferta` | Sobre PQC; contenido lógico `{ ofertaId }`; solo cooperativa |
| `POST /api/pagos/{id}` | Sobre PQC; contenido lógico `{}`; exige wallet participante |
| `GET /api/pagos/{id}` | Responde 405; la consulta protegida es POST |
| `GET /api/pasarela/retorno?checkoutState=...` | Retorno comercial GNAP; verifica cookie/estado/hash y reserva de DB antes de enviar; **no es una consulta** |
| `GET /api/pasarela/retorno?state=...` | Retorno de la prueba autónoma; valida consentimiento y vuelve a su pantalla |

Usar `iniciarCheckoutProtegido`, `iniciarOfertaProtegida` y `consultarCheckoutProtegido` de `checkoutClient.ts`. Inicio y consulta comerciales requieren cifrado; el escudo didáctico no puede apagarlos. `checkoutHandlers.ts` verifica rol; `pagos-service.ts` obtiene importes/wallets y valida participantes. Antes de enviar, `checkoutReservation.ts` coteja referencia, estado, importe y wallets contra DB. La oferta usa reserva condicional para impedir dos autorizaciones utilizables sobre la misma versión.

El contexto de servidor registra `canalPqc`; el navegador no puede afirmarlo mediante un booleano. Para marcar un pago real completado, se comprueban recepción, envío y comprobante con **ambas** firmas, Ed25519 y ML-DSA-65, vinculadas a importe, receptor, ID y contexto.

Una sesión TerraCierta identifica a la persona en la aplicación. **GNAP concede permiso al titular para gastar desde su wallet**; el login no sustituye ese consentimiento. `OPEN_PAYMENTS_CLIENT_WALLET` y su llave identifican al cliente TerraCierta; no son la wallet pagadora del comprador ni un permiso ilimitado.

El riel actual solo admite wallets y recursos HTTPS de `*.interledger-test.dev` mediante `testnetUrl`; asociar wallets de esa testnet para la aceptación. Incorporar otro proveedor requiere revisar descubrimiento y restricciones de red, no eliminar la validación.

No reenviar contraseñas/cookies bancarias al SDK. El endpoint privado de la web `/quotes` fue retirado del flujo; no incorporarlo para omitir aprobación. Las cookies propias `tc_pasarela` y `tc_checkout_gnap` vinculan estado/retorno; no son autenticación bancaria ni reemplazan `auth.obtenerPerfil()`. Mantener navegador y origen exactos durante el retorno: `localhost` y `127.0.0.1` son distintos.

## Configuración: nombres exactos, sin secretos

Copiar `.env.example` a una configuración privada y completar solo en servidor:

| Variables | Uso |
| --- | --- |
| `USE_MOCKS` | `true` simula login y pagos; `false` usa los módulos reales |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Configuración pública del cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Exclusivamente servidor; nunca `NEXT_PUBLIC_` |
| `PAYMENTS_RAIL=open-payments` | SDK oficial; el adaptador web con cookies no se admite |
| `OPEN_PAYMENTS_CLIENT_WALLET`, `OPEN_PAYMENTS_KEY_ID` | Identidad pública del cliente registrada con su llave |
| `OPEN_PAYMENTS_PRIVATE_KEY_PATH` o `OPEN_PAYMENTS_PRIVATE_KEY` | Llave privada desde archivo local o gestor de secretos; no copiar al repo |
| `OPEN_PAYMENTS_SENDER_WALLET` | Solo pagador temporal de la prueba autónoma; no sustituye la wallet del perfil |
| `OPEN_PAYMENTS_REDIRECT_ORIGIN`, `NEXT_PUBLIC_SITE_URL` | Mismo origen exacto; local `http://127.0.0.1:3100` |
| `OPEN_PAYMENTS_MAX_RECEIVE`, `OPEN_PAYMENTS_MAX_DEBIT` | Límites independientes en unidades mayores; el débito incluye el adicional del proveedor |
| `PAYMENTS_EXECUTION_ENABLED=false` | Permite cotizar y bloquea autorización/ejecución; recomendado al configurar por primera vez |
| `PASARELA_DEMO_ENABLED=false` | Mantiene deshabilitada la API de demo en producción por defecto |

`.env.example` trae `PAYMENTS_EXECUTION_ENABLED=true`: establecer explícitamente `false` en el entorno de integración antes de explorar. Habilitar ejecución solo para la prueba acordada del titular. No copiar `.env.local`, llaves de Downloads ni cookies del chat entre máquinas. Preservar `serverExternalPackages: ['@interledger/open-payments']` de `next.config.ts` y el loader Tailwind limitado a `globals.css`; los CSS Modules necesitan su procesamiento nativo.

**Bloqueo comercial de moneda/límite:** `montoCop` representa pesos colombianos enteros y el SDK exige que la wallet receptora reciba COP. Los límites de ejemplo `0.05` no permiten pedidos comerciales de miles de COP. Acordar wallet receptora COP soportada y límites explícitos apropiados, o un contrato de precio/conversión validado por el equipo. No cambiar una etiqueta EUR a COP ni inventar una tasa. Una wallet pagadora de otra moneda puede necesitar conversión cotizada por el proveedor; lo recibido debe coincidir con el precio acordado.

La prueba EUR de 0,05 es independiente del catálogo. Se observó débito 1,05 y recepción 0,05; el adicional viene de la cotización del proveedor. No presentarlo como comisión cobrada por TerraCierta ni como tarifa conciliada sin verificar los movimientos de ambas wallets. Ver `investigacion-pagos-pqc.md`.

## Presentación y evidencia PQC

`/pago/pasarela` presenta tres roles y acceso al recorrido comercial del perfil. Sin perfil, comprador/cooperativa pueden ver un formulario autónomo compacto expresamente identificado con la wallet de prueba del servidor; no equivale a cuenta comercial. El caficultor solo consulta. La vista técnica conserva `?prueba=1` y el retorno `?autorizacion=...`.

`/pago/seguridad` concentra el laboratorio. Sus claves efímeras tienen tamaños reales; el ataque de firma concede deliberadamente la clave clásica del laboratorio para falsificar un receptor. El verificador clásico acepta la firma nueva y la política de ambas firmas la rechaza. **No es una recuperación real por Shor de Ed25519.** La simulación pequeña de Shor se etiqueta por separado y no demuestra romper una clave de producción. El juego no modifica permisos ni protección de pagos.

La prueba autónoma conserva un checkpoint en `sessionStorage` antes de finalizar un retorno. Tras perder una respuesta o recargar, ese checkpoint permite solo consultar; una autorización vencida antes del envío o un intento irrecuperable muestra revisión de wallet y bloquea otro inicio. Cerrar la revisión exige declaración explícita de conciliación y no cancela ni devuelve fondos. Esto no sustituye la persistencia de servidor ni cubre borrar el almacenamiento del navegador. Las regresiones DOM usan SDK simulado y StrictMode.

`CanalPqcDemo` compara el mismo mensaje sintético por ECDH P-256 y por ML-KEM-768, con HKDF/AES-256-GCM en ambas direcciones y cambios de bit rechazados en solicitud/respuesta. El compromiso clásico entrega deliberadamente una clave efímera del laboratorio; no ejecuta Shor. La clave ECDH concedida no abre el mensaje PQC, pero ese rechazo no demuestra por sí solo resistencia cuántica. Ambos extremos se simulan en el navegador, sin tráfico financiero; el interruptor cambia únicamente la vista del experimento.

`comprobarPqc` llama exclusivamente a `/api/pasarela/key` y `/api/pasarela/echo`: nonce sintético, ida/vuelta cifrada y modificación rechazada. Echo es público, no consume referencias anti-replay financieras ni constituye comprobante de pago. La [guía de Burp](verificacion-burp-pqc.md) limita las alteraciones a esas rutas locales. **No reenviar cobrar, iniciar, oferta o retornos reales** para probar replay.

`node scripts/verify-pqc-native.mjs` aporta nueve controles de interoperabilidad/integridad con Node/OpenSSL y evidencia dos límites: un bundle autofirmado completo puede sustituirse si se sustituye su distribución de confianza, y nuevas llaves no verifican recibos históricos sin conservar las anteriores. No son riesgos resueltos. Ver [demo](demo-pqc-jurado.md) e [investigación de simuladores](investigacion-simuladores-cuanticos.md).

## Aceptación con el login real

**Prueba autónoma real completada el 17 de octubre de 2026:** el titular aceptó manualmente GNAP en Test Wallet; la pantalla pasó de pendiente a completado tras una consulta y mostró comprobante protegido verificado, envío y recepción comprobados con Open Payments. Importe técnico: débito 1,05 EUR y recepción 0,05 EUR. Burp MCP confirmó la secuencia local 06:37:54/06:37:59 UTC → POST `cobrar` 202/202; 06:38:22 → retorno 303; 06:38:24 → POST `cobrar` 202; 06:38:35 → consulta 201. Los cuerpos permanecieron cifrados. El estado HTTP por sí solo no prueba el número de outgoing remotos ni sustituye conciliar movimientos de wallet. Esta prueba valida el formulario autónomo y su retorno: **el checkout comercial con login real y precios COP sigue pendiente de aceptación**.

| Caso | Resultado requerido |
| --- | --- |
| Sin sesión, expirada o revocada | Llaves comerciales/inicio/consulta no habilitan operaciones |
| Comprador paga producto | Identidad y wallet propias; precio/vendedor de DB; consentimiento del titular |
| Cooperativa paga oferta propia | Propiedad/estado verificados; importe y caficultor correctos |
| Rol incorrecto, oferta ajena, wallet ausente | Rechazo antes de ejecutar fondos |
| Caficultor consulta su cobro | Consulta como participante; no obtiene funciones de pagador |
| Cualquier rol consulta pago ajeno | No obtiene detalles ni sincroniza una operación ajena |
| Alterar rol/precio/wallet en HTTP | No altera autoridad ni compra; sobre alterado se rechaza |
| Cerrar/cambiar cuenta | Las siguientes peticiones usan identidad vigente; no retienen acceso de la cuenta anterior |
| Autorizar después de cerrar/cambiar cuenta | El retorno exige perfil vigente, rol, wallet y propietario de DB correctos; rechazo antes de validar GNAP/enviar |
| Dos solicitudes/callbacks concurrentes | No habilitan doble envío; resultado incierto conserva bloqueo de inicio |
| Cotización vencida, recarga, red interrumpida o reinicio | Mensaje visible y recuperación solo de consulta cuando exista incertidumbre; nunca reenvío automático |
| Pago recibido completo | Importe/destino coinciden; envío y recepción observados; ambas firmas verificadas |

El callback comercial vuelve a consultar `auth.obtenerPerfil()` y compara rol, wallet y propietario de DB antes de continuar GNAP/enviar. Las pruebas con dependencias simuladas comprueban cierre/cambio de cuenta y que no se llama a autorización ni a envío en esos casos. Repetir con la sesión real del compañero. Rechazar el retorno en TerraCierta no equivale a revocar automáticamente un grant concedido en el proveedor.

Las pruebas actuales inyectan SDK, perfil y servicios/DB; validan el comportamiento de pagos, no el login real ni la conexión a Supabase. La aceptación final requiere comprador real → precio/moneda de DB → wallet correcta → aprobación manual → envío único → recepción confirmada → pedido completado. Conservar únicamente IDs y cantidades públicas como evidencia; ningún token o cookie.

## Límites pendientes para producción

- Grants, seguimiento del SDK, referencias de replay y claves PQC están en memoria de un proceso. Reinicios y varias réplicas requieren persistencia coordinada, idempotencia durable y conciliación. Un mensaje de recuperación visible no implementa esa infraestructura.
- No hay Vault/HSM, ejecutor aislado ni historial durable de llaves. La distribución inicial de llaves sigue dependiendo del origen/HTTPS; el bundle autofirmado no aporta una raíz independiente.
- El canal ML-KEM-768/HKDF/AES-256-GCM protege navegador → TerraCierta. No convierte el riel Interledger, el proveedor o todos los enlaces externos en postcuánticos. La app local HTTP no constituye una medición TLS.
- Una firma certifica la observación de TerraCierta; no es firma bancaria. Interoperabilidad no equivale a auditoría criptográfica, certificación FIPS ni cumplimiento PCI DSS. PQC no repara autenticación, XSS, pérdida de estado ni errores de negocio.

No anunciar disponibilidad de producción hasta resolver esos puntos según el despliegue elegido. Esta entrega permite integrar login y demostrar protección PQC con sus límites expresos.
