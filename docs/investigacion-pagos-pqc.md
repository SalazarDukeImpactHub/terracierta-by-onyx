# Investigación: importes, tarifas y PQC

Revisión para cierre de la rama de pagos. Alcance: fuentes públicas, código local y pruebas simuladas; sin ejecutar nuevas transferencias ni reutilizar cookies del proveedor.

## Qué sabemos del euro adicional

La cotización real observada indicaba `receiveAmount = 5 EUR escala 2` (0,05 EUR) y `debitAmount = 105 EUR escala 2` (1,05 EUR). La resta exacta en la misma moneda es 1 EUR. El importe receptor se fijó como prueba técnica, no como precio comercial.

Rafiki permite tarifas de envío configuradas por activo, con componentes fijo y porcentual. En recepción fija, el servicio obtiene la cotización base y agrega la tarifa del emisor al débito, conservando el importe recibido. Su modelo calcula `ceil(principal * basisPoints / 10000) + fixedFee`. No hay una comisión universal de Open Payments de 1 EUR: la configuración pertenece al proveedor y puede cambiar.

El código público de Test Wallet, al completar un pago, transfiere el débito completo desde la cuenta del emisor a la cuenta de liquidación configurada; el manejo de incoming acredita al receptor el importe recibido. Es consistente con una diferencia retenida por el proveedor. Esto NO concilia por sí mismo una operación concreta ni demuestra la configuración administrativa exacta del despliegue. No tenemos acceso a su libro ni hemos comprobado sus saldos antes/después.

Corrección respecto a explicaciones previas: se infirió demasiado al afirmar primero que todo el euro era una comisión identificada y luego que ya sabíamos dónde estaba en la operación concreta. Lo comprobado es la cotización y el funcionamiento del código público; falta verificar movimientos e IDs y confirmar con el proveedor su tarifa desplegada.

Fuentes primarias:

- [Tarifas de envío de Rafiki](https://rafiki.dev/integration/requirements/sending-fees/).
- [Servicio de cotización](https://github.com/interledger/rafiki/blob/main/packages/backend/src/open_payments/quote/service.ts).
- [Cálculo de tarifa](https://github.com/interledger/rafiki/blob/main/packages/backend/src/fee/model.ts).
- [Test Wallet: liquidación de outgoing e incoming](https://github.com/interledger/testnet/blob/main/packages/wallet/backend/src/rafiki/service.ts).
- [Eventos y tratamiento de diferencias](https://rafiki.dev/integration/requirements/webhook-events/#outgoing-payment-completed).

## Corrección de la pasarela

La pantalla separa importe del vendedor, adicional cotizado por la wallet y total debitado. No etiqueta automáticamente la diferencia como una tarifa confirmada ni resta importes de monedas/escalas diferentes. Calcula la resta en unidades menores con BigInt.

El servidor conserva el importe original y comprueba igualdad de valor, moneda y escala del incoming, quote y outgoing. No firma un éxito por un monto receptor distinto. Las tarifas no reducen el importe del vendedor en esta modalidad: si el débito total supera el límite configurado, se rechaza la preparación. No se aumenta el precio del producto para compensar una configuración de testnet, ni se modifica la tarifa del proveedor.

Conciliación pendiente: consultar el outgoing e incoming ya existentes y comparar movimientos del emisor y receptor; nunca crear otro pago para investigar uno anterior. Pedir al operador el desglose de tarifa si el API público no lo aporta. Una cotización o un permiso aprobado no demuestra que se haya debitado dinero.

## Qué aporta la postcuántica implementada

ML-KEM-768 establece el secreto compartido; HKDF-SHA-256 deriva claves separadas por dirección y AES-256-GCM cifra con datos autenticados ligados a ruta, solicitud y llave. Ed25519 y ML-DSA-65 firman la cotización y el comprobante. Se exigen ambas firmas; alterar monto o destinatario invalida la verificación.

ML-KEM ya incorpora matemática avanzada: su seguridad se relaciona con Module Learning With Errors, un problema sobre retículas modulares. ML-DSA es la firma estandarizada basada en retículas. Implementar otra construcción matemática sin análisis, parámetros y auditoría no mejora automáticamente la seguridad de estos estándares.

Fuentes: [NIST FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final), [NIST FIPS 204: ML-DSA](https://csrc.nist.gov/pubs/fips/204/final). Ambas páginas publican avisos de erratas; usar una biblioteca y un número de parámetro no equivale a certificación FIPS ni a auditoría de nuestra integración.

## Límites y mejoras priorizadas

1. **Integración y conciliación:** idempotencia durable, estado persistente y recuperación de pagos después de caídas. La criptografía no corrige importes incorrectos ni sustituye el consentimiento.
2. **Confianza en llaves:** el bundle se obtiene del mismo origen por HTTPS; su autofirma detecta alteraciones respecto a la llave conocida, pero no establece identidad por sí sola. Persistir claves de firma, definir rotación/versiones y una política de confianza verificable fuera de esa respuesta. HTTP solo es admisible en loopback de la demo.
3. **Pruebas y mediciones:** vectores de referencia, rechazo de datos alterados, separación de dominios y direcciones, límites de sobres, latencia y tamaño de firmas/KEM. Documentar algoritmos/versiones y revisar actualizaciones de biblioteca y erratas. No publicar números de rendimiento sin medición.
4. **Análisis matemático útil:** explicitar invariantes de montos y estados: recepción solicitada = recepción cotizada; débito <= límite; ejecución solo después del consentimiento verificado; recibo de éxito solo tras recepción completa; repetición no crea otro outgoing. Formalizar la máquina de estados o usar pruebas de propiedades aporta más al caso que inventar otro cifrado.
5. **Investigación posterior:** evaluar intercambio híbrido clásico/PQ mediante perfiles y combinadores revisados, con protección contra downgrade y negociación autenticada. No añadir X25519, pruebas de conocimiento cero o cifrado homomórfico solo para adornar el pitch: cada uno necesita una amenaza o requisito concreto.

La capa demostrada protege mensajes de aplicación entre navegador y TerraCierta, además del HTTPS necesario. Los grants GNAP, las firmas HTTP del SDK, el proveedor y el protocolo ILP no se han convertido en postcuánticos. Las llaves efímeras en memoria tampoco proporcionan verificación histórica independiente después de reiniciar ni forward secrecy postcompromiso por sí solas. Para producción se requiere diseño y revisión de esos límites.
