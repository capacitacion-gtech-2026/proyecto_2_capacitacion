"use client";

import Link from "next/link";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Boxes,
  CheckCircle2,
  History,
  Loader2,
  Package,
  Save,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const movimientoSchema = z.object({
  productoId: z.string().min(1, "Selecciona un producto."),
  tipo: z.enum(["entrada", "salida"]),
  cantidad: z
    .number({ message: "La cantidad debe ser un número." })
    .int("La cantidad debe ser un entero.")
    .min(1, "La cantidad debe ser mayor que cero."),
  motivo: z.string().trim().min(1, "El motivo es obligatorio."),
});

type MovimientoFormValues = z.infer<typeof movimientoSchema>;

const FORM_DEFAULTS: MovimientoFormValues = {
  productoId: "",
  tipo: "entrada",
  cantidad: 1,
  motivo: "",
};

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function obtenerMensajeError(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }

  return "No se pudo registrar el movimiento. Verifica los datos e inténtalo nuevamente.";
}

export default function MovimientosPage() {
  const [filtroProductoId, setFiltroProductoId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claveIdempotencia, setClaveIdempotencia] = useState(() =>
    crypto.randomUUID(),
  );

  const productos = useQuery(api.productos.listar);
  const movimientos = useQuery(
    api.movimientosInventario.listar,
    filtroProductoId
      ? { productoId: filtroProductoId as Id<"productos"> }
      : {},
  );
  const registrarMovimiento = useMutation(api.movimientosInventario.registrar);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const productoSeleccionadoId = useWatch({
    control,
    name: "productoId",
  });
  const productosActivos = productos?.filter((producto) => producto.activo) ?? [];
  const productoSeleccionado = productos?.find(
    (producto) => producto._id === productoSeleccionadoId,
  );
  const estaCargando = productos === undefined || movimientos === undefined;

  const manejarCambioFormulario = () => {
    if (submitError) {
      setSubmitError(null);
    }
    setClaveIdempotencia(crypto.randomUUID());
  };

  const onSubmit = async (data: MovimientoFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      const resultado = await registrarMovimiento({
        productoId: data.productoId as Id<"productos">,
        tipo: data.tipo,
        cantidad: data.cantidad,
        motivo: data.motivo,
        claveIdempotencia,
      });

      const producto = productos?.find(
        (item) => item._id === resultado.productoId,
      );
      setSubmitSuccess(
        `${data.tipo === "entrada" ? "Entrada" : "Salida"} registrada para ${producto?.nombre ?? "el producto"}. Existencia resultante: ${resultado.existenciaResultante}.`,
      );
      reset(FORM_DEFAULTS);
      setClaveIdempotencia(crypto.randomUUID());
    } catch (error: unknown) {
      setSubmitError(obtenerMensajeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100">
      <header className="border-b border-white/[0.07] bg-[#090b10]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <Boxes className="size-4 text-blue-400" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Inventario</p>
              <p className="text-[11px] text-zinc-400">Gestión operativa</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Movimientos
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Control de inventario
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.025em] text-zinc-50">
              Movimientos
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Registra entradas y salidas y consulta cómo cambió la existencia.
            </p>
          </div>
          <Link
            href="/productos"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            <ArrowLeft className="size-4" />
            Ver productos
          </Link>
        </div>

        {submitSuccess && (
          <Alert variant="success" className="mb-6">
            <CheckCircle2 />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{submitSuccess}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-my-2 text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200"
                onClick={() => setSubmitSuccess(null)}
              >
                <X />
                <span className="sr-only">Cerrar confirmación</span>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {estaCargando ? (
          <Card>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center"
            >
              <Loader2
                aria-hidden="true"
                className="size-6 animate-spin text-blue-400 motion-reduce:animate-none"
              />
              <p className="text-sm text-zinc-400">
                Cargando productos y movimientos...
              </p>
            </div>
          </Card>
        ) : productos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <span className="mb-4 flex size-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <Package className="size-5 text-zinc-500" />
              </span>
              <h2 className="text-base font-medium text-zinc-200">
                No hay productos registrados
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                Registra al menos un producto antes de capturar entradas o salidas.
              </p>
              <Link
                href="/productos"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              >
                Ir a productos
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
            <Card>
              <CardHeader className="border-b border-white/[0.07]">
                <h2 className="text-base font-medium text-zinc-100">
                  Registrar movimiento
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  La existencia solo cambia mediante este registro.
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {productosActivos.length === 0 && (
                  <Alert variant="destructive" className="mb-5">
                    <AlertCircle />
                    <AlertDescription>
                      No hay productos activos disponibles para movimientos.
                    </AlertDescription>
                  </Alert>
                )}

                {submitError && (
                  <Alert variant="destructive" className="mb-5">
                    <AlertCircle />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  onChange={manejarCambioFormulario}
                  aria-busy={isSubmitting}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="productoId">
                      Producto <span className="text-rose-400">*</span>
                    </Label>
                    <select
                      id="productoId"
                      aria-invalid={Boolean(errors.productoId)}
                      aria-describedby={
                        errors.productoId ? "productoId-error" : undefined
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-[#0c0e13] px-3.5 text-sm text-zinc-100 outline-none transition-colors hover:border-white/15 focus-visible:border-blue-400/70 focus-visible:ring-2 focus-visible:ring-blue-400/15 aria-invalid:border-rose-400/70"
                      {...register("productoId")}
                    >
                      <option value="">Selecciona un producto</option>
                      {productosActivos.map((producto) => (
                        <option key={producto._id} value={producto._id}>
                          {producto.sku} — {producto.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.productoId && (
                      <p
                        id="productoId-error"
                        role="alert"
                        className="text-xs text-rose-400"
                      >
                        {errors.productoId.message}
                      </p>
                    )}
                  </div>

                  {productoSeleccionado && (
                    <div
                      aria-live="polite"
                      className="rounded-lg border border-white/[0.07] bg-black/15 p-4"
                    >
                      <p className="text-xs text-zinc-400">Existencia disponible</p>
                      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-100">
                        {productoSeleccionado.existenciaActual}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Stock mínimo: {productoSeleccionado.stockMinimo}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="tipo">
                      Tipo <span className="text-rose-400">*</span>
                    </Label>
                    <select
                      id="tipo"
                      className="h-10 w-full rounded-lg border border-white/10 bg-[#0c0e13] px-3.5 text-sm text-zinc-100 outline-none transition-colors hover:border-white/15 focus-visible:border-blue-400/70 focus-visible:ring-2 focus-visible:ring-blue-400/15"
                      {...register("tipo")}
                    >
                      <option value="entrada">Entrada</option>
                      <option value="salida">Salida</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">
                      Cantidad <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min={1}
                      step={1}
                      aria-invalid={Boolean(errors.cantidad)}
                      aria-describedby={
                        errors.cantidad ? "cantidad-error" : undefined
                      }
                      {...register("cantidad", { valueAsNumber: true })}
                    />
                    {errors.cantidad && (
                      <p
                        id="cantidad-error"
                        role="alert"
                        className="text-xs text-rose-400"
                      >
                        {errors.cantidad.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">
                      Motivo <span className="text-rose-400">*</span>
                    </Label>
                    <Textarea
                      id="motivo"
                      rows={3}
                      placeholder="Ej: Recepción de mercancía"
                      aria-invalid={Boolean(errors.motivo)}
                      aria-describedby={errors.motivo ? "motivo-error" : undefined}
                      {...register("motivo")}
                    />
                    {errors.motivo && (
                      <p
                        id="motivo-error"
                        role="alert"
                        className="text-xs text-rose-400"
                      >
                        {errors.motivo.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || productosActivos.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="animate-spin motion-reduce:animate-none"
                        />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Save />
                        Registrar movimiento
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="flex flex-col gap-4 border-b border-white/[0.07] sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-medium text-zinc-100">
                    <History className="size-4 text-blue-400" />
                    Historial reciente
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Hasta 100 movimientos, del más reciente al más antiguo.
                  </p>
                </div>
                <div className="w-full space-y-1.5 sm:w-64">
                  <Label htmlFor="filtroProducto" className="text-xs">
                    Filtrar por producto
                  </Label>
                  <select
                    id="filtroProducto"
                    value={filtroProductoId}
                    onChange={(event) => setFiltroProductoId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/10 bg-[#0c0e13] px-3 text-sm text-zinc-100 outline-none focus-visible:border-blue-400/70 focus-visible:ring-2 focus-visible:ring-blue-400/15"
                  >
                    <option value="">Todos los productos</option>
                    {productos.map((producto) => (
                      <option key={producto._id} value={producto._id}>
                        {producto.sku} — {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>

              {movimientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                    <History className="size-5 text-zinc-500" />
                  </span>
                  <h3 className="text-sm font-medium text-zinc-200">
                    No hay movimientos registrados
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                    Las entradas y salidas aparecerán aquí después de registrarlas.
                  </p>
                </div>
              ) : (
                <Table className="min-w-[860px] text-zinc-300">
                  <TableHeader className="bg-black/15 text-[11px] uppercase tracking-wider text-zinc-400">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Anterior</TableHead>
                      <TableHead className="text-right">Resultante</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((movimiento) => (
                      <TableRow
                        key={movimiento._id}
                        className="hover:bg-white/[0.025]"
                      >
                        <TableCell className="whitespace-nowrap text-xs text-zinc-400">
                          {formatoFecha.format(new Date(movimiento.creadoEn))}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-zinc-200">
                            {movimiento.productoNombre}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-blue-300">
                            {movimiento.productoSku}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              movimiento.tipo === "entrada"
                                ? "border border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                                : "border border-amber-400/15 bg-amber-400/10 text-amber-300"
                            }
                          >
                            {movimiento.tipo === "entrada" ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )}
                            {movimiento.tipo === "entrada" ? "Entrada" : "Salida"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {movimiento.cantidad}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-zinc-400">
                          {movimiento.existenciaAnterior}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums text-zinc-100">
                          {movimiento.existenciaResultante}
                        </TableCell>
                        <TableCell className="max-w-56 truncate text-zinc-400">
                          {movimiento.motivo}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
