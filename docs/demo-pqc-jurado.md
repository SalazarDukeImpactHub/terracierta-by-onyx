# Demostración visual de la pasarela

Abrir `/pago/pasarela` para pagar o consultar el recorrido del rol. La wallet y las acciones comerciales provienen de `auth.obtenerPerfil()` en el servidor. Sin perfil no se inventa una identidad: comprador/cooperativa pueden abrir el cobro autónomo de prueba, rotulado con la wallet configurada en servidor; no representa un pedido u oferta de una cuenta. El caficultor consulta cobros y no aprueba recepciones. El login lo integra el compañero; no se añade otra autenticación.

Abrir `/pago/seguridad` para la demostración del jurado: comparación de firmas y canales, mediciones de Shor y comprobación key/echo. Los selectores Comprador, Cooperativa y Caficultor de la demostración cambian solamente la presentación, nunca la sesión, los permisos o la wallet pagadora. Así la compra conserva una animación pequeña y las explicaciones técnicas quedan en otra sección.

## Un pago de inicio a fin

El gráfico `FlujoPago` aparece en el checkout de comprador, en el pago de ofertas y en el estado del pago. No avanza mediante temporizadores:

1. Solicitud: el cliente verifica el bundle del canal y cifra con ML-KEM-768, HKDF-SHA256 y AES-256-GCM.
2. Wallet: solo anuncia autorización tras verificar la respuesta cifrada y el destino de redirección. El titular aprueba en su wallet mediante GNAP.
3. Pago: solo muestra ejecución cuando el estado consultado la informa. Mientras el navegador está en la wallet o esperando el callback no observa cada operación interna del proveedor.
4. Comprobante: un éxito real solo llega a la pantalla tras verificar Ed25519 y ML-DSA-65 y su correspondencia con pago, monto, receptor y procedencia del canal.

Si el proveedor no informa una fase, muestra pendiente sin inventar progreso. Un fallo de red no equivale a un fallo financiero ni permite reenviar automáticamente. La animación del checkout representa únicamente estados conocidos de ese pago. Las pruebas de ataque están en Seguridad. Un mock se identifica como simulado; no acredita fondos ni firmas de un pago real.

## Comparación para el jurado, sin cobros

En `/pago/seguridad`, pulsar **Enviar comprobante de prueba**. Se genera un objetivo aleatorio: claves efímeras Ed25519 (clave pública 32 bytes, firma 64) y ML-DSA-65 (clave pública 1952 bytes, firma 3309), con sus parámetros reales. La huella SHA-256 identifica la clave pública del caso. **Generar otra clave y probar** crea un nuevo caso; cambiar el escudo conserva el documento, las claves y las firmas para comparar únicamente la política. Se altera el receptor y se concede deliberadamente la clave clásica del experimento para volver a firmar con Ed25519. El mismo verificador de la app calcula:

- Original: ambas firmas válidas.
- Alterado: Ed25519 válida; ML-DSA-65 inválida; aceptación híbrida falsa.

El juego nombra la amenaza cuántica (Shor para logaritmo discreto) y el ataque realmente probado (falsificación con clave clásica concedida). No los confunde. Los proyectos GitHub revisados y sus límites se documentan en [investigación de simuladores](investigacion-simuladores-cuanticos.md).

Ilustra la defensa frente al compromiso de una clave clásica y el riesgo futuro de falsificación. No ejecuta Shor contra Ed25519, no usa secretos del checkout y no demuestra resistencia absoluta. La confianza inicial de las claves depende del origen y HTTPS; la custodia y verificación histórica de claves sigue pendiente.

Si se representa como un juego con escudo, el escudo expresa la política de firmas: una firma clásica frente a la obligación de ambas firmas. El resultado se obtiene del verificador, no de decidir que un icono encendido gana. Alterar un mensaje sin poder volver a firmarlo también sería rechazado por una firma clásica o por AES-GCM. No presentar «sin PQC toda alteración pasa»: el escenario didáctico concede específicamente la clave clásica y conserva desconocida la clave ML-DSA.

En **Ver cómo se protege la comunicación → Comprobar protección PQC**, los endpoints key/echo comprueban ida y vuelta cifradas, rechazo de ciphertext modificado y firmas. No solicita grants, cotizaciones ni pagos. Rechazar alteraciones demuestra integridad; por sí solo no demuestra la necesidad de PQC. El motivo específico del KEM postcuántico es reducir el riesgo futuro de descifrado de tráfico capturado si contiene datos sensibles de larga vida.

Para interceptar esa misma prueba y mostrar la modificación/rechazo con una herramienta de pentesting, seguir [la guía de Burp](verificacion-burp-pqc.md). La línea base es un POST echo válido; después se altera un solo byte y se observa el `400`. La vuelta alterada debe ser rechazada por el navegador. No reenviar endpoints financieros para esta presentación.

## Comparar confidencialidad: un mensaje, dos canales

En **Un mensaje, dos canales**, pulsar **Probar canal**. Se ejecutan ECDH P-256 y el canal ML-KEM-768 de la app, con claves efímeras nuevas y el mismo documento sintético. Ambos usan HKDF-SHA-256/AES-256-GCM y comprueban ida/vuelta y rechazo de un bit alterado en solicitud y respuesta. Cambiar **Escudo de canal PQC** conserva el caso; **Generar otras claves** inicia uno nuevo.

El laboratorio entrega deliberadamente la clave ECDH privada propia al atacante: permite abrir la captura clásica. Probar ese secreto clásico contra el canal PQC falla. Este último rechazo demuestra separación de claves; **no equivale a ejecutar Shor ni demuestra por sí solo resistencia cuántica**. La justificación de ML-KEM frente a la amenaza futura se basa en el algoritmo y sus supuestos de seguridad, no en probar una clave incorrecta.

El experimento se ejecuta entero en el navegador, sin red ni pagos. Para evidenciar el canal navegador/servidor real, usar después la prueba key/echo y Burp. HTTPS protege hoy; el riesgo de capturar para descifrar después depende del intercambio de claves y de cuánto tiempo debe permanecer secreta la información. La app local HTTP no es una medición de TLS 1.2. La capa de aplicación PQC termina en TerraCierta y no transforma los enlaces externos del proveedor.

El interruptor de este experimento controla **confidencialidad del canal**. El del comprobante controla **política de firmas**. Ninguno apaga el cifrado obligatorio del checkout comercial ni modifica su autorización.

## Verificación externa de los algoritmos

`node scripts/verify-pqc-native.mjs` contrasta las firmas y el KEM de la app con Node/OpenSSL, usando solo claves efímeras y datos sintéticos. Requiere Node con ML-KEM/ML-DSA nativos y OpenSSL CLI compatible; la ejecución local de referencia usa Node 26.0.0 y OpenSSL CLI 3.6.4. El binario CLI predeterminado es `/opt/homebrew/opt/openssl@3/bin/openssl`, configurable mediante `PQC_OPENSSL_BINARY`.

Produce un `result.json` temporal con versiones, hashes de las fuentes, 9 comprobaciones de interoperabilidad/integridad y 2 comprobaciones de límites conocidos. No es certificación ni auditoría criptográfica. Los pasos y criterios de aceptación están en [la guía de verificación](verificacion-burp-pqc.md#5-evidencia-específica-de-pqc-un-verificador-independiente).

## Shor: mediciones reproducibles

El desplegable muestra una ejecución guardada de Qiskit: N=15, base=2, período recuperado 4, factores 3 y 5, 12 qubits y 4096 mediciones. Las frecuencias provienen del simulador local StatevectorSampler; no de hardware IBM. El JSON incluye versión, semilla, fecha, circuito y SHA-256 del script. No se ejecuta por cada pago.

```sh
python3 -m venv .venv-quantum
.venv-quantum/bin/python -m pip install -r scripts/quantum/requirements.txt
.venv-quantum/bin/python -m unittest discover -s scripts/quantum -p 'test_*.py'
.venv-quantum/bin/python scripts/quantum/shor_demo.py --number 15 --base 2 --shots 4096 --seed 3876524241 --output public/pqc/shor-demo.json
```

La multiplicación modular se construye desde N y la base, sin introducir factores conocidos. Las matrices densas son educativas y no escalan: se limita N a 31. Esta factorización ilustra RSA; Ed25519 usa logaritmo discreto, cuya variante de Shor no está implementada aquí. La comparación híbrida simula por separado el compromiso clásico y realiza firmas/verificaciones reales. No se usa la factorización pequeña para estimar tiempos de ruptura de claves reales ni para demostrar seguridad de ML-DSA.

Fuentes: [Shor, IBM](https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm), [StatevectorSampler](https://quantum.cloud.ibm.com/docs/en/api/qiskit/qiskit.primitives.StatevectorSampler), [ML-DSA, FIPS 204](https://csrc.nist.gov/pubs/fips/204/final).

## Frase de presentación

«La wallet autoriza el dinero. TerraCierta protege la solicitud y exige dos firmas para aceptar el comprobante. Aquí simulamos el compromiso de la firma clásica: la falsificación que pasaría con una sola firma queda rechazada por la comprobación híbrida».

No afirmar certificación FIPS/PCI DSS, protección postcuántica de todo Interledger, un ataque cuántico real o preparación para producción. La prueba completa con login real, monedas compatibles y autorización manual sigue siendo un paso de integración.
