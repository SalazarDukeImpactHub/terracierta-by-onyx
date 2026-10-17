# Presentación de la innovación PQC

La entrega contiene 12 láminas con diagramas, fórmulas, matriz de riesgos y evidencia. El PowerPoint conserva texto, diagramas, tablas y gráfico editables. Las notas incluyen fuentes, explicación técnica y límites. El PDF sirve como vista fiel de las láminas y contiene páginas rasterizadas.

- [Presentación editable](entrega/terracierta-pqc-v2.pptx)
- [Vista PDF](entrega/terracierta-pqc.pdf)
- [Vista general](vista-general.png)

## Guion de dos minutos

**0:00–0:20.** TerraCierta permite que compradores y cooperativas paguen al caficultor. Quien recibe consulta su cobro. La wallet de quien paga conserva la autorización del gasto.

**0:20–0:45.** Nuestra contribución protege el trayecto entre el navegador y la pasarela con ML-KEM-768, HKDF y AES-256-GCM. El recibo exige una firma Ed25519 y otra ML-DSA-65, además de coincidir con los datos del pago. La protección de aplicación termina en nuestra pasarela.

**0:45–1:15.** El laboratorio genera claves reales nuevas y un mensaje sintético. Al alternar el escudo mantiene el mismo caso. Mide el cifrado y el rechazo de alteraciones en ambas direcciones. Para ilustrar la amenaza futura, concedemos deliberadamente al atacante una clave clásica de prueba. Esa concesión es un supuesto explícito. No ejecutamos Shor contra una clave real de producción.

**1:15–1:40.** La evidencia acompaña a la animación: 188 pruebas pasan, 23 quedan omitidas. Un pago autónomo de testnet completó el flujo con SDK real después del consentimiento GNAP del titular. El recibo híbrido y la recepción quedaron verificados. Node y OpenSSL verifican nueve propiedades de interoperabilidad. Burp muestra el rechazo de una alteración sin repetir cobros.

**1:40–2:00.** La innovación combina protección PQC de aplicación con evidencia repetible y controles del negocio. El siguiente paso integra el login del equipo. La operación de producción todavía requiere claves y grants durables, una raíz de confianza y las wallets compatibles con la moneda de la compra.

## Evidencia y alcance

La cifra de pruebas corresponde a la corrida final confirmada por el responsable del módulo el 17 de octubre de 2026. Las pruebas automatizadas financieras usan un SDK simulado. La captura observada mediante el MCP de Burp a las 06:35:23 UTC contiene `key 200`, `echo 200` y `echo` alterado `400`, sin repetir cobros desde Burp.

Además, el flujo autónomo con SDK real completó un pago de testnet después de que el titular aceptara un consentimiento GNAP fresco. La interfaz mostró el recibo protegido verificado y el envío y la recepción comprobados. El débito fue de 1,05 EUR y el receptor obtuvo 0,05 EUR. La causa exacta de la diferencia de 1,00 EUR requiere evidencia del proveedor para atribuirla a una comisión concreta. Este resultado no valida el flujo comercial con login y wallets COP, que sigue pendiente de integración.

La demo no certifica cumplimiento PCI DSS o FIPS. No demuestra un ataque cuántico a Ed25519, P-256 o RSA de producción. Una clave ajena rechazada por AES-GCM tampoco prueba la resistencia de ML-KEM frente a algoritmos cuánticos.

## Regeneración

`generar.mjs` usa el runtime de documentos de Codex, con Artifact Tool y pdf-lib ya incluidos. No agrega librerías al producto. Antes de ejecutarlo, localizar sus dependencias con `load_workspace_dependencies` y configurar estas rutas del entorno local:

```text
RUNTIME_NODE_MODULES = directorio node_modules del runtime de documentos
RUNTIME_PYTHON = ejecutable Python del mismo runtime
PRESENTATIONS_SKILL_DIR = directorio del SKILL.md de presentaciones
```

Ejecutar el generador con Node del runtime. Conserva las fuentes Georgia y Arial disponibles en el entorno usado para esta entrega. La salida nueva recibe una marca de tiempo para no sobrescribir una presentación validada. Los renders y los reportes de trabajo quedan en `preview/` y `.build/` y no forman parte de la entrega.
