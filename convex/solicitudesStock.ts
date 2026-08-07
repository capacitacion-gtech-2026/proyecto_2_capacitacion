import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { registrarMovimientoInterno } from "./movimientosInventario";

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

export const aprobar = mutation({
  args: {
    solicitudId: v.id("solicitudesStock"),
  },
  handler: async (ctx, args) => {
    const solicitud = await ctx.db.get("solicitudesStock", args.solicitudId);
    if (!solicitud) {
      throw new ConvexError("La solicitud no existe.");
    }

    if (solicitud.estado !== "pendiente") {
      if (solicitud.estado === "aprobada") {
        return {
          resultado: "aprobada",
          movimientoId: solicitud.movimientoId!,
        };
      }
      if (solicitud.estado === "rechazada_sin_stock") {
        const existenciaDisp = solicitud.existenciaDisponibleAlResolver ?? 0;
        return {
          resultado: "rechazada",
          motivo: "stock_insuficiente",
          mensaje: `La solicitud requiere ${solicitud.cantidadSolicitada} unidades, pero solamente quedan ${existenciaDisp} disponibles.`,
          cantidadSolicitada: solicitud.cantidadSolicitada,
          existenciaDisponible: existenciaDisp,
        };
      }
      throw new ConvexError("La solicitud ya fue resuelta.");
    }

    const producto = await ctx.db.get("productos", solicitud.productoId);
    if (!producto) {
      throw new ConvexError("El producto no está disponible.");
    }

    if (!producto.activo) {
      throw new ConvexError("No se pueden registrar solicitudes para este producto.");
    }

    const existenciaVigente = producto.existenciaActual;
    const ahora = Date.now();

    if (existenciaVigente >= solicitud.cantidadSolicitada) {
      const claveIdempotenciaMovimiento = `solicitud-stock:${solicitud._id}`;
      const movimiento = await registrarMovimientoInterno(ctx, {
        productoId: solicitud.productoId,
        tipo: "salida",
        cantidad: solicitud.cantidadSolicitada,
        motivo: `Aprobación de solicitud: ${solicitud.motivo}`,
        claveIdempotencia: claveIdempotenciaMovimiento,
      });

      await ctx.db.patch("solicitudesStock", solicitud._id, {
        estado: "aprobada",
        movimientoId: movimiento.id,
        existenciaDisponibleAlResolver: existenciaVigente,
        resueltaEn: ahora,
        actualizadaEn: ahora,
      });

      return {
        resultado: "aprobada",
        movimientoId: movimiento.id,
      };
    } else {
      await ctx.db.patch("solicitudesStock", solicitud._id, {
        estado: "rechazada_sin_stock",
        existenciaDisponibleAlResolver: existenciaVigente,
        resueltaEn: ahora,
        actualizadaEn: ahora,
      });

      return {
        resultado: "rechazada",
        motivo: "stock_insuficiente",
        mensaje: `La solicitud requiere ${solicitud.cantidadSolicitada} unidades, pero solamente quedan ${existenciaVigente} disponibles.`,
        cantidadSolicitada: solicitud.cantidadSolicitada,
        existenciaDisponible: existenciaVigente,
      };
    }
  },
});

export const rechazar = mutation({
  args: {
    solicitudId: v.id("solicitudesStock"),
    motivoRechazo: v.string(),
  },
  handler: async (ctx, args) => {
    const motivoRechazo = args.motivoRechazo.trim();
    if (!motivoRechazo) {
      throw new ConvexError("El motivo es obligatorio.");
    }

    const solicitud = await ctx.db.get("solicitudesStock", args.solicitudId);
    if (!solicitud) {
      throw new ConvexError("La solicitud no existe.");
    }

    if (solicitud.estado !== "pendiente") {
      throw new ConvexError("La solicitud ya fue resuelta.");
    }

    const producto = await ctx.db.get("productos", solicitud.productoId);
    const existenciaVigente = producto?.existenciaActual ?? solicitud.existenciaAlSolicitar;
    const ahora = Date.now();

    await ctx.db.patch("solicitudesStock", solicitud._id, {
      estado: "rechazada",
      motivoRechazo,
      existenciaDisponibleAlResolver: existenciaVigente,
      resueltaEn: ahora,
      actualizadaEn: ahora,
    });

    return (await ctx.db.get("solicitudesStock", solicitud._id))!;
  },
});
