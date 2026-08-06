import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movimientos | Sistema de Gestión de Inventario",
  description: "Registra entradas y salidas y consulta su historial.",
};

export default function MovimientosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
