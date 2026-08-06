import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-1px] [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.04] text-zinc-200",
        destructive:
          "border-rose-500/20 bg-rose-500/10 text-rose-200 [&>svg]:text-rose-400",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 [&>svg]:text-emerald-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription };
