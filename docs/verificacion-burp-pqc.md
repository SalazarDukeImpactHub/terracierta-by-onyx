# Verificar la protección de pagos con Burp

Esta prueba usa solamente TerraCierta local en `http://127.0.0.1:3100`. El laboratorio está en `/pago/seguridad`; la pasarela está en `/pago/pasarela`. No requiere cookie bancaria, llave de Developer Keys ni un pago. No incluir los dominios de Interledger en el alcance ni enviarles pruebas desde Repeater.

El objetivo observable es comprobar cifrado de aplicación, integridad y validación del cliente. **Burp no ejecuta un ataque cuántico ni demuestra la resistencia matemática de ML-KEM o ML-DSA.**

## 1. Capturar el intercambio de prueba

1. Iniciar la app en el puerto 3100. Mantener el origen configurado como `http://127.0.0.1:3100`; no alternar con `localhost`.
2. En Burp, abrir **Proxy → Open browser** y navegar a `http://127.0.0.1:3100/pago/seguridad`. Limitar el scope a ese host y puerto. Dejar **Intercept off** al cargar la página.
3. Abrir **Ver cómo se protege la comunicación** y pulsar **Comprobar protección PQC**.
4. En **Proxy → HTTP history**, filtrar por `/api/pasarela/`. Debe haber un `GET /api/pasarela/key`, un `POST /api/pasarela/echo` con respuesta `200` y otro POST con respuesta `400`. El segundo POST es una alteración deliberada de una copia de la prueba, no de un pago del usuario.
5. Enviar el primer POST `echo`, el que respondió `200`, a **Repeater**. Conservar una pestaña original y duplicarla para cada modificación. Hacer estas pruebas dentro de cinco minutos; después obtener un sobre nuevo desde el botón.

El JSON enviado contiene `v`, `keyId`, `requestId`, `issuedAt`, `iv`, `ciphertext` y `kem`. La respuesta válida contiene metadatos y `iv`/`ciphertext`; el nonce sintético de la prueba no debe aparecer en claro en el cuerpo HTTP. Base64 es la codificación del ciphertext, no el mecanismo de cifrado. El navegador sí conoce el dato original porque es un extremo autorizado del canal.

`GET /api/pasarela/key` puede establecer `tc_pasarela`, una cookie propia de la demo. **El endpoint echo no exige esa cookie ni autentica usuarios.** No confundirlo con `/api/pagos/key`, que sí exige perfil de la aplicación.

## 2. Cambiar una cosa a la vez en Repeater

| Caso | Modificación desde una copia original | Resultado esperado |
| --- | --- | --- |
| Línea base | Ninguna; reenviar el POST echo original | `200`, respuesta cifrada. Repetir echo está permitido: no ejecuta pagos ni consume referencias anti-replay |
| Ciphertext | Copiar el valor `ciphertext` a Decoder, decodificar Base64, cambiar un byte en vista hexadecimal y codificar otra vez a Base64. Mantener número de bytes y JSON válidos; pegar el nuevo valor | `400` con `{"error":"No se pudo validar el sobre cifrado."}` |
| IV | Cambiar un byte del IV mediante el mismo procedimiento; conservar sus 12 bytes | El mismo `400` |
| Identificador | Cambiar un carácter hexadecimal de `requestId`, conservando el formato UUID y el ciphertext original | El mismo `400`: los metadatos participan en los datos autenticados |
| Fecha | Sumar 1 al número `issuedAt`, conservando el resto | El mismo `400`, aunque siga dentro de la ventana temporal: también cambia el contexto autenticado |
| Ventana temporal | Con Intercept activado antes de generar una nueva prueba, retener el POST original más de cinco minutos y enviarlo sin editar | El mismo `400` por vencimiento; no ejecutarlo con rutas financieras |
| Origen | Cambiar solo `Origin` a `https://otro-origen.invalid` | `403` con `{"error":"Origen no permitido."}`. No necesita que ese dominio exista: solo se cambia la cabecera hacia localhost |
| Tipo de contenido | Cambiar `Content-Type` a `text/plain` | `415` con error de cuerpo JSON |

Dejar que Burp ajuste `Content-Length`. Una codificación rota o JSON inválido solo demuestra validación de formato; por eso la prueba principal cambia un byte conservando tamaño y sintaxis. Si aparece `429`, detenerse y esperar un minuto: el límite es 30 llamadas echo por minuto en el proceso. `429` o `503` no acreditan rechazo criptográfico.

La ruta se autentica dentro de AES-GCM. No cambiar `echo` por `cobrar` para demostrarlo: **esa ruta puede operar fondos**. La prueba local `src/payments/pqc/pqc.test.ts` usa un contexto diferente sin invocar ningún endpoint financiero; la integración simulada también cambia una ruta y comprueba que el servicio no se ejecuta.

## 3. Alterar la vuelta y observar al navegador

1. Volver a `/pago/seguridad` y generar otra comprobación con Intercept activado.
2. Dejar pasar `GET /api/pasarela/key`. En el primer POST echo, seleccionar **Do intercept → Response to this request** y reenviar la solicitud intacta.
3. En su respuesta `200`, modificar un byte de `ciphertext` con el procedimiento anterior y reenviarla al navegador. No modificar la respuesta del segundo POST: ese segundo POST es el control negativo del propio botón.
4. La app debe mostrar un error y **no** el conjunto de resultados satisfactorios. La primera respuesta ya no puede descifrarse/verificarse y la comprobación se interrumpe. La redacción del error del motor WebCrypto puede variar entre navegadores; el criterio es que no haya éxito verificado.

Repetir desde una prueba nueva sustituyendo `requestId` de la respuesta por otro UUID. El cliente debe rechazarla porque no corresponde a la solicitud. También hay claves derivadas distintas para cada dirección: reflejar la solicitud como respuesta se rechaza en los tests del canal.

En una ejecución adicional, interceptar la respuesta de `/api/pasarela/key` y cambiar un carácter hexadecimal de su `keyId`, manteniendo las firmas originales. La app debe rechazar el bundle y no enviar echo. Esto demuestra integridad del bundle firmado. **No demuestra un anclaje de confianza independiente:** quien pudiera sustituir todo el bundle y sus dos claves por otro completamente autofirmado podría superar esa comprobación. El origen/HTTPS es la fuente inicial de confianza; Burp instalado como proxy confiable en el navegador puede modificar ese transporte deliberadamente.

## 4. Sesión, roles, replay y datos comerciales sin mover fondos

En un contexto sin perfil validado, un `GET http://127.0.0.1:3100/api/pagos/key` debe devolver `401`. Cerrar la sesión de la aplicación o usar un contexto nuevo; eliminar solo la cookie `tc_pasarela` no cierra el login. Con `USE_MOCKS=true` la respuesta depende del perfil de demo y no prueba autenticación real.

Un `GET http://127.0.0.1:3100/api/pagos/pago_sintetico_123` debe devolver `405` y no exponer el pago. La consulta comercial usa POST cifrado, perfil y wallet participante. No buscar IDs reales ajenos para esta prueba.

Los controles que podrían activar el riel se verifican con dependencias y SDK simulados:

```sh
npx vitest run src/payments/pqc/pqc.test.ts src/payments/pqcProof.test.ts src/payments/checkout.integration.test.ts src/payments/openPayments.test.ts src/lib/pagos-service.security.test.ts
```

Resultados que deben aparecer como aprobados en esos archivos:

- El mismo sobre comercial se acepta una vez y el replay devuelve `409` cifrado; el servicio de inicio se llama exactamente una vez. Un sobre sellado para otra ruta se rechaza antes del servicio.
- Un comprador inicia pedidos; una cooperativa inicia ofertas; un caficultor consulta su cobro y no inicia pagos de los otros roles. Sin sesión se rechaza el canal comercial; una wallet ajena no obtiene el detalle ni consulta el riel.
- Un sobre cifrado válido con campos adicionales de importe o wallet se rechaza. El importe y el destinatario comerciales proceden del servidor; PQC no decide quién está autorizado a pagar.
- El SDK simulado no crea el outgoing antes de validar consentimiento GNAP, sesión y hash; se comprueba recepción antes de aceptar éxito. Repetición, concurrencia y pérdida de reserva no deben producir envíos duplicados.
- Un comprobante con firma faltante, identidad de firma distinta o monto/destinatario/procedencia que no coincidan se rechaza en el cliente.

Estos tests no prueban el login del compañero ni una conexión real a Supabase/testnet. No reenviar en Burp `/api/pasarela/cobrar`, `/api/pagos/iniciar`, `/api/pagos/oferta` ni ningún `/retorno` para probar replay; incluso un callback GET comercial puede completar un pago autorizado. No copiar cookies, grants, llaves privadas ni cabeceras de autorización al informe.

La comprobación opcional contra los handlers reales de Next sigue limitada a key/echo:

```sh
LOCAL_PASARELA_ORIGIN=http://127.0.0.1:3100 npx vitest run src/payments/local-channel.test.ts
```

## 5. Evidencia específica de PQC: un verificador independiente

Burp demuestra comportamiento del canal. Para contrastar los algoritmos implementados con otro proveedor criptográfico, ejecutar el script sintético de interoperabilidad:

```sh
node --version
node -p 'process.versions.openssl'
/opt/homebrew/opt/openssl@3/bin/openssl version
node scripts/verify-pqc-native.mjs
```

Se necesita Node con `node:crypto` que implemente ML-KEM y ML-DSA y OpenSSL CLI con ML-DSA. El entorno local utilizado es Node 26.0.0 y OpenSSL CLI 3.6.4; no asumir que el Node mínimo de Next tiene esas funciones. Para otro binario compatible:

```sh
PQC_OPENSSL_BINARY=/ruta/al/openssl node scripts/verify-pqc-native.mjs
```

El script genera claves efímeras y datos sintéticos, verifica firmas de la app mediante Node/OpenSSL y encapsulación ML-KEM entre proveedores en ambas direcciones. Debe terminar con código `0` y producir `result.json` en el directorio temporal que imprime: **9 comprobaciones de interoperabilidad/integridad y 2 caracterizaciones de límites**. Las dos últimas comprueban que el bundle totalmente reemplazado puede autofirmarse y que llaves nuevas no verifican recibos anteriores; no son garantías adicionales. El JSON incluye versiones y hashes SHA-256 de las fuentes verificadas. No importa `.env`, auth ni adaptadores financieros.

La factorización educativa con Qiskit se documenta en [la demo del jurado](demo-pqc-jurado.md). Es independiente de Burp y del pago: no rompe claves de producción ni prueba la resistencia de ML-DSA.

## Qué amenaza cubre cada evidencia

| Riesgo del modelo | Evidencia concreta | Límite que permanece |
| --- | --- | --- |
| R03: manipular monto o receptor | Byte alterado rechazado, datos autenticados, esquema estricto y valores comerciales de servidor en tests | Un servidor o JavaScript comprometidos pueden actuar antes o después del cifrado |
| R04: repetir autorización o solicitud | Tests comerciales de sobre único, GNAP, hash y reserva; `409` y una sola llamada al servicio | Echo no ofrece anti-replay; los registros financieros/replay actuales dependen de memoria de proceso |
| R05: usar rol o wallet ajenos | Pruebas de tres roles, sesión ausente y consulta de wallet no participante | Login real e integración de sesión del compañero requieren su propia aceptación |
| R06: falsificar comprobante o perder evidencia histórica | Verificación AND Ed25519 + ML-DSA-65, comparación de identidad/contexto y OpenSSL independiente | Custodia, rotación, anclaje independiente y conservación histórica de llaves siguen pendientes |
| R09: capturar hoy para descifrar en el futuro | Encapsulación ML-KEM interoperable y mensajes de aplicación cifrados de ida/vuelta | Burp no simula al adversario cuántico; no cubre todo ILP/SDK/proveedor ni demuestra forward secrecy ante compromiso del servidor |

Guardar como evidencia la fecha, revisión local examinada, ruta/caso, estado HTTP, error esperado y captura del resultado sin secretos. Un `400` aislado o la mera presencia de Base64 no bastan: conservar también la línea base válida, el cambio de un solo byte y el rechazo de la respuesta en cliente.

Fuentes de uso de Burp: [interceptar tráfico HTTP](https://portswigger.net/burp/documentation/desktop/getting-started/intercepting-http-traffic), [Repeater](https://portswigger.net/burp/documentation/desktop/tools/repeater).


## Registro observado el 17 de octubre de 2026

El MCP de Burp se consultó mediante su transporte SSE local, servidor burp-suite 1.1.2, herramienta `get_proxy_http_history_regex`. Se filtraron rutas de 127.0.0.1:3100 y solo se conservaron método/ruta/estado/fecha e indicador de cifrado; no cuerpos, cookies ni tokens.

- 06:35:23 UTC: `GET /api/pasarela/key` 200; `POST /api/pasarela/echo` válido 200 cifrado; copia alterada 400. La UI mostró ida/vuelta y firmas verificadas, y ambas alteraciones rechazadas.
- Prueba autónoma real posterior con consentimiento manual del titular: `/cobrar` 202 a las 06:37:54 (cotización) y 06:37:59 (solicitud de autorización); `/retorno` 303 a las 06:38:22; `/cobrar` 202 a las 06:38:24 (finalización pendiente); `/cobrar` 201 a las 06:38:35 (consulta completada). Las acciones se identifican por el recorrido operado y el código, no por descifrar tráfico en Burp.

El frontend confirmó el recibo híbrido y envío/recepción del SDK: débito 1,05 EUR y recepción 0,05 EUR. Se consultó el envío existente; no se repitió el cobro desde Repeater. El historial de la app no demuestra por sí solo cuántos movimientos existen en todos los sistemas remotos. El flujo comercial con login real y COP conserva su aceptación pendiente.
