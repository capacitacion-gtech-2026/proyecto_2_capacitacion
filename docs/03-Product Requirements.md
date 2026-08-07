# Product Requirements: Sistema de Gestión de Inventario

> **ID:** REQ-inventario  
> **Versión:** 1.2
> **Fecha:** 2026-08-06
> **Autor:** Angel Yahir Murillo Gallegos
> **Status:** draft
> **Padre:** V-inventario

---

## Resumen del producto

El Sistema de Gestión de Inventario es una aplicación para encargados de almacén y administradores de inventario de negocios pequeños que necesitan registrar entradas y salidas en el momento en que ocurren. Mantiene actualizada la existencia de cada producto y genera alertas cuando el stock alcanza el mínimo definido, reduciendo registros desactualizados y revisiones manuales. Incluye además solicitudes de stock: peticiones de salida que comienzan como pendientes, pueden originarse desde la interfaz o la API, y requieren aprobación explícita para modificar la existencia.

El contexto, los límites y las métricas generales se encuentran en la Vision `V-inventario`.

## Alcance de esta versión

Este documento conserva los requisitos del producto completo, pero la actividad actual cubre únicamente la **fase 1: catálogo de productos**. En esta unidad se implementan la preparación del proyecto, el modelo inicial de `productos`, las funciones `productos.crear` y `productos.listar`, y la página `/productos` con su formulario.

Las capacidades de actualización y desactivación de productos, movimientos, eventos, consumidores, alertas y panel general permanecen documentadas para fases posteriores. Su presencia en este documento no las convierte en parte de la primera unidad.

## Mapa de capabilities

| ID | Capability | Features | Prioridad | Fase |
|---|---|---:|---|---|
| C-1 | Gestión de productos | 3 | Crítica | Fase 1; F-1.3 queda para una ampliación posterior |
| C-2 | Control de movimientos | 3 | Crítica | Fase 2 |
| C-3 | Alertas de stock | 3 | Alta | Fase 3 |
| C-4 | Consulta general del inventario | 1 | Alta | Fase 4 |
| C-5 | Solicitudes de stock | 3 | Alta | Fase 5 |

---

## C-1: Gestión de productos

> **Prioridad:** Crítica  
> **Dependencias:** Ninguna

### Propósito

Mantener el catálogo de productos sobre el que se registrarán las entradas, salidas y alertas del inventario.

### Alcance

**Incluye:** Crear productos con existencia inicial en cero, consultar su información, actualizar sus datos permitidos y desactivarlos sin eliminar su historial.  
**No incluye:** Categorías, imágenes, precios, proveedores, eliminación permanente, importación masiva ni existencia inicial diferente de cero.

### F-1.1: Crear producto

> **Prioridad:** Crítica  
> **Dependencias:** Ninguna
> **Status:** in_progress

Permite al administrador registrar un producto con la información mínima necesaria para identificarlo y controlar su stock. Todo producto nuevo comienza con existencia cero; la primera cantidad disponible deberá registrarse posteriormente como una entrada.

**Acceptance Criteria:**

- [ ] AC1: El formulario solicita SKU, nombre y stock mínimo como datos obligatorios.
- [ ] AC2: La descripción es opcional y su ausencia no impide crear el producto.
- [ ] AC3: El sistema rechaza un SKU que ya pertenezca a otro producto.
- [ ] AC4: El stock mínimo solo acepta números enteros mayores o iguales a cero.
- [ ] AC5: Al crear el producto, su existencia queda exactamente en cero y no se genera automáticamente un movimiento.

**User Stories:**

**US-1.1.1** — Como administrador del inventario, quiero registrar un producto para comenzar a controlar sus entradas, salidas y nivel mínimo.

- AC1: Puedo crear el producto proporcionando SKU, nombre y stock mínimo.
- AC2: Al terminar, el producto aparece en el catálogo con existencia cero.
- AC3: El sistema me informa claramente si el SKU ya está registrado.

### F-1.2: Consultar productos

> **Prioridad:** Crítica  
> **Dependencias:** F-1.1
> **Status:** in_progress

Muestra el catálogo con la información necesaria para conocer el estado actual del inventario. También permite abrir el detalle de un producto para consultar sus datos y movimientos relacionados.

**Acceptance Criteria:**

- [ ] AC1: El catálogo muestra SKU, nombre, existencia actual, stock mínimo y estado de cada producto.
- [ ] AC2: Los productos con `existenciaActual <= stockMinimo` muestran un indicador visible de stock bajo.
- [ ] AC3: Al seleccionar un producto se muestra su información completa y su historial de movimientos.
- [ ] AC4: Si no hay productos registrados, se muestra un estado vacío con una acción para crear el primero.
- [ ] AC5: Los cambios en la existencia se reflejan en el catálogo sin recargar manualmente la página.

**User Stories:**

**US-1.2.1** — Como administrador del inventario, quiero consultar los productos para conocer su existencia y detectar cuáles necesitan atención.

- AC1: Puedo distinguir visualmente los productos con stock bajo.
- AC2: Puedo abrir un producto para revisar sus datos y movimientos.

### F-1.3: Actualizar y desactivar producto

> **Prioridad:** Alta  
> **Dependencias:** F-1.1
> **Status:** draft

Permite corregir los datos permitidos de un producto y retirarlo del uso operativo sin borrar la información histórica. La desactivación reemplaza la eliminación permanente para conservar la relación con los movimientos y las alertas.

**Acceptance Criteria:**

- [ ] AC1: Se pueden actualizar el nombre, la descripción y el stock mínimo.
- [ ] AC2: El SKU solo puede cambiarse por otro que no esté registrado.
- [ ] AC3: Al cambiar el stock mínimo, el indicador de stock bajo se vuelve a calcular con la existencia actual.
- [ ] AC4: Un producto puede cambiar de estado activo a inactivo sin eliminar sus movimientos ni alertas.
- [ ] AC5: Un producto inactivo continúa disponible para consulta, pero no puede recibir nuevas entradas o salidas.

**User Stories:**

**US-1.3.1** — Como administrador del inventario, quiero actualizar o desactivar un producto para mantener correcto el catálogo sin perder su historial.

- AC1: Puedo corregir los datos permitidos del producto.
- AC2: Al desactivarlo, sus movimientos anteriores continúan visibles.
- AC3: El sistema impide registrar movimientos nuevos para el producto inactivo.

---

## C-2: Control de movimientos

> **Prioridad:** Crítica  
> **Dependencias:** C-1

### Propósito

Registrar cada entrada y salida como la única forma permitida de modificar la existencia de un producto.

### Alcance

**Incluye:** Entradas, salidas, validación de stock, actualización inmediata de existencia, prevención de duplicados e historial de movimientos.  
**No incluye:** Edición o eliminación de movimientos registrados, transferencias entre almacenes, ventas, compras, proveedores ni ajustes directos de existencia.

### F-2.1: Registrar entrada

> **Prioridad:** Crítica  
> **Dependencias:** F-1.1
> **Status:** draft

Permite al encargado registrar el ingreso físico de unidades de un producto activo. La operación aumenta la existencia y queda registrada en el historial para conservar la trazabilidad.

**Acceptance Criteria:**

- [ ] AC1: El formulario solicita producto, cantidad y motivo de la entrada.
- [ ] AC2: La cantidad solo acepta números enteros mayores que cero.
- [ ] AC3: El sistema rechaza la operación si el producto no existe o está inactivo.
- [ ] AC4: Una entrada válida aumenta la existencia exactamente por la cantidad indicada.
- [ ] AC5: La confirmación muestra la existencia resultante del producto.
- [ ] AC6: Reenviar el mismo intento de entrada no aumenta la existencia por segunda vez.

**User Stories:**

**US-2.1.1** — Como encargado de almacén, quiero registrar una entrada para que el sistema refleje las unidades que ingresaron físicamente.

- AC1: Puedo seleccionar el producto e indicar la cantidad recibida.
- AC2: Al confirmar, veo inmediatamente la nueva existencia.
- AC3: El historial conserva la entrada registrada.

### F-2.2: Registrar salida

> **Prioridad:** Crítica  
> **Dependencias:** F-1.1
> **Status:** draft

Permite al encargado registrar las unidades que salen físicamente del almacén. Antes de aceptar la operación, el sistema comprueba que exista cantidad suficiente para impedir existencias negativas.

**Acceptance Criteria:**

- [ ] AC1: El formulario solicita producto, cantidad y motivo de la salida.
- [ ] AC2: La cantidad solo acepta números enteros mayores que cero.
- [ ] AC3: El sistema rechaza la operación si el producto no existe o está inactivo.
- [ ] AC4: Una salida válida disminuye la existencia exactamente por la cantidad indicada.
- [ ] AC5: Una salida mayor que la existencia disponible es rechazada y no modifica el inventario ni el historial.
- [ ] AC6: Reenviar el mismo intento de salida no disminuye la existencia por segunda vez.

**User Stories:**

**US-2.2.1** — Como encargado de almacén, quiero registrar una salida para mantener actualizada la cantidad disponible del producto.

- AC1: Antes de confirmar puedo ver la existencia disponible.
- AC2: Si no hay suficiente existencia, recibo un mensaje y la operación no se registra.
- AC3: Una salida válida actualiza inmediatamente la existencia y aparece en el historial.

### F-2.3: Consultar historial de movimientos

> **Prioridad:** Alta  
> **Dependencias:** F-2.1, F-2.2
> **Status:** draft

Muestra las entradas y salidas registradas para explicar cada cambio en la existencia. Los movimientos son registros históricos y no pueden modificarse ni eliminarse desde la aplicación.

**Acceptance Criteria:**

- [ ] AC1: El historial muestra producto, tipo, cantidad, existencia anterior, existencia resultante, motivo y fecha.
- [ ] AC2: Los movimientos se ordenan del más reciente al más antiguo.
- [ ] AC3: Se puede consultar el historial completo y el historial de un producto específico.
- [ ] AC4: Una entrada y una salida se distinguen visualmente.
- [ ] AC5: No se muestran acciones para editar o eliminar un movimiento registrado.

**User Stories:**

**US-2.3.1** — Como administrador del inventario, quiero consultar el historial para entender por qué cambió la existencia de un producto.

- AC1: Puedo identificar si cada cambio fue una entrada o una salida.
- AC2: Puedo comparar la existencia anterior con la resultante.
- AC3: Puedo revisar solamente los movimientos del producto que estoy investigando.

---

## C-3: Alertas de stock

> **Prioridad:** Alta  
> **Dependencias:** C-1, C-2

### Propósito

Detectar productos con existencia igual o menor que su stock mínimo y comunicar esa situación al administrador.

### Alcance

**Incluye:** Evaluación automática después de movimientos, alertas internas, prevención de alertas activas duplicadas, consulta y resolución automática o manual.  
**No incluye:** Correos electrónicos, SMS, notificaciones push, órdenes de compra ni predicción de demanda.

### F-3.1: Detectar y generar alerta de stock bajo

> **Prioridad:** Crítica  
> **Dependencias:** F-1.1, F-2.1, F-2.2
> **Status:** draft

Después de un movimiento válido, el sistema evalúa la existencia resultante como una reacción separada al registro del movimiento. Si la existencia es igual o menor que el stock mínimo, genera una alerta interna sin bloquear ni repetir el movimiento que la originó.

**Acceptance Criteria:**

- [ ] AC1: Cada entrada o salida válida provoca una evaluación del stock del producto afectado.
- [ ] AC2: Se considera stock bajo cuando `existenciaActual <= stockMinimo`.
- [ ] AC3: Cuando se cumple la condición, aparece una alerta activa en segundos, no en minutos.
- [ ] AC4: La alerta identifica el producto, la existencia detectada, el stock mínimo y la fecha de creación.
- [ ] AC5: Mientras exista una alerta activa para el producto, nuevos movimientos con stock bajo no crean otra alerta activa duplicada.
- [ ] AC6: Un fallo al generar la alerta no repite ni revierte el movimiento ya confirmado.

**User Stories:**

**US-3.1.1** — Como administrador del inventario, quiero recibir una alerta automática cuando un producto alcance su mínimo para reaccionar antes de que se agote.

- AC1: No necesito revisar manualmente cada producto después de un movimiento.
- AC2: La alerta muestra cuál producto necesita atención y cuántas unidades quedan.
- AC3: Un mismo episodio de stock bajo no llena la lista con alertas activas duplicadas.

### F-3.2: Consultar alertas

> **Prioridad:** Alta  
> **Dependencias:** F-3.1
> **Status:** draft

Permite consultar las alertas generadas y distinguir las que todavía requieren atención de las que ya fueron resueltas. Desde la alerta se podrá acceder al producto relacionado para revisar su existencia e historial.

**Acceptance Criteria:**

- [ ] AC1: La vista separa o permite distinguir alertas activas y resueltas.
- [ ] AC2: Cada alerta muestra producto, existencia detectada, stock mínimo, estado y fecha.
- [ ] AC3: Las alertas se ordenan de la más reciente a la más antigua.
- [ ] AC4: Seleccionar una alerta permite abrir el detalle del producto relacionado.
- [ ] AC5: Si no existen alertas activas, se muestra un estado vacío que indica que no hay productos pendientes por alerta.

**User Stories:**

**US-3.2.1** — Como administrador del inventario, quiero consultar las alertas para identificar los productos que requieren atención.

- AC1: Puedo distinguir cuáles alertas siguen activas.
- AC2: Desde una alerta puedo revisar el producto y sus movimientos.

### F-3.3: Resolver alerta

> **Prioridad:** Alta  
> **Dependencias:** F-3.1, F-3.2, F-2.1
> **Status:** draft

Una alerta podrá resolverse automáticamente cuando una entrada deje la existencia por encima del mínimo o manualmente mediante una acción del administrador. Resolver manualmente una alerta cierra ese aviso, pero no cambia la existencia ni elimina el indicador de stock bajo si la condición continúa.

**Acceptance Criteria:**

- [ ] AC1: Una entrada que deje `existenciaActual > stockMinimo` resuelve automáticamente la alerta activa del producto.
- [ ] AC2: El administrador puede resolver manualmente una alerta activa sin registrar un movimiento.
- [ ] AC3: La resolución manual no modifica la existencia, el stock mínimo ni el historial de movimientos.
- [ ] AC4: Si una alerta se resuelve manualmente mientras el stock continúa bajo, el producto sigue mostrando el indicador de stock bajo.
- [ ] AC5: Después de una resolución manual, un movimiento posterior que mantenga el stock bajo puede generar una nueva alerta activa.
- [ ] AC6: Una alerta resuelta conserva su fecha de creación, forma de resolución y fecha de resolución.

**User Stories:**

**US-3.3.1** — Como administrador del inventario, quiero resolver una alerta automática o manualmente para distinguir los avisos pendientes de los ya atendidos.

- AC1: La alerta se resuelve automáticamente cuando el stock se recupera.
- AC2: También puedo cerrarla manualmente cuando ya tomé una acción externa.
- AC3: Cerrar una alerta manualmente no oculta que el producto continúa con stock bajo.

---

## C-4: Consulta general del inventario

> **Prioridad:** Alta  
> **Dependencias:** C-1, C-2, C-3

### Propósito

Presentar en una sola vista el estado actual del inventario y los elementos que requieren atención.

### Alcance

**Incluye:** Totales básicos, productos con stock bajo, alertas activas y movimientos recientes.  
**No incluye:** Gráficas históricas, reportes financieros, exportaciones, predicción de demanda ni métricas de ventas.

### F-4.1: Panel de inventario

> **Prioridad:** Alta  
> **Dependencias:** F-1.2, F-2.3, F-3.2
> **Status:** draft

Muestra un resumen operativo al abrir la aplicación para evitar que el administrador tenga que revisar varias pantallas. Los datos se actualizan cuando cambia la existencia, se registra un movimiento o cambia el estado de una alerta.

**Acceptance Criteria:**

- [ ] AC1: El panel muestra el total de productos activos.
- [ ] AC2: El panel muestra cuántos productos tienen existencia igual o menor que su stock mínimo.
- [ ] AC3: El panel muestra el número de alertas activas.
- [ ] AC4: El panel muestra una lista de productos con stock bajo.
- [ ] AC5: El panel muestra los movimientos más recientes, indicando producto, tipo, cantidad y fecha.
- [ ] AC6: Los datos del panel se actualizan sin requerir una recarga manual de la página.

**User Stories:**

**US-4.1.1** — Como administrador del inventario, quiero ver un resumen al abrir la aplicación para identificar rápidamente el estado general y los productos que necesitan atención.

- AC1: Puedo saber cuántos productos están activos y cuántos tienen stock bajo.
- AC2: Puedo ver las alertas y movimientos recientes desde la vista inicial.
- AC3: Los cambios registrados se reflejan sin que tenga que recargar la página.

---

## C-5: Solicitudes de stock

> **Prioridad:** Alta  
> **Dependencias:** C-1, C-2

### Propósito

Permitir que operadores o sistemas externos soliciten una salida de stock de forma explícita. La solicitud es un registro informativo en estado pendiente; solo la aprobación modifica la existencia.

### Alcance

**Incluye:** Crear solicitudes desde la interfaz o la API, consultar solicitudes en tiempo real, aprobar o rechazar solicitudes con comprobación transaccional de stock y prevención de existencia negativa.  
**No incluye:** Autenticación del solicitante, lógica de aprobación multietapa, notificaciones externas ni gestión de proveedores.

### F-5.1: Crear solicitud de stock

> **Prioridad:** Alta  
> **Dependencias:** F-1.1  
> **Status:** draft

Permite crear una solicitud de salida de stock para un producto activo. La solicitud queda en estado `pendiente` y no reserva ni descuenta existencia. La disponibilidad informada al crear es solo referencial.

**Acceptance Criteria:**

- [ ] AC1: El producto al que se solicita el stock debe estar activo.
- [ ] AC2: La cantidad solicitada debe ser un número entero positivo.
- [ ] AC3: El motivo de la solicitud es obligatorio.
- [ ] AC4: El solicitante es opcional; su ausencia no impide crear la solicitud.
- [ ] AC5: La solicitud puede crearse tanto desde la interfaz como desde la API; ambas rutas usan la misma lógica.
- [ ] AC6: El estado inicial de toda solicitud creada es `pendiente`.
- [ ] AC7: Una solicitud pendiente no modifica `existenciaActual` ni genera movimientos, eventos o alertas.
- [ ] AC8: Si se envía la misma `claveIdempotencia` con los mismos datos, se devuelve la solicitud original sin crear un duplicado.
- [ ] AC9: Si se envía la misma `claveIdempotencia` con datos distintos, la operación se rechaza con un error.

**User Stories:**

**US-5.1.1** — Como encargado de almacén o sistema externo, quiero solicitar una salida de stock para que quede registrada y sea aprobada o rechazada explícitamente.

- AC1: No puedo solicitar stock para un producto inactivo.
- AC2: Al crear, la solicitud queda en estado pendiente sin afectar el inventario.
- AC3: Una solicitud enviada desde Postman aparece en la interfaz sin recargar la página.

### F-5.2: Consultar solicitudes de stock

> **Prioridad:** Alta  
> **Dependencias:** F-5.1  
> **Status:** draft

Permite listar y consultar el detalle de las solicitudes de stock en tiempo real, incluyendo su estado actual y la disponibilidad informativa al momento de crear.

**Acceptance Criteria:**

- [ ] AC1: El listado muestra producto, cantidad, motivo, solicitante opcional, estado, origen y fecha de creación.
- [ ] AC2: Es posible consultar el detalle de una solicitud por su identificador.
- [ ] AC3: Las solicitudes pueden filtrarse por estado (`pendiente`, `aprobada`, `rechazada`, `rechazada_sin_stock`).
- [ ] AC4: El listado se actualiza en tiempo real; una solicitud enviada desde la API aparece sin recargar la página.
- [ ] AC5: Se puede distinguir si la solicitud fue creada desde la interfaz o desde la API.

**User Stories:**

**US-5.2.1** — Como administrador del inventario, quiero consultar las solicitudes de stock en tiempo real para saber cuáles están pendientes de acción.

- AC1: Puedo ver el estado y el origen de cada solicitud.
- AC2: Los cambios aparecen sin recargar la página.

### F-5.3: Aprobar o rechazar solicitud de stock

> **Prioridad:** Alta  
> **Dependencias:** F-5.1, F-2.2  
> **Status:** draft

Permite aprobar o rechazar explícitamente una solicitud pendiente. La aprobación comprueba la existencia en tiempo real dentro de la misma transacción; si el stock es insuficiente, la solicitud queda como `rechazada_sin_stock` en lugar de crear el movimiento. El rechazo manual no crea ningún movimiento. Una solicitud ya resuelta no puede procesarse de nuevo.

**Acceptance Criteria:**

- [ ] AC1: Al aprobar, el sistema re-lee la existencia dentro de la misma transacción antes de crear el movimiento.
- [ ] AC2: Con stock suficiente, la aprobación crea exactamente un movimiento de salida y deja la solicitud como `aprobada`.
- [ ] AC3: Con stock insuficiente, la aprobación guarda la solicitud como `rechazada_sin_stock` sin crear ningún movimiento, evento ni alerta.
- [ ] AC4: El resultado de un rechazo por stock insuficiente informa la cantidad solicitada y la existencia disponible.
- [ ] AC5: El rechazo manual deja la solicitud como `rechazada` sin crear movimientos, eventos ni alertas.
- [ ] AC6: Una solicitud ya resuelta (`aprobada`, `rechazada` o `rechazada_sin_stock`) no puede ser procesada nuevamente.
- [ ] AC7: Dos aprobaciones concurrentes sobre el mismo producto nunca producen existencia negativa; la segunda detecta stock insuficiente y queda como `rechazada_sin_stock`.

**User Stories:**

**US-5.3.1** — Como administrador del inventario, quiero aprobar o rechazar solicitudes de stock para controlar cuándo y cómo se descuentan unidades del inventario.

- AC1: Al aprobar una solicitud vlida, la existencia baja inmediatamente y el movimiento queda registrado.
- AC2: Si el stock ya no alcanza al momento de aprobar, recibo el detalle del rechazo y el inventario no se modifica.
- AC3: Puedo rechazar manualmente una solicitud pendiente sin afectar el inventario.

---

## Requisitos no funcionales globales

| ID ref | Requisito | Criterio medible |
|---|---|---|
| NFR-1 | Integridad del catálogo | El 100% de los productos se crea con existencia cero; un error de validación deja cero escrituras parciales. |
| NFR-2 | Validación consistente | SKU, nombre y stock mínimo se validan tanto en la interfaz como en Convex; Convex conserva la autoridad final. |
| NFR-3 | Reactividad | Los productos creados aparecen mediante la query reactiva sin una recarga manual de la página. |
| NFR-4 | Accesibilidad básica | Campos con etiquetas, errores asociados, controles operables por teclado y estados que no dependan únicamente del color. |
| NFR-5 | Adaptación de interfaz | La página `/productos` permanece utilizable desde 320 px de ancho sin desbordamiento horizontal de la página. |
| NFR-6 | Seguridad de demostración | No se almacenan secretos en el repositorio ni se utilizan datos reales mientras no exista autenticación. |

## Resumen cuantitativo

| Capability | Features | User Stories | ACs |
|---|---:|---:|---:|
| C-1: Gestión de productos | 3 | 3 | 15 |
| C-2: Control de movimientos | 3 | 3 | 17 |
| C-3: Alertas de stock | 3 | 3 | 17 |
| C-4: Consulta general del inventario | 1 | 1 | 6 |
| C-5: Solicitudes de stock | 3 | 3 | 21 |
| **Total** | **13** | **13** | **76** |

## Changelog

- v1.2 (2026-08-06): Se agregó la capability C-5 (Solicitudes de stock) con features F-5.1, F-5.2 y F-5.3 y sus 21 ACs. Se actualizó el resumen cuantitativo y el mapa de capabilities.
- v1.1 (2026-08-05): Se delimitó la fase 1, se añadieron estados por feature, fases del mapa de capabilities y requisitos no funcionales medibles.
- v1.0 (2026-08-03): Requisitos iniciales del producto completo.
