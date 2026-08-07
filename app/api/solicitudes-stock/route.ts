import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST(request: NextRequest) {
  if (!convex) {
    return NextResponse.json(
      { error: "ERROR_INTERNO", mensaje: "Error inesperado." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "ARGUMENTOS_INVALIDOS", mensaje: "Argumentos inválidos." },
      { status: 400 }
    );
  }

  const { productoId, cantidadSolicitada, motivo, solicitante, claveIdempotencia } = body || {};

  if (!productoId || typeof productoId !== "string" || !productoId.trim()) {
    return NextResponse.json(
      { error: "ARGUMENTOS_INVALIDOS", mensaje: "El ID del producto es obligatorio." },
      { status: 400 }
    );
  }

  if (typeof cantidadSolicitada !== "number" || !Number.isInteger(cantidadSolicitada) || cantidadSolicitada <= 0) {
    return NextResponse.json(
      { error: "CANTIDAD_INVALIDA", mensaje: "Ingresa una cantidad entera mayor que cero." },
      { status: 400 }
    );
  }

  if (typeof motivo !== "string" || !motivo.trim()) {
    return NextResponse.json(
      { error: "MOTIVO_REQUERIDO", mensaje: "El motivo es obligatorio." },
      { status: 400 }
    );
  }

  if (typeof claveIdempotencia !== "string" || !claveIdempotencia.trim()) {
    return NextResponse.json(
      { error: "ARGUMENTOS_INVALIDOS", mensaje: "La clave de idempotencia es obligatoria." },
      { status: 400 }
    );
  }

  try {
    const res = await convex.mutation(api.solicitudesStock.crear, {
      productoId: productoId as Id<"productos">,
      cantidadSolicitada,
      motivo,
      solicitante: typeof solicitante === "string" ? solicitante : undefined,
      claveIdempotencia,
      origen: "api",
    });

    const status = res.esNueva ? 201 : 200;

    return NextResponse.json(
      {
        resultado: "creada",
        solicitud: res.solicitud,
      },
      { status }
    );
  } catch (error: unknown) {
    const message = error instanceof ConvexError
      ? error.data
      : (error instanceof Error ? error.message : "Error inesperado.");

    const messageStr = typeof message === "string" ? message : JSON.stringify(message);

    if (messageStr.includes("El producto no está disponible") || messageStr.includes("PRODUCTO_NO_ENCONTRADO")) {
      return NextResponse.json(
        { error: "PRODUCTO_NO_ENCONTRADO", mensaje: "El producto no está disponible." },
        { status: 404 }
      );
    }

    if (messageStr.includes("No se pueden registrar solicitudes para este producto") || messageStr.includes("PRODUCTO_INACTIVO")) {
      return NextResponse.json(
        { error: "PRODUCTO_INACTIVO", mensaje: "No se pueden registrar solicitudes para este producto." },
        { status: 400 }
      );
    }

    if (messageStr.includes("ya fue utilizada con datos diferentes") || messageStr.includes("CLAVE_REUTILIZADA")) {
      return NextResponse.json(
        { error: "CLAVE_REUTILIZADA", mensaje: "La clave de idempotencia ya fue utilizada con datos diferentes." },
        { status: 409 }
      );
    }

    if (messageStr.includes("Ingresa una cantidad entera") || messageStr.includes("CANTIDAD_INVALIDA")) {
      return NextResponse.json(
        { error: "CANTIDAD_INVALIDA", mensaje: "Ingresa una cantidad entera mayor que cero." },
        { status: 400 }
      );
    }

    if (messageStr.includes("El motivo es obligatorio") || messageStr.includes("MOTIVO_REQUERIDO")) {
      return NextResponse.json(
        { error: "MOTIVO_REQUERIDO", mensaje: "El motivo es obligatorio." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "ERROR_INTERNO", mensaje: "Error inesperado." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!convex) {
    return NextResponse.json(
      { error: "ERROR_INTERNO", mensaje: "Error inesperado." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  const estadosValidos = ["pendiente", "aprobada", "rechazada", "rechazada_sin_stock"];
  if (estado && !estadosValidos.includes(estado)) {
    return NextResponse.json(
      { error: "ESTADO_INVALIDO", mensaje: "El estado proporcionado no es válido." },
      { status: 400 }
    );
  }

  try {
    const solicitudes = await convex.query(api.solicitudesStock.listar, {
      estado: estado ? (estado as "pendiente" | "aprobada" | "rechazada" | "rechazada_sin_stock") : undefined,
    });

    return NextResponse.json(solicitudes, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "ERROR_INTERNO", mensaje: "Error inesperado." },
      { status: 500 }
    );
  }
}
