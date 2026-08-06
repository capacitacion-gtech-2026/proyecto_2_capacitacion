/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("1. Un movimiento válido actualiza correctamente la existencia", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-001",
    nombre: "Laptop Test",
    stockMinimo: 5,
  });

  const res = await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 10,
    motivo: "Recepción de stock",
    claveIdempotencia: "key-test-1",
  });

  expect(res.existenciaAnterior).toBe(0);
  expect(res.existenciaResultante).toBe(10);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(10);
});

test("2. El movimiento produce y procesa su evento", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-002",
    nombre: "Teclado Test",
    stockMinimo: 3,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 5,
    motivo: "Recepción inicial",
    claveIdempotencia: "key-test-2",
  });

  const eventosAntes = await t.run(async (ctx) => {
    return await ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect();
  });

  expect(eventosAntes).toHaveLength(1);
  const evento = eventosAntes[0];
  expect(evento.estado).toBe("pendiente");
  expect(evento.existenciaResultante).toBe(5);

  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: evento._id,
  });

  const eventosDespues = await t.run(async (ctx) => {
    return await ctx.db.get("eventosDominio", evento._id);
  });

  expect(eventosDespues?.estado).toBe("procesado");
  expect(eventosDespues?.procesadoEn).toBeDefined();
});

test("3. El flujo crea o resuelve la alerta correspondiente", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-003",
    nombre: "Monitor Test",
    stockMinimo: 5,
  });

  // Movimiento 1: Entrada +10 => stock 10 (>5). Sin alerta.
  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 10,
    motivo: "Entrada almacén",
    claveIdempotencia: "key-test-3a",
  });

  const evento1 = (
    await t.run(async (ctx) =>
      ctx.db
        .query("eventosDominio")
        .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
        .collect(),
    )
  )[0];

  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: evento1._id,
  });

  let alertas = await t.query(api.alertasInventario.listar, {});
  expect(alertas).toHaveLength(0);

  // Movimiento 2: Salida -7 => stock 3 (<=5). Se crea alerta de stock bajo.
  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "salida",
    cantidad: 7,
    motivo: "Venta minorista",
    claveIdempotencia: "key-test-3b",
  });

  const eventos2 = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect(),
  );

  const evento2 = eventos2.find((e) => e._id !== evento1._id)!;
  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: evento2._id,
  });

  alertas = await t.query(api.alertasInventario.listar, { estado: "activa" });
  expect(alertas).toHaveLength(1);
  expect(alertas[0].estado).toBe("activa");
  expect(alertas[0].existenciaAlGenerarse).toBe(3);

  // Movimiento 3: Entrada +5 => stock 8 (>5). Se resuelve la alerta.
  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 5,
    motivo: "Reabastecimiento",
    claveIdempotencia: "key-test-3c",
  });

  const eventos3 = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect(),
  );

  const evento3 = eventos3.find(
    (e) => e._id !== evento1._id && e._id !== evento2._id,
  )!;
  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: evento3._id,
  });

  const alertasActivas = await t.query(api.alertasInventario.listar, {
    estado: "activa",
  });
  expect(alertasActivas).toHaveLength(0);

  const alertasResueltas = await t.query(api.alertasInventario.listar, {
    estado: "resuelta",
  });
  expect(alertasResueltas).toHaveLength(1);
  expect(alertasResueltas[0].formaResolucion).toBe("automatica");
});

test("4. Repetir la misma claveIdempotencia no modifica dos veces la existencia ni duplica movimientos o eventos", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-004",
    nombre: "Mouse Test",
    stockMinimo: 2,
  });

  const claveRepetida = "key-idempotente-repetida";

  const res1 = await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 10,
    motivo: "Registro original",
    claveIdempotencia: claveRepetida,
  });

  // Reintento con la misma clave y los mismos datos
  const res2 = await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 10,
    motivo: "Registro original",
    claveIdempotencia: claveRepetida,
  });

  expect(res2.id).toBe(res1.id);
  expect(res2.existenciaResultante).toBe(10);

  // Verificar que la existencia en la tabla productos sigue siendo 10 (no 20)
  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(10);

  // Verificar recuentos en base de datos
  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(1);

  const eventos = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect(),
  );
  expect(eventos).toHaveLength(1);
});

test("5. Reprocesar el mismo evento no duplica alertas ni modifica el stock", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-005",
    nombre: "Impresora Test",
    stockMinimo: 10,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 2,
    motivo: "Entrada pequeña",
    claveIdempotencia: "key-test-5",
  });

  const evento = (
    await t.run(async (ctx) =>
      ctx.db
        .query("eventosDominio")
        .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
        .collect(),
    )
  )[0];

  // Primer procesamiento
  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: evento._id,
  });

  let alertas = await t.query(api.alertasInventario.listar, { estado: "activa" });
  expect(alertas).toHaveLength(1);

  // Segundo procesamiento del mismo evento ya procesado
  const resSegundaVez = await t.mutation(
    internal.eventos.procesarMovimientoInventarioRegistrado,
    { eventoId: evento._id },
  );

  expect(resSegundaVez).toBeNull();

  // Asegurar que no se duplicaron alertas ni cambió la existencia
  alertas = await t.query(api.alertasInventario.listar, { estado: "activa" });
  expect(alertas).toHaveLength(1);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(2);
});

test("6. Una salida sin existencia suficiente no deja escrituras parciales", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-006",
    nombre: "Camara Test",
    stockMinimo: 5,
  });

  // Stock inicial es 0
  await expect(
    t.mutation(api.movimientosInventario.registrar, {
      productoId: prod.id,
      tipo: "salida",
      cantidad: 10,
      motivo: "Intento de salida sin stock",
      claveIdempotencia: "key-test-6",
    }),
  ).rejects.toThrow("No hay existencia suficiente.");

  // Verificar cero escrituras parciales
  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(0);

  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(0);

  const eventos = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect(),
  );
  expect(eventos).toHaveLength(0);
});

test("7. Un fallo del consumidor no revierte ni repite el movimiento confirmado y el evento no queda marcado como procesado", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-007",
    nombre: "Audifonos Test",
    stockMinimo: 5,
  });

  const resMov = await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 8,
    motivo: "Entrada para test de fallo",
    claveIdempotencia: "key-test-7",
  });
  void resMov;

  const evento = (
    await t.run(async (ctx) =>
      ctx.db
        .query("eventosDominio")
        .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
        .collect(),
    )
  )[0];

  // Crear un producto fantasma y eliminarlo para obtener un Id válido pero inexistente
  const productoIdOriginal = evento.productoId;
  const productoFantasmaId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("productos", {
      sku: "FANTASMA",
      nombre: "Fantasma",
      existenciaActual: 0,
      stockMinimo: 0,
      activo: false,
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    });
    await ctx.db.delete("productos", id);
    return id;
  });

  // Apuntar el evento a un producto inexistente para provocar el fallo del consumidor
  await t.run(async (ctx) => {
    await ctx.db.patch("eventosDominio", evento._id, {
      productoId: productoFantasmaId,
    });
  });

  // El consumidor falla porque el producto relacionado no existe
  await expect(
    t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
      eventoId: evento._id,
    }),
  ).rejects.toThrow("El producto relacionado no está disponible.");

  // El movimiento confirmado y la existencia permanecen intactos tras el fallo
  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(8);

  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(1);

  // El evento original continúa en estado "pendiente" porque la transacción del consumidor se revirtió
  const eventoTrasError = await t.run(async (ctx) =>
    ctx.db.get("eventosDominio", evento._id),
  );
  expect(eventoTrasError?.estado).toBe("pendiente");

  // Restaurar el productoId original para permitir el reprocesamiento
  await t.run(async (ctx) => {
    await ctx.db.patch("eventosDominio", evento._id, {
      productoId: productoIdOriginal,
    });
  });

  // Reintentar el consumidor con el evento restaurado
  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: evento._id,
  });

  // El evento queda procesado tras el reintento exitoso
  const eventoFinal = await t.run(async (ctx) =>
    ctx.db.get("eventosDominio", evento._id),
  );
  expect(eventoFinal?.estado).toBe("procesado");

  // El movimiento sigue siendo uno y la existencia no se duplicó
  const movimientosFinal = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientosFinal).toHaveLength(1);

  const productosFinal = await t.query(api.productos.listar);
  const pFinal = productosFinal.find((item) => item._id === prod.id);
  expect(pFinal?.existenciaActual).toBe(8);
});
