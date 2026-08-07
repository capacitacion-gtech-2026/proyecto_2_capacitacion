# NF-003: Concurrencia e idempotencia de solicitudes de stock

> **Tipo:** Non-functional
> **Feature:** F-5.1, F-5.3
> **ACs cubiertos:** F-5.1 AC8, AC9; F-5.3 AC6, AC7
> **Status:** draft
> **Dependencias:** DA-002, BE-005
> **Architecture ref:** ARCH-inventario, AD-8

## Requisito

El sistema debe garantizar que:

1. Una clave de idempotencia crea como máximo una solicitud.
2. Una aprobación crea como máximo un movimiento de salida.
3. Una solicitud resuelta no se procesa nuevamente.
4. Una solicitud rechazada (por cualquier motivo) crea cero movimientos, eventos y alertas.
5. Dos aprobaciones concurrentes sobre el mismo producto nunca producen existencia negativa.

Esta Spec define las garantías propuestas para la implementación. No demuestra por sí misma que el sistema las cumpla.

## Criterios de cumplimiento

| Garantía | Criterio medible |
|---|---|
| Idempotencia de creación | La misma `claveIdempotencia` con los mismos datos produce una sola solicitud. |
| Rechazo por clave con datos distintos | La misma `claveIdempotencia` con datos distintos devuelve `CLAVE_REUTILIZADA` sin crear ningún registro. |
| Idempotencia de aprobación | Aprobar una solicitud ya aprobada devuelve el resultado original; no crea un segundo movimiento. |
| Solicitud resuelta no reprocesada | Intentar aprobar o rechazar una solicitud resuelta devuelve el estado actual sin modificar nada. |
| Cero movimientos en rechazo | Una solicitud rechazada (manual o por stock) termina con 0 movimientos, 0 eventos y 0 alertas asociadas. |
| Concurrencia sin existencia negativa | Dos aprobaciones concurrentes con stock insuficiente para ambas resultan en como máximo una aprobación y una `rechazada_sin_stock`. |

## Implementación

### Idempotencia de creación

1. Al crear, la mutation consulta `por_clave_idempotencia` antes de escribir.
2. Si existe un registro con la misma clave y los mismos datos: devuelve la solicitud original sin escribir.
3. Si existe un registro con la misma clave y datos distintos: devuelve `CLAVE_REUTILIZADA` (409).
4. Si no existe ningún registro con esa clave: crea la solicitud nueva.

### Idempotencia de aprobación

1. La mutation de aprobación lee el estado actual de la solicitud al inicio.
2. Si el estado no es `pendiente`: devuelve el resultado persistido sin realizar ninguna escritura adicional.
3. Esto garantiza que dos llamadas consecutivas a aprobar producen un solo movimiento.

### Solicitud resuelta no reprocesada

- La mutation de aprobación y la de rechazo comprueban el estado antes de cualquier escritura.
- Una solicitud en estado `aprobada`, `rechazada` o `rechazada_sin_stock` es inmutable.

### Cero movimientos en rechazo

- La mutation de aprobación sin stock suficiente solo actualiza la solicitud; no invoca `movimientosInventario.registrar`.
- La mutation de rechazo manual solo actualiza la solicitud; no invoca ninguna lógica de movimientos.
- Las mutations son transaccionales en Convex: si fallan después de cualquier escritura parcial, la transacción completa se revierte.

### Consistencia ante aprobaciones concurrentes

- La existencia del producto se lee **dentro de la misma mutation** que realiza la escritura, no antes de llamarla.
- Convex reintenta automáticamente una mutation cuando detecta un conflicto de concurrencia (OCC).
- En el reintento, la existencia se vuelve a leer con el valor actualizado tras la primera aprobación.
- Si la existencia ya no es suficiente en el reintento, la segunda aprobación guarda `rechazada_sin_stock`.
- Este mecanismo garantiza que la existencia nunca quede negativa.

## Escenario obligatorio: dos aprobaciones concurrentes

### Configuración

```
Existencia inicial: 8
Solicitud A: cantidad 5
Solicitud B: cantidad 4
```

### Desarrollo esperado

| Paso | A | B | Existencia |
|---|---|---|---|
| Ambas creadas | `pendiente` | `pendiente` | 8 |
| A se aprueba | `aprobada` (movimiento: -5) | `pendiente` | 3 |
| B intenta aprobarse | — | Comprueba existencia: 3 < 4 → `rechazada_sin_stock` | 3 |

**Resultado final:** Existencia = 3. Solo A produjo un movimiento. B quedó como `rechazada_sin_stock` con `existenciaDisponibleAlResolver: 3`.

> [!IMPORTANT]
> Si ambas aprobaciones ocurren exactamente al mismo tiempo, Convex reintenta una de ellas con el valor actualizado. El resultado es el mismo: una aprobada, una `rechazada_sin_stock`, existencia ≥ 0.

### Mensaje de rechazo esperado para B

```json
{
  "resultado": "rechazada",
  "motivo": "stock_insuficiente",
  "mensaje": "La solicitud requiere 4 unidades, pero solamente quedan 3 disponibles.",
  "cantidadSolicitada": 4,
  "existenciaDisponible": 3
}
```

## Casos a probar en la actividad #65

Los siguientes casos deben verificarse con Vitest y `convex-test` durante la actividad #65:

| Test ID | Título | Tipo |
|---|---|---|
| TC-NF-003-01 | Misma clave con mismos datos crea una sola solicitud | Integración |
| TC-NF-003-02 | Misma clave con datos distintos devuelve CLAVE_REUTILIZADA | Integración |
| TC-NF-003-03 | Aprobar solicitud ya aprobada no crea un segundo movimiento | Integración |
| TC-NF-003-04 | Intentar rechazar una solicitud aprobada devuelve SOLICITUD_YA_RESUELTA | Integración |
| TC-NF-003-05 | Rechazar manualmente no crea movimiento ni evento | Integración |
| TC-NF-003-06 | Aprobar sin stock guarda rechazada_sin_stock y existenciaDisponibleAlResolver | Integración |
| TC-NF-003-07 | Dos aprobaciones concurrentes: una aprobada y una rechazada_sin_stock, existencia ≥ 0 | Concurrencia |
| TC-NF-003-08 | Escenario A=5, B=4, existencia=8: A aprobada (existencia=3), B rechazada_sin_stock (existencia=3) | Concurrencia |

## Impacto

| Spec | Obligación impuesta por NF-003 |
|---|---|
| `DA-002` | El índice `por_clave_idempotencia` debe existir para la comprobación en O(log n). |
| `BE-005` | Las mutations de crear, aprobar y rechazar deben cumplir las garantías de esta Spec. |
| `FE-005` | El formulario debe generar una `claveIdempotencia` nueva por intento; conservar la misma al reintentar por error de red. |

## Definition of Done

- [ ] La misma `claveIdempotencia` con mismos datos produce como máximo una solicitud.
- [ ] La misma `claveIdempotencia` con datos distintos es rechazada.
- [ ] Una aprobación no produce un segundo movimiento si la solicitud ya está aprobada.
- [ ] Una solicitud resuelta no cambia de estado al intentar procesarla nuevamente.
- [ ] Una solicitud rechazada termina con cero movimientos, eventos y alertas.
- [ ] El escenario A=5, B=4, existencia=8 termina con existencia=3, A aprobada y B rechazada_sin_stock.
- [ ] Los casos TC-NF-003-01 al TC-NF-003-08 están identificados y preparados para la actividad #65.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Changelog

- v1.0 (2026-08-06): Borrador inicial de concurrencia e idempotencia de solicitudes de stock (actividad #61).
