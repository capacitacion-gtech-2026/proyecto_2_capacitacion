import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  BellRing,
  Boxes,
  ClipboardList,
  Package,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <Boxes className="size-4 text-blue-400" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Inventario</p>
              <p className="text-[11px] text-zinc-600">Gestión operativa</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Sistema de gestión de inventario
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Selecciona un módulo para comenzar.
          </p>
        </div>

        <nav
          aria-label="Módulos del inventario"
          className="mt-10 max-w-3xl"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
            Módulos
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/productos"
              className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#111318] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Package className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-zinc-200">Productos</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Registra productos y consulta existencias.
                </p>
              </div>
              <ArrowRight className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-200" />
            </Link>

            <Link
              href="/movimientos"
              className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#111318] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <ArrowUpDown className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-zinc-200">Movimientos</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Registra entradas, salidas y consulta el historial.
                </p>
              </div>
              <ArrowRight className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-200" />
            </Link>

            <Link
              href="/alertas"
              className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#111318] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <BellRing className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-zinc-200">Alertas</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Consulta y resuelve avisos de stock bajo.
                </p>
              </div>
              <ArrowRight className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-200" />
            </Link>

            <Link
              href="/solicitudes"
              className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#111318] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <ClipboardList className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-zinc-200">Solicitudes</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Crea y consulta solicitudes de stock en tiempo real.
                </p>
              </div>
              <ArrowRight className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-200" />
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}
