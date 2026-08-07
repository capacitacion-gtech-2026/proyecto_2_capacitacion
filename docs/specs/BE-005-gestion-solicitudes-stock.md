# BE-005: Gestión de solicitudes de stock

> **Tipo:** Backend
> **Feature:** F-5.1, F-5.2, F-5.3
> **ACs cubiertos:** F-5.1 AC1-AC9; F-5.2 AC1-AC5; F-5.3 AC1-AC7
> **Status:** draft
> **Dependencias:** DA-002, BE-002, NF-003
> **Architecture ref:** ARCH-inventario, AD-8

## Propósito

Definir las funciones de Convex que implementan el ciclo de vida completo de las solicitudes de stock: creación, consulta, aprobación y rechazo. Toda la lógica de negocio reside aquí; la API HTTP (BE-006) y la interfaz (FE-005) solo la invocan.

## Funciones

### `solicitudesStock.crear` — mutation

Crea una nueva solicitud de stock para un producto activo.

**Argumentos:**

| Campo | Tipo | Requerido |
|---|---|---|
| `productoId` | `Id<"productos">` | Sí |
| `cantidadSolicitada` | `number` | Sí |
| `motivo` | `string` | Sí |
| `solicitante` | `string` | No |
| `claveIdempotencia` | `string` | Sí |
| `origen` | `"interfaz" \| "api"` | Sí |

**Flujo:**

1. Buscar por `claveIdempotencia`.
   - Si existe con los **mismos** datos: devolver la solicitud original sin escribir. *(Idempotencia)*
   - Si existe con **datos distintos**: rechazar con código `CLAVE_REUTILIZADA`.
2. Obtener el producto. Si no existe: `PRODUCTO_NO_ENCONTRADO`.
3. Si el producto está inactivo: `PRODUCTO_INACTIVO`.
4. Validar que `cantidadSolicitada` sea un entero mayor que cero. Si no: `CANTIDAD_INVALIDA`.
5. Validar que `motivo` no esté vacío. Si está vacío: `MOTIVO_REQUERIDO`.
6. Leer `existenciaActual` e indicar si hay stock suficiente en `disponibleAlSolicitar` (solo informativo).
7. Insertar la solicitud con estado `pendiente`.
8. Devolver la solicitud creada.

**Garantías:**
- No modifica `existenciaActual` de `productos`.
- No crea movimientos, eventos ni alertas.
- La disponibilidad al solicitar es solo informativa.

---

### `solicitudesStock.listar` — query

Devuelve todas las solicitudes ordenadas por `creadaEn` descendente. Puede filtrarse por estado.

**Argumentos:**

| Campo | Tipo | Requerido |
|---|---|---|
| `estado` | `"pendiente" \| "aprobada" \| "rechazada" \| "rechazada_sin_stock"` | No |

**Flujo:**

1. Si se proporciona `estado`, usar el índice `por_estado_creada_en`.
2. Si no se proporciona, devolver todas ordenadas por `creadaEn`.
3. Es una query reactiva: los clientes de Convex reciben actualizaciones en tiempo real.

---

### `solicitudesStock.obtener` — query

Devuelve el detalle de una sola solicitud por su `Id`.

**Argumentos:**

| Campo | Tipo | Requerido |
|---|---|---|
| `solicitudId` | `Id<"solicitudesStock">` | Sí |

**Flujo:**

1. Obtener el documento. Si no existe: devolver `null`.

---

### `solicitudesStock.aprobar` — mutation

Aprueba una solicitud pendiente. Comprueba la existencia en tiempo real dentro de la misma transacción.

**Argumentos:**

| Campo | Tipo | Requerido |
|---|---|---|
| `solicitudId` | `Id<"solicitudesStock">` | Sí |

**Flujo:**

1. Obtener la solicitud. Si no existe: `SOLICITUD_NO_ENCONTRADA`.
2. Si el estado no es `pendiente`: devolver el resultado persistido sin volver a procesar. *(Idempotencia de aprobación)*
3. Obtener el producto. Leer `existenciaActual` **dentro de esta misma mutation**.
4. Si `existenciaActual >= cantidadSolicitada`:
   - Invocar la lógica interna de `movimientosInventario.registrar` (tipo `salida`, cantidad, motivo y claveIdempotencia derivada).
   - Actualizar la solicitud: `estado = "aprobada"`, `movimientoId`, `existenciaDisponibleAlResolver`, `resueltaEn`, `actualizadaEn`.
   - Devolver `{ resultado: "aprobada", movimientoId }`.
5. Si `existenciaActual < cantidadSolicitada`:
   - **No lanzar un error.** Guardar el resultado dentro de la misma transacción.
   - Actualizar la solicitud: `estado = "rechazada_sin_stock"`, `existenciaDisponibleAlResolver`, `resueltaEn`, `actualizadaEn`.
   - Devolver el resultado de rechazo (ver formato abajo).

**Resultado de rechazo por stock insuficiente:**

```json
{
  "resultado": "rechazada",
  "motivo": "stock_insuficiente",
  "mensaje": "La solicitud requiere 4 unidades, pero solamente quedan 3 disponibles.",
  "cantidadSolicitada": 4,
  "existenciaDisponible": 3
}
```

**Garantías:**
- La existencia se lee dentro de la misma transacción que realiza la escritura.
- Si la existencia no es suficiente, no se produce ningún movimiento, evento ni alerta.
- El rechazo se guarda y se devuelve; no se lanza como excepción para evitar revertir la transacción.
- Dos aprobaciones concurrentes sobre el mismo producto nunca producen existencia negativa. Convex reintentará automáticamente la transacción en caso de conflicto; la segunda validará con el valor vigente y, si ya no alcanza, quedará como `rechazada_sin_stock`.

---

### `solicitudesStock.rechazar` — mutation

Rechaza manualmente una solicitud pendiente.

**Argumentos:**

| Campo | Tipo | Requerido |
|---|---|---|
| `solicitudId` | `Id<"solicitudesStock">` | Sí |
| `motivoRechazo` | `string` | Sí |

**Flujo:**

1. Obtener la solicitud. Si no existe: `SOLICITUD_NO_ENCONTRADA`.
2. Si el estado no es `pendiente`: `SOLICITUD_YA_RESUELTA`.
3. Actualizar la solicitud: `estado = "rechazada"`, `motivoRechazo`, `resueltaEn`, `actualizadaEn`.
4. Devolver la solicitud actualizada.

**Garantías:**
- No crea movimientos, eventos ni alertas.
- No modifica `existenciaActual`.

---

## Reglas de negocio

| Regla | Descripción |
|---|---|
| Crear no modifica stock | La creación es solo un registro; la existencia no cambia. |
| Misma clave + mismos datos → solicitud original | Idempotencia: no se crea un duplicado. |
| Misma clave + datos distintos → error `CLAVE_REUTILIZADA` | La clave no puede reutilizarse con otra solicitud. |
| Aprobar crea exactamente una salida | La lógica reutiliza `movimientosInventario.registrar`; no se duplica código. |
| Rechazar no crea movimientos | Ni el rechazo manual ni el rechazo por stock insuficiente generan movimiento, evento o alerta. |
| Solicitud resuelta no se procesa de nuevo | Si el estado no es `pendiente`, se devuelve el resultado persistido. |
| Sin stock → `rechazada_sin_stock` guardada | El resultado se guarda en la transacción; no se lanza error. |

## Códigos de error

| Código | Situación | Respuesta HTTP equivalente |
|---|---|---|
| `PRODUCTO_NO_ENCONTRADO` | El producto referenciado no existe. | 404 |
| `PRODUCTO_INACTIVO` | El producto está inactivo. | 400 |
| `CANTIDAD_INVALIDA` | La cantidad no es un entero mayor que cero. | 400 |
| `MOTIVO_REQUERIDO` | El motivo está vacío. | 400 |
| `CLAVE_REUTILIZADA` | Misma clave con datos distintos. | 409 |
| `SOLICITUD_NO_ENCONTRADA` | La solicitud no existe. | 404 |
| `SOLICITUD_YA_RESUELTA` | Se intenta rechazar una solicitud que ya no está pendiente. | 409 |

## Dependencias de otras Specs

| Spec | Obligación impuesta por BE-005 |
|---|---|
| `DA-002` | La tabla `solicitudesStock` debe existir con los índices definidos. |
| `BE-002` | La lógica de `registrar` (salida) debe poder invocarse internamente. |
| `NF-003` | Las garantías de idempotencia y concurrencia deben cumplirse a nivel de mutation. |

## Definition of Done

- [ ] `solicitudesStock.crear` valida producto activo, cantidad, motivo e idempotencia antes de insertar.
- [ ] `solicitudesStock.crear` no modifica la existencia del producto.
- [ ] `solicitudesStock.aprobar` lee la existencia dentro de la misma transacción.
- [ ] Con stock suficiente, la aprobación crea exactamente un movimiento de salida.
- [ ] Sin stock, la aprobación guarda `rechazada_sin_stock` sin crear movimiento ni evento.
- [ ] El rechazo por stock insuficiente se guarda en la transacción (no se lanza como excepción).
- [ ] `solicitudesStock.rechazar` no crea movimientos ni modifica la existencia.
- [ ] Una solicitud resuelta no puede procesarse de nuevo.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Verificaciones asociadas

| Test ID | Título | Tipo |
|---|---|---|
| TC-BE-005-01 | Crear solicitud devuelve estado pendiente sin cambiar existencia | Integración |
| TC-BE-005-02 | Misma clave con mismos datos devuelve la solicitud original | Integración |
| TC-BE-005-03 | Misma clave con datos distintos devuelve CLAVE_REUTILIZADA | Integración |
| TC-BE-005-04 | Aprobar con stock crea un movimiento y deja estado aprobada | Integración |
| TC-BE-005-05 | Aprobar sin stock guarda rechazada_sin_stock sin movimiento | Integración |
| TC-BE-005-06 | Rechazar manualmente deja estado rechazada sin movimiento | Integración |
| TC-BE-005-07 | Aprobar solicitud ya aprobada devuelve el resultado sin procesar de nuevo | Integración |
| TC-BE-005-08 | Dos aprobaciones concurrentes no producen existencia negativa | Concurrencia |

## Changelog

- v1.0 (2026-08-06): Borrador inicial de la gestión de solicitudes de stock (actividad #61).
