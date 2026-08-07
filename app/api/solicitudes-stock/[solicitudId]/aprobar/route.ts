import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  if (!convex) {
    return NextResponse.json(
      { error: "ERROR_INTERNO", mensaje: "Error inesperado." },
      { status: 500 }
    );
  }

  const { solicitudId } = await params;

  if (!solicitudId || typeof solicitudId !== "string" || !solicitudId.trim()) {
    return NextResponse.json(
      { error: "SOLICITUD_NO_ENCONTRADA", mensaje: "La solicitud no existe." },
      { status: 404 }
    );
  }

  try {
    const res = await convex.mutation(api.solicitudesStock.aprobar, {
      solicitudId: solicitudId as Id<"solicitudesStock">,
    });

    return NextResponse.json(res, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof ConvexError
      ? error.data
      : (error instanceof Error ? error.message : "Error inesperado.");

    const messageStr = typeof message === "string" ? message : JSON.stringify(message);

    if (messageStr.includes("La solicitud no existe") || messageStr.includes("SOLICITUD_NO_ENCONTRADA")) {
      return NextResponse.json(
        { error: "SOLICITUD_NO_ENCONTRADA", mensaje: "La solicitud no existe." },
        { status: 404 }
      );
    }

    if (messageStr.includes("ya fue resuelta") || messageStr.includes("SOLICITUD_YA_RESUELTA")) {
      return NextResponse.json(
        { error: "SOLICITUD_YA_RESUELTA", mensaje: "La solicitud ya fue resuelta." },
        { status: 409 }
      );
    }

    if (messageStr.includes("producto no está disponible") || messageStr.includes("PRODUCTO_NO_ENCONTRADO")) {
      return NextResponse.json(
        { error: "PRODUCTO_NO_ENCONTRADO", mensaje: "El producto no está disponible." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "ERROR_INTERNO", mensaje: "Error inesperado." },
      { status: 500 }
    );
  }
}
