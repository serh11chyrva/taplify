import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function ButtonGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "inline-flex",
        "[&>[data-slot=button]:not(:first-child)]:-ms-px",
        "[&>[data-slot=button]:not(:first-child)]:rounded-s-none",
        "[&>[data-slot=button]:not(:last-child)]:rounded-e-none",
        "[&>[data-slot=button]:focus-visible]:z-10",
        className,
      )}
      {...props}
    />
  );
}
