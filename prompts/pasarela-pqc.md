# Pasarela de pagos protegida

Solicitud del equipo: añadir a TerraCierta un canal ML-KEM-768 + AES-GCM y recibos Ed25519 + ML-DSA-65, con API y página propias, respetando el diseño de la app, el contrato iniciarPago/consultarPago y USE_MOCKS. Comparar modo cifrado y JSON mediante DevTools; no trasladar UI o flujos de agentes de otro proyecto.

Correcciones e instrucciones durante la sesión:

- Actualizar la rama de trabajo mediante rebase antes de continuar, preservando cambios locales.
- Usar isReceive=true en la API web porque TerraCierta actúa como comprador.
- Considerar el PDF del hackatón y el canvas de ideación solo para la pasarela, respondiendo cada criterio.
- Exigir confirmación robusta en servidor, con cotización previa, límites y prevención de repetición.
- Usar el puerto 3100.
- Tras comparar Test Wallet, Open Payments y Rafiki, el equipo eligió el SDK oficial con autorización GNAP como riel principal.
- El equipo indicó que ya tiene llave privada local y proporcionó wallet/key ID públicos para configurar el SDK. El archivo de llave permanece fuera del repo; no se copia su contenido en este registro.
- Explicar la diferencia entre la cookie de la wallet y la cookie propia de TerraCierta: el SDK usa firmas de cliente y permisos GNAP, sin importar la cookie de Test Wallet.

Referencias de trabajo: archivo adjunto de tarea, PDF y fotografía compartidos por el equipo; documentación oficial enlazada en docs/pasarela-hackathon.md. El proyecto de referencia indicado por el equipo se consultó solo en lectura para conceptos criptográficos.

- Corrección de alcance: el login lo desarrolla otro compañero usando el endpoint de Test Wallet. Quitar cualquier login del módulo de pagos; mantener la configuración temporal hasta que ese módulo entregue la sesión. No cambiar su implementación de autenticación.

- Simplificar la pantalla para un comprador: resumen, total exacto y botón Pagar. Preparar la cotización automáticamente y conservar la confirmación de un uso en servidor. Relegar los campos temporales y la comparación PQC a «Ajustes de la demo», cerrado por defecto.

- El usuario informó que POST /quotes de la API web ejecuta el pago. Se detuvieron esas pruebas y se pasó temporalmente a simulación.
- Decisión final explícita del usuario: usar Open Payments oficial. Retirar el flujo con cookies, conservar PQC, autorización GNAP y la UI sencilla. No implementar el login del compañero ni ejecutar pagos reales durante la verificación.
