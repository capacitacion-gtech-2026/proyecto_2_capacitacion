# FE-005: Interfaz de solicitudes de stock

> **Tipo:** Frontend
> **Feature:** F-5.1, F-5.2, F-5.3
> **ACs cubiertos:** F-5.1 AC1-AC7; F-5.2 AC1-AC5; F-5.3 AC1-AC7
> **Status:** draft
> **Dependencias:** DA-002, BE-005, FE-001
> **Architecture ref:** ARCH-inventario, AD-8

## Propósito

Definir la página `/solicitudes` y sus componentes: el formulario de creación, el listado reactivo, los filtros por estado, las acciones de aprobación y rechazo, y todos los estados de interfaz.

## Ruta

| Ruta | Componente raíz | Acceso |
|---|---|---|
| `/solicitudes` | `SolicitudesPage` | Pública (sin autenticación en esta versión) |

## Componentes

### `FormularioSolicitud`

Formulario para crear una solicitud de stock desde la interfaz.

**Campos:**

| Campo | Tipo de control | Requerido |
|---|---|---|
| Producto | Select (lista productos activos) | Sí |
| Cantidad solicitada | Input numérico entero positivo | Sí |
| Motivo | Textarea | Sí |
| Solicitante | Input texto | No |

**Comportamiento:**

- Al seleccionar un producto, muestra la existencia actual de forma informativa (no vinculante).
- El campo `origen` se establece automáticamente como `"interfaz"`.
- Genera una `claveIdempotencia` única por intento al abrir el formulario o después de una creación exitosa.
- Al enviar muestra un estado de carga (`loading`) y deshabilita el botón de envío para evitar doble envío.
- Tras una creación exitosa muestra un mensaje de confirmación (`toast`) y limpia el formulario.
- Si falla muestra el error correspondiente y conserva los datos del formulario.

---

### `ListadoSolicitudes`

Listado reactivo de solicitudes de stock.

**Comportamiento:**

- Usa `useQuery(api.solicitudesStock.listar)` para actualización en tiempo real.
- Una solicitud creada desde Postman (API) aparece en el listado sin recargar la página.
- Muestra estado de carga (`Skeleton`) mientras los datos no estén disponibles.
- Muestra estado vacío si no hay solicitudes (o no hay solicitudes con el filtro activo).
- Muestra estado de error si la query falla.

**Información mostrada por solicitud:**

| Campo | Visibilidad |
|---|---|
| Nombre del producto | Siempre |
| Cantidad solicitada | Siempre |
| Motivo | Siempre |
| Solicitante | Cuando está presente |
| Estado | Siempre (con chip de color) |
| Origen (`interfaz` / `api`) | Siempre |
| Existencia al solicitar | Siempre (etiquetada como "informativa") |
| Disponible al solicitar | Siempre |
| Fecha de creación | Siempre |
| Existencia al resolver | Solo en `aprobada` y `rechazada_sin_stock` |
| Motivo de rechazo | Solo en `rechazada` |

**Layouts:**

| Viewport | Presentación |
|---|---|
| ≥ 768 px (escritorio) | Tabla con columnas |
| < 768 px (móvil) | Tarjetas apiladas |

---

### `FiltroEstado`

Control de filtrado por estado.

**Opciones:** Todas · Pendientes · Aprobadas · Rechazadas · Rechazadas sin stock

Al cambiar el filtro, el listado se actualiza de inmediato sin recargar la página.

---

### `AccionesSolicitud`

Acciones disponibles sobre cada solicitud.

| Acción | Condición de visibilidad |
|---|---|
| Aprobar | Solo si el estado es `pendiente` |
| Rechazar | Solo si el estado es `pendiente` |

**Flujo de aprobación:**

1. Mostrar diálogo de confirmación.
2. Enviar a `solicitudesStock.aprobar`.
3. Si la respuesta es `aprobada`: mostrar confirmación con el movimiento creado.
4. Si la respuesta es `rechazada_sin_stock`: mostrar el mensaje de rechazo con la cantidad solicitada y la existencia disponible.

**Flujo de rechazo manual:**

1. Mostrar diálogo con campo de motivo (obligatorio).
2. Enviar a `solicitudesStock.rechazar`.
3. Mostrar confirmación del rechazo.

---

## Estados de interfaz

| Estado | Situación | Presentación |
|---|---|---|
| Carga (`loading`) | Datos aún no disponibles | Skeleton en el listado; botón de envío deshabilitado |
| Vacío | No hay solicitudes (con o sin filtro) | Mensaje de estado vacío con acción para crear la primera |
| Error | Fallo en la query o la mutation | Mensaje de error; formulario conserva sus datos |
| Confirmación | Operación completa | Toast con descripción del resultado |

## Restricciones

- La interfaz **no** llama a las rutas HTTP de BE-006; usa directamente las funciones de Convex.
- El campo `origen` se establece automáticamente al crear; el usuario no lo configura.
- La existencia al solicitar se etiqueta explícitamente como informativa para que el operador no asuma que está reservada.
- Las acciones de aprobar y rechazar no están disponibles sobre solicitudes ya resueltas.

## Definition of Done

- [ ] El formulario crea solicitudes con `origen: "interfaz"` sin modificar la existencia.
- [ ] El listado muestra existencia al solicitar con etiqueta informativa.
- [ ] Las solicitudes enviadas desde Postman aparecen sin recargar la página.
- [ ] Se puede filtrar por estado.
- [ ] Las acciones aprobar y rechazar solo se muestran para solicitudes pendientes.
- [ ] El resultado de un rechazo por stock insuficiente muestra cantidad solicitada y existencia disponible.
- [ ] La tabla se usa en escritorio y las tarjetas en móvil.
- [ ] Todos los estados (carga, vacío, error, confirmación) están implementados.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Verificaciones asociadas

| Test ID | Título | Tipo |
|---|---|---|
| TC-FE-005-01 | El formulario deshabilita el envío durante la carga | Manual |
| TC-FE-005-02 | Una solicitud de Postman aparece sin recargar | Manual |
| TC-FE-005-03 | El filtro por estado actualiza el listado en tiempo real | Manual |
| TC-FE-005-04 | El resultado de rechazo por stock muestra cantidades | Manual |
| TC-FE-005-05 | La tabla es visible en escritorio y las tarjetas en móvil | Manual |

## Changelog

- v1.0 (2026-08-06): Borrador inicial de la interfaz de solicitudes de stock (actividad #61).
