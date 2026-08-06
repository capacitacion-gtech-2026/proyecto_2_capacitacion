import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos | Sistema de Gestión de Inventario",
  description: "Consulta y registra productos del inventario.",
};

export default function ProductosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
