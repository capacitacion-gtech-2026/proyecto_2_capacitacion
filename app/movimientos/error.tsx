"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function MovimientosError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090b10] p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h1 className="text-xl font-semibold text-zinc-100">
            No se pudieron consultar los movimientos
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              Revisa la conexión con Convex e inténtalo nuevamente.
            </AlertDescription>
          </Alert>
          <Button type="button" onClick={retry}>
            <RefreshCw />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
