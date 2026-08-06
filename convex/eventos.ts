import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const procesarMovimientoInventarioRegistrado = internalMutation({
  args: {
    eventoId: v.id("eventosDominio"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const evento = await ctx.db.get("eventosDominio", args.eventoId);

    if (!evento) {
      throw new ConvexError("El evento no está disponible.");
    }

    if (evento.tipo !== "MovimientoInventarioRegistrado") {
      throw new ConvexError("El tipo de evento no es válido.");
    }

    const producto = await ctx.db.get("productos", evento.productoId);

    if (!producto) {
      throw new ConvexError("El producto relacionado no está disponible.");
    }

    const alertaActiva = await ctx.db
      .query("alertasInventario")
      .withIndex("por_producto_estado", (q) =>
        q.eq("productoId", evento.productoId).eq("estado", "activa"),
      )
      .unique();
    const ahora = Date.now();
    const tieneStockBajo =
      evento.existenciaResultante <= evento.stockMinimo;

    if (tieneStockBajo && !alertaActiva) {
      await ctx.db.insert("alertasInventario", {
        productoId: evento.productoId,
        eventoOrigenId: evento._id,
        tipo: "stock_bajo",
        estado: "activa",
        existenciaAlGenerarse: evento.existenciaResultante,
        stockMinimo: evento.stockMinimo,
        creadoEn: ahora,
      });
    }

    if (!tieneStockBajo && alertaActiva) {
      await ctx.db.patch("alertasInventario", alertaActiva._id, {
        estado: "resuelta",
        formaResolucion: "automatica",
        resueltoEn: ahora,
      });
    }

    await ctx.db.patch("eventosDominio", evento._id, {
      estado: "procesado",
      procesadoEn: ahora,
    });

    return null;
  },
});
