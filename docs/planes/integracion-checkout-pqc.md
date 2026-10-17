# Integrar PQC en el checkout real

Solicitud: conectar el checkout al canal postcuántico y corregir las brechas del recorrido. Cambios locales; no commit/push ni pagos externos.

Diseño: reutilizar ML-KEM/AES-GCM y firmas existentes en los endpoints comerciales, conservando contratos de pagos/auth y precio/wallets desde servidor. El endpoint de llaves comercial queda independiente del interruptor de demo. Las consultas usan POST cifrado, sesión de usuario y autorización por wallet participante. Un contexto de petición solo de servidor registra si el inicio pasó realmente por PQC; no se acepta una bandera del navegador. La pantalla verifica firmas y vinculación al pago antes de mostrar éxito.

- [x] Transporte comercial cifrado, validación de origen/tamaño/contexto, límites, protección contra replay y errores de negocio cifrados. Pruebas locales de ruta alterada, replay, cuerpo claro y fallo del proveedor.
- [x] Controladores para pedido/oferta/estado, con perfil validado y sin precio/wallet del navegador. Mantener punto de enchufe del login. Rechazar consulta pública GET del estado.
- [x] Registrar canal de inicio desde contexto servidor en SDK y firma de comprobante; conservar firma y evidencia al pasar por pagos-service. Exigir propietario para consulta comercial y mantener resultados inciertos sin reejecución.
- [x] Cliente y formularios de comprador/cooperativa: canal obligatorio, exclusión de doble clic, ningún fallback claro/reintento automático de ejecución y verificación de recibo. Proteger consulta de estado de retorno.
- [x] Pruebas integradas navegador simulado → controlador → SDK simulado → GNAP → recepción → recibo verificado. Casos negativos de firma, cambio de importe/destinatario, sesión ajena y flags falsos.
- [x] Revisión independiente, pruebas completas, TypeScript/lint/build, verificación local sin transferencias, documentación actualizada. Login/DB externos y persistencia distribuida se reportan con sus límites reales.

Verificación: 127 pruebas aprobadas y 22 omitidas; TypeScript, lint del alcance y build de producción aprobados. Comprobación contra Next local en 3100: pantalla 200, llaves comerciales sin sesión 401, GET de estado 405 y cuerpos claros de inicio de pedido/oferta 400. Key/echo PQC local también aprobado, sin solicitudes de cotización o pago externo. Revisión independiente cerrada sin bloqueantes en el alcance; se corrigieron límites compartidos, retención de replay, reserva concurrente de ofertas y consumo prematuro de referencia GNAP.

Inspección remota en paralelo: main c1253a1 y feat/sign-in-sign-up d4f6ee9 tienen UI/mock de login, pero auth real sigue NO_IMPLEMENTADO. No se fusionaron. Cambios locales sobre a253a82; no commit, push ni pagos reales. Estado y llaves siguen por proceso; falta aceptación con auth/DB reales y moneda acordada.
