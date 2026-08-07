"use client";

import Link from "next/link";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Globe,
  Loader2,
  Package,
  Send,
  X,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const solicitudSchema = z.object({
  productoId: z.string().min(1, "Selecciona un producto."),
  cantidadSolicitada: z
    .number({ message: "La cantidad solicitada debe ser un número." })
    .int("La cantidad solicitada debe ser un entero.")
    .min(1, "La cantidad debe ser mayor que cero."),
  motivo: z.string().trim().min(1, "El motivo es obligatorio."),
  solicitante: z.string().trim().optional(),
});

type SolicitudFormValues = z.infer<typeof solicitudSchema>;

type FiltroEstado =
  | "todas"
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "rechazada_sin_stock";

const FORM_DEFAULTS: SolicitudFormValues = {
  productoId: "",
  cantidadSolicitada: 1,
  motivo: "",
  solicitante: "",
};

const filtros: Array<{ valor: FiltroEstado; etiqueta: string }> = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "aprobada", etiqueta: "Aprobadas" },
  { valor: "rechazada", etiqueta: "Rechazadas" },
  { valor: "rechazada_sin_stock", etiqueta: "Rechazadas sin stock" },
];

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function obtenerMensajeError(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }

  return "No se pudo completar la operación. Inténtalo nuevamente.";
}

function BadgeEstado({ estado }: { estado: Doc<"solicitudesStock">["estado"] }) {
  switch (estado) {
    case "pendiente":
      return (
        <Badge className="border border-amber-400/20 bg-amber-400/10 text-amber-300">
          <Clock className="mr-1 size-3" />
          Pendiente
        </Badge>
      );
    case "aprobada":
      return (
        <Badge className="border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
          <CheckCircle className="mr-1 size-3" />
          Aprobada
        </Badge>
      );
    case "rechazada":
      return (
        <Badge className="border border-rose-400/20 bg-rose-400/10 text-rose-300">
          <XCircle className="mr-1 size-3" />
          Rechazada
        </Badge>
      );
    case "rechazada_sin_stock":
      return (
        <Badge className="border border-orange-400/20 bg-orange-400/10 text-orange-300">
          <AlertTriangle className="mr-1 size-3" />
          Rechazada sin stock
        </Badge>
      );
  }
}

function BadgeOrigen({ origen }: { origen: Doc<"solicitudesStock">["origen"] }) {
  if (origen === "api") {
    return (
      <Badge className="border border-purple-400/20 bg-purple-400/10 text-purple-300">
        <Globe className="mr-1 size-3" />
        API
      </Badge>
    );
  }

  return (
    <Badge className="border border-blue-400/20 bg-blue-400/10 text-blue-300">
      <Boxes className="mr-1 size-3" />
      Interfaz
    </Badge>
  );
}

export default function SolicitudesPage() {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claveIdempotencia, setClaveIdempotencia] = useState(() =>
    crypto.randomUUID()
  );

  const [solicitudAprobar, setSolicitudAprobar] =
    useState<Doc<"solicitudesStock"> | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [aprobarError, setAprobarError] = useState<string | null>(null);

  const [solicitudRechazar, setSolicitudRechazar] =
    useState<Doc<"solicitudesStock"> | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rechazarError, setRechazarError] = useState<string | null>(null);

  const productos = useQuery(api.productos.listar);
  const solicitudes = useQuery(
    api.solicitudesStock.listar,
    filtroEstado === "todas" ? {} : { estado: filtroEstado }
  );
  const crearSolicitud = useMutation(api.solicitudesStock.crear);
  const aprobarSolicitud = useMutation(api.solicitudesStock.aprobar);
  const rechazarSolicitud = useMutation(api.solicitudesStock.rechazar);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SolicitudFormValues>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const productoSeleccionadoId = useWatch({
    control,
    name: "productoId",
  });

  const productosActivos =
    productos?.filter((producto) => producto.activo) ?? [];
  const productoSeleccionado = productos?.find(
    (producto) => producto._id === productoSeleccionadoId
  );
  const estaCargando = productos === undefined || solicitudes === undefined;

  const manejarCambioFormulario = () => {
    if (submitError) {
      setSubmitError(null);
    }
    setClaveIdempotencia(crypto.randomUUID());
  };

  const onSubmit = async (data: SolicitudFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await crearSolicitud({
        productoId: data.productoId as Id<"productos">,
        cantidadSolicitada: data.cantidadSolicitada,
        motivo: data.motivo,
        solicitante: data.solicitante || undefined,
        claveIdempotencia,
        origen: "interfaz",
      });

      const productoNombre =
        productos?.find((p) => p._id === res.solicitud.productoId)?.nombre ??
        "el producto";

      setSubmitSuccess(
        `Solicitud creada exitosamente para ${productoNombre} (Cantidad: ${res.solicitud.cantidadSolicitada}). Existencia al solicitar: ${res.solicitud.existenciaAlSolicitar} (${res.solicitud.disponibleAlSolicitar ? "Suficiente" : "Insuficiente"}).`
      );

      reset(FORM_DEFAULTS);
      setClaveIdempotencia(crypto.randomUUID());
    } catch (error: unknown) {
      setSubmitError(obtenerMensajeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmarAprobacion = async () => {
    if (!solicitudAprobar) return;
    setAprobarError(null);
    setIsApproving(true);

    try {
      const res = await aprobarSolicitud({
        solicitudId: solicitudAprobar._id,
      });

      const productoNombre =
        productos?.find((p) => p._id === solicitudAprobar.productoId)?.nombre ??
        "el producto";

      if (res.resultado === "aprobada") {
        setSubmitSuccess(
          `Solicitud aprobada exitosamente para ${productoNombre}. Movimiento de salida registrado.`
        );
      } else {
        setSubmitSuccess(
          `Solicitud rechazada automáticamente por stock insuficiente para ${productoNombre}. ${res.mensaje}`
        );
      }
      setSolicitudAprobar(null);
    } catch (error: unknown) {
      setAprobarError(obtenerMensajeError(error));
    } finally {
      setIsApproving(false);
    }
  };

  const confirmarRechazo = async () => {
    if (!solicitudRechazar) return;
    if (!motivoRechazoInput.trim()) {
      setRechazarError("El motivo del rechazo es obligatorio.");
      return;
    }

    setRechazarError(null);
    setIsRejecting(true);

    try {
      await rechazarSolicitud({
        solicitudId: solicitudRechazar._id,
        motivoRechazo: motivoRechazoInput.trim(),
      });

      const productoNombre =
        productos?.find((p) => p._id === solicitudRechazar.productoId)?.nombre ??
        "el producto";

      setSubmitSuccess(
        `Solicitud de ${productoNombre} rechazada manualmente.`
      );

      setSolicitudRechazar(null);
      setMotivoRechazoInput("");
    } catch (error: unknown) {
      setRechazarError(obtenerMensajeError(error));
    } finally {
      setIsRejecting(false);
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
            <span className="size-1.5 rounded-full bg-purple-400" />
            Solicitudes de stock
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Control de salidas
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.025em] text-zinc-50">
              Solicitudes de stock
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Crea peticiones de salida, consúltalas y aprueba o rechaza solicitudes pendientes.
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
                Cargando productos y solicitudes de stock...
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
                Registra al menos un producto antes de crear solicitudes de stock.
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
                <h2 className="flex items-center gap-2 text-base font-medium text-zinc-100">
                  <ClipboardList className="size-4 text-purple-400" />
                  Nueva solicitud
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Una solicitud pendiente no reserva ni descuenta stock.
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {productosActivos.length === 0 && (
                  <Alert variant="destructive" className="mb-5">
                    <AlertCircle />
                    <AlertDescription>
                      No hay productos activos disponibles para crear solicitudes.
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
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-400">Existencia actual</p>
                        <Badge className="border border-white/[0.08] bg-white/[0.04] text-[10px] text-zinc-400">
                          Informativa
                        </Badge>
                      </div>
                      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-100">
                        {productoSeleccionado.existenciaActual}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        No representa una reserva de stock.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="cantidadSolicitada">
                      Cantidad solicitada <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="cantidadSolicitada"
                      type="number"
                      min={1}
                      step={1}
                      aria-invalid={Boolean(errors.cantidadSolicitada)}
                      aria-describedby={
                        errors.cantidadSolicitada
                          ? "cantidadSolicitada-error"
                          : undefined
                      }
                      {...register("cantidadSolicitada", {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.cantidadSolicitada && (
                      <p
                        id="cantidadSolicitada-error"
                        role="alert"
                        className="text-xs text-rose-400"
                      >
                        {errors.cantidadSolicitada.message}
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
                      placeholder="Ej: Salida requerida para pedido de cliente"
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

                  <div className="space-y-2">
                    <Label htmlFor="solicitante">Solicitante (opcional)</Label>
                    <Input
                      id="solicitante"
                      placeholder="Ej: Juan Pérez"
                      {...register("solicitante")}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500"
                    disabled={isSubmitting || productosActivos.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="animate-spin motion-reduce:animate-none"
                        />
                        Creando solicitud...
                      </>
                    ) : (
                      <>
                        <Send />
                        Crear solicitud
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="flex flex-col gap-4 border-b border-white/[0.07] md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-medium text-zinc-100">
                    <ClipboardList className="size-4 text-purple-400" />
                    Solicitudes registradas
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400" aria-live="polite">
                    {solicitudes === undefined
                      ? "Consultando solicitudes..."
                      : `${solicitudes.length} ${solicitudes.length === 1 ? "solicitud" : "solicitudes"} en este filtro.`}
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Filtrar solicitudes por estado"
                  className="flex flex-wrap gap-1 rounded-lg border border-white/[0.08] bg-black/20 p-1"
                >
                  {filtros.map((opcion) => (
                    <button
                      key={opcion.valor}
                      type="button"
                      disabled={solicitudes === undefined}
                      aria-pressed={filtroEstado === opcion.valor}
                      onClick={() => setFiltroEstado(opcion.valor)}
                      className="h-8 rounded-md px-2.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 disabled:cursor-wait disabled:opacity-50 aria-pressed:bg-white/[0.08] aria-pressed:text-zinc-100"
                    >
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </CardHeader>

              {solicitudes.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                    <ClipboardList className="size-5 text-zinc-500" />
                  </span>
                  <h3 className="text-sm font-medium text-zinc-200">
                    {filtroEstado === "todas"
                      ? "No hay solicitudes registradas"
                      : `No hay solicitudes en estado ${filtroEstado}`}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                    Las solicitudes creadas desde esta interfaz o desde la API aparecerán aquí en tiempo real.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table className="min-w-[950px] text-zinc-300">
                      <TableHeader className="bg-black/15 text-[11px] uppercase tracking-wider text-zinc-400">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead>Motivo / Detalles</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Stock actual</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {solicitudes.map((solicitud) => {
                          const producto = productos?.find(
                            (p) => p._id === solicitud.productoId
                          );
                          const stockActualVigente = producto?.existenciaActual ?? 0;

                          return (
                            <TableRow
                              key={solicitud._id}
                              className="hover:bg-white/[0.025]"
                            >
                              <TableCell className="whitespace-nowrap text-xs text-zinc-400">
                                {formatoFecha.format(new Date(solicitud.creadaEn))}
                              </TableCell>
                              <TableCell>
                                <p className="font-medium text-zinc-200">
                                  {producto?.nombre ?? "Producto no disponible"}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-blue-300">
                                  {producto?.sku ?? "—"}
                                </p>
                              </TableCell>
                              <TableCell className="text-right font-mono text-base font-semibold tabular-nums text-zinc-100">
                                {solicitud.cantidadSolicitada}
                              </TableCell>
                              <TableCell className="max-w-48">
                                <p className="truncate text-xs text-zinc-300">
                                  {solicitud.motivo}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                                  Solicitante: {solicitud.solicitante || "Sin especificar"}
                                </p>
                                {solicitud.motivoRechazo && (
                                  <p className="mt-1 text-xs font-medium text-rose-400">
                                    Rechazo: {solicitud.motivoRechazo}
                                  </p>
                                )}
                                {solicitud.movimientoId && (
                                  <p className="mt-1 font-mono text-[10px] text-emerald-400">
                                    Movimiento: {solicitud.movimientoId}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <BadgeOrigen origen={solicitud.origen} />
                              </TableCell>
                              <TableCell>
                                <BadgeEstado estado={solicitud.estado} />
                              </TableCell>
                              <TableCell className="text-right">
                                <p className="font-mono tabular-nums text-zinc-300">
                                  {stockActualVigente}
                                </p>
                                <p
                                  className={
                                    stockActualVigente >= solicitud.cantidadSolicitada
                                      ? "text-[10px] text-emerald-400"
                                      : "text-[10px] text-rose-400"
                                  }
                                >
                                  {stockActualVigente >= solicitud.cantidadSolicitada
                                    ? "Alcanza hoy"
                                    : "No alcanza hoy"}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                {solicitud.estado === "pendiente" ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-500"
                                      onClick={() => setSolicitudAprobar(solicitud)}
                                    >
                                      Aprobar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2.5 text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                                      onClick={() => {
                                        setSolicitudRechazar(solicitud);
                                        setMotivoRechazoInput("");
                                      }}
                                    >
                                      Rechazar
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-500">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-3 p-4 md:hidden">
                    {solicitudes.map((solicitud) => {
                      const producto = productos?.find(
                        (p) => p._id === solicitud.productoId
                      );
                      const stockActualVigente = producto?.existenciaActual ?? 0;

                      return (
                        <article
                          key={solicitud._id}
                          className="rounded-xl border border-white/[0.08] bg-black/15 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-medium text-zinc-100">
                                {producto?.nombre ?? "Producto no disponible"}
                              </h3>
                              <p className="mt-1 break-all font-mono text-xs text-blue-300">
                                {producto?.sku ?? "—"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <BadgeEstado estado={solicitud.estado} />
                              <BadgeOrigen origen={solicitud.origen} />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                            <span className="text-xs text-zinc-400">
                              Cantidad solicitada:
                            </span>
                            <span className="font-mono text-base font-semibold tabular-nums text-zinc-100">
                              {solicitud.cantidadSolicitada} unidades
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-xs text-zinc-400">
                            <p className="line-clamp-2">
                              <strong className="font-medium text-zinc-300">
                                Motivo:
                              </strong>{" "}
                              {solicitud.motivo}
                            </p>
                            <p>
                              <strong className="font-medium text-zinc-300">
                                Solicitante:
                              </strong>{" "}
                              {solicitud.solicitante || "Sin especificar"}
                            </p>
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-white/[0.06] bg-black/15 p-2.5 text-xs">
                            <div>
                              <dt className="text-[11px] text-zinc-500">
                                Stock al solicitar (Informativo)
                              </dt>
                              <dd className="mt-0.5 font-mono tabular-nums text-zinc-200">
                                {solicitud.existenciaAlSolicitar} (
                                {solicitud.disponibleAlSolicitar
                                  ? "Suficiente"
                                  : "Insuficiente"}
                                )
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-zinc-500">
                                Stock actual vigente
                              </dt>
                              <dd className="mt-0.5 font-mono tabular-nums text-zinc-200">
                                {stockActualVigente} (
                                {stockActualVigente >= solicitud.cantidadSolicitada
                                  ? "Alcanza hoy"
                                  : "No alcanza hoy"}
                                )
                              </dd>
                            </div>
                          </dl>

                          {solicitud.motivoRechazo && (
                            <p className="mt-2 text-xs font-medium text-rose-400">
                              Motivo de rechazo: {solicitud.motivoRechazo}
                            </p>
                          )}

                          {solicitud.existenciaDisponibleAlResolver !== undefined && (
                            <p className="mt-1 text-xs text-zinc-400">
                              Stock al resolver: {solicitud.existenciaDisponibleAlResolver}
                            </p>
                          )}

                          {solicitud.movimientoId && (
                            <p className="mt-1 font-mono text-xs text-emerald-400">
                              Movimiento: {solicitud.movimientoId}
                            </p>
                          )}

                          <p className="mt-3 border-t border-white/[0.06] pt-2 text-[11px] text-zinc-500">
                            Creada: {formatoFecha.format(new Date(solicitud.creadaEn))}
                          </p>

                          {solicitud.estado === "pendiente" && (
                            <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
                              <Button
                                type="button"
                                size="sm"
                                className="flex-1 bg-emerald-600 text-xs hover:bg-emerald-500"
                                onClick={() => setSolicitudAprobar(solicitud)}
                              >
                                Aprobar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                                onClick={() => {
                                  setSolicitudRechazar(solicitud);
                                  setMotivoRechazoInput("");
                                }}
                              >
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </main>

      <Dialog
        open={solicitudAprobar !== null}
        onOpenChange={(open) => {
          if (!open && !isApproving) {
            setSolicitudAprobar(null);
            setAprobarError(null);
          }
        }}
      >
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Aprobar solicitud de stock</DialogTitle>
            <DialogDescription>
              Se comprobará nuevamente la existencia en tiempo real antes de registrar la salida de inventario.
            </DialogDescription>
          </DialogHeader>

          {solicitudAprobar && (
            <div className="rounded-lg border border-white/[0.08] bg-black/15 p-4">
              <p className="text-sm font-medium text-zinc-100">
                {productos?.find((p) => p._id === solicitudAprobar.productoId)?.nombre ??
                  "Producto"}
              </p>
              <p className="mt-1 font-mono text-xs text-blue-300">
                {productos?.find((p) => p._id === solicitudAprobar.productoId)?.sku ?? "—"}
              </p>
              <p className="mt-3 text-sm text-zinc-300">
                Cantidad solicitada:{" "}
                <strong className="text-zinc-100">
                  {solicitudAprobar.cantidadSolicitada} unidades
                </strong>
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Motivo: {solicitudAprobar.motivo}
              </p>
            </div>
          )}

          {aprobarError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{aprobarError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isApproving}
              onClick={() => {
                setSolicitudAprobar(null);
                setAprobarError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500"
              disabled={isApproving || !solicitudAprobar}
              onClick={confirmarAprobacion}
            >
              {isApproving ? (
                <>
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                  Aprobando...
                </>
              ) : (
                "Confirmar aprobación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={solicitudRechazar !== null}
        onOpenChange={(open) => {
          if (!open && !isRejecting) {
            setSolicitudRechazar(null);
            setRechazarError(null);
          }
        }}
      >
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud de stock</DialogTitle>
            <DialogDescription>
              El rechazo manual cancela la solicitud sin realizar movimientos de inventario.
            </DialogDescription>
          </DialogHeader>

          {solicitudRechazar && (
            <div className="rounded-lg border border-white/[0.08] bg-black/15 p-4">
              <p className="text-sm font-medium text-zinc-100">
                {productos?.find((p) => p._id === solicitudRechazar.productoId)?.nombre ??
                  "Producto"}
              </p>
              <p className="mt-1 font-mono text-xs text-blue-300">
                {productos?.find((p) => p._id === solicitudRechazar.productoId)?.sku ?? "—"}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Cantidad solicitada: {solicitudRechazar.cantidadSolicitada} unidades
              </p>
            </div>
          )}

          {rechazarError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{rechazarError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivoRechazoInput">
              Motivo del rechazo <span className="text-rose-400">*</span>
            </Label>
            <Textarea
              id="motivoRechazoInput"
              rows={3}
              placeholder="Ingresa la razón del rechazo manual"
              value={motivoRechazoInput}
              onChange={(e) => setMotivoRechazoInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRejecting}
              onClick={() => {
                setSolicitudRechazar(null);
                setRechazarError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-500"
              disabled={isRejecting || !solicitudRechazar || !motivoRechazoInput.trim()}
              onClick={confirmarRechazo}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                  Rechazando...
                </>
              ) : (
                "Confirmar rechazo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
