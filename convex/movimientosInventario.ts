import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const tipoMovimientoValidator = v.union(
  v.literal("entrada"),
  v.literal("salida"),
);

const movimientoValidator = v.object({
  _id: v.id("movimientosInventario"),
  _creationTime: v.number(),
  productoId: v.id("productos"),
  tipo: tipoMovimientoValidator,
  cantidad: v.number(),
  existenciaAnterior: v.number(),
  existenciaResultante: v.number(),
  motivo: v.string(),
  creadoEn: v.number(),
  productoSku: v.string(),
  productoNombre: v.string(),
});

const resultadoRegistroValidator = v.object({
  id: v.id("movimientosInventario"),
  productoId: v.id("productos"),
  tipo: tipoMovimientoValidator,
  cantidad: v.number(),
  existenciaAnterior: v.number(),
  existenciaResultante: v.number(),
  motivo: v.string(),
  creadoEn: v.number(),
});

export const registrar = mutation({
  args: {
    productoId: v.id("productos"),
    tipo: tipoMovimientoValidator,
    cantidad: v.number(),
    motivo: v.string(),
    claveIdempotencia: v.string(),
  },
  returns: resultadoRegistroValidator,
  handler: async (ctx, args) => {
    const claveIdempotencia = args.claveIdempotencia.trim();

    if (!claveIdempotencia) {
      throw new ConvexError("La clave de idempotencia es obligatoria.");
    }

    const motivo = args.motivo.trim();

    if (!motivo) {
      throw new ConvexError("El motivo es obligatorio.");
    }

    const movimientoExistente = await ctx.db
      .query("movimientosInventario")
      .withIndex("por_clave_idempotencia", (q) =>
        q.eq("claveIdempotencia", claveIdempotencia),
      )
      .first();

    if (movimientoExistente) {
      if (
        movimientoExistente.productoId === args.productoId &&
        movimientoExistente.tipo === args.tipo &&
        movimientoExistente.cantidad === args.cantidad &&
        movimientoExistente.motivo === motivo
      ) {
        return {
          id: movimientoExistente._id,
          productoId: movimientoExistente.productoId,
          tipo: movimientoExistente.tipo,
          cantidad: movimientoExistente.cantidad,
          existenciaAnterior: movimientoExistente.existenciaAnterior,
          existenciaResultante: movimientoExistente.existenciaResultante,
          motivo: movimientoExistente.motivo,
          creadoEn: movimientoExistente.creadoEn,
        };
      } else {
        throw new ConvexError(
          "La clave de idempotencia ya fue utilizada con datos diferentes.",
        );
      }
    }

    const producto = await ctx.db.get("productos", args.productoId);

    if (!producto) {
      throw new ConvexError("El producto no está disponible.");
    }

    if (!producto.activo) {
      throw new ConvexError(
        "No se pueden registrar movimientos para este producto.",
      );
    }

    if (!Number.isInteger(args.cantidad) || args.cantidad <= 0) {
      throw new ConvexError("Ingresa una cantidad entera mayor que cero.");
    }

    if (
      args.tipo === "salida" &&
      args.cantidad > producto.existenciaActual
    ) {
      throw new ConvexError("No hay existencia suficiente.");
    }

    const existenciaAnterior = producto.existenciaActual;
    const existenciaResultante =
      args.tipo === "entrada"
        ? existenciaAnterior + args.cantidad
        : existenciaAnterior - args.cantidad;
    const creadoEn = Date.now();

    const id = await ctx.db.insert("movimientosInventario", {
      productoId: args.productoId,
      tipo: args.tipo,
      cantidad: args.cantidad,
      existenciaAnterior,
      existenciaResultante,
      motivo,
      claveIdempotencia,
      creadoEn,
    });

    await ctx.db.patch("productos", args.productoId, {
      existenciaActual: existenciaResultante,
      actualizadoEn: creadoEn,
    });

    const eventoId = await ctx.db.insert("eventosDominio", {
      tipo: "MovimientoInventarioRegistrado",
      movimientoId: id,
      productoId: args.productoId,
      existenciaAnterior,
      existenciaResultante,
      stockMinimo: producto.stockMinimo,
      estado: "pendiente",
      creadoEn,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.eventos.procesarMovimientoInventarioRegistrado,
      { eventoId },
    );

    return {
      id,
      productoId: args.productoId,
      tipo: args.tipo,
      cantidad: args.cantidad,
      existenciaAnterior,
      existenciaResultante,
      motivo,
      creadoEn,
    };
  },
});

export const listar = query({
  args: {
    productoId: v.optional(v.id("productos")),
  },
  returns: v.array(movimientoValidator),
  handler: async (ctx, args) => {
    const movimientos = args.productoId
      ? await ctx.db
          .query("movimientosInventario")
          .withIndex("por_producto_creado_en", (q) =>
            q.eq("productoId", args.productoId!),
          )
          .order("desc")
          .take(100)
      : await ctx.db
          .query("movimientosInventario")
          .withIndex("por_creado_en")
          .order("desc")
          .take(100);

    return await Promise.all(
      movimientos.map(async (movimiento) => {
        const producto = await ctx.db.get("productos", movimiento.productoId);

        return {
          ...movimiento,
          productoSku: producto?.sku ?? "Producto no disponible",
          productoNombre: producto?.nombre ?? "Producto no disponible",
        };
      }),
    );
  },
});
