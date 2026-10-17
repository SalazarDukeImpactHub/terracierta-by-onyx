# Pasarela de cobro protegida de TerraCierta

Especificación: tarea adjunta «Pasarela de pago protegida (PQC) en TerraCierta».
Objetivo: comparar un cobro JSON con el mismo cobro cifrado desde `/pago/pasarela`, sin productos ni sesión de comprador. El servidor conserva todas las credenciales de wallet testnet.

## Decisiones

- Extender el diseño existente: layout global, crema/bosque/cobre, campos y botones compartidos, sección `max-w-3xl px-5 py-14`.
- Canal ML-KEM-768, HKDF-SHA-256 con dominio TerraCierta y claves distintas para solicitud/respuesta, AES-256-GCM con contexto autenticado por ruta, llave y solicitud.
- Recibo Ed25519 + ML-DSA-65; verificar ambas firmas contra las llaves del bundle obtenido del mismo origen por HTTPS (HTTP únicamente en loopback para demos). Las firmas del bundle no sustituyen esa raíz de confianza.
- Llaves efímeras compartidas por proceso entre handlers; tras reiniciar se obtiene un bundle nuevo. Memoria local, no almacenamiento durable ni coordinación distribuida.
- Riel único SDK oficial + GNAP elegido explícitamente por el usuario durante la sesión. Cotización previa, confirmación local de un uso y retorno de consentimiento verificado. El puente wallet-ui está retirado; no es una alternativa de ejecución.
- Liquidación común como comprador (`isReceive: true`, corrección explícita del usuario), unidades mayores en pasarela y techo OPEN_PAYMENTS_MAX_RECEIVE. USE_MOCKS conserva simulación explícita sin depender de Supabase.
- JSON limitado y validado, mismo origen, cookie propia HttpOnly, límite de intentos por proceso, identificación de solicitudes y rechazo de repeticiones. No repetir automáticamente cobros con resultado incierto.
- Sin cambios al contrato `src/adapters/types.ts`, login, catálogo o tienda. Referencia AgentGuard solo lectura, sin trasladar UI ni flujos de agente.

## Secuencia y verificación

- [x] Núcleo PQC y pruebas de ida/vuelta, alteraciones, firmas y separación de contexto.
- [x] Liquidación compartida y rutas key/echo/cobrar/cobrar-claro; pruebas con fetch simulado, sin testnet.
- [x] Página de pasarela con estados accesibles, modos explícitos y recibo verificado.
- [x] Recibo en detalle del pago completado; enlace discreto y env sin secretos.
- [x] `npx vitest run src/payments`, suite completa, `npx tsc --noEmit`, lint y revisión visual desktop/móvil frente a tienda/retorno.

## Riesgos a comprobar

1. Envelope o firma alterados no deben llegar a liquidación.
2. Repetir una solicitud no debe debitar dos veces, incluso si falla la respuesta.
3. Errores upstream y cookies nunca deben aparecer en respuestas públicas.
4. Una respuesta no debe poder descifrarse como solicitud ni usarse en otra ruta.
5. Una cotización o un consentimiento sin recepción completa no debe presentarse como pago liquidado.

Revisión independiente: corregidos recuperación tras outgoing creado, seguimiento más allá del vencimiento del quote y path de cookie de checkout para varias ventanas. El recibo requiere evidencia de envío y recepción del SDK.

Decisión final: solo SDK oficial y GNAP. Retirada la API web con cookies y deshabilitado su probe; sin preparación automática al abrir la página.
