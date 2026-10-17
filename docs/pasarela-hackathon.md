# TerraCierta: pasarela de pagos para el hackatón

Alcance: únicamente el módulo de pasarela y su contrato de pagos. El login lo implementa otro compañero mediante el endpoint de la Test Wallet; su conexión con la pasarela está pendiente. La pasarela no implementa login. Las wallets y la configuración de la demo siguen siendo temporales. No describe como implementados el login real, el catálogo ni la operación bancaria de TerraCierta.

Fuentes entregadas por el equipo: *Guía de supervivencia del hackatón*, páginas 4, 9, 16 y 20–23; fotografía del *Canvas de ideación*. Estas fuentes orientan la explicación y las evidencias; no autorizan operaciones sobre cuentas ni demuestran por sí mismas el funcionamiento del prototipo.

## Respuestas al canvas de ideación

### 1. ¿Para quién es? Problema

**¿Quién tiene el problema y cuál es su mayor dificultad con los pagos hoy?**

Compradores de café y caficultores que necesitan conocer quién paga, cuánto sale de su wallet, quién recibe y cuándo terminó el cobro. En esta parte del prototipo resolvemos la visibilidad y autorización de una operación concreta: cotizar, confirmar y conservar evidencia del pago. No atribuimos al público un diagnóstico validado mediante entrevistas que todavía no tenemos.

### 2. ¿Por qué lo necesitan? Impacto

**¿Quién queda por fuera hoy y qué cambia para esas personas?**

La propuesta busca facilitar el cobro directo de pequeños productores mediante wallets interoperables, sin exigirles operar infraestructura financiera. La pasarela aporta una revisión explícita del receptor y débito, autorización en la wallet y un recibo verificable. El impacto económico o la incorporación de personas hoy excluidas es una hipótesis: requiere pruebas con usuarios y medición, no se demuestra únicamente añadiendo criptografía.

### 3. ¿Qué hace posible? Solución

**¿Qué vamos a construir en dos días, en una sola frase?**

Una pasarela de cobro de café entre wallets que usa Open Payments con consentimiento del titular y añade un canal y recibos post-cuánticos verificables en la capa de TerraCierta.

### 4. ¿Cómo funciona? Flujo del dinero

**¿Quién le paga a quién, por qué y cuándo?**

En esta demostración TerraCierta representa al comprador: la wallet emisora configurada en el servidor paga a la wallet receptora de testnet por un cobro de café. El receptor predeterminado termina en `921a6da8`; se puede seleccionar otra wallet permitida de la misma testnet. La emisora no se elige desde el cuerpo enviado por el navegador.

1. La página solicita una cotización con monto y receptor; todavía no se debitan fondos.
2. El servidor obtiene información de las wallets, el permiso de pago entrante, el recurso de cobro, el permiso de cotización y la cotización. El SDK fija explícitamente el importe recibido mediante `receiveAmount`. Este recurso estándar no se confunde con el endpoint de la API web de Test Wallet.
3. El comprador revisa el débito exacto y receptor. La pasarela entrega un token aleatorio de un solo uso, vinculado en el servidor a sesión, modo y cotización, con vencimiento de cinco minutos. En modo protegido se verifica además una firma híbrida de esa cotización.
4. Al confirmar se solicita un grant GNAP de pago saliente, acotado a la wallet emisora, receptor y débito cotizado. El titular autoriza en la wallet; su cookie permanece en esa wallet.
5. El servidor valida el retorno con estado de sesión y hash GNAP: nonce del cliente, nonce del servidor de autorización, referencia de interacción y endpoint de grant. Una URL de retorno por sí sola no demuestra consentimiento.
6. Con el permiso finalizado, el servidor crea el pago saliente una sola vez. Solo este paso solicita mover fondos.
7. Consulta el envío y la recepción. Mientras falte evidencia de entrega, muestra pendiente y permite consultar sin recrear el pago.
8. Al confirmar el importe enviado y recibido, devuelve resultado y recibo de TerraCierta. Con PQC, firma Ed25519 + ML-DSA-65 y respuesta cifrada; sin PQC, JSON legible sin firma híbrida.

El riel Open Payments/ILP mueve los fondos. TerraCierta no instala conectores ni reescribe STREAM o Rafiki.

### 5. ¿Por qué ahora? Innovación

**¿Qué tiene de innovador el enfoque? ¿Qué aporta Open Payments?**

Open Payments ofrece recursos estandarizados y autorización acotada para combinar distintas wallets sin implementar el riel de pagos. La aportación experimental de TerraCierta es proteger adicionalmente el tramo navegador–pasarela con ML-KEM-768, HKDF-SHA-256 y AES-256-GCM, y añadir firmas híbridas a la evidencia de aplicación.

No afirmamos que antes fuera imposible integrar pagos, ni que Open Payments, GNAP, TLS o ILP se hayan convertido en protocolos post-cuánticos. Las firmas estándar Ed25519 del SDK siguen siendo necesarias. La demostración permite comparar ambos modos sobre el mismo flujo de negocio.

## Impacto, inclusión e innovación

| Pregunta de la hoja | Respuesta de la pasarela | Evidencia o validación pendiente |
| --- | --- | --- |
| ¿Qué diferencia podría marcar para las personas/comunidades? | Revisar el débito y receptor antes de pagar, y conservar evidencia verificable del cobro. | Mostrar cotización, consentimiento y recibo. Medir comprensión y utilidad con compradores/caficultores. |
| ¿Cómo hace más fáciles o accesibles los pagos? | Interfaz en español, campos con labels, estados claros y el mismo recorrido visual de TerraCierta; la complejidad criptográfica queda en el código. | Revisión desktop/móvil. Falta prueba de usabilidad con el público y lector de pantalla. PQC por sí sola no demuestra inclusión financiera. |
| ¿Qué tan creativo es el enfoque? | Canal PQC y firmas híbridas de aplicación combinados con el consentimiento estándar de la wallet. | Network muestra ciphertext/JSON; comprobación de ambas firmas; pruebas de alteración y repetición. |

## Piezas de Open Payments que utilizamos

| Casilla del canvas | Tratamiento en esta parte |
| --- | --- |
| Wallet addresses | Sí: descubrimiento de wallet emisora y receptora mediante SDK. |
| Pagos entrantes | Sí: grant y recurso incoming-payment con importe receptor y vencimiento. |
| Cotizaciones | Sí: grant y quote con receiveAmount; se muestra el débito exacto. |
| Pagos salientes | Sí: outgoing-payment después de autorización verificada; consulta de estado. |
| Grants y consentimiento | Sí en el riel SDK: permiso acotado e interacción con la wallet. El modo simulado no demuestra consentimiento real. |
| Pagos recurrentes o límites de gasto | Solo límite por operación y límites del grant de pago único. No hay recurrencia. |
| Distintas divisas | Se leen assetCode/assetScale de las wallets y de la cotización; no afirmamos haber probado un pago entre divisas distintas. |

**Patrón de pago:** pago único de una compra de café, de wallet a wallet. No se implementan suscripciones, streaming, división de pagos, facturación ni pagos por preguntas de un agente.

## Respuestas a los ocho criterios de evaluación del PDF

| Criterio | Qué responder | Qué mostrar |
| --- | --- | --- |
| Definición del problema | Necesitamos que un cobro de café tenga receptor, costo, autorización y resultado comprensibles. | Descripción breve del comprador y caficultor; un solo cobro. |
| Uso de Open Payments | El servidor usa el SDK oficial para grants, incoming, quote y outgoing sobre testnet. | Consentimiento en la wallet y evidencia de envío/recepción. Un mock o echo no basta para acreditar el pago real. |
| Experiencia de usuario | El comprador revisa receptor y débito antes de autorizar; entiende pendiente/completado. | Pasarela integrada visualmente, desktop y móvil, mensajes y labels. |
| Calidad técnica | Separación servidor/navegador, validación, anti-repetición, retorno verificado y pruebas negativas. | Pruebas y casos de hash incorrecto, token ajeno, expiración, datos alterados y fallo de observación después del envío. |
| Presentación | Explicar el problema, mostrar un recorrido y delimitar la aportación PQC. | Guion inferior y diferencia en Network. |
| Innovación | Agilidad criptográfica de la aplicación encima del estándar interoperable. | Cotización firmada, ciphertext y recibo con ambas firmas verificadas. |
| Inclusión | Interacción en español y wallets abiertas para el caso de cobro de pequeños productores. | Demostración accesible; presentar el impacto en usuarios desatendidos como hipótesis pendiente de validación. |
| Impacto | Mayor trazabilidad y control de una compra concreta. | Pago identificado y recibo; evitar cifras de ahorro, adopción o reducción del fraude sin medición. |

## Video de la demo: solicitud → consentimiento → pago → listo

1. **Solicitud:** abrir `http://127.0.0.1:3100/pago/pasarela`; mostrar el resumen sencillo y pulsar «Ver total». El modo protegido está activo por defecto; los parámetros están en Ajustes de la demo. La cotización se obtiene con el SDK oficial.
2. **Consentimiento:** mostrar el débito exacto y receptor, pulsar «Pagar» y continuar a la wallet. Su titular autoriza allí. No grabar contraseñas, cookies, llaves ni tokens; no abrir Developer Keys durante la grabación.
3. **Pago:** volver a TerraCierta. Explicar que se verificó el retorno GNAP y que el servidor creó el outgoing; si sigue pendiente, pulsar Consultar estado. No presentar una cotización como un pago.
4. **Listo:** mostrar cobro completado, quoteId, importe/moneda y recibo híbrido verificado. Contrastar con un cobro separado en modo claro, que también requiere su propia autorización y no incluye recibo PQC.
5. **Network:** comparar únicamente las solicitudes a `/api/pasarela/cobrar` y `cobrar-claro`. El handshake publica llaves públicas; la autorización redirige a la wallet. No afirmar que todo el tráfico del navegador es ciphertext.

Si se graba con `USE_MOCKS=true`, rotularlo como simulación. Para acreditar el riel ante el jurado se necesita una grabación adicional del flujo real con autorización y confirmación; las pruebas unitarias no sustituyen esa evidencia.

## Guion breve de tu parte

«En TerraCierta, el comprador revisa cuánto paga y a quién llega el cobro de café. Usamos Open Payments en testnet para cotizar, pedir autorización en su wallet y enviar el pago. Sobre ese recorrido añadimos protección post-cuántica donde controlamos el tráfico: entre nuestra página y la pasarela. Aquí se puede comparar el JSON con la solicitud cifrada, y comprobar el recibo híbrido del cobro. Conservamos el consentimiento del estándar y no modificamos ILP.»

## Preguntas que puede hacer el jurado

- **¿Por qué la Test Wallet y los repositorios no son alternativas excluyentes?** La testnet opera infraestructura Rafiki; nuestra aplicación usa el SDK de Open Payments contra esa infraestructura. No necesitamos desplegar Rafiki para consumir el servicio.
- **¿Usan la cookie del usuario de la Test Wallet?** No en el riel SDK. La wallet maneja su sesión y el consentimiento; TerraCierta conserva la llave de cliente y tokens GNAP en el servidor. Una cookie propia HttpOnly vincula las solicitudes de pago a este navegador y no acredita identidad. El login que está construyendo el compañero es una integración aparte, todavía pendiente de conectar.
- **¿PQC evita un pago no autorizado?** El cifrado no autoriza. La autorización depende del grant GNAP y el consentimiento del titular; el token local impide cambiar o reutilizar una cotización en esta aplicación.
- **¿El recibo prueba que ILP es post-cuántico?** No. Es una atestación de TerraCierta sobre datos observados. El SDK conserva las firmas HTTP estándar y el riel conserva su criptografía.
- **¿Y el adaptador anterior con cookies?** Se retiró del módulo y del checkout. Configurar `PAYMENTS_RAIL=wallet-ui` produce un error antes de enviar solicitudes. Su script de prueba también está deshabilitado. El usuario informó que el endpoint web ejecuta pagos; no se volverá a utilizar para consultar costos.
- **¿Qué ocurre si se corta la red?** Una solicitud consumida no vuelve a crear el outgoing. Si ya hay un pago identificable se consulta; si el resultado es incierto se pide revisar la wallet antes de repetir. La producción requiere idempotencia durable y conciliación.
- **¿Puede cualquiera gastar desde la wallet de plataforma?** En el SDK no obtiene permiso de débito solo por abrir la página: el titular debe autorizarlo en la wallet. La sesión de la demo vincula el recorrido, pero no acredita identidad. El puente con cookies está retirado.
- **¿Hay una vulnerabilidad confirmada en la Test Wallet?** No se ha realizado una auditoría autorizada de ese servicio. Una llamada válida con sesión no demuestra un bypass; no basamos el pitch en esa afirmación.

## Entregables de tu parte

- Código y pruebas de la pasarela en el repo; no contienen la llave privada ni `.env.local`.
- Este documento para responder el canvas, los criterios y preparar tu segmento del pitch.
- Registro de uso de IA y prompts en `AI_USAGE.md` y `prompts/pasarela-pqc.md`.
- Evidencia automatizada y visual indicada en el registro de verificación.
- **Pendiente del equipo:** grabar el pago real aprobado por el titular, integrar tu segmento al pitch deck y subir repo público/enlace a demo/materiales donde indique la organización. Preparar todo antes de las 11:00 del sábado 17 de octubre de 2026, según el canvas; el PDF sitúa la ventana de entrega/revisión entre 11:00 y 12:00.

## Referencias técnicas oficiales

- [Estándar y documentación Open Payments](https://github.com/interledger/open-payments).
- [SDK oficial para TypeScript/Node](https://github.com/interledger/open-payments-node).
- [Preparar wallet y llaves](https://openpayments.dev/sdk/before-you-begin/).
- [Flujo de compra de pago único](https://openpayments.dev/guides/accept-otp-online-purchase/).
- [Verificación del hash de retorno](https://openpayments.dev/identity/hash-verification/).
- [Testnet basada en Rafiki](https://rafiki.dev/integration/playground/testnet/).
- [ML-KEM y ML-DSA en noble-post-quantum](https://github.com/paulmillr/noble-post-quantum).

## Observación de la testnet durante la preparación

La consulta real con las wallets de esta demo devolvió receiveAmount de 0,05 EUR y debitAmount de 1,05 EUR. La diferencia de 1,00 EUR se debe mostrar como diferencia cotizada hasta que el proveedor permita identificar su concepto. No prometer comisiones cero ni confundir el importe receptor con el débito. El tope de débito se configura por separado y requiere una decisión explícita del equipo. Esta observación no ejecutó un pago saliente.


## Corrección de alcance tras probar la API web

La API web con cookies no forma parte del flujo vigente. Durante el diagnóstico se hicieron llamadas a su endpoint `/quotes`; el usuario indicó que esas llamadas ejecutan el pago. Por ello no se afirma que dichas llamadas fueran inocuas o que no movieran fondos. La migración final utiliza solamente el SDK oficial: cotización, permiso interactivo GNAP, retorno verificado, pago saliente y observación de recepción. La cotización automática al abrir la página se eliminó. El login de la app sigue sin implementar y no se modificó.
