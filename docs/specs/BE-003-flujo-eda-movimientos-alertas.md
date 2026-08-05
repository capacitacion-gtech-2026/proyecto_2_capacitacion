# BE-003: Flujo EDA de movimientos y alertas

> **Tipo:** Backend  
> **Feature:** F-3.1, F-3.3  
> **ACs cubiertos:** F-3.1 AC1-AC6; F-3.3 AC1-AC6  
> **Status:** draft  
> **Dependencias:** DA-001, BE-002, NF-001, NF-002

## Qué hace

Define el comportamiento propuesto que ocurre después de registrar una entrada o salida válida. El registro del movimiento producirá `MovimientoInventarioRegistrado`; un consumidor interno evaluará la existencia resultante y creará, conservará o resolverá la alerta del producto.

También define la resolución manual de una alerta. Esta acción cambiará el estado de la alerta, pero no modificará la existencia, el stock mínimo ni el historial de movimientos.

Esta Spec describe un diseño previo a la implementación. Los nombres y contratos se validarán al programar, pero cualquier cambio deberá conservar las reglas y criterios definidos aquí.

## Qué NO hace

- No crea, actualiza ni desactiva productos; eso corresponde a `BE-001`.
- No valida ni aplica la entrada o salida sobre la existencia; eso corresponde a `BE-002`.
- No define el schema completo ni los índices; eso corresponde a `DA-001`.
- No define páginas o componentes React; eso corresponde a `FE-003`.
- No envía correos, SMS o notificaciones push.
- No utiliza Kafka, RabbitMQ ni otro broker externo.
- No implementa reintentos personalizados con espera incremental.
- No permite editar o eliminar movimientos registrados.
- No modifica el stock como consecuencia de resolver una alerta.

## Functions

Los fragmentos siguientes son contratos propuestos. No representan funciones que ya existan en el proyecto.

### Integración con `movimientosInventario.registrar`

La mutation definida por `BE-002` deberá guardar el evento y programar su consumidor dentro de la misma transacción en la que confirma el movimiento y la nueva existencia.

```typescript
// Contrato de integración propuesto dentro de movimientosInventario.registrar.

const eventoId = await ctx.db.insert("eventosDominio", {
  tipo: "MovimientoInventarioRegistrado",
  movimientoId,
  productoId: args.productoId,
  existenciaAnterior,
  existenciaResultante,
  stockMinimo,
  estado: "pendiente",
  creadoEn: Date.now(),
});

await ctx.scheduler.runAfter(
  0,
  internal.eventos.procesarMovimientoInventarioRegistrado,
  { eventoId },
);
```

**Argumentos producidos por `BE-002`:**

| Dato | Propósito |
|---|---|
| `movimientoId` | Identificar el movimiento que originó el evento. |
| `productoId` | Identificar el producto que debe evaluarse. |
| `existenciaAnterior` | Conservar el valor previo para trazabilidad. |
| `existenciaResultante` | Evaluar el stock sin volver a aplicar el movimiento. |
| `stockMinimo` | Conservar el umbral vigente cuando ocurrió el movimiento. |

Si la mutation de movimientos falla, no deberá guardarse el evento ni programarse el consumidor.

### `eventos.procesarMovimientoInventarioRegistrado`

Función interna programada que procesa un evento pendiente. No podrá invocarse directamente desde el navegador.

```typescript
export const procesarMovimientoInventarioRegistrado = internalMutation({
  args: {
    eventoId: v.id("eventosDominio"),
  },
  returns: v.null(),
  handler: async (ctx, { eventoId }) => {
    // 1. Obtener y validar el evento.
    // 2. Terminar sin escribir si ya está procesado.
    // 3. Evaluar existenciaResultante <= stockMinimo.
    // 4. Crear, conservar o resolver la alerta del producto.
    // 5. Marcar el evento como procesado.
    return null;
  },
});
```

**Validaciones propuestas:**

- El documento debe existir en `eventosDominio`.
- Su tipo debe ser `MovimientoInventarioRegistrado`.
- Si su estado es `procesado`, la función termina sin realizar escrituras.
- El producto relacionado debe existir, aunque esté inactivo al momento del procesamiento.
- La evaluación utilizará los valores guardados en el evento, no volverá a sumar o restar la cantidad del movimiento.

**Resultado:**

- Devuelve `null`.
- El evento termina como `procesado` cuando la reacción concluye correctamente.
- La alerta puede quedar creada, conservarse activa, resolverse automáticamente o permanecer sin cambios.

### `alertasInventario.resolverManual`

Mutation pública para resolver una alerta activa por decisión del administrador funcional.

```typescript
export const resolverManual = mutation({
  args: {
    alertaId: v.id("alertasInventario"),
  },
  returns: v.null(),
  handler: async (ctx, { alertaId }) => {
    // 1. Obtener la alerta.
    // 2. Validar que siga activa.
    // 3. Cambiar estado y guardar resolución manual y fecha.
    // 4. No modificar productos ni movimientosInventario.
    return null;
  },
});
```

**Validaciones propuestas:**

- La alerta debe existir.
- La alerta debe tener estado `activa`.
- Una alerta ya resuelta no volverá a modificarse.
- La operación no recibirá una cantidad ni permitirá modificar la existencia.

### Reejecución del consumidor

No se creará una mutation pública de reintento en esta primera versión. Las scheduled mutations de Convex se usarán porque se ejecutan exactamente una vez y Convex reintenta automáticamente los errores internos transitorios.

Los errores de desarrollo permanecerán visibles en los logs y en el estado de la función programada. Una estrategia administrativa de reintentos personalizados queda fuera del alcance de esta Spec y deberá añadirse mediante una nueva decisión si se vuelve necesaria.

## Endpoints (si aplica)

No aplica. La aplicación utilizará funciones de Convex; no se crearán endpoints REST para este flujo.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| No aplica | No aplica | Sin autenticación en la demo | El consumidor es una función interna y la resolución manual utiliza una mutation de Convex. |

## Reglas de negocio

### Producción del evento

1. Solo un movimiento confirmado produce `MovimientoInventarioRegistrado`.
2. Cada movimiento produce exactamente un evento.
3. El evento se guarda con estado `pendiente`.
4. El evento contiene la existencia anterior, la resultante y el stock mínimo vigente.
5. Guardar el evento y programar el consumidor forman parte de la transacción de `movimientosInventario.registrar`.
6. Procesar el evento nunca vuelve a sumar o restar la cantidad del movimiento.

### Evaluación de stock bajo

1. Existe stock bajo cuando `existenciaResultante <= stockMinimo`.
2. Si hay stock bajo y no existe una alerta activa, se crea una alerta.
3. Si hay stock bajo y ya existe una alerta activa, se conserva la existente.
4. Si el stock está por encima del mínimo y existe una alerta activa, se resuelve automáticamente.
5. Si el stock está por encima del mínimo y no existe una alerta activa, no se crea ni modifica ninguna alerta.

### Contenido y estados de la alerta

Una alerta nueva guardará como mínimo:

| Dato | Valor esperado |
|---|---|
| `productoId` | Producto evaluado. |
| `eventoOrigenId` | Evento que produjo la alerta. |
| `estado` | `activa`. |
| `existenciaAlGenerarse` | Existencia resultante del evento. |
| `stockMinimo` | Umbral guardado en el evento. |
| `creadoEn` | Fecha de creación. |
| `resueltoEn` | Ausente mientras permanezca activa. |
| `formaResolucion` | Ausente mientras permanezca activa; después será `automatica` o `manual`. |

### Idempotencia

1. Un evento con estado `procesado` no volverá a producir efectos.
2. Solo podrá existir una alerta activa de stock bajo por producto.
3. Volver a ejecutar el consumidor con el mismo `eventoId` no creará una alerta duplicada.
4. La idempotencia del consumidor no sustituye la idempotencia del registro de movimientos definida en `NF-001` y `BE-002`.

### Resolución automática

1. Ocurre cuando una entrada deja `existenciaResultante > stockMinimo`.
2. Cambia la alerta activa a `resuelta`.
3. Guarda `formaResolucion: "automatica"` y `resueltoEn`.
4. No elimina la alerta; conserva el historial del episodio.

### Resolución manual

1. Puede ejecutarse aunque la existencia todavía sea menor o igual al mínimo.
2. Cambia la alerta activa a `resuelta`.
3. Guarda `formaResolucion: "manual"` y `resueltoEn`.
4. No modifica la existencia ni registra un movimiento.
5. El producto continúa mostrando stock bajo mientras cumpla `existenciaActual <= stockMinimo`.
6. Si después de la resolución manual se registra otro movimiento que mantiene el stock bajo, ese nuevo evento podrá crear una nueva alerta activa.

### Manejo de fallos

1. El movimiento y la existencia se confirman antes de ejecutar el consumidor.
2. Un fallo del consumidor no vuelve a ejecutar ni revierte el movimiento.
3. El consumidor será una `internalMutation` para conservar atomicidad en sus propias escrituras.
4. Si el consumidor falla antes de completar la reacción, sus escrituras se revierten.
5. Convex reintentará automáticamente los errores internos transitorios de la scheduled mutation.
6. Los errores de desarrollo se revisarán mediante los logs y el estado de `_scheduled_functions`.
7. No se implementará un sistema personalizado de múltiples reintentos en esta versión.

### Errores de dominio

| Código | Cuándo ocurre | Resultado esperado |
|---|---|---|
| `EVENTO_NO_ENCONTRADO` | No existe el `eventoId` recibido. | El consumidor termina con error y no escribe. |
| `TIPO_EVENTO_INVALIDO` | El evento no es `MovimientoInventarioRegistrado`. | El consumidor termina con error y no escribe. |
| `PRODUCTO_NO_ENCONTRADO` | No existe el producto relacionado. | El consumidor termina con error y no crea alerta. |
| `ALERTA_NO_ENCONTRADA` | No existe la alerta enviada a resolución manual. | La mutation informa el error sin modificar datos. |
| `ALERTA_YA_RESUELTA` | Se intenta resolver manualmente una alerta resuelta. | La mutation termina sin modificar la alerta. |

## Tests asociados

Los IDs identifican pruebas que deberán crearse durante la implementación. En este momento todavía no existen.

| Test ID | Título | Tipo |
|---|---|---|
| TC-BE-003-01 | Un movimiento con stock bajo crea una alerta activa | Integración |
| TC-BE-003-02 | Un movimiento por encima del mínimo no crea alerta | Integración |
| TC-BE-003-03 | Reprocesar el mismo evento no duplica la alerta | Integración |
| TC-BE-003-04 | Otro movimiento bajo conserva una sola alerta activa | Integración |
| TC-BE-003-05 | Una entrada por encima del mínimo resuelve automáticamente | Integración |
| TC-BE-003-06 | Resolver manualmente no modifica la existencia | Integración |
| TC-BE-003-07 | Un movimiento posterior a resolución manual puede crear otra alerta | Integración |
| TC-BE-003-08 | Un fallo del consumidor no revierte ni repite el movimiento | Integración |
| TC-BE-003-09 | El consumidor no puede invocarse directamente desde el cliente | Seguridad |
