# Spec Inventory: Sistema de Gestión de Inventario

> **ID:** SPECS-inventario
> **Versión:** 1.2
> **Fecha:** 2026-08-06
> **Autor:** Angel Yahir Murillo Gallegos
> **Status:** draft
> **Padres:** REQ-inventario, ARCH-inventario

---

## Tipos de Spec

Este inventario refleja tanto las Specs ya redactadas como las que permanecen pendientes. La primera unidad se limita al catálogo de productos; las Specs de movimientos, alertas y panel se conservan como trabajo de fases posteriores.

| Tipo | Prefijo | Qué define | Template |
|---|---|---|---|
| Non-functional | NF- | Integridad, idempotencia, manejo de fallos, reactividad y tiempos de respuesta. | Template NF |
| Backend | BE- | Queries, mutations, reglas de negocio y procesamiento de eventos en Convex. | Template BE |
| Frontend | FE- | Páginas, componentes, formularios, estados e interacciones. Los componentes concretos se definirán dentro de cada Spec FE, no en este inventario. | Template FE |
| Data | DA- | Entidades, relaciones, campos, índices y reglas de integridad. | Template DA |

### Estados utilizados

| Estado | Significado en este proyecto |
|---|---|
| `draft` | La Spec está identificada o en elaboración y todavía requiere revisión humana. |
| `reviewed` | El documento fue revisado y tiene observaciones atendidas. |
| `approved` | El documento fue aprobado para guiar la implementación. |
| `implemented` | La solución definida por la Spec fue implementada y validada. |

La existencia física del archivo se registra en una columna separada. De esta forma no se introduce un estado adicional fuera de los definidos por Fractik 2.0.

## Matriz de trazabilidad

La columna **Archivo** distingue una Spec redactada de una necesidad todavía pendiente, mientras que **Status** conserva únicamente estados válidos de Fractik.

| Spec ID | Título | Tipo | Feature | ACs cubiertos o previstos | Archivo | Status |
|---|---|---|---|---|---|---|
| NF-001 | Integridad, idempotencia y manejo de fallos | NF | F-2.1, F-2.2, F-3.1, F-3.3 | F-2.1 AC4, AC6; F-2.2 AC4-AC6; F-3.1 AC5, AC6; F-3.3 AC3 | Existe | draft |
| NF-002 | Actualización reactiva y tiempo de respuesta | NF | F-1.2, F-3.1, F-4.1 | F-1.2 AC5; F-3.1 AC3; F-4.1 AC6 | Pendiente | draft |
| NF-003 | Concurrencia e idempotencia de solicitudes | NF | F-5.1, F-5.3 | F-5.1 AC8, AC9; F-5.3 AC6, AC7 | Existe | draft |
| DA-001 | Modelo de datos del inventario | DA | F-1.1, F-1.3, F-2.1, F-2.2, F-2.3, F-3.1, F-3.2, F-3.3 | Entidades, relaciones y restricciones necesarias para los ACs de estas features | Existe | draft |
| DA-002 | Modelo de solicitudes de stock | DA | F-5.1, F-5.2, F-5.3 | Entidad `solicitudesStock`, estados, transiciones, índices y relaciones | Existe | draft |
| BE-001 | Crear y listar productos | BE | F-1.1, F-1.2 | F-1.1 AC1-AC5; F-1.2 AC1, AC4, AC5 | Existe | draft |
| BE-002 | Registro de movimientos y actualización de existencia | BE | F-1.3, F-2.1, F-2.2 | F-1.3 AC5; F-2.1 AC1-AC6; F-2.2 AC1-AC6 | Pendiente | draft |
| BE-003 | Flujo EDA de movimientos y alertas | BE | F-3.1, F-3.3 | F-3.1 AC1-AC6; F-3.3 AC1, AC3-AC6 | Existe | draft |
| BE-004 | Consultas ampliadas del inventario | BE | F-1.2, F-2.3, F-3.2, F-4.1 | F-1.2 AC2, AC3; F-2.3 AC1-AC5; F-3.2 AC1-AC5; F-4.1 AC1-AC6 | Pendiente | draft |
| BE-005 | Gestión de solicitudes de stock | BE | F-5.1, F-5.2, F-5.3 | F-5.1 AC1-AC9; F-5.2 AC1-AC5; F-5.3 AC1-AC7 | Existe | draft |
| BE-006 | API HTTP de solicitudes de stock | BE | F-5.1, F-5.2, F-5.3 | F-5.1 AC5; F-5.2 AC1-AC5; F-5.3 AC1-AC7 | Existe | draft |
| FE-001 | Interfaz de productos | FE | F-1.1, F-1.2 | F-1.1 AC1, AC2, AC4, AC5; F-1.2 AC1, AC4 | Existe | draft |
| FE-002 | Interfaz de movimientos | FE | F-2.1, F-2.2, F-2.3 | F-2.1 AC1-AC3, AC5; F-2.2 AC1-AC3, AC5; F-2.3 AC1-AC5 | Pendiente | draft |
| FE-003 | Interfaz de alertas | FE | F-3.2, F-3.3 | F-3.2 AC1-AC5; F-3.3 AC2-AC6 | Existe | draft |
| FE-004 | Panel general del inventario | FE | F-4.1 | F-4.1 AC1-AC6 | Pendiente | draft |
| FE-005 | Interfaz de solicitudes de stock | FE | F-5.1, F-5.2, F-5.3 | F-5.1 AC1-AC7; F-5.2 AC1-AC5; F-5.3 AC1-AC7 | Existe | draft |

## Cobertura por Feature

La cobertura distingue entre documentación existente y documentos pendientes. `Documentado` no significa `implemented`: la aprobación y validación corresponden a revisiones separadas.

### F-1.1: Crear producto

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Solicitar SKU, nombre y stock mínimo | DA-001, BE-001, FE-001 | 🟨 Documentado en draft |
| AC2: Permitir descripción opcional | DA-001, BE-001, FE-001 | 🟨 Documentado en draft |
| AC3: Rechazar SKU duplicado | DA-001, BE-001 | 🟨 Documentado en draft |
| AC4: Validar stock mínimo entero y no negativo | DA-001, BE-001, FE-001 | 🟨 Documentado en draft |
| AC5: Crear producto con existencia cero y sin movimiento automático | DA-001, BE-001, FE-001 | 🟨 Documentado en draft |

### F-1.2: Consultar productos

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Mostrar SKU, nombre, existencia, mínimo y estado | BE-001, FE-001 | 🟨 Documentado en draft |
| AC2: Indicar stock bajo cuando existencia sea menor o igual al mínimo | BE-004, ampliación de FE-001 | ⬜ Fase futura |
| AC3: Mostrar detalle e historial del producto | BE-004, ampliación de FE-001 | ⬜ Fase futura |
| AC4: Mostrar estado vacío si no hay productos | FE-001 | 🟨 Documentado en draft |
| AC5: Reflejar cambios sin recarga manual | NF-002, BE-001, FE-001 | 🟨 Parcial: creación reactiva documentada |

### F-1.3: Actualizar y desactivar producto

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Actualizar nombre, descripción y stock mínimo | DA-001, ampliación de BE-001 y FE-001 | ⬜ Fase futura |
| AC2: Cambiar SKU únicamente por otro disponible | DA-001, ampliación de BE-001 | ⬜ Fase futura |
| AC3: Recalcular indicador al cambiar el mínimo | Ampliación de BE-001 y FE-001 | ⬜ Fase futura |
| AC4: Desactivar sin eliminar historial | DA-001, ampliación de BE-001 y FE-001 | ⬜ Fase futura |
| AC5: Consultar producto inactivo e impedir nuevos movimientos | DA-001, BE-002, ampliación de BE-001 y FE-001 | ⬜ Fase futura |

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

### F-5.1: Crear solicitud de stock

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Producto activo | DA-002, BE-005 | 🟨 Documentado en draft |
| AC2: Cantidad entera positiva | DA-002, BE-005, FE-005 | 🟨 Documentado en draft |
| AC3: Motivo obligatorio | DA-002, BE-005, FE-005 | 🟨 Documentado en draft |
| AC4: Solicitante opcional | DA-002, BE-005, FE-005 | 🟨 Documentado en draft |
| AC5: Creación desde interfaz o API | BE-005, BE-006, FE-005 | 🟨 Documentado en draft |
| AC6: Estado inicial pendiente | DA-002, BE-005 | 🟨 Documentado en draft |
| AC7: Solicitud pendiente no modifica existencia | DA-002, BE-005 | 🟨 Documentado en draft |
| AC8: Idempotencia con misma clave y mismos datos | NF-003, DA-002, BE-005 | 🟨 Documentado en draft |
| AC9: Clave reutilizada con datos distintos se rechaza | NF-003, DA-002, BE-005 | 🟨 Documentado en draft |

### F-5.2: Consultar solicitudes de stock

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Listado con campos principales | BE-005, FE-005 | 🟨 Documentado en draft |
| AC2: Consulta por identificador | BE-005, BE-006, FE-005 | 🟨 Documentado en draft |
| AC3: Filtrar por estado | BE-005, FE-005 | 🟨 Documentado en draft |
| AC4: Actualización reactiva en tiempo real | NF-003, FE-005 | 🟨 Documentado en draft |
| AC5: Distinguir origen interfaz o API | DA-002, FE-005 | 🟨 Documentado en draft |

### F-5.3: Aprobar o rechazar solicitud de stock

| AC | Spec(s) prevista(s) | Cobertura documental |
|---|---|---|
| AC1: Re-lectura transaccional de existencia al aprobar | NF-003, BE-005 | 🟨 Documentado en draft |
| AC2: Con stock suficiente crea un movimiento de salida | DA-002, BE-005 | 🟨 Documentado en draft |
| AC3: Sin stock guarda rechazada_sin_stock sin movimiento | NF-003, DA-002, BE-005 | 🟨 Documentado en draft |
| AC4: Rechazo informa cantidad solicitada y existencia disponible | BE-005, BE-006, FE-005 | 🟨 Documentado en draft |
| AC5: Rechazo manual sin movimientos | DA-002, BE-005, FE-005 | 🟨 Documentado en draft |
| AC6: Solicitud resuelta no se procesa de nuevo | NF-003, BE-005 | 🟨 Documentado en draft |
| AC7: Concurrencia sin existencia negativa | NF-003, BE-005 | 🟨 Documentado en draft |

## Gaps

- Faltan los archivos `NF-002`, `BE-002`, `BE-004`, `FE-002` y `FE-004`; todos pertenecen principalmente a fases anteriores a la 5.
- F-1.2 AC2 y AC3 requieren ampliar la interfaz y las consultas después de la primera unidad.
- F-1.3 permanece fuera del alcance actual y requiere ampliar `BE-001` y `FE-001` antes de considerarse cubierto.
- `DA-001`, `BE-003`, `FE-003` y `NF-001` describen partes de la arquitectura objetivo que todavía no están implementadas.
- Las specs `DA-002`, `BE-005`, `BE-006`, `FE-005` y `NF-003` (fase 5) están en draft; ninguna ha sido revisada ni aprobada.
- Ninguna Spec está aprobada; la revisión y aprobación corresponden al responsable humano.

## Orden de creación y revisión sugerido

1. Revisar `DA-001`, `BE-001` y `FE-001` como conjunto documental de la primera unidad.
2. Crear `BE-002` y `FE-002` al iniciar la unidad de movimientos.
3. Revisar `NF-001` y `BE-003`, y después `FE-003`, al iniciar eventos y alertas.
4. Crear `NF-002`, `BE-004` y `FE-004` cuando se amplíen consultas y panel.

## Resumen

| Tipo | Total identificado | Archivos existentes | Draft | Reviewed | Approved | Implemented |
|---|---:|---:|---:|---:|---:|---:|
| Non-functional | 3 | 2 | 3 | 0 | 0 | 0 |
| Backend | 6 | 4 | 6 | 0 | 0 | 0 |
| Frontend | 5 | 3 | 5 | 0 | 0 | 0 |
| Data | 2 | 2 | 2 | 0 | 0 | 0 |
| **Total** | **16** | **11** | **16** | **0** | **0** | **0** |

### Estado de cobertura actual

| Concepto | Cantidad |
|---|---:|
| Specs identificadas | 16 |
| Archivos de Spec existentes | 11 |
| Archivos de Spec pendientes | 5 |
| ACs con una Spec prevista | 76 |
| ACs de F-1.1 documentados en draft | 5 de 5 |
| ACs de F-1.2 documentados completamente en draft | 2 de 5 |
| ACs de F-5.1 documentados en draft | 9 de 9 |
| ACs de F-5.2 documentados en draft | 5 de 5 |
| ACs de F-5.3 documentados en draft | 7 de 7 |

La cobertura documental no equivale a aprobación ni implementación. Un responsable humano debe revisar cada Spec antes de cambiarla a `reviewed` o `approved`.

## Changelog

- v1.2 (2026-08-06): Se registraron DA-002, BE-005, BE-006, FE-005 y NF-003 en la matriz (todas en draft). Se añadieron secciones de cobertura para F-5.1, F-5.2 y F-5.3. Se actualizaron gaps, resumen numérico y cobertura.
- v1.1 (2026-08-05): Se sincronizaron los archivos existentes, se eliminó el estado no estándar, se delimitó la primera unidad y se añadieron gaps y orden de creación.
- v1.0 (2026-08-04): Inventario inicial de Specs previstas.
