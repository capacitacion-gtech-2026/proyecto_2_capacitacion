# Vision: Sistema de Gestión de Inventario

> **ID:** V-inventario
> **Fecha:** 2026-07-31
> **Autor:** Angel Yahir Murillo Gallegos


El problema

En un almacén o negocio pequeño que controla su inventario manualmente (hojas de cálculo, cuadernos, o memoria del encargado), las existencias reales se desincronizan de las registradas: alguien saca producto sin anotarlo, una entrada se registra tarde, o nadie se da cuenta de que un producto está por agotarse hasta que ya no hay. El costo no es solo el error de conteo: es la venta perdida por falta de stock, la compra innecesaria por exceso de stock, y el tiempo perdido haciendo conteos manuales para "cuadrar" el inventario.

El problema de fondo es que el registro de inventario vive separado del momento en que ocurre el movimiento real (una entrada, una salida), y nadie reacciona automáticamente cuando el stock cruza un umbral crítico.

La solución

Un sistema que registra cada movimiento de inventario (entrada o salida) en el momento en que ocurre y mantiene la existencia de cada producto siempre actualizada en tiempo real, generando automáticamente una alerta cuando el stock cae por debajo de un umbral mínimo definido.

Funciona registrando productos con su existencia actual; cada movimiento (entrada o salida) se captura como un evento que actualiza la existencia y, si corresponde, dispara una alerta de bajo stock — sin que nadie tenga que revisar manualmente si "ya se está agotando algo".

Qué NO es

No es un sistema de punto de venta (POS); no procesa cobros ni tickets de venta.

No es un sistema de compras ni gestión de proveedores (no genera órdenes de compra ni cotizaciones).

No es un sistema de contabilidad ni facturación.

No incluye autenticación, cuentas de usuario ni permisos por rol en la primera versión; será una demostración con datos ficticios.

No maneja múltiples almacenes o ubicaciones en esta primera versión (queda como extensión futura, contemplada en el modelo de datos pero no implementada).

No incluye reportes históricos avanzados ni predicción de demanda; solo el estado actual y la alerta de umbral.

Perfiles de uso

Los siguientes perfiles describen a las personas que utilizarían el sistema en un entorno real y permiten expresar sus necesidades dentro de los requisitos e historias de usuario. En la primera versión no representan cuentas, sesiones ni roles técnicos: la aplicación no identificará a la persona que la utiliza ni restringirá funciones según el perfil.

Encargado de almacén: Registra las entradas y salidas de producto conforme ocurren físicamente. Necesita que registrar un movimiento sea rápido y que el sistema le confirme de inmediato que la existencia quedó actualizada.

Administrador del inventario: Da de alta los productos, define el umbral mínimo de stock de cada uno, y consulta el estado general de existencias. Necesita ver de un vistazo qué productos están en alerta de bajo stock.

Principios de diseño

El movimiento es el evento, no un formulario aislado: registrar una entrada o salida dispara una cadena de reacciones (actualizar existencia, evaluar umbral, generar alerta si aplica), no una simple escritura en una tabla.

La existencia nunca se edita directamente: el stock de un producto es siempre la suma de sus movimientos, nunca un campo que alguien sobrescribe a mano; esto evita que el número se desincronice de su historial.

Alertar antes de que falte, no después: el umbral mínimo existe para que la alerta llegue mientras aún hay margen de reacción, no cuando el stock ya llegó a cero.

Un movimiento duplicado nunca debe alterar el stock dos veces: la idempotencia es un requisito de integridad del dato, no un detalle técnico opcional.

Simplicidad de alcance sobre cobertura amplia: el sistema resuelve bien el ciclo entrada/salida/alerta de un solo almacén antes de considerar multi-almacén, proveedores o ventas.

Métricas de éxito

Latencia de actualización de existencia: tiempo entre que se registra un movimiento y que la existencia reflejada en el sistema queda actualizada. Debe ser prácticamente instantáneo.

Tasa de alertas correctas: de los productos que cruzan su umbral mínimo, el porcentaje que efectivamente generó una alerta

Consistencia ante duplicados: número de casos donde un evento de movimiento procesado más de una vez alteró incorrectamente la existencia.

Stack / Constraints técnicos

Next.js (App Router) + React + TypeScript

Convex (backend serverless: base de datos en tiempo real, actions y scheduled functions para el flujo de eventos de movimientos y alertas)

Shadcn/ui + Tailwind CSS (UI responsiva)

Vercel (deploy y preview environments)

Arquitectura orientada a eventos (EDA) para el flujo: movimiento registrado → existencia actualizada → evaluación de umbral → alerta (si aplica)