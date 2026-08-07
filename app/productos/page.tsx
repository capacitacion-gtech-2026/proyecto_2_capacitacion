"use client";

import Link from "next/link";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Loader2,
  Package,
  PackagePlus,
  Plus,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const productoSchema = z.object({
  sku: z.string().trim().min(1, "El SKU es obligatorio."),
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  descripcion: z.string().trim().optional(),
  stockMinimo: z
    .number({ message: "El stock mínimo debe ser un número." })
    .int("El stock mínimo debe ser un entero.")
    .min(0, "El stock mínimo debe ser mayor o igual a cero."),
});

type ProductoFormValues = z.infer<typeof productoSchema>;

function obtenerMensajeError(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }

  return "No se pudo registrar el producto. Verifica los datos e inténtalo nuevamente.";
}

export default function ProductosPage() {
  const productos = useQuery(api.productos.listar);
  const crearProducto = useMutation(api.productos.crear);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      descripcion: "",
      stockMinimo: 0,
    },
  });

  const cambiarEstadoDialogo = (abierto: boolean) => {
    setIsModalOpen(abierto);
    if (abierto) {
      setSubmitError(null);
      clearErrors();
    }
  };

  const onSubmit = async (data: ProductoFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      await crearProducto({
        sku: data.sku,
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        stockMinimo: data.stockMinimo,
      });

      setSubmitSuccess(
        `Producto "${data.nombre.trim()}" (${data.sku.trim()}) registrado exitosamente.`,
      );
      reset();
      setIsModalOpen(false);
    } catch (error: unknown) {
      setSubmitError(obtenerMensajeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const estaCargando = productos === undefined;

  return (
    <Dialog open={isModalOpen} onOpenChange={cambiarEstadoDialogo}>
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
              Productos
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                Catálogo de inventario
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.025em] text-zinc-50">
                Productos
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Consulta existencias y registra nuevos artículos.
              </p>
            </div>
            <DialogTrigger asChild>
              <Button type="button" className="w-full sm:w-auto">
                <Plus />
                Registrar producto
              </Button>
            </DialogTrigger>
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
                  className="-my-2 text-blue-300 hover:bg-blue-400/10 hover:text-blue-200"
                  onClick={() => setSubmitSuccess(null)}
                >
                  <X />
                  <span className="sr-only">Cerrar confirmación</span>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col items-start gap-3 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">
                  Productos registrados
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Ordenados por actualización reciente
                </p>
              </div>
              <span
                aria-live="polite"
                className="shrink-0 rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs tabular-nums text-zinc-400"
              >
                {productos
                  ? productos.length === 1
                    ? "1 mostrado"
                    : `${productos.length} mostrados`
                  : "..."}
              </span>
            </CardHeader>

            {estaCargando ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center"
              >
                <Loader2
                  aria-hidden="true"
                  className="size-6 animate-spin text-blue-400 motion-reduce:animate-none"
                />
                <p className="text-sm text-zinc-400">Cargando productos...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <span className="mb-4 flex size-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                  <Package className="size-5 text-zinc-500" />
                </span>
                <h3 className="text-sm font-medium text-zinc-200">
                  El catálogo está vacío
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                  Registra el primer producto para comenzar a consultar existencias.
                </p>
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => cambiarEstadoDialogo(true)}
                >
                  <Plus />
                  Registrar producto
                </Button>
              </div>
            ) : (
              <Table className="text-left text-zinc-400">
                <TableHeader className="bg-black/15 text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Existencia</TableHead>
                    <TableHead className="text-right">Stock mínimo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto: Doc<"productos">) => (
                    <TableRow key={producto._id} className="hover:bg-white/[0.025]">
                      <TableCell className="font-mono text-xs font-medium text-blue-300">
                        {producto.sku}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-200">
                        {producto.nombre}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-zinc-400">
                        {producto.descripcion || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium tabular-nums text-zinc-200">
                        {producto.existenciaActual}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-zinc-400">
                        {producto.stockMinimo}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            producto.activo
                              ? "border border-blue-400/15 bg-blue-400/10 text-blue-300"
                              : "border border-white/[0.08] bg-white/[0.04] text-zinc-500"
                          }
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </main>

        <DialogContent>
          <div className="border-b border-white/[0.07] px-6 py-5 pr-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="size-5 text-blue-400" />
                Nuevo producto
              </DialogTitle>
              <DialogDescription>
                Registra los datos básicos. La existencia inicial será cero.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            aria-busy={isSubmitting}
            className="space-y-5 px-6 pb-6"
          >
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-blue-400">*</span>
              </Label>
              <Input
                id="sku"
                placeholder="Ej: PROD-001"
                aria-invalid={Boolean(errors.sku)}
                aria-describedby={errors.sku ? "sku-error" : undefined}
                {...register("sku")}
              />
              {errors.sku && (
                <p id="sku-error" role="alert" className="text-xs text-blue-400">
                  {errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre del producto <span className="text-blue-400">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Cable HDMI 2m"
                aria-invalid={Boolean(errors.nombre)}
                aria-describedby={errors.nombre ? "nombre-error" : undefined}
                {...register("nombre")}
              />
              {errors.nombre && (
                <p
                  id="nombre-error"
                  role="alert"
                  className="text-xs text-blue-400"
                >
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                rows={3}
                placeholder="Ej: Cable de alta velocidad 4K"
                {...register("descripcion")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockMinimo">
                Stock mínimo <span className="text-blue-400">*</span>
              </Label>
              <Input
                id="stockMinimo"
                type="number"
                min={0}
                step={1}
                aria-invalid={Boolean(errors.stockMinimo)}
                aria-describedby={
                  errors.stockMinimo
                    ? "stockMinimo-error stockMinimo-ayuda"
                    : "stockMinimo-ayuda"
                }
                {...register("stockMinimo", { valueAsNumber: true })}
              />
              {errors.stockMinimo && (
                <p
                  id="stockMinimo-error"
                  role="alert"
                  className="text-xs text-blue-400"
                >
                  {errors.stockMinimo.message}
                </p>
              )}
              <p id="stockMinimo-ayuda" className="text-xs text-zinc-400">
                La existencia inicial se fija automáticamente en cero.
              </p>
            </div>

            <DialogFooter className="border-t border-white/[0.07] pt-5">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                    />
                    Guardando...
                  </>
                ) : (
                  "Guardar producto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
