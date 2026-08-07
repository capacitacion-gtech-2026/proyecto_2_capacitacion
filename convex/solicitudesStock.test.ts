/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("1. Crear una solicitud pendiente guarda datos informativos y no modifica inventario, movimientos ni eventos", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-001",
    nombre: "Laptop Solicitud Test",
    stockMinimo: 5,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 8,
    motivo: "Stock inicial 8",
    claveIdempotencia: "key-init-1",
  });

  const res = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 5,
    motivo: "Requerido para proyecto A",
    solicitante: "Juan Pérez",
    claveIdempotencia: "sol-key-1",
    origen: "interfaz",
  });

  expect(res.esNueva).toBe(true);
  expect(res.solicitud.estado).toBe("pendiente");
  expect(res.solicitud.existenciaAlSolicitar).toBe(8);
  expect(res.solicitud.disponibleAlSolicitar).toBe(true);

  // Comprobar que no cambia la existencia del producto
  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(8);

  // Comprobar que no se crean movimientos adicionales (solo el de entrada inicial)
  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(1);

  // Comprobar que no se crean eventos adicionales por la solicitud
  const eventos = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect()
  );
  expect(eventos).toHaveLength(1); // solo el del movimiento inicial

  const alertas = await t.query(api.alertasInventario.listar, {});
  expect(alertas).toHaveLength(0);
});

test("2. Crear una solicitud sin stock suficiente no rechaza ni modifica el inventario", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-002",
    nombre: "Teclado Solicitud Test",
    stockMinimo: 2,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 3,
    motivo: "Stock inicial 3",
    claveIdempotencia: "key-init-2",
  });

  const res = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 5,
    motivo: "Salida mayor al stock disponible",
    claveIdempotencia: "sol-key-2",
    origen: "api",
  });

  expect(res.esNueva).toBe(true);
  expect(res.solicitud.estado).toBe("pendiente");
  expect(res.solicitud.existenciaAlSolicitar).toBe(3);
  expect(res.solicitud.disponibleAlSolicitar).toBe(false);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(3);
});

test("3. Idempotencia al crear solicitudes con misma y distinta información", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-003",
    nombre: "Monitor Idempotencia",
    stockMinimo: 2,
  });

  const claveRepetida = "sol-clave-idempotente-1";

  const res1 = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 4,
    motivo: "Solicitud original",
    solicitante: "Ana",
    claveIdempotencia: claveRepetida,
    origen: "interfaz",
  });

  // Reintento idéntico
  const res2 = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 4,
    motivo: "Solicitud original",
    solicitante: "Ana",
    claveIdempotencia: claveRepetida,
    origen: "interfaz",
  });

  expect(res2.esNueva).toBe(false);
  expect(res2.solicitud._id).toBe(res1.solicitud._id);

  const todasSolicitudes = await t.query(api.solicitudesStock.listar, {});
  expect(todasSolicitudes).toHaveLength(1);

  // Reutilizar la misma clave con datos distintos
  await expect(
    t.mutation(api.solicitudesStock.crear, {
      productoId: prod.id,
      cantidadSolicitada: 10,
      motivo: "Solicitud distinta con la misma clave",
      claveIdempotencia: claveRepetida,
      origen: "interfaz",
    })
  ).rejects.toThrow(
    "La clave de idempotencia ya fue utilizada con datos diferentes."
  );

  const solicitudesPosteriores = await t.query(
    api.solicitudesStock.listar,
    {}
  );
  expect(solicitudesPosteriores).toHaveLength(1);
});

test("4. Aprobar una solicitud con stock suficiente registra salida y movimiento con evento", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-004",
    nombre: "Mouse Aprobar Test",
    stockMinimo: 2,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 8,
    motivo: "Stock inicial 8",
    claveIdempotencia: "key-init-4",
  });

  const resCrear = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 5,
    motivo: "Aprobar salida de 5",
    claveIdempotencia: "sol-key-4",
    origen: "interfaz",
  });

  const resAprobar = await t.mutation(api.solicitudesStock.aprobar, {
    solicitudId: resCrear.solicitud._id,
  });

  expect(resAprobar.resultado).toBe("aprobada");
  expect(resAprobar.movimientoId).toBeDefined();

  const solicitudActualizada = await t.query(api.solicitudesStock.obtener, {
    solicitudId: resCrear.solicitud._id,
  });
  expect(solicitudActualizada?.estado).toBe("aprobada");
  expect(solicitudActualizada?.movimientoId).toBe(resAprobar.movimientoId);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(3);

  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(2); // 1 entrada + 1 salida
  const salida = movimientos.find((m) => m.tipo === "salida");
  expect(salida?.cantidad).toBe(5);

  const eventos = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect()
  );
  expect(eventos).toHaveLength(2);
});

test("5. Reintentar la aprobación de una solicitud aprobada conserva el resultado sin duplicar movimientos", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-005",
    nombre: "Impresora Reintento",
    stockMinimo: 2,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 8,
    motivo: "Stock inicial 8",
    claveIdempotencia: "key-init-5",
  });

  const resCrear = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 5,
    motivo: "Aprobacion repetida",
    claveIdempotencia: "sol-key-5",
    origen: "interfaz",
  });

  const res1 = await t.mutation(api.solicitudesStock.aprobar, {
    solicitudId: resCrear.solicitud._id,
  });

  // Reintento de aprobación sobre la misma solicitud aprobada
  const res2 = await t.mutation(api.solicitudesStock.aprobar, {
    solicitudId: resCrear.solicitud._id,
  });

  expect(res2.resultado).toBe("aprobada");
  expect(res2.movimientoId).toBe(res1.movimientoId);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(3);

  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(2);
});

test("6. Aprobar sin stock suficiente guarda rechazada_sin_stock sin crear movimientos ni excepciones", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-006",
    nombre: "Camara Sin Stock",
    stockMinimo: 2,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 3,
    motivo: "Stock inicial 3",
    claveIdempotencia: "key-init-6",
  });

  const resCrear = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 5,
    motivo: "Intentar aprobar sin stock",
    claveIdempotencia: "sol-key-6",
    origen: "interfaz",
  });

  const resAprobar = await t.mutation(api.solicitudesStock.aprobar, {
    solicitudId: resCrear.solicitud._id,
  });

  expect(resAprobar.resultado).toBe("rechazada");
  expect(resAprobar.motivo).toBe("stock_insuficiente");
  expect(resAprobar.cantidadSolicitada).toBe(5);
  expect(resAprobar.existenciaDisponible).toBe(3);
  expect(resAprobar.mensaje).toContain("solamente quedan 3 disponibles");

  const solicitudFinal = await t.query(api.solicitudesStock.obtener, {
    solicitudId: resCrear.solicitud._id,
  });
  expect(solicitudFinal?.estado).toBe("rechazada_sin_stock");
  expect(solicitudFinal?.existenciaDisponibleAlResolver).toBe(3);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);
  expect(p?.existenciaActual).toBe(3);

  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(1); // solo la entrada inicial
});

test("7. Rechazo manual actualiza la solicitud y valida motivo no vacío", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-007",
    nombre: "Audifonos Rechazo Manual",
    stockMinimo: 2,
  });

  const resCrear = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 2,
    motivo: "Rechazo manual test",
    claveIdempotencia: "sol-key-7",
    origen: "interfaz",
  });

  // Intentar rechazar con motivo vacío
  await expect(
    t.mutation(api.solicitudesStock.rechazar, {
      solicitudId: resCrear.solicitud._id,
      motivoRechazo: "   ",
    })
  ).rejects.toThrow("El motivo es obligatorio.");

  // Rechazar con motivo válido
  const solRechazada = await t.mutation(api.solicitudesStock.rechazar, {
    solicitudId: resCrear.solicitud._id,
    motivoRechazo: "  Cancelado por cambio de prioridades  ",
  });

  expect(solRechazada.estado).toBe("rechazada");
  expect(solRechazada.motivoRechazo).toBe("Cancelado por cambio de prioridades");
  expect(solRechazada.resueltaEn).toBeDefined();

  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  expect(movimientos).toHaveLength(0);
});

test("8. Concurrencia: Escenario obligatorio (Stock=8, A=5, B=4)", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-008",
    nombre: "Tablet Concurrencia",
    stockMinimo: 2,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 8,
    motivo: "Stock inicial 8 para concurrencia",
    claveIdempotencia: "key-init-8",
  });

  const solA = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 5,
    motivo: "Solicitud A",
    claveIdempotencia: "sol-key-8a",
    origen: "interfaz",
  });

  const solB = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 4,
    motivo: "Solicitud B",
    claveIdempotencia: "sol-key-8b",
    origen: "interfaz",
  });

  // Ejecutar solicitudes de aprobación iniciadas juntas mediante Promise.allSettled
  const resultados = await Promise.allSettled([
    t.mutation(api.solicitudesStock.aprobar, { solicitudId: solA.solicitud._id }),
    t.mutation(api.solicitudesStock.aprobar, { solicitudId: solB.solicitud._id }),
  ]);

  expect(resultados[0].status).toBe("fulfilled");
  expect(resultados[1].status).toBe("fulfilled");

  const docA = await t.query(api.solicitudesStock.obtener, {
    solicitudId: solA.solicitud._id,
  });
  const docB = await t.query(api.solicitudesStock.obtener, {
    solicitudId: solB.solicitud._id,
  });

  const unaAprobada =
    (docA?.estado === "aprobada" && docB?.estado === "rechazada_sin_stock") ||
    (docB?.estado === "aprobada" && docA?.estado === "rechazada_sin_stock");
  expect(unaAprobada).toBe(true);

  const productos = await t.query(api.productos.listar);
  const p = productos.find((item) => item._id === prod.id);

  if (docA?.estado === "aprobada") {
    expect(p?.existenciaActual).toBe(3);
    expect(docB?.existenciaDisponibleAlResolver).toBe(3);
  } else {
    expect(p?.existenciaActual).toBe(4);
    expect(docA?.existenciaDisponibleAlResolver).toBe(4);
  }

  // La existencia nunca es negativa
  expect(p?.existenciaActual).toBeGreaterThanOrEqual(0);

  // Exactamente un movimiento de salida registrado
  const movimientos = await t.query(api.movimientosInventario.listar, {
    productoId: prod.id,
  });
  const salidas = movimientos.filter((m) => m.tipo === "salida");
  expect(salidas).toHaveLength(1);
});

test("9. Continuidad con el flujo EDA al aprobar solicitud que deja stock bajo", async () => {
  const t = convexTest(schema, modules);
  const prod = await t.mutation(api.productos.crear, {
    sku: "SKU-SOL-009",
    nombre: "Servidor EDA",
    stockMinimo: 5,
  });

  await t.mutation(api.movimientosInventario.registrar, {
    productoId: prod.id,
    tipo: "entrada",
    cantidad: 10,
    motivo: "Stock inicial 10",
    claveIdempotencia: "key-init-9",
  });

  const sol = await t.mutation(api.solicitudesStock.crear, {
    productoId: prod.id,
    cantidadSolicitada: 7,
    motivo: "Salida de 7 para dejar stock en 3 (<=5)",
    claveIdempotencia: "sol-key-9",
    origen: "interfaz",
  });

  const resAprobar = await t.mutation(api.solicitudesStock.aprobar, {
    solicitudId: sol.solicitud._id,
  });
  expect(resAprobar.resultado).toBe("aprobada");

  const eventos = await t.run(async (ctx) =>
    ctx.db
      .query("eventosDominio")
      .withIndex("por_producto_creado_en", (q) => q.eq("productoId", prod.id))
      .collect()
  );

  const eventoSalida = eventos.find(
    (e) => e.movimientoId === resAprobar.movimientoId
  )!;
  expect(eventoSalida.estado).toBe("pendiente");

  await t.mutation(internal.eventos.procesarMovimientoInventarioRegistrado, {
    eventoId: eventoSalida._id,
  });

  const eventoProcesado = await t.run(async (ctx) =>
    ctx.db.get("eventosDominio", eventoSalida._id)
  );
  expect(eventoProcesado?.estado).toBe("procesado");

  const alertas = await t.query(api.alertasInventario.listar, {
    estado: "activa",
  });
  expect(alertas).toHaveLength(1);
  expect(alertas[0].productoId).toBe(prod.id);
  expect(alertas[0].existenciaAlGenerarse).toBe(3);
});
