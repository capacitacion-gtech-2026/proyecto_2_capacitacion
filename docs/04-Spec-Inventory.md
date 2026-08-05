# Spec Inventory: Sistema de Gestión de Inventario

> **ID:** SPECS-inventario  
> **Versión:** 1 
> **Fecha:** 2026-08-04  
> **Requirements padre:** REQ-inventario  
> **Architecture padre:** ARCH-inventario

---

## Tipos de Spec

Este inventario corresponde a un proyecto nuevo que todavía no ha sido implementado. Su propósito es identificar las especificaciones que deberán redactarse con FRACTIK 05; mencionar una Spec en este documento no significa que su archivo ya exista.

| Tipo | Prefijo | Qué define | Template |
|---|---|---|---|
| Non-functional | NF- | Integridad, idempotencia, manejo de fallos, reactividad y tiempos de respuesta. | Template NF |
| Backend | BE- | Queries, mutations, reglas de negocio y procesamiento de eventos en Convex. | Template BE |
| Frontend | FE- | Páginas, componentes, formularios, estados e interacciones. Los componentes concretos se definirán dentro de cada Spec FE, no en este inventario. | Template FE |
| Data | DA- | Entidades, relaciones, campos, índices y reglas de integridad. | Template DA |

### Estados utilizados

| Estado | Significado en este proyecto |
|---|---|
| `planned` | La necesidad de la Spec fue identificada, pero el documento FRACTIK 05 todavía no existe. |
| `draft` | El documento FRACTIK 05 existe, pero continúa incompleto. |
| `reviewed` | El documento fue revisado y tiene observaciones atendidas. |
| `approved` | El documento fue aprobado para guiar la implementación. |
| `implemented` | La solución definida por la Spec fue implementada y validada. |

Se agrega `planned` al estado original del template para distinguir una Spec solamente identificada de una Spec que ya tiene un documento en borrador.

## Matriz de trazabilidad

La columna **ACs que deberá cubrir** indica qué criterios deberán explicarse en cada futura Spec. No representa cobertura documental actual.

| Spec ID | Título | Tipo | Feature | ACs que deberá cubrir | Status |
|---|---|---|---|---|---|
| NF-001 | Integridad, idempotencia y manejo de fallos | NF | F-2.1, F-2.2, F-3.1, F-3.3 | F-2.1 AC4, AC6; F-2.2 AC4-AC6; F-3.1 AC5, AC6; F-3.3 AC3 | planned |
| NF-002 | Actualización reactiva y tiempo de respuesta | NF | F-1.2, F-3.1, F-4.1 | F-1.2 AC5; F-3.1 AC3; F-4.1 AC6 | planned |
| DA-001 | Modelo de datos del inventario | DA | F-1.1, F-1.3, F-2.1, F-2.2, F-2.3, F-3.1, F-3.2, F-3.3 | Entidades, relaciones y restricciones necesarias para los ACs de estas features | planned |
| BE-001 | Gestión de productos | BE | F-1.1, F-1.3 | F-1.1 AC1-AC5; F-1.3 AC1-AC5 | planned |
| BE-002 | Registro de movimientos y actualización de existencia | BE | F-1.3, F-2.1, F-2.2 | F-1.3 AC5; F-2.1 AC1-AC6; F-2.2 AC1-AC6 | planned |
| BE-003 | Flujo EDA de movimientos y alertas | BE | F-3.1, F-3.3 | F-3.1 AC1-AC6; F-3.3 AC1, AC3-AC6 | planned |
| BE-004 | Consultas del inventario | BE | F-1.2, F-2.3, F-3.2, F-4.1 | F-1.2 AC1-AC5; F-2.3 AC1-AC5; F-3.2 AC1-AC5; F-4.1 AC1-AC6 | planned |
| FE-001 | Interfaz de productos | FE | F-1.1, F-1.2, F-1.3 | F-1.1 AC1, AC2, AC4, AC5; F-1.2 AC1-AC5; F-1.3 AC1, AC3-AC5 | planned |
| FE-002 | Interfaz de movimientos | FE | F-2.1, F-2.2, F-2.3 | F-2.1 AC1-AC3, AC5; F-2.2 AC1-AC3, AC5; F-2.3 AC1-AC5 | planned |
| FE-003 | Interfaz de alertas | FE | F-3.2, F-3.3 | F-3.2 AC1-AC5; F-3.3 AC2-AC6 | planned |
| FE-004 | Panel general del inventario | FE | F-4.1 | F-4.1 AC1-AC6 | planned |

## Cobertura por Feature

En esta versión, todas las filas permanecen pendientes porque ninguna Spec ha sido redactada todavía con FRACTIK 05. La columna de Spec muestra solamente el documento previsto para cubrir el criterio.

### F-1.1: Crear producto

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Solicitar SKU, nombre y stock mínimo | DA-001, BE-001, FE-001 | ⬜ Pendiente |
| AC2: Permitir descripción opcional | DA-001, BE-001, FE-001 | ⬜ Pendiente |
| AC3: Rechazar SKU duplicado | DA-001, BE-001 | ⬜ Pendiente |
| AC4: Validar stock mínimo entero y no negativo | DA-001, BE-001, FE-001 | ⬜ Pendiente |
| AC5: Crear producto con existencia cero y sin movimiento automático | DA-001, BE-001, FE-001 | ⬜ Pendiente |

### F-1.2: Consultar productos

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Mostrar SKU, nombre, existencia, mínimo y estado | BE-004, FE-001 | ⬜ Pendiente |
| AC2: Indicar stock bajo cuando existencia sea menor o igual al mínimo | BE-004, FE-001 | ⬜ Pendiente |
| AC3: Mostrar detalle e historial del producto | BE-004, FE-001 | ⬜ Pendiente |
| AC4: Mostrar estado vacío si no hay productos | FE-001 | ⬜ Pendiente |
| AC5: Reflejar cambios sin recarga manual | NF-002, BE-004, FE-001 | ⬜ Pendiente |

### F-1.3: Actualizar y desactivar producto

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Actualizar nombre, descripción y stock mínimo | DA-001, BE-001, FE-001 | ⬜ Pendiente |
| AC2: Cambiar SKU únicamente por otro disponible | DA-001, BE-001 | ⬜ Pendiente |
| AC3: Recalcular indicador al cambiar el mínimo | BE-001, FE-001 | ⬜ Pendiente |
| AC4: Desactivar sin eliminar historial | DA-001, BE-001, FE-001 | ⬜ Pendiente |
| AC5: Consultar producto inactivo e impedir nuevos movimientos | DA-001, BE-001, BE-002, FE-001 | ⬜ Pendiente |

### F-2.1: Registrar entrada

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Solicitar producto, cantidad y motivo | DA-001, BE-002, FE-002 | ⬜ Pendiente |
| AC2: Aceptar solamente cantidades enteras positivas | BE-002, FE-002 | ⬜ Pendiente |
| AC3: Rechazar producto inexistente o inactivo | BE-002, FE-002 | ⬜ Pendiente |
| AC4: Aumentar exactamente la cantidad indicada | NF-001, DA-001, BE-002 | ⬜ Pendiente |
| AC5: Confirmar la existencia resultante | DA-001, BE-002, FE-002 | ⬜ Pendiente |
| AC6: No duplicar una entrada reenviada | NF-001, DA-001, BE-002 | ⬜ Pendiente |

### F-2.2: Registrar salida

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Solicitar producto, cantidad y motivo | DA-001, BE-002, FE-002 | ⬜ Pendiente |
| AC2: Aceptar solamente cantidades enteras positivas | BE-002, FE-002 | ⬜ Pendiente |
| AC3: Rechazar producto inexistente o inactivo | BE-002, FE-002 | ⬜ Pendiente |
| AC4: Disminuir exactamente la cantidad indicada | NF-001, DA-001, BE-002 | ⬜ Pendiente |
| AC5: Rechazar stock insuficiente sin escrituras parciales | NF-001, DA-001, BE-002, FE-002 | ⬜ Pendiente |
| AC6: No duplicar una salida reenviada | NF-001, DA-001, BE-002 | ⬜ Pendiente |

### F-2.3: Consultar historial de movimientos

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Mostrar producto, tipo, cantidades, motivo y fecha | DA-001, BE-004, FE-002 | ⬜ Pendiente |
| AC2: Ordenar del movimiento más reciente al más antiguo | BE-004, FE-002 | ⬜ Pendiente |
| AC3: Consultar historial general y por producto | BE-004, FE-002 | ⬜ Pendiente |
| AC4: Distinguir visualmente entradas y salidas | FE-002 | ⬜ Pendiente |
| AC5: No permitir editar o eliminar movimientos | DA-001, BE-004, FE-002 | ⬜ Pendiente |

### F-3.1: Detectar y generar alerta de stock bajo

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Evaluar stock después de cada movimiento válido | BE-003 | ⬜ Pendiente |
| AC2: Considerar bajo cuando existencia sea menor o igual al mínimo | BE-003 | ⬜ Pendiente |
| AC3: Generar alerta en segundos | NF-002, BE-003 | ⬜ Pendiente |
| AC4: Guardar producto, existencia, mínimo y fecha | DA-001, BE-003 | ⬜ Pendiente |
| AC5: Evitar alertas activas duplicadas | NF-001, DA-001, BE-003 | ⬜ Pendiente |
| AC6: No repetir ni revertir el movimiento si falla la alerta | NF-001, BE-003 | ⬜ Pendiente |

### F-3.2: Consultar alertas

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Distinguir alertas activas y resueltas | DA-001, BE-004, FE-003 | ⬜ Pendiente |
| AC2: Mostrar producto, existencia, mínimo, estado y fecha | DA-001, BE-004, FE-003 | ⬜ Pendiente |
| AC3: Ordenar de la alerta más reciente a la más antigua | BE-004, FE-003 | ⬜ Pendiente |
| AC4: Abrir el producto relacionado | BE-004, FE-003 | ⬜ Pendiente |
| AC5: Mostrar estado vacío sin alertas activas | BE-004, FE-003 | ⬜ Pendiente |

### F-3.3: Resolver alerta

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Resolver automáticamente al recuperar el stock | DA-001, BE-003 | ⬜ Pendiente |
| AC2: Permitir resolución manual | DA-001, FE-003 | ⬜ Pendiente |
| AC3: No modificar inventario mediante resolución manual | NF-001, BE-003, FE-003 | ⬜ Pendiente |
| AC4: Mantener indicador cuando el stock continúe bajo | BE-003, FE-001, FE-003 | ⬜ Pendiente |
| AC5: Permitir nueva alerta después de otro movimiento bajo | DA-001, BE-003, FE-003 | ⬜ Pendiente |
| AC6: Conservar forma y fechas de resolución | DA-001, BE-003, FE-003 | ⬜ Pendiente |

### F-4.1: Panel de inventario

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Mostrar total de productos activos | BE-004, FE-004 | ⬜ Pendiente |
| AC2: Mostrar total de productos con stock bajo | BE-004, FE-004 | ⬜ Pendiente |
| AC3: Mostrar total de alertas activas | BE-004, FE-004 | ⬜ Pendiente |
| AC4: Listar productos con stock bajo | BE-004, FE-004 | ⬜ Pendiente |
| AC5: Mostrar movimientos recientes | BE-004, FE-004 | ⬜ Pendiente |
| AC6: Actualizar el panel sin recarga manual | NF-002, BE-004, FE-004 | ⬜ Pendiente |

## Resumen

| Tipo | Total | Planned | Draft | Reviewed | Approved | Implemented |
|---|---:|---:|---:|---:|---:|---:|
| Non-functional | 2 | 2 | 0 | 0 | 0 | 0 |
| Backend | 4 | 4 | 0 | 0 | 0 | 0 |
| Frontend | 4 | 4 | 0 | 0 | 0 | 0 |
| Data | 1 | 1 | 0 | 0 | 0 | 0 |
| **Total** | **11** | **11** | **0** | **0** | **0** | **0** |

### Estado de cobertura actual

| Concepto | Cantidad |
|---|---:|
| Specs identificadas | 11 |
| Specs redactadas con FRACTIK 05 | 0 |
| ACs con una Spec prevista | 55 |
| ACs cubiertos por una Spec redactada | 0 |

Cuando se cree una Spec con FRACTIK 05, su estado cambiará de `planned` a `draft`. Los criterios solo podrán marcarse como parcial o completamente cubiertos después de revisar el contenido real de esa Spec.
