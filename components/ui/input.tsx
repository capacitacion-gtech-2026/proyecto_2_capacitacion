import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3.5 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-400 hover:border-white/15 focus-visible:border-blue-400/70 focus-visible:ring-2 focus-visible:ring-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-rose-400/70 aria-invalid:ring-2 aria-invalid:ring-rose-400/15",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
