# Guía de demostración — Solicitudes de stock en tiempo real

Esta guía describe el procedimiento paso a paso para ejecutar una demostración interactiva y reproducible del módulo de **Solicitudes de Stock**, utilizando Postman (o cualquier cliente HTTP) para enviar peticiones a las rutas API de Next.js y observando las actualizaciones reactivas en tiempo real en la página `/solicitudes`.

---

## 1. Preparación

1. **Instalar dependencias** (si no se ha realizado previamente):
   ```bash
   pnpm install
   ```

2. **Iniciar los servidores de backend y frontend**:
   - En una terminal, inicia el motor reactivo de Convex:
     ```bash
     npx convex dev
     ```
   - En otra terminal, inicia el servidor web de Next.js:
     ```bash
     pnpm dev
     ```

3. **Preparar el producto e inventario inicial**:
   - Abre en el navegador la página de productos: [`http://localhost:3000/productos`](http://localhost:3000/productos).
   - Crea un nuevo producto activo (por ejemplo, `SKU-DEMO-01`, *"Laptop Demostración"*).
   - Abre en el navegador la página de movimientos: [`http://localhost:3000/movimientos`](http://localhost:3000/movimientos).
   - Registra un movimiento de tipo **Entrada** por **8 unidades** sobre el producto creado para dejar su existencia actual en exactamente **8 unidades**.

4. **Obtener el `productoId`**:
   - Copia el identificador único del producto (por ejemplo `j9712...`). Puedes obtenerlo directamente desde la consola/Dashboard de Convex (`npx convex dashboard`) o inspeccionando la respuesta en las herramientas de desarrollo del navegador.

5. **Disponer la pantalla**:
   - Mantén la ventana del navegador abierta en [`http://localhost:3000/solicitudes`](http://localhost:3000/solicitudes) visible junto a la ventana de Postman.

---

## 2. Configuración manual de peticiones HTTP en Postman

Crea manualmente en Postman una colección o carpeta temporal con las siguientes peticiones HTTP:

### Petición 1: Crear solicitud A (5 unidades)
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/solicitudes-stock`
- **Header:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "productoId": "REEMPLAZAR_CON_PRODUCTO_ID",
    "cantidadSolicitada": 5,
    "motivo": "Solicitud A para demostración",
    "solicitante": "Cliente A",
    "claveIdempotencia": "sol-demo-a-001"
  }
  ```

### Petición 2: Crear solicitud B (4 unidades)
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/solicitudes-stock`
- **Header:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "productoId": "REEMPLAZAR_CON_PRODUCTO_ID",
    "cantidadSolicitada": 4,
    "motivo": "Solicitud B para demostración",
    "solicitante": "Cliente B",
    "claveIdempotencia": "sol-demo-b-002"
  }
  ```

### Petición 3: Listar solicitudes
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/solicitudes-stock`
- **URL con filtro opcional por estado:** `http://localhost:3000/api/solicitudes-stock?estado=aprobada`

### Petición 4: Consultar detalle de una solicitud
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/solicitudes-stock/REEMPLAZAR_CON_SOLICITUD_ID`

### Petición 5: Aprobar solicitud
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/solicitudes-stock/REEMPLAZAR_CON_SOLICITUD_ID/aprobar`
- **Body:** Ninguno requerido.

### Petición 6: Rechazar solicitud manualmente
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/solicitudes-stock/REEMPLAZAR_CON_SOLICITUD_ID/rechazar`
- **Header:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "motivoRechazo": "Solicitud cancelada durante la demostración"
  }
  ```

---

## 3. Demostración principal en tiempo real

1. **Mantener `/solicitudes` a la vista**: Observa que el listado de solicitudes se actualiza en tiempo real mediante queries reactivas de Convex.
2. **Crear Solicitud A desde Postman**:
   - Envía la **Petición 1 (Crear solicitud A de 5 unidades)** sustituyendo `productoId`.
   - Copia de la respuesta JSON el `_id` generado (por ejemplo `solicitudAId`).
   - **Resultado en pantalla**: La solicitud A aparece **de inmediato** en `/solicitudes` sin recargar la página.
3. **Crear Solicitud B desde Postman**:
   - Envía la **Petición 2 (Crear solicitud B de 4 unidades)** sustituyendo `productoId`.
   - Copia de la respuesta JSON el `_id` generado (por ejemplo `solicitudBId`).
   - **Resultado en pantalla**: La solicitud B aparece instantáneamente en la interfaz.
4. **Verificar estado no vinculante**:
   - Muestra que ambas solicitudes están en estado **Pendiente** y que la existencia del producto se mantiene en **8 unidades**. Crear solicitudes no reserva ni descuenta stock.
5. **Aprobar Solicitud A**:
   - Envía la **Petición 5 (Aprobar solicitud)** usando `solicitudAId` en la URL (o presiona *Aprobar* desde la interfaz).
   - **Resultado en pantalla**: La solicitud A pasa a estado **Aprobada**, vincula el `movimientoId` de salida y la existencia actual disminuye en tiempo real de **8 a 3 unidades**.
6. **Intentar aprobar Solicitud B (Validación de stock y concurrencia)**:
   - Envía la **Petición 5 (Aprobar solicitud)** usando `solicitudBId` en la URL (o presiona *Aprobar* desde la interfaz).
   - **Resultado en pantalla**: La solicitud B cambia atómicamente a estado **Rechazada sin stock** (`rechazada_sin_stock`).
   - **Explicación técnica**: El backend verifica en tiempo real la existencia disponible (3 unidades) antes de procesar la salida de 4 unidades. Al no haber stock suficiente, rechaza la salida y guarda la explicación: *"La solicitud requiere 4 unidades, pero solamente quedan 3 disponibles."*
7. **Confirmar consistencia del stock**:
   - Confirma que la existencia actual permanece en **3 unidades** y que en ningún momento se produjo una existencia negativa (como $-1$).

---

## 4. Demostración de idempotencia

1. **Idempotencia en creación**:
   - Reenvía la **Petición 1 (Crear solicitud A)** usando exactamente los mismos datos y la misma `claveIdempotencia`.
   - Muestra que la respuesta devuelve HTTP 200 con la solicitud original y que en la interfaz **no se duplica la solicitud**.
2. **Idempotencia en aprobación**:
   - Reenvía la **Petición 5 (Aprobar solicitud)** sobre la solicitud A ya aprobada.
   - Muestra que la respuesta confirma la aprobación previa sin volver a restar 5 unidades ni duplicar salidas.

---

## 5. Demostración de rechazo manual

1. **Crear una Solicitud C**:
   - Envía una petición de creación por 1 unidad con `claveIdempotencia: "sol-demo-c-003"` y guarda su `_id` (`solicitudCId`).
2. **Rechazar manualmente**:
   - Envía la **Petición 6 (Rechazar solicitud)** usando `solicitudCId` en la URL y proporcionando el `motivoRechazo`.
   - **Resultado en pantalla**: La solicitud cambia a estado **Rechazada**, muestra el motivo en pantalla y la existencia del producto se mantiene intacta en **3 unidades** sin crear movimientos ni eventos.

---

## 6. Reiniciar la demostración

Dado que los registros de inventario y solicitudes son inmutables e históricos:

1. Para repetir la demostración desde cero:
   - Registra una nueva entrada de **5 unidades** desde `/movimientos` sobre el mismo producto (para volver a dejar la existencia en 8), o crea un **nuevo producto** y asígnale 8 unidades iniciales.
2. En Postman:
   - Utiliza claves de idempotencia nuevas (por ejemplo `sol-demo-a-002`, `sol-demo-b-002`, etc.) al enviar las peticiones de creación.

---

## 7. Resumen de resultados esperados

| Solicitud | Cantidad | Estado final | Efecto en stock | Movimiento generado |
|---|---:|---|---|---|
| **A** | 5 | Aprobada | 8 → 3 | Salida de 5 unidades |
| **B** | 4 | Rechazada sin stock | Permanece en 3 | Ninguno |
| **C** | 1 | Rechazada manualmente | Permanece en 3 | Ninguno |
