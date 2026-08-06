# BE-001: Crear y listar productos

> **Tipo:** Backend
> **Feature:** F-1.1 (Crear producto), F-1.2 (Consultar productos)
> **ACs cubiertos:** F-1.1 AC1-AC5; F-1.2 AC1, AC4, AC5
> **Status:** draft
> **Dependencias:** DA-001
> **Architecture ref:** ARCH-inventario, AD-1, AD-2 y secciones 3.2-3.5

## Qué hace

Define las funciones públicas de Convex utilizadas en la primera unidad para registrar productos y consultar el catálogo. La validación importante se ejecuta en el backend, aunque la interfaz también valide los campos con Zod.

La mutation crea cada producto con existencia cero y estado activo. La query devuelve los productos ordenados desde la actualización más reciente y permite que la interfaz reaccione a nuevas inserciones sin recargar la página.

## Qué NO hace

- No actualiza ni desactiva productos; F-1.3 corresponde a una ampliación posterior.
- No acepta `existenciaActual` como argumento.
- No expone una función para editar directamente la existencia.
- No crea movimientos, eventos o alertas al registrar un producto.
- No implementa autenticación, usuarios, sesiones o roles técnicos.
- No crea endpoints REST adicionales.

## Functions

### `productos.crear`

Mutation pública definida en `convex/productos.ts`.

```typescript
export const crear = mutation({
  args: {
    sku: v.string(),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    stockMinimo: v.number(),
  },
  returns: resultadoCrearValidator,
  handler: async (ctx, args) => {
    // Normalizar, validar, comprobar SKU e insertar con existencia cero.
  },
});
```

**Argumentos:**

| Campo | Tipo | Regla |
|---|---|---|
| `sku` | `string` | Obligatorio después de aplicar `trim()` y único en `productos`. |
| `nombre` | `string` | Obligatorio después de aplicar `trim()`. |
| `descripcion` | `string` opcional | Se limpia con `trim()`; una cadena vacía se guarda como ausente. |
| `stockMinimo` | `number` | Debe ser entero y mayor o igual a cero. |

**Resultado:** devuelve ID, SKU, nombre, descripción, existencia, stock mínimo, estado y fechas del producto creado. La descripción ausente se devuelve como `null`.

### `productos.listar`

Query pública definida en `convex/productos.ts`.

```typescript
export const listar = query({
  args: {},
  returns: v.array(productoValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("productos")
      .withIndex("por_actualizado_en")
      .order("desc")
      .collect();
  },
});
```

No recibe argumentos, no modifica datos y devuelve los productos ordenados por `actualizadoEn` descendente.

## Endpoints

No aplica. Next.js consume directamente las funciones tipadas de Convex mediante `useMutation` y `useQuery`.

## Reglas de negocio

1. `sku` y `nombre` se normalizan eliminando espacios exteriores.
2. SKU y nombre no pueden quedar vacíos después de normalizarlos.
3. Dos productos no pueden compartir el mismo SKU normalizado.
4. `stockMinimo` debe ser un entero mayor o igual a cero.
5. Todo producto nuevo se guarda con `existenciaActual: 0`.
6. Todo producto nuevo se guarda con `activo: true`.
7. `creadoEn` y `actualizadoEn` reciben la misma fecha durante la creación.
8. Crear un producto no inserta movimientos, eventos ni alertas.
9. La query de listado no realiza escrituras.
10. Convex es la autoridad final de validación; la validación del formulario no la sustituye.

## Manejo de errores

| Situación | Mensaje esperado | Efecto |
|---|---|---|
| SKU vacío | `El SKU es obligatorio.` | No se crea el producto. |
| Nombre vacío | `El nombre es obligatorio.` | No se crea el producto. |
| Stock mínimo inválido | `El stock mínimo debe ser un entero mayor o igual a cero.` | No se crea el producto. |
| SKU duplicado | `El SKU "{sku}" ya está registrado.` | No se crea un duplicado. |

Los errores se comunican con `ConvexError` y no deben revelar stack traces, secretos ni detalles internos de la base de datos.

## Contexto para el agente

Leer únicamente:

- `docs/02-architecture.md`: AD-1, AD-2 y patrones de Convex.
- `docs/03-Product Requirements.md`: F-1.1 y F-1.2.
- `docs/specs/DA-001-modelo-datos-inventario.md`: tabla `productos` e índices.
- `convex/schema.ts` y `convex/productos.ts`: implementación vigente.

No implementar F-1.3, movimientos o alertas como parte de esta Spec.

## Definition of Done

- [x] La tabla `productos` contiene los campos e índices requeridos por la primera unidad.
- [x] `productos.crear` normaliza y valida los argumentos en Convex.
- [x] Un producto nuevo se guarda con existencia cero y estado activo.
- [x] `productos.listar` utiliza el índice de actualización y no modifica datos.
- [x] No existe una función pública para editar directamente la existencia.
- [ ] Las verificaciones automatizadas o manuales asociadas han sido ejecutadas y registradas.
- [ ] La Spec fue revisada y aprobada por el responsable humano.

## Verificaciones asociadas

Estas referencias permanecen dentro del nivel 05; no se crean documentos Fractik 06 o 07 para esta actividad.

| ID | Verificación | Tipo |
|---|---|---|
| T-BE001-I01 | Crear un producto válido lo guarda con existencia cero y activo | Integración |
| T-BE001-E01 | Rechazar un SKU duplicado sin crear otro registro | Error |
| T-BE001-E02 | Rechazar SKU o nombre vacío después de normalizar | Error |
| T-BE001-E03 | Rechazar stock mínimo negativo o no entero | Error |
| T-BE001-I02 | Listar productos ordenados por actualización reciente | Integración |

## Changelog

- v1.0 (2026-08-05): Spec creada a partir de la implementación de la primera unidad y del formato Fractik actualizado.
