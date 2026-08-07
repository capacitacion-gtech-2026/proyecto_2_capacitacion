"use client";

import Link from "next/link";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  AlertCircle,
  ArrowLeft,
  BellRing,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Loader2,
  ShieldCheck,
  X,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FiltroAlerta = "activa" | "resuelta" | "todas";

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

const filtros: Array<{ valor: FiltroAlerta; etiqueta: string }> = [
  { valor: "activa", etiqueta: "Activas" },
  { valor: "resuelta", etiqueta: "Resueltas" },
  { valor: "todas", etiqueta: "Todas" },
];

function obtenerMensajeError(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }

  return "No se pudo resolver la alerta. Inténtalo nuevamente.";
}

function EstadoAlerta({ estado }: { estado: "activa" | "resuelta" }) {
  return (
    <Badge
      className={
        estado === "activa"
          ? "border border-blue-300/20 bg-blue-300/10 text-blue-200"
          : "border border-blue-400/20 bg-blue-400/10 text-blue-300"
      }
    >
      {estado === "activa" ? (
        <CircleAlert className="mr-1 size-3" />
      ) : (
        <ShieldCheck className="mr-1 size-3" />
      )}
      {estado === "activa" ? "Activa" : "Resuelta"}
    </Badge>
  );
}

export default function AlertasPage() {
  const [filtro, setFiltro] = useState<FiltroAlerta>("activa");
  const [alertaSeleccionadaId, setAlertaSeleccionadaId] =
    useState<Id<"alertasInventario"> | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const alertas = useQuery(
    api.alertasInventario.listar,
    filtro === "todas" ? {} : { estado: filtro },
  );
  const resolverManual = useMutation(api.alertasInventario.resolverManual);
  const alertaSeleccionada = alertas?.find(
    (alerta) => alerta._id === alertaSeleccionadaId,
  );

  const abrirConfirmacion = (alertaId: Id<"alertasInventario">) => {
    setMutationError(null);
    setAlertaSeleccionadaId(alertaId);
  };

  const cerrarConfirmacion = () => {
    if (!isResolving) {
      setAlertaSeleccionadaId(null);
      setMutationError(null);
    }
  };

  const confirmarResolucion = async () => {
    if (!alertaSeleccionadaId || !alertaSeleccionada) {
      return;
    }

    setMutationError(null);
    setIsResolving(true);

    try {
      await resolverManual({ alertaId: alertaSeleccionadaId });
      setSuccessMessage(
        `La alerta de ${alertaSeleccionada.productoNombre} se resolvió manualmente.`,
      );
      setAlertaSeleccionadaId(null);
    } catch (error: unknown) {
      setMutationError(obtenerMensajeError(error));
    } finally {
      setIsResolving(false);
    }
  };

  const mensajeVacio =
    filtro === "activa"
      ? "No hay alertas activas"
      : filtro === "resuelta"
        ? "No hay alertas resueltas"
        : "No hay alertas registradas";

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
            <span className="size-1.5 rounded-full bg-blue-400" />
            Alertas
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Seguimiento de inventario
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.025em] text-zinc-50">
              Alertas de stock
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Consulta productos en nivel mínimo y conserva el historial de
              resoluciones.
            </p>
          </div>
          <Link
            href="/movimientos"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            <ArrowLeft className="size-4" />
            Ver movimientos
          </Link>
        </div>

        {successMessage && (
          <Alert variant="success" className="mb-6">
            <CheckCircle2 />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{successMessage}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-my-2 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200"
                onClick={() => setSuccessMessage(null)}
              >
                <X />
                <span className="sr-only">Cerrar confirmación</span>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b border-white/[0.07] md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-medium text-zinc-100">
                <BellRing className="size-4 text-blue-400" />
                Alertas registradas
              </h2>
              <p className="mt-1 text-sm text-zinc-400" aria-live="polite">
                {alertas === undefined
                  ? "Consultando alertas..."
                  : `${alertas.length} ${alertas.length === 1 ? "resultado" : "resultados"} en este filtro.`}
              </p>
            </div>

            <div
              role="group"
              aria-label="Filtrar alertas por estado"
              className="grid w-full grid-cols-3 rounded-lg border border-white/[0.08] bg-black/20 p-1 md:w-auto"
            >
              {filtros.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  disabled={alertas === undefined}
                  aria-pressed={filtro === opcion.valor}
                  onClick={() => setFiltro(opcion.valor)}
                  className="h-9 rounded-md px-3 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 disabled:cursor-wait disabled:opacity-50 aria-pressed:bg-white/[0.08] aria-pressed:text-zinc-100"
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
          </CardHeader>

          {alertas === undefined ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center"
            >
              <Loader2 className="size-6 animate-spin text-blue-400 motion-reduce:animate-none" />
              <p className="text-sm text-zinc-400">Cargando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <span className="mb-4 flex size-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <ShieldCheck className="size-5 text-zinc-500" />
              </span>
              <h3 className="text-sm font-medium text-zinc-200">
                {mensajeVacio}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                {filtro === "activa"
                  ? "No hay productos pendientes de atención por alerta."
                  : "Los avisos de este estado aparecerán aquí cuando existan."}
              </p>
            </CardContent>
          ) : (
            <>
              <div className="hidden md:block">
                <Table className="min-w-[980px] text-zinc-300">
                  <TableHeader className="bg-black/15 text-[11px] uppercase tracking-wider text-zinc-400">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Existencia actual</TableHead>
                      <TableHead className="text-right">Stock mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creación</TableHead>
                      <TableHead>Resolución</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertas.map((alerta) => {
                      const sigueEnStockBajo =
                        alerta.existenciaActual <= alerta.stockMinimoActual;

                      return (
                        <TableRow key={alerta._id} className="hover:bg-white/[0.025]">
                          <TableCell>
                            <p className="font-medium text-zinc-200">
                              {alerta.productoNombre}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-blue-300">
                              {alerta.productoSku}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-mono font-semibold tabular-nums text-zinc-100">
                              {alerta.existenciaActual}
                            </p>
                            <p
                              className={
                                sigueEnStockBajo
                                  ? "mt-1 text-xs text-blue-300"
                                  : "mt-1 text-xs text-blue-400"
                              }
                            >
                              {sigueEnStockBajo ? "Stock bajo" : "Nivel recuperado"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-zinc-300">
                            {alerta.stockMinimoActual}
                          </TableCell>
                          <TableCell>
                            <EstadoAlerta estado={alerta.estado} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-zinc-400">
                            {formatoFecha.format(new Date(alerta.creadoEn))}
                            <p className="mt-1 text-[11px] text-zinc-500">
                              Detectada con {alerta.existenciaAlGenerarse} / mínimo {alerta.stockMinimo}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {alerta.resueltoEn ? (
                              <>
                                <p>
                                  {alerta.formaResolucion === "manual"
                                    ? "Manual"
                                    : "Automática"}
                                </p>
                                <p className="mt-1 whitespace-nowrap text-[11px] text-zinc-500">
                                  {formatoFecha.format(new Date(alerta.resueltoEn))}
                                </p>
                              </>
                            ) : (
                              "Pendiente"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {alerta.estado === "activa" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => abrirConfirmacion(alerta._id)}
                              >
                                Resolver
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {alertas.map((alerta) => {
                  const sigueEnStockBajo =
                    alerta.existenciaActual <= alerta.stockMinimoActual;

                  return (
                    <article
                      key={alerta._id}
                      className="rounded-xl border border-white/[0.08] bg-black/15 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-zinc-100">
                            {alerta.productoNombre}
                          </h3>
                          <p className="mt-1 break-all font-mono text-xs text-blue-300">
                            {alerta.productoSku}
                          </p>
                        </div>
                        <EstadoAlerta estado={alerta.estado} />
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-white/[0.06] bg-black/15 p-3">
                        <div>
                          <dt className="text-xs text-zinc-500">Existencia actual</dt>
                          <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-100">
                            {alerta.existenciaActual}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-zinc-500">Stock mínimo</dt>
                          <dd className="mt-1 font-mono text-lg tabular-nums text-zinc-200">
                            {alerta.stockMinimoActual}
                          </dd>
                        </div>
                      </dl>

                      <p
                        className={
                          sigueEnStockBajo
                            ? "mt-3 text-xs font-medium text-blue-300"
                            : "mt-3 text-xs font-medium text-blue-400"
                        }
                      >
                        {sigueEnStockBajo
                          ? "El producto continúa en stock bajo."
                          : "El producto recuperó su nivel de existencia."}
                      </p>

                      <div className="mt-4 space-y-1 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
                        <p>Creada: {formatoFecha.format(new Date(alerta.creadoEn))}</p>
                        <p>
                          Detectada con {alerta.existenciaAlGenerarse} unidades;
                          mínimo {alerta.stockMinimo}.
                        </p>
                        {alerta.resueltoEn && (
                          <p>
                            Resolución {alerta.formaResolucion === "manual" ? "manual" : "automática"}: {formatoFecha.format(new Date(alerta.resueltoEn))}
                          </p>
                        )}
                      </div>

                      {alerta.estado === "activa" && (
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4 w-full"
                          onClick={() => abrirConfirmacion(alerta._id)}
                        >
                          Resolver alerta
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </main>

      <Dialog
        open={alertaSeleccionadaId !== null}
        onOpenChange={(open) => {
          if (!open) cerrarConfirmacion();
        }}
      >
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Resolver alerta manualmente</DialogTitle>
            <DialogDescription>
              Resolver esta alerta no modifica la existencia del producto.
            </DialogDescription>
          </DialogHeader>

          {alertaSeleccionada && (
            <div className="rounded-lg border border-white/[0.08] bg-black/15 p-4">
              <p className="text-sm font-medium text-zinc-100">
                {alertaSeleccionada.productoNombre}
              </p>
              <p className="mt-1 font-mono text-xs text-blue-300">
                {alertaSeleccionada.productoSku}
              </p>
              <p className="mt-3 text-sm text-zinc-400">
                Existencia actual: {alertaSeleccionada.existenciaActual}. Stock
                mínimo: {alertaSeleccionada.stockMinimoActual}.
              </p>
            </div>
          )}

          {mutationError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isResolving}
              onClick={cerrarConfirmacion}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isResolving || !alertaSeleccionada}
              onClick={confirmarResolucion}
            >
              {isResolving ? (
                <>
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                  Resolviendo...
                </>
              ) : (
                "Confirmar resolución"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
