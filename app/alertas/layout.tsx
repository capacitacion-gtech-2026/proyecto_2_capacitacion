import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alertas | Sistema de Gestión de Inventario",
  description: "Consulta y resuelve alertas de stock bajo.",
};

export default function AlertasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
