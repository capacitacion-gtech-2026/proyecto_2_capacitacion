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
    creadoEn: v.number(),
  })
    .index("por_producto_creado_en", ["productoId", "creadoEn"])
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
});
