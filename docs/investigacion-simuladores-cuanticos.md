# Simuladores cuánticos y objetivos aleatorios

Revisión de fuentes primarias del 17 de octubre de 2026. No se ejecutó código de estos repositorios ni se instaló otro framework cuántico en la pasarela. El experimento local de Qiskit ya existente usa un simulador de estado, no hardware cuántico. Generar nuevas claves reales y ejecutar un ataque cuántico contra ellas son operaciones diferentes.

## Qué corresponde a los algoritmos de TerraCierta

| Componente | Amenaza relevante | Qué se prueba aquí |
| --- | --- | --- |
| Ed25519 | Shor para logaritmo discreto en curvas elípticas, con un computador cuántico adecuado | Claves aleatorias de tamaño real y firmas/verificaciones reales; se concede la clave privada del laboratorio para modelar el compromiso, no se calcula desde su pública |
| ML-DSA-65 | Criptoanálisis de problemas de retículas y fallos de implementación; no la factorización de RSA | Verificación real de la firma original/alterada e interoperabilidad Node/OpenSSL. No se demuestra resistencia absoluta mediante una prueba negativa |
| ML-KEM-768 | Criptoanálisis de retículas y fallos de implementación; captura hoy/descifrado futuro como riesgo de migración | Encapsulación/decapsulación e intercambio entre proveedores; cifrado de petición/respuesta y rechazo de alteraciones |
| AES-256-GCM | Grover es relevante para búsqueda de claves; la integridad tiene además sus propios límites y requisitos de nonces/tags | Uso real de AES-GCM, claves separadas por dirección, IV y contexto autenticado. No se ejecuta Grover contra AES-256 |

Fuentes: [Shor para curvas, artículo original de investigación](https://arxiv.org/abs/1706.06752), [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final), [estudio de costo práctico de Grover presentado en NIST](https://csrc.nist.gov/Presentations/2024/practical-cost-of-grover-for-aes-key-recovery).

## Proyectos GitHub revisados

| Proyecto | Uso posible | Límite importante |
| --- | --- | --- |
| [Quaspy, Martin Ekerå](https://github.com/ekera/quaspy) | Muestreo y posprocesamiento de Shor/Ekerå para orden y logaritmos; útil para estudiar distribuciones sin representar un vector de estado enorme | El [muestreador de logaritmo discreto](https://github.com/ekera/quaspy/blob/main/docs/logarithmfinding/general/sampling/README.md) recibe el secreto `d` y el orden `r`. Alimentarlo con un secreto conocido para simular frecuencias no es recuperar una clave desconocida desde su pública |
| [Cirq, ejemplo oficial Shor](https://github.com/quantumlib/Cirq/blob/main/examples/shor.py) | Circuito genérico con base aleatoria, búsqueda de orden y factorización | La ejecución predeterminada usa búsqueda de orden clásica (`naive`); debe seleccionarse `quantum` para el circuito. La simulación sigue limitada por recursos y la factorización no ataca Ed25519 |
| [Qiskit Shor, Benjamin Assel](https://github.com/benjamin-assel/qiskit-shor) | Referencia de aritmética reversible genérica y entradas variables; reduce el uso de qubits mediante diseños especializados | Menos qubits de circuito no convierten una simulación clásica en una ruptura factible de RSA-2048 |
| [Microsoft QDK, Shor.qs](https://github.com/microsoft/qdk/blob/main/samples/algorithms/Shor.qs) y [QRE](https://github.com/microsoft/qdk/wiki/QREv3) | Separar simulación pequeña y estimación de recursos para algoritmos mayores | Estimar qubits/puertas/tiempo no recupera una clave; la estimación depende de arquitectura y corrección de errores. No interpretar cifras P-256 como mediciones específicas de Ed25519 |
| [ECDLP en Qrisp](https://github.com/diehoq/quantum-elliptic-curve-logarithm) | Investigación de circuitos para el problema de curva elíptica, más cercano a firmas ECC | Compilar o contar operaciones para 256 bits no demuestra haber ejecutado la recuperación cuántica completa. No se integró su dependencia experimental en pagos |

El repositorio histórico [Microsoft QuantumEllipticCurves](https://github.com/microsoft/QuantumEllipticCurves) está archivado y usa un SDK antiguo. Su propia documentación advierte sobre ciertas cotas de estimación. Se conserva como referencia científica, no como dependencia nueva de la demo.

## Decisión implementada

El laboratorio de `/pago/seguridad` genera un objetivo aleatorio con Ed25519 y ML-DSA-65 reales. Muestra la huella SHA-256 de la clave pública y las longitudes medidas; genera nuevas claves al pedir otro objetivo. Para controlar la comparación, activar/desactivar el escudo conserva el mismo caso y solo cambia la política: Ed25519 sola frente a Ed25519 Y ML-DSA-65.

El atacante de laboratorio recibe deliberadamente su clave clásica. Cambia el receptor y vuelve a firmar con ella; el documento conserva una firma ML-DSA que no corresponde al cambio. La verificación determina el resultado de la animación. La etiqueta nombra tanto la amenaza futura Shor como la operación realmente ejecutada. No se conecta este interruptor al checkout comercial, que mantiene PQC obligatorio.

El circuito de factorización 15=3×5 queda como ejemplo educativo independiente. Aumentar ese número no lo convertiría en un ataque a Ed25519. Una evolución con Quaspy debe rotular los secretos conocidos utilizados por el muestreador, o un estimador debe mostrar sus supuestos y la curva exacta. No se presenta una simulación con secreto conocido como ruptura de una clave pública real desconocida.
