import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const estadoAlertaValidator = v.union(
  v.literal("activa"),
  v.literal("resuelta"),
);

const alertaValidator = v.object({
  _id: v.id("alertasInventario"),
  _creationTime: v.number(),
  productoId: v.id("productos"),
  eventoOrigenId: v.id("eventosDominio"),
  tipo: v.literal("stock_bajo"),
  estado: estadoAlertaValidator,
  existenciaAlGenerarse: v.number(),
  stockMinimo: v.number(),
  creadoEn: v.number(),
  resueltoEn: v.optional(v.number()),
  formaResolucion: v.optional(
    v.union(v.literal("automatica"), v.literal("manual")),
  ),
  productoNombre: v.string(),
  productoSku: v.string(),
  existenciaActual: v.number(),
  stockMinimoActual: v.number(),
});

export const listar = query({
  args: {
    estado: v.optional(estadoAlertaValidator),
  },
  returns: v.array(alertaValidator),
  handler: async (ctx, args) => {
    const alertas = args.estado
      ? await ctx.db
          .query("alertasInventario")
          .withIndex("por_estado_creado_en", (q) =>
            q.eq("estado", args.estado!),
          )
          .order("desc")
          .take(100)
      : (
          await Promise.all([
            ctx.db
              .query("alertasInventario")
              .withIndex("por_estado_creado_en", (q) =>
                q.eq("estado", "activa"),
              )
              .order("desc")
              .take(100),
            ctx.db
              .query("alertasInventario")
              .withIndex("por_estado_creado_en", (q) =>
                q.eq("estado", "resuelta"),
              )
              .order("desc")
              .take(100),
          ])
        )
          .flat()
          .sort((a, b) => b.creadoEn - a.creadoEn)
          .slice(0, 100);

    return await Promise.all(
      alertas.map(async (alerta) => {
        const producto = await ctx.db.get("productos", alerta.productoId);

        return {
          ...alerta,
          productoNombre: producto?.nombre ?? "Producto no disponible",
          productoSku: producto?.sku ?? "Sin SKU",
          existenciaActual:
            producto?.existenciaActual ?? alerta.existenciaAlGenerarse,
          stockMinimoActual: producto?.stockMinimo ?? alerta.stockMinimo,
        };
      }),
    );
  },
});

export const resolverManual = mutation({
  args: {
    alertaId: v.id("alertasInventario"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const alerta = await ctx.db.get("alertasInventario", args.alertaId);

    if (!alerta) {
      throw new ConvexError("La alerta no está disponible.");
    }

    if (alerta.estado === "resuelta") {
      return null;
    }

    await ctx.db.patch("alertasInventario", alerta._id, {
      estado: "resuelta",
      formaResolucion: "manual",
      resueltoEn: Date.now(),
    });

    return null;
  },
});
