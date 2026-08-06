"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  if (!convex) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b10] p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <h1 className="text-xl font-semibold text-zinc-100">
              Convex necesita configuración
            </h1>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>
                Define <code>NEXT_PUBLIC_CONVEX_URL</code> en el archivo
                <code> .env.local</code> y reinicia el servidor de desarrollo.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
