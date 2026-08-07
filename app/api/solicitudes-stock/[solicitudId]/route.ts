import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function GET(
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
    const solicitud = await convex.query(api.solicitudesStock.obtener, {
      solicitudId: solicitudId as Id<"solicitudesStock">,
    });

    if (!solicitud) {
      return NextResponse.json(
        { error: "SOLICITUD_NO_ENCONTRADA", mensaje: "La solicitud no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(solicitud, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "SOLICITUD_NO_ENCONTRADA", mensaje: "La solicitud no existe." },
      { status: 404 }
    );
  }
}
