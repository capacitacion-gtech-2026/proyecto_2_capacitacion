# BE-006: API HTTP de solicitudes de stock

> **Tipo:** Backend
> **Feature:** F-5.1, F-5.2, F-5.3
> **ACs cubiertos:** F-5.1 AC5; F-5.2 AC1-AC5; F-5.3 AC1-AC7
> **Status:** draft
> **Dependencias:** BE-005, DA-002
> **Architecture ref:** ARCH-inventario, AD-8

## Propósito

Definir las rutas HTTP que exponen la capacidad de solicitudes de stock a herramientas externas (por ejemplo, Postman). Todas las rutas delegan en las funciones de Convex definidas en BE-005; no contienen lógica de negocio propia.

> [!NOTE]
> Esta API es demostrativa y utiliza datos ficticios mientras no exista autenticación. No debe utilizarse con inventario real hasta que se incorpore un mecanismo de autenticación y autorización.

## Rutas

### `POST /api/solicitudes-stock`

Crea una nueva solicitud de stock.

**Body (JSON):**

```json
{
  "productoId": "string (Id de producto)",
  "cantidadSolicitada": 4,
  "motivo": "string, obligatorio",
  "solicitante": "string, opcional",
  "claveIdempotencia": "string, obligatorio"
}
```

> El campo `origen` se establece automáticamente como `"api"` cuando la solicitud llega por esta ruta.

**Respuestas:**

| Código | Situación | Body |
|---|---|---|
| `201` | Solicitud creada correctamente | Documento `solicitudesStock` completo |
| `200` | Solicitud ya existía (idempotencia) | Documento `solicitudesStock` original |
| `400` | Argumentos inválidos (producto inactivo, cantidad incorrecta, motivo vacío) | `{ "error": "CODIGO", "mensaje": "..." }` |
| `404` | Producto no encontrado | `{ "error": "PRODUCTO_NO_ENCONTRADO", "mensaje": "..." }` |
| `409` | Clave reutilizada con datos distintos | `{ "error": "CLAVE_REUTILIZADA", "mensaje": "..." }` |
| `500` | Error interno | `{ "error": "ERROR_INTERNO", "mensaje": "Error inesperado." }` |

---

### `GET /api/solicitudes-stock`

Devuelve el listado de solicitudes. Acepta filtro por estado.

**Query params:**

| Parámetro | Tipo | Requerido |
|---|---|---|
| `estado` | `pendiente \| aprobada \| rechazada \| rechazada_sin_stock` | No |

**Respuestas:**

| Código | Situación | Body |
|---|---|---|
| `200` | Lista obtenida | Array de documentos `solicitudesStock` |
| `400` | Valor de `estado` inválido | `{ "error": "ESTADO_INVALIDO", "mensaje": "..." }` |
| `500` | Error interno | `{ "error": "ERROR_INTERNO", "mensaje": "..." }` |

---

### `GET /api/solicitudes-stock/[solicitudId]`

Devuelve el detalle de una solicitud específica.

**Path params:**

| Parámetro | Tipo | Requerido |
|---|---|---|
| `solicitudId` | `string (Id de solicitudesStock)` | Sí |

**Respuestas:**

| Código | Situación | Body |
|---|---|---|
| `200` | Solicitud encontrada | Documento `solicitudesStock` completo |
| `404` | Solicitud no encontrada | `{ "error": "SOLICITUD_NO_ENCONTRADA", "mensaje": "..." }` |
| `500` | Error interno | `{ "error": "ERROR_INTERNO", "mensaje": "..." }` |

---

### `POST /api/solicitudes-stock/[solicitudId]/aprobar`

Aprueba una solicitud pendiente. Comprueba la existencia en tiempo real.

**Path params:**

| Parámetro | Tipo | Requerido |
|---|---|---|
| `solicitudId` | `string (Id de solicitudesStock)` | Sí |

**Body:** Ninguno requerido.

**Respuestas:**

| Código | Situación | Body |
|---|---|---|
| `200` | Solicitud aprobada | `{ "resultado": "aprobada", "movimientoId": "..." }` |
| `200` | Rechazada por stock insuficiente (guardada) | `{ "resultado": "rechazada", "motivo": "stock_insuficiente", "mensaje": "...", "cantidadSolicitada": N, "existenciaDisponible": M }` |
| `404` | Solicitud no encontrada | `{ "error": "SOLICITUD_NO_ENCONTRADA", "mensaje": "..." }` |
| `409` | Solicitud ya resuelta (transición inválida) | `{ "error": "SOLICITUD_YA_RESUELTA", "mensaje": "..." }` |
| `500` | Error interno | `{ "error": "ERROR_INTERNO", "mensaje": "..." }` |

> [!IMPORTANT]
> El rechazo por stock insuficiente devuelve **200** porque la solicitud quedó guardada correctamente como `rechazada_sin_stock`. No es un error HTTP; el resultado es una resolución válida del recurso.

---

### `POST /api/solicitudes-stock/[solicitudId]/rechazar`

Rechaza manualmente una solicitud pendiente.

**Path params:**

| Parámetro | Tipo | Requerido |
|---|---|---|
| `solicitudId` | `string (Id de solicitudesStock)` | Sí |

**Body (JSON):**

```json
{
  "motivoRechazo": "string, obligatorio"
}
```

**Respuestas:**

| Código | Situación | Body |
|---|---|---|
| `200` | Solicitud rechazada | Documento `solicitudesStock` actualizado |
| `400` | `motivoRechazo` vacío | `{ "error": "MOTIVO_REQUERIDO", "mensaje": "..." }` |
| `404` | Solicitud no encontrada | `{ "error": "SOLICITUD_NO_ENCONTRADA", "mensaje": "..." }` |
| `409` | Solicitud ya resuelta | `{ "error": "SOLICITUD_YA_RESUELTA", "mensaje": "..." }` |
| `500` | Error interno | `{ "error": "ERROR_INTERNO", "mensaje": "..." }` |

---

## Resumen de códigos HTTP

| Código | Situación general |
|---|---|
| `201` | Solicitud creada por primera vez. |
| `200` | Consulta, idempotencia o resultado persistido (incluye rechazo por stock). |
| `400` | Argumentos inválidos en el cuerpo o los parámetros. |
| `404` | Recurso (producto o solicitud) no encontrado. |
| `409` | Clave reutilizada con datos distintos o transición de estado inválida. |
| `500` | Error interno no controlado. |

## Validaciones en la ruta HTTP

Las rutas HTTP validan únicamente:
- Que el body sea JSON válido.
- Que los campos obligatorios estén presentes y tengan el tipo correcto.
- Que los valores de `estado` en query params sean uno de los literales definidos.

Toda validación de negocio (producto activo, stock suficiente, idempotencia) se realiza en BE-005.

## Relación con la interfaz

La interfaz (FE-005) utiliza directamente las mutations y queries de Convex, **no** estas rutas HTTP. Las rutas HTTP son para acceso externo desde herramientas como Postman. Las solicitudes creadas por la API aparecen en la interfaz en tiempo real gracias a las queries reactivas de Convex.

## Definition of Done

- [ ] Las cinco rutas definidas responden con los códigos correctos.
- [ ] El rechazo por stock insuficiente devuelve 200 con el cuerpo de resultado.
- [ ] Las rutas no contienen lógica de negocio; solo validan la forma del request y delegan en BE-005.
- [ ] Una solicitud creada por la API aparece en la interfaz sin recargar.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Verificaciones asociadas

| Test ID | Título | Tipo |
|---|---|---|
| TC-BE-006-01 | POST /api/solicitudes-stock devuelve 201 con solicitud creada | Integración HTTP |
| TC-BE-006-02 | POST /api/solicitudes-stock con misma clave devuelve 200 | Integración HTTP |
| TC-BE-006-03 | GET /api/solicitudes-stock devuelve listado filtrable | Integración HTTP |
| TC-BE-006-04 | GET /api/solicitudes-stock/[id] devuelve 404 si no existe | Integración HTTP |
| TC-BE-006-05 | POST aprobar con stock insuficiente devuelve 200 con resultado rechazada | Integración HTTP |
| TC-BE-006-06 | POST rechazar devuelve 409 si la solicitud ya está resuelta | Integración HTTP |

## Changelog

- v1.0 (2026-08-06): Borrador inicial de la API HTTP de solicitudes de stock (actividad #61).
