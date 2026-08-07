"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SolicitudesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b10] p-6 text-zinc-100">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-white/[0.07] p-5">
          <span className="flex size-9 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <AlertCircle className="size-5" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-zinc-100">
              Error en el módulo de solicitudes
            </h1>
            <p className="text-xs text-zinc-400">
              Ocurrió un error inesperado al cargar la página.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-6 text-sm text-zinc-400">
            {error.message || "No se pudo completar la operación."}
          </p>
          <Button onClick={() => reset()} className="w-full">
            <RotateCcw className="mr-2 size-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
