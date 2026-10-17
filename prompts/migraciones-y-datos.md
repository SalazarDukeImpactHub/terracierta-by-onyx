# Prompts — Migraciones y datos de Álvaro

> Texto real de cada instrucción recibida para esta área. La hora exacta no quedó registrada en la sesión (2026-10-17, mañana).

---

## Entrada 1 — Qué hacer con las variables

```
no esta tanclaro que debo hacer porque si cambio las variables mias no se romperia alno tener el las otras sed o como a la s variables que ya existen le agregamos las de alvaro para que todo quede ok si migramos al info de alvaro a mi cuenta para que no se alteren las claves
```

### Resultado breve
- Recomendación: dejar las variables de Supabase del equipo, **sumar** solo las del riel de pagos y llevar el esquema y los datos de Álvaro al proyecto del equipo.

## Entrada 2 — Los exportes de Álvaro

Jennifer adjuntó diez archivos exportados por Álvaro desde su base (`profiles`, `cooperativas`, `pedidos`, `ofertas`, `usuarios`, `productos`, `pagos`, `tiendas_publicas`, `lotes` y `sesiones`; no se copian aquí porque tienen hashes, cookies de sesión y datos personales) con este mensaje:

```
no ya te paso lo que migre alvaro y ahi si hacemos  el sql final ya agregue las variables a vercel de  riel de cookie
```

### Resultado breve
- **Aviso:** los archivos llegaron al modelo antes de que se pudiera pedir confirmación; contenían una cookie viva de Test Wallet, hashes de contraseña y números de documento. Se avisó para que Álvaro cierre su sesión de Test Wallet.
- Se generó el SQL final **fuera del repositorio** (esquema nuevo + datos base) y un ensayo que no guarda nada. **La cookie no se copia** a la base del equipo.

## Entrada 3 — Qué aplicar

```
lo que sea lo mejor para que todo funcione bien y cuales son las migraciones o sql que debo aplicar definitivos para deploy y revision
```

### Resultado breve
- Se renumeró la migración duplicada (`20261017000000_usuarios.sql` → `20261017000100_usuarios.sql`) en la rama `fix/migraciones-sin-duplicados`, y se comprobó que `supabase db reset` aplica las 8 migraciones.
- **Supuesto declarado:** "lo que sea lo mejor" se entendió como renumerar y reiniciar la base local de prueba, sin subir nada.

### Archivos tocados
`supabase/migrations/20261017000100_usuarios.sql` (renombrado), `AI_USAGE.md`, `prompts/migraciones-y-datos.md`.

---

## Entrada 4 — Subir y fusionar el cambio de migraciones

```
Sí: subí la rama, abrí el PR contra main y fusionalo cuando los checks estén verdes; después verificá producción.
```

### Resultado breve
- PR 38 fusionado en `main` con sus checks verdes; las migraciones quedan en 8 con versión única. Producción respondía bien, pero la base de la nube todavía no tenía el esquema nuevo.

---

## Entrada 5 — Los SQL para aplicar

```
y dame aqui los sql que debo aplicar
```

### Resultado breve
- Se dividió el SQL en dos pasos: `01a-esquema.sql` (sin datos personales, pegado en el chat) y `01b-datos-base.sql` (con hashes; entregado como archivo). **Supuesto declarado:** la cédula real de Álvaro se reemplazó por una ficticia en lo que va a la base del equipo.

---

## Entrada 6 — Resultado de la nube, limpieza y "Entrar rápido"

Jennifer pegó la tabla de 13 chequeos del SQL aplicado en su Supabase, todos en `OK`, sin más texto. Después escribió:

```
Sí: prepará el SQL de limpieza dirigido (con consulta previa, sin tocar esquema ni cuentas) y arreglá 'Entrar rápido' en una rama con commits; no apliques nada en la nube ni abras PR todavía.
```

### Resultado breve
- Se prepararon `04a-limpieza-ver-que-se-borra.sql` (solo lee) y `04b-limpieza-borrar.sql` (una transacción), fuera del repositorio. **No se aplicó nada en la nube.**
- **"Entrar rápido" no se tocó:** el agente había dicho que estaba roto sin haber leído el código de la acción; al probarlo funciona. Queda como corrección en `AI_USAGE.md`.

---

## Entrada 7 — Resultado de la limpieza y PR

Jennifer pegó la tabla de 8 chequeos de la limpieza, todos en `OK`, y escribió:

```
revisemos que funciono y hacemos el pr
```

### Resultado breve
- Se verificó producción en solo lectura y se registró el resultado. Se corrigió en `AI_USAGE.md` una suposición del agente sobre un producto de prueba que resultó falsa.
- Se subió la rama y se abrió el PR solo con documentos.

---

## Entrada 8 — Arreglar tests y jsdom

```
Arreglá primero los 4 tests y jsdom en una rama nueva con PR; la foto después.
```

### Resultado breve
- Se agregó `jsdom` y se instalaron las dependencias declaradas que faltaban. Los 4 tests restantes dependían de la decisión del ADR-001; se pidió elegir riel.

---

## Entrada 9 — Riel de cookie oficial

```
El riel oficial es el de cookie que corre hoy. Adaptá los 4 tests a ese riel y a la política real de cooperativas, y dejá el SDK/GNAP documentado como futuro en el ADR-001.
```

### Resultado breve
- Los 4 tests se adaptaron al riel de cookie y a la política real (la cooperativa puede comprar y pagar ofertas). El ADR-001 registra la decisión, los riesgos aceptados y la condición para migrar al SDK/GNAP; **sigue en Borrador** hasta que Jennifer lo acepte.

---

## Entrada 10 — ADR-001 a Aceptado

```
Sí: pasá el ADR-001 a Aceptado con la decisión del riel de cookie, en un PR docs-only.
```

### Resultado breve
- El ADR-001 queda en *Aceptado* (provisional). El agente señaló que el README aún lo llama borrador y no lo modificó sin aprobación.

---

## Entrada 11 — README y fusión

```
Sí: actualizá las cuatro menciones del README al ADR-001 aceptado en el PR 42 y fusionalo con checks verdes.
```

### Resultado breve
- En realidad eran ocho menciones por idioma (más la fila de pruebas, que había quedado falsa tras el PR 41); se actualizaron las de ES y EN en el mismo PR.

---

## Entrada 12 — Solo Álvaro en la tienda y solo cuentas limpias

Dos mensajes de Jennifer, y después pegó dos tablas de verificación:

```
un detalle es marta aun aparece en al tienda solo deberia estar alvaro y revisa lo que ahce falta
```

```
no als extras no necesitamso solo las que ya son limpias y ordenadas todo debe quedar ok y limpio
```

### Resultado breve
- Se despublicaron los productos de Marta en la nube (no se borraron) y se quitaron las dos cuentas extra. Ambos SQL se probaron en local antes y los ejecutó Jennifer; el agente no aplicó nada en la nube.
