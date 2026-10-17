# Cierre de la pasarela para integración

Objetivo autorizado: investigar la diferencia de importes, proteger el monto del vendedor y dejar la rama de pagos publicable con handoff para el login de otro compañero.

Se mantiene el SDK oficial con GNAP, el contrato `src/adapters/types.ts`, el diseño simple y las credenciales solo en servidor. La pasarela no modifica tarifas del proveedor ni inventa conversiones COP/EUR. No se ejecutan pagos externos durante esta revisión.

- [x] Comprobar con fuentes de Rafiki/Test Wallet el cálculo y destino esperado de tarifas; documentar qué falta para conciliar el caso real.
- [x] Agregar regresiones que rechacen importes recibidos distintos del pedido y prueben que `walletPagador` llega al riel oficial.
- [x] Mostrar importe del vendedor, adicional cotizado y débito total por separado; no llamar comisión a una diferencia sin desglose, ni restar monedas distintas.
- [x] Revisar la capa PQC contra FIPS 203/204 y documentar confianza inicial, garantías, límites y mejoras priorizadas, sin criptografía propia nueva.
- [x] Crear handoff autocontenido para la IA de login: archivos, API, estado, variables, escenarios y comandos de integración.
- [x] Resolver hallazgos de revisión, ejecutar pruebas, TypeScript, lint, build y comprobar exclusión de secretos.
- [x] Crear commit y publicar solo la rama actual si los controles pasan; no fusionar main ni el trabajo remoto de otros compañeros.

Validación real pendiente del titular: consentimiento y confirmación de recepción. No se declara producción completa sin persistencia/conciliación ni integración del login aún no disponible localmente.
