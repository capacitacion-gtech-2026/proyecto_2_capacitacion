# FE-001: Interfaz de productos

> **Tipo:** Frontend
> **Feature:** F-1.1 (Crear producto), F-1.2 (Consultar productos)
> **ACs cubiertos:** F-1.1 AC1, AC2, AC4, AC5; F-1.2 AC1, AC4
> **Status:** draft
> **Dependencias:** DA-001, BE-001
> **Architecture ref:** ARCH-inventario, secciones 3.1-3.5

## Qué muestra

Define la página `/productos` de la primera unidad. La vista presenta el catálogo registrado y permite abrir un diálogo para crear un producto con SKU, nombre, descripción opcional y stock mínimo.

La página muestra carga, estado vacío, resultados, errores de registro y confirmación de éxito sin incorporar todavía detalle de producto, movimientos o alertas.

## Qué NO muestra

- No permite editar ni desactivar productos.
- No permite capturar ni modificar la existencia inicial.
- No muestra historial de movimientos o detalle individual.
- No registra entradas o salidas.
- No muestra alertas ni un panel general.
- El indicador específico de stock bajo de F-1.2 AC2 queda para una ampliación posterior.

## Rutas

| Ruta | Archivo | Descripción |
|---|---|---|
| `/productos` | `app/productos/page.tsx` | Consulta el catálogo y contiene el diálogo de registro. |
| `/` | `app/page.tsx` | Página principal con acceso al catálogo. |

## Componentes

```text
app/productos/
├── page.tsx                 → Página cliente, consulta y formulario.
└── error.tsx                → Límite de error de la ruta.

components/ui/
├── alert.tsx                → Mensajes de éxito y error.
├── badge.tsx                → Estado activo o inactivo.
├── button.tsx               → Acciones principales y secundarias.
├── card.tsx                 → Contenedor del catálogo.
├── dialog.tsx               → Registro del producto.
├── input.tsx                → SKU, nombre y stock mínimo.
├── label.tsx                → Etiquetas de campos.
├── table.tsx                → Catálogo con resultados.
└── textarea.tsx             → Descripción opcional.
```

La primera unidad mantiene el formulario dentro de `page.tsx`. Si la página crece al incorporar edición o detalle, deberá extraerse a componentes de dominio antes de ampliar la funcionalidad.

## Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ Inventario                                      Productos ● │
├─────────────────────────────────────────────────────────────┤
│ CATÁLOGO DE INVENTARIO                                      │
│ Productos                            [Registrar producto]    │
│ Consulta existencias y registra nuevos artículos.           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Productos registrados                     {n} mostrados │ │
│ ├────────┬────────┬─────────────┬───────┬────────┬────────┤ │
│ │ SKU    │ Nombre │ Descripción │ Exist.│ Mínimo │ Estado │ │
│ └────────┴────────┴─────────────┴───────┴────────┴────────┘ │
└─────────────────────────────────────────────────────────────┘

Diálogo: Nuevo producto
┌───────────────────────────────────────┐
│ SKU *                                 │
│ Nombre del producto *                 │
│ Descripción (opcional)                │
│ Stock mínimo *                        │
│             [Cancelar] [Guardar]      │
└───────────────────────────────────────┘
```

## Comportamiento

### Carga

- Mientras `useQuery(api.productos.listar)` devuelve `undefined`, se muestra un indicador y el texto `Cargando productos...`.
- El estado vacío no aparece temporalmente durante la carga.

### Estado vacío

- Si la query devuelve una lista vacía, se muestra `El catálogo está vacío`.
- El estado incluye una acción para abrir el diálogo y registrar el primer producto.

### Resultados

- La tabla muestra SKU, nombre, descripción, existencia, stock mínimo y estado.
- La descripción ausente se representa con `—`.
- El estado se muestra mediante un badge `Activo` o `Inactivo`.
- El contador indica cuántos productos se muestran.

### Registro

1. `Registrar producto` abre el diálogo.
2. React Hook Form y Zod validan SKU, nombre y stock mínimo antes del envío.
3. La existencia no forma parte del formulario y se informa que comenzará en cero.
4. Mientras la mutation está pendiente, el botón se deshabilita y muestra `Guardando...`.
5. Si la creación termina correctamente, el formulario se limpia, el diálogo se cierra y aparece una confirmación.
6. La query reactiva incorpora el producto al catálogo.
7. Si Convex rechaza la operación, el diálogo permanece abierto y muestra un mensaje comprensible.

### Error de ruta

- `app/productos/error.tsx` evita mostrar detalles internos y ofrece una acción de reintento.
- Los errores de formulario se muestran cerca del campo o dentro del diálogo según su origen.

## Responsive

- El encabezado y la acción principal se apilan en pantallas pequeñas.
- El diálogo utiliza el ancho disponible con márgenes laterales.
- La tabla conserva la información requerida; cualquier ajuste futuro debe evitar desbordar horizontalmente la página completa.
- Los botones mantienen un área táctil suficiente y textos visibles.

## Accesibilidad

- Cada campo tiene un `Label` asociado mediante `htmlFor` e `id`.
- Los campos obligatorios se indican con texto y no únicamente mediante color.
- Los errores se presentan como texto comprensible.
- El diálogo puede cerrarse y operarse con teclado mediante los componentes de Shadcn/ui.
- El botón que cierra la confirmación incluye el texto accesible `Cerrar confirmación`.
- El estado activo o inactivo incluye una etiqueta textual además del color.

## Paquetes

- React Hook Form para estado y envío del formulario.
- Zod y `@hookform/resolvers` para validación de interfaz.
- Shadcn/ui para controles accesibles y consistentes.
- Lucide React para iconografía complementaria.
- Convex React para la query y la mutation reactivas.

No se requieren paquetes adicionales para esta Spec.

## Contexto para el agente

Leer únicamente:

- `docs/02-architecture.md`: estructura, naming, React y manejo de errores.
- `docs/03-Product Requirements.md`: F-1.1 y F-1.2.
- `docs/specs/BE-001-crear-listar-productos.md`.
- `app/productos/page.tsx` y `app/productos/error.tsx`: implementación vigente.

No incorporar movimientos, alertas, detalle o edición dentro de esta Spec.

## Definition of Done

- [x] `/productos` consulta y muestra los productos registrados.
- [x] La tabla presenta SKU, nombre, descripción, existencia, stock mínimo y estado.
- [x] Existen estados diferenciados de carga, vacío, resultados y error.
- [x] El formulario utiliza React Hook Form, Zod y componentes Shadcn/ui.
- [x] La existencia no puede introducirse desde el formulario.
- [x] La interfaz confirma el éxito y conserva errores comprensibles.
- [x] Los controles principales incluyen etiquetas y soporte de teclado mediante componentes accesibles.
- [ ] La adaptación visual fue revisada manualmente en tamaños móvil y escritorio.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Verificaciones asociadas

Estas referencias permanecen dentro del nivel 05; no se crean documentos Fractik 06 o 07 para esta actividad.

| ID | Verificación | Tipo |
|---|---|---|
| T-FE001-C01 | Mostrar carga antes de recibir la query | Componente |
| T-FE001-C02 | Mostrar el estado vacío y su acción principal | Componente |
| T-FE001-C03 | Mostrar todos los campos requeridos en el catálogo | Componente |
| T-FE001-C04 | Validar el formulario y enviar datos normalizados | Componente |
| T-FE001-C05 | Mostrar confirmación después de crear un producto | Componente |
| T-FE001-C06 | Mantener el diálogo y mostrar el error de Convex | Componente |
| T-FE001-M01 | Revisar navegación por teclado y adaptación visual | Manual |

## Changelog

- v1.0 (2026-08-05): Spec creada a partir de la interfaz de productos implementada en la primera unidad y del formato Fractik actualizado.
