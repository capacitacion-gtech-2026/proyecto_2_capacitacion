import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  productos: defineTable({
    sku: v.string(),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    existenciaActual: v.number(),
    stockMinimo: v.number(),
    activo: v.boolean(),
    creadoEn: v.number(),
    actualizadoEn: v.number(),
  })
    .index("por_sku", ["sku"])
    .index("por_activo", ["activo"])
    .index("por_actualizado_en", ["actualizadoEn"]),

  movimientosInventario: defineTable({
    productoId: v.id("productos"),
    tipo: v.union(v.literal("entrada"), v.literal("salida")),
    cantidad: v.number(),
    existenciaAnterior: v.number(),
    existenciaResultante: v.number(),
    motivo: v.string(),
    claveIdempotencia: v.optional(v.string()),
    creadoEn: v.number(),
  })
    .index("por_producto_creado_en", ["productoId", "creadoEn"])
    .index("por_clave_idempotencia", ["claveIdempotencia"])
    .index("por_creado_en", ["creadoEn"]),

  eventosDominio: defineTable({
    tipo: v.literal("MovimientoInventarioRegistrado"),
    movimientoId: v.id("movimientosInventario"),
    productoId: v.id("productos"),
    existenciaAnterior: v.number(),
    existenciaResultante: v.number(),
    stockMinimo: v.number(),
    estado: v.union(v.literal("pendiente"), v.literal("procesado")),
    creadoEn: v.number(),
    procesadoEn: v.optional(v.number()),
  })
    .index("por_movimiento", ["movimientoId"])
    .index("por_estado_creado_en", ["estado", "creadoEn"])
    .index("por_producto_creado_en", ["productoId", "creadoEn"]),

  alertasInventario: defineTable({
    productoId: v.id("productos"),
    eventoOrigenId: v.id("eventosDominio"),
    tipo: v.literal("stock_bajo"),
    estado: v.union(v.literal("activa"), v.literal("resuelta")),
    existenciaAlGenerarse: v.number(),
    stockMinimo: v.number(),
    creadoEn: v.number(),
    resueltoEn: v.optional(v.number()),
    formaResolucion: v.optional(
      v.union(v.literal("automatica"), v.literal("manual")),
    ),
  })
    .index("por_producto_estado", ["productoId", "estado"])
    .index("por_estado_creado_en", ["estado", "creadoEn"])
    .index("por_evento_origen", ["eventoOrigenId"]),

  solicitudesStock: defineTable({
    productoId: v.id("productos"),
    cantidadSolicitada: v.number(),
    motivo: v.string(),
    solicitante: v.optional(v.string()),
    estado: v.union(
      v.literal("pendiente"),
      v.literal("aprobada"),
      v.literal("rechazada"),
      v.literal("rechazada_sin_stock"),
    ),
    claveIdempotencia: v.string(),
    origen: v.union(v.literal("interfaz"), v.literal("api")),
    existenciaAlSolicitar: v.number(),
    disponibleAlSolicitar: v.boolean(),
    existenciaDisponibleAlResolver: v.optional(v.number()),
    motivoRechazo: v.optional(v.string()),
    movimientoId: v.optional(v.id("movimientosInventario")),
    creadaEn: v.number(),
    actualizadaEn: v.number(),
    resueltaEn: v.optional(v.number()),
  })
    .index("por_clave_idempotencia", ["claveIdempotencia"])
    .index("por_estado_creada_en", ["estado", "creadaEn"])
    .index("por_producto_creada_en", ["productoId", "creadaEn"]),
});
