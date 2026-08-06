# NF-001: Integridad, idempotencia y manejo de fallos

> **Tipo:** Non-functional
> **Feature:** F-2.1, F-2.2, F-3.1, F-3.3
> **ACs cubiertos:** F-2.1 AC4, AC6; F-2.2 AC4-AC6; F-3.1 AC5, AC6; F-3.3 AC3
> **Status:** draft
> **Dependencias:** DA-001, BE-002, BE-003
> **Architecture ref:** ARCH-inventario, AD-2, AD-3, AD-4 y AD-5

## Requisito

El sistema debe conservar una existencia consistente aunque una solicitud se envíe más de una vez, dos operaciones intenten modificar el mismo producto o falle el procesamiento de una alerta. Ningún duplicado o fallo posterior podrá sumar o descontar dos veces, dejar escrituras parciales o revertir un movimiento ya confirmado.

Esta Spec define garantías propuestas para la implementación. Todavía no demuestra que el sistema las cumpla.

## Criterio de cumplimiento

| Garantía | Criterio medible |
|---|---|
| Movimiento idempotente | Repetir la misma solicitud de entrada o salida 2 o más veces produce un movimiento, un cambio de existencia y un evento. |
| Existencia no negativa | El 100% de las salidas que superen la existencia disponible se rechazan sin modificar producto, movimiento o evento. |
| Escritura atómica | Si falla cualquier validación del registro, quedan 0 escrituras parciales. |
| Consistencia concurrente | Dos movimientos concurrentes terminan con una existencia equivalente a aplicar ambas operaciones válidas una vez. |
| Consumidor idempotente | Procesar 2 o más veces el mismo evento no crea alertas duplicadas ni modifica el stock. |
| Unicidad de alerta activa | Existe como máximo una alerta activa de stock bajo por producto. |
| Aislamiento del fallo | Si falla el consumidor, el movimiento confirmado y la existencia resultante permanecen sin duplicarse ni revertirse. |
| Resolución sin efecto de stock | Resolver manualmente una alerta produce 0 cambios en `existenciaActual` y 0 movimientos nuevos. |

El objetivo es cero casos de corrupción de existencia causados por duplicados o fallos dentro de las pruebas definidas para esta versión.

## Implementación

### Idempotencia del movimiento

1. El cliente generará una `claveIdempotencia` para cada intento lógico.
2. La misma clave se conservará cuando el cliente reintente por error de red.
3. `movimientosInventario.registrar` consultará `por_clave_idempotencia` antes de escribir.
4. Si ya existe un movimiento con la clave, devolverá el resultado original sin volver a modificar la existencia.
5. Después de una operación correcta, el siguiente movimiento utilizará una clave nueva.

### Atomicidad del registro

Una única mutation de Convex deberá:

1. Obtener el producto.
2. Validar que esté activo.
3. Validar tipo y cantidad.
4. Comprobar stock suficiente si es salida.
5. Insertar el movimiento.
6. Actualizar `existenciaActual`.
7. Insertar `MovimientoInventarioRegistrado`.
8. Programar al consumidor.

Si cualquier paso falla, la mutation completa deberá revertirse.

### Consistencia ante operaciones concurrentes

- La existencia anterior se leerá dentro de la misma mutation que realiza la escritura.
- No se aceptará una existencia calculada únicamente en el navegador.
- Convex volverá a ejecutar automáticamente una mutation cuando detecte un conflicto de concurrencia.
- La validación de stock se repetirá con el valor vigente durante la transacción reintentada.

### Idempotencia del consumidor

1. `eventos.procesarMovimientoInventarioRegistrado` recibirá solamente `eventoId`.
2. Si el evento ya está `procesado`, terminará sin escribir.
3. El consumidor nunca aplicará nuevamente la entrada o salida.
4. Antes de crear una alerta buscará otra alerta activa del producto.
5. Al completar la reacción marcará el evento como `procesado` dentro de la misma mutation.

### Manejo de fallos

- El consumidor se ejecutará después de confirmar la mutation del movimiento.
- Un fallo del consumidor no formará parte de la transacción que actualizó la existencia.
- El consumidor será una scheduled `internalMutation` para que sus escrituras sean atómicas.
- Convex reintentará errores internos transitorios de la scheduled mutation.
- Los errores de desarrollo serán visibles en logs y `_scheduled_functions`.
- No se implementarán reintentos personalizados con espera incremental en esta versión.
- Una recuperación manual futura deberá reprocesar el mismo `eventoId`; no podrá crear un movimiento nuevo.

### Resolución manual

- `alertasInventario.resolverManual` solo actualizará la alerta.
- No recibirá cantidad ni existencia como argumento.
- No invocará `movimientosInventario.registrar`.
- El indicador de stock bajo seguirá calculándose con el producto, independientemente del estado de la alerta.

## Impacto

| Spec | Obligación impuesta por NF-001 |
|---|---|
| `DA-001` | Definir `claveIdempotencia`, índices de búsqueda, estados de evento y unicidad lógica de alertas. |
| `BE-002` | Validar duplicados y ejecutar el movimiento como una sola transacción. |
| `BE-003` | Procesar eventos idempotentemente y aislar fallos de alertas. |
| `FE-002` | Conservar la misma clave al reintentar una solicitud y evitar múltiples envíos accidentales. |
| `FE-003` | Resolver alertas sin permitir modificar la existencia. |

Si cualquiera de estas Specs cambia el mecanismo de movimiento o procesamiento, deberá revisarse nuevamente su cumplimiento con NF-001.

## Verificación

La verificación se realizará con Vitest y `convex-test` sobre las funciones de Convex.

Se probarán:

- Repetición secuencial de la misma clave.
- Envíos concurrentes con la misma clave.
- Dos salidas concurrentes cercanas al límite de stock.
- Falla de validación después de leer el producto.
- Ejecución repetida del mismo consumidor.
- Falla del consumidor después de confirmar el movimiento.
- Resolución manual sin cambios en producto o movimientos.

Cada prueba comparará el número de movimientos, eventos y alertas, además de la existencia final. No será suficiente comprobar únicamente el mensaje mostrado en la interfaz.

## Contexto para el agente

Leer `docs/02-architecture.md` AD-2 a AD-5 y las Specs `DA-001`, `BE-002` y `BE-003`. Este requisito pertenece a las fases de movimientos y alertas; no autoriza a implementarlas durante la primera unidad de productos.

## Definition of Done

- [ ] Una clave idempotente produce como máximo un movimiento y un cambio de existencia.
- [ ] Ninguna salida válida puede dejar existencia negativa.
- [ ] Las operaciones concurrentes mantienen una existencia consistente.
- [ ] Reprocesar un evento no duplica alertas ni modifica stock.
- [ ] Resolver una alerta no crea movimientos ni cambia la existencia.
- [ ] Las verificaciones de concurrencia, fallos e idempotencia fueron ejecutadas y registradas.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Verificaciones asociadas

Los IDs siguientes son propuestas para pruebas todavía no implementadas.

| Test ID | Título | Tipo |
|---|---|---|
| TC-NF-001-01 | Repetir una entrada con la misma clave modifica una sola vez | Integración |
| TC-NF-001-02 | Repetir una salida con la misma clave modifica una sola vez | Integración |
| TC-NF-001-03 | Una salida sin stock no deja escrituras parciales | Integración |
| TC-NF-001-04 | Dos salidas concurrentes no producen existencia negativa | Concurrencia |
| TC-NF-001-05 | Reprocesar el evento no duplica la alerta | Integración |
| TC-NF-001-06 | Un fallo del consumidor no modifica el movimiento confirmado | Integración |
| TC-NF-001-07 | Resolver manualmente no cambia la existencia | Integración |

## Changelog

- v1.1 (2026-08-05): Se normalizó la cabecera y se añadieron dependencias, contexto, fase y Definition of Done.
- v1.0 (2026-08-05): Borrador inicial de integridad, idempotencia y fallos.
