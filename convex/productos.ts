import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const productoValidator = v.object({
  _id: v.id("productos"),
  _creationTime: v.number(),
  sku: v.string(),
  nombre: v.string(),
  descripcion: v.optional(v.string()),
  existenciaActual: v.number(),
  stockMinimo: v.number(),
  activo: v.boolean(),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
});

const resultadoCrearValidator = v.object({
  id: v.id("productos"),
  sku: v.string(),
  nombre: v.string(),
  descripcion: v.union(v.string(), v.null()),
  existenciaActual: v.number(),
  stockMinimo: v.number(),
  activo: v.boolean(),
  creadoEn: v.number(),
  actualizadoEn: v.number(),
});

export const crear = mutation({
  args: {
    sku: v.string(),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    stockMinimo: v.number(),
  },
  returns: resultadoCrearValidator,
  handler: async (ctx, args) => {
    const sku = args.sku.trim();
    const nombre = args.nombre.trim();
    const descripcion = args.descripcion?.trim();

    if (!sku) {
      throw new ConvexError("El SKU es obligatorio.");
    }

    if (!nombre) {
      throw new ConvexError("El nombre es obligatorio.");
    }

    if (
      typeof args.stockMinimo !== "number" ||
      !Number.isInteger(args.stockMinimo) ||
      args.stockMinimo < 0
    ) {
      throw new ConvexError(
        "El stock mínimo debe ser un entero mayor o igual a cero.",
      );
    }

    const existente = await ctx.db
      .query("productos")
      .withIndex("por_sku", (q) => q.eq("sku", sku))
      .first();

    if (existente) {
      throw new ConvexError(`El SKU "${sku}" ya está registrado.`);
    }

    const ahora = Date.now();

    const id = await ctx.db.insert("productos", {
      sku,
      nombre,
      descripcion: descripcion || undefined,
      existenciaActual: 0,
      stockMinimo: args.stockMinimo,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    return {
      id,
      sku,
      nombre,
      descripcion: descripcion || null,
      existenciaActual: 0,
      stockMinimo: args.stockMinimo,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
  },
});

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
