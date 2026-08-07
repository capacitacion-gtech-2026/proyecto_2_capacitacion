import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const crear = mutation({
  args: {
    productoId: v.id("productos"),
    cantidadSolicitada: v.number(),
    motivo: v.string(),
    solicitante: v.optional(v.string()),
    claveIdempotencia: v.string(),
    origen: v.union(v.literal("interfaz"), v.literal("api")),
  },
  handler: async (ctx, args) => {
    const claveIdempotencia = args.claveIdempotencia.trim();
    if (!claveIdempotencia) {
      throw new ConvexError("La clave de idempotencia es obligatoria.");
    }

    const motivo = args.motivo.trim();
    if (!motivo) {
      throw new ConvexError("El motivo es obligatorio.");
    }

    const solicitante = args.solicitante?.trim() ? args.solicitante.trim() : undefined;

    const existente = await ctx.db
      .query("solicitudesStock")
      .withIndex("por_clave_idempotencia", (q) =>
        q.eq("claveIdempotencia", claveIdempotencia)
      )
      .first();

    if (existente) {
      const mismaproducto = existente.productoId === args.productoId;
      const mismaCantidad = existente.cantidadSolicitada === args.cantidadSolicitada;
      const mismoMotivo = existente.motivo === motivo;
      const mismoSolicitante = (existente.solicitante ?? undefined) === solicitante;
      const mismoOrigen = existente.origen === args.origen;

      if (mismaproducto && mismaCantidad && mismoMotivo && mismoSolicitante && mismoOrigen) {
        return {
          esNueva: false,
          solicitud: existente,
        };
      } else {
        throw new ConvexError("La clave de idempotencia ya fue utilizada con datos diferentes.");
      }
    }

    const producto = await ctx.db.get("productos", args.productoId);
    if (!producto) {
      throw new ConvexError("El producto no está disponible.");
    }

    if (!producto.activo) {
      throw new ConvexError("No se pueden registrar solicitudes para este producto.");
    }

    if (!Number.isInteger(args.cantidadSolicitada) || args.cantidadSolicitada <= 0) {
      throw new ConvexError("Ingresa una cantidad entera mayor que cero.");
    }

    const existenciaAlSolicitar = producto.existenciaActual;
    const disponibleAlSolicitar = existenciaAlSolicitar >= args.cantidadSolicitada;
    const ahora = Date.now();

    const id = await ctx.db.insert("solicitudesStock", {
      productoId: args.productoId,
      cantidadSolicitada: args.cantidadSolicitada,
      motivo,
      solicitante,
      estado: "pendiente",
      claveIdempotencia,
      origen: args.origen,
      existenciaAlSolicitar,
      disponibleAlSolicitar,
      creadaEn: ahora,
      actualizadaEn: ahora,
    });

    const solicitud = (await ctx.db.get("solicitudesStock", id))!;

    return {
      esNueva: true,
      solicitud,
    };
  },
});

export const listar = query({
  args: {
    estado: v.optional(
      v.union(
        v.literal("pendiente"),
        v.literal("aprobada"),
        v.literal("rechazada"),
        v.literal("rechazada_sin_stock")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.estado) {
      return await ctx.db
        .query("solicitudesStock")
        .withIndex("por_estado_creada_en", (q) => q.eq("estado", args.estado!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("solicitudesStock")
      .order("desc")
      .collect();
  },
});

export const obtener = query({
  args: {
    solicitudId: v.id("solicitudesStock"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("solicitudesStock", args.solicitudId);
  },
});
